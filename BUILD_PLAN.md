# Build plan: Greenbriar Portfolio Initiative Ledger

*Written 2026-09-09 evening. Internal deadline Friday 2026-09-11, 3:00pm ET (EAI team call). Room-ready Sunday 2026-09-13 for Monday 2026-09-14. The Proof core (grid, quote stack, questions, one presenter beat) never gets cut.*

## Phase 1: ground truth, reports, skill run, Portfolio (Wed night to Thu midday)

1. Scaffold from `~/Documents/Tools/eai-greenbriar-scheduler`: configs, `styles/globals.css`, `components/ui`, the Shell and Presenter components adapted (nav items change, avatar is the deal lead), login page. Copy `docs/` in.
2. `lib/types.ts` from `docs/DATA.md`.
3. `data/source/arcs.json`: twelve initiatives, eight months each, the exact sentence management writes (or `null` when not mentioned), the change each month if any, the intended flag. This file is the ground truth; everything else derives from it.
4. `scripts/gen-reports.ts`: renders the 24 monthly reports from arcs plus a financial table with consistent numbers per company, CEO commentary, people, risks. Page markers every ~45 lines so cites have real page numbers.
5. `skill/SKILL.md` and `scripts/run-ledger.ts`: read the reports, extract quotes and changes per initiative per month, apply the flag rules in code, write `data/ledger.json`. `scripts/check-ledger.ts` diffs the extraction against arcs and fails on any missed or altered quote. Run once, commit the output.
6. `lib/data.ts`, `lib/flags.ts` (the four rules), `lib/diff.ts` (month over month). Unit tests for the flag rules and the grey rule.
7. Portfolio page: work strip, three company cards, twelve rows, month cells, status pills, Open links. State `august`.

Checkpoint: Portfolio renders from `ledger.json` and matches the canvas.

## Phase 2: Company, Patterns, Reports (Thu afternoon to Thu night)

8. Company page, Initiatives tab: left list with the selected initiative, the quote stack with change chips and cites, the questions rail (Needs you), "What the reports do not say," "After the call."
9. Cite links: every cite opens the report at that page in the Reports view. The Reports page lists all 24 and renders one with page markers.
10. Patterns page: three cards from `patterns.json` with evidence and cites, learning log rail from `log.json`, "Add from a note" control (opens the dictate flow).
11. Company tabs Current state and Learning log from fixtures. Quarterly prep tab as a simple draft slide for Harlan; final layout is Sunday.
12. Criteria block on the company page reads the four rules from `lib/flags.ts` so the screen and the code never disagree.

Checkpoint: click through Portfolio to Harlan ERP to a cited report page and back. Patterns renders.

## Phase 3: presenter tools, states, deploy (Fri morning)

13. `data/demo-states.json`: `july` (Jan to Jul, ERP amber, no August questions), `august` (default), `august-approved`. `scripts/gen-states.ts` derives them from ledger.json so they never drift.
14. Presenter menu (Shift+P): Reset, Jump to state, "August report arrives" (july to august with a short working indicator, then the ERP row turns red and the rail fills), "Dictate a note" (plays a fixed synthetic transcript, then a draft log entry and a current-state line appear on Meridian), toggle Demo tag.
15. Playwright walkthrough of `docs/DEMO_SCRIPT.md` in mock mode. Vitest green. `tsc --noEmit` clean.
16. Deploy to Vercel. Screenshots of every page into `scripts/tmp/` for the feedback round.

Checkpoint, Friday 3pm ET: the script runs in under four minutes on the deployed URL.

## Phase 4: feedback round and room polish (Sat to Sun)

17. Screenshot feedback from Jordache logged in `docs/V2_FEEDBACK.md`, batched, applied.
18. `monday` state: twelve companies, so Devrin's scale beat has something to toggle to. Nine extra fictional companies with one-line initiatives each, no quote stacks needed.
19. Quarterly prep tab in Matt's slide format (if his format arrived; otherwise the generic two-column prior/next layout).
20. Vision slide (the spine, from the canvas) exported as PNG for the deck.
21. Rehearse the script three times. Fix anything that takes more than one click to explain.

## Cut line

Behind by Thursday night: drop the Reports page (cites stay as text), drop Current state and Quarterly prep tabs to placeholders, keep Patterns. Behind by Friday noon: drop "Dictate a note," keep "August report arrives." If the web view itself is at risk: `scripts/run-ledger.ts` also writes `out/ledger.html`, a static render of the grid and the Harlan stack, and that is the demo. The ERP beat never gets cut.

## Not in this build

- Any real connector. SharePoint, Fabric, DealCloud, Outlook.
- Live Claude calls in the room. Live mode for "Dictate a note" is optional Sunday work with mock fallback.
- Multi-user, auth, roles, audit trail.
- Financial dashboards. That is Scott's Fabric lane and Matt separated it himself.
- Real portco names anywhere.
