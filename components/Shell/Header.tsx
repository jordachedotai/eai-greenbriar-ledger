"use client";

// The header band. Dark green, serif title, subtitle, the "Go back in
// time" button, the Demo data tag, the presenter button. On a company
// page: a breadcrumb and the company name (CEO and next call sit in the
// tabs row, where there is room). The subtitle follows the loaded state;
// the Time Machine changes which months have arrived on every page.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { getCompanies, getCompany, getDemoState, getLedgerMeta } from "@/lib/data";
import { monthLabel } from "@/lib/format";
import { IconChevronRight, IconClockBack, IconPresenter } from "@/components/ui/icons";

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
  const timeMachineOpen = useStore((s) => s.timeMachineOpen);
  const setTimeMachineOpen = useStore((s) => s.setTimeMachineOpen);
  const working = useStore((s) => s.working);
  const reading = useStore((s) => s.reading);
  const state = getDemoState(stateName);
  const companyCount = getCompanies(stateName).length;
  const span = `January to ${monthLabel(state.month)} 2026`;
  const t = TITLES[base];
  const sub = t?.sub(companyCount, span, getLedgerMeta(stateName).reportCount);

  return (
    <header className="flex h-[64px] shrink-0 items-center justify-between gap-5 bg-header px-7 text-white" data-state={stateName} data-cutoff={state.month}>
      {isCompany ? (
        <div className="flex min-w-0 items-baseline gap-3.5 text-[16px]">
          <Link href="/portfolio" className="text-white/72 hover:text-white">
            Portfolio
          </Link>
          <IconChevronRight size={14} stroke="rgba(255,255,255,0.5)" className="self-center" />
          <span className="serif whitespace-nowrap text-[22px] font-semibold" data-testid="header-title">
            {company?.name ?? ""}
          </span>
        </div>
      ) : (
        <div className="flex min-w-0 items-baseline gap-3.5">
          <span className="serif whitespace-nowrap text-[24px] font-semibold tracking-[-0.01em]" data-testid="header-title">
            {t?.title ?? "Greenbriar"}
          </span>
          {sub ? (
            <span className="truncate text-[15px] text-white/72" data-testid="header-sub">
              {sub}
            </span>
          ) : null}
        </div>
      )}
      <div className="flex shrink-0 items-center gap-4">
        {base !== "/settings" ? (
          <button
            type="button"
            onClick={() => setTimeMachineOpen(!timeMachineOpen)}
            disabled={!!working || !!reading}
            title="See the ledger as it stood in an earlier month"
            data-testid="time-machine-open"
            className={"inline-flex h-[30px] items-center gap-2 rounded-[8px] px-3 text-[14px] font-semibold disabled:opacity-60 " + (timeMachineOpen ? "bg-white text-header" : "bg-white/12 text-white hover:bg-white/20")}
          >
            <IconClockBack size={16} />
            Go back in time
          </button>
        ) : null}
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
