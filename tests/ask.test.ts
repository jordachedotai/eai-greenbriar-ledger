// "Ask the ledger": the six scripted questions resolve to ledger reads
// only, follow the month in view, and the typeahead and the matcher find
// them. The live verifier drops anything that is not a ledger quote.

import { describe, expect, it } from "vitest";
import { getAnswers } from "@/lib/data";
import { matchQuestion, resolveAnswer, suggestions, verifyLiveItems } from "@/lib/ask";

describe("ask the ledger", () => {
  it("lists six scripted questions", () => {
    expect(getAnswers().map((a) => a.id)).toEqual(["erp-march", "slipped-quarter", "corvus-quiet", "pricing-worked", "same-vendor", "ask-dana"]);
  });

  it("the ERP question in August: the March sentence with its cite, then May", () => {
    const a = resolveAnswer(getAnswers()[0], "august");
    expect(a.items.map((i) => (i.kind === "question" ? "q" : `${i.initiativeId}:${i.month}:${i.kind}`))).toEqual(["harlan-erp:2026-03:quote", "harlan-erp:2026-05:quote"]);
    const first = a.items[0];
    if (first.kind !== "quote") throw new Error("expected a quote");
    expect(first.read.quote).toBe("Implementation on track for a June cutover. Data migration is 60% complete.");
    expect(first.read.cite).toEqual({ reportId: "harlan-2026-03", page: 2, section: "Strategic initiatives" });
    expect(a.groups.map((g) => g.companyId)).toEqual(["harlan"]);
  });

  it("follows the month in view: in March only the March sentence; in February nothing", () => {
    expect(resolveAnswer(getAnswers()[0], "core-2026-03").items).toHaveLength(1);
    expect(resolveAnswer(getAnswers()[0], "core-2026-02").items).toHaveLength(0);
  });

  it("Corvus silences: the last mention, then Not mentioned for every month after", () => {
    const a = resolveAnswer(getAnswers().find((x) => x.id === "corvus-quiet")!, "august");
    expect(a.items.map((i) => i.kind)).toEqual(["quote", "silence", "silence", "silence", "silence", "silence"]);
    const may = a.items[2];
    if (may.kind !== "silence") throw new Error("expected a silence");
    expect(may.read.change?.label).toBe("Not mentioned since March");
  });

  it("Dana's questions exist only once the August report is in, and group under Harlan", () => {
    const dana = getAnswers().find((x) => x.id === "ask-dana")!;
    expect(resolveAnswer(dana, "august").items.map((i) => (i.kind === "question" ? i.question.id : ""))).toEqual(["q-harlan-1", "q-harlan-2", "q-harlan-3"]);
    expect(resolveAnswer(dana, "july").items).toHaveLength(0);
    expect(resolveAnswer(dana, "august").groups[0].companyId).toBe("harlan");
  });

  it("answers group by company in order of appearance", () => {
    const a = resolveAnswer(getAnswers().find((x) => x.id === "pricing-worked")!, "august");
    expect(a.groups.map((g) => [g.companyId, g.items.length])).toEqual([
      ["meridian", 2],
      ["harlan", 2],
    ]);
  });

  it("typeahead filters by word starts; the matcher finds the scripted question behind a paraphrase", () => {
    expect(suggestions("").map((a) => a.id)).toHaveLength(6);
    expect(suggestions("corv").map((a) => a.id)).toEqual(["corvus-quiet"]);
    expect(suggestions("what erp").map((a) => a.id)).toEqual(["erp-march"]);
    expect(suggestions("weather")).toEqual([]);
    expect(matchQuestion("what did harlan say about the erp date in march")?.id).toBe("erp-march");
    expect(matchQuestion("Harlan ERP March")?.id).toBe("erp-march");
    expect(matchQuestion("what should I ask Dana")?.id).toBe("ask-dana");
    expect(matchQuestion("what is the weather")).toBeNull();
  });

  it("live items survive only as character-exact ledger quotes within the month in view", () => {
    const kept = verifyLiveItems(
      [
        { initiativeId: "harlan-erp", month: "2026-05", quote: "Now targeting a July go-live." },
        { initiativeId: "harlan-erp", month: "2026-05", quote: "Now targeting a July go-live." },
        { initiativeId: "harlan-erp", month: "2026-08", quote: "Phase 2 is now expected in Q1 2027 to avoid disruption during peak season." },
        { initiativeId: "harlan-erp", month: "2026-04", quote: "Something the report never said." },
        { initiativeId: "nope", month: "2026-04", quote: "Cutover planning for June is proceeding, and user training begins in May." },
        { initiativeId: "corvus-sales", month: "2026-06", quote: "" },
      ],
      "core-2026-07",
    );
    expect(kept).toEqual([{ kind: "quote", initiativeId: "harlan-erp", month: "2026-05", quote: "Now targeting a July go-live. Vendor resourcing is constrained in the integration workstream." }]);
  });
});
