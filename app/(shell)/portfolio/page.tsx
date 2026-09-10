"use client";

// The grid: companies by initiatives by months, as the loaded demo state
// shows them. `july` has seven month cells and no August read; `august`
// has all eight; `monday` has all twelve companies. Loading one over
// another re-renders in place.

import { getCompanies, getInitiatives, getLedgerMeta, getMonths, statusCounts } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useStateName } from "@/lib/view";
import { WorkStrip } from "@/components/Portfolio/WorkStrip";
import { CompanyCard } from "@/components/Portfolio/CompanyCard";

export default function PortfolioPage() {
  const filter = useStore((s) => s.workFilter);
  const stateName = useStateName();
  const companies = getCompanies(stateName);
  const months = getMonths(stateName);
  const all = getInitiatives(undefined, stateName);
  const counts = statusCounts(all);
  const meta = getLedgerMeta(stateName);
  return (
    <div className="flex flex-col gap-[18px] px-7 pb-7 pt-[22px]" data-testid="portfolio" data-state={stateName}>
      <WorkStrip counts={counts} initiativeCount={all.length} companyCount={companies.length} reportCount={meta.reportCount} />
      <div className="flex flex-col gap-3.5">
        {companies.map((c) => {
          const own = getInitiatives(c.id, stateName);
          const shown = filter ? own.filter((i) => i.status.flag === filter) : own;
          return <CompanyCard key={c.id} company={c} initiatives={own} shown={shown} months={months} />;
        })}
      </div>
    </div>
  );
}
