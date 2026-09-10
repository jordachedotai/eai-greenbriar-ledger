// Approved pattern drafts as questions on a company page. A question draft
// the deal lead approved on Patterns joins the company's questions for the
// next call, numbered after the drafted three, only once every report it
// cites has arrived (so nothing leaks back in the Time Machine). Pure.

import type { Question } from "./types";
import { getDemoState, getDrafts } from "./data";
import { parseCite } from "./cites";
import { splitReportId } from "./reports";
import type { PatternDraft } from "./store";

export function draftQuestionId(patternId: string, companyId: string): string {
  return `draft-${patternId}-${companyId}`;
}

export function draftQuestionsFor(companyId: string, stateName: string, patternDrafts: Record<string, PatternDraft>, startAt: number): Question[] {
  const months = new Set<string>(getDemoState(stateName).months);
  const out: Question[] = [];
  for (const d of getDrafts()) {
    const pd = patternDrafts[d.patternId];
    if (!pd || pd.status !== "approved" || d.kind !== "question") continue;
    d.questions.forEach((q, i) => {
      if (q.companyId !== companyId) return;
      const within = q.cites.every((c) => {
        const cite = parseCite(c);
        return cite && months.has(splitReportId(cite.reportId).month);
      });
      if (!within) return;
      out.push({ id: draftQuestionId(d.patternId, companyId), companyId, initiativeId: q.initiativeId, n: startAt + out.length + 1, text: pd.texts[i] ?? q.text, cites: q.cites, status: "approved" });
    });
  }
  return out;
}
