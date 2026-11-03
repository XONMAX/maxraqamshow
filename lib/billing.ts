"use client";

/**
 * Decoupled billing layer.
 *
 *   UI  ──▶  useBilling() (MonetizationViewModel)  ──▶  BillingProvider (StoreKit 2 / Play Billing / local gateway)
 *
 * Views never call a provider directly; they read entitlement state and call intent-level
 * actions (purchase, boost, unlock). Swapping the provider does not touch a single view.
 * The same shape is mirrored in native/ios/BillingManager.swift and native/android/BillingManager.kt.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type PlanId = "monthly" | "yearly" | "lifetime";
export type ProductId = PlanId | "coins_100" | "coins_500";
export type Tier = "free" | "pro";

export interface StoreProduct {
  id: ProductId;
  /** Localised, formatted by the store (e.g. "$4.99"). */
  price: string;
  /** Yearly: shows "save 40%". */
  badge?: string;
  coins?: number;
}

export interface Entitlements {
  tier: Tier;
  /** ISO date; undefined for lifetime/free. */
  expiresAt?: string;
  coins: number;
  /** Item ids unlocked individually with coins. */
  unlocked: string[];
  /** Item id -> boost expiry (ISO). */
  boosts: Record<string, string>;
}

export type PurchaseResult = { ok: true } | { ok: false; reason: "cancelled" | "failed" | "pending" };

/** Platform adapter. Implement once per store; keep it free of UI concerns. */
export interface BillingProvider {
  products(): Promise<StoreProduct[]>;
  purchase(id: ProductId): Promise<PurchaseResult>;
  restore(): Promise<Partial<Entitlements>>;
}

/* ---------- pricing rules (single source of truth, also used by native code) ---------- */

export const PRICING = {
  /** Marketplace commission on escrow deals, by tier. */
  commission: { free: 0.05, pro: 0.02 } as Record<Tier, number>,
  /** Coins to unlock one premium listing. */
  unlockCost: 20,
  /** Coins to boost a listing to the front of the row for 24h. */
  boostCost: 50,
  boostHours: 24,
  /** Number of leading product-row slots reserved for sponsored/boosted items. */
  promotedSlots: 2,
} as const;

/* ---------- demo provider: resolves instantly, no network ---------- */

const DEMO_PRODUCTS: StoreProduct[] = [
  { id: "monthly", price: "$4.99" },
  { id: "yearly", price: "$35.99", badge: "−40%" },
  { id: "lifetime", price: "$89" },
  { id: "coins_100", price: "$1.99", coins: 100 },
  { id: "coins_500", price: "$7.99", coins: 500 },
];

export const demoProvider: BillingProvider = {
  products: async () => DEMO_PRODUCTS,
  purchase: () => new Promise((r) => setTimeout(() => r({ ok: true }), 700)),
  restore: async () => ({}),
};

/* ---------- view-model ---------- */

interface BillingState extends Entitlements {
  products: StoreProduct[];
  busy: ProductId | "boost" | "unlock" | null;
  /** Paywall sheet visibility + the reason it was opened (drives copy). */
  paywall: null | { reason: "unlock" | "boost" | "upgrade" | "coins"; itemId?: string };

  isPro: () => boolean;
  canSee: (itemId: string, premium?: boolean) => boolean;
  isBoosted: (itemId: string) => boolean;
  commissionFor: (uzs: number) => number;

  load: () => Promise<void>;
  openPaywall: (p: NonNullable<BillingState["paywall"]>) => void;
  closePaywall: () => void;
  purchase: (id: ProductId) => Promise<PurchaseResult>;
  unlock: (itemId: string) => boolean;
  boost: (itemId: string) => boolean;
  restore: () => Promise<void>;
}

let provider: BillingProvider = demoProvider;
/** Call once at app start to plug in StoreKit / Play Billing / a local gateway. */
export const setBillingProvider = (p: BillingProvider) => (provider = p);

const PLAN_DAYS: Record<PlanId, number | null> = { monthly: 30, yearly: 365, lifetime: null };

export const useBilling = create<BillingState>()(
  persist(
    (set, get) => ({
      tier: "free",
      coins: 0,
      unlocked: [],
      boosts: {},
      products: [],
      busy: null,
      paywall: null,

      isPro: () => {
        const { tier, expiresAt } = get();
        return tier === "pro" && (!expiresAt || new Date(expiresAt) > new Date());
      },
      canSee: (id, premium) => !premium || get().isPro() || get().unlocked.includes(id),
      isBoosted: (id) => {
        const until = get().boosts[id];
        return !!until && new Date(until) > new Date();
      },
      commissionFor: (uzs) => Math.round(uzs * PRICING.commission[get().isPro() ? "pro" : "free"]),

      load: async () => {
        set({ products: await provider.products() });
      },
      openPaywall: (paywall) => set({ paywall }),
      closePaywall: () => set({ paywall: null }),

      purchase: async (id) => {
        set({ busy: id });
        const res = await provider.purchase(id);
        if (res.ok) {
          const product = get().products.find((p) => p.id === id);
          if (product?.coins) set({ coins: get().coins + product.coins });
          else {
            const days = PLAN_DAYS[id as PlanId];
            set({ tier: "pro", expiresAt: days ? new Date(Date.now() + days * 864e5).toISOString() : undefined });
          }
        }
        set({ busy: null });
        return res;
      },

      unlock: (itemId) => {
        const s = get();
        if (s.coins < PRICING.unlockCost) return false;
        set({ coins: s.coins - PRICING.unlockCost, unlocked: [...s.unlocked, itemId] });
        return true;
      },

      boost: (itemId) => {
        const s = get();
        if (s.coins < PRICING.boostCost) return false;
        const until = new Date(Date.now() + PRICING.boostHours * 36e5).toISOString();
        set({ coins: s.coins - PRICING.boostCost, boosts: { ...s.boosts, [itemId]: until } });
        return true;
      },

      restore: async () => {
        set(await provider.restore());
      },
    }),
    {
      name: "nikbozor-billing-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: ({ tier, expiresAt, coins, unlocked, boosts }) => ({ tier, expiresAt, coins, unlocked, boosts }),
    },
  ),
);
