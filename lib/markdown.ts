// A small block parser for the report markdown. The reports use headings
// (#, ##, ###), pipe tables, paragraphs, and the occasional "- " list.
// Nothing inline. No library, so the room needs nothing extra.

export type Block =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "list"; items: string[] };

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    if (!t || /^<!--.*-->$/.test(t)) {
      i += 1;
      continue;
    }
    const h = /^(#{1,3}) (.+)$/.exec(t);
    if (h) {
      blocks.push({ type: h[1].length === 1 ? "h1" : h[1].length === 2 ? "h2" : "h3", text: h[2].trim() });
      i += 1;
      continue;
    }
    if (t.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = splitRow(lines[i]);
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(cells);
        i += 1;
      }
      const [head, ...body] = rows;
      blocks.push({ type: "table", head: head ?? [], rows: body });
      continue;
    }
    if (/^[-*] /.test(t)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i].trim())) {
        items.push(lines[i].trim().slice(2));
        i += 1;
      }
      blocks.push({ type: "list", items });
      continue;
    }
    const para: string[] = [];
    while (i < lines.length) {
      const s = lines[i].trim();
      if (!s || s.startsWith("|") || /^#{1,3} /.test(s) || /^[-*] /.test(s) || /^<!--.*-->$/.test(s)) break;
      para.push(s);
      i += 1;
    }
    blocks.push({ type: "p", text: para.join(" ") });
  }
  return blocks;
}

// Split a paragraph around a quote so the page can mark it. Null when the
// quote is not in the text.
export function splitAround(text: string, quote: string): { before: string; hit: string; after: string } | null {
  const at = text.indexOf(quote);
  if (at < 0) return null;
  return { before: text.slice(0, at), hit: quote, after: text.slice(at + quote.length) };
}
