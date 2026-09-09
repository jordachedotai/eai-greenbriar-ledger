import { describe, expect, it } from "vitest";
import { flagAt, flagsFor, pillFor, RULES } from "@/lib/flags";
import { changesFor, type MonthInput } from "@/lib/diff";
import { MONTHS, type Facts, type Month } from "@/lib/types";

// Build eight months from a sparse spec. A string is a shorthand for a
// dated commitment on the key "go-live"; null is not mentioned; an object
// is the facts as the structure step would return them.
type Spec = string | null | Facts | undefined;
function months(spec: Partial<Record<Month, Spec>>): MonthInput[] {
  return MONTHS.map((m) => {
    const s = spec[m];
    if (s === null) return { month: m, mentioned: false };
    if (s === undefined) return { month: m, mentioned: true, facts: {} };
    if (typeof s === "string") return { month: m, mentioned: true, facts: { commitments: [{ key: "go-live", kind: "date", value: s }] } };
    return { month: m, mentioned: true, facts: s };
  });
}
const init = { targetDate: "2026-Q2" };

describe("flag rules", () => {
  it("exports four rules, one per color", () => {
    expect(RULES.map((r) => r.flag)).toEqual(["green", "amber", "red", "grey"]);
  });

  it("green when nothing moves", () => {
    const ms = months({ "2026-01": "2026-Q2", "2026-03": "2026-06" });
    expect(flagsFor(init, ms)).toEqual(Object.fromEntries(MONTHS.map((m) => [m, "green"])));
  });

  it("amber after one date move of a month", () => {
    const ms = months({ "2026-01": "2026-Q2", "2026-05": "2026-07" });
    expect(flagAt(init, ms, "2026-04")).toBe("green");
    expect(flagAt(init, ms, "2026-05")).toBe("amber");
    expect(flagAt(init, ms, "2026-08")).toBe("amber");
  });

  it("red after two date moves", () => {
    const ms = months({ "2026-01": "2026-Q2", "2026-05": "2026-07", "2026-07": "2026-08" });
    expect(flagAt(init, ms, "2026-06")).toBe("amber");
    expect(flagAt(init, ms, "2026-07")).toBe("red");
  });

  it("red after one move of a quarter or more", () => {
    const ms = months({ "2026-01": "2026-Q2", "2026-05": "2026-Q3" });
    expect(flagAt(init, ms, "2026-05")).toBe("red");
  });

  it("a date move plus a scope change is amber, not red", () => {
    const ms = months({
      "2026-01": "2026-Q2",
      "2026-05": "2026-07",
      "2026-06": { commitments: [{ key: "go-live", kind: "date", value: "2026-07" }, { key: "phase-2", kind: "date", value: "2026-Q4", label: "Scope split: phase 2 added" }] },
    });
    expect(flagAt(init, ms, "2026-06")).toBe("amber");
    expect(changesFor(init, ms)["2026-06"]).toEqual({ kind: "scope", to: "phase-2", label: "Scope split: phase 2 added" });
  });

  it("red when the same reason is stated twice with no plan change", () => {
    const ms = months({
      "2026-01": "2026-Q2",
      "2026-05": { commitments: [{ key: "go-live", kind: "date", value: "2026-07" }], reason: "vendor resourcing" },
      "2026-06": { reason: "Vendor resourcing" },
    });
    expect(flagAt(init, ms, "2026-05")).toBe("amber");
    expect(flagAt(init, ms, "2026-06")).toBe("red");
    expect(changesFor(init, ms)["2026-06"]).toEqual({ kind: "reason", from: "May", label: "Same reason as May: Vendor resourcing" });
  });

  it("the same reason with a plan change between is not the repeat rule", () => {
    const ms = months({
      "2026-01": "2026-Q2",
      "2026-05": { reason: "vendor resourcing" },
      "2026-06": { commitments: [{ key: "go-live", kind: "date", value: "2026-07" }], reason: "vendor resourcing" },
    });
    // One move, so amber; the reason repeat does not fire because the plan changed in June.
    expect(flagAt(init, ms, "2026-06")).toBe("amber");
  });

  it("amber when the target is restated without a date, green once a date is stated again", () => {
    const ms = months({ "2026-01": "2026-Q2", "2026-04": { restatedWithoutDate: true }, "2026-05": { restatedWithoutDate: true }, "2026-06": "2026-Q2" });
    expect(flagAt(init, ms, "2026-03")).toBe("green");
    expect(flagAt(init, ms, "2026-04")).toBe("amber");
    expect(flagAt(init, ms, "2026-05")).toBe("amber");
    expect(flagAt(init, ms, "2026-06")).toBe("green");
    const ch = changesFor(init, ms);
    expect(ch["2026-04"]).toEqual({ kind: "date", from: "Q2 2026", label: "Restated without a date" });
    expect(ch["2026-05"]).toBeUndefined();
  });

  it("a measure moving the wrong way is amber and stays amber, never red on its own", () => {
    const m = (v: number): Facts => ({ measure: { value: v, unit: "%" } });
    const ms = months({ "2026-01": m(48), "2026-02": m(46), "2026-03": m(44), "2026-04": m(45), "2026-05": m(45), "2026-06": m(46), "2026-07": m(47), "2026-08": m(47) });
    const down = { targetDate: "2026-12", measureDirection: "down" as const };
    expect(flagAt(down, ms, "2026-03")).toBe("green");
    expect(flagAt(down, ms, "2026-04")).toBe("amber");
    expect(flagAt(down, ms, "2026-05")).toBe("amber");
    expect(flagAt(down, ms, "2026-07")).toBe("amber");
    expect(flagAt(down, ms, "2026-08")).toBe("amber");
    const ch = changesFor(down, ms);
    expect(ch["2026-04"]?.label).toBe("Number moved: 44% to 45%");
    expect(ch["2026-05"]).toBeUndefined();
  });

  it("grey after two consecutive unmentioned months, not one", () => {
    const ms = months({ "2026-01": "2026-Q2", "2026-04": null, "2026-05": null, "2026-06": null, "2026-07": null, "2026-08": null });
    expect(flagAt(init, ms, "2026-04")).toBe("green");
    expect(flagAt(init, ms, "2026-05")).toBe("grey");
    expect(flagAt(init, ms, "2026-08")).toBe("grey");
    const ch = changesFor(init, ms);
    expect(ch["2026-05"]).toEqual({ kind: "silent", from: "March", label: "Not mentioned since March" });
    expect(ch["2026-06"]).toBeUndefined();
  });

  it("a single quiet month between mentions does not go grey", () => {
    const ms = months({ "2026-01": null, "2026-02": "2026-Q2", "2026-03": null, "2026-06": null });
    expect(flagsFor(init, ms)).toEqual(Object.fromEntries(MONTHS.map((m) => [m, "green"])));
  });

  it("not grey after completion is stated, and the pill says Delivered", () => {
    const ms = months({ "2026-01": "2026-Q2", "2026-06": { completed: "Delivered" }, "2026-07": null, "2026-08": null });
    expect(flagAt(init, ms, "2026-08")).toBe("green");
    expect(pillFor("green", "Delivered")).toBe("Delivered");
    expect(pillFor("green")).toBe("On track");
    expect(pillFor("red")).toBe("Needs a conversation");
  });
});
