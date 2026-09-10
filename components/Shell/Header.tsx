"use client";

// The header band. Dark green, serif title, subtitle, the month toggle on
// Portfolio, the Demo data tag, the presenter button. On a company page: a
// breadcrumb, the company name, CEO and next call. The subtitle and the
// month toggle follow the loaded demo state.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { getCompanies, getCompany, getDemoState, getLedgerMeta } from "@/lib/data";
import { fmtCallDate, monthLabel } from "@/lib/format";
import { IconChevronRight, IconPresenter } from "@/components/ui/icons";

const TITLES: Record<string, { title: string; sub: (n: number, span: string, reports: number) => string }> = {
  "/portfolio": { title: "Portfolio", sub: (_n, span) => `Initiatives, ${span}` },
  "/patterns": { title: "Patterns", sub: (n, span) => `Across ${n} companies, ${span}` },
  "/reports": { title: "Reports", sub: (n, _span, reports) => `${reports} monthly reports, ${n} companies` },
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
  const stateName = useStore((s) => s.stateName);
  const setPresenterOpen = useStore((s) => s.setPresenterOpen);
  const presenterOpen = useStore((s) => s.presenterOpen);
  const state = getDemoState(stateName);
  const companyCount = getCompanies(stateName).length;
  const span = `January to ${monthLabel(state.month)} 2026`;
  const t = TITLES[base];
  const sub = t?.sub(companyCount, span, getLedgerMeta(stateName).reportCount);

  return (
    <header className="flex h-[64px] shrink-0 items-center justify-between bg-header px-7 text-white" data-state={stateName}>
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
          {sub ? (
            <span className="text-[15px] text-white/72" data-testid="header-sub">
              {sub}
            </span>
          ) : null}
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

// July / August 2026. Shows the loaded state's month. Clicking July loads
// `july`; clicking August loads `august`, unless an August state is
// already loaded. The same thing as Jump to state in the presenter menu.
export function MonthToggle() {
  const stateName = useStore((s) => s.stateName);
  const working = useStore((s) => s.working);
  const loadState = useStore((s) => s.loadState);
  const current = getDemoState(stateName).month;
  const options: [string, string, string][] = [
    ["2026-07", "July", "july"],
    ["2026-08", "August 2026", "august"],
  ];
  return (
    <div className="flex items-center rounded-[8px] border border-white/18 bg-white/10 p-[3px]" role="tablist" aria-label="Month">
      {options.map(([m, text, target]) => {
        const on = current === m;
        return (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={on}
            disabled={!!working}
            onClick={() => {
              if (!on && !working) loadState(target);
            }}
            data-testid={`month-${m}`}
            className={"rounded-[6px] px-3 py-[5px] text-[14px] " + (on ? "bg-white font-semibold text-header" : "font-medium text-white/85 hover:text-white")}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}
