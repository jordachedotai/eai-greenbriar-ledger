// Writes data/demo-states.json from the fixtures (ledger, arcs, questions,
// patterns), one state per company set per cutoff month, and
// data/notes/index.json from the dictated-note transcripts, so the demo
// states never drift from the ledger. Run with
// `npm run gen:states` after any fixture change. scripts/check-ledger.ts
// regenerates both in memory and fails on any difference.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Arc, DemoStates, Ledger, LogEntry, Note, Pattern, Question } from "../lib/types";
import { buildStates, PRESETS, stateCounts, viewKey } from "../lib/states";

const ROOT = join(__dirname, "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

export function generateStates(): DemoStates {
  const ledger = JSON.parse(read("data/ledger.json")) as Ledger;
  const arcs = JSON.parse(read("data/source/arcs.json")) as Arc[];
  const questions = JSON.parse(read("data/questions.json")) as Question[];
  const patterns = JSON.parse(read("data/patterns.json")) as Pattern[];
  return buildStates({ companies: ledger.companies, initiatives: ledger.initiatives, arcs, questions, patterns });
}

// One entry per data/notes/{companyId}-{slug}-{YYYY-MM-DD}.txt. The draft
// log entry a note produces is the draft in log.json for that company on
// that date.
export function generateNotes(): Note[] {
  const ledger = JSON.parse(read("data/ledger.json")) as Ledger;
  const log = JSON.parse(read("data/log.json")) as LogEntry[];
  const out: Note[] = [];
  for (const file of readdirSync(join(ROOT, "data/notes")).filter((f) => f.endsWith(".txt")).sort()) {
    const m = /^([a-z]+)-([a-z-]+)-(\d{4}-\d{2}-\d{2})\.txt$/.exec(file);
    if (!m) throw new Error(`notes: ${file} is not {companyId}-{slug}-{date}.txt`);
    const [, companyId, slug, date] = m;
    const company = ledger.companies.find((c) => c.id === companyId);
    if (!company) throw new Error(`notes: ${file} names unknown company ${companyId}`);
    const entry = log.find((e) => e.status === "draft" && e.companyId === companyId && e.date === date);
    if (!entry) throw new Error(`notes: no draft log entry for ${companyId} on ${date}`);
    const kind = slug.replace(/-/g, " ");
    out.push({
      id: file.replace(/\.txt$/, ""),
      companyId,
      date,
      title: `${company.name.split(" ")[0]} ${kind}`,
      text: read(`data/notes/${file}`).trim(),
      logEntryId: entry.id,
    });
  }
  return out;
}

if (require.main === module) {
  const states = generateStates();
  const notes = generateNotes();
  const want = { july: { red: 1, amber: 3, grey: 1, green: 7 }, august: { red: 2, amber: 2, grey: 1, green: 7 }, monday: { red: 2, amber: 2, grey: 1, green: 25 } };
  for (const [name, counts] of Object.entries(want)) {
    const got = stateCounts(states[viewKey(PRESETS[name].view)]);
    if (JSON.stringify(got) !== JSON.stringify(counts)) throw new Error(`${name}: counts ${JSON.stringify(got)}, expected ${JSON.stringify(counts)}`);
  }
  writeFileSync(join(ROOT, "data/demo-states.json"), JSON.stringify(states, null, 2) + "\n");
  writeFileSync(join(ROOT, "data/notes/index.json"), JSON.stringify(notes, null, 2) + "\n");
  const summary = Object.values(states)
    .map((s) => {
      const c = stateCounts(s);
      return `${s.name}: ${s.companyIds.length} companies, ${s.months.length} months, ${c.red} / ${c.amber} / ${c.grey} / ${c.green}, ${s.questionIds.length} questions, ${s.patternIds.length} patterns`;
    })
    .join("\n  ");
  console.log(`Wrote data/demo-states.json and data/notes/index.json (${notes.length} note${notes.length === 1 ? "" : "s"}).\n  ${summary}`);
}
