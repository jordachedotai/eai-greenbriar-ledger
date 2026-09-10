// The month cells for one initiative: eight slots, January to August.
// A month that has arrived is the flag that month, and its title is the
// sentence management wrote. A month beyond the cutoff is an empty slot,
// so the grid holds still while the scrubber moves.

import type { Initiative, Month } from "@/lib/types";
import { MONTHS } from "@/lib/types";
import { monthLabel } from "@/lib/format";
import { FLAG_COLORS } from "@/lib/flags";
import { FlagCell } from "./StatusPill";

export function MonthCells({ initiative, months }: { initiative: Initiative; months: Month[] }) {
  const arrived = new Set<string>(months);
  return (
    <div className="flex gap-1.5" data-testid="month-cells">
      {MONTHS.map((m) => {
        const r = arrived.has(m) ? initiative.months[m] : undefined;
        if (!r) return <EmptyCell key={m} month={m} />;
        const title = r.mentioned && r.quote ? `${monthLabel(m)}: ${FLAG_COLORS[r.flag].name}. ${r.quote}` : `${monthLabel(m)}: ${FLAG_COLORS[r.flag].name}. Not mentioned.`;
        return <FlagCell key={m} flag={r.flag} title={title} />;
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
