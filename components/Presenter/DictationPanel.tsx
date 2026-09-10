"use client";

// The "Dictate a note" panel, bottom right. The fixed synthetic transcript
// types out over DICTATE_MS, then the pre-drafted learning-log entry and
// current-state line appear as drafts with a Review control. Review
// confirms them (they also carry Review controls on the company's tabs,
// the Patterns rail, and the Learning log page). Nothing is sent, and
// nothing here is a model call.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { getCompany, getNote, getNoteDrafts } from "@/lib/data";
import { DICTATE_MS } from "@/lib/actions";
import { FLAG_COLORS, YOU_COLORS } from "@/lib/flags";
import { fmtShortDate } from "@/lib/format";
import { Button, LABEL } from "@/components/ui/Button";
import { IconMic, IconX } from "@/components/ui/icons";

export function DictationPanel() {
  const dictation = useStore((s) => s.dictation);
  const finish = useStore((s) => s.finishDictation);
  const review = useStore((s) => s.reviewNote);
  const close = useStore((s) => s.closeDictation);
  const note = dictation ? getNote(dictation.noteId) : undefined;
  const [shown, setShown] = useState(0);
  const playing = dictation?.status === "playing";
  const total = note?.text.length ?? 0;

  // Type the transcript at a steady pace. The store moves to "drafted"
  // when the last character lands.
  useEffect(() => {
    if (!playing || !note) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DICTATE_MS);
      setShown(Math.floor(t * note.text.length));
      if (t < 1) raf = requestAnimationFrame(tick);
      else finish();
    };
    setShown(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, note, finish]);

  if (!dictation || !note) return null;
  const company = getCompany(note.companyId);
  const drafts = getNoteDrafts(note.id);
  const status = dictation.status;
  const tone = status === "playing" ? { text: FLAG_COLORS.amber.text, bg: FLAG_COLORS.amber.bg, label: "Listening" } : status === "drafted" ? { text: YOU_COLORS.text, bg: YOU_COLORS.bg, label: "Draft" } : { text: FLAG_COLORS.green.text, bg: FLAG_COLORS.green.bg, label: "Confirmed" };
  const text = status === "playing" ? note.text.slice(0, Math.min(shown, total)) : note.text;

  return (
    <div className="fixed bottom-7 right-7 z-50 flex w-[460px] flex-col gap-3.5 rounded-[14px] border border-line bg-white px-5 pb-[18px] pt-4 shadow-[var(--shadow-card-hover)]" data-testid="dictation" data-status={status}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full" style={{ background: tone.bg }}>
            <IconMic size={18} stroke={tone.text} />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-[15px] font-semibold">Dictated note</span>
            <span className="text-[13px] text-mut">
              {note.title}, {fmtShortDate(note.date)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={"inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-[3px] text-[13px] font-semibold " + (status === "playing" ? "working" : "")} style={{ background: tone.bg, color: tone.text }} data-testid="dictation-status">
            {tone.label}
          </span>
          {status !== "playing" ? (
            <button type="button" onClick={close} className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-mut hover:bg-bg hover:text-txt" title="Close" data-testid="dictation-close">
              <IconX size={12} />
            </button>
          ) : null}
        </div>
      </div>

      <p className="max-h-[132px] overflow-y-auto rounded-[10px] bg-bg px-3.5 py-3 text-[14px] leading-[1.5] text-txt" data-testid="dictation-text">
        {text}
        {status === "playing" ? <span className="ml-0.5 inline-block h-[14px] w-[2px] translate-y-[2px] animate-pulse bg-txt" /> : null}
      </p>

      {status !== "playing" ? (
        <div className="flex flex-col gap-3" data-testid="dictation-drafts">
          <span className="text-[14px] leading-[1.45]">
            {status === "drafted" ? `Drafted for ${company?.name ?? note.companyId}, in the team's format. Review to keep them.` : `Kept in ${company?.name ?? note.companyId}'s learning log and current state.`}
          </span>
          {drafts.entry ? (
            <div className="flex flex-col gap-1 rounded-[10px] border border-line px-3.5 py-3" data-testid="dictation-log-draft">
              <span className={LABEL}>Learning log</span>
              <span className="text-[14px] leading-[1.45]">{drafts.entry.text}</span>
              <span className="text-[12px] text-mut">{drafts.entry.source}</span>
            </div>
          ) : null}
          {drafts.line ? (
            <div className="flex flex-col gap-1 rounded-[10px] border border-line px-3.5 py-3" data-testid="dictation-state-draft">
              <span className={LABEL}>Current state</span>
              <span className="text-[14px] leading-[1.45]">{drafts.line.text}</span>
            </div>
          ) : null}
          <div className="flex items-center gap-2.5">
            {status === "drafted" ? (
              <Button variant="you" size={36} onClick={review} testId="dictation-review">
                Review
              </Button>
            ) : null}
            <Button variant="secondary" size={36} href={`/portfolio/${note.companyId}?tab=log`} testId="dictation-open">
              Open {company?.name.split(" ")[0] ?? note.companyId}
            </Button>
            {status === "drafted" ? <span className="text-[13px] text-mut">Draft until you review it.</span> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
