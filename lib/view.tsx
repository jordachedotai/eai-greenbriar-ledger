"use client";

// Which demo state a page renders. Pages read the loaded state through
// useStateName, which is the store's stateName unless a ViewProvider
// above them overrides it. The Time Machine uses the override to render
// the same page for every month at once: one card per month, each a real
// render of that month's state.

import { createContext, useContext } from "react";
import { useStore } from "./store";

const ViewContext = createContext<string | null>(null);

export function ViewProvider({ stateName, children }: { stateName: string; children: React.ReactNode }) {
  return <ViewContext.Provider value={stateName}>{children}</ViewContext.Provider>;
}

// The state name a page should render: an override from a ViewProvider,
// or the loaded one.
export function useStateName(): string {
  const override = useContext(ViewContext);
  const loaded = useStore((s) => s.stateName);
  return override ?? loaded;
}

// True inside a ViewProvider: the page is a Time Machine card, not the
// live page.
export function useIsOverride(): boolean {
  return useContext(ViewContext) !== null;
}
