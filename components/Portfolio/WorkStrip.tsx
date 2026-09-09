"use client";

// Four counts as tiles in the status colors. Clicking one filters the rows.
// To the right: what the counts are made of.

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

export function WorkStrip({ counts, initiativeCount, companyCount, reportCount }: { counts: StatusCounts; initiativeCount: number; companyCount: number; reportCount: number }) {
  const filter = useStore((s) => s.workFilter);
  const setFilter = useStore((s) => s.setWorkFilter);
  return (
    <div className="flex items-end justify-between" data-testid="work-strip">
      <div className="flex gap-3">
        {FLAG_ORDER.map((flag) => {
          const c = FLAG_COLORS[flag];
          const on = filter === flag;
          return (
            <button
              key={flag}
              type="button"
              onClick={() => setFilter(on ? null : flag)}
              aria-pressed={on}
              data-testid={`work-${flag}`}
              className="flex min-w-[168px] flex-col items-start gap-0.5 rounded-[12px] px-[18px] py-3.5 text-left transition-shadow"
              style={{ background: c.bg, border: `1px solid ${on ? c.text : c.line}`, boxShadow: on ? `0 0 0 2px ${c.text}` : undefined }}
            >
              <span className="serif text-[34px] font-semibold leading-none" style={{ color: c.text }} data-testid={`count-${flag}`}>
                {counts[flag]}
              </span>
              <span className="text-[15px] font-semibold" style={{ color: c.text }}>
                {TITLE[flag]}
              </span>
              <span className="text-[13px] text-mut">{SUB[flag](counts)}</span>
            </button>
          );
        })}
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
