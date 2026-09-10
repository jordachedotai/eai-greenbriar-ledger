// Demo states. A state is "which months have arrived": july is the ledger
// with January to July, august is all eight, august-approved is august
// with Harlan's questions approved. buildStates derives every state from
// the fixtures (scripts/gen-states.ts writes the result to
// data/demo-states.json; the check script and a test regenerate it and
// fail on any drift). applyState turns the full ledger into what a state
// shows. Pure functions, no I/O.

import type { Arc, DemoState, DemoStates, Initiative, Month, Pattern, Question } from "./types";
import { MONTHS } from "./types";
import { conditionsAt, type MonthInput } from "./diff";
import { pillFor } from "./flags";
import { monthLabel } from "./format";
import { splitReportId } from "./reports";

export const STATE_NAMES = ["july", "august", "august-approved"] as const;

const LAST_MONTH: Record<(typeof STATE_NAMES)[number], Month> = { july: "2026-07", august: "2026-08", "august-approved": "2026-08" };

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

// The status of one initiative as of `at`, from the ledger's month reads
// and the ground truth's facts. The sentence is the arc's for that month;
// the flag, pill, and chip are computed the way scripts/run-ledger.ts
// computes the August ones.
export function statusAsOf(i: Initiative, arc: Arc, at: Month, all: Initiative[]): Initiative["status"] {
  const last = MONTHS[MONTHS.length - 1];
  if (at === last) return i.status;
  const read = i.months[at];
  if (!read) throw new Error(`${i.id}: no read for ${at}`);
  const months = monthsThrough(at);
  const inputs: MonthInput[] = months.map((m) => ({ month: m, mentioned: !!i.months[m]?.mentioned, facts: arc.months[m]?.facts }));
  const cond = conditionsAt(arc, inputs, at);
  const sentence = arc.statusAt?.[at]?.sentence;
  if (!sentence) throw new Error(`${i.id}: arcs.json has no statusAt sentence for ${at}`);
  const status: Initiative["status"] = { flag: read.flag, pill: pillFor(read.flag, cond.completed), sentence };
  const chip = i.status.chip;
  if (chip?.text.startsWith("Parallel with")) {
    // Both sides of a parallel must have been reported by `at`.
    const other = (i.parallelWith ?? []).map((id) => all.find((x) => x.id === id)).find((x) => x && months.some((m) => x.months[m]?.mentioned));
    if (other) status.chip = chip;
  } else if (chip?.text === "Benefit not rolled up") {
    // Delivered by `at`, and not mentioned since.
    const doneMonth = months.find((m) => arc.months[m]?.facts?.completed);
    if (doneMonth && !months.slice(months.indexOf(doneMonth) + 1).some((m) => i.months[m]?.mentioned)) status.chip = chip;
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

export function buildStates(input: { initiatives: Initiative[]; arcs: Arc[]; questions: Question[]; patterns: Pattern[] }): DemoStates {
  const arcById = new Map(input.arcs.map((a) => [a.id, a]));
  const out: DemoStates = {};
  for (const name of STATE_NAMES) {
    const month = LAST_MONTH[name];
    const months = monthsThrough(month);
    const status: DemoState["status"] = {};
    for (const i of input.initiatives) {
      const arc = arcById.get(i.id);
      if (!arc) throw new Error(`${i.id}: no arc`);
      status[i.id] = statusAsOf(i, arc, month, input.initiatives);
    }
    const isLast = month === MONTHS[MONTHS.length - 1];
    out[name] = {
      name,
      label: `${monthLabel(month)} 2026`,
      months,
      month,
      cutoff: isLast ? null : endOfMonth(month),
      status,
      questionIds: questionsIn(input.questions, months).map((q) => q.id),
      questionsApproved: name === "august-approved" ? ["harlan"] : [],
      patternIds: patternsIn(input.patterns, months).map((p) => p.id),
    };
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
