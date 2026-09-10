"use client";

// Four counts as tiles in the status colors. Clicking one filters the rows.
// The counts animate when they change (the scrubber, the reading log), so
// a move reads as a move. To the right: what the counts are made of.

import { useEffect, useRef, useState } from "react";
import type { Flag } from "@/lib/types";
import { FLAG_COLORS, FLAG_ORDER } from "@/lib/flags";
import type { StatusCounts } from "@/lib/data";
import { useStore } from "@/lib/store";

const SUB: Record<Flag, (c: StatusCounts) => string> = {
  red: () => "before the next CEO call",
  amber: () => "dates or numbers moved",
  grey: () => "went quiet, no closure stated",
  green: (c) => (c.delivered ? `including ${c.delivered} delivered` : "nothing moved"),
};

const TITLE: Record<Flag, string> = { red: "Need a conversation", amber: "Slipping", grey: "Not reported", green: "On track" };

export const COUNT_MS = 400;

// A number that counts up or down to its new value over COUNT_MS.
export function useAnimatedNumber(value: number, ms = COUNT_MS): number {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    if (start === value) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      const eased = 1 - (1 - t) * (1 - t);
      const v = Math.round(start + (value - start) * eased);
      setShown(v);
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      from.current = value;
    };
  }, [value, ms]);
  return shown;
}

export function WorkStrip({ counts, initiativeCount, companyCount, reportCount }: { counts: StatusCounts; initiativeCount: number; companyCount: number; reportCount: number }) {
  const filter = useStore((s) => s.workFilter);
  const setFilter = useStore((s) => s.setWorkFilter);
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3" data-testid="work-strip">
      <div className="flex gap-3">
        {FLAG_ORDER.map((flag) => (
          <Tile key={flag} flag={flag} count={counts[flag]} sub={SUB[flag](counts)} on={filter === flag} onClick={() => setFilter(filter === flag ? null : flag)} />
        ))}
      </div>
      <div className="flex flex-col items-end gap-1 text-[14px] text-mut">
        <span>
          {initiativeCount} initiatives across {companyCount} companies. Read from {reportCount} monthly reports.
        </span>
        <span>Every flag cites the page it came from.</span>
      </div>
    </div>
  );
}

function Tile({ flag, count, sub, on, onClick }: { flag: Flag; count: number; sub: string; on: boolean; onClick: () => void }) {
  const c = FLAG_COLORS[flag];
  const shown = useAnimatedNumber(count);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      data-testid={`work-${flag}`}
      className="flex min-w-[168px] flex-col items-start gap-0.5 rounded-[12px] px-[18px] py-3.5 text-left transition-shadow"
      style={{ background: c.bg, border: `1px solid ${on ? c.text : c.line}`, boxShadow: on ? `0 0 0 2px ${c.text}` : undefined }}
    >
      <span className="serif text-[34px] font-semibold leading-none" style={{ color: c.text }} data-testid={`count-${flag}`} data-value={count}>
        {shown}
      </span>
      <span className="text-[15px] font-semibold" style={{ color: c.text }}>
        {TITLE[flag]}
      </span>
      <span className="text-[13px] text-mut">{sub}</span>
    </button>
  );
}
