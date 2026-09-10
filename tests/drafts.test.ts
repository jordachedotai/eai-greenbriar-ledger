// "Actions that draft": one canned draft per pattern; the intro names the
// two initiative owners from the ledger; an approved question draft joins
// the company's questions only once its cited reports have arrived.

import { describe, expect, it } from "vitest";
import { getDrafts, getInitiative, getPatterns } from "@/lib/data";
import { draftTexts } from "@/lib/actions";
import { draftQuestionsFor } from "@/lib/drafts";

describe("pattern drafts", () => {
  it("one draft per pattern, in pattern order", () => {
    expect(getDrafts().map((d) => d.patternId)).toEqual(getPatterns().map((p) => p.id));
  });

  it("the intro is addressed to the owners of the two TMS initiatives", () => {
    const intro = getDrafts().find((d) => d.kind === "intro");
    if (!intro || intro.kind !== "intro") throw new Error("no intro draft");
    const owners = [getInitiative("harlan-tms")?.owner, getInitiative("corvus-tms")?.owner].map((o) => (o ?? "").split(",")[0]);
    for (const o of owners) expect(intro.to.some((t) => t.startsWith(o))).toBe(true);
    expect(draftTexts("pattern-tms")).toEqual([intro.text]);
  });

  it("the comp-plan question joins Harlan's list as number four once approved, in August only", () => {
    const approved = { "pattern-pricing": { status: "approved" as const, texts: draftTexts("pattern-pricing") ?? [] } };
    const august = draftQuestionsFor("harlan", "august", approved, 3);
    expect(august).toHaveLength(1);
    expect(august[0]).toMatchObject({ id: "draft-pattern-pricing-harlan", n: 4, companyId: "harlan", initiativeId: "harlan-pricing", status: "approved" });
    expect(august[0].text).toContain("comp plan");
    expect(draftQuestionsFor("harlan", "july", approved, 3)).toHaveLength(0);
    expect(draftQuestionsFor("meridian", "august", approved, 3)).toHaveLength(0);
    expect(draftQuestionsFor("harlan", "august", { "pattern-pricing": { status: "drafted", texts: [] } }, 3)).toHaveLength(0);
  });

  it("an edited text is what joins the list", () => {
    const edited = { "pattern-vendor": { status: "approved" as const, texts: ["Which vendor?", "Which vendor, and what date?"] } };
    expect(draftQuestionsFor("corvus", "august", edited, 3)[0].text).toBe("Which vendor, and what date?");
    expect(draftQuestionsFor("harlan", "august", edited, 3)[0].text).toBe("Which vendor?");
  });
});
