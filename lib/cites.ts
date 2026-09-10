// Cites. Every cite anywhere in the app is a link to the report page it
// names. A cite is {reportId, page} with an optional section; questions
// carry them as "harlan-2026-03:2" strings.

import { monthLabel } from "./format";
import { splitReportId } from "./reports";

export type Cite = { reportId: string; page: number; section?: string };

export function parseCite(s: string): Cite | null {
  const m = /^([a-z]+-\d{4}-\d{2}):(\d+)$/.exec(s);
  return m ? { reportId: m[1], page: Number(m[2]) } : null;
}

export function citeCompanyId(c: Cite): string {
  return splitReportId(c.reportId).companyId;
}

export function citeMonth(c: Cite): string {
  return splitReportId(c.reportId).month;
}

// /reports/harlan-2026-05?page=2&q=Now%20targeting... The quote, when
// given, is what the report page highlights.
export function citeHref(c: Cite, quote?: string): string {
  const params = new URLSearchParams({ page: String(c.page) });
  if (quote) params.set("q", quote);
  return `/reports/${c.reportId}?${params.toString()}`;
}

// "May report, p. 2, CEO commentary"
export function citeLabel(c: Cite): string {
  const parts = [`${monthLabel(citeMonth(c))} report`, `p. ${c.page}`];
  if (c.section) parts.push(c.section);
  return parts.join(", ");
}

// "March p. 2", or "Corvus August p. 2" when the cite is another company's.
export function citeShort(c: Cite, ownCompanyId: string, companyShort: (id: string) => string): string {
  const own = citeCompanyId(c) === ownCompanyId;
  return `${own ? "" : companyShort(citeCompanyId(c)) + " "}${monthLabel(citeMonth(c))} p. ${c.page}`;
}
