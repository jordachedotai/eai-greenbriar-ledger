// Dev helper: full-page screenshots of the Phase 1 pages at 1440 wide.
//   node scripts/shots.mjs <outDir> [baseUrl]
import { chromium } from "@playwright/test";

const out = process.argv[2] ?? "scripts/tmp";
const base = process.argv[3] ?? "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto(`${base}/login`, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle" });
await page.getByTestId("sign-in").waitFor();
await page.screenshot({ path: `${out}/phase1-login.png`, fullPage: true });
await page.getByTestId("sign-in").click();
await page.getByTestId("work-strip").waitFor();
// The shell scrolls inside main, so size the viewport to the canvas height instead of fullPage.
await page.setViewportSize({ width: 1440, height: 1300 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/phase1-portfolio.png` });

const counts = {};
for (const f of ["red", "amber", "grey", "green"]) counts[f] = await page.getByTestId(`count-${f}`).innerText();
const rows = await page.getByTestId("initiative-row").count();
console.log(JSON.stringify({ counts, rows, consoleErrors: errors }));
await browser.close();
