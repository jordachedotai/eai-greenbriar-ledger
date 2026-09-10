// Which months the quote stack shows. Collapsed: the first mention and
// every month that carries a change chip. Expanded: every month that
// mentions the initiative. The months that mention it without a change
// are named in one line under the stack. Pure functions, tested.

import type { Initiative, Month } from "./types";
import { MONTHS } from "./types";
import { joinList, monthLabel, numberWord } from "./format";

export function mentionedMonths(i: Initiative): Month[] {
  return MONTHS.filter((m) => i.months[m]?.mentioned);
}

// The first mention and every month with a change.
export function keyMonths(i: Initiative): Month[] {
  const mentioned = mentionedMonths(i);
  return mentioned.filter((m, idx) => idx === 0 || !!i.months[m]?.change);
}

// Mentioned months that carry no change and are not the first mention.
export function quietMonths(i: Initiative): Month[] {
  const key = new Set(keyMonths(i));
  return mentionedMonths(i).filter((m) => !key.has(m));
}

export function stackMonths(i: Initiative, expanded: boolean): Month[] {
  return expanded ? mentionedMonths(i) : keyMonths(i);
}

// Unmentioned months after the last mention, among the months that have
// arrived. Empty when the last report mentions the initiative.
export function silentTail(i: Initiative): Month[] {
  const mentioned = mentionedMonths(i);
  if (!mentioned.length) return [];
  const last = MONTHS.indexOf(mentioned[mentioned.length - 1]);
  return MONTHS.slice(last + 1).filter((m) => i.months[m] && !i.months[m].mentioned);
}

// "February, April, and July mention the initiative without a change."
export function quietLine(i: Initiative): string | null {
  const quiet = quietMonths(i);
  if (!quiet.length) return null;
  const verb = quiet.length === 1 ? "mentions" : "mention";
  return `${joinList(quiet.map(monthLabel))} ${verb} the initiative without a change.`;
}

// "Show all eight months."
export function expandLabel(i: Initiative): string {
  return `Show all ${numberWord(mentionedMonths(i).length)} months`;
}
