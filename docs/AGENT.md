# Agent layer: what is code, what is Claude, and when it runs

*Written 2026-09-09. The rule from the scheduler holds: anything that must be correct is code. Anything that must read well is Claude. One addition here: anything that must be verbatim is copied, never generated.*

## When Claude runs

Once, before the demo, on the developer's machine. `scripts/run-ledger.ts` reads the 24 reports and writes `data/ledger.json`, `data/questions.json`, `data/patterns.json`, and the draft log entry. The outputs are committed. The app in the room reads fixtures. No live calls. `MOCK_MODE` defaults to true and there is no live toggle in v1.

This is honest: the skill did the reading. It is also safe: the room cannot be stalled by a model call, and the wording was reviewed before Monday.

## The skill, step by step (`skill/SKILL.md`, run by `scripts/run-ledger.ts`)

| Step | Work | Code or Claude |
|---|---|---|
| 1 | Register initiatives from `data/priorities/*.md`: id, name, board target, target date, owner, promised benefit | Code (parses the priority files) |
| 2 | For each report, for each registered initiative, find every sentence that refers to it; return the sentence verbatim with page and section | Claude, constrained: return character-exact substrings of the page text, or nothing. Code verifies each returned sentence exists on the cited page and rejects any that does not. |
| 3 | Detect commitments in each sentence: dates, quantities, milestones, stated reasons | Claude, returning structured fields per sentence |
| 4 | Compare month over month per initiative: date moved, number moved, scope changed, reason repeated, not mentioned | Code, `lib/diff.ts`, over the structured fields |
| 5 | Assign the flag per initiative per month from the four rules | Code, `lib/flags.ts` |
| 6 | Scan the financial table for a line moving in the direction an initiative promised; note "possible benefit, not connected in the report" | Code for the detection, Claude for the one-sentence note |
| 7 | Across companies, match initiatives on function, vendor phrase, hire type, or repeated reason | Claude proposes, code requires at least one cite per company in the match |
| 8 | Draft three questions per company for the next call, each citing the sentence that prompted it | Claude |
| 9 | Draft the quarterly strategic-priorities slide per company | Claude, marked Draft |
| 10 | From a transcript, draft one learning-log entry and one current-state line in James's format | Claude, marked Draft |
| 11 | Write the JSON files and `out/ledger.html` (the static fallback) | Code |

`scripts/check-ledger.ts` runs after: every quote in `ledger.json` must exist verbatim on its cited page, every flag must match `data/source/arcs.json`, every cite must resolve to a real report id and page. It fails loudly. The developer fixes the prompt or the generator, never the output by hand, except for wording in questions and patterns, which is reviewed prose.

## The flag rules (`lib/flags.ts`)

```
green: no change versus board target and prior month; or delivered or done
amber: one move (date, number, scope); or target restated without a date
red:   two moves; or one move of a quarter or more; or the same stated reason in two months with no plan change
grey:  not mentioned for two consecutive months with no completion or cancellation stated
```

The company page prints these from the same module. If Matt gives his own rules by Thursday, they replace these in one file.

## System prompt, shared

> You are reading monthly management reports for a private equity deal lead. You never paraphrase management. When asked for a sentence, you return the exact characters from the page or nothing. You never state an outcome the reports do not state. You never comment on management quality, valuation, or whether an investment is good. You write short plain business English, no jargon, no em-dashes. Everything you produce is a draft a person will review.

## Per-step prompts (summaries; full text in `lib/prompts.ts`)

**Extract.** Given one page of one report and the list of registered initiatives with their names and short descriptions: return a JSON list of `{initiativeId, sentence, section}` where `sentence` is a character-exact substring of the page. Return an empty list if none. Never invent an initiative.

**Structure.** Given one extracted sentence and the board target: return `{dates: [], quantities: [], milestones: [], reason?: string}` with values as they appear in the sentence.

**Patterns.** Given the structured months for all twelve initiatives: propose up to four cross-company parallels as `{title, companyIds, body, evidence: [{initiativeId, month}]}`. Every parallel needs evidence from at least two companies. Prefer shared vendors, shared functions, and repeated phrases.

**Questions.** Given one company's initiatives with their month reads and flags: draft three questions for the next CEO call, ordered by urgency, each with the months it draws on. Ask about what moved and what is missing. Never accuse.

**Quarterly slide.** Given one company's initiatives and the quarter: fill the two-column layout, prior quarter priorities with outcome and one-line note, next quarter priorities with plan. Mark every line Draft.

**Log entry.** Given a transcript and the log format (date, company, learning in one or two sentences, source, status "draft"): return one entry and one current-state line. The learning is what the speaker concluded, in their words where possible.

## Mock behaviors in the app

The presenter beats are code over fixtures, not model calls:
- **August report arrives:** loads state `august` over `july` after a 1.5 to 2.5 second working indicator. The diff between the two states is what the audience sees change.
- **Dictate a note:** types the fixed transcript from `data/notes/meridian-site-visit-2026-08-28.txt` over four seconds, then inserts the pre-drafted log entry and current-state line with `status: "draft"`.

## Live mode (optional, Sunday)

If there is time: "Dictate a note" can call Claude through `app/api/agent/route.ts` with the same prompt as step 10, key in `.env.local`, fallback to the fixture on any failure with a small "offline draft" tag. Same pattern as the scheduler. Not required for the room.
