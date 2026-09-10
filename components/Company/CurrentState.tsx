"use client";

// Current state tab: the company's current-state file, a short list of
// lines with dates, in the deal team's format. Draft lines (from "Dictate
// a note") carry a Draft chip and a Review control that confirms them.
// Which lines exist, and whether the draft shows, is decided by the caller
// through lib/data.

import type { CurrentState as CurrentStateT } from "@/lib/types";
import { fmtShortDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { YouChip } from "@/components/Portfolio/StatusPill";
import { Button } from "@/components/ui/Button";

export function CurrentState({ state, companyName }: { state?: CurrentStateT; companyName: string }) {
  const reviewNote = useStore((s) => s.reviewNote);
  const lines = state?.lines ?? [];
  return (
    <div className="px-7 pb-7 pt-[22px]">
      <section className="flex max-w-[760px] flex-col gap-4 rounded-[14px] border border-line bg-white px-[22px] py-5 shadow-[var(--shadow-card)]" data-testid="current-state">
        <div className="flex items-baseline justify-between gap-4">
          <span className="serif text-[20px] font-semibold">Current state</span>
          {state ? <span className="text-[13px] text-mut">Updated {fmtShortDate(state.updated)}. Kept by the deal team, in their format.</span> : null}
        </div>
        {lines.length ? (
          <ul className="flex flex-col gap-3">
            {lines.map((l, i) => (
              <li key={i} className="grid grid-cols-[64px_1fr] items-start gap-4" data-testid="state-line" data-status={l.status ?? "kept"}>
                <span className="pt-0.5 text-[13px] text-mut">{fmtShortDate(l.date)}</span>
                <div className="flex flex-col gap-2">
                  <span className="text-[15px] leading-[1.45]">{l.text}</span>
                  {l.status === "draft" ? (
                    <div className="flex items-center gap-2.5">
                      <YouChip text="Draft" />
                      <Button variant="you" size={36} testId="review-state-line" onClick={reviewNote}>
                        Review
                      </Button>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-[15px] text-mut">No current-state file for {companyName} yet.</span>
        )}
      </section>
    </div>
  );
}
