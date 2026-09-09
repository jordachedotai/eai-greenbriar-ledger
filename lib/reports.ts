// Report file helpers shared by the generator, the skill run, the check
// script, and the app. A report is markdown with `<!-- page N -->` markers
// and `## Section` headings. Cites resolve to a page and a section here.

import type { Month, Report, Section } from "./types";

export const PAGE_MARK = /^<!-- page (\d+) -->$/;
export const LINES_PER_PAGE = 40;

export function reportId(companyId: string, month: Month | string): string {
  return `${companyId}-${month}`;
}

export function splitReportId(id: string): { companyId: string; month: Month } {
  const i = id.indexOf("-");
  return { companyId: id.slice(0, i), month: id.slice(i + 1) as Month };
}

export type ParsedPage = { n: number; text: string; sections: string[]; firstSection: string };

// Split markdown into pages. Each page carries the section headings that
// start on it and the section active at its top.
export function parsePages(md: string): ParsedPage[] {
  const pages: ParsedPage[] = [];
  let current: ParsedPage | null = null;
  let active = "";
  for (const line of md.split("\n")) {
    const m = PAGE_MARK.exec(line.trim());
    if (m) {
      if (current) current.text = current.text.trimEnd() + "\n";
      current = { n: Number(m[1]), text: "", sections: [], firstSection: active };
      pages.push(current);
      continue;
    }
    if (!current) continue;
    const h = /^## (.+)$/.exec(line);
    if (h) {
      active = h[1].trim();
      current.sections.push(active);
      if (!current.firstSection) current.firstSection = active;
    }
    current.text += line + "\n";
  }
  if (current) current.text = current.text.trimEnd() + "\n";
  return pages;
}

// Page and section of a verbatim sentence, or null when it is not there.
export function locateSentence(md: string, sentence: string): { page: number; section: string; offset: number } | null {
  const offset = md.indexOf(sentence);
  if (offset < 0) return null;
  let page = 0;
  let section = "";
  let pos = 0;
  for (const line of md.split("\n")) {
    if (pos > offset) break;
    const m = PAGE_MARK.exec(line.trim());
    if (m) page = Number(m[1]);
    const h = /^## (.+)$/.exec(line);
    if (h) section = h[1].trim();
    pos += line.length + 1;
  }
  return { page, section, offset };
}

// The text of one page, for verifying a quote is on it.
export function pageText(md: string, page: number): string | null {
  return parsePages(md).find((p) => p.n === page)?.text ?? null;
}

export function toReport(id: string, title: string, md: string): Report {
  const { companyId, month } = splitReportId(id);
  return {
    id,
    companyId,
    month,
    title,
    pages: parsePages(md).map((p) => ({ n: p.n, section: p.firstSection, text: p.text })),
  };
}

export const SECTIONS: Section[] = ["Financial summary", "CEO commentary", "Strategic initiatives", "People", "Risks and asks"];

// Insert page markers about every LINES_PER_PAGE lines, breaking only at a
// blank line, never right after a heading, so a sentence is always whole
// on one page and a heading stays with its paragraph.
export function paginate(lines: string[], perPage = LINES_PER_PAGE): string {
  const out: string[] = ["<!-- page 1 -->"];
  let page = 1;
  let count = 0;
  let lastNonBlank = "";
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (count >= perPage && line.trim() === "" && !lastNonBlank.startsWith("#") && i < lines.length - 1) {
      page += 1;
      out.push("", `<!-- page ${page} -->`);
      count = 0;
      continue;
    }
    out.push(line);
    count += 1;
    if (line.trim() !== "") lastNonBlank = line;
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
}
