"use client";

// The presenter beats. Code over fixtures, no model calls (docs/AGENT.md,
// "Mock behaviors in the app"). Each one changes the store; the pages
// re-render in place from the loaded state.

import type { Month } from "./types";
import { getNotes } from "./data";
import { nextMonth } from "./states";
import { useStore, viewOf } from "./store";

// "Add [month] reports": from any month before the last, the reading log
// opens and streams one line per finding from the ledger for the next
// month (lib/reading.ts), then the cutoff moves to that month. The diff
// between the two states is what the audience sees change: from July, the
// ERP row turns red, the strip goes from 1 / 3 / 1 / 7 to 2 / 2 / 1 / 7,
// the Harlan rail fills. The presenter menu's "[Month] reports arrive"
// runs the same flow.
export function nextReportsMonth(): Month | null {
  return nextMonth(viewOf(useStore.getState().stateName).cutoff);
}

export function canAddReports(): boolean {
  const s = useStore.getState();
  return !!nextReportsMonth() && !s.reading && !s.working && s.dictation?.status !== "playing";
}

export function addNextReports(): boolean {
  if (!canAddReports()) return false;
  const to = nextReportsMonth();
  if (!to) return false;
  useStore.getState().startReading(to);
  return true;
}

// "Dictate a note": the fixed synthetic transcript types out over this
// long, then the pre-drafted log entry and current-state line appear on
// the company as drafts with a Review control.
export const DICTATE_MS = 4000;

export function dictateNote(noteId?: string): boolean {
  const s = useStore.getState();
  if (s.dictation?.status === "playing" || s.working) return false;
  const note = (noteId && getNotes().find((n) => n.id === noteId)) || getNotes()[0];
  if (!note) return false;
  s.startDictation(note.id);
  return true;
}
