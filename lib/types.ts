export type ItemType = "phone" | "telegram" | "instagram";
export type TypeFilter = ItemType | "all";

export interface Seller {
  name: string;
  rating: number;
  verified: boolean;
  /** Gated behind Pro / unlock. */
  contact?: string;
}

export interface Item {
  id: string;
  type: ItemType;
  value: string;
  category: string;
  priceUZS: number;
  priceUSD: number;
  seller: Seller;
  isDemo: boolean;
  createdAt: string;
  /** Listing published by the current user. */
  mine?: boolean;
  /** Premium listing: details + contact blurred for free users. */
  premium?: boolean;
  /** Paid placement: pinned to the front of the product row with an [AD] pill. */
  sponsored?: boolean;
}

export type SortKey = "sequence" | "priceAsc" | "priceDesc" | "newest";

export const DEAL_STEPS = ["paid", "transferring", "delivered", "confirmed"] as const;
export type DealStatus = (typeof DEAL_STEPS)[number];

export interface Deal {
  id: string;
  item: Item;
  status: DealStatus;
  totalUZS: number;
  feeUZS: number;
  createdAt: string;
  history: Partial<Record<DealStatus, string>>;
}

export interface User {
  id: number | string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  demo?: boolean;
}

export const USD_RATE = 12650; // UZS per USD (demo rate)
export const STORAGE_KEY = "nikbozor-v2";
