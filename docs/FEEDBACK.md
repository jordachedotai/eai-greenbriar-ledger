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

## Round 4: "not very interactive, lots of clicking", 2026-09-10

Jordache's read of the Phase 3 screenshots. Accepted in full. The tool shows results; the demo has to show the reading happen and let the deal lead touch the data. Phase 5, in priority order:

1. **Month scrubber in the header.** A slider from January to August replaces the July / August toggle. Dragging it changes which months have arrived; cells, flags, pills, strip counts, questions, patterns, and the Reports list all follow. Counts animate. The "August report arrives" presenter control stays as a keyboard fallback but the script uses the slider.
2. **Hover quotes on month cells.** Hovering any cell shows a card with the verbatim quote, the cite as a link, and the change chip if any. Keyboard focus shows the same card. Cells with no mention show "Not mentioned in [month]."
3. **Watch it read.** A visible "Add August reports" control on Portfolio (and in the presenter menu). Pressing it opens a reading log that streams one line per finding over about six seconds, in order: report, page, section, initiative, what changed, flag. Then the grid updates. Lines come from the diff between july and august, so nothing is invented.
4. **Ask the ledger.** A single question box in the header on every page. Answers are quotes with page links, grouped by company and month, never uncited prose. Mock mode: six scripted questions with typeahead (what did Harlan say about the ERP date in March; which initiatives slipped this quarter; what has Corvus stopped reporting; where did pricing work; who is using the same vendor; what should I ask Dana on Thursday). Live mode if `ANTHROPIC_API_KEY` exists: the question plus the ledger JSON go to claude-sonnet-5 with a system prompt that returns only quotes present in the ledger, verified by code before display. Fallback to "I can answer these six in the demo" with the list.
5. **Actions that draft.** "Draft an intro between the two operations leads" and "Add the comp-plan learning to Harlan's Thursday questions" type out a draft over two seconds with Approve and Edit. Canned drafts in `data/drafts.json`.

Click budget for the demo: Portfolio to the ERP story with zero clicks (hover), to the questions with one click, to a cited page with two. Rewrite `docs/DEMO_SCRIPT.md` to the slider and the reading log once built.

Held: the dictate beat and Reset stay in the presenter menu. Deploy after Phase 5 is green.

## Round 5: "Apple Time Machine, going back in time", 2026-09-10

Replaces the slider control from round 4 item 1. The cutoff-month model stays. The control and the motion become Time Machine:

- "Go back in time" button in the header. Pressing it dims the shell; the current page (Portfolio or a company page) becomes a card in a perspective stack with the earlier months behind it as receding ghost cards, each a real render of that month's state. A vertical timeline on the right edge lists January to August 2026, newest at the bottom, current highlighted. Hover previews, click or arrow keys slide that month's card forward while newer ones drop away. Cells, flags, pills, strip counts, and the quote stack animate into that month's state (about 500ms, ease-out). Bottom bar: "Return to August" primary, the viewed month in serif. Escape returns.
- While a past month is in view, a thin amber band under the header reads "Viewing [Month] 2026. Return to August." so the presenter never loses the room.
- The reading log (round 4 item 3) is the way forward in time: from any past month, "Add [next month] reports" streams the log and slides the next card forward. The demo goes back to March, hovers the ERP cell (green, "on plan for end of Q2"), then steps forward month by month watching it turn amber and red.
- Optional: on a past month's company page, "Bring this forward" on a quote pins it into Harlan's Thursday questions as a cite, like restoring a file.
- Reduced-motion users get instant swaps with the same controls.
- Playwright: back to March, ERP cell green with the March quote on hover; forward to August via the reading log, cell red. Screenshot `phase5-time-machine.png` mid-travel.

Also captured in this round, for the PRD "Workflow" section: the goal, Matt's workflow by cadence, and how data flows in. See PRD.
