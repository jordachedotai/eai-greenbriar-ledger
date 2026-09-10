// "How flags are set." Printed from lib/flags.ts so the screen and the
// code cannot disagree. If the rules change in that file, this changes.

import { FLAG_COLORS, RULES } from "@/lib/flags";
import { FlagCell } from "@/components/Portfolio/StatusPill";
import { LABEL } from "@/components/ui/Button";

export function Criteria() {
  return (
    <div className="mt-2 flex flex-col gap-2 rounded-[10px] bg-panel2 px-3.5 py-3" data-testid="criteria">
      <span className={LABEL}>How flags are set</span>
      {RULES.map((r) => (
        <div key={r.flag} className="flex items-start gap-2 text-[13px] leading-[1.45] text-txt" data-testid={`rule-${r.flag}`}>
          <span className="mt-[3px] shrink-0">
            <FlagCell flag={r.flag} size={14} />
          </span>
          <span>
            <span className="font-semibold" style={{ color: FLAG_COLORS[r.flag].text }}>
              {r.label}.
            </span>{" "}
            {r.rule}
          </span>
        </div>
      ))}
      <span className="text-[12px] leading-[1.45] text-mut">These four rules live in one file, lib/flags.ts. The screen prints them from there.</span>
    </div>
  );
}
