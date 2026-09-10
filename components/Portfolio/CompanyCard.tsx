// One card per company: name, CEO, next call and counts, the column labels,
// and one row per initiative.

import type { Company, Initiative, Month } from "@/lib/types";
import { statusCounts } from "@/lib/data";
import { fmtCallDate, monthLabel, plural } from "@/lib/format";
import { InitiativeRow, ROW_GRID } from "./InitiativeRow";
import { MonthLetters } from "./MonthCells";

export function CompanyCard({ company, initiatives, shown, months }: { company: Company; initiatives: Initiative[]; shown: Initiative[]; months: Month[] }) {
  const month = months[months.length - 1];
  const c = statusCounts(initiatives);
  const parts = [`Next call ${fmtCallDate(company.nextCall)}`, plural(initiatives.length, "initiative")];
  if (c.red) parts.push(`${c.red} ${c.red === 1 ? "needs" : "need"} a conversation`);
  if (c.amber) parts.push(`${c.amber} slipping`);
  if (c.grey) parts.push(`${c.grey} not reported`);
  return (
    <section className="flex flex-col gap-2.5 rounded-[14px] border border-line bg-white px-5 pb-4 pt-[18px] shadow-[var(--shadow-card)]" data-testid="company-card" data-company={company.id}>
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-3">
          <span className="text-[18px] font-semibold">{company.name}</span>
          <span className="text-[14px] text-mut">
            {company.ceo.name}, {company.ceo.title}
          </span>
        </div>
        <span className="text-[14px] text-mut">{parts.join(" · ")}</span>
      </div>
      <div className={ROW_GRID + " px-4"}>
        <span className={label}>Initiative</span>
        <MonthLetters months={months} />
        <span className={label}>Where it stands in {monthLabel(month)}</span>
        <span />
      </div>
      <div className="flex flex-col gap-2">
        {shown.map((i) => (
          <InitiativeRow key={i.id} initiative={i} months={months} />
        ))}
        {shown.length === 0 ? <div className="px-4 py-3 text-[14px] text-mut">No initiatives in this filter.</div> : null}
      </div>
    </section>
  );
}

const label = "text-[13px] font-semibold uppercase tracking-[0.04em] text-mut";
