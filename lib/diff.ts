// Month over month comparison. Code, not Claude. Takes the structured facts
// per month (what the structure step returned for each sentence) and
// produces the moves and the change chips. lib/flags.ts turns the same
// moves and conditions into a flag.

import type { Facts, Month, MonthRead } from "./types";
import { MONTHS } from "./types";
import { fmtDateValue, monthIndex, monthLabel } from "./format";

export type MonthInput = { month: Month; mentioned: boolean; facts?: Facts };

export type InitiativeInput = { targetDate: string; measureDirection?: "down" | "up" };

export type Move = {
  month: Month;
  kind: "date" | "scope" | "number";
  key: string;
  from?: string;
  to: string;
  magnitudeMonths?: number;
  label: string;
};

export type Change = NonNullable<MonthRead["change"]>;

// Every move a stated commitment made, in order. The first dated commitment
// is compared to the board target; a new key after a prior mention is a
// scope change; a known key with a new value is a date or number move.
export function movesFor(init: InitiativeInput, months: MonthInput[]): Move[] {
  const moves: Move[] = [];
  const last: Record<string, string> = {};
  let primaryKey: string | null = null;
  let anyPrior = false;
  for (const m of months) {
    if (!m.mentioned) continue;
    const cs = m.facts?.commitments ?? [];
    for (const c of cs) {
      let prev: string | undefined = last[c.key];
      if (prev === undefined) {
        if (primaryKey === null && c.kind === "date") {
          primaryKey = c.key;
          prev = init.targetDate;
        } else if (anyPrior) {
          moves.push({ month: m.month, kind: "scope", key: c.key, to: c.key, label: c.label ?? `Scope changed: ${c.key}` });
          last[c.key] = c.value;
          continue;
        }
      }
      if (prev !== undefined && c.kind === "date") {
        const a = monthIndex(prev);
        const b = monthIndex(c.value);
        if (a !== null && b !== null && a !== b) {
          moves.push({ month: m.month, kind: "date", key: c.key, from: prev, to: c.value, magnitudeMonths: Math.abs(b - a), label: `Date moved: ${fmtDateValue(prev)} to ${fmtDateValue(c.value)}` });
        }
      } else if (prev !== undefined && c.kind === "number" && prev !== c.value) {
        moves.push({ month: m.month, kind: "number", key: c.key, from: prev, to: c.value, label: `Target moved: ${prev} to ${c.value}` });
      }
      last[c.key] = c.value;
    }
    if (cs.length) anyPrior = true;
  }
  return moves;
}

// Conditions that hold at a month without being a move.
export type Conditions = {
  completed?: "Delivered" | "Done";
  silentRun: number; // consecutive unmentioned months ending here
  lastMentioned?: Month;
  restatedWithoutDate: boolean; // the latest mention restated the target without a date
  measureWorse: boolean; // the latest reading is worse than the best earlier one
  reasonRepeat?: { reason: string; first: Month }; // same stated reason twice with no plan change between
};

export function conditionsAt(init: InitiativeInput, months: MonthInput[], at: Month, moves = movesFor(init, months)): Conditions {
  const dir = init.measureDirection ?? "up";
  let completed: Conditions["completed"];
  let silentRun = 0;
  let lastMentioned: Month | undefined;
  let restatedWithoutDate = false;
  let best: number | undefined;
  let latest: number | undefined;
  const reasons: { reason: string; month: Month }[] = [];
  let reasonRepeat: Conditions["reasonRepeat"];
  for (const m of months) {
    if (MONTHS.indexOf(m.month) > MONTHS.indexOf(at)) break;
    if (!m.mentioned) {
      silentRun += 1;
      continue;
    }
    silentRun = 0;
    lastMentioned = m.month;
    const f = m.facts ?? {};
    if (f.completed) completed = f.completed;
    restatedWithoutDate = !!f.restatedWithoutDate;
    if (f.measure) {
      if (latest !== undefined) best = best === undefined ? latest : dir === "down" ? Math.min(best, latest) : Math.max(best, latest);
      latest = f.measure.value;
    }
    if (f.reason) {
      const r = f.reason.trim().toLowerCase();
      const earlier = reasons.find((x) => x.reason === r);
      if (earlier) {
        const a = MONTHS.indexOf(earlier.month);
        const b = MONTHS.indexOf(m.month);
        const planChanged = moves.some((mv) => {
          const i = MONTHS.indexOf(mv.month);
          return i > a && i <= b;
        });
        if (!planChanged) reasonRepeat = { reason: f.reason, first: earlier.month };
      }
      reasons.push({ reason: r, month: m.month });
    }
  }
  const measureWorse = latest !== undefined && best !== undefined && (dir === "down" ? latest > best : latest < best);
  return { completed, silentRun, lastMentioned, restatedWithoutDate, measureWorse, reasonRepeat };
}

// The change chip for each month, or nothing. One chip per month: a move
// first, then a repeated reason, then a measure moving the wrong way, then
// the first month a target is restated without a date, then the month an
// initiative goes quiet.
export function changesFor(init: InitiativeInput, months: MonthInput[]): Partial<Record<Month, Change>> {
  const out: Partial<Record<Month, Change>> = {};
  const moves = movesFor(init, months);
  const dir = init.measureDirection ?? "up";
  const order = { date: 0, scope: 1, number: 2 };
  let prevMeasure: number | undefined;
  let prevRestated = false;
  let lastDate: string | undefined = init.targetDate;
  let seenReasonRepeat: string | undefined;
  for (const m of months) {
    const cond = conditionsAt(init, months, m.month, moves);
    if (!m.mentioned) {
      if (cond.silentRun === 2 && !cond.completed && cond.lastMentioned) {
        out[m.month] = { kind: "silent", from: monthLabel(cond.lastMentioned), label: `Not mentioned since ${monthLabel(cond.lastMentioned)}` };
      }
      continue;
    }
    const f = m.facts ?? {};
    const here = moves.filter((mv) => mv.month === m.month).sort((a, b) => order[a.kind] - order[b.kind]);
    const measure = f.measure?.value;
    const measureMoved = measure !== undefined && prevMeasure !== undefined && (dir === "down" ? measure > prevMeasure : measure < prevMeasure);
    if (here.length) {
      const mv = here[0];
      out[m.month] = mv.kind === "scope" ? { kind: "scope", to: mv.to, label: mv.label } : { kind: mv.kind, from: mv.from ? fmtDateValue(mv.from) : undefined, to: fmtDateValue(mv.to), label: mv.label };
    } else if (cond.reasonRepeat && cond.reasonRepeat.reason !== seenReasonRepeat) {
      out[m.month] = { kind: "reason", from: monthLabel(cond.reasonRepeat.first), label: `Same reason as ${monthLabel(cond.reasonRepeat.first)}: ${cond.reasonRepeat.reason}` };
    } else if (measureMoved && f.measure) {
      out[m.month] = { kind: "number", from: `${prevMeasure}${f.measure.unit}`, to: `${measure}${f.measure.unit}`, label: `Number moved: ${prevMeasure}${f.measure.unit} to ${measure}${f.measure.unit}` };
    } else if (f.restatedWithoutDate && !prevRestated) {
      out[m.month] = { kind: "date", from: lastDate ? fmtDateValue(lastDate) : undefined, label: "Restated without a date" };
    }
    if (cond.reasonRepeat) seenReasonRepeat = cond.reasonRepeat.reason;
    if (measure !== undefined) prevMeasure = measure;
    prevRestated = !!f.restatedWithoutDate;
    const dated = (f.commitments ?? []).filter((c) => c.kind === "date");
    if (dated.length) lastDate = dated[dated.length - 1].value;
  }
  return out;
}
