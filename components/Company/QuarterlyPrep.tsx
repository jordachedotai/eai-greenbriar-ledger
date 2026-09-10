// Quarterly prep tab: a draft of the strategic-priorities slide. Two
// columns: the prior quarter's priorities with outcome and note, the next
// quarter's with a plan. Marked Draft. One button, Send to associate, a
// no-op. Companies without a draft say so.

import type { QuarterlyPrep as QuarterlyPrepT } from "@/lib/types";
import { getInitiative } from "@/lib/data";
import { fmtQuarter } from "@/lib/format";
import { YouChip } from "@/components/Portfolio/StatusPill";
import { Button, LABEL } from "@/components/ui/Button";

function prevQuarter(q: string): string {
  const m = /^(\d{4})-Q([1-4])$/.exec(q);
  if (!m) return q;
  const n = Number(m[2]);
  return n === 1 ? `${Number(m[1]) - 1}-Q4` : `${m[1]}-Q${n - 1}`;
}

export function QuarterlyPrep({ prep, companyName }: { prep?: QuarterlyPrepT; companyName: string }) {
  if (!prep) {
    return (
      <div className="px-7 pb-7 pt-[22px]">
        <section className="flex max-w-[760px] flex-col gap-2 rounded-[14px] border border-line bg-white px-[22px] py-5 shadow-[var(--shadow-card)]" data-testid="quarterly-empty">
          <span className="serif text-[20px] font-semibold">Quarterly prep</span>
          <span className="text-[15px] text-mut">No draft yet for this quarter for {companyName}.</span>
        </section>
      </div>
    );
  }
  const prior = fmtQuarter(prevQuarter(prep.quarter));
  const next = fmtQuarter(prep.quarter);
  const name = (id: string) => getInitiative(id)?.name ?? id;
  return (
    <div className="px-7 pb-7 pt-[22px]">
      <section className="flex flex-col gap-5 rounded-[14px] border border-line bg-white px-[22px] py-5 shadow-[var(--shadow-card)]" data-testid="quarterly-prep">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <span className="serif text-[22px] font-semibold leading-[1.2]">
                Strategic priorities, {prior} to {next}
              </span>
              <YouChip text="Draft" />
            </div>
            <span className="text-[14px] text-mut">Prior quarter against the January board list, next quarter as proposed. Every line is a draft for the associate to check before it goes near a slide.</span>
          </div>
          <Button variant="secondary" testId="send-to-associate">
            Send to associate
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-3" data-testid="quarterly-prior">
            <span className={LABEL}>{prior}: what was agreed, and where it stands</span>
            {prep.prior.map((row) => (
              <div key={row.initiativeId} className="flex flex-col gap-1 rounded-[10px] border border-line bg-white px-4 py-3">
                <span className="text-[15px] font-semibold">{name(row.initiativeId)}</span>
                <span className="text-[14px] leading-[1.45]">{row.outcome}</span>
                <span className="text-[13px] leading-[1.45] text-mut">{row.note}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3" data-testid="quarterly-next">
            <span className={LABEL}>{next}: proposed</span>
            {prep.next.map((row) => (
              <div key={row.initiativeId} className="flex flex-col gap-1 rounded-[10px] border border-line bg-white px-4 py-3">
                <span className="text-[15px] font-semibold">{name(row.initiativeId)}</span>
                <span className="text-[14px] leading-[1.45]">{row.plan}</span>
              </div>
            ))}
          </div>
        </div>

        <span className="text-[13px] text-mut">Draft. Nothing is sent until you approve it. The tool drafts against what the reports state; the judgment is yours.</span>
      </section>
    </div>
  );
}
