// The quote stack: which months show collapsed, which show expanded, and
// the line that names the quiet months. Runs against the real ledger so
// the ERP stack the demo depends on is pinned.

import { describe, expect, it } from "vitest";
import { getInitiative, getInitiatives } from "@/lib/data";
import { expandLabel, keyMonths, mentionedMonths, quietLine, quietMonths, silentTail, stackMonths } from "@/lib/stack";
import { joinList, numberWord } from "@/lib/format";
import { MONTHS, type Initiative } from "@/lib/types";

const erp = getInitiative("harlan-erp") as Initiative;
const sales = getInitiative("corvus-sales") as Initiative;
const cfo = getInitiative("meridian-cfo") as Initiative;

describe("quote stack selection", () => {
  it("Harlan ERP collapsed: January, March, May, June, August", () => {
    expect(stackMonths(erp, false)).toEqual(["2026-01", "2026-03", "2026-05", "2026-06", "2026-08"]);
  });

  it("Harlan ERP expanded: all eight months", () => {
    expect(stackMonths(erp, true)).toEqual(MONTHS);
    expect(expandLabel(erp)).toBe("Show all eight months");
  });

  it("Harlan ERP quiet line names February, April, and July", () => {
    expect(quietMonths(erp)).toEqual(["2026-02", "2026-04", "2026-07"]);
    expect(quietLine(erp)).toBe("February, April, and July mention the initiative without a change.");
    expect(silentTail(erp)).toEqual([]);
  });

  it("the first mention is always in the collapsed stack", () => {
    for (const i of getInitiatives()) {
      const first = mentionedMonths(i)[0];
      expect(keyMonths(i)[0]).toBe(first);
      expect(stackMonths(i, false)).toContain(first);
    }
  });

  it("collapsed is a subset of expanded, in month order, and covers every change", () => {
    for (const i of getInitiatives()) {
      const collapsed = stackMonths(i, false);
      const expanded = stackMonths(i, true);
      expect(expanded.filter((m) => collapsed.includes(m))).toEqual(collapsed);
      for (const m of expanded) if (i.months[m].change) expect(collapsed).toContain(m);
      expect(new Set([...collapsed, ...quietMonths(i)]).size).toBe(expanded.length);
    }
  });

  it("Corvus sales: three mentions, then silent from April", () => {
    expect(mentionedMonths(sales)).toEqual(["2026-01", "2026-02", "2026-03"]);
    expect(stackMonths(sales, false)).toEqual(["2026-01"]);
    expect(quietLine(sales)).toBe("February and March mention the initiative without a change.");
    expect(silentTail(sales)).toEqual(["2026-04", "2026-05", "2026-06", "2026-07", "2026-08"]);
    expect(expandLabel(sales)).toBe("Show all three months");
  });

  it("a single quiet month reads in the singular", () => {
    const one: Initiative = { ...cfo, months: { ...cfo.months } };
    // Keep January (first mention) and August (change), make February the only quiet month.
    for (const m of MONTHS) {
      if (m === "2026-01" || m === "2026-02" || m === "2026-08") continue;
      one.months[m] = { mentioned: false, flag: "green" };
    }
    one.months["2026-02"] = { ...one.months["2026-02"], mentioned: true, change: undefined };
    expect(quietLine(one)).toBe("February mentions the initiative without a change.");
  });

  it("no quiet line when every mentioned month is in the stack", () => {
    const tight: Initiative = { ...erp, months: { ...erp.months } };
    for (const m of ["2026-02", "2026-04", "2026-07"] as const) tight.months[m] = { mentioned: false, flag: "green" };
    expect(quietLine(tight)).toBeNull();
    expect(stackMonths(tight, false)).toEqual(stackMonths(tight, true));
  });
});

describe("format helpers the stack uses", () => {
  it("joins lists the way the artboard does", () => {
    expect(joinList([])).toBe("");
    expect(joinList(["May"])).toBe("May");
    expect(joinList(["May", "June"])).toBe("May and June");
    expect(joinList(["February", "April", "July"])).toBe("February, April, and July");
  });
  it("spells small numbers", () => {
    expect(numberWord(8)).toBe("eight");
    expect(numberWord(3)).toBe("three");
    expect(numberWord(13)).toBe("13");
  });
});
