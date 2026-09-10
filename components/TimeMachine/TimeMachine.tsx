"use client";

// The Time Machine. "Go back in time" dims the shell and turns the current
// page into a card in a stack: one card per month, January to August,
// each a real render of that month's state (the same page, through a
// ViewProvider). The viewed month is in front; earlier months recede
// behind it, their title strips peeking out; later months have dropped
// away below. A timeline down the right edge lists the months, newest at
// the bottom. Clicking a month, a strip, or pressing the arrow keys moves
// the cutoff, and the cards slide into place over about 500ms; the front
// card is live (hover a cell for its quote), the others are inert. The
// bottom bar names the viewed month and offers Return to August. Escape
// closes the stack and keeps the viewed month; the amber band under the
// header then says so. Reduced motion gets instant swaps.

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { ViewProvider } from "@/lib/view";
import { getDemoState, getLedgerMeta } from "@/lib/data";
import { LAST_MONTH, stateCounts, viewKey } from "@/lib/states";
import { FLAG_COLORS, FLAG_ORDER } from "@/lib/flags";
import { MONTHS, type Month } from "@/lib/types";
import { monthLabel, plural } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { IconClockBack } from "@/components/ui/icons";
import { CompanyView } from "@/components/Company/CompanyView";
import PortfolioPage from "@/app/(shell)/portfolio/page";
import PatternsPage from "@/app/(shell)/patterns/page";
import ReportsPage from "@/app/(shell)/reports/page";
import LogPage from "@/app/(shell)/log/page";

export const TRAVEL_MS = 500;
const DEPTHS_SHOWN = 3; // ghost cards behind the front one
const OPACITY = [1, 0.8, 0.55, 0.3];

// The page a card renders for a path, or null when the path has no card
// (a report page, Settings): the stack closes there.
function pageFor(pathname: string): React.ReactNode | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "portfolio" && parts[1]) return <CompanyView id={parts[1]} />;
  if (parts[0] === "portfolio") return <PortfolioPage />;
  if (parts[0] === "patterns") return <PatternsPage />;
  if (parts[0] === "reports" && !parts[1]) return <ReportsPage />;
  if (parts[0] === "log") return <LogPage />;
  return null;
}

export function hasCard(pathname: string): boolean {
  return pageFor(pathname) !== null;
}

export function TimeMachine() {
  const open = useStore((s) => s.timeMachineOpen);
  const pathname = usePathname();
  const setOpen = useStore((s) => s.setTimeMachineOpen);
  const cardable = hasCard(pathname);

  // A page with no card (a report page) closes the stack.
  useEffect(() => {
    if (open && !cardable) setOpen(false);
  }, [open, cardable, setOpen]);

  if (!open || !cardable) return null;
  return <Stack pathname={pathname} />;
}

function Stack({ pathname }: { pathname: string }) {
  const stateName = useStore((s) => s.stateName);
  const setCutoff = useStore((s) => s.setCutoff);
  const setOpen = useStore((s) => s.setTimeMachineOpen);
  const state = getDemoState(stateName);
  const viewed = state.month;
  const idx = MONTHS.indexOf(viewed);
  const [hover, setHover] = useState<Month | null>(null);
  const current = useRef<HTMLButtonElement>(null);

  const travel = (m: Month) => setCutoff(m);
  const close = () => setOpen(false);
  const home = () => {
    setCutoff(LAST_MONTH);
    setOpen(false);
  };

  useEffect(() => {
    current.current?.focus();
  }, [viewed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;
      const i = MONTHS.indexOf(useStore.getState().stateName ? getDemoState(useStore.getState().stateName).month : viewed);
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        if (i > 0) travel(MONTHS[i - 1]);
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        if (i < MONTHS.length - 1) travel(MONTHS[i + 1]);
      } else if (e.key === "Home") {
        e.preventDefault();
        travel(MONTHS[0]);
      } else if (e.key === "End") {
        e.preventDefault();
        travel(LAST_MONTH);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const atHome = viewed === LAST_MONTH;
  const unread = MONTHS.slice(idx + 1);
  const unreadLine = unread.length === 0 ? "Every report has arrived." : unread.length === 1 ? `${monthLabel(unread[0])} not yet read.` : `${monthLabel(unread[0])} to ${monthLabel(unread[unread.length - 1])} not yet read.`;

  return (
    <div className="tm-backdrop fixed inset-0 z-[45] flex" style={{ background: "rgba(6, 16, 9, 0.9)" }} role="dialog" aria-modal="true" aria-label="Go back in time" data-testid="time-machine" data-viewed={viewed} data-set={state.set}>
      <div className="relative min-w-0 flex-1">
        {MONTHS.map((m) => {
          const d = idx - MONTHS.indexOf(m); // 0 front, positive behind, negative dropped
          const key = viewKey({ set: state.set, cutoff: m });
          return <Card key={key} stateName={key} month={m} depth={d} pathname={pathname} onPick={() => travel(m)} />;
        })}
        <div className="absolute inset-x-0 bottom-0 flex h-[100px] items-center justify-between px-10 text-white" data-testid="tm-bar">
          <div className="flex flex-col">
            <span className="serif text-[26px] font-semibold leading-none" data-testid="tm-viewed">
              {monthLabel(viewed)} 2026
            </span>
            <span className="mt-1.5 text-[14px] text-white/70">
              Reports read through {monthLabel(viewed)}. {unreadLine}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {atHome ? null : (
              <button type="button" onClick={close} className="h-10 rounded-[10px] border border-white/30 px-[18px] text-[15px] font-semibold text-white hover:bg-white/10" data-testid="tm-stay">
                Keep viewing {monthLabel(viewed)}
              </button>
            )}
            <Button variant="brand" onClick={home} testId="tm-return" className="bg-green hover:bg-[#178a4b]">
              {atHome ? "Close" : `Return to ${monthLabel(LAST_MONTH)}`}
            </Button>
          </div>
        </div>
      </div>
      <Timeline viewed={viewed} set={state.set} hover={hover} setHover={setHover} onPick={travel} currentRef={current} />
    </div>
  );
}

// The layout of a card by its distance from the front: behind cards
// shrink from the top edge and step up, so their strips peek out above
// the front card; dropped cards fall out of the bottom of the stage.
function layout(depth: number): React.CSSProperties {
  if (depth < 0) return { transform: "translate(-50%, 70vh) scale(1.03)", opacity: 0, zIndex: 40, pointerEvents: "none" };
  const shown = depth <= DEPTHS_SHOWN;
  return {
    transform: `translate(-50%, ${-46 * depth}px) scale(${1 - 0.04 * depth})`,
    opacity: shown ? OPACITY[depth] : 0,
    zIndex: 30 - depth,
    pointerEvents: shown ? undefined : "none",
  };
}

function Card({ stateName, month, depth, pathname, onPick }: { stateName: string; month: Month; depth: number; pathname: string; onPick: () => void }) {
  const front = depth === 0;
  const render = depth >= -1 && depth <= DEPTHS_SHOWN;
  const { reportCount } = getLedgerMeta(stateName);
  return (
    <div
      className="tm-card absolute left-1/2 top-[150px] flex h-[calc(100%-250px)] w-[min(1240px,100%-64px)] flex-col overflow-hidden rounded-[14px]"
      style={{ ...layout(depth), boxShadow: front ? "0 30px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.12)" : "0 12px 40px -18px rgba(0,0,0,0.5)" }}
      data-testid="tm-card"
      data-month={month}
      data-front={front ? "true" : "false"}
      data-depth={depth}
      aria-hidden={!front}
    >
      {front ? (
        <div className="flex h-10 shrink-0 items-center justify-between bg-header px-5 text-white">
          <span className="serif text-[16px] font-semibold">{monthLabel(month)} 2026</span>
          <span className="text-[13px] text-white/70">{plural(reportCount, "report")} read</span>
        </div>
      ) : (
        <button type="button" onClick={onPick} tabIndex={-1} title={`View ${monthLabel(month)} 2026`} className="flex h-10 shrink-0 items-center justify-between bg-brand px-5 text-left text-white hover:bg-[#2a6e3a]" data-testid="tm-strip">
          <span className="serif text-[16px] font-semibold">{monthLabel(month)} 2026</span>
          <span className="text-[13px] text-white/70">{plural(reportCount, "report")} read</span>
        </button>
      )}
      <div className="@container relative min-h-0 flex-1 bg-bg" style={{ overflowY: front ? "auto" : "hidden" }} inert={!front}>
        {render ? (
          <ViewProvider stateName={stateName}>
            <Suspense fallback={null}>{pageFor(pathname)}</Suspense>
          </ViewProvider>
        ) : null}
        {front ? null : <div className="pointer-events-none absolute inset-0" style={{ background: `rgba(20, 63, 31, ${0.05 * depth})` }} />}
      </div>
    </div>
  );
}

function Timeline({ viewed, set, hover, setHover, onPick, currentRef }: { viewed: Month; set: string; hover: Month | null; setHover: (m: Month | null) => void; onPick: (m: Month) => void; currentRef: React.RefObject<HTMLButtonElement | null> }) {
  const idx = MONTHS.indexOf(viewed);
  return (
    <div className="flex w-[220px] shrink-0 flex-col border-l border-white/10 px-6 pb-6 pt-7 text-white" data-testid="tm-timeline">
      <div className="flex items-center gap-2 text-[15px] font-semibold">
        <IconClockBack size={18} />
        Go back in time
      </div>
      <span className="mt-1 text-[13px] leading-[1.4] text-white/60">Click a month, or use the arrow keys. Escape keeps the month in view.</span>
      <div className="relative mt-6 flex flex-col" role="listbox" aria-label="Month in view" aria-activedescendant={`tm-month-${viewed}`}>
        <div className="absolute bottom-[18px] left-[7px] top-[18px] w-px bg-white/20" />
        {MONTHS.map((m, i) => {
          const on = m === viewed;
          const later = i > idx;
          const counts = stateCounts(getDemoState(viewKey({ set: set as "core" | "all", cutoff: m })));
          const preview = hover === m && !on;
          return (
            <button
              key={m}
              id={`tm-month-${m}`}
              ref={on ? currentRef : undefined}
              type="button"
              role="option"
              aria-selected={on}
              aria-current={on ? "true" : undefined}
              onClick={() => onPick(m)}
              onMouseEnter={() => setHover(m)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(m)}
              onBlur={() => setHover(null)}
              className="relative flex items-start gap-3 rounded-[8px] py-1.5 pr-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              data-testid={`month-${m}`}
              data-later={later ? "true" : "false"}
            >
              <span className={"mt-[5px] inline-flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full " + (on ? "bg-white" : "")}>
                <span className={"block rounded-full " + (on ? "h-[7px] w-[7px] bg-header" : later ? "h-[9px] w-[9px] border border-white/40 bg-transparent" : "h-[9px] w-[9px] bg-white/80")} />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className={"text-[15px] leading-[1.6] " + (on ? "serif text-[18px] font-semibold text-white" : later ? "text-white/45 hover:text-white/80" : "text-white/80 hover:text-white")}>{monthLabel(m)}</span>
                {on || preview ? (
                  <span className="flex items-center gap-2 text-[12px] leading-[1.4] text-white/70" data-testid="tm-counts">
                    {FLAG_ORDER.map((f) => (
                      <span key={f} className="inline-flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ background: FLAG_COLORS[f].text }} />
                        {counts[f]}
                      </span>
                    ))}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      <span className="mt-auto text-[12px] leading-[1.4] text-white/50">Every card is that month&apos;s reports, as read. Nothing later leaks back.</span>
    </div>
  );
}
