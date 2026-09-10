// The demo script, docs/DEMO_SCRIPT.md, beats 1 through 6, in mock mode,
// using only what is on screen and the presenter menu. Asserts the strip
// before and after "August report arrives," the ERP flag change, the three
// questions, the May cite landing on the May report page with the sentence
// marked, the three pattern cards, and the draft log entry after "Dictate
// a note." Then the Time Machine: back to March, the ERP cell green with
// the March quote on hover, the arrow keys, Escape keeping March in view
// with the amber band, Return to August. Then Beat 7: jump to monday shows
// twelve companies, and Reset to August returns to the three-company
// august state. Fails on any console error.

import { expect, test, type Page } from "@playwright/test";

const MAY_QUOTE = "Now targeting a July go-live. Vendor resourcing is constrained in the integration workstream.";

async function signIn(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByTestId("sign-in").click();
  await expect(page.getByTestId("work-strip")).toBeVisible();
  return errors;
}

// The strip counts, once they have finished counting to their values.
async function counts(page: Page): Promise<string> {
  const out: string[] = [];
  for (const f of ["red", "amber", "grey", "green"]) {
    const tile = page.getByTestId(`count-${f}`);
    const target = (await tile.getAttribute("data-value")) ?? "";
    await expect(tile).toHaveText(target);
    out.push(target);
  }
  return out.join(" / ");
}

async function openPresenter(page: Page) {
  await page.keyboard.press("Shift+P");
  await expect(page.getByTestId("presenter-menu")).toBeVisible();
}

async function jumpTo(page: Page, state: string) {
  await openPresenter(page);
  await page.getByTestId("jump-state").click();
  await page.getByTestId(`jump-state-opt-${state}`).click();
  await expect(page.getByTestId("presenter-menu")).toHaveAttribute("data-state", state);
  await page.keyboard.press("Shift+P");
  await expect(page.getByTestId("presenter-menu")).toHaveCount(0);
}

test("beats 1 to 6 from the presenter menu and on-screen controls", async ({ page }) => {
  const errors = await signIn(page);

  // Beat 1. Portfolio, July: 1 / 3 / 1 / 7, seven months, the ERP amber.
  await jumpTo(page, "july");
  await expect(page.getByTestId("time-band")).toHaveAttribute("data-month", "2026-07");
  expect(await counts(page)).toBe("1 / 3 / 1 / 7");
  const erpRow = page.locator('[data-testid="initiative-row"][data-initiative="harlan-erp"]');
  await expect(erpRow).toHaveAttribute("data-flag", "amber");
  await expect(erpRow.locator('[data-testid="flag-cell"]')).toHaveCount(7);
  await expect(page.locator('[data-testid="initiative-row"][data-initiative="corvus-mro"]')).toHaveAttribute("data-flag", "red");
  await expect(page.getByTestId("initiative-row")).toHaveCount(12);

  // Beat 2. August reports arrive: the reading log streams one line per
  // finding, then the ERP row turns red in place and the strip reads
  // 2 / 2 / 1 / 7.
  await openPresenter(page);
  await expect(page.getByTestId("beat-add-reports")).toHaveAttribute("data-state", "next");
  await expect(page.getByTestId("beat-add-reports")).toHaveText(/August reports arrive/);
  await page.evaluate(() => {
    (window as unknown as { __noReload: number }).__noReload = 1;
  });
  await page.getByTestId("beat-add-reports").click();
  const log = page.getByTestId("reading-log");
  await expect(log).toHaveAttribute("data-status", "reading");
  await expect(log).toHaveAttribute("data-month", "2026-08");
  await expect(page.getByTestId("reading-title")).toContainText("Reading the August reports");
  await expect(page.getByTestId("presenter-menu")).toHaveCount(0);
  await expect(page.locator('[data-testid="reading-line"][data-kind="open"]').first()).toContainText("Harlan Industrial Services, August 2026 report");
  await expect(erpRow).toHaveAttribute("data-flag", "amber");
  const erpLine = page.locator('[data-testid="reading-line"][data-initiative="harlan-erp"]');
  await expect(erpLine).toContainText("Date moved: Q4 2026 to Q1 2027", { timeout: 10000 });
  await expect(erpLine).toHaveAttribute("data-flag", "red");
  await expect(erpLine.getByTestId("reading-cite")).toHaveAttribute("href", /\/reports\/harlan-2026-08\?page=2/);
  await expect(erpRow).toHaveAttribute("data-flag", "red", { timeout: 10000 });
  await expect(log).toHaveAttribute("data-status", "done");
  await expect(page.locator('[data-testid="reading-line"][data-kind="done"]')).toContainText("August read. 12 initiatives, 4 changes.");
  expect(await counts(page)).toBe("2 / 2 / 1 / 7");
  await expect(log).toHaveCount(0, { timeout: 5000 });
  await expect(page.getByTestId("time-band")).toHaveCount(0);
  await expect(erpRow.locator('[data-testid="flag-cell"]')).toHaveCount(8);
  expect(await page.evaluate(() => (window as unknown as { __noReload?: number }).__noReload)).toBe(1);

  // Open Harlan from the ERP row. The stack: January, March, May, June,
  // August, with change chips on May, June, and August.
  await erpRow.getByTestId("open-initiative").click();
  await expect(page.getByTestId("quote-stack")).toHaveAttribute("data-initiative", "harlan-erp");
  await expect(page.getByTestId("stack-entry")).toHaveText([/January/, /March/, /May/, /June/, /August/]);
  await expect(page.getByTestId("change-chip")).toHaveText(["Date stated: June", "Date moved: June to July", "Scope split: phase 2 added", "Date moved: Q4 2026 to Q1 2027"]);
  await expect(page.locator('[data-testid="stack-entry"][data-month="2026-08"] [data-testid="stack-quote"]')).toContainText("Phase 2 is now expected in Q1 2027");

  // Beat 3. Three drafted questions with cites; Approve for Thursday.
  await expect(page.getByTestId("question")).toHaveCount(3);
  await expect(page.getByTestId("question-cites")).toHaveCount(3);
  await expect(page.getByTestId("approve-questions")).toHaveText("Approve for Thursday");
  await page.getByTestId("approve-questions").click();
  await expect(page.getByTestId("needs-you")).toHaveAttribute("data-approved", "true");
  await expect(page.getByTestId("gaps")).toContainText("No cost of delay");
  await expect(page.getByTestId("criteria-note")).toHaveText("Matt can change these rules.");

  // Beat 4. The May cite opens the May report at its page with the
  // sentence marked, and Back to Harlan is on screen without scrolling.
  await page.locator('[data-testid="stack-entry"][data-month="2026-05"] [data-testid="cite"]').click();
  await expect(page.getByTestId("report-view")).toHaveAttribute("data-report", "harlan-2026-05");
  await expect(page.getByTestId("report-view")).toHaveAttribute("data-page", "2");
  await expect(page.getByTestId("cited-sentence")).toHaveText(MAY_QUOTE);
  await expect(page.getByTestId("cited-sentence")).toBeInViewport();
  await expect(page.getByTestId("back-to-company")).toBeInViewport();
  await expect(page.getByTestId("back-to-company")).toHaveText(/Back to Harlan Industrial Services/);
  await page.getByTestId("back-to-company").click();
  await expect(page.getByTestId("quote-stack")).toHaveAttribute("data-initiative", "harlan-erp");
  await expect(page.getByTestId("needs-you")).toHaveAttribute("data-approved", "true");

  // Ask the ledger, from the company page: the ERP question answers with
  // the March sentence and its cite, then May; Dana's three drafted
  // questions; an unscripted question falls back to the six.
  await page.getByTestId("ask-input").click();
  await expect(page.getByTestId("ask-suggestion")).toHaveCount(6);
  await page.getByTestId("ask-input").fill("erp");
  await expect(page.getByTestId("ask-suggestion")).toHaveCount(1);
  await page.locator('[data-testid="ask-suggestion"][data-answer="erp-march"]').click();
  await expect(page.getByTestId("ask-answer")).toHaveAttribute("data-answer", "erp-march");
  await expect(page.getByTestId("ask-answer")).toHaveAttribute("data-source", "scripted");
  await expect(page.getByTestId("ask-item")).toHaveCount(2);
  await expect(page.getByTestId("ask-quote").first()).toHaveText("\u201cImplementation on track for a June cutover. Data migration is 60% complete.\u201d");
  await expect(page.locator('[data-testid="ask-item"][data-month="2026-03"] [data-testid="cite"]')).toHaveAttribute("data-report", "harlan-2026-03");
  await expect(page.locator('[data-testid="ask-item"][data-month="2026-05"] [data-testid="change-chip"]')).toHaveText("Date moved: June to July");
  await page.getByTestId("ask-clear").click();
  await page.getByTestId("ask-input").fill("what should I ask dana on thursday");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("ask-answer")).toHaveAttribute("data-answer", "ask-dana");
  await expect(page.locator('[data-testid="ask-item"][data-kind="question"]')).toHaveCount(3);
  await expect(page.locator('[data-testid="ask-item"][data-kind="question"] [data-testid="cite"]').first()).toHaveAttribute("data-report", "harlan-2026-03");
  await page.getByTestId("ask-clear").click();
  await page.getByTestId("ask-input").fill("what is the weather");
  await expect(page.getByTestId("ask-no-match")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("ask-fallback")).toBeVisible({ timeout: 20000 });
  await expect(page.getByTestId("ask-fallback")).toContainText("I can answer these six in the demo.");
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("ask-panel")).toHaveCount(0);

  // Beat 5. Patterns: three cards, the log rail with four entries.
  await page.getByTestId("nav-patterns").click();
  await expect(page.getByTestId("pattern-card")).toHaveCount(3);
  await expect(page.getByTestId("pattern-card").first()).toContainText("transportation management system");
  await expect(page.locator('[data-testid="pattern-card"][data-pattern="pattern-vendor"]')).toContainText("vendor resourcing");
  await expect(page.locator('[data-testid="log-rail"] [data-testid="log-entry"]')).toHaveCount(4);

  // Actions that draft: the comp-plan action types out a fourth question
  // for Harlan; Approve adds it to Thursday's list with a From Patterns
  // note. The intro action drafts a note; Edit and Save keep the change.
  const pricingCard = page.locator('[data-testid="pattern-card"][data-pattern="pattern-pricing"]');
  await pricingCard.getByTestId("pattern-action").click();
  const compDraft = page.locator('[data-testid="pattern-draft"][data-pattern="pattern-pricing"]');
  await expect(compDraft).toHaveAttribute("data-status", "typing");
  await expect(compDraft).toHaveAttribute("data-status", "drafted", { timeout: 6000 });
  await expect(compDraft.getByTestId("draft-text")).toContainText("sales comp plan changed first");
  await expect(compDraft.locator('[data-testid="cite"]').first()).toHaveAttribute("data-report", "harlan-2026-08");
  await compDraft.getByTestId("draft-approve").click();
  await expect(compDraft).toHaveAttribute("data-status", "approved");
  await expect(compDraft.getByTestId("draft-done")).toContainText("Added to Harlan's Thursday questions.");
  const tmsCard = page.locator('[data-testid="pattern-card"][data-pattern="pattern-tms"]');
  await tmsCard.getByTestId("pattern-action").click();
  const intro = page.locator('[data-testid="pattern-draft"][data-pattern="pattern-tms"]');
  await expect(intro).toHaveAttribute("data-kind", "intro");
  await expect(intro).toHaveAttribute("data-status", "drafted", { timeout: 6000 });
  await expect(intro).toContainText("Marcus Bell, COO");
  await intro.getByTestId("draft-edit").click();
  await intro.getByTestId("draft-textarea").fill("Marcus, Tom. Worth thirty minutes on the TMS reference calls.");
  await intro.getByTestId("draft-save").click();
  await expect(intro.getByTestId("draft-text")).toHaveText("Marcus, Tom. Worth thirty minutes on the TMS reference calls.");
  await page.goto("/portfolio/harlan");
  await expect(page.getByTestId("question")).toHaveCount(4);
  const fourth = page.locator('[data-testid="question"][data-question="draft-pattern-pricing-harlan"]');
  await expect(fourth).toContainText("sales comp plan");
  await expect(fourth.getByTestId("from-patterns")).toHaveText("From Patterns");
  await page.getByTestId("nav-patterns").click();
  await expect(page.getByTestId("pattern-card")).toHaveCount(3);

  // Beat 6. Dictate a note: the transcript plays, then the draft log entry
  // and current-state line appear on Meridian with a Review control.
  await openPresenter(page);
  await page.getByTestId("beat-dictate").click();
  await expect(page.getByTestId("dictation")).toHaveAttribute("data-status", "playing");
  await expect(page.getByTestId("presenter-menu")).toHaveCount(0);
  await expect(page.getByTestId("dictation")).toHaveAttribute("data-status", "drafted", { timeout: 8000 });
  await expect(page.getByTestId("dictation-text")).toContainText("the integration with the warehouse system is not on the schedule yet");
  await expect(page.getByTestId("dictation-log-draft")).toContainText("warehouse pilot equipment is in");
  await expect(page.getByTestId("dictation-state-draft")).toContainText("Warehouse system integration is not on the pilot schedule");
  // The rail and the log page show the draft entry with a Draft pill.
  const railDraft = page.locator('[data-testid="log-rail"] [data-testid="log-entry"][data-status="draft"]');
  await expect(railDraft).toHaveCount(1);
  await expect(railDraft.getByTestId("you-chip")).toHaveText("Draft");
  await page.getByTestId("nav-learning-log").click();
  await expect(page.locator('[data-testid="log-entry"][data-status="draft"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="log-entry"][data-status="draft"] [data-testid="you-chip"]')).toHaveText("Draft");
  // Meridian's tabs carry the drafts too.
  await page.getByTestId("dictation-open").click();
  await expect(page.getByTestId("company-page")).toHaveAttribute("data-company", "meridian");
  await expect(page.getByTestId("company-page")).toHaveAttribute("data-tab", "log");
  await expect(page.locator('[data-testid="log-tab"] [data-testid="log-entry"][data-status="draft"]')).toHaveCount(1);
  await page.getByTestId("tab-current-state").click();
  await expect(page.locator('[data-testid="state-line"][data-status="draft"]')).toHaveCount(1);
  // Review confirms them.
  await page.getByTestId("review-state-line").click();
  await expect(page.locator('[data-testid="state-line"][data-status="draft"]')).toHaveCount(0);
  await expect(page.getByTestId("dictation")).toHaveAttribute("data-status", "reviewed");
  await page.getByTestId("tab-log").click();
  await expect(page.locator('[data-testid="log-tab"] [data-testid="log-entry"][data-status="draft"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="log-tab"] [data-testid="log-entry"][data-entry="log-meridian-0828-draft"]')).toHaveAttribute("data-status", "confirmed");
  await page.getByTestId("dictation-close").click();
  await expect(page.getByTestId("dictation")).toHaveCount(0);

  expect(errors).toEqual([]);
});

test("on the Harlan page, August report arrives fills the rail and adds the August entry in place", async ({ page }) => {
  const errors = await signIn(page);
  await jumpTo(page, "july");
  await page.locator('[data-testid="initiative-row"][data-initiative="harlan-erp"]').getByTestId("open-initiative").click();
  await expect(page.getByTestId("quote-stack")).toHaveAttribute("data-initiative", "harlan-erp");
  await expect(page.getByTestId("questions-empty")).toContainText("Questions are drafted when the next report arrives.");
  await expect(page.getByTestId("question")).toHaveCount(0);
  await expect(page.getByTestId("stack-entry")).toHaveCount(4);
  await expect(page.locator('[data-testid="quote-stack"] [data-testid="status-pill"]')).toHaveText("Slipping");

  await openPresenter(page);
  await page.getByTestId("beat-add-reports").click();
  await expect(page.getByTestId("reading-log")).toBeVisible();
  await expect(page.getByTestId("question")).toHaveCount(3, { timeout: 12000 });
  await expect(page.getByTestId("questions-empty")).toHaveCount(0);
  await expect(page.getByTestId("stack-entry")).toHaveCount(5);
  await expect(page.locator('[data-testid="stack-entry"][data-month="2026-08"]')).toBeVisible();
  await expect(page.locator('[data-testid="quote-stack"] [data-testid="status-pill"]')).toHaveText("Needs a conversation");
  await expect(page.getByTestId("header-title")).toHaveText("Harlan Industrial Services");
  expect(errors).toEqual([]);
});

const MARCH_QUOTE = "Implementation on track for a June cutover. Data migration is 60% complete.";

test("the Time Machine goes back to March, hovers the green ERP cell, and returns to August", async ({ page }) => {
  const errors = await signIn(page);
  expect(await counts(page)).toBe("2 / 2 / 1 / 7");
  await expect(page.getByTestId("time-band")).toHaveCount(0);

  // Go back in time: the page becomes the front card, August in view,
  // July, June, and May behind it.
  await page.getByTestId("time-machine-open").click();
  const tm = page.getByTestId("time-machine");
  await expect(tm).toHaveAttribute("data-viewed", "2026-08");
  await expect(page.getByTestId("tm-card")).toHaveCount(8);
  const front = page.locator('[data-testid="tm-card"][data-front="true"]');
  await expect(front).toHaveAttribute("data-month", "2026-08");
  await expect(page.locator('[data-testid="tm-card"][data-month="2026-07"]')).toHaveAttribute("data-depth", "1");
  await expect(page.getByTestId("month-2026-08")).toHaveAttribute("aria-current", "true");

  // Click March on the timeline: the March card slides forward. Its ERP
  // cell is green, and hovering it shows the March sentence with its cite.
  await page.getByTestId("month-2026-03").click();
  await expect(tm).toHaveAttribute("data-viewed", "2026-03");
  await expect(front).toHaveAttribute("data-month", "2026-03");
  await expect(page.getByTestId("tm-viewed")).toHaveText("March 2026");
  await expect(page.locator('[data-testid="tm-card"][data-month="2026-08"]')).toHaveAttribute("data-depth", "-5");
  const marchErp = front.locator('[data-testid="initiative-row"][data-initiative="harlan-erp"]');
  await expect(marchErp).toHaveAttribute("data-flag", "green");
  await expect(marchErp.locator('[data-testid="flag-cell"]')).toHaveCount(3);
  await marchErp.locator('[data-testid="hover-cell"][data-month="2026-03"]').hover();
  await expect(page.getByTestId("cell-card")).toBeVisible();
  await expect(page.getByTestId("cell-quote")).toHaveText(`\u201c${MARCH_QUOTE}\u201d`);
  await expect(page.locator('[data-testid="cell-card"] [data-testid="cite"]')).toHaveAttribute("data-report", "harlan-2026-03");
  await expect(page.locator('[data-testid="cell-card"] [data-testid="change-chip"]')).toHaveText("Date stated: June");
  await page.mouse.move(10, 450);
  await expect(page.getByTestId("cell-card")).toHaveCount(0);

  // The arrow keys step a month at a time; ghost cards behind are inert.
  await page.keyboard.press("ArrowUp");
  await expect(tm).toHaveAttribute("data-viewed", "2026-02");
  await page.keyboard.press("ArrowDown");
  await expect(tm).toHaveAttribute("data-viewed", "2026-03");
  await expect(page.locator('[data-testid="tm-card"][data-month="2026-02"] [data-testid="portfolio"]')).toHaveAttribute("data-state", "core-2026-02");

  // Escape keeps March in view: the band under the header says so, and
  // the page reads as of March.
  await page.keyboard.press("Escape");
  await expect(tm).toHaveCount(0);
  await expect(page.getByTestId("time-band")).toHaveAttribute("data-month", "2026-03");
  await expect(page.getByTestId("time-band")).toContainText("Viewing March 2026.");
  expect(await counts(page)).toBe("0 / 1 / 0 / 11");
  await expect(page.getByTestId("header-sub")).toHaveText("Initiatives, January to March 2026");
  await expect(page.locator('[data-testid="initiative-row"][data-initiative="harlan-erp"]')).toHaveAttribute("data-flag", "green");

  // Asked in March, the ERP question shows only the March sentence.
  await page.getByTestId("ask-input").click();
  await page.locator('[data-testid="ask-suggestion"][data-answer="erp-march"]').click();
  await expect(page.getByTestId("ask-answer")).toHaveAttribute("data-count", "1");
  await expect(page.getByTestId("ask-item")).toHaveCount(1);
  await page.keyboard.press("Escape");

  // Forward is the reading log: from the band, "Add April reports"
  // streams the April findings, then April is in view.
  await expect(page.getByTestId("time-band-add")).toHaveText("Add April reports");
  await expect(page.getByTestId("add-reports")).toHaveText("Add April reports");
  await page.getByTestId("time-band-add").click();
  await expect(page.getByTestId("reading-log")).toHaveAttribute("data-month", "2026-04");
  await expect(page.getByTestId("time-band")).toHaveAttribute("data-month", "2026-04", { timeout: 12000 });
  await expect(page.getByTestId("reading-log")).toHaveCount(0, { timeout: 5000 });
  await expect(page.locator('[data-testid="initiative-row"][data-initiative="harlan-erp"] [data-testid="flag-cell"]')).toHaveCount(4);

  // In the stack, the same control slides the next card forward: from
  // July, the August card comes to the front with the ERP cell red.
  await page.getByTestId("time-machine-open").click();
  await page.getByTestId("month-2026-07").click();
  await expect(tm).toHaveAttribute("data-viewed", "2026-07");
  await expect(front.locator('[data-testid="initiative-row"][data-initiative="harlan-erp"]')).toHaveAttribute("data-flag", "amber");
  await page.getByTestId("tm-add-reports").click();
  await expect(page.getByTestId("reading-log")).toHaveAttribute("data-status", "reading");
  await expect(page.getByTestId("month-2026-03")).toBeDisabled();
  await expect(tm).toHaveAttribute("data-viewed", "2026-08", { timeout: 12000 });
  await expect(front).toHaveAttribute("data-month", "2026-08");
  await expect(front.locator('[data-testid="initiative-row"][data-initiative="harlan-erp"]')).toHaveAttribute("data-flag", "red");
  await expect(page.getByTestId("tm-add-reports")).toHaveCount(0);
  await expect(page.getByTestId("reading-log")).toHaveCount(0, { timeout: 5000 });
  await page.getByTestId("tm-return").click();
  await expect(tm).toHaveCount(0);
  await expect(page.getByTestId("time-band")).toHaveCount(0);
  expect(await counts(page)).toBe("2 / 2 / 1 / 7");
  await expect(page.getByTestId("add-reports")).toHaveCount(0);

  // Beat 7. Monday: twelve company cards, thirty rows, the strip recomputed.
  await jumpTo(page, "monday");
  await expect(page.getByTestId("portfolio")).toHaveAttribute("data-state", "all-2026-08");
  await expect(page.getByTestId("company-card")).toHaveCount(12);
  await expect(page.getByTestId("initiative-row")).toHaveCount(30);
  expect(await counts(page)).toBe("2 / 2 / 1 / 25");
  await expect(page.getByTestId("work-strip")).toContainText("30 initiatives across 12 companies. Read from 96 monthly reports.");
  await expect(page.locator('[data-testid="company-card"][data-company="brightwater"] [data-testid="flag-cell"][data-flag="grey"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="initiative-row"][data-initiative="harlan-erp"]')).toHaveAttribute("data-flag", "red");
  // Reset from the presenter menu lands on Portfolio in August, three companies.
  await openPresenter(page);
  await page.getByTestId("presenter-reset").click();
  await expect(page.getByTestId("portfolio")).toHaveAttribute("data-state", "core-2026-08");
  await expect(page.getByTestId("company-card")).toHaveCount(3);
  expect(await counts(page)).toBe("2 / 2 / 1 / 7");
  await page.keyboard.press("Shift+P");
  await expect(page.getByTestId("presenter-menu")).toHaveCount(0);
  // And august-approved, reset from a company page, also lands on August.
  await jumpTo(page, "august-approved");
  await page.locator('[data-testid="initiative-row"][data-initiative="harlan-erp"]').getByTestId("open-initiative").click();
  await expect(page.getByTestId("needs-you")).toHaveAttribute("data-approved", "true");
  await openPresenter(page);
  await page.getByTestId("presenter-reset").click();
  await expect(page.getByTestId("portfolio")).toHaveAttribute("data-state", "core-2026-08");
  expect(errors).toEqual([]);
});
