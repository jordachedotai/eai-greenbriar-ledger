// Fails if the ledger drifts from the ground truth: any quote that differs
// from arcs.json by a character, any flag or change that differs from the
// intended one, any cite that does not resolve to a real report page with
// the quote on it. Also checks the authored fixtures' cites, the August
// counts, that the demo states and the notes index are what the generator
// produces, and that no fixture or UI copy carries an em-dash.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Arc, CurrentState, DemoStates, Gap, Ledger, LogEntry, Pattern, Question, QuarterlyPrep } from "../lib/types";
import { MONTHS } from "../lib/types";
import { locateSentence, pageText, reportId } from "../lib/reports";
import { companiesIn, stateCounts } from "../lib/states";
import { generateNotes, generateStates } from "./gen-states";

const ROOT = join(__dirname, "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");
const arcs = JSON.parse(read("data/source/arcs.json")) as Arc[];
const ledger = JSON.parse(read("data/ledger.json")) as Ledger;

const errors: string[] = [];
const fail = (s: string) => errors.push(s);

const reportCache = new Map<string, string | null>();
function reportMd(id: string): string | null {
  if (!reportCache.has(id)) {
    const p = join(ROOT, "data/reports", `${id}.md`);
    reportCache.set(id, existsSync(p) ? readFileSync(p, "utf8") : null);
  }
  return reportCache.get(id) ?? null;
}

function checkCite(where: string, id: string, page: number, quote?: string) {
  const md = reportMd(id);
  if (!md) return fail(`${where}: report ${id} does not exist`);
  const text = pageText(md, page);
  if (text === null) return fail(`${where}: ${id} has no page ${page}`);
  if (quote && !text.includes(quote)) fail(`${where}: quote is not on ${id} page ${page}: "${quote}"`);
}

// 1. Ledger against arcs
const byId = new Map(ledger.initiatives.map((i) => [i.id, i]));
if (ledger.initiatives.length !== arcs.length) fail(`ledger has ${ledger.initiatives.length} initiatives, arcs has ${arcs.length}`);
for (const a of arcs) {
  const i = byId.get(a.id);
  if (!i) {
    fail(`${a.id}: missing from ledger`);
    continue;
  }
  for (const m of MONTHS) {
    const want = a.months[m];
    const got = i.months[m];
    const where = `${a.id} ${m}`;
    if (!got) {
      fail(`${where}: missing month`);
      continue;
    }
    if (got.mentioned !== (want.sentence !== null)) fail(`${where}: mentioned ${got.mentioned}, expected ${want.sentence !== null}`);
    if ((got.quote ?? null) !== want.sentence) fail(`${where}: quote differs\n  got:  ${got.quote}\n  want: ${want.sentence}`);
    if (got.flag !== want.flag) fail(`${where}: flag ${got.flag}, expected ${want.flag}`);
    if (JSON.stringify(got.change ?? null) !== JSON.stringify(want.change ?? null)) fail(`${where}: change differs\n  got:  ${JSON.stringify(got.change)}\n  want: ${JSON.stringify(want.change)}`);
    if (want.sentence) {
      if (!got.cite) {
        fail(`${where}: no cite`);
      } else {
        if (got.cite.reportId !== reportId(a.companyId, m)) fail(`${where}: cite names ${got.cite.reportId}`);
        checkCite(where, got.cite.reportId, got.cite.page, want.sentence);
        const md = reportMd(got.cite.reportId);
        const loc = md ? locateSentence(md, want.sentence) : null;
        if (loc && loc.section !== got.cite.section) fail(`${where}: cite section ${got.cite.section}, report says ${loc.section}`);
        if (loc && want.section && loc.section !== want.section) fail(`${where}: arcs section ${want.section}, report says ${loc.section}`);
      }
    } else if (got.cite) {
      fail(`${where}: cite on an unmentioned month`);
    }
  }
  if (JSON.stringify(i.status) !== JSON.stringify(a.status)) fail(`${a.id}: status differs\n  got:  ${JSON.stringify(i.status)}\n  want: ${JSON.stringify(a.status)}`);
  if (JSON.stringify(i.parallelWith ?? null) !== JSON.stringify(a.parallelWith ?? null)) fail(`${a.id}: parallelWith differs`);
}

// 2. August counts, for the core three companies and for all twelve
const core = new Set(companiesIn("august", ledger.companies).map((c) => c.id));
if (core.size !== 3) fail(`${core.size} core companies, expected 3`);
if (ledger.companies.length !== 12) fail(`${ledger.companies.length} companies, expected 12`);
const counts = { red: 0, amber: 0, grey: 0, green: 0 };
const allCounts = { red: 0, amber: 0, grey: 0, green: 0 };
for (const i of ledger.initiatives) {
  allCounts[i.status.flag] += 1;
  if (core.has(i.companyId)) counts[i.status.flag] += 1;
}
if (JSON.stringify(counts) !== JSON.stringify({ red: 2, amber: 2, grey: 1, green: 7 })) fail(`August counts ${JSON.stringify(counts)}, expected 2 / 2 / 1 / 7`);
if (JSON.stringify(allCounts) !== JSON.stringify({ red: 2, amber: 2, grey: 1, green: 25 })) fail(`August counts across twelve companies ${JSON.stringify(allCounts)}, expected 2 / 2 / 1 / 25`);

// 3. Authored fixtures' cites
if (existsSync(join(ROOT, "data/questions.json"))) {
  const qs = JSON.parse(read("data/questions.json")) as Question[];
  for (const q of qs) {
    if (!byId.has(q.initiativeId)) fail(`question ${q.id}: unknown initiative ${q.initiativeId}`);
    for (const c of q.cites) {
      const m = /^([a-z]+-\d{4}-\d{2}):(\d+)$/.exec(c);
      if (!m) {
        fail(`question ${q.id}: cite "${c}" is not reportId:page`);
        continue;
      }
      checkCite(`question ${q.id}`, m[1], Number(m[2]));
    }
  }
}
if (existsSync(join(ROOT, "data/patterns.json"))) {
  const ps = JSON.parse(read("data/patterns.json")) as Pattern[];
  for (const p of ps) {
    const cited = new Set<string>();
    for (const e of p.evidence) {
      if (!e.cite) continue;
      const quoted = /[“"]([^”"]+)[”"]/.exec(e.text)?.[1];
      checkCite(`pattern ${p.id}`, e.cite.reportId, e.cite.page, quoted);
      cited.add(e.cite.reportId.split("-")[0]);
    }
    for (const c of p.companyIds) if (!cited.has(c)) fail(`pattern ${p.id}: no cite for ${c}`);
  }
}

// 3b. Gaps: one short paragraph per core company, absences only.
if (existsSync(join(ROOT, "data/gaps.json"))) {
  const gaps = JSON.parse(read("data/gaps.json")) as Gap[];
  for (const c of ledger.companies.filter((x) => core.has(x.id))) {
    const g = gaps.find((x) => x.companyId === c.id);
    if (!g) fail(`gaps: no entry for ${c.id}`);
    else if (!g.text.trim()) fail(`gaps: empty text for ${c.id}`);
  }
  for (const g of gaps) if (!ledger.companies.some((c) => c.id === g.companyId)) fail(`gaps: unknown company ${g.companyId}`);
}

// 3c. Quarterly prep: every initiative id resolves to the named company, marked draft.
if (existsSync(join(ROOT, "data/quarterly.json"))) {
  const qp = JSON.parse(read("data/quarterly.json")) as QuarterlyPrep[];
  for (const q of qp) {
    if (!ledger.companies.some((c) => c.id === q.companyId)) fail(`quarterly ${q.companyId}: unknown company`);
    if (q.status !== "draft") fail(`quarterly ${q.companyId}: status must be draft`);
    for (const row of [...q.prior, ...q.next]) {
      const i = byId.get(row.initiativeId);
      if (!i) fail(`quarterly ${q.companyId}: unknown initiative ${row.initiativeId}`);
      else if (i.companyId !== q.companyId) fail(`quarterly ${q.companyId}: ${row.initiativeId} belongs to ${i.companyId}`);
    }
  }
}

// 3d. Log and current state name real companies.
for (const e of JSON.parse(read("data/log.json")) as LogEntry[]) {
  if (!ledger.companies.some((c) => c.id === e.companyId)) fail(`log ${e.id}: unknown company ${e.companyId}`);
}
for (const s of JSON.parse(read("data/current-state.json")) as CurrentState[]) {
  if (!ledger.companies.some((c) => c.id === s.companyId)) fail(`current-state: unknown company ${s.companyId}`);
}

// 3e. Demo states and the notes index are exactly what the generator
// produces from the fixtures now. Anything else is drift.
if (existsSync(join(ROOT, "data/demo-states.json"))) {
  const committed = read("data/demo-states.json");
  const fresh = JSON.stringify(generateStates(), null, 2) + "\n";
  if (committed !== fresh) fail("data/demo-states.json differs from what scripts/gen-states.ts produces; run npm run gen:states");
  const states = JSON.parse(committed) as DemoStates;
  const want: Record<string, Record<string, number>> = { july: { red: 1, amber: 3, grey: 1, green: 7 }, august: { red: 2, amber: 2, grey: 1, green: 7 }, "august-approved": { red: 2, amber: 2, grey: 1, green: 7 }, monday: { red: 2, amber: 2, grey: 1, green: 25 } };
  for (const [name, counts] of Object.entries(want)) {
    if (!states[name]) {
      fail(`demo state ${name} is missing`);
      continue;
    }
    const got = stateCounts(states[name]);
    if (JSON.stringify(got) !== JSON.stringify(counts)) fail(`demo state ${name}: counts ${JSON.stringify(got)}, expected ${JSON.stringify(counts)}`);
  }
  if (states.july?.questionIds.length) fail("demo state july should have no questions");
  if (states.july?.status["harlan-erp"]?.flag !== "amber") fail("demo state july: harlan-erp should be amber");
  if (JSON.stringify(states["august-approved"]?.questionsApproved) !== JSON.stringify(["harlan"])) fail("demo state august-approved: Harlan's questions should be approved");
  for (const name of ["july", "august", "august-approved"]) if (states[name]?.companyIds.length !== 3) fail(`demo state ${name}: should show three companies`);
  if (states.monday?.companyIds.length !== 12) fail("demo state monday: should show twelve companies");
  // Every cell in monday: a mentioned month carries a quote and a cite that
  // resolves; an unmentioned month is a quiet one with neither.
  for (const i of ledger.initiatives) {
    for (const m of MONTHS) {
      const r = i.months[m];
      if (r?.mentioned && (!r.quote || !r.cite)) fail(`monday: ${i.id} ${m} is mentioned without a quote and cite`);
      if (r && !r.mentioned && (r.quote || r.cite)) fail(`monday: ${i.id} ${m} is unmentioned but carries a quote or cite`);
    }
  }
}
if (existsSync(join(ROOT, "data/notes/index.json"))) {
  const committed = read("data/notes/index.json");
  const fresh = JSON.stringify(generateNotes(), null, 2) + "\n";
  if (committed !== fresh) fail("data/notes/index.json differs from the .txt notes; run npm run gen:states");
}

// 4. No em-dashes in fixtures or UI copy
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === "node_modules" || name === ".next" || name.startsWith(".")) continue;
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(json|md|txt|tsx?|css)$/.test(name)) out.push(p);
  }
  return out;
}
for (const dir of ["data", "app", "components", "lib", "skill"]) {
  if (!existsSync(join(ROOT, dir))) continue;
  for (const p of walk(join(ROOT, dir))) {
    if (readFileSync(p, "utf8").includes("—")) fail(`em-dash in ${p.slice(ROOT.length + 1)}`);
  }
}

if (errors.length) {
  console.error(`check-ledger: ${errors.length} problem${errors.length === 1 ? "" : "s"}`);
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}
console.log(`check-ledger: ${arcs.length} initiatives, ${arcs.length * MONTHS.length} month cells, every quote, flag, change, and cite matches. Mode: ${ledger.mode}.`);
