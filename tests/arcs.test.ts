// The ground truth agrees with the rules: for every initiative and month,
// the flag the code produces is the flag arcs.json says it should, and the
// change chip matches.

import { describe, expect, it } from "vitest";
import arcs from "@/data/source/arcs.json";
import { flagsFor } from "@/lib/flags";
import { changesFor, type MonthInput } from "@/lib/diff";
import { MONTHS, type Arc } from "@/lib/types";

const list = arcs as Arc[];

function inputs(a: Arc): MonthInput[] {
  return MONTHS.map((m) => ({ month: m, mentioned: a.months[m].sentence !== null, facts: a.months[m].facts }));
}

describe("arcs.json against the rules", () => {
  it("has twelve initiatives with eight months each", () => {
    expect(list).toHaveLength(12);
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

  it("August counts are 2 red, 2 amber, 1 grey, 7 green; July counts are 1, 3, 1, 7", () => {
    const count = (month: "2026-07" | "2026-08") => {
      const c = { red: 0, amber: 0, grey: 0, green: 0 };
      for (const a of list) c[a.months[month].flag] += 1;
      return c;
    };
    expect(count("2026-08")).toEqual({ red: 2, amber: 2, grey: 1, green: 7 });
    expect(count("2026-07")).toEqual({ red: 1, amber: 3, grey: 1, green: 7 });
  });

  it("no em-dashes in the ground truth", () => {
    expect(JSON.stringify(list)).not.toContain("—");
  });
});
