import type { Lang } from "./i18n";

const NBSP = " ";
export const group = (n: number, sep = NBSP) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep);

export function formatUZS(n: number, lang: Lang) {
  if (lang === "en") return `${group(n, ",")} UZS`;
  return `${group(n)} ${lang === "ru" ? "сум" : "soʻm"}`;
}

export const currency = (lang: Lang) => (lang === "en" ? "UZS" : lang === "ru" ? "сум" : "soʻm");

export const formatUSD =(n: number) => `$${group(n, ",")}`;

/** Compact UZS for tight spaces: 98.7 mln / 98.7 млн / 98.7M */
export function formatUZSShort(n: number, lang: Lang) {
  const unit = { uz: ["mlrd", "mln", "ming"], ru: ["млрд", "млн", "тыс"], en: ["B", "M", "K"] }[lang];
  const f = (v: number) => (v >= 100 ? Math.round(v).toString() : v.toFixed(1).replace(/\.0$/, ""));
  const sep = lang === "en" ? "" : " ";
  if (n >= 1e9) return `${f(n / 1e9)}${sep}${unit[0]}`;
  if (n >= 1e6) return `${f(n / 1e6)}${sep}${unit[1]}`;
  return `${f(n / 1e3)}${sep}${unit[2]}`;
}

/** Own month tables: ICU data for uz-Latn is missing in many browsers (renders "M05"). */
const MONTHS: Record<Lang, string[]> = {
  uz: ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"],
  ru: ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};
export const monthName = (m: number, lang: Lang) => MONTHS[lang][((m % 12) + 12) % 12];

export function formatDate(iso: string, lang: Lang, withTime = false) {
  const dt = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${dt.getDate()} ${monthName(dt.getMonth(), lang)}`;
  return withTime ? `${date}, ${pad(dt.getHours())}:${pad(dt.getMinutes())}` : `${date} ${dt.getFullYear()}`;
}

/** Deterministic PRNG so price history / seller stats are stable across renders. */
export function seeded(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function priceHistory(id: string, current: number, points = 8) {
  const rnd = seeded(id);
  const out = [current];
  for (let i = 1; i < points; i++) out.unshift(Math.max(current * 0.4, out[0] * (0.88 + rnd() * 0.2)));
  return out.map((v) => Math.round(v));
}

export function sellerStats(name: string) {
  const rnd = seeded(name);
  return { deals: 12 + Math.floor(rnd() * 240), since: 2019 + Math.floor(rnd() * 6) };
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
