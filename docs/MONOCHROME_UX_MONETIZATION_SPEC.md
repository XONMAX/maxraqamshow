# NikBozor v2 — Monochrome UI/UX & Monetization Spec

Platform-neutral specification. The web app (`app/`, `components/`) is the reference implementation;
`native/ios` (SwiftUI) and `native/android` (Jetpack Compose) implement the same spec 1:1.

## 1. Design system

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#FFFFFF` | `#000000` | page background |
| `fg` | `#000000` | `#FFFFFF` | text, icons, solid buttons, active states |
| `muted` | `#6B6B6B` | `#8C8C8C` | secondary text |
| `line` | `#E4E4E4` | `#222222` | 1px dividers, inactive borders |
| `line-strong` | `#BDBDBD` | `#3A3A3A` | icon tiles, handles, outline buttons |
| `surface-2` | `#F4F4F4` | `#121212` | pressed state only |

No other colours exist. Item *types* are told apart by icon (Phone / Telegram / Instagram glyph) and label, never by colour.
Status (deal timeline) is encoded by fill: solid = done, outlined + pulse = current, dashed = pending.

Typography: Inter (UI), JetBrains Mono (values, prices, pills). Sizes used: 9.5 (pill), 10/11 (meta), 12/13 (body), 14 (buttons), 16/17 (titles), 22 (sheet value).
Radii: 4px (pills), 6px (icon tiles, chips), 8px (cards, buttons, sheets corners 16px). Borders: 1px only.

Buttons: exactly two — **primary** (fg fill, bg text) and **outline** (1px `line-strong`). Height 44px. Pressed = opacity 0.7.

## 2. Layout & dimensions

### Compact post row (`PostRow`)
```
┌─[28×28 icon]─┬─ value (mono 14/18) ─────────────┬─ $price (mono 13) ─ ♡ ─┐  height 56
│              │ category · [PRO] [DEMO] · ★4.9   │                         │  padding-x 12
└──────────────┴───────────────────────────────────┴─────────────────────────┘  1px divider
```
- Fixed 56px height → virtualized with a constant row size (no measuring).
- Owner rows show a 28px `Boost` outline button left of the price; boosted rows show `[BOOSTED]`.
- Premium rows: the value is blurred (7px) with a compact `Unlock` pill overlaid.

### Single-line product carousel (`ProductRow`)
- One horizontal row, `scroll-snap-type: x mandatory`, gap 8px, side padding 12px, max 24 tiles.
- Tile: **132 × 116**, padding 8px, 1px border. Top: 22px icon tile + pill. Middle: value. Bottom: category · price.
- Edge mask: 24px linear fade on both ends (`mask-image`), so tiles dissolve rather than clip.
- **Promoted slots** = the first `PRICING.promotedSlots` (2) tiles. Order: boosted → sponsored → organic. Promoted tiles get a `fg` border and `[AD]` (sponsored) or `[BOOSTED]` (solid) pill.

### Home composition
```
[ header 48: logo · [PRO] coins · sort ]   sticky
[ type tabs 40 ]                            sticky
[ category chips 40 ]        ┐
[ product row 116 + labels ] │ scrolls
[ "LISTINGS n" label ]       │
[ post rows 56 … ]           ┘ virtualized
[ bottom nav 56 + safe area ]
```

## 3. Motion

Only three primitives are allowed: **fade**, **blur**, and opacity cross-fade. No springs, scale, slides or colour transitions.

| Event | Web | SwiftUI | Compose |
|---|---|---|---|
| Card enters viewport | `data-vis` in → `opacity 1, blur 0` (220ms ease-out) | `.opacity(v).blur(radius: r)` from `GeometryReader` minY | `graphicsLayer{alpha}` + `Modifier.blur()` from `LazyListState` |
| Card at edge (ratio < .6) | `opacity .45, blur 2px` | same, interpolated | same |
| Card leaves (ratio < .15) | `opacity 0, blur 6px` | same | same |
| Tab / category switch | 160ms opacity cross-fade | `.transition(.opacity)` + `.animation(.easeOut(0.16))` | `AnimatedContent(transitionSpec = fadeIn + fadeOut)` |
| Sheet open/close | 220ms translate + backdrop fade | `.sheet` (system) | `ModalBottomSheet` (system) |
| Unlock overlay | fades in over blurred content | `.overlay` + `.transition(.opacity)` | `AnimatedVisibility(fadeIn/fadeOut)` |

Rule: only `opacity` and `filter`/`blur` change per scroll frame; never layout. Reduced motion → opacity only.

## 4. Monetization touchpoints

| Touchpoint | Where | Trigger | State source |
|---|---|---|---|
| **Promoted slots** | first 2 product tiles | sponsored flag (sold placement) or boost | `Item.sponsored`, `Billing.boosts` |
| **Freemium blur-lock** | premium post value, description, product tile value | `!canSee(id, premium)` | `tier`, `unlocked[]` |
| **Contact gate** | seller contact in details | `!isPro` | `tier` |
| **Boost** | owner's rows + details sheet | tap → spends 50 coins / 24h, else paywall(reason: boost) | `coins`, `boosts` |
| **Paywall sheet** | header [PRO], locks, boost, checkout "save" link | `openPaywall({reason})` | `products`, `busy` |
| **Commission** | checkout + details | 5% free / 2% pro | `commissionFor()` |

### Paywall sheet (strict B&W)
Title · one-line reason · [optional: "Unlock for 20 coins · balance"] · radio list:
Monthly / Yearly (−40% pill) / Lifetime ─ divider ─ 100 coins / 500 coins · fee breakdown box (Free 5% vs Pro 2%, "you save X") · primary **Continue** · "Restore purchases" · legal line.
Selected plan = `fg` border; others = `line`. Radio = 16px circle, filled when selected.

### Pricing (single source of truth: `lib/billing.ts` → `PRICING`)
```
commission: free 5%, pro 2%
unlockCost: 20 coins       boostCost: 50 coins / 24h       promotedSlots: 2
```

## 5. Architecture (MVVM, decoupled billing)

```
View (stateless)  →  ViewModel / store  →  BillingProvider (adapter)
PostRow, ProductTile  useBilling() / BillingManager   StoreKit2Provider | PlayBillingProvider | LocalGatewayProvider | DemoProvider
```
- `BillingProvider` has three methods: `products()`, `purchase(id)`, `restore()`.
- `Entitlements` = `{ tier, expiresAt?, coins, unlocked[], boosts{} }` — persisted; the only thing views read.
- Views call intent methods only: `openPaywall`, `purchase`, `unlock(itemId)`, `boost(itemId)`; they never know which store is behind.
- Swapping providers: `setBillingProvider(new StoreKit2Provider())` at app start — zero view changes.

Equivalent files: `lib/billing.ts` (web), `native/ios/BillingManager.swift`, `native/android/BillingManager.kt`.
