"use client";

// The reading log. "Add [month] reports" opens this panel, bottom right,
// and streams one line per finding over about six seconds: the report,
// then each initiative with its page and section, the sentence management
// wrote, the change the diff found, and the flag. When the last line has
// appeared the month arrives: the cutoff moves, cells and flags and counts
// update on the page (or the next card slides forward in the Time
// Machine), and the finished log lingers briefly, then closes. Skip
// applies the month at once. Lines come from lib/reading.ts, so nothing
// here is invented.

import { useEffect, useMemo, useRef } from "react";
import { useStore } from "@/lib/store";
import { getDemoState } from "@/lib/data";
import { viewKey } from "@/lib/states";
import { readingInterval, readingLines, READING_LINGER_MS, type ReadingLine } from "@/lib/reading";
import { FLAG_COLORS } from "@/lib/flags";
import { monthLabel } from "@/lib/format";
import { citeHref } from "@/lib/cites";
import { IconCheck } from "@/components/ui/icons";
import Link from "next/link";

export function ReadingLog() {
  const reading = useStore((s) => s.reading);
  if (!reading) return null;
  return <Panel key={`${reading.from}-${reading.to}`} />;
}

function Panel() {
  const reading = useStore((s) => s.reading);
  const stateName = useStore((s) => s.stateName);
  const tmOpen = useStore((s) => s.timeMachineOpen);
  const revealLine = useStore((s) => s.revealLine);
  const finishReading = useStore((s) => s.finishReading);
  const closeReading = useStore((s) => s.closeReading);
  const set = getDemoState(stateName).set;
  const from = reading?.from;
  const lines = useMemo(() => (from ? (readingLines(viewKey({ set, cutoff: from })) ?? []) : []), [set, from]);
  const shown = reading?.shown ?? 0;
  const done = reading?.done ?? false;
  const list = useRef<HTMLDivElement>(null);

  // Stream a line at a time; apply the month after the last; linger; close.
  useEffect(() => {
    if (!reading) return;
    if (done) {
      const t = window.setTimeout(closeReading, READING_LINGER_MS);
      return () => window.clearTimeout(t);
    }
    if (shown >= lines.length) {
      finishReading();
      return;
    }
    const t = window.setTimeout(revealLine, readingInterval(lines.length));
    return () => window.clearTimeout(t);
  }, [reading, done, shown, lines.length, revealLine, finishReading, closeReading]);

  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown]);

  if (!reading) return null;
  const to = reading.to;
  return (
    <div
      className="fixed bottom-7 z-[48] flex w-[600px] max-w-[calc(100vw-56px)] flex-col overflow-hidden rounded-[14px] bg-header text-white shadow-[0_18px_48px_-12px_rgba(20,63,31,0.55),inset_0_0_0_1px_rgba(255,255,255,0.08)]"
      style={{ right: tmOpen ? 248 : 28 }}
      role="log"
      aria-live="polite"
      aria-label={`Reading the ${monthLabel(to)} reports`}
      data-testid="reading-log"
      data-month={to}
      data-status={done ? "done" : "reading"}
    >
      <div className="flex items-center justify-between border-b border-white/12 px-[18px] py-3">
        <div className="flex items-center gap-2.5">
          {done ? <IconCheck size={16} /> : <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
          <span className={"text-[15px] font-semibold " + (done ? "" : "working")} data-testid="reading-title">
            {done ? `${monthLabel(to)} reports read` : `Reading the ${monthLabel(to)} reports`}
          </span>
        </div>
        <span className="text-[12px] text-white/60">
          {Math.min(shown, lines.length)} of {lines.length}
        </span>
      </div>
      <div ref={list} className="flex max-h-[46vh] flex-col gap-1 overflow-y-auto px-3 py-2.5" data-testid="reading-lines">
        {lines.slice(0, shown).map((l, i) => (
          <Line key={i} line={l} />
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-white/12 px-[18px] py-2.5">
        <span className="text-[12px] text-white/60">Every line is a sentence from the report, with its page.</span>
        {done ? (
          <button type="button" onClick={closeReading} className="rounded-[8px] border border-white/25 px-3 py-1.5 text-[13px] font-semibold hover:bg-white/10" data-testid="reading-close">
            Close
          </button>
        ) : (
          <button type="button" onClick={finishReading} className="rounded-[8px] border border-white/25 px-3 py-1.5 text-[13px] font-semibold hover:bg-white/10" data-testid="reading-skip">
            Skip to the end
          </button>
        )}
      </div>
    </div>
  );
}

function Line({ line }: { line: ReadingLine }) {
  if (line.kind === "open") {
    return (
      <div className="reading-line mt-1.5 px-2 pt-1.5 text-[13px] font-semibold uppercase tracking-[0.04em] text-white/70 first:mt-0 first:pt-0" data-testid="reading-line" data-kind="open" data-company={line.companyId}>
        {line.text}
      </div>
    );
  }
  if (line.kind === "done") {
    return (
      <div className="reading-line mt-1.5 rounded-[8px] bg-white/12 px-2.5 py-2 text-[14px] font-semibold" data-testid="reading-line" data-kind="done">
        {line.text}
      </div>
    );
  }
  const c = FLAG_COLORS[line.flag];
  return (
    <div className="reading-line grid grid-cols-[18px_1fr] items-start gap-x-2.5 rounded-[8px] px-2 py-1.5 hover:bg-white/6" data-testid="reading-line" data-kind="read" data-initiative={line.initiativeId} data-flag={line.flag}>
      <span className="mt-[3px] inline-block h-[14px] w-[14px] rounded-[4px]" style={{ background: c.line, border: `1px solid ${c.text}` }} />
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex flex-wrap items-baseline gap-x-2 text-[14px] leading-[1.4]">
          <span className="font-semibold">{line.name}</span>
          {line.cite ? (
            <Link href={citeHref(line.cite, line.quote ?? undefined)} className="text-[12px] text-white/70 underline decoration-dotted underline-offset-[3px] hover:text-white" data-testid="reading-cite">
              {line.where}
            </Link>
          ) : (
            <span className="text-[12px] text-white/70">{line.where}</span>
          )}
          <span className="ml-auto whitespace-nowrap text-[12px] font-semibold" style={{ color: c.line }}>
            {line.change} · {c.name}
          </span>
        </div>
        {line.quote ? <span className="text-[13px] leading-[1.4] text-white/80">{"“" + line.quote + "”"}</span> : null}
      </div>
    </div>
  );
}
