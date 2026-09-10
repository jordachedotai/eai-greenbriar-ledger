# Data model and the synthetic set

*Written 2026-09-09. All data is JSON or markdown in `/data`. Types in `lib/types.ts`. `data/source/arcs.json` is the ground truth; the reports, the ledger, and the demo states all derive from it.*

## Rule one

Fictional companies, fictional people, fictional vendors. Nothing in `/data` may name a real Greenbriar portfolio company, a real executive, or a real vendor. A test greps the fixtures against a short deny list of real names from the engagement folder.

## The three companies

| id | Name | Sector | City | CEO | Revenue (for the financial table) |
|---|---|---|---|---|---|
| harlan | Harlan Industrial Services | Industrial services | Toledo, OH | Dana Whitfield | about $180M |
| meridian | Meridian Freight Partners | Regional logistics | Memphis, TN | Luis Ortega | about $250M |
| corvus | Corvus Aviation Services | Aviation services and MRO | Wichita, KS | Priya Natarajan | about $120M |

Deal lead for all three on screen: Matt Burke (from `data/users.json`, one entry, `isCurrentUser: true`). Swap the name there and nothing else changes.

## Types

```ts
type Month = "2026-01" | "2026-02" | "2026-03" | "2026-04" | "2026-05" | "2026-06" | "2026-07" | "2026-08";
type Flag = "green" | "amber" | "red" | "grey";
type PillText = "On track" | "Delivered" | "Done" | "Slipping" | "Needs a conversation" | "Not reported";

type Company = {
  id: string; name: string; sector: string; city: string;
  ceo: { name: string; title: string };
  dealLeadId: string;
  nextCall: string;                 // ISO date
  initiativeIds: string[];
};

type Initiative = {
  id: string; companyId: string;
  name: string;
  boardTarget: string;              // "Go-live end of Q2 2026"
  targetDate: string;               // "2026-Q2" or "2026-06"
  owner: string;                    // CEO or a named fictional exec
  promisedBenefit?: string;         // "2 to 3 points of net price"
  months: Record<Month, MonthRead>;
  status: { flag: Flag; pill: PillText; sentence: string; chip?: { text: string; tone: "you" } };  // the August read
  parallelWith?: string[];          // initiative ids in other companies
};

type MonthRead = {
  mentioned: boolean;
  flag: Flag;
  quote?: string;                   // verbatim sentence from the report
  cite?: { reportId: string; page: number; section: string };
  change?: { kind: "date" | "scope" | "number" | "reason" | "silent"; from?: string; to?: string; label: string };
};

type Question = { id: string; companyId: string; initiativeId: string; n: number; text: string; cites: string[]; status: "draft" | "approved" | "dropped" };

type Pattern = { id: string; title: string; companyIds: string[]; body: string; evidence: { text: string; cite?: { reportId: string; page: number } }[]; action: string; tone: "you" | "red" };

type LogEntry = { id: string; date: string; companyId: string; text: string; source: string; status: "on-bench" | "confirmed" | "draft" };

type CurrentState = { companyId: string; updated: string; lines: { date: string; text: string; status?: "draft" }[] };

type QuarterlyPrep = { companyId: string; quarter: string; prior: { initiativeId: string; outcome: string; note: string }[]; next: { initiativeId: string; plan: string }[]; status: "draft" };

type Report = { id: string; companyId: string; month: Month; title: string; pages: { n: number; section: string; text: string }[] };

type User = { id: string; name: string; title: string; isCurrentUser: boolean };
```

## The ground truth: `data/source/arcs.json`

One entry per initiative. For each month: the exact sentence management writes about it (or `null`), which section it appears in, the change if any, and the flag the rules should produce. The report generator renders these sentences into the reports verbatim. The skill run extracts them back out. `scripts/check-ledger.ts` fails if any quote in `ledger.json` differs from arcs by a character, or if any flag differs from the intended one.

### The twelve initiatives and their arcs

**Harlan Industrial Services**
1. `harlan-erp` ERP migration. Target: go-live end of Q2 2026. Jan G "ERP go-live remains on plan for the end of Q2." Feb G (mentioned, no change). Mar G "Implementation on track for a June cutover. Data migration is 60% complete." Apr G (no change). May A "Now targeting a July go-live. Vendor resourcing is constrained in the integration workstream." (date: June to July). Jun A "Phase 1 (finance and procurement) goes live July 1. Phase 2 (operations) is planned for Q4." (scope: phase 2 added). Jul A (phase 1 live, phase 2 Q4 restated). Aug R "Phase 2 is now expected in Q1 2027 to avoid disruption during peak season." (date: Q4 2026 to Q1 2027). **The wow arc.**
2. `harlan-plant` Plant consolidation, Dayton into Toledo. Target: complete by Q3 2026. Jan G, Feb G, Mar A (lease exit signed, move date "to be confirmed"), Apr A through Aug A (each month restates without a date). Rule: restated without a date is amber; it does not escalate to red because nothing moved twice, but the sentence says "Move date has not been stated since April."
3. `harlan-pricing` Pricing discipline, net price +2 pts. Target: all regions by Q3 2026. G throughout. Aug: "Live in 2 of 3 regions. Midwest scheduled for September."
4. `harlan-tms` TMS vendor selection. Target: decision by Q3 2026. G throughout. Jun: "final evaluation between two TMS vendors." Parallel with `corvus-tms`.

**Meridian Freight Partners**
5. `meridian-pricing` Pricing initiative, +2 to 3 pts by Q3. Delivered. Jan G "Targeting 2 to 3 points of net price by Q3 through the regional rollout." Apr G "Implemented in the East and Gulf regions." Jun G "All regions live." Jul, Aug: financial table shows gross margin 27.9% vs 26.1% in March; commentary does not connect it. Status: Delivered, chip "Benefit not rolled up."
6. `meridian-drivers` Driver retention program. Target: turnover under 40% by year end. Jan to May G (44% in May), Jun A (45%), Jul A, Aug A "Turnover at 46%. Recruiting pipeline remains strong." No new actions named. Amber, not red: the number moved the wrong way but only once past the threshold; the sentence says "No new actions named."
7. `meridian-cfo` CFO hire. Target: in seat by Q3 2026. Jan G, Feb G, Mar G, Apr A (search restarted), May A, Jun G (finalist), Jul G, Aug G "Offer accepted August 20. Start date September 15." Done.
8. `meridian-warehouse` Warehouse automation pilot, Memphis. Target: pilot results by Q4 2026. G throughout. Aug: "Equipment installed. First throughput read in September."

**Corvus Aviation Services**
9. `corvus-sales` Sales coverage expansion, two territory reps. Target: both hired by Q2 2026. Jan G, Feb G, Mar G "Recruiting underway for both territory roles." Apr to Aug: not mentioned. Grey from May (two consecutive months). Sentence: "Last mentioned in March. No closure stated since."
10. `corvus-mro` MRO capacity expansion, Hangar 3. Target: online by Q3 2026. Jan to Apr G. May A "Online date moved to October." Jun A. Jul R "Now targeting December." (second move). Aug R "Vendor resourcing has pushed the online date." (reason repeats the phrase Harlan used in May). Parallel by phrase, surfaced in Patterns card 3.
11. `corvus-tms` TMS vendor selection. Target: decision by Q2 2026. Feb G (two-vendor bake-off), Apr G (reference calls), May G "Selected a TMS vendor after a two-vendor bake-off." Aug G "Contract in legal." Parallel with `harlan-tms`.
12. `corvus-concentration` Customer concentration under 30%. Target: top customer under 30% of revenue. G throughout. Jan 38%, Aug 33%.

August counts: red 2 (harlan-erp, corvus-mro), amber 2 (harlan-plant, meridian-drivers), grey 1 (corvus-sales), green 7. July counts (before the August report): red 1 (corvus-mro), amber 3 (harlan-erp, harlan-plant, meridian-drivers), grey 1, green 7.

## The reports: `data/reports/{companyId}-{month}.md`

Twenty-four files rendered by `scripts/gen-reports.ts`. Each is two to four pages with page markers (`<!-- page 3 -->`) so cites resolve. Sections in this order, every month, every company:
1. Cover line: company, month, "Monthly report to the board."
2. Financial summary: a small table, revenue, gross margin, EBITDA, versus budget, month and year to date. Numbers come from a per-company baseline plus a monthly drift, held consistent across months; Meridian's gross margin steps up from April to carry arc 5.
3. CEO commentary: three to five sentences. This is where some arc sentences land (Harlan May).
4. Strategic initiatives update: one short paragraph per initiative, in the order of the board list. Arc sentences land here verbatim. Unmentioned initiatives are simply absent that month.
5. People: one or two lines. Carries the CFO hire and the Corvus sales roles when mentioned.
6. Risks and asks: one or two lines.

The generator pads with ordinary, unremarkable sentences so the arc sentences are not the only content. Padding never contradicts an arc. Padding never introduces a new initiative.

## Other fixtures
- `data/priorities/{companyId}.md`: the January board-agreed list, four initiatives each, with target and measure.
- `data/notes/`: six associate call notes (May and July, each company), half a page, terser than the reports, one mild inconsistency each (a date stated slightly differently) so the cite discipline has a reason to exist. Plus `meridian-site-visit-2026-08-28.txt`, the synthetic transcript for the dictate beat.
- `data/ledger.json`: the skill output. Companies, initiatives with months, status, parallels.
- `data/questions.json`: three per company for the next call. Harlan's three are on the canvas.
- `data/patterns.json`: the three cards on the canvas.
- `data/log.json`: the four entries on the canvas plus the draft that "Dictate a note" produces.
- `data/current-state.json`: five to seven lines per company.
- `data/quarterly.json`: Harlan Q2 to Q3 draft.
- `data/demo-states.json`: `july`, `august`, `august-approved`, `monday`. Generated by `scripts/gen-states.ts` from the fixtures above. `monday` shows all twelve companies: the core three plus nine more fictional ones with two initiatives each and one-line monthly sentences, every cell a quote with a cite, most green throughout, one amber month in three of them, one grey month in one. Their reports are one page each. No questions, patterns, or notes for the nine.
- `data/users.json`: Matt Burke, Managing Director, current user.

## Deny list for the fixture test
Grep `/data` for any of the real names in `../03 Delivery/` (portfolio companies, executives, vendors, EAI staff, Greenbriar staff other than the two sponsors). The list lives in `tests/deny-list.txt`, is not committed to a public repo, and the test fails on any hit.
