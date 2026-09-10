"use client";

// The working indicator: a dark pill under the header while a beat runs
// ("Reading the August reports"). Visible from any page, so the audience
// sees the tool work even when the presenter menu is closed.

import { useStore } from "@/lib/store";

export function WorkingToast() {
  const working = useStore((s) => s.working);
  if (!working) return null;
  return (
    <div className="pointer-events-none fixed left-1/2 top-[78px] z-40 -translate-x-1/2" data-testid="working">
      <div className="flex items-center gap-2.5 rounded-full bg-header px-4 py-2 text-[14px] font-semibold text-white shadow-[0_10px_28px_-10px_rgba(20,63,31,0.6)]">
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        <span className="working">{working}</span>
      </div>
    </div>
  );
}
