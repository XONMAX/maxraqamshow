import Foundation
import Observation

// MARK: - Domain

enum Tier: String, Codable { case free, pro }
enum ProductID: String, CaseIterable, Codable { case monthly, yearly, lifetime, coins100 = "coins_100", coins500 = "coins_500" }

struct StoreProduct: Identifiable, Hashable {
    let id: ProductID
    let price: String      // store-formatted, localised
    var badge: String? = nil
    var coins: Int? = nil
}

struct Entitlements: Codable {
    var tier: Tier = .free
    var expiresAt: Date? = nil
    var coins: Int = 0
    var unlocked: Set<String> = []
    var boosts: [String: Date] = [:]
}

enum PurchaseResult { case success, cancelled, pending, failed }

/// Single source of truth for pricing rules (mirrors lib/billing.ts PRICING).
enum Pricing {
    static let commission: [Tier: Double] = [.free: 0.05, .pro: 0.02]
    static let unlockCost = 20
    static let boostCost = 50
    static let boostHours = 24.0
    static let promotedSlots = 2
}

// MARK: - Provider adapter (StoreKit 2 / local gateway plug in here)

protocol BillingProvider {
    func products() async throws -> [StoreProduct]
    func purchase(_ id: ProductID) async throws -> PurchaseResult
    func restore() async throws -> Entitlements?
}

/// Demo adapter: resolves instantly, no network.
struct DemoBillingProvider: BillingProvider {
    func products() async throws -> [StoreProduct] {[
        .init(id: .monthly, price: "$4.99"),
        .init(id: .yearly, price: "$35.99", badge: "−40%"),
        .init(id: .lifetime, price: "$89"),
        .init(id: .coins100, price: "$1.99", coins: 100),
        .init(id: .coins500, price: "$7.99", coins: 500),
    ]}
    func purchase(_ id: ProductID) async throws -> PurchaseResult { try await Task.sleep(for: .milliseconds(700)); return .success }
    func restore() async throws -> Entitlements? { nil }
}

/*
 StoreKit 2 adapter sketch (keep in its own file; no UI imports):

 struct StoreKitProvider: BillingProvider {
     func products() async throws -> [StoreProduct] {
         try await Product.products(for: ProductID.allCases.map(\.rawValue)).map {
             StoreProduct(id: ProductID(rawValue: $0.id)!, price: $0.displayPrice)
         }
     }
     func purchase(_ id: ProductID) async throws -> PurchaseResult {
         guard let p = try await Product.products(for: [id.rawValue]).first else { return .failed }
         switch try await p.purchase() {
         case .success(let v): if case .verified(let t) = v { await t.finish(); return .success }; return .failed
         case .userCancelled: return .cancelled
         case .pending: return .pending
         @unknown default: return .failed
         }
     }
     func restore() async throws -> Entitlements? { try await AppStore.sync(); return nil /* rebuild from Transaction.currentEntitlements */ }
 }
*/

// MARK: - View-model (MonetizationViewModel)

enum PaywallReason { case unlock(itemID: String), boost(itemID: String), upgrade, coins }

@Observable
final class BillingManager {
    private(set) var entitlements: Entitlements
    private(set) var products: [StoreProduct] = []
    private(set) var busy = false
    var paywall: PaywallReason? = nil

    private var provider: BillingProvider
    private let store: UserDefaults
    private let key = "nikbozor.billing"

    init(provider: BillingProvider = DemoBillingProvider(), store: UserDefaults = .standard) {
        self.provider = provider
        self.store = store
        entitlements = (try? JSONDecoder().decode(Entitlements.self, from: store.data(forKey: key) ?? Data())) ?? Entitlements()
    }

    /// Swap StoreKit / Play / gateway without touching views.
    func use(_ p: BillingProvider) { provider = p }

    // Derived state read by views
    var isPro: Bool { entitlements.tier == .pro && (entitlements.expiresAt.map { $0 > .now } ?? true) }
    func canSee(_ itemID: String, premium: Bool) -> Bool { !premium || isPro || entitlements.unlocked.contains(itemID) }
    func isBoosted(_ itemID: String) -> Bool { entitlements.boosts[itemID].map { $0 > .now } ?? false }
    func commission(for uzs: Int) -> Int { Int((Double(uzs) * Pricing.commission[isPro ? .pro : .free]!).rounded()) }

    // Intents
    func load() async { products = (try? await provider.products()) ?? [] }

    @discardableResult
    func purchase(_ id: ProductID) async -> PurchaseResult {
        busy = true; defer { busy = false }
        let result = (try? await provider.purchase(id)) ?? .failed
        guard result == .success else { return result }
        if let coins = products.first(where: { $0.id == id })?.coins {
            entitlements.coins += coins
        } else {
            entitlements.tier = .pro
            entitlements.expiresAt = switch id {
                case .monthly: Calendar.current.date(byAdding: .day, value: 30, to: .now)
                case .yearly: Calendar.current.date(byAdding: .day, value: 365, to: .now)
                default: nil
            }
        }
        persist()
        return result
    }

    func unlock(_ itemID: String) -> Bool {
        guard entitlements.coins >= Pricing.unlockCost else { return false }
        entitlements.coins -= Pricing.unlockCost
        entitlements.unlocked.insert(itemID)
        persist(); return true
    }

    func boost(_ itemID: String) -> Bool {
        guard entitlements.coins >= Pricing.boostCost else { return false }
        entitlements.coins -= Pricing.boostCost
        entitlements.boosts[itemID] = .now.addingTimeInterval(Pricing.boostHours * 3600)
        persist(); return true
    }

    func restore() async { if let e = try? await provider.restore() { entitlements = e; persist() } }

    private func persist() { store.set(try? JSONEncoder().encode(entitlements), forKey: key) }
}
