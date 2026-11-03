import SwiftUI

// MARK: - Model (UI-facing, immutable)

struct Listing: Identifiable, Hashable {
    enum Kind: String { case phone, telegram, instagram
        var symbol: String { switch self { case .phone: "phone"; case .telegram: "paperplane"; case .instagram: "camera" } }
    }
    let id: String
    let kind: Kind
    let value: String
    let category: String
    let priceUSD: Int
    let priceUZS: Int
    let rating: Double
    var premium = false
    var sponsored = false
    var mine = false
}

// MARK: - Feed view-model: owns ordering; views stay stateless

@Observable
final class FeedViewModel {
    var items: [Listing] = []
    var billing: BillingManager

    init(billing: BillingManager) { self.billing = billing }

    /// Product row: boosted + sponsored first (capped to Pricing.promotedSlots), then organic.
    var productRow: [Listing] {
        let promoted = items.filter { billing.isBoosted($0.id) || $0.sponsored }.prefix(Pricing.promotedSlots)
        let ids = Set(promoted.map(\.id))
        return Array(promoted) + items.filter { !ids.contains($0.id) }.prefix(24)
    }
    func promotion(at index: Int, _ item: Listing) -> String? {
        guard index < Pricing.promotedSlots else { return nil }
        return billing.isBoosted(item.id) ? "BOOSTED" : item.sponsored ? "AD" : nil
    }
}

// MARK: - Compact post row (56pt)

struct PostRow: View {
    let item: Listing
    @Environment(BillingManager.self) private var billing
    var onOpen: () -> Void

    var body: some View {
        let locked = !billing.canSee(item.id, premium: item.premium)
        Button(action: onOpen) {
            HStack(spacing: 12) {
                TypeTile(systemImage: item.kind.symbol, size: 28)
                VStack(alignment: .leading, spacing: 2) {
                    LockedBlur(locked: locked, compact: true, onUnlock: { billing.paywall = .unlock(itemID: item.id) }) {
                        Text(item.value).font(.system(size: 14, weight: .semibold, design: .monospaced)).lineLimit(1)
                    }
                    HStack(spacing: 4) {
                        Text(item.category)
                        if item.premium { Pill(text: "PRO", solid: true) }
                        Text("· ★ \(item.rating, specifier: "%.1f")")
                    }
                    .font(.system(size: 11)).foregroundStyle(Mono.muted)
                }
                Spacer(minLength: 8)
                if item.mine { BoostButton(itemID: item.id) }
                Text("$\(item.priceUSD)").font(.system(size: 13, weight: .semibold, design: .monospaced))
            }
            .padding(.horizontal, 12)
            .frame(height: 56)
            .overlay(alignment: .bottom) { Rectangle().fill(Mono.line).frame(height: 1) }
        }
        .buttonStyle(.plain)
    }
}

struct BoostButton: View {
    let itemID: String
    @Environment(BillingManager.self) private var billing
    var body: some View {
        if billing.isBoosted(itemID) {
            Pill(text: "BOOSTED", solid: true)
        } else {
            Button {
                if !billing.boost(itemID) { billing.paywall = .boost(itemID: itemID) }
            } label: {
                Label("Boost", systemImage: "arrow.up.to.line").font(.system(size: 11, weight: .semibold))
                    .padding(.horizontal, 8).frame(height: 28)
                    .overlay(RoundedRectangle(cornerRadius: 4).stroke(Mono.fg, lineWidth: 1))
            }.buttonStyle(.plain)
        }
    }
}

// MARK: - Product tile (132×116) + single-line carousel

struct ProductTile: View {
    let item: Listing
    let promotion: String?
    @Environment(BillingManager.self) private var billing
    var onOpen: () -> Void

    var body: some View {
        let locked = !billing.canSee(item.id, premium: item.premium)
        Button(action: onOpen) {
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    TypeTile(systemImage: item.kind.symbol, size: 22)
                    Spacer()
                    if let p = promotion { Pill(text: p, solid: p == "BOOSTED") }
                    else if item.premium { Pill(text: "PRO", solid: true) }
                }
                Spacer()
                LockedBlur(locked: locked, compact: true, onUnlock: { billing.paywall = .unlock(itemID: item.id) }) {
                    Text(item.value).font(.system(size: 14, weight: .semibold, design: .monospaced)).lineLimit(1)
                }
                Spacer()
                HStack {
                    Text(item.category).font(.system(size: 10)).foregroundStyle(Mono.muted).lineLimit(1)
                    Spacer()
                    Text("$\(item.priceUSD)").font(.system(size: 12, weight: .semibold, design: .monospaced))
                }
            }
            .padding(8)
            .frame(width: 132, height: 116)
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(promotion == nil ? Mono.line : Mono.fg, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}

struct ProductRow: View {
    let vm: FeedViewModel
    var onOpen: (Listing) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack { Text("PRODUCTS").font(.system(size: 11, weight: .semibold)).tracking(1).foregroundStyle(Mono.muted); Spacer() }
                .padding(.horizontal, 12)
            ScrollView(.horizontal, showsIndicators: false) {
                LazyHStack(spacing: 8) {
                    ForEach(Array(vm.productRow.enumerated()), id: \.element.id) { i, item in
                        ProductTile(item: item, promotion: vm.promotion(at: i, item)) { onOpen(item) }
                            .viewportFade(.horizontal)
                    }
                }
                .padding(.horizontal, 12)
                .scrollTargetLayout()
            }
            .scrollTargetBehavior(.viewAligned)
            .coordinateSpace(name: "feed")
            // progressive edge fade: 24pt mask on both ends
            .mask(LinearGradient(stops: [.init(color: .clear, location: 0), .init(color: .black, location: 0.06),
                                         .init(color: .black, location: 0.94), .init(color: .clear, location: 1)],
                                 startPoint: .leading, endPoint: .trailing))
        }
        .padding(.vertical, 12)
        .overlay(alignment: .bottom) { Rectangle().fill(Mono.line).frame(height: 1) }
    }
}

// MARK: - Home

struct HomeView: View {
    @State var vm: FeedViewModel
    @Environment(BillingManager.self) private var billing
    @State private var selected: Listing?
    @State private var tab = 0

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text("NikBozor").font(.system(size: 15, weight: .bold))
                Spacer()
                Button { billing.paywall = billing.isPro ? .coins : .upgrade } label: {
                    HStack(spacing: 6) { Pill(text: "PRO", solid: billing.isPro); Text("\(billing.entitlements.coins)").font(.system(size: 11, design: .monospaced)).foregroundStyle(Mono.muted) }
                }.buttonStyle(.plain)
            }
            .padding(.horizontal, 12).frame(height: 48)

            ScrollView {
                LazyVStack(spacing: 0, pinnedViews: []) {
                    ProductRow(vm: vm) { selected = $0 }
                    HStack { Text("LISTINGS").font(.system(size: 11, weight: .semibold)).tracking(1).foregroundStyle(Mono.muted); Spacer() }
                        .padding(.horizontal, 12).padding(.top, 12).padding(.bottom, 4)
                    ForEach(vm.items) { item in
                        PostRow(item: item) { selected = item }
                            .viewportFade(.vertical)
                    }
                }
            }
            .coordinateSpace(name: "feed")
            .background(GeometryReader { g in Color.clear.onAppear { FeedBounds.shared.rect = g.frame(in: .named("feed")) } })
            .id(tab) // tab switch → view identity changes → .transition(.opacity)
            .transition(.opacity)
            .animation(.easeOut(duration: 0.16), value: tab)
        }
        .background(Mono.bg)
        .sheet(item: $selected) { ListingDetailSheet(item: $0) }
        .sheet(isPresented: Binding(get: { billing.paywall != nil }, set: { if !$0 { billing.paywall = nil } })) {
            PaywallSheet()
        }
    }
}

/// Details: description + seller contact are blur-locked for non-Pro users.
struct ListingDetailSheet: View {
    let item: Listing
    @Environment(BillingManager.self) private var billing
    var body: some View {
        let locked = !billing.canSee(item.id, premium: item.premium)
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 12) {
                TypeTile(systemImage: item.kind.symbol, size: 36)
                LockedBlur(locked: locked, compact: true, onUnlock: { billing.paywall = .unlock(itemID: item.id) }) {
                    Text(item.value).font(.system(size: 22, weight: .semibold, design: .monospaced))
                }
            }
            Text("\(item.priceUZS.formatted()) UZS").font(.system(size: 22, weight: .semibold, design: .monospaced))
            if item.mine {
                Button { if !billing.boost(item.id) { billing.paywall = .boost(itemID: item.id) } } label: {
                    Label("Boost to front · \(Pricing.boostCost) coins · \(Int(Pricing.boostHours))h", systemImage: "arrow.up.to.line")
                }.buttonStyle(MonoButtonStyle(outline: true))
            }
            Divider().overlay(Mono.line)
            Text("SELLER CONTACT").font(.system(size: 11, weight: .semibold)).tracking(1).foregroundStyle(Mono.muted)
            LockedBlur(locked: !billing.isPro, compact: true, onUnlock: { billing.paywall = .upgrade }) {
                Text("@seller_contact").font(.system(size: 13, design: .monospaced))
            }
            HStack {
                Text(billing.isPro ? "Pro · 2%" : "Free · 5%").foregroundStyle(Mono.muted)
                Spacer()
                Text("\(billing.commission(for: item.priceUZS).formatted()) UZS").font(.system(size: 13, design: .monospaced))
            }.font(.system(size: 13))
            Spacer()
            Button("Buy now") {}.buttonStyle(MonoButtonStyle())
        }
        .padding(20)
        .presentationDetents([.large])
        .presentationBackground(Mono.bg)
    }
}
