// Generates data/demo.json — 60 demo items (20 per type).
// Phone numbers use the fake operator code "00" so no real subscriber is listed.
import { writeFileSync } from "node:fs";

const RATE = 12650; // UZS per USD (demo rate)
const sellers = [
  ["Aziz K.", 4.9, true], ["Madina R.", 5.0, true], ["Sardor T.", 4.7, true],
  ["Nodira X.", 4.8, true], ["Jasur M.", 4.5, false], ["Dilshod A.", 4.6, true],
  ["Kamola Y.", 4.9, true], ["Otabek S.", 4.3, false], ["Zarina N.", 4.8, true],
  ["Rustam B.", 4.4, true],
];
let n = 0;
const base = Date.UTC(2026, 9, 1, 9, 0, 0); // 1 Oct 2026
function item(type, value, category, usd) {
  const i = n++;
  const [name, rating, verified] = sellers[(i * 7) % sellers.length];
  // round UZS to the nearest 50 000 so it looks like a real asking price
  const priceUZS = Math.round((usd * RATE) / 50000) * 50000;
  return {
    id: `${type === "phone" ? "ph" : type === "telegram" ? "tg" : "ig"}-${String(i + 1).padStart(3, "0")}`,
    type, value, category, priceUZS, priceUSD: usd,
    seller: { name, rating, verified },
    isDemo: true,
    createdAt: new Date(base + ((i * 37) % 60) * 11.5 * 3600_000).toISOString(),
  };
}

const phones = [
  ["777 77 77", "vip", 7800], ["999 99 99", "vip", 6900], ["555 55 55", "vip", 5200],
  ["111 11 11", "vip", 4600], ["333 33 33", "vip", 4100],
  ["123 32 10", "mirror", 950], ["123 43 21", "mirror", 1400], ["765 45 67", "mirror", 880],
  ["900 00 09", "mirror", 1150], ["345 65 43", "mirror", 720],
  ["123 45 67", "sequential", 2400], ["234 56 78", "sequential", 1600],
  ["345 67 89", "sequential", 1450], ["987 65 43", "sequential", 1250],
  ["112 23 34", "pairs", 640], ["223 34 45", "pairs", 520], ["556 67 78", "pairs", 480],
  ["998 87 76", "pairs", 560],
  ["301 45 82", "standard", 45], ["450 12 09", "standard", 38],
].map(([d, c, p]) => item("phone", `+998 00 ${d}`, c, p));

const telegram = [
  ["abc", "letters3", 11500], ["abd", "letters3", 6400], ["zed", "letters3", 7200], ["dev", "letters3", 9800],
  ["nova", "letters4", 3900], ["kino", "letters4", 3300],
  ["orbit", "words", 1700], ["coffee", "words", 2100], ["travel", "words", 2600], ["music", "words", 2900],
  ["tashkent", "words", 1900], ["plov", "words", 2300], ["samarqand", "words", 1350],
  ["aziz", "names", 1800], ["madina", "names", 900], ["sardor", "names", 650], ["lola", "names", 1550],
  ["x777", "digits", 1200], ["bek2", "digits", 140], ["news24", "digits", 260],
].map(([v, c, p]) => item("telegram", `@${v}`, c, p));

const instagram = [
  ["ayx", "letters3", 5600], ["zoo", "letters3", 8200], ["kaf", "letters3", 4300],
  ["luna", "letters4", 3100], ["mira", "letters4", 2200], ["nexa", "letters4", 1500], ["vibe", "letters4", 2700],
  ["pixel", "words", 1900], ["studio", "words", 1600], ["bazaar", "words", 1100], ["design", "words", 2400],
  ["bekzod", "names", 420], ["nilufar", "names", 380], ["dilnoza", "names", 340], ["jasur", "names", 610],
  ["art.uz", "dots", 750], ["photo_daily", "dots", 180], ["tasty.food", "dots", 220],
  ["uz_travel", "dots", 290], ["my.style", "dots", 160],
].map(([v, c, p]) => item("instagram", `@${v}`, c, p));

const all = [...phones, ...telegram, ...instagram];
writeFileSync(new URL("../data/demo.json", import.meta.url), JSON.stringify(all, null, 2) + "\n");
console.log(`wrote ${all.length} items`);
