"use client";

// Patterns: what shows up in more than one company, in the loaded state.
// Left, the pattern cards. Right, 380px, the latest learning-log entries
// and the "Add from a note" control, which runs the dictate beat. When the
// dictation panel takes its column the page is narrower, so the rail
// drops to 320px and the cards take what is left.

import Link from "next/link";
import { draftModeOf, getLedgerMeta, getLogSorted, getNotes, getPatterns } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useStateName } from "@/lib/view";
import { PatternCard } from "@/components/Patterns/PatternCard";
import { LogList } from "@/components/Company/LogList";
import { Button, LABEL } from "@/components/ui/Button";

export default function PatternsPage() {
  const stateName = useStateName();
  const noteDictated = useStore((s) => s.noteDictated);
  const noteReviewed = useStore((s) => s.noteReviewed);
  const startDictation = useStore((s) => s.startDictation);
  const dictation = useStore((s) => s.dictation);
  const patterns = getPatterns(stateName);
  const latest = getLogSorted({ drafts: draftModeOf({ noteDictated, noteReviewed }), stateName }).slice(0, 4);
  const { reportCount } = getLedgerMeta(stateName);
  const note = getNotes()[0];
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-5 px-7 pb-7 pt-[22px] @max-4xl:grid-cols-[minmax(0,1fr)_320px]" data-testid="patterns" data-state={stateName}>
      <div className="flex flex-col gap-3.5">
        <span className="text-[15px] text-mut">Things that show up in more than one company. Found by reading all {reportCount} reports at once, which nobody has time to do.</span>
        {patterns.map((p) => (
          <PatternCard key={p.id} pattern={p} />
        ))}
        {patterns.length === 0 ? <span className="text-[15px] text-mut">Nothing across companies yet.</span> : null}
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
          <Button variant="secondary" size={36} className="self-start" testId="add-from-note" onClick={() => note && dictation?.status !== "playing" && startDictation(note.id)}>
            Add from a note
          </Button>
        </div>
      </div>
    </div>
  );
}
