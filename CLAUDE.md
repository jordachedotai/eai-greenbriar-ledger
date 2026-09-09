# Greenbriar Portfolio Initiative Ledger: Build Brief

You are building a demo web app for the Greenbriar landing-the-plane session and first AI Council (Monday 2026-09-14). Internal deadline: the EAI team call Friday 2026-09-11 at 3:00pm ET. It shows a deal lead's monthly read across their portfolio companies: what each management team committed to, what they wrote about it month by month, and where to push before the next CEO call.

Sponsors: Matthew Burke (Managing Director) and James Peng (Director), Greenbriar Equity Group. Matt's words: "assessing how well the team is executing against the priorities that we set as investors and agree on as a board with management." James's words: a brain layer above the per-company folders that "retains learnings" and connects dots across companies.

Read, in order: `docs/PRD.md` (what), `docs/DATA.md` (the data model and the synthetic set), `docs/AGENT.md` (what is code and what is Claude), `docs/DEMO_SCRIPT.md` (the four minutes in the room), then `BUILD_PLAN.md`. They are the source of truth. The design canvas at https://claude.ai/code/artifact/d3952185-ed33-47ea-a29d-b17eb5fcab9e and the working files in `design-reference/` show the screens; match them.

## Hard rules

- **Synthetic data only. Fictional companies only.** Harlan Industrial Services, Meridian Freight Partners, Corvus Aviation Services. Never a real Greenbriar portfolio company, never a real executive. No SharePoint, Fabric, DealCloud, or email calls, ever, in this repo.
- **Every flag is a quote with a page number.** The tool shows what management wrote. It never paraphrases a quote and never states an outcome the reports do not state. An initiative that stops being mentioned is "not reported since [month]," never "dropped" or "failed."
- **Nothing on screen is a judgment about management, valuation, or investment merit.** Execution against stated commitments only. Greenbriar's AI Usage Policy bars AI-driven investment and fiduciary decisions. The quarterly prep tab is a draft for the associate, labeled Draft.
- **Every AI output is a draft with a Review or Approve control.** Questions, log entries, quarterly slides. Nothing is final until the deal lead clicks.
- **One tool on screen.** Never show Claude.ai, a chat window, or a prompt. The user sees pages, rows, quotes, flags, buttons.
- **The skill output is pre-run and shipped as fixtures.** No live Claude calls in the room. `MOCK_MODE` defaults to true. Live mode, if built at all, is Sunday polish with mock fallback.
- **Any change to the persisted store shape bumps `STORE_VERSION` in the same commit.** Same lesson as the scheduler.
- **Data access goes through `lib/data.ts`.**
- **No em-dashes anywhere in UI copy or fixtures.** Short sentences. Plain words. Nothing below 12px.
- **Match the scheduler's shell exactly.** Same sidebar, header band, presenter menu (Shift+P), avatar block, tokens in `styles/globals.css`. The two demos should read as one product family.

## Stack

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Zustand persisted to `localStorage`, Vitest, Playwright. `@anthropic-ai/sdk` (model `claude-sonnet-5`) only in `scripts/run-ledger.ts`, the one-time skill run that produces `data/ledger.json`. Deployed on Vercel, `vercel.json` declaring the Next.js framework. Repo: `~/Documents/Tools/eai-greenbriar-ledger`.

## Structure

```
app/
  login/page.tsx
  (shell)/layout.tsx                 # sidebar + header + presenter menu
  (shell)/portfolio/page.tsx         # the grid: companies x initiatives x months
  (shell)/portfolio/[id]/page.tsx    # company: tabs Initiatives, Current state, Learning log, Quarterly prep
  (shell)/patterns/page.tsx
  (shell)/reports/page.tsx           # the 24 synthetic reports, readable, with page markers
  (shell)/reports/[id]/page.tsx
  (shell)/log/page.tsx               # all learning-log entries
  (shell)/settings/page.tsx          # placeholder
components/
  Shell/  Sidebar  Header
  Portfolio/  WorkStrip  CompanyCard  InitiativeRow  MonthCells  StatusPill
  Company/  InitiativeList  QuoteStack  QuestionsRail  CurrentState  LogList  QuarterlyPrep  Criteria
  Patterns/  PatternCard
  Reports/  ReportView
  Presenter/  PresenterMenu
  ui/  Face  icons  Menu
data/
  source/arcs.json                   # ground truth: every initiative, every month, the exact sentence
  source/companies.json  priorities/  notes/
  reports/                           # 24 generated monthly reports (markdown with page markers)
  ledger.json  patterns.json  questions.json  log.json  current-state.json  quarterly.json
  demo-states.json                   # july, august, august-approved, monday (12 companies)
lib/   data  types  flags  diff  store  states  text  format
scripts/  gen-reports.ts  run-ledger.ts  check-ledger.ts  gen-states.ts
skill/  SKILL.md                     # the ingestion skill, readable by a person
tests/  tests-e2e/
```

## Definition of done (Friday cut)

1. Login lands on Portfolio, state `august`: three companies, twelve initiatives, eight month cells each, the work strip counts 2 / 2 / 1 / 7.
2. Harlan's ERP row opens the company page with the five-quote stack, change chips, and the three drafted questions with cites. Approve marks them approved.
3. Patterns shows three cards with evidence and cites. Learning log rail shows four entries.
4. Presenter menu: Reset, Jump to state, "August report arrives" (from `july`: the ERP flag turns red and the questions appear), "Dictate a note" (a log entry and current-state line appear as drafts).
5. Every cite links to the report page it names, and the page exists.
6. Mock mode passes the Playwright walkthrough with wifi off. No console errors.
7. Swapping names in `companies.json` and the deal lead in `users.json` needs no code changes.

Sunday adds: Quarterly prep tab final, the `monday` state (twelve companies), the vision slide, rehearsal fixes.
