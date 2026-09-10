"use client";

// The amber band under the header while a past month is in view:
// "Viewing March 2026. Return to August." So the presenter never loses
// the room. Absent at the last month of the ledger.

import { useStore } from "@/lib/store";
import { getDemoState } from "@/lib/data";
import { LAST_MONTH } from "@/lib/states";
import { MONTHS } from "@/lib/types";
import { monthLabel } from "@/lib/format";
import { IconClockBack } from "@/components/ui/icons";

export function TimeBand() {
  const stateName = useStore((s) => s.stateName);
  const setCutoff = useStore((s) => s.setCutoff);
  const setOpen = useStore((s) => s.setTimeMachineOpen);
  const working = useStore((s) => s.working);
  const state = getDemoState(stateName);
  if (state.month === LAST_MONTH) return null;
  const unread = MONTHS.slice(MONTHS.indexOf(state.month) + 1);
  const unreadLine = unread.length === 1 ? `${monthLabel(unread[0])} not yet read.` : `${monthLabel(unread[0])} to ${monthLabel(unread[unread.length - 1])} not yet read.`;
  return (
    <div className="flex h-9 shrink-0 items-center gap-4 border-b px-7 text-[14px]" style={{ background: "#fbf3dd", borderColor: "#f0e2b8", color: "#8a5a08" }} data-testid="time-band" data-month={state.month}>
      <span>
        <span className="font-semibold">Viewing {monthLabel(state.month)} 2026.</span> Reports read through {monthLabel(state.month)}. {unreadLine}
      </span>
      <span className="ml-auto flex items-center gap-4">
        <button type="button" onClick={() => setOpen(true)} disabled={!!working} className="inline-flex items-center gap-1.5 font-semibold hover:underline disabled:opacity-60" data-testid="time-band-open">
          <IconClockBack size={15} />
          Go back in time
        </button>
        <button type="button" onClick={() => setCutoff(LAST_MONTH)} disabled={!!working} className="font-semibold underline decoration-dotted underline-offset-[3px] hover:decoration-solid disabled:opacity-60" data-testid="time-band-return">
          Return to {monthLabel(LAST_MONTH)}.
        </button>
      </span>
    </div>
  );
}
