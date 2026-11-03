import SwiftUI

/// Strict monochrome tokens. Adapts to the system colour scheme (black-on-white / white-on-black).
enum Mono {
    static let bg = Color(light: .white, dark: .black)
    static let fg = Color(light: .black, dark: .white)
    static let muted = Color(light: Color(white: 0.42), dark: Color(white: 0.55))
    static let line = Color(light: Color(white: 0.894), dark: Color(white: 0.133))
    static let lineStrong = Color(light: Color(white: 0.74), dark: Color(white: 0.227))
    static let surface2 = Color(light: Color(white: 0.957), dark: Color(white: 0.07))
}

extension Color {
    init(light: Color, dark: Color) {
        self.init(uiColor: UIColor { $0.userInterfaceStyle == .dark ? UIColor(dark) : UIColor(light) })
    }
}

/// Monochrome pill: `[AD]`, `[PRO]`, `[BOOSTED]`, `[DEMO]`.
struct Pill: View {
    let text: String
    var solid = false
    var body: some View {
        Text(text)
            .font(.system(size: 9.5, weight: .semibold, design: .monospaced))
            .tracking(1)
            .padding(.horizontal, 5)
            .frame(height: 18)
            .foregroundStyle(solid ? Mono.bg : Mono.muted)
            .background(solid ? Mono.fg : .clear, in: RoundedRectangle(cornerRadius: 4))
            .overlay(RoundedRectangle(cornerRadius: 4).stroke(solid ? Mono.fg : Mono.lineStrong, lineWidth: 1))
    }
}

/// The only two button styles in the system.
struct MonoButtonStyle: ButtonStyle {
    var outline = false
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 14, weight: .semibold))
            .frame(maxWidth: .infinity, minHeight: 44)
            .foregroundStyle(outline ? Mono.fg : Mono.bg)
            .background(outline ? .clear : Mono.fg, in: RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(outline ? Mono.lineStrong : Mono.fg, lineWidth: 1))
            .opacity(configuration.isPressed ? 0.7 : 1)
    }
}

/// Type icon tile: 1px border, glyph only. Types are never colour-coded.
struct TypeTile: View {
    let systemImage: String
    var size: CGFloat = 28
    var body: some View {
        Image(systemName: systemImage)
            .font(.system(size: size * 0.5, weight: .medium))
            .frame(width: size, height: size)
            .overlay(RoundedRectangle(cornerRadius: 6).stroke(Mono.lineStrong, lineWidth: 1))
    }
}

// MARK: - Viewport fade + blur (maps to the web `.fade-blur` utility)

/// Fades and blurs a card by how far it sits from the scroll container's visible band.
/// Only `opacity` and `blur` are touched → no layout work, 60fps in List/ScrollView.
struct ViewportFade: ViewModifier {
    let axis: Axis
    @State private var vis: CGFloat = 1

    func body(content: Content) -> some View {
        content
            .opacity(vis)
            .blur(radius: (1 - vis) * 6)
            .background(GeometryReader { geo in
                Color.clear.preference(key: FramePref.self, value: geo.frame(in: .named("feed")))
            })
            .onPreferenceChange(FramePref.self) { frame in
                // Named coordinate space "feed" is the scroll container; its bounds are given via environment.
                let visible = FeedBounds.shared.rect
                let overlap = frame.intersection(visible)
                let ratio = axis == .vertical
                    ? max(0, overlap.height / max(frame.height, 1))
                    : max(0, overlap.width / max(frame.width, 1))
                let target: CGFloat = ratio < 0.15 ? 0 : ratio < 0.6 ? 0.45 : 1
                withAnimation(.easeOut(duration: 0.22)) { vis = target }
            }
    }
}
struct FramePref: PreferenceKey {
    static var defaultValue = CGRect.zero
    static func reduce(value: inout CGRect, nextValue: () -> CGRect) { value = nextValue() }
}
/// Visible bounds of the feed container, published once by the scroll view host.
final class FeedBounds { static let shared = FeedBounds(); var rect = CGRect.zero }

extension View {
    func viewportFade(_ axis: Axis = .vertical) -> some View { modifier(ViewportFade(axis: axis)) }
}

/// Freemium gate: blurred content + "Unlock" trigger fading in on top.
struct LockedBlur<Content: View>: View {
    let locked: Bool
    let compact: Bool
    let onUnlock: () -> Void
    @ViewBuilder let content: () -> Content

    var body: some View {
        content()
            .blur(radius: locked ? 7 : 0)
            .allowsHitTesting(!locked)
            .overlay {
                if locked {
                    Button(action: onUnlock) {
                        Label(compact ? "Unlock" : "Unlock for \(Pricing.unlockCost) coins", systemImage: "lock")
                            .font(.system(size: compact ? 11 : 13, weight: .semibold))
                            .padding(.horizontal, compact ? 8 : 12)
                            .frame(height: compact ? 28 : 36)
                            .background(Mono.bg, in: RoundedRectangle(cornerRadius: 6))
                            .overlay(RoundedRectangle(cornerRadius: 6).stroke(Mono.fg, lineWidth: 1))
                    }
                    .transition(.opacity)
                }
            }
            .animation(.easeOut(duration: 0.2), value: locked)
    }
}
