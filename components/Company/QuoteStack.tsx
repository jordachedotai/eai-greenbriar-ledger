"use client";

// Center column: the selected initiative. Title, board target and owner,
// status pill, the banner, then the stack: one entry per month that is
// the first mention or carries a change, each with the month, the flag
// cell, the quote verbatim, the cite as a link, and the change chip.
// Under the stack, the months that mention it without a change, and a
// toggle that shows every mentioned month. Nothing paraphrased.

import { useState } from "react";
import type { Initiative, Month } from "@/lib/types";
import { FLAG_COLORS } from "@/lib/flags";
import { monthLabel } from "@/lib/format";
import { expandLabel, mentionedMonths, quietLine, silentTail, stackMonths } from "@/lib/stack";
import { FlagCell, StatusPill } from "@/components/Portfolio/StatusPill";
import { CiteLink } from "@/components/ui/CiteLink";
import { IconQuote } from "@/components/ui/icons";

export function QuoteStack({ initiative }: { initiative: Initiative }) {
  const [expanded, setExpanded] = useState(false);
  const c = FLAG_COLORS[initiative.status.flag];
  const months = stackMonths(initiative, expanded);
  const quiet = quietLine(initiative);
  const tail = silentTail(initiative);
  const mentioned = mentionedMonths(initiative);
  const lastMentioned = mentioned[mentioned.length - 1];

  return (
    <section className="flex flex-col gap-4 rounded-[14px] border border-line bg-white px-[22px] py-5 shadow-[var(--shadow-card)]" data-testid="quote-stack" data-initiative={initiative.id} data-expanded={expanded ? "true" : "false"}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="serif text-[24px] font-semibold leading-[1.2]" data-testid="stack-title">
            {initiative.name}
          </span>
          <span className="text-[14px] text-mut">
            Board target, January 2026: {initiative.boardTarget}. Owner: {initiative.owner}.
          </span>
        </div>
        <StatusPill flag={initiative.status.flag} text={initiative.status.pill} />
      </div>

      <div className="flex items-center gap-2 rounded-[10px] px-3.5 py-2.5" style={{ background: c.bg, border: `1px solid ${c.line}` }}>
        <IconQuote size={18} stroke={c.text} />
        <span className="text-[14px] text-txt">What management wrote, month by month. Nothing paraphrased.</span>
      </div>

      <div className="flex flex-col gap-3" data-testid="stack-entries">
        {months.map((m) => (
          <StackEntry key={m} month={m} initiative={initiative} />
        ))}
        {tail.length ? (
          <div className="grid grid-cols-[96px_1fr] items-start gap-4" data-testid="stack-silent">
            <div className="flex items-start gap-2.5 pt-0.5">
              <FlagCell flag="grey" title="Not reported" />
              <span className="text-[15px] font-semibold leading-[1.3]">{tail.length === 1 ? monthLabel(tail[0]) : `${monthLabel(tail[0])} to ${monthLabel(tail[tail.length - 1])}`}</span>
            </div>
            <div className="flex flex-col gap-1.5 rounded-[10px] border border-dashed border-line bg-bg px-4 py-3">
              <span className="text-[15px] leading-[1.45] text-mut">Not mentioned since {monthLabel(lastMentioned)}. No completion or cancellation stated.</span>
            </div>
          </div>
        ) : null}
      </div>

      {quiet ? (
        <span className="text-[13px] text-mut" data-testid="stack-footer">
          {expanded ? `Showing all ${mentioned.length} months that mention the initiative. ` : `${quiet} `}
          <button type="button" onClick={() => setExpanded(!expanded)} className="font-semibold text-brand hover:text-brand2" data-testid="stack-toggle">
            {expanded ? "Show only the months with a change" : expandLabel(initiative)}
          </button>
        </span>
      ) : null}
    </section>
  );
}

function StackEntry({ month, initiative }: { month: Month; initiative: Initiative }) {
  const read = initiative.months[month];
  if (!read) return null;
  const c = FLAG_COLORS[read.flag];
  return (
    <div className="grid grid-cols-[96px_1fr] items-start gap-4" data-testid="stack-entry" data-month={month} data-change={read.change ? "true" : "false"}>
      <div className="flex items-center gap-2.5 pt-0.5">
        <FlagCell flag={read.flag} title={c.name} />
        <span className="text-[15px] font-semibold">{monthLabel(month)}</span>
      </div>
      <div className="flex flex-col gap-1.5 rounded-[10px] border border-line bg-white px-4 py-3">
        <span className="text-[16px] leading-[1.45]" data-testid="stack-quote">
          {"“"}
          {read.quote}
          {"”"}
        </span>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          {read.cite ? (
            <span className="whitespace-nowrap">
              <CiteLink cite={read.cite} quote={read.quote} />
            </span>
          ) : (
            <span />
          )}
          {read.change ? (
            <span className="ml-auto inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-[3px] text-[13px] font-semibold" style={{ background: c.bg, color: c.text, border: `1px solid ${c.line}` }} data-testid="change-chip">
              {read.change.label}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
