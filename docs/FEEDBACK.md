# Feedback rounds

*One entry per round. Decisions here outrank the PRD where they differ; fold them back into the PRD when a phase closes.*

## Round 1: Phase 1 screenshot, 2026-09-09 evening

Reviewed `scripts/tmp/phase1-portfolio.png`. Matches the canvas. Shipped with 40 tests, the ledger check green, build clean.

Deviations the build made, accepted:
- Next-call dates corrected to real 2026 weekdays: Harlan Thu Sep 17, Meridian Tue Sep 15, Corvus Wed Sep 16. Weekday is computed, never typed.
- Flag rule refinements, printed in `RULE_NOTES`: "two moves" means two different kinds of move (a date move plus a scope split stays amber); a measure moving the wrong way once stays amber. Both were needed for the arcs to produce the intended flags.
- Corvus sales coverage: April cell is green, grey starts in May (two consecutive unmentioned months). The canvas showed grey from April; the code is right.
- Report page size 40 lines, so cites land on pages 2 and 3, not all on one page.
- Prose trimmed for truthfulness: pattern card 2 no longer states "2.4 points" (the reports do not give it); Harlan question 2 no longer claims Corvus named a vendor; plant consolidation sentence reads "No move date stated since March."
- Skill run used the code fallback (no API key on this machine). The Claude path is implemented and untested. Acceptable for Friday: quotes are verbatim by construction and the check script proves it.

Skipped in Phase 1, carried forward: six associate call notes, the deny-list test, `quarterly.json` (Phase 2 authors Harlan's).

Fix requested for Phase 2:
1. Portfolio rows: the August status sentence truncates with an ellipsis. Wrap to two lines, pill stays on the first line.

Open for Jordache after seeing the screenshot: none blocking. If the pale month cells read too faint on a projector, darken the cell fills one step in Phase 3.

## Round 2: Phase 2 screenshots, 2026-09-09 night

Reviewed company, patterns, report, quarterly, portfolio. All match the canvas. 51 tests, ledger check green (now covers gaps, quarterly, log, current state), 17 cites walked with zero broken, build clean.

Deviations the build made, accepted:
- New diff rule: a date stated more precisely without moving (Q2 to June) earns a green "Date stated" chip and no flag change. Needed so March stays in the ERP stack, which the script reads aloud.
- May ERP cite is page 2, not page 4 as the canvas guessed. The ledger is the truth; the canvas is a sketch.
- Blue chips sit inline after the status sentence on Portfolio rows.
- `data/gaps.json` holds "What the reports do not say" per company.

Fix requested for Phase 3:
1. Company page, "How flags are set" block: drop the developer sentence naming `lib/flags.ts`. Replace with "Matt can change these rules." The room does not need a file path.
2. Report view: make sure "Back to [company]" is visible without scrolling up when arriving at a deep page (sticky or repeated at the marked sentence).

Open: none blocking. Deploy is held for Jordache's go-ahead (new GitHub repo and Vercel project).

## Round 3: Phase 3 screenshots, 2026-09-10 early

Reviewed july portfolio, presenter open, august arrives, dictate, log. Friday definition of done items 1 to 6 are met locally. 65 tests, three Playwright walkthrough tests green, ledger check green, build clean.

Deviations the build made, accepted:
- A demo state is "which months have arrived." July truncates the ledger, hides August-dated notes and patterns, drafts no questions. Clean model; keep it.
- `monday` (twelve companies) not built, because a stub would need month cells without quotes and that breaks the cite rule. Phase 4 builds it properly with one-line arcs per extra company, or the scale beat is narrated over the vision board.
- Reports page lists only arrived reports (21 in July, 24 in August).

Polish for Phase 4:
1. Dictate panel overlaps the log cards on the Learning log tab (a Draft pill is clipped). Give the panel its own column or dim the page behind it.
2. Sidebar: add a greyed "Deals" item as a placeholder, so the product family with the Apex workflow is visible. Apex, if built, gets a greyed "Portfolio."
3. Darken the month cell fills one step if they read faint on a projector; check on the Friday call.

Open: deploy (new GitHub repo and Vercel project) still held for Jordache's go-ahead.
