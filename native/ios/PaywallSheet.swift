import SwiftUI

/// Strict black-and-white subscription sheet: Monthly / Yearly / Lifetime / Coins + fee breakdown.
struct PaywallSheet: View {
    @Environment(BillingManager.self) private var billing
    @Environment(\.dismiss) private var dismiss
    @State private var selected: ProductID = .yearly

    private var reasonText: String {
        switch billing.paywall {
        case .unlock: "This listing is premium. Go Pro or unlock it with coins."
        case .boost: "Boosting needs coins. Top up to put your listing first."
        case .coins: "Top up coins for unlocks and boosts."
        default: "Lower fees, full access, no limits."
        }
    }
    private var unlockItem: String? { if case .unlock(let id) = billing.paywall { id } else { nil } }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Capsule().fill(Mono.lineStrong).frame(width: 36, height: 4).frame(maxWidth: .infinity)
            Text("NikBozor Pro").font(.system(size: 17, weight: .bold))
            Text(reasonText).font(.system(size: 13)).foregroundStyle(Mono.muted)

            if let id = unlockItem, !billing.isPro {
                Button {
                    if billing.unlock(id) { dismiss() }
                } label: {
                    HStack {
                        Label("Unlock for \(Pricing.unlockCost) coins", systemImage: "circle.grid.2x1")
                        Spacer()
                        Text("\(billing.entitlements.coins) coins").foregroundStyle(Mono.muted)
                    }
                    .font(.system(size: 13, weight: .semibold)).padding(.horizontal, 16).frame(height: 48)
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Mono.lineStrong, lineWidth: 1))
                }.buttonStyle(.plain)
            }

            VStack(spacing: 8) {
                planRow(.monthly, "Monthly", "/mo")
                planRow(.yearly, "Yearly", "/yr")
                planRow(.lifetime, "Lifetime", "once")
                Divider().overlay(Mono.line).padding(.vertical, 4)
                planRow(.coins100, "100 Coins", "once")
                planRow(.coins500, "500 Coins", "once")
            }

            feeBreakdown

            Button {
                Task {
                    if await billing.purchase(selected) == .success {
                        if let id = unlockItem, !billing.isPro { _ = billing.unlock(id) }
                        dismiss()
                    }
                }
            } label: {
                if billing.busy { ProgressView().tint(Mono.bg) } else { Text("Continue") }
            }
            .buttonStyle(MonoButtonStyle()).disabled(billing.busy)

            Button("Restore purchases") { Task { await billing.restore() } }
                .font(.system(size: 12)).foregroundStyle(Mono.muted).frame(maxWidth: .infinity, minHeight: 40)
            Text("Cancel anytime. Prices in local currency at checkout.")
                .font(.system(size: 11)).foregroundStyle(Mono.muted).frame(maxWidth: .infinity)
        }
        .padding(20)
        .background(Mono.bg)
        .presentationDetents([.large])
        .presentationDragIndicator(.hidden)
        .task { await billing.load() }
        .onAppear { if case .boost = billing.paywall { selected = .coins100 }; if case .coins = billing.paywall { selected = .coins100 } }
    }

    private func planRow(_ id: ProductID, _ label: String, _ suffix: String) -> some View {
        let p = billing.products.first { $0.id == id }
        let active = selected == id
        return Button { selected = id } label: {
            HStack(spacing: 12) {
                Circle().stroke(active ? Mono.fg : Mono.lineStrong, lineWidth: 1).frame(width: 16, height: 16)
                    .overlay { if active { Circle().fill(Mono.fg).frame(width: 16, height: 16).overlay(Image(systemName: "checkmark").font(.system(size: 8, weight: .black)).foregroundStyle(Mono.bg)) } }
                Text(label).font(.system(size: 14, weight: .semibold))
                if let b = p?.badge { Text(b).font(.system(size: 10, design: .monospaced)).padding(.horizontal, 4).overlay(RoundedRectangle(cornerRadius: 4).stroke(Mono.fg, lineWidth: 1)) }
                Spacer()
                Text(p?.price ?? "…").font(.system(size: 14, design: .monospaced))
                Text(suffix).font(.system(size: 11)).foregroundStyle(Mono.muted)
            }
            .padding(.horizontal, 16).frame(height: 56)
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(active ? Mono.fg : Mono.line, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    private var feeBreakdown: some View {
        let sample = 10_000_000
        return VStack(alignment: .leading, spacing: 6) {
            Text("FEE BREAKDOWN").font(.system(size: 11, weight: .semibold)).tracking(1).foregroundStyle(Mono.muted)
            HStack { Text("Free · 5%").foregroundStyle(Mono.muted); Spacer(); Text("\(Int(Double(sample) * 0.05).formatted()) UZS").font(.system(size: 13, design: .monospaced)) }
            HStack { Text("Pro · 2%").fontWeight(.semibold); Spacer(); Text("\(Int(Double(sample) * 0.02).formatted()) UZS").font(.system(size: 13, weight: .semibold, design: .monospaced)) }
            Text("You save \(Int(Double(sample) * 0.03).formatted()) UZS with Pro").font(.system(size: 11)).foregroundStyle(Mono.muted)
        }
        .font(.system(size: 13))
        .padding(12)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Mono.line, lineWidth: 1))
    }
}
