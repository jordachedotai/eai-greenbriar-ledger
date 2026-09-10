# Next session: pick up here

*Written 2026-09-10 for the VS Code Claude Code session. The background build was stopped after the month slider committed (6150557). A stash holds partial hover-card work; inspect it with `git stash show -p`, use it or drop it.*

## Read first, in this order
1. `CLAUDE.md` (hard rules, stack, structure)
2. `docs/FEEDBACK.md` rounds 4 and 5 (the interactivity spec and the Time Machine spec)
3. `docs/PRD.md` (Goal, Workflow, and How information flows in are new; the rest is the screens)
4. `docs/DEMO_SCRIPT.md` (rewrite it as the last step to match what you build)
5. `git log --oneline -8`, `lib/states.ts`, `lib/store.ts`, `components/Shell/Header.tsx`, `components/Portfolio/*`

## What exists and works
Portfolio, Company (quote stack, questions, tabs), Reports with real page cites, Patterns, Learning log, presenter menu (Shift+P) with the July to August beat and Dictate a note, twelve-company `monday` state, a month slider in the header (Phase 5 item 1). 104 unit tests, 3 Playwright tests, `npm run check:ledger`, `npm run build` all green at 6150557. Deployed by Vercel Git integration on every push to `main`: https://eai-greenbriar-ledger.vercel.app

## Build, in this order, committing after each, pushing when green
1. **Time Machine** (round 5). Replaces the slider control; keep the cutoff-month model the slider introduced. "Go back in time" in the header; page becomes a card in a perspective stack with earlier months receding behind; timeline down the right edge; click or arrow keys slide a month forward with cells, flags, pills, counts, and the quote stack animating into that month's state; amber band "Viewing March 2026. Return to August." under the header; Escape or Return to August exits; reduced motion gets instant swaps.
2. **Hover quotes on cells** (round 4 item 2). Any month cell, hover or focus: month, flag pill, verbatim quote, cite link, change chip. "Not mentioned in [month]" when absent.
3. **Watch it read** (round 4 item 3). "Add [next month] reports" streams a reading log line by line from the diff to the next month, then slides the next card forward. This is the way forward in time. The presenter menu's "August report arrives" runs the same flow.
4. **Ask the ledger** (round 4 item 4). Six scripted questions with typeahead, answers are quotes with cites only, `data/answers.json` verified by `check:ledger`. Live path only if `ANTHROPIC_API_KEY` exists, with verified substrings and fallback.
5. **Actions that draft** (round 4 item 5), if time. Cut first if Friday is tight.
6. Rewrite `docs/DEMO_SCRIPT.md` around: back to March, hover the green ERP cell, step forward month by month with the reading log until it turns red, approve the questions, click the May cite, ask the ledger one question, Patterns, dictate. Update the Playwright walkthrough to match.

## Rules that do not bend
Synthetic data only. Fictional names only. Every flag and every answer is a verbatim quote with a page cite. Every AI output is a draft with Review or Approve. No chat window. No em-dashes. Nothing below 12px. Data through `lib/data.ts`. Bump `STORE_VERSION` when the persisted shape changes. Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Push only when lint, tests, check:ledger, e2e, and build are green, because every push deploys.

## Run it
```
npm run dev
```
Sign in as Matt on /login, land on /portfolio. Shift+P opens the presenter menu.
