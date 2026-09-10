// The ground truth agrees with the rules: for every initiative and month,
// the flag the code produces is the flag arcs.json says it should, and the
// change chip matches.

import { describe, expect, it } from "vitest";
import arcs from "@/data/source/arcs.json";
import companies from "@/data/source/companies.json";
import { flagsFor } from "@/lib/flags";
import { changesFor, type MonthInput } from "@/lib/diff";
import { MONTHS, type Arc, type Company } from "@/lib/types";

const list = arcs as Arc[];
const coreIds = new Set((companies as Company[]).filter((c) => c.core).map((c) => c.id));
const core = list.filter((a) => coreIds.has(a.companyId));
const extra = list.filter((a) => !coreIds.has(a.companyId));

function inputs(a: Arc): MonthInput[] {
  return MONTHS.map((m) => ({ month: m, mentioned: a.months[m].sentence !== null, facts: a.months[m].facts }));
}

describe("arcs.json against the rules", () => {
  it("has twelve core initiatives and eighteen more for monday, eight months each", () => {
    expect(core).toHaveLength(12);
    expect(extra).toHaveLength(18);
    for (const a of list) expect(Object.keys(a.months).sort()).toEqual([...MONTHS].sort());
  });

  for (const a of list) {
    it(`${a.id}: flags match`, () => {
      const got = flagsFor(a, inputs(a));
      const want = Object.fromEntries(MONTHS.map((m) => [m, a.months[m].flag]));
      expect(got).toEqual(want);
    });
    it(`${a.id}: changes match`, () => {
      const got = changesFor(a, inputs(a));
      for (const m of MONTHS) expect({ m, change: got[m] }).toEqual({ m, change: a.months[m].change });
    });
  }

  it("core August counts are 2 red, 2 amber, 1 grey, 7 green; July counts are 1, 3, 1, 7", () => {
    const count = (month: "2026-07" | "2026-08") => {
      const c = { red: 0, amber: 0, grey: 0, green: 0 };
      for (const a of core) c[a.months[month].flag] += 1;
      return c;
    };
    expect(count("2026-08")).toEqual({ red: 2, amber: 2, grey: 1, green: 7 });
    expect(count("2026-07")).toEqual({ red: 1, amber: 3, grey: 1, green: 7 });
  });

  it("the eighteen monday arcs: green in August, one amber month in three companies, one grey month in one", () => {
    for (const a of extra) expect(a.months["2026-08"].flag).toBe("green");
    const with_ = (flag: string) => new Set(extra.filter((a) => MONTHS.some((m) => a.months[m].flag === flag)).map((a) => a.companyId));
    expect(with_("amber").size).toBe(3);
    expect(with_("grey").size).toBe(1);
    expect(with_("red").size).toBe(0);
    for (const a of extra) {
      const amber = MONTHS.filter((m) => a.months[m].flag === "amber");
      const grey = MONTHS.filter((m) => a.months[m].flag === "grey");
      expect(amber.length).toBeLessThanOrEqual(1);
      expect(grey.length).toBeLessThanOrEqual(1);
      for (const m of MONTHS) {
        const r = a.months[m];
        if (r.sentence !== null) {
          expect(r.sentence.length).toBeGreaterThan(0);
          expect(r.sentence).not.toContain("\n");
        } else {
          // Only the grey arc goes quiet, for the two months before its grey cell.
          expect(grey.length).toBe(1);
        }
      }
    }
  });

  it("no em-dashes in the ground truth", () => {
    expect(JSON.stringify(list)).not.toContain("—");
  });
});
