// "How flags are set." Printed from lib/flags.ts so the screen and the
// code cannot disagree. If the rules change in that file, this changes.
// The closing line names the deal lead, from users.json, never a file.

import { FLAG_COLORS, RULES } from "@/lib/flags";
import { getCurrentUser } from "@/lib/data";
import { FlagCell } from "@/components/Portfolio/StatusPill";
import { LABEL } from "@/components/ui/Button";

export function Criteria() {
  const firstName = getCurrentUser().name.split(" ")[0];
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
      <span className="text-[12px] leading-[1.45] text-mut" data-testid="criteria-note">
        {firstName} can change these rules.
      </span>
    </div>
  );
}
