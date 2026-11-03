// Renders PWA PNG icons from public/icons/icon.svg using the preinstalled Playwright Chromium.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
// Resolve Playwright from the project or the global install.
let pw;
try { pw = require("playwright"); } catch { pw = require(require("node:path").join(process.env.NODE_PATH ?? "", "playwright")); }
const { chromium } = pw;
import { readFileSync } from "node:fs";

const svg = readFileSync(new URL("../public/icons/icon.svg", import.meta.url), "utf8");
const out = (n) => new URL(`../public/icons/${n}`, import.meta.url).pathname;
const browser = await chromium.launch();
const page = await browser.newPage();

async function render(name, size, { maskable = false } = {}) {
  await page.setViewportSize({ width: size, height: size });
  // Maskable: full-bleed background, artwork scaled into the 80% safe zone.
  const inner = maskable
    ? `<div style="width:100%;height:100%;background:#000;display:flex;align-items:center;justify-content:center"><div style="width:78%;height:78%">${svg.replace('rx="112"', 'rx="0"')}</div></div>`
    : svg;
  await page.setContent(
    `<html><body style="margin:0;background:transparent"><div style="width:${size}px;height:${size}px">${inner}</div><style>svg{width:100%;height:100%;display:block}</style></body></html>`,
  );
  await page.screenshot({ path: out(name), omitBackground: true });
}

await render("icon-192.png", 192);
await render("icon-512.png", 512);
await render("maskable-512.png", 512, { maskable: true });
await render("apple-touch-icon.png", 180, { maskable: true });
await browser.close();
console.log("icons written");
