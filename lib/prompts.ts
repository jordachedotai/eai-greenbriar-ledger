// Prompts for the one-time skill run (scripts/run-ledger.ts). Summaries in
// docs/AGENT.md. Nothing here runs in the room.

export const SYSTEM = `You are reading monthly management reports for a private equity deal lead. You never paraphrase management. When asked for a sentence, you return the exact characters from the page or nothing. You never state an outcome the reports do not state. You never comment on management quality, valuation, or whether an investment is good. You write short plain business English, no jargon, no em-dashes. Everything you produce is a draft a person will review.`;

export type RegisteredInitiative = { id: string; name: string; boardTarget: string; measure?: string };

// Step 2. One page of one report, the registered initiatives for that company.
export function extractPrompt(page: { reportId: string; n: number; text: string }, initiatives: RegisteredInitiative[]): string {
  const list = initiatives.map((i) => `- ${i.id}: ${i.name}. Board target: ${i.boardTarget}.${i.measure ? ` Measure: ${i.measure}.` : ""}`).join("\n");
  return [
    `Report ${page.reportId}, page ${page.n}. The registered initiatives for this company:`,
    list,
    "",
    "Find every sentence on this page that refers to one of these initiatives. For each, return the sentence as a character-exact substring of the page text, including its final punctuation. When two consecutive sentences in the same paragraph refer to the same initiative, return them together as one substring. Never invent an initiative and never include sentences about anything else. Padding sentences about meetings or reporting are not part of the update.",
    "",
    'Return only JSON: an array of {"initiativeId": string, "sentence": string, "section": string}, where section is the heading the sentence sits under. Return [] if nothing on this page refers to a registered initiative.',
    "",
    "Page text:",
    "<page>",
    page.text,
    "</page>",
  ].join("\n");
}

// Step 3. One extracted sentence, the board target, the commitment keys used so far.
export function structurePrompt(sentence: string, init: RegisteredInitiative & { targetDate: string }, knownKeys: string[]): string {
  return [
    `Initiative: ${init.name}. Board target: ${init.boardTarget} (${init.targetDate}).`,
    `Sentence: "${sentence}"`,
    "",
    "Return the commitments this sentence states, as JSON with these fields:",
    '- commitments: array of {"key": string, "kind": "date" | "number" | "scope", "value": string, "label"?: string}. A date value is "2026-06" or "2026-Q4". Use the same key for the same commitment every month; keys used so far: ' + (knownKeys.length ? knownKeys.join(", ") : "none") + '. A new milestone gets a new key and a label such as "Scope split: phase 2 added".',
    '- measure: {"value": number, "unit": string} when the sentence reports a reading of the initiative\'s own measure, such as turnover or customer share.',
    "- reason: a short phrase when the sentence gives a reason for a change, as written.",
    '- completed: "Delivered" or "Done" when the sentence states completion or cancellation.',
    "- restatedWithoutDate: true when the sentence restates the target with no date, or says a date is to be confirmed or not set.",
    "Omit fields that do not apply. Values as they appear in the sentence. Return only JSON.",
  ].join("\n");
}

// Steps 7 to 10 (patterns, questions, quarterly slide, log entry) are
// drafted from these once the extraction is verified. Phase 1 ships
// reviewed prose for them; the prompts are recorded so the skill is whole.
export const PATTERNS_PROMPT = "Given the structured months for all twelve initiatives: propose up to four cross-company parallels as {title, companyIds, body, evidence: [{initiativeId, month}]}. Every parallel needs evidence from at least two companies. Prefer shared vendors, shared functions, and repeated phrases.";
export const QUESTIONS_PROMPT = "Given one company's initiatives with their month reads and flags: draft three questions for the next CEO call, ordered by urgency, each with the months it draws on. Ask about what moved and what is missing. Never accuse.";
export const QUARTERLY_PROMPT = "Given one company's initiatives and the quarter: fill the two-column layout, prior quarter priorities with outcome and one-line note, next quarter priorities with plan. Mark every line Draft.";
export const LOG_PROMPT = 'Given a transcript and the log format (date, company, learning in one or two sentences, source, status "draft"): return one entry and one current-state line. The learning is what the speaker concluded, in their words where possible.';
