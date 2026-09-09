"use client";

// The grid: companies by initiatives by months. State `august`.

import { getCompanies, getInitiatives, getLedgerMeta, statusCounts } from "@/lib/data";
import { useStore } from "@/lib/store";
import { WorkStrip } from "@/components/Portfolio/WorkStrip";
import { CompanyCard } from "@/components/Portfolio/CompanyCard";

export default function PortfolioPage() {
  const filter = useStore((s) => s.workFilter);
  const month = useStore((s) => s.month);
  const companies = getCompanies();
  const all = getInitiatives();
  const counts = statusCounts(all);
  const meta = getLedgerMeta();
  return (
    <div className="flex flex-col gap-[18px] px-7 pb-7 pt-[22px]" data-testid="portfolio">
      <WorkStrip counts={counts} initiativeCount={all.length} companyCount={companies.length} reportCount={meta.reportCount} />
      <div className="flex flex-col gap-3.5">
        {companies.map((c) => {
          const own = getInitiatives(c.id);
          const shown = filter ? own.filter((i) => i.status.flag === filter) : own;
          return <CompanyCard key={c.id} company={c} initiatives={own} shown={shown} month={month} />;
        })}
      </div>
    </div>
  );
}
