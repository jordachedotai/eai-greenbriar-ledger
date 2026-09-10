// The demo script, docs/DEMO_SCRIPT.md, beats 1 through 6, in mock mode,
// using only what is on screen and the presenter menu. Asserts the strip
// before and after "August report arrives," the ERP flag change, the three
// questions, the May cite landing on the May report page with the sentence
// marked, the three pattern cards, and the draft log entry after "Dictate
// a note." Fails on any console error.

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

async function counts(page: Page): Promise<string> {
  const out: string[] = [];
  for (const f of ["red", "amber", "grey", "green"]) out.push(await page.getByTestId(`count-${f}`).innerText());
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
  await expect(page.getByTestId("month-2026-07")).toHaveAttribute("aria-selected", "true");
  expect(await counts(page)).toBe("1 / 3 / 1 / 7");
  const erpRow = page.locator('[data-testid="initiative-row"][data-initiative="harlan-erp"]');
  await expect(erpRow).toHaveAttribute("data-flag", "amber");
  await expect(erpRow.locator('[data-testid="flag-cell"]')).toHaveCount(7);
  await expect(page.locator('[data-testid="initiative-row"][data-initiative="corvus-mro"]')).toHaveAttribute("data-flag", "red");
  await expect(page.getByTestId("initiative-row")).toHaveCount(12);

  // Beat 2. August report arrives: a working indicator, then the ERP row
  // turns red in place and the strip reads 2 / 2 / 1 / 7.
  await openPresenter(page);
  await expect(page.getByTestId("beat-august-arrives")).toHaveAttribute("data-state", "next");
  await page.evaluate(() => {
    (window as unknown as { __noReload: number }).__noReload = 1;
  });
  await page.getByTestId("beat-august-arrives").click();
  await expect(page.getByTestId("working")).toContainText("Reading the August reports");
  await expect(page.getByTestId("beat-august-arrives")).toHaveAttribute("data-state", "working");
  await expect(erpRow).toHaveAttribute("data-flag", "red", { timeout: 6000 });
  await expect(page.getByTestId("working")).toHaveCount(0);
  await expect(page.getByTestId("presenter-menu")).toHaveCount(0);
  expect(await counts(page)).toBe("2 / 2 / 1 / 7");
  await expect(page.getByTestId("month-2026-08")).toHaveAttribute("aria-selected", "true");
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

  // Beat 5. Patterns: three cards, the log rail with four entries.
  await page.getByTestId("nav-patterns").click();
  await expect(page.getByTestId("pattern-card")).toHaveCount(3);
  await expect(page.getByTestId("pattern-card").first()).toContainText("transportation management system");
  await expect(page.locator('[data-testid="pattern-card"][data-pattern="pattern-vendor"]')).toContainText("vendor resourcing");
  await expect(page.locator('[data-testid="log-rail"] [data-testid="log-entry"]')).toHaveCount(4);

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
  await page.getByTestId("beat-august-arrives").click();
  await expect(page.getByTestId("working")).toBeVisible();
  await expect(page.getByTestId("question")).toHaveCount(3, { timeout: 6000 });
  await expect(page.getByTestId("questions-empty")).toHaveCount(0);
  await expect(page.getByTestId("stack-entry")).toHaveCount(5);
  await expect(page.locator('[data-testid="stack-entry"][data-month="2026-08"]')).toBeVisible();
  await expect(page.locator('[data-testid="quote-stack"] [data-testid="status-pill"]')).toHaveText("Needs a conversation");
  await expect(page.getByTestId("header-title")).toHaveText("Harlan Industrial Services");
  expect(errors).toEqual([]);
});

test("the header month toggle loads july and august like Jump to state", async ({ page }) => {
  const errors = await signIn(page);
  expect(await counts(page)).toBe("2 / 2 / 1 / 7");
  await page.getByTestId("month-2026-07").click();
  await expect(page.getByTestId("month-2026-07")).toHaveAttribute("aria-selected", "true");
  expect(await counts(page)).toBe("1 / 3 / 1 / 7");
  await expect(page.getByTestId("header-sub")).toHaveText("Initiatives, January to July 2026");
  await page.getByTestId("month-2026-08").click();
  await expect(page.getByTestId("month-2026-08")).toHaveAttribute("aria-selected", "true");
  expect(await counts(page)).toBe("2 / 2 / 1 / 7");
  // Reset from the presenter menu lands on Portfolio in August.
  await jumpTo(page, "august-approved");
  await page.locator('[data-testid="initiative-row"][data-initiative="harlan-erp"]').getByTestId("open-initiative").click();
  await expect(page.getByTestId("needs-you")).toHaveAttribute("data-approved", "true");
  await openPresenter(page);
  await page.getByTestId("presenter-reset").click();
  await expect(page.getByTestId("portfolio")).toHaveAttribute("data-state", "august");
  expect(errors).toEqual([]);
});
