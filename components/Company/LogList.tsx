"use client";

// Learning-log entries, one card each: date and company, a status pill
// (On bench, Confirmed, or Draft with a Review control), the learning, and
// where it came from. Used on the company tab, the Patterns rail, and the
// Learning log page. Review confirms the dictated draft; nothing is sent.

import type { LogEntry } from "@/lib/types";
import { companyShortName } from "@/lib/data";
import { fmtShortDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { StatusPill, YouChip } from "@/components/Portfolio/StatusPill";
import { Button } from "@/components/ui/Button";

export function LogStatusPill({ status }: { status: LogEntry["status"] }) {
  if (status === "confirmed") return <StatusPill flag="green" text="Confirmed" />;
  if (status === "draft") return <YouChip text="Draft" />;
  return <YouChip text="On bench" />;
}

export function LogEntryCard({ entry, showSource = false }: { entry: LogEntry; showSource?: boolean }) {
  const reviewNote = useStore((s) => s.reviewNote);
  return (
    <div className="flex flex-col gap-1.5 rounded-[10px] border border-line bg-white px-3.5 py-3" data-testid="log-entry" data-entry={entry.id} data-status={entry.status}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] text-mut">
          {fmtShortDate(entry.date)} · {companyShortName(entry.companyId)}
        </span>
        <LogStatusPill status={entry.status} />
      </div>
      <span className="text-[14px] leading-[1.45]">{entry.text}</span>
      {showSource ? <span className="text-[12px] text-mut">{entry.source}</span> : null}
      {entry.status === "draft" ? (
        <div className="pt-1">
          <Button variant="you" size={36} testId="review-log-entry" onClick={reviewNote}>
            Review
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function LogList({ entries, showSource = false, empty = "No entries yet." }: { entries: LogEntry[]; showSource?: boolean; empty?: string }) {
  if (!entries.length) return <span className="text-[15px] text-mut">{empty}</span>;
  return (
    <div className="flex flex-col gap-2" data-testid="log-list">
      {entries.map((e) => (
        <LogEntryCard key={e.id} entry={e} showSource={showSource} />
      ))}
    </div>
  );
}
