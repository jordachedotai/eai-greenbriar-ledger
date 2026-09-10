"use client";

// The month cells for one initiative: eight slots, January to August.
// A month that has arrived is the flag that month; hovering or focusing
// it opens the card with the sentence management wrote and its cite. A
// month beyond the cutoff is an empty slot with no card, so the grid
// holds still while the scrubber moves.

import type { Initiative, Month } from "@/lib/types";
import { MONTHS } from "@/lib/types";
import { monthLabel } from "@/lib/format";
import { HoverCell } from "./CellCard";

export function MonthCells({ initiative, months, size = 24 }: { initiative: Initiative; months: Month[]; size?: number }) {
  const arrived = new Set<string>(months);
  return (
    <div className="flex gap-1.5" data-testid="month-cells">
      {MONTHS.map((m) => {
        const r = arrived.has(m) ? initiative.months[m] : undefined;
        if (!r) return <EmptyCell key={m} month={m} size={size} />;
        return <HoverCell key={m} initiative={initiative} month={m} read={r} size={size} />;
      })}
    </div>
  );
}

// A slot for a month whose report has not arrived yet.
export function EmptyCell({ month, size = 24 }: { month: Month; size?: number }) {
  return <span className="inline-flex shrink-0 rounded-[6px] border border-dashed border-line" style={{ width: size, height: size }} title={`${monthLabel(month)}: report not in yet`} data-testid="empty-cell" data-month={month} />;
}

export function MonthLetters({ months }: { months: Month[] }) {
  const arrived = new Set<string>(months);
  return (
    <div className="flex gap-1.5">
      {MONTHS.map((m) => (
        <span key={m} className={"w-6 text-center text-[12px] " + (arrived.has(m) ? "text-mut" : "text-idle-text/70")} data-testid="month-letter" data-arrived={arrived.has(m) ? "true" : "false"}>
          {monthLabel(m)[0]}
        </span>
      ))}
    </div>
  );
}
