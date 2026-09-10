"use client";

// Client state. Persists to localStorage so a rehearsal can be resumed.
// Any change to the persisted shape bumps STORE_VERSION in the same commit.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Flag } from "./types";

export const STORE_VERSION = 2; // 1: loggedIn, sidebarCollapsed, stateName, month, showDemoTag. 2: + questionsApproved, noteDictated
export const DEFAULT_STATE = "august";

const DEFAULT_MOCK = process.env.MOCK_MODE !== "false";

export type MonthView = "2026-07" | "2026-08";

export type AppState = {
  mockMode: boolean;
  loggedIn: boolean;
  sidebarCollapsed: boolean;
  workFilter: Flag | null;
  stateName: string; // the loaded demo state: july, august, august-approved, monday
  month: MonthView; // the header month toggle
  showDemoTag: boolean;
  presenterOpen: boolean;
  working: string | null; // a working indicator label, or null
  questionsApproved: string[]; // company ids whose drafted questions the deal lead approved
  noteDictated: boolean; // "Dictate a note" has run: draft log and current-state lines show

  setMockMode: (v: boolean) => void;
  setLoggedIn: (v: boolean) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setWorkFilter: (v: Flag | null) => void;
  setMonth: (v: MonthView) => void;
  setShowDemoTag: (v: boolean) => void;
  setPresenterOpen: (v: boolean) => void;
  setWorking: (v: string | null) => void;
  approveQuestions: (companyId: string) => void;
  setNoteDictated: (v: boolean) => void;
  loadState: (name: string) => void;
  reset: () => void;
};

// What each demo state implies for the client-side drafts. The ledger
// fixtures themselves are swapped in Phase 3.
function stateDefaults(name: string): Pick<AppState, "month" | "questionsApproved" | "noteDictated"> {
  return {
    month: name === "july" ? "2026-07" : "2026-08",
    questionsApproved: name === "august-approved" ? ["harlan"] : [],
    noteDictated: false,
  };
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      mockMode: DEFAULT_MOCK,
      loggedIn: false,
      sidebarCollapsed: false,
      workFilter: null,
      stateName: DEFAULT_STATE,
      showDemoTag: true,
      presenterOpen: false,
      working: null,
      ...stateDefaults(DEFAULT_STATE),

      setMockMode: (v) => set({ mockMode: v }),
      setLoggedIn: (v) => set({ loggedIn: v }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setWorkFilter: (v) => set({ workFilter: v }),
      setMonth: (v) => set({ month: v }),
      setShowDemoTag: (v) => set({ showDemoTag: v }),
      setPresenterOpen: (v) => set({ presenterOpen: v }),
      setWorking: (v) => set({ working: v }),
      approveQuestions: (companyId) => set((s) => ({ questionsApproved: s.questionsApproved.includes(companyId) ? s.questionsApproved : [...s.questionsApproved, companyId] })),
      setNoteDictated: (v) => set({ noteDictated: v }),
      loadState: (name) => set({ stateName: name, workFilter: null, working: null, ...stateDefaults(name) }),
      reset: () => set({ stateName: DEFAULT_STATE, workFilter: null, working: null, ...stateDefaults(DEFAULT_STATE) }),
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
        month: s.month,
        showDemoTag: s.showDemoTag,
        questionsApproved: s.questionsApproved,
        noteDictated: s.noteDictated,
      }),
      migrate: () => ({ stateName: DEFAULT_STATE, mockMode: DEFAULT_MOCK, loggedIn: false, ...stateDefaults(DEFAULT_STATE) }) as Partial<AppState>,
    },
  ),
);
