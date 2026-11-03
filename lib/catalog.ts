import demo from "@/data/demo.json";
import type { Item, ItemType, SortKey, TypeFilter } from "./types";

export const DEMO_ITEMS = demo as Item[];

export const handle = (it: Pick<Item, "value">) => it.value.replace(/^@/, "").toLowerCase();
export const digitsOf = (v: string) => v.replace(/\D/g, "");
const lettersOnly = (s: string) => /^[a-z]+$/.test(s);

/** Low-price threshold (USD) per type. */
const LOW: Record<ItemType, number> = { phone: 100, telegram: 300, instagram: 300 };

export interface CategoryDef {
  key: string;
  hint?: string; // little example shown inside the chip
  test: (it: Item) => boolean;
}

const all: CategoryDef = { key: "all", test: () => true };
const low: CategoryDef = { key: "low", test: (it) => it.priceUSD <= LOW[it.type] };
const byCat = (key: string, hint?: string): CategoryDef => ({ key, hint, test: (it) => it.category === key });
const len = (key: string, ok: (n: number) => boolean): CategoryDef => ({
  key,
  test: (it) => it.type !== "phone" && lettersOnly(handle(it)) && ok(handle(it).length),
});

export const CATEGORIES: Record<TypeFilter, CategoryDef[]> = {
  phone: [
    all,
    byCat("vip", "7777777"),
    byCat("mirror", "1234321"),
    byCat("sequential", "1234567"),
    byCat("pairs", "11 22 33"),
    low,
  ],
  telegram: [
    all,
    len("len3", (n) => n === 3),
    len("len4", (n) => n === 4),
    len("len5", (n) => n >= 5),
    byCat("words"),
    byCat("names"),
    { key: "digits", test: (it) => /\d/.test(handle(it)) },
    low,
  ],
  instagram: [
    all,
    len("len3", (n) => n === 3),
    len("len4", (n) => n === 4),
    byCat("words"),
    byCat("names"),
    { key: "dots", test: (it) => /[._]/.test(handle(it)) },
    low,
  ],
  all: [all, byCat("vip", "7777777"), len("len3", (n) => n === 3), byCat("words"), byCat("names"), low],
};

export function findCategory(type: TypeFilter, key: string) {
  return CATEGORIES[type].find((c) => c.key === key) ?? CATEGORIES[type][0];
}

/** Strict sequence: numbers ascending by digits; usernames by length, then alphabetically. */
export function compareSequence(a: Item, b: Item) {
  if (a.type === "phone" && b.type === "phone") {
    const da = digitsOf(a.value), db = digitsOf(b.value);
    return da.length - db.length || (da < db ? -1 : da > db ? 1 : 0);
  }
  const ha = handle(a), hb = handle(b);
  return ha.length - hb.length || (ha < hb ? -1 : ha > hb ? 1 : 0);
}

const TYPE_ORDER: ItemType[] = ["phone", "telegram", "instagram"];

export function sortItems(items: Item[], sort: SortKey, type: TypeFilter): Item[] {
  const list = [...items];
  switch (sort) {
    case "priceAsc":
      return list.sort((a, b) => a.priceUSD - b.priceUSD || compareSequence(a, b));
    case "priceDesc":
      return list.sort((a, b) => b.priceUSD - a.priceUSD || compareSequence(a, b));
    case "newest":
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    default: {
      if (type !== "all") return list.sort(compareSequence);
      // "All": each type keeps its own sequence, interleaved round-robin so the feed is mixed.
      const lanes = TYPE_ORDER.map((t) => list.filter((i) => i.type === t).sort(compareSequence));
      const out: Item[] = [];
      for (let i = 0; out.length < list.length; i++) for (const lane of lanes) if (lane[i]) out.push(lane[i]);
      return out;
    }
  }
}

export function queryFeed(items: Item[], type: TypeFilter, category: string, sort: SortKey) {
  const cat = findCategory(type, category);
  const pool = items.filter((i) => (type === "all" || i.type === type) && cat.test(i));
  return sortItems(pool, sort, type);
}

/* ---------- auto-detect category for the Sell flow ---------- */

const NAMES = new Set([
  "aziz", "madina", "sardor", "lola", "bekzod", "nilufar", "dilnoza", "jasur", "kamola", "otabek",
  "zarina", "rustam", "dilshod", "nodira", "shahzod", "malika", "javohir", "sevara", "anvar", "gulnora",
  "timur", "aleksandr", "anna", "maria", "ivan", "olga", "david", "sofia", "alex", "max",
]);

export function detectCategory(type: ItemType, value: string): string {
  if (type === "phone") {
    const d = digitsOf(value).slice(-7);
    if (/^(\d)\1{6}$/.test(d)) return "vip";
    if (d === [...d].reverse().join("")) return "mirror";
    const steps = [...d].slice(1).map((c, i) => Number(c) - Number(d[i]));
    if (steps.every((s) => s === 1) || steps.every((s) => s === -1)) return "sequential";
    if (d[0] === d[1] && d[2] === d[3] && d[4] === d[5]) return "pairs";
    return "standard";
  }
  const h = value.replace(/^@/, "").toLowerCase();
  if (type === "instagram" && /[._]/.test(h)) return "dots";
  if (/\d/.test(h)) return type === "telegram" ? "digits" : "words";
  if (h.length === 3) return "letters3";
  if (NAMES.has(h)) return "names";
  if (h.length === 4) return "letters4";
  return "words";
}
