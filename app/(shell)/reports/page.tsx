"use client";

// The monthly reports that have arrived, by company and month. Every cite
// in the app lands on one of these at the page it names.

import Link from "next/link";
import { getCompanies, getMonths, getReports } from "@/lib/data";
import { useStateName } from "@/lib/view";
import { monthLabel, numberWord, plural } from "@/lib/format";

export default function ReportsPage() {
  const stateName = useStateName();
  const companies = getCompanies(stateName);
  const all = getReports(undefined, stateName);
  const months = getMonths(stateName);
  const last = monthLabel(months[months.length - 1]);
  const countWord = numberWord(all.length);
  return (
    <div className="flex flex-col gap-3.5 px-7 pb-7 pt-[22px]" data-testid="reports">
      <span className="text-[15px] text-mut">
        {countWord.charAt(0).toUpperCase() + countWord.slice(1)} monthly reports, {numberWord(companies.length)} companies, January to {last} 2026. Every cite in the ledger links to a page here.
      </span>
      {companies.map((c) => {
        const own = getReports(c.id, stateName);
        return (
          <section key={c.id} className="flex flex-col gap-2.5 rounded-[14px] border border-line bg-white px-5 pb-4 pt-[18px] shadow-[var(--shadow-card)]" data-testid="report-group" data-company={c.id}>
            <div className="flex items-baseline gap-3">
              <span className="text-[18px] font-semibold">{c.name}</span>
              <span className="text-[14px] text-mut">
                {c.ceo.name}, {c.ceo.title} · {plural(own.length, "report")}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {own.map((r) => (
                <Link key={r.id} href={`/reports/${r.id}`} className="flex flex-col gap-0.5 rounded-[10px] border border-line bg-white px-3.5 py-3 hover:border-brand" data-testid="report-link" data-report={r.id}>
                  <span className="text-[15px] font-semibold">{monthLabel(r.month)} 2026</span>
                  <span className="text-[13px] text-mut">{plural(r.pages.length, "page")} · Monthly report to the board</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
