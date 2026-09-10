"use client";

// Client state. Persists to localStorage so a rehearsal can be resumed.
// Any change to the persisted shape bumps STORE_VERSION in the same commit.
//
// The loaded demo state is a view key (core-2026-07): which companies are
// in and which month the reports have arrived through. What it shows
// comes from data/demo-states.json through lib/data.ts. The month
// Time Machine moves the cutoff; the presenter menu's named states (july,
// august, august-approved, monday) are presets over it.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Flag, Month, View } from "./types";
import { DEFAULT_STATE, getDemoState, getPreset, resolveStateKey } from "./data";
import { viewKey } from "./states";

export const STORE_VERSION = 4; // 4: stateName is a view key (core-2026-07), the cutoff the scrubber sets. 3: month dropped (derived from stateName); + noteReviewed. 2: + questionsApproved, noteDictated. 1: loggedIn, sidebarCollapsed, stateName, month, showDemoTag
export { DEFAULT_STATE };

const DEFAULT_MOCK = process.env.MOCK_MODE !== "false";

export type DictationStatus = "playing" | "drafted" | "reviewed";
export type Dictation = { noteId: string; status: DictationStatus };

export type AppState = {
  mockMode: boolean;
  loggedIn: boolean;
  sidebarCollapsed: boolean;
  workFilter: Flag | null;
  stateName: string; // the loaded view key: core-2026-07, all-2026-08
  showDemoTag: boolean;
  presenterOpen: boolean;
  working: string | null; // a working indicator label, or null
  questionsApproved: string[]; // company ids whose drafted questions the deal lead approved
  noteDictated: boolean; // "Dictate a note" has run: the draft log entry and current-state line exist
  noteReviewed: boolean; // the deal lead pressed Review: the drafts are confirmed
  dictation: Dictation | null; // the dictation panel, while it is open
  timeMachineOpen: boolean; // the Time Machine overlay: the page as a stack of month cards

  setMockMode: (v: boolean) => void;
  setLoggedIn: (v: boolean) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setWorkFilter: (v: Flag | null) => void;
  setShowDemoTag: (v: boolean) => void;
  setPresenterOpen: (v: boolean) => void;
  setWorking: (v: string | null) => void;
  approveQuestions: (companyId: string) => void;
  startDictation: (noteId: string) => void;
  finishDictation: () => void;
  reviewNote: () => void;
  closeDictation: () => void;
  loadState: (name: string) => void; // a preset name or a view key
  setCutoff: (month: Month) => void; // the Time Machine: keeps the company set and the approvals
  setTimeMachineOpen: (v: boolean) => void;
  reset: () => void;
};

// What loading a demo state sets. A state is a full snapshot: approvals
// come from the preset (none for a bare view key), and the dictated
// drafts start over.
function stateDefaults(name: string): Pick<AppState, "stateName" | "questionsApproved" | "noteDictated" | "noteReviewed" | "dictation" | "workFilter" | "working" | "timeMachineOpen"> {
  const state = getDemoState(name);
  const preset = getPreset(name);
  return { stateName: state.name, questionsApproved: [...(preset?.questionsApproved ?? [])], noteDictated: false, noteReviewed: false, dictation: null, workFilter: null, working: null, timeMachineOpen: false };
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      mockMode: DEFAULT_MOCK,
      loggedIn: false,
      sidebarCollapsed: false,
      showDemoTag: true,
      presenterOpen: false,
      ...stateDefaults(DEFAULT_STATE),

      setMockMode: (v) => set({ mockMode: v }),
      setLoggedIn: (v) => set({ loggedIn: v }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setWorkFilter: (v) => set({ workFilter: v }),
      setShowDemoTag: (v) => set({ showDemoTag: v }),
      setPresenterOpen: (v) => set({ presenterOpen: v }),
      setWorking: (v) => set({ working: v }),
      approveQuestions: (companyId) => set((s) => ({ questionsApproved: s.questionsApproved.includes(companyId) ? s.questionsApproved : [...s.questionsApproved, companyId] })),
      startDictation: (noteId) => set({ dictation: { noteId, status: "playing" }, noteDictated: false, noteReviewed: false, presenterOpen: false }),
      finishDictation: () => set((s) => (s.dictation ? { dictation: { ...s.dictation, status: "drafted" }, noteDictated: true } : {})),
      reviewNote: () => set((s) => ({ noteReviewed: true, dictation: s.dictation ? { ...s.dictation, status: "reviewed" } : null })),
      closeDictation: () => set({ dictation: null }),
      loadState: (name) => set(stateDefaults(name)),
      setCutoff: (month) => set((s) => ({ stateName: viewKey({ set: getDemoState(s.stateName).set, cutoff: month }), working: null })),
      setTimeMachineOpen: (v) => set({ timeMachineOpen: v, presenterOpen: v ? false : undefined } as Partial<AppState>),
      reset: () => set(stateDefaults(DEFAULT_STATE)),
    }),
    {
      name: "greenbriar-ledger",
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        mockMode: s.mockMode,
        loggedIn: s.loggedIn,
        sidebarCollapsed: s.sidebarCollapsed,
        stateName: s.stateName,
        showDemoTag: s.showDemoTag,
        questionsApproved: s.questionsApproved,
        noteDictated: s.noteDictated,
        noteReviewed: s.noteReviewed,
      }),
      migrate: () => ({ mockMode: DEFAULT_MOCK, loggedIn: false, ...stateDefaults(DEFAULT_STATE) }) as Partial<AppState>,
      // A saved state name that no longer exists falls back to the default.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<AppState>;
        const known = saved.stateName && resolveStateKey(saved.stateName) === saved.stateName;
        return { ...current, ...saved, ...(known ? {} : stateDefaults(DEFAULT_STATE)) };
      },
    },
  ),
);

// The view the loaded state is: the company set and the cutoff month.
export function viewOf(stateName: string): View {
  const state = getDemoState(stateName);
  return { set: state.set, cutoff: state.month };
}
