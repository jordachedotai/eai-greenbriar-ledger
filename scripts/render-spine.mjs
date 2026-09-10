// Render design-reference/Spine.dc.html (a 1440x900 artboard) to a 2x PNG
// for the deck: scripts/tmp/vision-spine.png. Strips the canvas wrappers
// (support.js, x-dc, helmet) into scripts/tmp/vision-spine.html first and
// keeps the Google Fonts link. Run from the repo root:
//   npm run render:spine
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const src = readFileSync("design-reference/Spine.dc.html", "utf8");
const html = src
  .replace(/^\s*<script src="\.\/support\.js"><\/script>\s*$/m, "")
  .replace(/^\s*<x-dc>\s*$/m, "")
  .replace(/^\s*<\/x-dc>\s*$/m, "")
  .replace(/^\s*<helmet>\s*$/m, "")
  .replace(/^\s*<\/helmet>\s*$/m, "");
if (/support\.js|<x-dc>|<helmet>/.test(html)) throw new Error("wrappers still present");
if (!html.includes("fonts.googleapis.com")) throw new Error("fonts link missing");
mkdirSync("scripts/tmp", { recursive: true });
const out = resolve("scripts/tmp/vision-spine.html");
writeFileSync(out, html);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const failed = [];
page.on("requestfailed", (r) => failed.push(r.url()));
await page.goto(`file://${out}`, { waitUntil: "domcontentloaded" });
// Google Fonts may not be reachable; wait for them up to 8s, then render with whatever loaded.
await Promise.race([page.evaluate(() => document.fonts.ready), page.waitForTimeout(8000)]);
await page.waitForTimeout(500);
const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family));
await page.screenshot({ path: "scripts/tmp/vision-spine.png", clip: { x: 0, y: 0, width: 1440, height: 900 } });
console.log(JSON.stringify({ wrote: "scripts/tmp/vision-spine.png", fontsLoaded: [...new Set(fonts)], failed }));
await browser.close();
