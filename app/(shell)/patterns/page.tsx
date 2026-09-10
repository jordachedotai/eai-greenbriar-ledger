"use client";

// Patterns: what shows up in more than one company. Left, the pattern
// cards. Right, 380px, the latest learning-log entries and the "Add from a
// note" control (button only; the dictate flow is Phase 3).

import Link from "next/link";
import { getLedgerMeta, getLogSorted, getPatterns } from "@/lib/data";
import { useStore } from "@/lib/store";
import { PatternCard } from "@/components/Patterns/PatternCard";
import { LogList } from "@/components/Company/LogList";
import { Button, LABEL } from "@/components/ui/Button";

export default function PatternsPage() {
  const noteDictated = useStore((s) => s.noteDictated);
  const patterns = getPatterns();
  const latest = getLogSorted({ includeDrafts: noteDictated }).slice(0, 4);
  const { reportCount } = getLedgerMeta();
  return (
    <div className="grid grid-cols-[1fr_380px] items-start gap-5 px-7 pb-7 pt-[22px]" data-testid="patterns">
      <div className="flex flex-col gap-3.5">
        <span className="text-[15px] text-mut">Things that show up in more than one company. Found by reading all {reportCount} reports at once, which nobody has time to do.</span>
        {patterns.map((p) => (
          <PatternCard key={p.id} pattern={p} />
        ))}
      </div>
      <div className="flex flex-col gap-3" data-testid="log-rail">
        <div className="flex items-baseline justify-between">
          <span className={LABEL}>Learning log, latest</span>
          <Link href="/log" className="text-[14px] font-semibold text-brand hover:text-brand2" data-testid="all-entries">
            All entries
          </Link>
        </div>
        <LogList entries={latest} />
        <div className="flex flex-col gap-2 rounded-[10px] bg-panel2 p-3.5">
          <span className="text-[14px] leading-[1.45]">Entries come from your notes and site visits. Each one is a draft until you confirm it. Your team can read and add to this log.</span>
          <Button variant="secondary" size={36} className="self-start" testId="add-from-note">
            Add from a note
          </Button>
        </div>
      </div>
    </div>
  );
}
