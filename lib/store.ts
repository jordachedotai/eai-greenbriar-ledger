"use client";

// Client state. Persists to localStorage so a rehearsal can be resumed.
// Any change to the persisted shape bumps STORE_VERSION in the same commit.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Flag } from "./types";

export const STORE_VERSION = 1; // 1: first shape: loggedIn, sidebarCollapsed, stateName, month, showDemoTag
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

  setMockMode: (v: boolean) => void;
  setLoggedIn: (v: boolean) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setWorkFilter: (v: Flag | null) => void;
  setMonth: (v: MonthView) => void;
  setShowDemoTag: (v: boolean) => void;
  setPresenterOpen: (v: boolean) => void;
  setWorking: (v: string | null) => void;
  loadState: (name: string) => void;
  reset: () => void;
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      mockMode: DEFAULT_MOCK,
      loggedIn: false,
      sidebarCollapsed: false,
      workFilter: null,
      stateName: DEFAULT_STATE,
      month: "2026-08",
      showDemoTag: true,
      presenterOpen: false,
      working: null,

      setMockMode: (v) => set({ mockMode: v }),
      setLoggedIn: (v) => set({ loggedIn: v }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setWorkFilter: (v) => set({ workFilter: v }),
      setMonth: (v) => set({ month: v }),
      setShowDemoTag: (v) => set({ showDemoTag: v }),
      setPresenterOpen: (v) => set({ presenterOpen: v }),
      setWorking: (v) => set({ working: v }),
      loadState: (name) => set({ stateName: name, workFilter: null, working: null, month: name === "july" ? "2026-07" : "2026-08" }),
      reset: () => set({ stateName: DEFAULT_STATE, workFilter: null, working: null, month: "2026-08" }),
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
      }),
      migrate: () => ({ stateName: DEFAULT_STATE, mockMode: DEFAULT_MOCK, loggedIn: false }) as Partial<AppState>,
    },
  ),
);
