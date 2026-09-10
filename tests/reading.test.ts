// The reading log: one line per finding for the month after a state's
// cutoff, from the ledger, in board order. Every read line's cite is a
// real page with the sentence on it, so the log never invents a finding.

import { describe, expect, it } from "vitest";
import { getReport } from "@/lib/data";
import { readingInterval, readingLines, readingTarget, READING_LINE_MAX_MS, READING_LINE_MIN_MS } from "@/lib/reading";
import { pageText } from "@/lib/reports";
import { MONTHS } from "@/lib/types";

describe("reading log", () => {
  it("from July, adds August: three reports, twelve reads, one summary, in board order", () => {
    expect(readingTarget("core-2026-07")).toBe("2026-08");
    const lines = readingLines("core-2026-07");
    expect(lines).not.toBeNull();
    expect(lines!.map((l) => l.kind)).toEqual(["open", "read", "read", "read", "read", "open", "read", "read", "read", "read", "open", "read", "read", "read", "read", "done"]);
    expect(lines![0]).toMatchObject({ kind: "open", companyId: "harlan", reportId: "harlan-2026-08" });
    expect((lines![0] as { text: string }).text).toMatch(/^Harlan Industrial Services, August 2026 report\. \d+ pages?\.$/);
    const erp = lines!.find((l) => l.kind === "read" && l.initiativeId === "harlan-erp");
    expect(erp).toMatchObject({ flag: "red", change: "Date moved: Q4 2026 to Q1 2027", where: "p. 2, Strategic initiatives", quote: "Phase 2 is now expected in Q1 2027 to avoid disruption during peak season." });
    expect(lines![lines!.length - 1]).toMatchObject({ kind: "done" });
    expect((lines![lines!.length - 1] as { text: string }).text).toBe("August read. 12 initiatives, 4 changes. 2 needs a conversation, 2 slipping, 1 not reported, 7 on track.");
  });

  it("every read line with a quote cites a page the sentence is on; unmentioned months say so", () => {
    for (const set of ["core", "all"]) {
      for (const m of MONTHS.slice(0, -1)) {
        const lines = readingLines(`${set}-${m}`) ?? [];
        for (const l of lines) {
          if (l.kind !== "read") continue;
          if (l.quote) {
            expect(l.cite).toBeDefined();
            const report = getReport(l.cite!.reportId);
            expect(report).toBeDefined();
            const md = report!.pages.map((p) => `<!-- page ${p.n} -->\n${p.text}`).join("\n");
            expect(pageText(md, l.cite!.page)).toContain(l.quote);
          } else {
            expect(l.cite).toBeUndefined();
            expect(l.where).toMatch(/^Not mentioned in /);
          }
        }
      }
    }
  });

  it("at August there is nothing to add", () => {
    expect(readingTarget("core-2026-08")).toBeNull();
    expect(readingLines("core-2026-08")).toBeNull();
    expect(readingLines("august")).toBeNull();
  });

  it("the twelve-company set reads twelve reports and thirty initiatives", () => {
    const lines = readingLines("all-2026-03") ?? [];
    expect(lines.filter((l) => l.kind === "open")).toHaveLength(12);
    expect(lines.filter((l) => l.kind === "read")).toHaveLength(30);
  });

  it("the interval keeps the whole log near six seconds, within bounds", () => {
    expect(readingInterval(16)).toBe(375);
    expect(readingInterval(43)).toBe(140);
    expect(readingInterval(60)).toBe(READING_LINE_MIN_MS);
    expect(readingInterval(2)).toBe(READING_LINE_MAX_MS);
  });
});
