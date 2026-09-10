"use client";

// The month scrubber: a slider from January to August 2026, eight stops,
// in the header on every page. It sets the month the reports have
// arrived through; cells, flags, pills, strip counts, questions,
// patterns, the Reports list, and the notes all follow. A native range
// input, so dragging and the arrow keys work; 44px tall for the hit
// target. Disabled while the reading log is streaming.

import { useStore } from "@/lib/store";
import { getDemoState } from "@/lib/data";
import { MONTHS, type Month } from "@/lib/types";
import { monthLabel, monthShort } from "@/lib/format";

const THUMB = 22;

export function MonthScrubber() {
  const stateName = useStore((s) => s.stateName);
  const working = useStore((s) => s.working);
  const setCutoff = useStore((s) => s.setCutoff);
  const cutoff = getDemoState(stateName).month;
  const idx = MONTHS.indexOf(cutoff);
  const pct = (i: number) => `calc(${THUMB / 2}px + (100% - ${THUMB}px) * ${i / (MONTHS.length - 1)})`;

  return (
    <div className="flex w-[344px] shrink-0 flex-col" data-testid="month-scrubber" data-cutoff={cutoff}>
      <div className="relative h-[44px]">
        <div className="pointer-events-none absolute left-[11px] right-[11px] top-[21px] h-[3px] rounded-full bg-white/22" />
        <div className="pointer-events-none absolute left-[11px] top-[21px] h-[3px] rounded-full bg-white/85" style={{ width: `calc((100% - ${THUMB}px) * ${idx / (MONTHS.length - 1)})` }} />
        {MONTHS.map((m, i) => (
          <span key={m} className="pointer-events-none absolute top-[19px] h-[7px] w-[7px] -translate-x-1/2 rounded-full" style={{ left: pct(i), background: i <= idx ? "#ffffff" : "rgba(255,255,255,0.35)" }} />
        ))}
        <input
          type="range"
          min={0}
          max={MONTHS.length - 1}
          step={1}
          value={idx}
          disabled={!!working}
          onChange={(e) => setCutoff(MONTHS[Number(e.target.value)] as Month)}
          aria-label="Reports arrived through"
          aria-valuetext={`${monthLabel(cutoff)} 2026`}
          title={`Reports arrived through ${monthLabel(cutoff)} 2026. Drag, or use the arrow keys.`}
          className="scrubber absolute inset-0 h-[44px] w-full cursor-pointer"
          data-testid="month-slider"
        />
      </div>
      <div className="relative -mt-[6px] h-[14px]">
        {MONTHS.map((m, i) => (
          <button
            key={m}
            type="button"
            tabIndex={-1}
            disabled={!!working}
            onClick={() => setCutoff(m)}
            className={"absolute top-0 -translate-x-1/2 text-[12px] leading-[14px] " + (i === idx ? "font-bold text-white" : i < idx ? "font-medium text-white/75 hover:text-white" : "font-medium text-white/45 hover:text-white/80")}
            style={{ left: pct(i) }}
            data-testid={`month-${m}`}
            aria-current={i === idx ? "true" : undefined}
          >
            {monthShort(m)}
          </button>
        ))}
      </div>
    </div>
  );
}
