"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useMemo } from "react";
import { DICTS, type Lang } from "./i18n";
import { DEMO_ITEMS } from "./catalog";
import { ESCROW_FEE, STORAGE_KEY, type Deal, type DealStatus, type Item, type SortKey, type TypeFilter, type User, type ViewMode } from "./types";

export { STORAGE_KEY };

interface AppState {
  lang: Lang;
  theme: "dark" | "light";
  saved: string[];
  user: User | null;
  listings: Item[];
  deals: Deal[];
  viewMode: ViewMode;
  sort: SortKey;
  type: TypeFilter;
  category: Record<TypeFilter, string>;

  setLang: (l: Lang) => void;
  toggleTheme: () => void;
  toggleSaved: (id: string) => boolean;
  setUser: (u: User | null) => void;
  addListing: (it: Item) => void;
  createDeal: (it: Item) => Deal;
  setDealStatus: (id: string, s: DealStatus) => void;
  setViewMode: (m: ViewMode) => void;
  setSort: (s: SortKey) => void;
  setType: (t: TypeFilter) => void;
  setCategory: (t: TypeFilter, c: string) => void;
  reset: () => void;
}

const defaults = {
  lang: "uz" as Lang,
  theme: "dark" as const,
  saved: [] as string[],
  user: null,
  listings: [] as Item[],
  deals: [] as Deal[],
  viewMode: "reels" as ViewMode,
  sort: "sequence" as SortKey,
  type: "all" as TypeFilter,
  category: { all: "all", phone: "all", telegram: "all", instagram: "all" } as Record<TypeFilter, string>,
};

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...defaults,
      setLang: (lang) => set({ lang }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
      toggleSaved: (id) => {
        const has = get().saved.includes(id);
        set({ saved: has ? get().saved.filter((x) => x !== id) : [id, ...get().saved] });
        return !has;
      },
      setUser: (user) => set({ user }),
      addListing: (it) => set({ listings: [it, ...get().listings] }),
      createDeal: (item) => {
        const now = new Date().toISOString();
        const fee = Math.round(item.priceUZS * ESCROW_FEE);
        const deal: Deal = {
          id: `D-${Date.now().toString(36).toUpperCase()}`,
          item,
          status: "paid",
          feeUZS: fee,
          totalUZS: item.priceUZS + fee,
          createdAt: now,
          history: { paid: now },
        };
        set({ deals: [deal, ...get().deals] });
        return deal;
      },
      setDealStatus: (id, status) =>
        set({
          deals: get().deals.map((d) =>
            d.id === id ? { ...d, status, history: { ...d.history, [status]: new Date().toISOString() } } : d,
          ),
        }),
      setViewMode: (viewMode) => set({ viewMode }),
      setSort: (sort) => set({ sort }),
      setType: (type) => set({ type }),
      setCategory: (t, c) => set({ category: { ...get().category, [t]: c } }),
      reset: () => set({ ...defaults, lang: get().lang, theme: get().theme }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Rehydrated manually in <Providers> after mount to avoid SSR hydration mismatches.
      skipHydration: true,
      partialize: ({ lang, theme, saved, user, listings, deals, viewMode, sort, type, category }) => ({
        lang, theme, saved, user, listings, deals, viewMode, sort, type, category,
      }),
    },
  ),
);

/* ---------- ephemeral UI state ---------- */

interface UIState {
  sheetId: string | null;
  buyId: string | null;
  toast: { id: number; text: string } | null;
  hydrated: boolean;
  openSheet: (id: string | null) => void;
  openBuy: (id: string | null) => void;
  showToast: (text: string) => void;
}

export const useUI = create<UIState>()((set) => ({
  sheetId: null,
  buyId: null,
  toast: null,
  hydrated: false,
  openSheet: (sheetId) => set({ sheetId }),
  openBuy: (buyId) => set({ buyId }),
  showToast: (text) => set({ toast: { id: Date.now(), text } }),
}));

/* ---------- selectors ---------- */

export const useDict = () => DICTS[useApp((s) => s.lang)];

export function useAllItems() {
  const listings = useApp((s) => s.listings);
  return useMemo(() => [...listings, ...DEMO_ITEMS], [listings]);
}

export function useItem(id: string | null | undefined) {
  const items = useAllItems();
  return useMemo(() => (id ? items.find((i) => i.id === id) ?? null : null), [items, id]);
}
