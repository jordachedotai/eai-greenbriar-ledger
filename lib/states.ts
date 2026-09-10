// Demo states. A view is "which companies are in" and "which month the
// reports have arrived through": the header's month scrubber moves the
// cutoff from January to August, and every page follows. The named
// states are presets over a view: july is the core three through July,
// august is the core three through August, august-approved is august with
// Harlan's questions approved, and monday is all twelve companies through
// August. buildStates derives a state for every company set and every
// cutoff from the fixtures (scripts/gen-states.ts writes the result to
// data/demo-states.json; the check script and a test regenerate it and
// fail on any drift). applyState turns the full ledger into what a state
// shows. Pure functions, no I/O.

import type { Arc, Company, CompanySet, DemoState, DemoStates, Initiative, Month, Pattern, Question, View } from "./types";
import { MONTHS } from "./types";
import { conditionsAt, type MonthInput } from "./diff";
import { pillFor } from "./flags";
import { monthLabel, numberWord } from "./format";
import { splitReportId } from "./reports";

export const COMPANY_SETS: CompanySet[] = ["core", "all"];

// The named states: what the presenter menu jumps to.
export const PRESETS: Record<string, { view: View; questionsApproved: string[]; label: string }> = {
  july: { view: { set: "core", cutoff: "2026-07" }, questionsApproved: [], label: "July 2026" },
  august: { view: { set: "core", cutoff: "2026-08" }, questionsApproved: [], label: "August 2026" },
  "august-approved": { view: { set: "core", cutoff: "2026-08" }, questionsApproved: ["harlan"], label: "August 2026, Harlan's questions approved" },
  monday: { view: { set: "all", cutoff: "2026-08" }, questionsApproved: [], label: "August 2026, twelve companies" },
};

export const STATE_NAMES = Object.keys(PRESETS);

export const LAST_MONTH: Month = MONTHS[MONTHS.length - 1];

// "core-2026-07": the key a view is stored and generated under.
export function viewKey(v: View): string {
  return `${v.set}-${v.cutoff}`;
}

export function parseViewKey(key: string): View | null {
  const m = /^(core|all)-(\d{4}-\d{2})$/.exec(key);
  if (!m || !MONTHS.includes(m[2] as Month)) return null;
  return { set: m[1] as CompanySet, cutoff: m[2] as Month };
}

// A preset name or a view key, resolved to a view. Unknown names resolve
// to nothing so the caller can fall back to the default.
export function resolveView(name: string): View | null {
  return PRESETS[name]?.view ?? parseViewKey(name);
}

// The preset a view and set of approvals match, if any: the presenter
// menu shows it as the current state.
export function presetFor(view: View, questionsApproved: string[]): string | null {
  const names = STATE_NAMES.filter((n) => n !== "august-approved");
  if (view.set === "core" && view.cutoff === "2026-08" && questionsApproved.includes("harlan")) return "august-approved";
  return names.find((n) => viewKey(PRESETS[n].view) === viewKey(view)) ?? null;
}

// The month after the cutoff, or null at the last month of the ledger.
export function nextMonth(cutoff: Month): Month | null {
  const i = MONTHS.indexOf(cutoff);
  return i >= 0 && i < MONTHS.length - 1 ? MONTHS[i + 1] : null;
}

// Which companies a set shows. Names come from the file, never from here.
export function companiesIn(set: CompanySet | string, companies: Company[]): Company[] {
  const s: CompanySet = set === "all" ? "all" : set === "core" ? "core" : (resolveView(set)?.set ?? "core");
  return s === "all" ? companies : companies.filter((c) => c.core);
}

// Months up to and including `last`.
export function monthsThrough(last: Month): Month[] {
  return MONTHS.slice(0, MONTHS.indexOf(last) + 1);
}

// The last day of a month, ISO. The cutoff for notes in a state that ends
// before the ledger does.
function endOfMonth(m: Month): string {
  const [y, mm] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mm, 0)).getUTCDate();
  return `${m}-${String(d).padStart(2, "0")}`;
}

// The one-line "where it stands" sentence for a month with no authored
// statusAt entry: the month's own verbatim sentence, or the last one
// written, named by month. Never a paraphrase, so it is safe by
// construction; the core companies carry authored sentences instead.
export function fallbackSentence(i: Initiative, at: Month): string {
  const read = i.months[at];
  if (read?.mentioned && read.quote) return read.quote;
  const before = monthsThrough(at).filter((m) => i.months[m]?.mentioned);
  const last = before[before.length - 1];
  if (!last) return `Not mentioned in ${monthLabel(at)}.`;
  const quote = i.months[last]?.quote ?? "";
  return `Last mentioned in ${monthLabel(last)}: "${quote}" No closure stated since.`;
}

// The status of one initiative as of `at`, from the ledger's month reads
// and the ground truth's facts. The sentence is the arc's for that month
// (or the fallback); the flag, pill, and chip are computed the way
// scripts/run-ledger.ts computes the August ones.
export function statusAsOf(i: Initiative, arc: Arc, at: Month, all: Initiative[]): Initiative["status"] {
  if (at === LAST_MONTH) return i.status;
  const read = i.months[at];
  if (!read) throw new Error(`${i.id}: no read for ${at}`);
  const months = monthsThrough(at);
  const inputs: MonthInput[] = months.map((m) => ({ month: m, mentioned: !!i.months[m]?.mentioned, facts: arc.months[m]?.facts }));
  const cond = conditionsAt(arc, inputs, at);
  const sentence = arc.statusAt?.[at]?.sentence ?? fallbackSentence(i, at);
  const status: Initiative["status"] = { flag: read.flag, pill: pillFor(read.flag, cond.completed), sentence };
  const chip = i.status.chip;
  if (chip?.text.startsWith("Parallel with")) {
    // Both sides of a parallel must have been reported by `at`.
    const self = months.some((m) => i.months[m]?.mentioned);
    const other = (i.parallelWith ?? []).map((id) => all.find((x) => x.id === id)).find((x) => x && months.some((m) => x.months[m]?.mentioned));
    if (self && other) status.chip = chip;
  } else if (chip?.text === "Benefit not rolled up") {
    // Delivered by `at`, at least one report since, and not mentioned in any of them.
    const doneMonth = months.find((m) => arc.months[m]?.facts?.completed);
    const since = doneMonth ? months.slice(months.indexOf(doneMonth) + 1) : [];
    if (since.length && !since.some((m) => i.months[m]?.mentioned)) status.chip = chip;
  }
  return status;
}

// Which questions exist in a state. A company's three questions are
// drafted together when its newest report arrives, so the set exists only
// when every cite in it is within the arrived months. A state that ends
// in July has no questions drawn from August.
export function questionsIn(questions: Question[], months: Month[]): Question[] {
  const set = new Set<string>(months);
  const within = (q: Question) => q.cites.every((c) => set.has(splitReportId(c.split(":")[0]).month));
  const companies = new Set(questions.map((q) => q.companyId));
  const ready = new Set([...companies].filter((id) => questions.filter((q) => q.companyId === id).every(within)));
  return questions.filter((q) => ready.has(q.companyId));
}

// Which patterns exist in a state: those whose evidence cites are all
// within the arrived months.
export function patternsIn(patterns: Pattern[], months: Month[]): Pattern[] {
  const set = new Set<string>(months);
  return patterns.filter((p) => p.evidence.every((e) => !e.cite || set.has(splitReportId(e.cite.reportId).month)));
}

export type StateInput = { companies: Company[]; initiatives: Initiative[]; arcs: Arc[]; questions: Question[]; patterns: Pattern[] };

export function buildState(view: View, input: StateInput): DemoState {
  const arcById = new Map(input.arcs.map((a) => [a.id, a]));
  const months = monthsThrough(view.cutoff);
  const companies = companiesIn(view.set, input.companies);
  const companyIds = new Set(companies.map((c) => c.id));
  const status: DemoState["status"] = {};
  for (const i of input.initiatives) {
    if (!companyIds.has(i.companyId)) continue;
    const arc = arcById.get(i.id);
    if (!arc) throw new Error(`${i.id}: no arc`);
    status[i.id] = statusAsOf(i, arc, view.cutoff, input.initiatives);
  }
  const all = view.set === "all";
  return {
    name: viewKey(view),
    label: all ? `${monthLabel(view.cutoff)} 2026, ${numberWord(companies.length)} companies` : `${monthLabel(view.cutoff)} 2026`,
    set: view.set,
    companyIds: companies.map((c) => c.id),
    months,
    month: view.cutoff,
    cutoff: view.cutoff === LAST_MONTH ? null : endOfMonth(view.cutoff),
    status,
    questionIds: questionsIn(input.questions, months).map((q) => q.id),
    patternIds: patternsIn(input.patterns, months).map((p) => p.id),
  };
}

// Every state: each company set at each cutoff, keyed by view key.
export function buildStates(input: StateInput): DemoStates {
  const out: DemoStates = {};
  for (const set of COMPANY_SETS) {
    for (const cutoff of MONTHS) {
      const view = { set, cutoff };
      out[viewKey(view)] = buildState(view, input);
    }
  }
  return out;
}

// The ledger as a state shows it: months that have not arrived are
// dropped, and the status is the one as of the state's last month.
export function applyState(initiatives: Initiative[], state: DemoState): Initiative[] {
  const keep = new Set<string>(state.months);
  return initiatives.map((i) => {
    const months: Initiative["months"] = {};
    for (const m of MONTHS) if (keep.has(m) && i.months[m]) months[m] = i.months[m];
    return { ...i, months, status: state.status[i.id] ?? i.status };
  });
}

// Whether a dated note (a log entry, a current-state line) exists yet in
// a state.
export function withinCutoff(date: string, state: DemoState): boolean {
  return state.cutoff === null || date <= state.cutoff;
}

export function stateCounts(state: DemoState): Record<Initiative["status"]["flag"], number> {
  const c = { red: 0, amber: 0, grey: 0, green: 0 };
  for (const s of Object.values(state.status)) c[s.flag] += 1;
  return c;
}
