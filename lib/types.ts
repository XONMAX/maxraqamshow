export type ItemType = "phone" | "telegram" | "instagram";
export type TypeFilter = ItemType | "all";

export interface Seller {
  name: string;
  rating: number;
  verified: boolean;
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
  /** Set on listings the current user published from the Sell flow. */
  mine?: boolean;
}

export type SortKey = "sequence" | "priceAsc" | "priceDesc" | "newest";
export type ViewMode = "reels" | "list";

export const DEAL_STEPS = ["paid", "transferring", "delivered", "confirmed"] as const;
export type DealStatus = (typeof DEAL_STEPS)[number];

export interface Deal {
  id: string;
  item: Item; // snapshot at purchase time
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
export const ESCROW_FEE = 0.03;
export const STORAGE_KEY = "nikbozor-v1";
