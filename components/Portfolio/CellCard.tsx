"use client";

// A month cell that shows its quote on hover or focus. The card is anchored
// to the cell: the month, the flag pill, the sentence management wrote in
// quotation marks, the cite as a link to the report page, and the change
// chip if the month carries one. A month with no mention says so. The
// card renders in a portal with a fixed position, so nothing on the page
// moves and it is never clipped; it flips above the cell when there is no
// room below and slides in from the viewport edges. Appears at once, no
// delay. Enter on a focused cell opens the cite; Escape closes the card.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { Initiative, Month, MonthRead } from "@/lib/types";
import { FLAG_COLORS } from "@/lib/flags";
import { citeHref } from "@/lib/cites";
import { monthLabel } from "@/lib/format";
import { CiteLink } from "@/components/ui/CiteLink";
import { FlagCell, StatusPill } from "./StatusPill";

const CARD_W = 372;
const GAP = 8;
const EDGE = 12;
const LEAVE_MS = 140;

export function HoverCell({ initiative, month, read, size = 24 }: { initiative: Initiative; month: Month; read: MonthRead; size?: number }) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLSpanElement>(null);
  const leave = useRef<number | null>(null);
  const router = useRouter();
  const c = FLAG_COLORS[read.flag];
  const title = read.mentioned && read.quote ? `${monthLabel(month)}: ${c.name}.` : `${monthLabel(month)}: ${c.name}. Not mentioned.`;

  const show = () => {
    if (leave.current) window.clearTimeout(leave.current);
    leave.current = null;
    setOpen(true);
  };
  const hide = () => {
    if (leave.current) window.clearTimeout(leave.current);
    leave.current = window.setTimeout(() => setOpen(false), LEAVE_MS);
  };
  const hideNow = () => {
    if (leave.current) window.clearTimeout(leave.current);
    leave.current = null;
    setOpen(false);
  };

  useEffect(() => () => {
    if (leave.current) window.clearTimeout(leave.current);
  }, []);

  return (
    <span
      ref={anchor}
      tabIndex={0}
      role="button"
      aria-label={title}
      aria-expanded={open}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hideNow}
      onKeyDown={(e) => {
        if (e.key === "Escape") hideNow();
        else if (e.key === "Enter" && read.cite) router.push(citeHref(read.cite, read.quote));
      }}
      className="inline-flex rounded-[6px] outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
      data-testid="hover-cell"
      data-month={month}
      data-initiative={initiative.id}
      data-open={open ? "true" : "false"}
    >
      <FlagCell flag={read.flag} size={size} />
      {open ? <CellCard anchor={anchor.current} initiative={initiative} month={month} read={read} onEnter={show} onLeave={hide} /> : null}
    </span>
  );
}

function CellCard({ anchor, initiative, month, read, onEnter, onLeave }: { anchor: HTMLElement | null; initiative: Initiative; month: Month; read: MonthRead; onEnter: () => void; onLeave: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; above: boolean } | null>(null);
  const c = FLAG_COLORS[read.flag];

  useLayoutEffect(() => {
    if (!anchor || !box.current) return;
    const a = anchor.getBoundingClientRect();
    const h = box.current.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = a.left + a.width / 2 - CARD_W / 2;
    left = Math.max(EDGE, Math.min(vw - CARD_W - EDGE, left));
    const below = a.bottom + GAP;
    const above = below + h > vh - EDGE && a.top - GAP - h >= EDGE;
    const top = above ? a.top - GAP - h : Math.min(below, Math.max(EDGE, vh - EDGE - h));
    setPos({ top, left, above });
  }, [anchor, month, initiative.id]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={box}
      role="dialog"
      aria-label={`${monthLabel(month)}, ${initiative.name}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="fixed z-[60] flex flex-col gap-2.5 rounded-[12px] border border-line bg-white px-4 py-3.5 shadow-[var(--shadow-card-hover)]"
      style={{ width: CARD_W, top: pos?.top ?? -9999, left: pos?.left ?? -9999, visibility: pos ? "visible" : "hidden" }}
      data-testid="cell-card"
      data-month={month}
      data-initiative={initiative.id}
      data-placement={pos?.above ? "above" : "below"}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="text-[15px] font-semibold">{monthLabel(month)} 2026</span>
          <span className="truncate text-[12px] text-mut">{initiative.name}</span>
        </div>
        <StatusPill flag={read.flag} text={c.name} />
      </div>
      {read.mentioned && read.quote ? (
        <span className="text-[15px] leading-[1.45]" data-testid="cell-quote">
          {"“"}
          {read.quote}
          {"”"}
        </span>
      ) : (
        <span className="text-[15px] leading-[1.45] text-mut" data-testid="cell-quote">
          Not mentioned in {monthLabel(month)}.
        </span>
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        {read.cite ? (
          <span className="whitespace-nowrap">
            <CiteLink cite={read.cite} quote={read.quote} />
          </span>
        ) : (
          <span className="text-[12px] text-mut">No report page to cite.</span>
        )}
        {read.change ? (
          <span className="ml-auto inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-[3px] text-[13px] font-semibold" style={{ background: c.bg, color: c.text, border: `1px solid ${c.line}` }} data-testid="change-chip">
            {read.change.label}
          </span>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
