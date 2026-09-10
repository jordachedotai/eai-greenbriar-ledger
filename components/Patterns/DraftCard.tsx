"use client";

// The draft a pattern card's action produces. The text types out over
// about two seconds, then Approve and Edit appear. Edit opens the text in
// place; Save keeps it. Approve marks it approved: an intro is ready to
// send (nothing is sent), a question joins the company's questions for
// the next call with a "From Patterns" note. Reduced motion shows the
// whole draft at once.

import { useEffect, useRef, useState } from "react";
import type { Draft } from "@/lib/types";
import { useStore } from "@/lib/store";
import { getCompany } from "@/lib/data";
import { DRAFT_MS } from "@/lib/actions";
import { FLAG_COLORS, YOU_COLORS } from "@/lib/flags";
import { fmtWeekday } from "@/lib/format";
import { parseCite, citeShort } from "@/lib/cites";
import { companyShortName } from "@/lib/data";
import { Button, LABEL } from "@/components/ui/Button";
import { CiteLink } from "@/components/ui/CiteLink";
import { YouChip } from "@/components/Portfolio/StatusPill";

const TICK_MS = 30;

export function DraftCard({ draft }: { draft: Draft }) {
  const entry = useStore((s) => s.patternDrafts[draft.patternId]);
  const finishDraft = useStore((s) => s.finishDraft);
  const editDraft = useStore((s) => s.editDraft);
  const saveDraft = useStore((s) => s.saveDraft);
  const approveDraft = useStore((s) => s.approveDraft);
  const [shown, setShown] = useState(0); // characters revealed while typing
  const count = useRef(0);
  const [edits, setEdits] = useState<string[]>([]);
  const texts = entry?.texts ?? [];
  const total = texts.reduce((n, t) => n + t.length, 0);

  // Type out over DRAFT_MS, then hand over to Approve and Edit.
  useEffect(() => {
    if (!entry || entry.status !== "typing") return;
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(total);
      finishDraft(draft.patternId);
      return;
    }
    const perTick = Math.max(1, Math.ceil(total / (DRAFT_MS / TICK_MS)));
    count.current = 0;
    const t = window.setInterval(() => {
      count.current = Math.min(total, count.current + perTick);
      setShown(count.current);
      if (count.current >= total) {
        window.clearInterval(t);
        finishDraft(draft.patternId);
      }
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, [entry?.status, draft.patternId, total, finishDraft, entry]);

  if (!entry) return null;
  const typing = entry.status === "typing";
  const editing = entry.status === "editing";
  const approved = entry.status === "approved";
  const tone = approved ? { text: FLAG_COLORS.green.text, bg: FLAG_COLORS.green.bg, line: FLAG_COLORS.green.line } : { text: YOU_COLORS.text, bg: YOU_COLORS.bg, line: "#b9cbe3" };

  // The visible slice of each text while typing.
  let budget = shown;
  const visible = texts.map((t) => {
    if (!typing) return t;
    const take = Math.max(0, Math.min(t.length, budget));
    budget -= take;
    return t.slice(0, take);
  });

  const startEdit = () => {
    setEdits([...texts]);
    editDraft(draft.patternId);
  };
  const companies = draft.kind === "question" ? [...new Set(draft.questions.map((q) => q.companyId))] : [];
  const doneLine =
    draft.kind === "intro"
      ? "Approved. Ready to send from your own mail. Nothing was sent from here."
      : `Approved. Added to ${companies.map((id) => `${companyShortName(id)}'s ${fmtWeekday(getCompany(id)?.nextCall ?? "2026-09-17")}`).join(" and ")} questions.`;

  return (
    <div className="flex flex-col gap-3 rounded-[12px] px-4 py-3.5" style={{ background: tone.bg, border: `1px solid ${tone.line}` }} data-testid="pattern-draft" data-pattern={draft.patternId} data-status={entry.status} data-kind={draft.kind}>
      <div className="flex items-center justify-between gap-3">
        <span className={LABEL} style={{ color: tone.text }}>
          {draft.title}
        </span>
        <YouChip text={approved ? "Approved" : typing ? "Drafting" : "Draft"} />
      </div>
      {draft.kind === "intro" ? (
        <div className="flex flex-col gap-1 text-[13px] text-mut">
          <span>
            <span className="font-semibold text-txt">To:</span> {draft.to.join("; ")}
          </span>
          <span>
            <span className="font-semibold text-txt">Subject:</span> {draft.subject}
          </span>
        </div>
      ) : null}
      {texts.map((t, i) => {
        const q = draft.kind === "question" ? draft.questions[i] : undefined;
        const cites = draft.kind === "intro" ? draft.cites : (q?.cites ?? []);
        return (
          <div key={i} className="flex flex-col gap-1.5 rounded-[10px] border border-line bg-white px-3.5 py-3">
            {q ? <span className="text-[12px] font-semibold text-mut">{getCompany(q.companyId)?.name ?? q.companyId}</span> : null}
            {editing ? (
              <textarea
                value={edits[i] ?? t}
                onChange={(e) => setEdits((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                rows={4}
                className="w-full resize-y rounded-[8px] border border-line px-3 py-2 text-[15px] leading-[1.45] outline-none focus:border-brand"
                data-testid="draft-textarea"
              />
            ) : (
              <span className="min-h-[1.45em] whitespace-pre-wrap text-[15px] leading-[1.45]" data-testid="draft-text" data-typing={typing ? "true" : "false"}>
                {visible[i]}
                {typing ? <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-txt" aria-hidden /> : null}
              </span>
            )}
            {!typing && cites.length ? (
              <span className="flex flex-wrap gap-x-3 text-[12px] text-mut">
                From{" "}
                {cites.map((c) => {
                  const cite = parseCite(c);
                  return cite ? (
                    <CiteLink key={c} cite={cite}>
                      {citeShort(cite, q?.companyId ?? "", companyShortName)}
                    </CiteLink>
                  ) : null;
                })}
              </span>
            ) : null}
          </div>
        );
      })}
      {approved ? (
        <span className="text-[13px] leading-[1.45]" style={{ color: tone.text }} data-testid="draft-done">
          {doneLine}
        </span>
      ) : (
        <div className="flex flex-wrap items-center gap-2.5">
          {editing ? (
            <Button variant="you" size={36} onClick={() => saveDraft(draft.patternId, edits)} testId="draft-save">
              Save
            </Button>
          ) : (
            <>
              <Button variant="you" size={36} onClick={() => approveDraft(draft.patternId)} testId="draft-approve" className={typing ? "pointer-events-none opacity-50" : ""}>
                Approve
              </Button>
              <Button variant="secondary" size={36} onClick={startEdit} testId="draft-edit" className={typing ? "pointer-events-none opacity-50" : ""}>
                Edit
              </Button>
            </>
          )}
          <span className="text-[13px] text-mut">{draft.kind === "intro" ? "Nothing is sent until you approve it, and then only by you." : "Approving adds it to the call questions. Nothing is sent."}</span>
        </div>
      )}
    </div>
  );
}
