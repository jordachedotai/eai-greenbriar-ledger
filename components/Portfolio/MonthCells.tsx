// The month cells for one initiative, one per month that has arrived.
// Each cell is the flag that month, and its title is the sentence
// management wrote, so hovering shows the quote.

import type { Initiative, Month } from "@/lib/types";
import { monthLabel } from "@/lib/format";
import { FLAG_COLORS } from "@/lib/flags";
import { FlagCell } from "./StatusPill";

export function MonthCells({ initiative, months }: { initiative: Initiative; months: Month[] }) {
  return (
    <div className="flex gap-1.5" data-testid="month-cells">
      {months.map((m) => {
        const r = initiative.months[m];
        if (!r) return null;
        const title = r.mentioned && r.quote ? `${monthLabel(m)}: ${FLAG_COLORS[r.flag].name}. ${r.quote}` : `${monthLabel(m)}: ${FLAG_COLORS[r.flag].name}. Not mentioned.`;
        return <FlagCell key={m} flag={r.flag} title={title} />;
      })}
    </div>
  );
}

export function MonthLetters({ months }: { months: Month[] }) {
  return (
    <div className="flex gap-1.5">
      {months.map((m) => (
        <span key={m} className="w-6 text-center text-[12px] text-mut" data-testid="month-letter">
          {monthLabel(m)[0]}
        </span>
      ))}
    </div>
  );
}
