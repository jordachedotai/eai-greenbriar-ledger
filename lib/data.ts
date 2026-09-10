// Single data-access layer. Everything reads fixtures from /data today.
// Swap this file for a real backend later without touching components.

import usersJson from "@/data/users.json";
import ledgerJson from "@/data/ledger.json";
import reportsJson from "@/data/reports/index.json";
import questionsJson from "@/data/questions.json";
import patternsJson from "@/data/patterns.json";
import logJson from "@/data/log.json";
import currentStateJson from "@/data/current-state.json";
import gapsJson from "@/data/gaps.json";
import quarterlyJson from "@/data/quarterly.json";
import type { Company, CurrentState, Flag, Gap, Initiative, Ledger, LogEntry, Pattern, Question, QuarterlyPrep, Report, User } from "./types";
import { FLAG_ORDER } from "./flags";

const ledger = ledgerJson as Ledger;

export function getUsers(): User[] {
  return usersJson as User[];
}

export function getCurrentUser(): User {
  const users = getUsers();
  return users.find((u) => u.isCurrentUser) ?? users[0];
}

export function getLedgerMeta(): { generatedAt: string; mode: Ledger["mode"]; reportCount: number } {
  return { generatedAt: ledger.generatedAt, mode: ledger.mode, reportCount: getReports().length };
}

export function getCompanies(): Company[] {
  return ledger.companies;
}

export function getCompany(id: string): Company | undefined {
  return ledger.companies.find((c) => c.id === id);
}

// Short name for chips and cites: "Harlan", "Corvus".
export function companyShortName(id: string): string {
  return getCompany(id)?.name.split(" ")[0] ?? id;
}

// Initiatives in board order, optionally for one company.
export function getInitiatives(companyId?: string): Initiative[] {
  const byId = new Map(ledger.initiatives.map((i) => [i.id, i]));
  const companies = companyId ? ledger.companies.filter((c) => c.id === companyId) : ledger.companies;
  return companies.flatMap((c) => c.initiativeIds.map((id) => byId.get(id)).filter((i): i is Initiative => !!i));
}

export function getInitiative(id: string): Initiative | undefined {
  return ledger.initiatives.find((i) => i.id === id);
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

export function getReports(companyId?: string): Report[] {
  const all = reportsJson as Report[];
  return companyId ? all.filter((r) => r.companyId === companyId) : all;
}

export function getReport(id: string): Report | undefined {
  return getReports().find((r) => r.id === id);
}

export function getQuestions(companyId?: string): Question[] {
  const all = questionsJson as Question[];
  return companyId ? all.filter((q) => q.companyId === companyId) : all;
}

export function getPatterns(): Pattern[] {
  return patternsJson as Pattern[];
}

export function getLog(companyId?: string): LogEntry[] {
  const all = logJson as LogEntry[];
  return companyId ? all.filter((e) => e.companyId === companyId) : all;
}

export function getCurrentState(companyId: string): CurrentState | undefined {
  return (currentStateJson as CurrentState[]).find((c) => c.companyId === companyId);
}

export function getGap(companyId: string): Gap | undefined {
  return (gapsJson as Gap[]).find((g) => g.companyId === companyId);
}

export function getQuarterly(companyId: string): QuarterlyPrep | undefined {
  return (quarterlyJson as QuarterlyPrep[]).find((q) => q.companyId === companyId);
}

// The company's worst-flagged initiative, first in board order among
// equals. The company page opens on it.
export function worstInitiative(companyId: string): Initiative | undefined {
  const own = getInitiatives(companyId);
  for (const flag of FLAG_ORDER) {
    const hit = own.find((i) => i.status.flag === flag);
    if (hit) return hit;
  }
  return own[0];
}

// Log entries newest first. Drafts are the payload of "Dictate a note";
// they stay hidden until that beat runs.
export function getLogSorted(opts: { companyId?: string; includeDrafts?: boolean } = {}): LogEntry[] {
  return getLog(opts.companyId)
    .filter((e) => opts.includeDrafts || e.status !== "draft")
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
