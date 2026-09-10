// One initiative: name and board target, eight month cells, the status pill
// with one sentence, an optional blue chip, and Open. Red and grey rows get
// the colored left border.

import Link from "next/link";
import type { Initiative } from "@/lib/types";
import { FLAG_COLORS } from "@/lib/flags";
import { MonthCells } from "./MonthCells";
import { StatusPill, YouChip } from "./StatusPill";

export const ROW_GRID = "grid grid-cols-[270px_234px_1fr_64px] items-center gap-4";

export function InitiativeRow({ initiative }: { initiative: Initiative }) {
  const { flag } = initiative.status;
  const c = FLAG_COLORS[flag];
  const edged = flag === "red" || flag === "grey";
  return (
    <div
      className={ROW_GRID + " rounded-[12px] bg-white px-4 py-3"}
      style={{ border: `1px solid ${edged ? c.line : "#dde3da"}`, borderLeft: edged ? `4px solid ${c.text}` : undefined }}
      data-testid="initiative-row"
      data-initiative={initiative.id}
      data-flag={flag}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[16px] font-semibold leading-[1.25]">{initiative.name}</span>
        <span className="text-[13px] text-mut">Board target: {initiative.boardTarget}</span>
      </div>
      <MonthCells initiative={initiative} />
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="shrink-0">
          <StatusPill flag={flag} text={initiative.status.pill} />
        </span>
        <span className="min-w-0 flex-1 text-[14px] leading-[1.45] text-txt" style={{ paddingTop: 1 }} data-testid="status-sentence">
          {initiative.status.sentence}
          {initiative.status.chip ? (
            <>
              {" "}
              <YouChip text={initiative.status.chip.text} />
            </>
          ) : null}
        </span>
      </div>
      <Link href={`/portfolio/${initiative.companyId}?initiative=${initiative.id}`} className="text-right text-[15px] font-semibold text-brand hover:text-brand2" data-testid="open-initiative">
        Open
      </Link>
    </div>
  );
}
