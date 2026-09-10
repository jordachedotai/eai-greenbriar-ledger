"use client";

// Presenter menu. Shift+P or the header icon. Dark brand-green panel,
// bottom right, same as the scheduler's. The demo-script beats first
// ("August report arrives" is live only from `july`; "Dictate a note"
// always), then the demo controls: jump to a state, the demo tag, reset,
// sign out and reset.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore, viewOf } from "@/lib/store";
import { getPreset, getStateNames } from "@/lib/data";
import { presetFor } from "@/lib/states";
import { monthLabel } from "@/lib/format";
import { augustReportArrives, canAugustArrive, dictateNote } from "@/lib/actions";
import { IconChevronRight, IconPresenter } from "@/components/ui/icons";
import { Menu } from "@/components/ui/Menu";

const ROW = "flex items-center justify-between rounded-[8px] px-3 py-2.5 text-[15px]";
const HEAD = "px-1.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-white/55";

export function PresenterMenu() {
  const open = useStore((s) => s.presenterOpen);
  const setOpen = useStore((s) => s.setPresenterOpen);
  const stateName = useStore((s) => s.stateName);
  const questionsApproved = useStore((s) => s.questionsApproved);
  const working = useStore((s) => s.working);
  const dictation = useStore((s) => s.dictation);
  const noteDictated = useStore((s) => s.noteDictated);
  const showDemoTag = useStore((s) => s.showDemoTag);
  const setShowDemoTag = useStore((s) => s.setShowDemoTag);
  const loadState = useStore((s) => s.loadState);
  const reset = useStore((s) => s.reset);
  const setLoggedIn = useStore((s) => s.setLoggedIn);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;
      if (e.shiftKey && (e.key === "P" || e.key === "p")) {
        e.preventDefault();
        setOpen(!useStore.getState().presenterOpen);
      } else if (e.key === "Escape" && useStore.getState().presenterOpen) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  if (!open) return null;
  const preset = presetFor(viewOf(stateName), questionsApproved);
  const busy = !!working || dictation?.status === "playing";
  const augustLive = canAugustArrive();

  return (
    <div className="fixed bottom-7 right-7 z-50 flex w-[340px] flex-col overflow-hidden rounded-[14px] bg-header text-white shadow-[0_18px_48px_-12px_rgba(20,63,31,0.55),inset_0_0_0_1px_rgba(255,255,255,0.08)]" data-testid="presenter-menu" data-state={preset ?? stateName}>
      <div className="flex items-center justify-between border-b border-white/12 px-[18px] py-3.5">
        <div className="flex items-center gap-2.5">
          <IconPresenter size={18} />
          <span className="text-[15px] font-semibold">Presenter</span>
        </div>
        <button type="button" className="text-[12px] text-white/60 hover:text-white" onClick={() => setOpen(false)}>
          Shift+P to close
        </button>
      </div>

      <div className="flex flex-col gap-1.5 p-3">
        <span className={HEAD + " pt-1"}>Demo script</span>
        {augustLive ? (
          <button
            type="button"
            onClick={() => augustReportArrives()}
            disabled={busy}
            data-testid="beat-august-arrives"
            data-state={working ? "working" : "next"}
            className={ROW + " bg-white/14 font-semibold hover:bg-white/20 disabled:opacity-70"}
          >
            <span className={working ? "working" : ""}>{working ?? "August report arrives"}</span>
            {working ? null : <IconChevronRight size={16} />}
          </button>
        ) : (
          <div data-testid="beat-august-arrives" data-state="off" className={ROW + " bg-white/6 text-white/45"}>
            <span>August report arrives</span>
            <span className="text-[12px]">from July</span>
          </div>
        )}
        <button type="button" onClick={() => dictateNote()} disabled={busy} data-testid="beat-dictate" data-state={dictation?.status === "playing" ? "working" : noteDictated ? "done" : "next"} className={ROW + " bg-white/14 font-semibold hover:bg-white/20 disabled:opacity-70"}>
          <span className={dictation?.status === "playing" ? "working" : ""}>{dictation?.status === "playing" ? "Listening" : "Dictate a note"}</span>
          {dictation?.status === "playing" ? null : noteDictated ? <span className="text-[12px] font-normal text-white/60">again</span> : <IconChevronRight size={16} />}
        </button>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-white/12 px-3 pb-3 pt-1">
        <span className={HEAD + " pb-0.5 pt-2.5"}>Demo</span>
        <div className={ROW}>
          <span>Jump to state</span>
          <Menu
            dark
            value={preset}
            placeholder={`through ${monthLabel(viewOf(stateName).cutoff)}`}
            options={getStateNames().map((name) => ({ value: name, label: name, sub: getPreset(name)?.label ?? name }))}
            onChange={(k) => {
              if (!busy) loadState(k);
            }}
            testId="jump-state"
            ariaLabel="Jump to state"
          />
        </div>
        <div className={ROW}>
          <span>Show demo tag in header</span>
          <button
            type="button"
            role="switch"
            aria-checked={showDemoTag}
            onClick={() => setShowDemoTag(!showDemoTag)}
            data-testid="toggle-demo-tag"
            className={"inline-flex h-5 w-9 items-center rounded-full p-0.5 transition " + (showDemoTag ? "justify-end bg-green" : "justify-start bg-white/25")}
          >
            <span className="h-4 w-4 rounded-full bg-white" />
          </button>
        </div>
        <button
          type="button"
          className="mt-1 rounded-[8px] border border-white/25 px-3 py-2.5 text-[15px] font-semibold hover:bg-white/10 disabled:opacity-40"
          disabled={busy}
          onClick={() => {
            reset();
            router.push("/portfolio");
          }}
          data-testid="presenter-reset"
        >
          Reset to August
        </button>
        <button
          type="button"
          className="rounded-[8px] border border-white/25 px-3 py-2.5 text-[15px] font-semibold hover:bg-white/10 disabled:opacity-40"
          disabled={busy}
          onClick={() => {
            // Restart the script from the login screen: August, signed out.
            reset();
            setOpen(false);
            setLoggedIn(false);
            router.push("/login");
          }}
          data-testid="presenter-signout-reset"
        >
          Sign out and reset
        </button>
      </div>
    </div>
  );
}
