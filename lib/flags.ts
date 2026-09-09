// The flag rules. One place, exported as data so the company page prints
// the same text the code runs. If Matt gives his own rules, they change here.

import type { Flag, Month, PillText } from "./types";
import { MONTHS } from "./types";
import { conditionsAt, movesFor, type InitiativeInput, type MonthInput } from "./diff";

export const RULES: { flag: Flag; pill: PillText; label: string; rule: string }[] = [
  { flag: "green", pill: "On track", label: "On track", rule: "No change versus the board target and the prior month; or delivered or done." },
  { flag: "amber", pill: "Slipping", label: "Slipping", rule: "One move (date, number, or scope); or the target restated without a date." },
  { flag: "red", pill: "Needs a conversation", label: "Needs a conversation", rule: "Two moves; or one move of a quarter or more; or the same stated reason in two months with no plan change." },
  { flag: "grey", pill: "Not reported", label: "Not reported", rule: "Not mentioned for two consecutive months with no completion or cancellation stated." },
];

// Notes the rules leave implicit, printed under them on the company page.
export const RULE_NOTES = [
  "Two moves means the same kind of thing moved twice: two date moves, or two scope changes. A date move plus a scope change is one of each, so it stays amber.",
  "A measured number moving the wrong way is amber. It stays amber however many months it stays wrong; it goes red only when a date or scope also moves, or a reason repeats.",
  "A flag carries forward. An initiative that moved in May is still slipping in July unless it is delivered.",
];

export const FLAG_COLORS: Record<Flag, { text: string; bg: string; line: string; name: string }> = {
  green: { text: "#15733f", bg: "#e3f4ea", line: "#c4e6d1", name: "On track" },
  amber: { text: "#8a5a08", bg: "#fbf3dd", line: "#f0e2b8", name: "Slipping" },
  red: { text: "#c8434f", bg: "#fbe7e9", line: "#f3c6cb", name: "Needs a conversation" },
  grey: { text: "#8a978a", bg: "#f2f5f1", line: "#e3e9e1", name: "Not reported" },
};

// Blue, the only color that asks for a click.
export const YOU_COLORS = { text: "#2b5f9e", bg: "#e5edf7", line: "#c3d4ea" };

export const FLAG_ORDER: Flag[] = ["red", "amber", "grey", "green"];

export function pillFor(flag: Flag, completed?: "Delivered" | "Done"): PillText {
  if (flag === "green") return completed ?? "On track";
  if (flag === "amber") return "Slipping";
  if (flag === "red") return "Needs a conversation";
  return "Not reported";
}

// The flag at one month, from everything reported up to and including it.
export function flagAt(init: InitiativeInput, months: MonthInput[], at: Month): Flag {
  const moves = movesFor(init, months);
  const cond = conditionsAt(init, months, at, moves);
  if (cond.completed) return "green";
  if (cond.silentRun >= 2) return "grey";
  const upto = moves.filter((m) => MONTHS.indexOf(m.month) <= MONTHS.indexOf(at));
  const counts = { date: 0, scope: 0, number: 0 };
  let big = false;
  for (const m of upto) {
    counts[m.kind] += 1;
    if ((m.magnitudeMonths ?? 0) >= 3) big = true;
  }
  if (Math.max(counts.date, counts.scope, counts.number) >= 2 || big || cond.reasonRepeat) return "red";
  if (upto.length >= 1 || cond.restatedWithoutDate || cond.measureWorse) return "amber";
  return "green";
}

export function flagsFor(init: InitiativeInput, months: MonthInput[]): Record<Month, Flag> {
  const out = {} as Record<Month, Flag>;
  for (const m of months) out[m.month] = flagAt(init, months, m.month);
  return out;
}

// The pill at the last month, with Delivered or Done when stated.
export function statusAt(init: InitiativeInput, months: MonthInput[], at: Month): { flag: Flag; pill: PillText } {
  const flag = flagAt(init, months, at);
  const cond = conditionsAt(init, months, at);
  return { flag, pill: pillFor(flag, cond.completed) };
}
