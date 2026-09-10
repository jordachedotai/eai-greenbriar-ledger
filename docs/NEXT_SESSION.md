# Next session: pick up here

*Rewritten 2026-09-09 (Wednesday) at the end of the Phase 5 build. Everything in the round 4 and round 5 feedback is built, green, and deployed. Sunday polish remains.*

## Read first, in this order
1. `CLAUDE.md` (hard rules, stack, structure)
2. `docs/DEMO_SCRIPT.md` (the four minutes, rewritten around the Time Machine and the reading log)
3. `docs/FEEDBACK.md` rounds 4 and 5 (what was asked), `docs/PRD.md` (the screens)
4. `git log --oneline -10`, `lib/store.ts`, `lib/states.ts`, `components/TimeMachine/*`, `components/Reading/ReadingLog.tsx`, `components/Ask/AskBox.tsx`, `components/Patterns/DraftCard.tsx`

## What exists and works
- **Time Machine** (round 5). "Go back in time" in the header: the page becomes a card in a stack, one real render per month, timeline down the right edge, arrow keys and clicks slide a month forward, amber band under the header while a past month is in view, Escape keeps the month, Return to August exits. Pages read the state through `useStateName()` (`lib/view.tsx`) so any page can be a card.
- **Hover quotes on cells** (round 4 item 2). Any month cell, hover or focus.
- **Watch it read** (round 4 item 3). "Add [month] reports" on Portfolio, in the band, in the stack's bottom bar, and in the presenter menu. `lib/reading.ts` builds the lines from the ledger; the month arrives when the last line has appeared.
- **Ask the ledger** (round 4 item 4). Header box, six scripted questions in `data/answers.json`, answers follow the month in view. `/api/ask` answers live only when the server has `ANTHROPIC_API_KEY` (raw HTTP to claude-sonnet-5, every sentence verified against the ledger, `lib/ask.ts`); otherwise the six.
- **Actions that draft** (round 4 item 5). Pattern cards type out `data/drafts.json`; Approve adds a question to the company's call list with a From Patterns note. Store v5 persists the approvals.
- 126 unit tests, 3 Playwright tests, `npm run check:ledger` (now also verifies answers and drafts), `npm run build`, all green. Deployed by Vercel on every push to `main`: https://eai-greenbriar-ledger.vercel.app

## Sunday polish, in order
1. Rehearse `docs/DEMO_SCRIPT.md` end to end on the projector. Beat 3 is the one to time: two reading logs plus the slide to August.
2. Quarterly prep tab final wording; the vision slide.
3. Screenshots: `node scripts/shots.mjs scripts/tmp http://localhost:3000 phase5` writes the Time Machine set.
4. If a key is available, smoke the live path once (`ANTHROPIC_API_KEY` in `.env.local`, ask an unscripted question) and confirm the fallback with the key removed. Never in the room.
5. Optional, from round 5: "Bring this forward" on a past month's quote, pinning it into the Thursday questions.

## Run it
```
npm run dev
```
Sign in as Matt on /login. Shift+P opens the presenter menu. A production build beside a running dev server: `NEXT_DIST_DIR=.next-build npm run build` (Next 15.5 shares `.next` otherwise). Playwright starts its own server on port 3111.

## Rules that do not bend
Synthetic data only. Fictional names only. Every flag and every answer is a verbatim quote with a page cite. Every AI output is a draft with Review or Approve. No chat window. No em-dashes. Nothing below 12px. Data through `lib/data.ts`. Bump `STORE_VERSION` when the persisted shape changes. Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Push only when lint, tests, check:ledger, e2e, and build are green, because every push deploys.
