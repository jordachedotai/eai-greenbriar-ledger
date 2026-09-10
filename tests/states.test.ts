// The demo states: derived from the fixtures, never typed. One state per
// company set per cutoff month; the committed data/demo-states.json equals
// what buildStates produces now. The named presets resolve to states.
// Scrubbing the cutoff from January to August: cells beyond it are
// dropped, statuses are as of that month, questions and patterns appear
// only when every cite has arrived, and notes only through the cutoff.

import { describe, expect, it } from "vitest";
import statesJson from "@/data/demo-states.json";
import ledgerJson from "@/data/ledger.json";
import arcsJson from "@/data/source/arcs.json";
import questionsJson from "@/data/questions.json";
import patternsJson from "@/data/patterns.json";
import { applyState, buildStates, fallbackSentence, nextMonth, parseViewKey, presetFor, PRESETS, resolveView, stateCounts, viewKey, withinCutoff } from "@/lib/states";
import { draftModeOf, getCompanies, getCurrentState, getDemoState, getInitiatives, getLogSorted, getMonths, getPatterns, getQuestions, getReport, getReports, getStateNames, resolveStateKey, statusCounts, worstInitiative } from "@/lib/data";
import { MONTHS, type Arc, type DemoStates, type Ledger, type Pattern, type Question } from "@/lib/types";

const committed = statesJson as DemoStates;
const ledger = ledgerJson as Ledger;
const july = committed["core-2026-07"];
const august = committed["core-2026-08"];
const monday = committed["all-2026-08"];

describe("demo states", () => {
  it("the committed file is what the generator produces from the fixtures", () => {
    const fresh = buildStates({ companies: ledger.companies, initiatives: ledger.initiatives, arcs: arcsJson as Arc[], questions: questionsJson as Question[], patterns: patternsJson as Pattern[] });
    expect(committed).toEqual(fresh);
  });

  it("has one state per company set per cutoff, sixteen in all", () => {
    expect(Object.keys(committed)).toEqual([...MONTHS.map((m) => `core-${m}`), ...MONTHS.map((m) => `all-${m}`)]);
    for (const m of MONTHS) {
      expect(committed[`core-${m}`].companyIds).toEqual(["harlan", "meridian", "corvus"]);
      expect(committed[`core-${m}`].months).toEqual(MONTHS.slice(0, MONTHS.indexOf(m) + 1));
      expect(committed[`core-${m}`].month).toBe(m);
      expect(committed[`all-${m}`].companyIds).toHaveLength(12);
    }
  });

  it("view keys and presets resolve both ways", () => {
    expect(viewKey({ set: "core", cutoff: "2026-07" })).toBe("core-2026-07");
    expect(parseViewKey("all-2026-08")).toEqual({ set: "all", cutoff: "2026-08" });
    expect(parseViewKey("core-2026-13")).toBeNull();
    expect(parseViewKey("july")).toBeNull();
    expect(resolveView("july")).toEqual({ set: "core", cutoff: "2026-07" });
    expect(resolveView("monday")).toEqual({ set: "all", cutoff: "2026-08" });
    expect(resolveView("nonsense")).toBeNull();
    expect(getStateNames()).toEqual(["july", "august", "august-approved", "monday"]);
    expect(resolveStateKey("july")).toBe("core-2026-07");
    expect(resolveStateKey("core-2026-03")).toBe("core-2026-03");
    expect(resolveStateKey("nonsense")).toBe("core-2026-08");
    expect(getDemoState().name).toBe("core-2026-08");
    expect(presetFor({ set: "core", cutoff: "2026-07" }, [])).toBe("july");
    expect(presetFor({ set: "core", cutoff: "2026-08" }, [])).toBe("august");
    expect(presetFor({ set: "core", cutoff: "2026-08" }, ["harlan"])).toBe("august-approved");
    expect(presetFor({ set: "all", cutoff: "2026-08" }, [])).toBe("monday");
    expect(presetFor({ set: "core", cutoff: "2026-05" }, [])).toBeNull();
    expect(PRESETS["august-approved"].questionsApproved).toEqual(["harlan"]);
    expect(nextMonth("2026-07")).toBe("2026-08");
    expect(nextMonth("2026-08")).toBeNull();
  });

  it("strip counts per cutoff, core three", () => {
    const want: Record<string, [number, number, number, number]> = {
      "2026-01": [0, 0, 0, 12],
      "2026-02": [0, 0, 0, 12],
      "2026-03": [0, 1, 0, 11],
      "2026-04": [0, 2, 0, 10],
      "2026-05": [0, 4, 1, 7],
      "2026-06": [0, 4, 1, 7],
      "2026-07": [1, 3, 1, 7],
      "2026-08": [2, 2, 1, 7],
    };
    for (const [m, [red, amber, grey, green]] of Object.entries(want)) expect(stateCounts(committed[`core-${m}`]), m).toEqual({ red, amber, grey, green });
  });

  it("the ERP story, month by month: green, amber in May, red in August", () => {
    const flags = MONTHS.map((m) => committed[`core-${m}`].status["harlan-erp"].flag);
    expect(flags).toEqual(["green", "green", "green", "green", "amber", "amber", "amber", "red"]);
    expect(committed["core-2026-03"].status["harlan-erp"].sentence).toBe("June cutover stated. Data migration 60% complete.");
    expect(committed["core-2026-05"].status["harlan-erp"]).toMatchObject({ pill: "Slipping" });
    expect(committed["core-2026-04"].status["harlan-plant"]).toMatchObject({ flag: "amber", pill: "Slipping" });
    expect(committed["core-2026-05"].status["corvus-sales"].flag).toBe("grey");
    expect(committed["core-2026-04"].status["corvus-sales"].flag).toBe("green");
  });

  it("chips follow the months: a parallel needs both sides reported, a benefit chip needs delivery and silence", () => {
    expect(committed["core-2026-01"].status["harlan-tms"].chip).toBeUndefined();
    expect(committed["core-2026-01"].status["corvus-tms"].chip).toBeUndefined();
    expect(committed["core-2026-02"].status["harlan-tms"].chip?.text).toBe("Parallel with Corvus");
    expect(committed["core-2026-02"].status["corvus-tms"].chip?.text).toBe("Parallel with Harlan");
    expect(committed["core-2026-06"].status["meridian-pricing"]).toMatchObject({ pill: "Delivered" });
    expect(committed["core-2026-06"].status["meridian-pricing"].chip).toBeUndefined();
    expect(committed["core-2026-07"].status["meridian-pricing"].chip?.text).toBe("Benefit not rolled up");
  });

  it("july: seven months, 1 / 3 / 1 / 7, ERP amber, no questions, one pattern", () => {
    expect(july.months).toEqual(MONTHS.slice(0, 7));
    expect(stateCounts(july)).toEqual({ red: 1, amber: 3, grey: 1, green: 7 });
    expect(july.status["harlan-erp"]).toMatchObject({ flag: "amber", pill: "Slipping" });
    expect(july.status["corvus-mro"].flag).toBe("red");
    expect(july.status["corvus-sales"].flag).toBe("grey");
    expect(july.status["meridian-pricing"]).toMatchObject({ pill: "Delivered", chip: { text: "Benefit not rolled up" } });
    expect(july.status["harlan-tms"].chip?.text).toBe("Parallel with Corvus");
    expect(july.questionIds).toEqual([]);
    expect(july.patternIds).toEqual(["pattern-tms"]);
    expect(july.cutoff).toBe("2026-07-31");
  });

  it("questions and patterns appear only when every cite has arrived", () => {
    for (const m of MONTHS.slice(0, 7)) expect(committed[`core-${m}`].questionIds, m).toEqual([]);
    expect(august.questionIds).toHaveLength(9);
    const patterns = MONTHS.map((m) => committed[`core-${m}`].patternIds);
    expect(patterns).toEqual([[], [], [], [], [], ["pattern-tms"], ["pattern-tms"], ["pattern-tms", "pattern-pricing", "pattern-vendor"]]);
  });

  it("august: eight months, 2 / 2 / 1 / 7, the ledger's own statuses, nine questions", () => {
    expect(august.months).toEqual(MONTHS);
    expect(stateCounts(august)).toEqual({ red: 2, amber: 2, grey: 1, green: 7 });
    const inState = ledger.initiatives.filter((i) => august.companyIds.includes(i.companyId));
    expect(inState).toHaveLength(12);
    for (const i of inState) expect(august.status[i.id]).toEqual(i.status);
    expect(august.questionIds).toHaveLength(9);
    expect(august.cutoff).toBeNull();
  });

  it("monday: twelve companies, thirty initiatives, 2 / 2 / 1 / 25, every cell a quote with a cite that resolves", () => {
    expect(monday.companyIds).toHaveLength(12);
    expect(monday.companyIds.slice(0, 3)).toEqual(["harlan", "meridian", "corvus"]);
    expect(monday.months).toEqual(MONTHS);
    expect(monday.cutoff).toBeNull();
    expect(Object.keys(monday.status)).toHaveLength(30);
    expect(stateCounts(monday)).toEqual({ red: 2, amber: 2, grey: 1, green: 25 });
    // The core three read exactly as they do in august.
    for (const id of Object.keys(august.status)) expect(monday.status[id]).toEqual(august.status[id]);
    expect(monday.questionIds).toEqual(august.questionIds);
    expect(monday.patternIds).toEqual(august.patternIds);
    // Every cell: a mentioned month has a verbatim quote on the cited page
    // of a report that exists; an unmentioned month has neither.
    let quiet = 0;
    for (const i of applyState(ledger.initiatives, monday)) {
      expect(monday.companyIds).toContain(i.companyId);
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
    const coreQuiet = (arcsJson as Arc[]).filter((a) => august.companyIds.includes(a.companyId)).flatMap((a) => MONTHS.filter((m) => a.months[m].sentence === null)).length;
    expect(quiet).toBe(coreQuiet + 2);
  });

  it("the nine extra companies read a verbatim sentence at earlier cutoffs, never a paraphrase", () => {
    const byId = new Map(ledger.initiatives.map((i) => [i.id, i]));
    for (const m of MONTHS.slice(0, 7)) {
      const state = committed[`all-${m}`];
      for (const id of Object.keys(state.status)) {
        if (august.status[id]) continue;
        const i = byId.get(id)!;
        expect(state.status[id].sentence).toBe(fallbackSentence(i, m));
        const read = i.months[m];
        if (read?.mentioned) expect(state.status[id].sentence).toBe(read.quote);
      }
    }
    // Brightwater's expansion, quiet in May and June, names the last mention.
    expect(committed["all-2026-06"].status["brightwater-expansion"].sentence).toMatch(/^Last mentioned in April: "Ground was broken/);
    expect(committed["all-2026-06"].status["brightwater-expansion"].flag).toBe("grey");
  });

  it("applying july drops August from every initiative", () => {
    const list = applyState(ledger.initiatives, july).filter((i) => july.companyIds.includes(i.companyId));
    expect(list).toHaveLength(12);
    for (const i of list) {
      expect(Object.keys(i.months)).toEqual(MONTHS.slice(0, 7));
      expect(i.status).toEqual(july.status[i.id]);
    }
    const march = applyState(ledger.initiatives, committed["core-2026-03"]).find((i) => i.id === "harlan-erp")!;
    expect(Object.keys(march.months)).toEqual(MONTHS.slice(0, 3));
  });

  it("the cutoff hides notes written after the state", () => {
    expect(withinCutoff("2026-07-09", july)).toBe(true);
    expect(withinCutoff("2026-08-07", july)).toBe(false);
    expect(withinCutoff("2026-09-04", august)).toBe(true);
    expect(committed["core-2026-03"].cutoff).toBe("2026-03-31");
  });
});

describe("data layer reads through the state", () => {
  it("counts and months per state, by preset name or view key", () => {
    expect(statusCounts(getInitiatives(undefined, "july"))).toMatchObject({ red: 1, amber: 3, grey: 1, green: 7 });
    expect(statusCounts(getInitiatives(undefined, "core-2026-07"))).toMatchObject({ red: 1, amber: 3, grey: 1, green: 7 });
    expect(statusCounts(getInitiatives(undefined, "core-2026-05"))).toMatchObject({ red: 0, amber: 4, grey: 1, green: 7 });
    expect(statusCounts(getInitiatives())).toMatchObject({ red: 2, amber: 2, grey: 1, green: 7 });
    expect(getMonths("july")).toHaveLength(7);
    expect(getMonths("core-2026-02")).toHaveLength(2);
    expect(getMonths()).toHaveLength(8);
    expect(getReports(undefined, "july")).toHaveLength(21);
    expect(getReports(undefined, "core-2026-03")).toHaveLength(9);
    expect(getReports()).toHaveLength(24);
    expect(getReports(undefined, "monday")).toHaveLength(96);
  });

  it("companies per state: three by default, twelve in monday", () => {
    expect(getCompanies().map((c) => c.id)).toEqual(["harlan", "meridian", "corvus"]);
    expect(getCompanies("monday")).toHaveLength(12);
    expect(getCompanies("all-2026-04")).toHaveLength(12);
    expect(getInitiatives()).toHaveLength(12);
    expect(getInitiatives(undefined, "monday")).toHaveLength(30);
    expect(getInitiatives("brightwater")).toEqual([]);
    expect(getInitiatives("brightwater", "monday")).toHaveLength(2);
    expect(statusCounts(getInitiatives(undefined, "monday"))).toMatchObject({ red: 2, amber: 2, grey: 1, green: 25, delivered: 7 });
  });

  it("Harlan opens on the ERP in both states, and on the plant in April", () => {
    expect(worstInitiative("harlan", "july")?.id).toBe("harlan-erp");
    expect(worstInitiative("harlan")?.id).toBe("harlan-erp");
    expect(worstInitiative("harlan", "core-2026-04")?.id).toBe("harlan-plant");
  });

  it("questions and patterns per state", () => {
    expect(getQuestions("harlan", "july")).toEqual([]);
    expect(getQuestions("harlan")).toHaveLength(3);
    expect(getPatterns("july").map((p) => p.id)).toEqual(["pattern-tms"]);
    expect(getPatterns("core-2026-05")).toEqual([]);
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

  it("an earlier cutoff hides log entries and state lines written after it", () => {
    expect(getLogSorted({ stateName: "july" }).every((e) => e.date <= "2026-07-31")).toBe(true);
    expect(getCurrentState("harlan", { stateName: "july" })?.lines.every((l) => l.date <= "2026-07-31")).toBe(true);
    expect(getLogSorted({ stateName: "july" })).toHaveLength(3);
    expect(getLogSorted({ stateName: "core-2026-03" }).every((e) => e.date <= "2026-03-31")).toBe(true);
    expect(getLogSorted({ stateName: "core-2026-03" }).length).toBeLessThan(3);
  });
});
