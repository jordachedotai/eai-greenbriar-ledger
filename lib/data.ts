// Single data-access layer. Everything reads fixtures from /data today.
// Swap this file for a real backend later without touching components.
//
// Most readers take an optional demo-state name (july, august,
// august-approved, monday). Without one they read the `august` state. The
// state decides which companies are in, which months have arrived, what
// each initiative's status is as of then, and which questions, patterns,
// reports, and dated notes exist yet.

import usersJson from "@/data/users.json";
import ledgerJson from "@/data/ledger.json";
import reportsJson from "@/data/reports/index.json";
import questionsJson from "@/data/questions.json";
import patternsJson from "@/data/patterns.json";
import logJson from "@/data/log.json";
import currentStateJson from "@/data/current-state.json";
import gapsJson from "@/data/gaps.json";
import quarterlyJson from "@/data/quarterly.json";
import statesJson from "@/data/demo-states.json";
import notesJson from "@/data/notes/index.json";
import type { Company, CurrentState, DemoState, DemoStates, Flag, Gap, Initiative, Ledger, LogEntry, Month, Note, Pattern, Question, QuarterlyPrep, Report, User } from "./types";
import { FLAG_ORDER } from "./flags";
import { applyState, withinCutoff } from "./states";

const ledger = ledgerJson as Ledger;
const states = statesJson as DemoStates;

export const DEFAULT_STATE = "august";

export function getUsers(): User[] {
  return usersJson as User[];
}

export function getCurrentUser(): User {
  const users = getUsers();
  return users.find((u) => u.isCurrentUser) ?? users[0];
}

// ---- demo states ------------------------------------------------------------

export function getDemoStates(): DemoStates {
  return states;
}

// An unknown name reads as the default, so a stale store never crashes a page.
export function getDemoState(name: string = DEFAULT_STATE): DemoState {
  return states[name] ?? states[DEFAULT_STATE];
}

export function getStateNames(): string[] {
  return Object.keys(states);
}

// The months that have arrived in a state, in order.
export function getMonths(stateName?: string): Month[] {
  return getDemoState(stateName).months;
}

export function getLedgerMeta(stateName?: string): { generatedAt: string; mode: Ledger["mode"]; reportCount: number } {
  return { generatedAt: ledger.generatedAt, mode: ledger.mode, reportCount: getReports(undefined, stateName).length };
}

// ---- companies and initiatives ---------------------------------------------

// The companies the state shows, in board order. Three in july, august,
// and august-approved; all twelve in monday.
export function getCompanies(stateName?: string): Company[] {
  const ids = new Set(getDemoState(stateName).companyIds);
  return ledger.companies.filter((c) => ids.has(c.id));
}

export function getCompany(id: string): Company | undefined {
  return ledger.companies.find((c) => c.id === id);
}

// Short name for chips and cites: "Harlan", "Corvus".
export function companyShortName(id: string): string {
  return getCompany(id)?.name.split(" ")[0] ?? id;
}

const applied = new Map<string, Initiative[]>();
function initiativesIn(stateName?: string): Initiative[] {
  const state = getDemoState(stateName);
  let list = applied.get(state.name);
  if (!list) {
    list = applyState(ledger.initiatives, state);
    applied.set(state.name, list);
  }
  return list;
}

// Initiatives in board order, optionally for one company, as the state shows them.
export function getInitiatives(companyId?: string, stateName?: string): Initiative[] {
  const byId = new Map(initiativesIn(stateName).map((i) => [i.id, i]));
  const companies = getCompanies(stateName).filter((c) => !companyId || c.id === companyId);
  return companies.flatMap((c) => c.initiativeIds.map((id) => byId.get(id)).filter((i): i is Initiative => !!i));
}

export function getInitiative(id: string, stateName?: string): Initiative | undefined {
  return initiativesIn(stateName).find((i) => i.id === id);
}

export type StatusCounts = Record<Flag, number> & { delivered: number };

export function statusCounts(initiatives: Initiative[]): StatusCounts {
  const c: StatusCounts = { red: 0, amber: 0, grey: 0, green: 0, delivered: 0 };
  for (const i of initiatives) {
    c[i.status.flag] += 1;
    if (i.status.pill === "Delivered" || i.status.pill === "Done") c.delivered += 1;
  }
  return c;
}

// The company's worst-flagged initiative, first in board order among
// equals. The company page opens on it.
export function worstInitiative(companyId: string, stateName?: string): Initiative | undefined {
  const own = getInitiatives(companyId, stateName);
  for (const flag of FLAG_ORDER) {
    const hit = own.find((i) => i.status.flag === flag);
    if (hit) return hit;
  }
  return own[0];
}

// ---- reports, questions, patterns ------------------------------------------

// The reports that have arrived in the state, for the companies in it.
export function getReports(companyId?: string, stateName?: string): Report[] {
  const state = getDemoState(stateName);
  const months = new Set<string>(state.months);
  const companies = new Set(state.companyIds);
  const all = (reportsJson as Report[]).filter((r) => months.has(r.month) && companies.has(r.companyId));
  return companyId ? all.filter((r) => r.companyId === companyId) : all;
}

// Any report by id, whatever the state: a cite always resolves.
export function getReport(id: string): Report | undefined {
  return (reportsJson as Report[]).find((r) => r.id === id);
}

export function getQuestions(companyId?: string, stateName?: string): Question[] {
  const ids = new Set(getDemoState(stateName).questionIds);
  const all = (questionsJson as Question[]).filter((q) => ids.has(q.id));
  return companyId ? all.filter((q) => q.companyId === companyId) : all;
}

export function getPatterns(stateName?: string): Pattern[] {
  const ids = new Set(getDemoState(stateName).patternIds);
  return (patternsJson as Pattern[]).filter((p) => ids.has(p.id));
}

export function getGap(companyId: string): Gap | undefined {
  return (gapsJson as Gap[]).find((g) => g.companyId === companyId);
}

export function getQuarterly(companyId: string): QuarterlyPrep | undefined {
  return (quarterlyJson as QuarterlyPrep[]).find((q) => q.companyId === companyId);
}

// ---- learning log, current state, notes ------------------------------------

// What the "Dictate a note" drafts look like: not there yet, a draft with
// a Review control, or confirmed by the deal lead.
export type DraftMode = "hidden" | "draft" | "confirmed";

export function draftModeOf(s: { noteDictated: boolean; noteReviewed: boolean }): DraftMode {
  return !s.noteDictated ? "hidden" : s.noteReviewed ? "confirmed" : "draft";
}

function withDraftMode(e: LogEntry, mode: DraftMode): LogEntry | null {
  if (e.status !== "draft") return e;
  if (mode === "hidden") return null;
  return mode === "confirmed" ? { ...e, status: "confirmed" } : e;
}

export function getLog(companyId?: string, opts: { drafts?: DraftMode; stateName?: string } = {}): LogEntry[] {
  const state = getDemoState(opts.stateName);
  const all = logJson as LogEntry[];
  return all
    .filter((e) => (!companyId || e.companyId === companyId) && withinCutoff(e.date, state))
    .map((e) => withDraftMode(e, opts.drafts ?? "hidden"))
    .filter((e): e is LogEntry => !!e);
}

// Log entries newest first.
export function getLogSorted(opts: { companyId?: string; drafts?: DraftMode; stateName?: string } = {}): LogEntry[] {
  return getLog(opts.companyId, opts).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function getCurrentState(companyId: string, opts: { drafts?: DraftMode; stateName?: string } = {}): CurrentState | undefined {
  const state = getDemoState(opts.stateName);
  const found = (currentStateJson as CurrentState[]).find((c) => c.companyId === companyId);
  if (!found) return undefined;
  const mode = opts.drafts ?? "hidden";
  const lines = found.lines
    .filter((l) => withinCutoff(l.date, state) && (l.status !== "draft" || mode !== "hidden"))
    .map((l) => (l.status === "draft" && mode === "confirmed" ? { date: l.date, text: l.text } : l));
  return { ...found, lines };
}

export function getNotes(): Note[] {
  return notesJson as Note[];
}

export function getNote(id: string): Note | undefined {
  return getNotes().find((n) => n.id === id);
}

// The draft log entry and current-state line a dictated note produces.
export function getNoteDrafts(noteId: string): { entry?: LogEntry; line?: CurrentState["lines"][number] } {
  const note = getNote(noteId);
  if (!note) return {};
  const entry = (logJson as LogEntry[]).find((e) => e.id === note.logEntryId);
  const line = (currentStateJson as CurrentState[]).find((c) => c.companyId === note.companyId)?.lines.find((l) => l.status === "draft" && l.date === note.date);
  return { entry, line };
}
