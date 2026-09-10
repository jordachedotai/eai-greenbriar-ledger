// Quarterly prep tab: a draft of the strategic-priorities slide, drawn as
// a slide. Title in serif: the company and the quarter. Two columns: the
// prior quarter (initiative, outcome, note) and the next quarter
// (initiative, plan). A Draft pill above it and one button, Send to
// associate, a no-op. Companies without a draft say so.

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
      <div className="flex max-w-[1120px] flex-col gap-3.5" data-testid="quarterly-prep">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <YouChip text="Draft" />
            <span className="text-[14px] text-mut">Strategic priorities slide, drafted from the reports. The associate checks every line before it goes in the deck.</span>
          </div>
          <Button variant="secondary" testId="send-to-associate">
            Send to associate
          </Button>
        </div>

        <section className="flex flex-col gap-7 rounded-[8px] border border-line bg-white px-12 pb-8 pt-10 shadow-[var(--shadow-card)]" data-testid="quarterly-slide">
          <div className="flex flex-col gap-1.5 border-b border-line pb-5">
            <span className="serif text-[32px] font-semibold leading-[1.15] tracking-[-0.01em]" data-testid="quarterly-title">
              {companyName}, {next}
            </span>
            <span className="text-[16px] text-mut">Strategic priorities: {prior} against the January board list, {next} as proposed.</span>
          </div>

          <div className="grid grid-cols-2 gap-12">
            <div className="flex flex-col" data-testid="quarterly-prior">
              <span className={LABEL + " pb-3"}>Prior quarter, {prior}</span>
              {prep.prior.map((row) => (
                <div key={row.initiativeId} className="flex flex-col gap-1 border-t border-line py-3.5">
                  <span className="text-[16px] font-semibold leading-[1.3]">{name(row.initiativeId)}</span>
                  <span className="text-[15px] leading-[1.45]">{row.outcome}</span>
                  <span className="text-[13px] leading-[1.45] text-mut">{row.note}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col" data-testid="quarterly-next">
              <span className={LABEL + " pb-3"}>Next quarter, {next}</span>
              {prep.next.map((row) => (
                <div key={row.initiativeId} className="flex flex-col gap-1 border-t border-line py-3.5">
                  <span className="text-[16px] font-semibold leading-[1.3]">{name(row.initiativeId)}</span>
                  <span className="text-[15px] leading-[1.45]">{row.plan}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-line pt-4 text-[12px] text-mut">
            <span>Draft. Every line is drawn from what the monthly reports state; the judgment is yours.</span>
            <span>Nothing is sent until you approve it.</span>
          </div>
        </section>
      </div>
    </div>
  );
}
