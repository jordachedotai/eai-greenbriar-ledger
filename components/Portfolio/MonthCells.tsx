// Eight month cells for one initiative. Each cell is the flag that month,
// and its title is the sentence management wrote, so hovering shows the quote.

import type { Initiative } from "@/lib/types";
import { MONTHS } from "@/lib/types";
import { monthLabel } from "@/lib/format";
import { FLAG_COLORS } from "@/lib/flags";
import { FlagCell } from "./StatusPill";

export function MonthCells({ initiative }: { initiative: Initiative }) {
  return (
    <div className="flex gap-1.5" data-testid="month-cells">
      {MONTHS.map((m) => {
        const r = initiative.months[m];
        const title = r.mentioned && r.quote ? `${monthLabel(m)}: ${FLAG_COLORS[r.flag].name}. ${r.quote}` : `${monthLabel(m)}: ${FLAG_COLORS[r.flag].name}. Not mentioned.`;
        return <FlagCell key={m} flag={r.flag} title={title} />;
      })}
    </div>
  );
}

export function MonthLetters() {
  return (
    <div className="flex gap-1.5">
      {MONTHS.map((m) => (
        <span key={m} className="w-6 text-center text-[12px] text-mut">
          {monthLabel(m)[0]}
        </span>
      ))}
    </div>
  );
}
