// The reading log: what the audience watches when the next month's
// reports are added. One line per finding, in the order the skill reads:
// the report, then each registered initiative on it with its page,
// section, the sentence management wrote, the change the diff found, and
// the flag the rules set. Every line comes from the ledger for that month;
// nothing is invented here. Pure functions over lib/data.

import type { Flag, Month, MonthRead } from "./types";
import { getCompanies, getDemoState, getInitiatives, getReport, statusCounts } from "./data";
import { nextMonth, viewKey } from "./states";
import { reportId } from "./reports";
import { monthLabel, plural } from "./format";
import { FLAG_COLORS } from "./flags";

export type ReadingLine =
  | { kind: "open"; companyId: string; reportId: string; text: string }
  | { kind: "read"; companyId: string; initiativeId: string; name: string; where: string; quote: string | null; change: string; flag: Flag; cite: MonthRead["cite"] }
  | { kind: "done"; text: string };

export const READING_MS = 6000; // about how long the whole log takes to stream
export const READING_LINE_MIN_MS = 120;
export const READING_LINE_MAX_MS = 450;
export const READING_LINGER_MS = 1500; // how long the finished log stays before it closes

// The month the log would add from a state, or null at the last month.
export function readingTarget(stateName: string): Month | null {
  return nextMonth(getDemoState(stateName).month);
}

// The lines for adding the month after a state's cutoff, or null when
// every report is in. Companies in board order, initiatives in board
// order within each.
export function readingLines(stateName: string): ReadingLine[] | null {
  const from = getDemoState(stateName);
  const to = nextMonth(from.month);
  if (!to) return null;
  const toKey = viewKey({ set: from.set, cutoff: to });
  const lines: ReadingLine[] = [];
  let changes = 0;
  const all = getInitiatives(undefined, toKey);
  for (const c of getCompanies(toKey)) {
    const id = reportId(c.id, to);
    const report = getReport(id);
    lines.push({ kind: "open", companyId: c.id, reportId: id, text: `${c.name}, ${monthLabel(to)} 2026 report. ${plural(report?.pages.length ?? 0, "page")}.` });
    for (const i of all.filter((x) => x.companyId === c.id)) {
      const read = i.months[to];
      if (!read) continue;
      if (read.change) changes += 1;
      const mentioned = read.mentioned && !!read.quote;
      lines.push({
        kind: "read",
        companyId: c.id,
        initiativeId: i.id,
        name: i.name,
        where: mentioned && read.cite ? `p. ${read.cite.page}, ${read.cite.section}` : `Not mentioned in ${monthLabel(to)}`,
        quote: mentioned ? (read.quote ?? null) : null,
        change: read.change?.label ?? (mentioned ? "No change" : "Not mentioned"),
        flag: read.flag,
        cite: mentioned ? read.cite : undefined,
      });
    }
  }
  const counts = statusCounts(all);
  const flags = (["red", "amber", "grey", "green"] as Flag[]).map((f) => `${counts[f]} ${FLAG_COLORS[f].name.toLowerCase()}`).join(", ");
  lines.push({ kind: "done", text: `${monthLabel(to)} read. ${plural(all.length, "initiative")}, ${plural(changes, "change")}. ${flags}.` });
  return lines;
}

// Milliseconds between lines so the whole log takes about READING_MS.
export function readingInterval(lineCount: number): number {
  if (lineCount <= 0) return READING_LINE_MAX_MS;
  return Math.max(READING_LINE_MIN_MS, Math.min(READING_LINE_MAX_MS, Math.round(READING_MS / lineCount)));
}
