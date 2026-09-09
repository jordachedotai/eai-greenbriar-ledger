# PRD: Greenbriar Portfolio Initiative Ledger

*Written 2026-09-09 from the Peng (08-31) and Burke (09-01) 1:1s, the Demo Build Brief and Build Card of the same day, and the EAI pre-AIC sync. Screens are on the design canvas and in `../design-reference/`.*

## The user

One user on screen: a deal lead, modeled on Matt Burke, Managing Director. Covers several portfolio companies. Has a weekly call with each CEO. Gets a monthly management report per company. Sits on the boards. Not technical. Opens the tool Monday morning, sees which initiatives need a conversation, reads what management wrote, approves three questions, goes into the call. Never types a prompt.

A second user is present in the data, not on screen: James Peng's learning log and current-state files, which the deal lead's team reads and writes.

## The job

For each portfolio company, three to five strategic initiatives are agreed with the board at the start of the year. Each month management reports on them inside the monthly package. The tool reads those reports, puts each month's language for each initiative side by side, flags what changed, drafts the questions for the next call, finds parallels across companies, and drafts the quarterly strategic-priorities slide. All of it cited to the page.

It answers two questions:
- Matt's: did they do what they said?
- James's: what is showing up across companies that I would miss one at a time?

It is not a financial dashboard, not a memo generator, not a chat window.

## Flags, one meaning per color

Same status system as the scheduler. Rules live in `lib/flags.ts` and are printed on the company page so the screen and the code cannot disagree.

| Flag | Color | Rule |
|---|---|---|
| On track | green, `#15733f` on `#e3f4ea` | The stated date, number, and scope hold versus the board target and the prior month. Also used for Delivered and Done, with the pill text saying which. |
| Slipping | amber, `#8a5a08` on `#fbf3dd` | A date, number, or scope moved once, or a target was restated without a date. |
| Needs a conversation | red, `#c8434f` on `#fbe7e9` | Moved twice, or moved by a quarter or more, or a stated reason repeats across months without a change in plan. |
| Not reported | grey, `#8a978a` on `#f2f5f1` | Not mentioned for two consecutive months with no completion or cancellation stated. |
| Needs you | blue, `#2b5f9e` on `#e5edf7` | A draft is waiting on the deal lead: questions, a log entry, a slide. The only color that asks for a click. |

Delivered and Done are green with different pill text. A delivered initiative whose benefit shows in the financials but is not connected in the report gets a "Benefit not rolled up" chip in blue.

## Screens

### Login
Mock sign-in, Greenbriar logo, fields prefilled, one button. Lands on Portfolio. No real auth.

### Shell
Left sidebar, collapsible: Portfolio, Patterns, Reports, Learning log, Settings. Avatar bottom left: Matt Burke, Managing Director (from `users.json`). Header band: page title in serif, subtitle, month selector (July / August 2026), Demo data tag, presenter icon. Presenter menu on Shift+P.

### Portfolio (default)
- Work strip: four counts as tiles in the status colors. Need a conversation, Slipping, Not reported, On track. State `august`: 2, 2, 1, 7. Clicking a tile filters rows.
- Right of the strip: "12 initiatives across 3 companies. Read from 24 monthly reports. Every flag cites the page it came from."
- One card per company: name, CEO, next call date, initiative and status counts. Column labels: Initiative, J F M A M J J A, Where it stands in August.
- One row per initiative: name and board target, eight month cells, status pill plus one sentence, optional blue chip (Parallel with Corvus, Benefit not rolled up), Open link. Red and grey rows get a colored left border.

### Company
Header: breadcrumb Portfolio, chevron, company name in serif. Subtitle: CEO, next call. Tabs: Initiatives, Current state, Learning log, Quarterly prep.

Initiatives tab, three columns:
1. Left, 272px: the company's initiatives as small cards with a flag cell and a one-line status. Selected card carries the flag color as a left border. Below: "How flags are set," the four rules, from code.
2. Center: the selected initiative. Title in serif, board target and owner, status pill. A banner: "What management wrote, month by month. Nothing paraphrased." Then the stack: one entry per month that carries a change, each with the month, the flag cell, the quote in quotation marks, the cite (report, page, section), and a change chip (Date moved: June to July; Scope split: phase 2 added). Below the stack: "February, April, and July mention the initiative without a change. Show all eight months."
3. Right, 360px: the Needs you card, "Before Thursday's call," three drafted questions, each with a cite, buttons Approve for Thursday and Edit. Then "What the reports do not say." Then "After the call" with the dictate control.

Current state tab: the current-state file for the company, a short list of bullets with dates, in James's format. Learning log tab: the company's entries. Quarterly prep tab: a draft slide, prior quarter priorities with outcome and note, next quarter priorities with plan, marked Draft, one button Send to [associate].

### Patterns
Two columns. Left: an intro sentence, then pattern cards. Each: title, company chips, one paragraph, evidence bullets with cites, an action button (Draft an intro, Add to Thursday's questions, Ask both CEOs), and "Draft. Nothing is sent until you approve it." Right, 380px: Learning log, latest, four entries with date, company, status pill (On bench, Confirmed), and "Add from a note."

### Reports
A list of the 24 monthly reports by company and month. Opening one renders it with visible page markers. Every cite anywhere in the app links here at the page. This is what makes "cites the page" true.

### Learning log
All entries across companies, filterable by company and status.

### Settings
Placeholder sentence.

## Presenter menu (Shift+P)
Dark green panel bottom right, same as the scheduler. Controls:
- Reset (to `august`).
- Jump to state: july, august, august-approved, monday.
- **August report arrives.** From `july`: a two-second working indicator, then Harlan's ERP row turns red, the work strip changes from 1 / 3 / 1 / 7 to 2 / 2 / 1 / 7, and the Harlan page's rail fills with the three questions. This is the wow beat.
- **Dictate a note.** Plays a fixed synthetic transcript (Meridian site visit) as text appearing over four seconds, then a draft learning-log entry and a draft current-state line appear on Meridian with Review buttons.
- Toggle Demo tag.

## Rules that apply everywhere
- Quotes are verbatim from the report file. A test checks every quote on screen exists in the cited report page.
- No outcome is asserted that the reports do not state.
- Every draft has a Review, Approve, or Edit control. Approving changes the pill from Needs you to a plain state; nothing is "sent."
- No real company, executive, or vendor names. Vendors are "the integrator," "the two TMS vendors."
- No em-dashes. Nothing below 12px. Serif for titles and big numbers, sans for everything else.
