// Display and date helpers. Dates in fixtures are ISO; months are "2026-05";
// commitment dates are "2026-06" or "2026-Q4".

import type { Month } from "./types";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function monthLabel(m: string): string {
  const [, mm] = m.split("-");
  return MONTH_NAMES[Number(mm) - 1] ?? m;
}

export function monthShort(m: string): string {
  return monthLabel(m).slice(0, 3);
}

export function monthLetter(m: Month): string {
  return monthLabel(m)[0];
}

export function monthYear(m: string): string {
  const [y] = m.split("-");
  return `${monthLabel(m)} ${y}`;
}

// A commitment date as written on a chip: "June", "Q4 2026", "Q1 2027".
export function fmtDateValue(v: string): string {
  const q = /^(\d{4})-Q([1-4])$/.exec(v);
  if (q) return `Q${q[2]} ${q[1]}`;
  if (/^\d{4}-\d{2}$/.test(v)) return monthLabel(v);
  return v;
}

// Month index for comparing commitment dates. A quarter counts as its last
// month, so "2026-Q2" and "2026-06" are the same date.
export function monthIndex(v: string): number | null {
  const q = /^(\d{4})-Q([1-4])$/.exec(v);
  if (q) return Number(q[1]) * 12 + Number(q[2]) * 3 - 1;
  const m = /^(\d{4})-(\d{2})$/.exec(v);
  if (m) return Number(m[1]) * 12 + Number(m[2]) - 1;
  return null;
}

// "Thu Sep 17" from an ISO date. The weekday is computed, never typed.
export function fmtCallDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

// "Aug 28" from an ISO date.
export function fmtShortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

// "Thursday" from an ISO date. Computed, never typed, so a changed call
// date in the fixtures changes every button that names the day.
export function fmtWeekday(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
}

// "Q3 2026" from "2026-Q3"; other values pass through.
export function fmtQuarter(q: string): string {
  return fmtDateValue(q);
}

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

// "February, April, and July". Two items: "February and April".
export function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
