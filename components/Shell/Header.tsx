"use client";

// The header band. Dark green, serif title, subtitle, the month toggle on
// Portfolio, the Demo data tag, the presenter button. On a company page: a
// breadcrumb, the company name, CEO and next call.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore, type MonthView } from "@/lib/store";
import { getCompanies, getCompany, getLedgerMeta } from "@/lib/data";
import { fmtCallDate } from "@/lib/format";
import { IconChevronRight, IconPresenter } from "@/components/ui/icons";

const TITLES: Record<string, { title: string; sub: (n: number) => string }> = {
  "/portfolio": { title: "Portfolio", sub: () => "Initiatives, January to August 2026" },
  "/patterns": { title: "Patterns", sub: (n) => `Across ${n} companies, January to August 2026` },
  "/reports": { title: "Reports", sub: (n) => `${getLedgerMeta().reportCount} monthly reports, ${n} companies` },
  "/log": { title: "Learning log", sub: () => "What the team has learned, by company" },
  "/settings": { title: "Settings", sub: () => "" },
};

export function Header() {
  const pathname = usePathname();
  const base = "/" + (pathname.split("/")[1] ?? "");
  const isCompany = base === "/portfolio" && pathname !== "/portfolio";
  const company = isCompany ? getCompany(pathname.split("/")[2]) : undefined;
  const mockMode = useStore((s) => s.mockMode);
  const showDemoTag = useStore((s) => s.showDemoTag);
  const setPresenterOpen = useStore((s) => s.setPresenterOpen);
  const presenterOpen = useStore((s) => s.presenterOpen);
  const companyCount = getCompanies().length;
  const t = TITLES[base];

  return (
    <header className="flex h-[64px] shrink-0 items-center justify-between bg-header px-7 text-white">
      {isCompany ? (
        <div className="flex items-baseline gap-3.5 text-[16px]">
          <Link href="/portfolio" className="text-white/72 hover:text-white">
            Portfolio
          </Link>
          <IconChevronRight size={14} stroke="rgba(255,255,255,0.5)" className="self-center" />
          <span className="serif text-[22px] font-semibold" data-testid="header-title">
            {company?.name ?? ""}
          </span>
          {company ? (
            <span className="text-[15px] text-white/72">
              {company.ceo.name}, {company.ceo.title} · Next call {fmtCallDate(company.nextCall)}
            </span>
          ) : null}
        </div>
      ) : (
        <div className="flex items-baseline gap-3.5">
          <span className="serif text-[24px] font-semibold tracking-[-0.01em]" data-testid="header-title">
            {t?.title ?? "Greenbriar"}
          </span>
          {t?.sub(companyCount) ? <span className="text-[15px] text-white/72">{t.sub(companyCount)}</span> : null}
        </div>
      )}
      <div className="flex items-center gap-3">
        {base === "/portfolio" && !isCompany ? <MonthToggle /> : null}
        {showDemoTag ? (
          <span className="rounded-full bg-white/12 px-2.5 py-1 text-[13px] font-medium text-white/90" data-testid="mode-tag">
            {mockMode ? "Demo data" : "Live agent"}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => setPresenterOpen(!presenterOpen)}
          title="Presenter menu (Shift+P)"
          data-testid="presenter-toggle"
          className={"inline-flex h-[30px] w-[30px] items-center justify-center rounded-[8px] " + (presenterOpen ? "bg-white text-header" : "bg-white/12 text-white hover:bg-white/20")}
        >
          <IconPresenter size={16} />
        </button>
      </div>
    </header>
  );
}

// July / August 2026. Visual only until the demo states arrive.
export function MonthToggle() {
  const month = useStore((s) => s.month);
  const setMonth = useStore((s) => s.setMonth);
  const options: [MonthView, string][] = [
    ["2026-07", "July"],
    ["2026-08", "August 2026"],
  ];
  return (
    <div className="flex items-center rounded-[8px] border border-white/18 bg-white/10 p-[3px]" role="tablist" aria-label="Month">
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          role="tab"
          aria-selected={month === v}
          onClick={() => setMonth(v)}
          data-testid={`month-${v}`}
          className={"rounded-[6px] px-3 py-[5px] text-[14px] " + (month === v ? "bg-white font-semibold text-header" : "font-medium text-white/85 hover:text-white")}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
