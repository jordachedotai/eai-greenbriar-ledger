---
name: portfolio-initiative-ledger
description: Reads a portfolio company's monthly management reports, registers the initiatives the board agreed in January, pulls out what management wrote about each one month by month (verbatim, with the page), compares months, sets a flag per initiative per month from four printed rules, and drafts the questions for the next CEO call. Run once before the demo by scripts/run-ledger.ts; the app reads the output as fixtures.
---

# Portfolio initiative ledger

What this skill does, in plain words: it reads the reports so the deal lead does not have to re-read eight PDFs on Sunday night. It never paraphrases management. Every sentence it shows is copied from a page, and every flag names the page.

## Inputs

- `data/priorities/{companyId}.md`: the January board list, one initiative per heading, with id, board target, target date, owner, measure, and promised benefit.
- `data/reports/{companyId}-{month}.md`: the monthly reports, markdown with `<!-- page N -->` markers and `## Section` headings.

## Steps

| Step | Work | Code or Claude |
|---|---|---|
| 1 | Register initiatives from the priority files | Code |
| 2 | For each report page, find every sentence that refers to a registered initiative; return it as a character-exact substring with page and section | Claude, constrained. Code verifies each sentence is on the cited page and rejects any that is not. Without a key, code locates the ground-truth sentences from `data/source/arcs.json` instead and says so in the ledger (`mode: "code"`). |
| 3 | Structure each sentence: dated commitments (keyed so the same commitment can be compared month to month), a measure reading, a stated reason, completion, or a restatement without a date | Claude, returning JSON. Without a key, the facts come from `arcs.json`. |
| 4 | Compare month over month per initiative: date moved, number moved, scope changed, reason repeated, gone quiet | Code, `lib/diff.ts` |
| 5 | Set the flag per initiative per month | Code, `lib/flags.ts` |
| 6 | For a delivered initiative with a promised benefit, check the financial table for the line moving that way after delivery and, if the report does not connect it, add the chip "Benefit not rolled up" | Code |
| 7 | Cross-company parallels | Claude proposes; code requires a cite per company. Phase 1: from `parallelWith` in the ground truth. |
| 8 to 10 | Questions, quarterly slide, log entry from a transcript | Claude, marked Draft. Phase 1 ships reviewed prose in `data/questions.json`, `data/patterns.json`, `data/log.json`. |
| 11 | Write `data/ledger.json` | Code |

## The four rules

```
green: no change versus board target and prior month; or delivered or done
amber: one move (date, number, scope); or target restated without a date
red:   two moves; or one move of a quarter or more; or the same stated reason in two months with no plan change
grey:  not mentioned for two consecutive months with no completion or cancellation stated
```

Two moves means the same kind of thing moved twice. A measured number moving the wrong way is amber and stays amber; it does not become red on its own. A flag carries forward until the initiative is delivered.

## Guarantees, checked by `scripts/check-ledger.ts`

- Every quote in the ledger is a character-exact substring of the cited page.
- Every flag and change chip matches the intended one in `data/source/arcs.json`.
- Every cite resolves to a real report and page. The same goes for the cites in the questions and the patterns.
- No em-dash anywhere in the fixtures or the UI copy.

## What it never does

- Paraphrase a quote, or state an outcome the reports do not state.
- Call an initiative dropped or failed. It says "not reported since March."
- Judge management, valuation, or investment merit.
- Send anything. Every output is a draft with a Review or Approve control.
