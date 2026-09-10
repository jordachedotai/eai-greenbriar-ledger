// "Ask the ledger." One question box in the header. Answers are what the
// ledger holds and nothing else: quotes with page cites, silences, and the
// drafted questions, grouped by company and month. Mock mode answers the
// six scripted questions in data/answers.json (verified by check:ledger).
// Live mode, when the server has a key, asks claude-sonnet-5 to pick
// sentences from the ledger; verifyLiveItems keeps only the ones that are
// character-exact ledger quotes for the months in view. Pure functions.

import type { Answer, AnswerItem, Initiative, Month, MonthRead, Question } from "./types";
import { MONTHS } from "./types";
import { getAnswers, getDemoState, getInitiative, getInitiatives, getQuestion } from "./data";

export const ASK_PLACEHOLDER = "Ask the ledger";
export const ASK_FALLBACK = "I can answer these six in the demo.";

const STOP = new Set(["what", "did", "say", "about", "the", "in", "which", "this", "has", "where", "who", "is", "using", "same", "should", "i", "ask", "on", "a", "an", "of", "to", "for", "and", "do", "does", "are", "was", "were", "have"]);

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function keywords(s: string): string[] {
  return normalize(s)
    .split(" ")
    .filter((w) => w && !STOP.has(w));
}

// The scripted questions that match what has been typed so far: every
// typed word is the start of a word in the question. Empty text lists all.
export function suggestions(text: string, answers: Answer[] = getAnswers()): Answer[] {
  const words = normalize(text).split(" ").filter(Boolean);
  if (!words.length) return answers;
  return answers.filter((a) => {
    const qs = normalize(a.question).split(" ");
    return words.every((w) => qs.some((q) => q.startsWith(w)));
  });
}

// The scripted question a typed question means, if any: the one whose
// keywords it covers best, at least half of them.
export function matchQuestion(text: string, answers: Answer[] = getAnswers()): Answer | null {
  const typed = new Set(keywords(text));
  if (!typed.size) return null;
  let best: { a: Answer; score: number } | null = null;
  for (const a of answers) {
    const ks = keywords(a.question);
    if (!ks.length) continue;
    const hit = ks.filter((k) => typed.has(k)).length;
    const score = hit / ks.length;
    if (score >= 0.5 && (!best || score > best.score)) best = { a, score };
  }
  return best?.a ?? null;
}

// A resolved answer item: what the panel renders.
export type ResolvedItem =
  | { kind: "quote"; companyId: string; initiativeId: string; name: string; month: Month; read: MonthRead }
  | { kind: "silence"; companyId: string; initiativeId: string; name: string; month: Month; read: MonthRead }
  | { kind: "question"; companyId: string; question: Question };

export type ResolvedAnswer = { id: string; question: string; source: "scripted" | "live"; items: ResolvedItem[]; groups: { companyId: string; items: ResolvedItem[] }[] };

function monthIn(m: Month, cutoff: Month): boolean {
  return MONTHS.indexOf(m) <= MONTHS.indexOf(cutoff);
}

// The items of an answer that exist in a state: quotes and silences for
// months that have arrived, questions that have been drafted. Nothing
// from a later month leaks back.
export function resolveItems(items: AnswerItem[], stateName: string): ResolvedItem[] {
  const state = getDemoState(stateName);
  const companies = new Set(state.companyIds);
  const questionIds = new Set(state.questionIds);
  const out: ResolvedItem[] = [];
  for (const it of items) {
    if (it.kind === "question") {
      const q = getQuestion(it.questionId);
      if (q && questionIds.has(q.id)) out.push({ kind: "question", companyId: q.companyId, question: q });
      continue;
    }
    const i = getInitiative(it.initiativeId, stateName);
    if (!i || !companies.has(i.companyId) || !monthIn(it.month, state.month)) continue;
    const read = i.months[it.month];
    if (!read) continue;
    if (it.kind === "quote") {
      if (read.mentioned && read.quote === it.quote) out.push({ kind: "quote", companyId: i.companyId, initiativeId: i.id, name: i.name, month: it.month, read });
    } else if (!read.mentioned) {
      out.push({ kind: "silence", companyId: i.companyId, initiativeId: i.id, name: i.name, month: it.month, read });
    }
  }
  return out;
}

export function groupByCompany(items: ResolvedItem[]): { companyId: string; items: ResolvedItem[] }[] {
  const groups: { companyId: string; items: ResolvedItem[] }[] = [];
  for (const it of items) {
    let g = groups.find((x) => x.companyId === it.companyId);
    if (!g) {
      g = { companyId: it.companyId, items: [] };
      groups.push(g);
    }
    g.items.push(it);
  }
  return groups;
}

export function resolveAnswer(a: Answer, stateName: string, source: "scripted" | "live" = "scripted"): ResolvedAnswer {
  const items = resolveItems(a.items, stateName);
  return { id: a.id, question: a.question, source, items, groups: groupByCompany(items) };
}

// What the live path may return: candidate sentences. Only the ones that
// are character-exact ledger quotes for an initiative and month in the
// state survive; the ledger's own read is what gets shown.
export type LiveItem = { initiativeId: string; month: string; quote: string };

export function verifyLiveItems(candidates: LiveItem[], stateName: string): AnswerItem[] {
  const state = getDemoState(stateName);
  const out: AnswerItem[] = [];
  const seen = new Set<string>();
  for (const c of candidates) {
    if (!MONTHS.includes(c.month as Month)) continue;
    const month = c.month as Month;
    if (!monthIn(month, state.month)) continue;
    const i = getInitiative(c.initiativeId, stateName);
    if (!i || !state.companyIds.includes(i.companyId)) continue;
    const read = i.months[month];
    if (!read?.mentioned || !read.quote) continue;
    const wanted = (c.quote ?? "").trim();
    if (!wanted || !read.quote.includes(wanted)) continue;
    const key = `${i.id}:${month}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ kind: "quote", initiativeId: i.id, month, quote: read.quote });
  }
  return out;
}

// The ledger as the live prompt sees it: every initiative in the state
// with its sentences by month. The model chooses from these; it never
// writes a sentence of its own.
export function ledgerContext(stateName: string): { companyId: string; initiativeId: string; name: string; months: { month: Month; quote: string }[] }[] {
  const state = getDemoState(stateName);
  return getInitiatives(undefined, stateName).map((i: Initiative) => ({
    companyId: i.companyId,
    initiativeId: i.id,
    name: i.name,
    months: state.months.filter((m) => i.months[m]?.mentioned && i.months[m]?.quote).map((m) => ({ month: m, quote: i.months[m]!.quote! })),
  }));
}
