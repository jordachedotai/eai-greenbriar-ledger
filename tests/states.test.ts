// The demo states: derived from the fixtures, never typed. The committed
// data/demo-states.json equals what buildStates produces now; july is the
// ledger through July with the intended counts and no questions; applying
// a state drops the months that have not arrived.

import { describe, expect, it } from "vitest";
import statesJson from "@/data/demo-states.json";
import ledgerJson from "@/data/ledger.json";
import arcsJson from "@/data/source/arcs.json";
import questionsJson from "@/data/questions.json";
import patternsJson from "@/data/patterns.json";
import { applyState, buildStates, stateCounts, withinCutoff } from "@/lib/states";
import { draftModeOf, getCurrentState, getInitiatives, getLogSorted, getMonths, getPatterns, getQuestions, getReports, statusCounts, worstInitiative } from "@/lib/data";
import { MONTHS, type Arc, type DemoStates, type Ledger, type Pattern, type Question } from "@/lib/types";

const committed = statesJson as DemoStates;
const ledger = ledgerJson as Ledger;

describe("demo states", () => {
  it("the committed file is what the generator produces from the fixtures", () => {
    const fresh = buildStates({ initiatives: ledger.initiatives, arcs: arcsJson as Arc[], questions: questionsJson as Question[], patterns: patternsJson as Pattern[] });
    expect(committed).toEqual(fresh);
  });

  it("has july, august, and august-approved", () => {
    expect(Object.keys(committed)).toEqual(["july", "august", "august-approved"]);
  });

  it("july: seven months, 1 / 3 / 1 / 7, ERP amber, no questions, one pattern", () => {
    const j = committed.july;
    expect(j.months).toEqual(MONTHS.slice(0, 7));
    expect(j.month).toBe("2026-07");
    expect(stateCounts(j)).toEqual({ red: 1, amber: 3, grey: 1, green: 7 });
    expect(j.status["harlan-erp"]).toMatchObject({ flag: "amber", pill: "Slipping" });
    expect(j.status["corvus-mro"].flag).toBe("red");
    expect(j.status["corvus-sales"].flag).toBe("grey");
    expect(j.status["meridian-pricing"]).toMatchObject({ pill: "Delivered", chip: { text: "Benefit not rolled up" } });
    expect(j.status["harlan-tms"].chip?.text).toBe("Parallel with Corvus");
    expect(j.questionIds).toEqual([]);
    expect(j.patternIds).toEqual(["pattern-tms"]);
    expect(j.cutoff).toBe("2026-07-31");
  });

  it("august: eight months, 2 / 2 / 1 / 7, the ledger's own statuses, nine questions", () => {
    const a = committed.august;
    expect(a.months).toEqual(MONTHS);
    expect(stateCounts(a)).toEqual({ red: 2, amber: 2, grey: 1, green: 7 });
    for (const i of ledger.initiatives) expect(a.status[i.id]).toEqual(i.status);
    expect(a.questionIds).toHaveLength(9);
    expect(a.questionsApproved).toEqual([]);
    expect(a.cutoff).toBeNull();
  });

  it("august-approved is august with Harlan approved", () => {
    const { questionsApproved: a, ...restA } = committed["august-approved"];
    const { questionsApproved: b, ...restB } = committed.august;
    expect(a).toEqual(["harlan"]);
    expect(b).toEqual([]);
    expect({ ...restA, name: "", label: restB.label }).toEqual({ ...restB, name: "" });
  });

  it("applying july drops August from every initiative", () => {
    const list = applyState(ledger.initiatives, committed.july);
    for (const i of list) {
      expect(Object.keys(i.months)).toEqual(MONTHS.slice(0, 7));
      expect(i.status).toEqual(committed.july.status[i.id]);
    }
  });

  it("the cutoff hides notes written after the state", () => {
    expect(withinCutoff("2026-07-09", committed.july)).toBe(true);
    expect(withinCutoff("2026-08-07", committed.july)).toBe(false);
    expect(withinCutoff("2026-09-04", committed.august)).toBe(true);
  });
});

describe("data layer reads through the state", () => {
  it("counts and months per state", () => {
    expect(statusCounts(getInitiatives(undefined, "july"))).toMatchObject({ red: 1, amber: 3, grey: 1, green: 7 });
    expect(statusCounts(getInitiatives())).toMatchObject({ red: 2, amber: 2, grey: 1, green: 7 });
    expect(getMonths("july")).toHaveLength(7);
    expect(getMonths()).toHaveLength(8);
    expect(getReports(undefined, "july")).toHaveLength(21);
    expect(getReports()).toHaveLength(24);
  });

  it("Harlan opens on the ERP in both states", () => {
    expect(worstInitiative("harlan", "july")?.id).toBe("harlan-erp");
    expect(worstInitiative("harlan")?.id).toBe("harlan-erp");
  });

  it("questions and patterns per state", () => {
    expect(getQuestions("harlan", "july")).toEqual([]);
    expect(getQuestions("harlan")).toHaveLength(3);
    expect(getPatterns("july").map((p) => p.id)).toEqual(["pattern-tms"]);
    expect(getPatterns()).toHaveLength(3);
  });

  it("the dictated drafts: hidden, then draft, then confirmed", () => {
    expect(draftModeOf({ noteDictated: false, noteReviewed: false })).toBe("hidden");
    expect(draftModeOf({ noteDictated: true, noteReviewed: false })).toBe("draft");
    expect(draftModeOf({ noteDictated: true, noteReviewed: true })).toBe("confirmed");
    expect(getLogSorted({ companyId: "meridian" }).some((e) => e.status === "draft")).toBe(false);
    const draft = getLogSorted({ companyId: "meridian", drafts: "draft" }).find((e) => e.id === "log-meridian-0828-draft");
    expect(draft?.status).toBe("draft");
    const confirmed = getLogSorted({ companyId: "meridian", drafts: "confirmed" }).find((e) => e.id === "log-meridian-0828-draft");
    expect(confirmed?.status).toBe("confirmed");
    expect(getCurrentState("meridian")?.lines.some((l) => l.status === "draft")).toBe(false);
    expect(getCurrentState("meridian", { drafts: "draft" })?.lines.filter((l) => l.status === "draft")).toHaveLength(1);
    const kept = getCurrentState("meridian", { drafts: "confirmed" })?.lines;
    expect(kept?.some((l) => l.status === "draft")).toBe(false);
    expect(kept).toHaveLength(6);
  });

  it("july hides log entries and state lines written after July", () => {
    expect(getLogSorted({ stateName: "july" }).every((e) => e.date <= "2026-07-31")).toBe(true);
    expect(getCurrentState("harlan", { stateName: "july" })?.lines.every((l) => l.date <= "2026-07-31")).toBe(true);
    expect(getLogSorted({ stateName: "july" })).toHaveLength(3);
  });
});
