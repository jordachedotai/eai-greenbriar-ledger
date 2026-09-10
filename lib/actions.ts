"use client";

// The presenter beats. Code over fixtures, no model calls (docs/AGENT.md,
// "Mock behaviors in the app"). Each one changes the store; the pages
// re-render in place from the loaded state.

import { getNotes } from "./data";
import { useStore, viewOf } from "./store";

// "August report arrives": from `july`, a working indicator for this long,
// then `august` loads over it. The diff between the two states is what the
// audience sees change: the ERP row turns red, the strip goes from
// 1 / 3 / 1 / 7 to 2 / 2 / 1 / 7, the Harlan rail fills.
export const AUGUST_ARRIVES_MS = 2000;
export const AUGUST_ARRIVES_LABEL = "Reading the August reports";

export function canAugustArrive(): boolean {
  const s = useStore.getState();
  const view = viewOf(s.stateName);
  return view.set === "core" && view.cutoff === "2026-07" && !s.working;
}

export function augustReportArrives(): boolean {
  if (!canAugustArrive()) return false;
  useStore.getState().setWorking(AUGUST_ARRIVES_LABEL);
  window.setTimeout(() => {
    const s = useStore.getState();
    // A reset or a jump in the meantime clears the indicator; do nothing then.
    if (s.working !== AUGUST_ARRIVES_LABEL) return;
    s.loadState("august");
    s.setPresenterOpen(false);
  }, AUGUST_ARRIVES_MS);
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
