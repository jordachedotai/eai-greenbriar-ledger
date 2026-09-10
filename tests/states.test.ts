// The demo states: derived from the fixtures, never typed. The committed
// data/demo-states.json equals what buildStates produces now; july is the
// ledger through July with the intended counts and no questions; applying
// a state drops the months that have not arrived; monday shows all twelve
// companies with every cell a quote and a cite.

import { describe, expect, it } from "vitest";
import statesJson from "@/data/demo-states.json";
import ledgerJson from "@/data/ledger.json";
import arcsJson from "@/data/source/arcs.json";
import questionsJson from "@/data/questions.json";
import patternsJson from "@/data/patterns.json";
import { applyState, buildStates, stateCounts, withinCutoff } from "@/lib/states";
import { draftModeOf, getCompanies, getCurrentState, getInitiatives, getLogSorted, getMonths, getPatterns, getQuestions, getReport, getReports, statusCounts, worstInitiative } from "@/lib/data";
import { MONTHS, type Arc, type DemoStates, type Ledger, type Pattern, type Question } from "@/lib/types";

const committed = statesJson as DemoStates;
const ledger = ledgerJson as Ledger;

describe("demo states", () => {
  it("the committed file is what the generator produces from the fixtures", () => {
    const fresh = buildStates({ companies: ledger.companies, initiatives: ledger.initiatives, arcs: arcsJson as Arc[], questions: questionsJson as Question[], patterns: patternsJson as Pattern[] });
    expect(committed).toEqual(fresh);
  });

  it("has july, august, august-approved, and monday", () => {
    expect(Object.keys(committed)).toEqual(["july", "august", "august-approved", "monday"]);
    for (const name of ["july", "august", "august-approved"]) expect(committed[name].companyIds).toEqual(["harlan", "meridian", "corvus"]);
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
    const inState = ledger.initiatives.filter((i) => a.companyIds.includes(i.companyId));
    expect(inState).toHaveLength(12);
    for (const i of inState) expect(a.status[i.id]).toEqual(i.status);
    expect(a.questionIds).toHaveLength(9);
    expect(a.questionsApproved).toEqual([]);
    expect(a.cutoff).toBeNull();
  });

  it("monday: twelve companies, thirty initiatives, 2 / 2 / 1 / 25, every cell a quote with a cite that resolves", () => {
    const m = committed.monday;
    expect(m.companyIds).toHaveLength(12);
    expect(m.companyIds.slice(0, 3)).toEqual(["harlan", "meridian", "corvus"]);
    expect(m.months).toEqual(MONTHS);
    expect(m.month).toBe("2026-08");
    expect(m.cutoff).toBeNull();
    expect(Object.keys(m.status)).toHaveLength(30);
    expect(stateCounts(m)).toEqual({ red: 2, amber: 2, grey: 1, green: 25 });
    // The core three read exactly as they do in august.
    for (const id of Object.keys(committed.august.status)) expect(m.status[id]).toEqual(committed.august.status[id]);
    expect(m.questionIds).toEqual(committed.august.questionIds);
    expect(m.patternIds).toEqual(committed.august.patternIds);
    expect(m.questionsApproved).toEqual([]);
    // Every cell: a mentioned month has a verbatim quote on the cited page
    // of a report that exists; an unmentioned month has neither.
    let quiet = 0;
    for (const i of applyState(ledger.initiatives, m)) {
      expect(m.companyIds).toContain(i.companyId);
      for (const month of MONTHS) {
        const r = i.months[month];
        expect(r).toBeDefined();
        if (!r) continue;
        if (r.mentioned) {
          expect(r.quote).toBeTruthy();
          expect(r.cite).toBeDefined();
          const report = getReport(r.cite!.reportId);
          expect(report?.companyId).toBe(i.companyId);
          expect(report?.month).toBe(month);
          const page = report?.pages.find((p) => p.n === r.cite!.page);
          expect(page?.text).toContain(r.quote!);
        } else {
          quiet += 1;
          expect(r.quote).toBeUndefined();
          expect(r.cite).toBeUndefined();
        }
      }
    }
    // The core three go quiet where arcs.json says; the nine extra
    // companies only for Brightwater's expansion in May and June.
    const coreQuiet = (arcsJson as Arc[]).filter((a) => committed.august.companyIds.includes(a.companyId)).flatMap((a) => MONTHS.filter((m) => a.months[m].sentence === null)).length;
    expect(quiet).toBe(coreQuiet + 2);
  });

  it("august-approved is august with Harlan approved", () => {
    const { questionsApproved: a, ...restA } = committed["august-approved"];
    const { questionsApproved: b, ...restB } = committed.august;
    expect(a).toEqual(["harlan"]);
    expect(b).toEqual([]);
    expect({ ...restA, name: "", label: restB.label }).toEqual({ ...restB, name: "" });
  });

  it("applying july drops August from every initiative", () => {
    const list = applyState(ledger.initiatives, committed.july).filter((i) => committed.july.companyIds.includes(i.companyId));
    expect(list).toHaveLength(12);
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
    expect(getReports(undefined, "monday")).toHaveLength(96);
  });

  it("companies per state: three by default, twelve in monday", () => {
    expect(getCompanies().map((c) => c.id)).toEqual(["harlan", "meridian", "corvus"]);
    expect(getCompanies("monday")).toHaveLength(12);
    expect(getInitiatives()).toHaveLength(12);
    expect(getInitiatives(undefined, "monday")).toHaveLength(30);
    expect(getInitiatives("brightwater")).toEqual([]);
    expect(getInitiatives("brightwater", "monday")).toHaveLength(2);
    expect(statusCounts(getInitiatives(undefined, "monday"))).toMatchObject({ red: 2, amber: 2, grey: 1, green: 25, delivered: 7 });
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
