// Dev helper: full-page screenshots at 1440 wide.
//   node scripts/shots.mjs <outDir> [baseUrl] [phase1|phase2|phase3|phase4|phase5]
// The shell scrolls inside <main>, so each capture sizes the viewport to
// the page's own height instead of using fullPage.
import { chromium } from "@playwright/test";

const out = process.argv[2] ?? "scripts/tmp";
const base = process.argv[3] ?? "http://localhost:3000";
const phase = process.argv[4] ?? "phase1";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(String(e)));

async function fit(minHeight = 900, cap = 5000) {
  // Measure from a normal viewport; a tall one from the previous capture
  // would inflate main's scrollHeight.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(400);
  const h = await page.evaluate(() => {
    const main = document.querySelector("main");
    return (main ? main.scrollHeight : document.body.scrollHeight) + 64;
  });
  await page.setViewportSize({ width: 1440, height: Math.min(cap, Math.max(minHeight, h)) });
  await page.waitForTimeout(300);
}

async function signIn() {
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("sign-in").waitFor();
}

async function presenter() {
  await page.keyboard.press("Shift+P");
  await page.getByTestId("presenter-menu").waitFor();
}

if (phase === "phase5") {
  // The Time Machine: the stack open on August, mid-travel to March, the
  // March card in front with the ERP quote on hover, and the amber band
  // after Escape.
  const result = { consoleErrors: errors };
  await signIn();
  await page.getByTestId("sign-in").click();
  await page.getByTestId("work-strip").waitFor();
  await page.getByTestId("time-machine-open").click();
  await page.getByTestId("time-machine").waitFor();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/phase5-time-machine-open.png` });
  await page.getByTestId("month-2026-03").click();
  await page.waitForTimeout(180);
  await page.screenshot({ path: `${out}/phase5-time-machine.png` });
  await page.waitForTimeout(600);
  await page.locator('[data-testid="tm-card"][data-front="true"] [data-testid="hover-cell"][data-initiative="harlan-erp"][data-month="2026-03"]').hover();
  await page.getByTestId("cell-card").waitFor();
  await page.screenshot({ path: `${out}/phase5-march-hover.png` });
  await page.keyboard.press("Escape");
  await page.getByTestId("time-band").waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/phase5-march-band.png` });
  console.log(JSON.stringify(result, null, 2));
} else if (phase === "phase4") {
  const result = { consoleErrors: errors };
  await signIn();
  await page.getByTestId("sign-in").click();
  await page.getByTestId("work-strip").waitFor();

  // Portfolio, August, with the greyed Deals item in the sidebar.
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/phase4-sidebar.png` });
  result.deals = { soon: await page.getByTestId("nav-deals").getAttribute("data-soon"), cursor: await page.getByTestId("nav-deals").evaluate((el) => getComputedStyle(el).cursor) };

  // Monday: twelve companies.
  await presenter();
  await page.getByTestId("jump-state").click();
  await page.getByTestId("jump-state-opt-monday").click();
  await page.keyboard.press("Shift+P");
  await page.locator('[data-testid="portfolio"][data-state="monday"]').waitFor();
  await fit();
  await page.screenshot({ path: `${out}/phase4-monday-portfolio.png` });
  const counts = [];
  for (const f of ["red", "amber", "grey", "green"]) counts.push(await page.getByTestId(`count-${f}`).innerText());
  result.monday = { counts: counts.join(" / "), companies: await page.getByTestId("company-card").count(), rows: await page.getByTestId("initiative-row").count() };

  // Back to August, then the dictation panel beside Meridian's Learning log tab.
  await presenter();
  await page.getByTestId("presenter-reset").click();
  await page.locator('[data-testid="portfolio"][data-state="august"]').waitFor();
  await page.keyboard.press("Shift+P");
  await page.goto(`${base}/portfolio/meridian?tab=log`, { waitUntil: "networkidle" });
  await page.getByTestId("log-tab").waitFor();
  await presenter();
  await page.getByTestId("beat-dictate").click();
  await page.locator('[data-testid="dictation"][data-status="drafted"]').waitFor({ timeout: 8000 });
  await page.locator('[data-testid="log-tab"] [data-testid="log-entry"][data-status="draft"]').waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/phase4-dictate.png` });
  const draft = await page.locator('[data-testid="log-tab"] [data-testid="log-entry"][data-status="draft"]').boundingBox();
  const panel = await page.getByTestId("dictation").boundingBox();
  result.dictate = { layout: await page.getByTestId("dictation").getAttribute("data-layout"), draftRight: draft.x + draft.width, panelLeft: panel.x, overlap: draft.x + draft.width > panel.x };
  await page.getByTestId("dictation-close").click();

  // Harlan's quarterly prep slide.
  await page.goto(`${base}/portfolio/harlan?tab=quarterly`, { waitUntil: "networkidle" });
  await page.getByTestId("quarterly-slide").waitFor();
  await fit();
  await page.screenshot({ path: `${out}/phase4-quarterly.png` });
  result.quarterly = { title: await page.getByTestId("quarterly-title").innerText(), under12px: await page.evaluate(() => [...document.querySelectorAll("main *")].filter((e) => e.childNodes.length && parseFloat(getComputedStyle(e).fontSize) < 12).length) };

  console.log(JSON.stringify(result, null, 1));
} else if (phase === "phase3") {
  const result = { consoleErrors: errors };
  await signIn();
  await page.getByTestId("sign-in").click();
  await page.getByTestId("work-strip").waitFor();

  // July, from the presenter menu. Portfolio at 1 / 3 / 1 / 7.
  await presenter();
  await page.getByTestId("jump-state").click();
  await page.getByTestId("jump-state-opt-july").click();
  await page.keyboard.press("Shift+P");
  await page.locator('[data-testid="initiative-row"][data-initiative="harlan-erp"][data-flag="amber"]').waitFor();
  await fit();
  await page.screenshot({ path: `${out}/phase3-july-portfolio.png` });
  const counts = async () => {
    const c = [];
    for (const f of ["red", "amber", "grey", "green"]) c.push(await page.getByTestId(`count-${f}`).innerText());
    return c.join(" / ");
  };
  result.julyCounts = await counts();

  // Harlan in July with the presenter menu open.
  await page.locator('[data-initiative="harlan-erp"] [data-testid="open-initiative"]').click();
  await page.getByTestId("questions-empty").waitFor();
  await presenter();
  await fit();
  await page.screenshot({ path: `${out}/phase3-presenter-open.png` });

  // August report arrives, on the Harlan page.
  await page.getByTestId("beat-august-arrives").click();
  await page.getByTestId("working").waitFor();
  await page.locator('[data-testid="question"]').first().waitFor({ timeout: 6000 });
  await page.locator('[data-testid="stack-entry"][data-month="2026-08"]').waitFor();
  await page.waitForTimeout(600);
  await fit();
  await page.screenshot({ path: `${out}/phase3-august-arrives.png` });
  result.afterAugust = {
    questions: await page.getByTestId("question").count(),
    stackMonths: await page.locator('[data-testid="stack-entry"]').evaluateAll((els) => els.map((e) => e.getAttribute("data-month"))),
    pill: await page.locator('[data-testid="quote-stack"] [data-testid="status-pill"]').innerText(),
  };
  await page.goto(`${base}/portfolio`, { waitUntil: "networkidle" });
  await page.getByTestId("work-strip").waitFor();
  result.augustCounts = await counts();

  // Dictate a note, then Meridian's learning log tab before Review.
  await page.goto(`${base}/portfolio/meridian?tab=log`, { waitUntil: "networkidle" });
  await page.getByTestId("log-tab").waitFor();
  await presenter();
  await page.getByTestId("beat-dictate").click();
  await page.locator('[data-testid="dictation"][data-status="drafted"]').waitFor({ timeout: 8000 });
  await page.locator('[data-testid="log-tab"] [data-testid="log-entry"][data-status="draft"]').waitFor();
  await page.waitForTimeout(300);
  await fit();
  await page.screenshot({ path: `${out}/phase3-dictate.png` });

  // The Learning log page with the Draft entry.
  await page.getByTestId("nav-learning-log").click();
  await page.locator('[data-testid="log-page"] [data-testid="log-entry"][data-status="draft"]').waitFor();
  await fit();
  await page.screenshot({ path: `${out}/phase3-log.png` });
  result.draftEntries = await page.locator('[data-testid="log-entry"][data-status="draft"]').count();

  console.log(JSON.stringify(result, null, 1));
} else if (phase === "phase1") {
  await signIn();
  await page.screenshot({ path: `${out}/phase1-login.png`, fullPage: true });
  await page.getByTestId("sign-in").click();
  await page.getByTestId("work-strip").waitFor();
  await page.setViewportSize({ width: 1440, height: 1300 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/phase1-portfolio.png` });
  const counts = {};
  for (const f of ["red", "amber", "grey", "green"]) counts[f] = await page.getByTestId(`count-${f}`).innerText();
  const rows = await page.getByTestId("initiative-row").count();
  console.log(JSON.stringify({ counts, rows, consoleErrors: errors }));
} else {
  const result = { consoleErrors: errors };
  await signIn();
  await page.getByTestId("sign-in").click();

  // Portfolio, showing the wrapped status sentences.
  await page.getByTestId("work-strip").waitFor();
  await fit();
  await page.screenshot({ path: `${out}/phase2-portfolio.png` });
  result.truncated = await page.evaluate(() => [...document.querySelectorAll('[data-testid="status-sentence"]')].filter((el) => el.scrollWidth > el.clientWidth + 1).length);

  // Company page, Harlan, ERP selected via the row's Open link.
  await page.locator('[data-initiative="harlan-erp"] [data-testid="open-initiative"]').click();
  await page.getByTestId("quote-stack").waitFor();
  await fit();
  await page.screenshot({ path: `${out}/phase2-company.png` });
  result.company = {
    selected: await page.locator('[data-testid="initiative-card"][data-selected="true"]').getAttribute("data-initiative"),
    stackMonths: await page.locator('[data-testid="stack-entry"]').evaluateAll((els) => els.map((e) => e.getAttribute("data-month"))),
    chips: await page.locator('[data-testid="change-chip"]').allInnerTexts(),
    footer: await page.getByTestId("stack-footer").innerText(),
    questions: await page.getByTestId("question").count(),
    approveLabel: await page.getByTestId("approve-questions").innerText(),
  };

  // Expand, then collapse, the stack.
  await page.getByTestId("stack-toggle").click();
  result.company.expandedMonths = await page.locator('[data-testid="stack-entry"]').count();
  await page.getByTestId("stack-toggle").click();

  // The May cite opens the May report at its page with the sentence marked.
  const mayCite = page.locator('[data-testid="stack-entry"][data-month="2026-05"] [data-testid="cite"]');
  result.mayCiteHref = await mayCite.getAttribute("href");
  await mayCite.click();
  await page.getByTestId("report-view").waitFor();
  await page.getByTestId("cited-sentence").waitFor();
  await page.waitForTimeout(500);
  result.report = {
    url: page.url(),
    page: await page.getByTestId("report-view").getAttribute("data-page"),
    cited: await page.getByTestId("cited-sentence").innerText(),
    back: await page.getByTestId("back-to-company").innerText(),
    markers: await page.getByTestId("page-marker").count(),
  };
  // Capture the report at the scrolled position first (what the room sees), then the whole thing.
  await page.screenshot({ path: `${out}/phase2-report-viewport.png` });
  await fit();
  await page.screenshot({ path: `${out}/phase2-report.png` });

  // And back.
  await page.getByTestId("back-to-company").click();
  await page.getByTestId("quote-stack").waitFor();
  result.backTo = await page.locator('[data-testid="quote-stack"]').getAttribute("data-initiative");

  // Approve the questions; the card turns plain.
  await page.getByTestId("approve-questions").click();
  result.approved = await page.getByTestId("needs-you").getAttribute("data-approved");

  // Patterns.
  await page.getByTestId("nav-patterns").click();
  await page.getByTestId("patterns").waitFor();
  await fit();
  await page.screenshot({ path: `${out}/phase2-patterns.png` });
  result.patterns = {
    cards: await page.getByTestId("pattern-card").count(),
    cites: await page.locator('[data-testid="pattern-card"] [data-testid="cite"]').count(),
    logEntries: await page.locator('[data-testid="log-rail"] [data-testid="log-entry"]').count(),
  };

  // Quarterly prep tab on Harlan.
  await page.goto(`${base}/portfolio/harlan?tab=quarterly`, { waitUntil: "networkidle" });
  await page.getByTestId("quarterly-prep").waitFor();
  await fit();
  await page.screenshot({ path: `${out}/phase2-quarterly.png` });

  // Every cite on the company, patterns, and questions resolves to a real report page.
  await page.goto(`${base}/portfolio/harlan`, { waitUntil: "networkidle" });
  await page.getByTestId("quote-stack").waitFor();
  const hrefs = await page.locator('[data-testid="cite"]').evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  await page.goto(`${base}/patterns`, { waitUntil: "networkidle" });
  hrefs.push(...(await page.locator('[data-testid="cite"]').evaluateAll((els) => els.map((e) => e.getAttribute("href")))));
  let broken = 0;
  for (const h of hrefs) {
    await page.goto(`${base}${h}`, { waitUntil: "networkidle" });
    const ok = await page.getByTestId("report-view").count();
    const wantPage = new URL(`${base}${h}`).searchParams.get("page");
    const hasMarker = await page.locator(`[data-testid="page-marker"][data-page="${wantPage}"]`).count();
    const q = new URL(`${base}${h}`).searchParams.get("q");
    const hasHit = q ? await page.getByTestId("cited-sentence").count() : 1;
    if (!ok || !hasMarker || !hasHit) broken += 1;
  }
  result.cites = { checked: hrefs.length, broken };

  console.log(JSON.stringify(result, null, 1));
}
await browser.close();
