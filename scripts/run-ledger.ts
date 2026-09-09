// The one-time skill run. Reads the priority files and the 24 reports and
// writes data/ledger.json. Steps per skill/SKILL.md and docs/AGENT.md.
//
// With ANTHROPIC_API_KEY in .env.local: steps 2 and 3 call claude-sonnet-5,
// and every returned sentence is verified as a character-exact substring
// of the cited page before it is kept. Without a key, or if a call fails:
// code locates the ground-truth sentences from data/source/arcs.json in
// the rendered reports (they are verbatim, so this is exact) and takes the
// structured facts from the same file. The ledger records which mode ran.
// Either way, the diff and the flags are code.

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import type { Arc, Company, Facts, Initiative, Ledger, Month, MonthRead } from "../lib/types";
import { MONTHS } from "../lib/types";
import { changesFor, conditionsAt, type MonthInput } from "../lib/diff";
import { flagsFor, pillFor } from "../lib/flags";
import { locateSentence, parsePages, reportId } from "../lib/reports";
import { SYSTEM, extractPrompt, structurePrompt, type RegisteredInitiative } from "../lib/prompts";

const ROOT = join(__dirname, "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

// .env.local is gitignored; read it here rather than through a loader.
if (existsSync(join(ROOT, ".env.local"))) {
  for (const line of read(".env.local").split("\n")) {
    const m = /^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const companies = JSON.parse(read("data/source/companies.json")) as Company[];
const arcs = JSON.parse(read("data/source/arcs.json")) as Arc[];
const arcById = new Map(arcs.map((a) => [a.id, a]));

// ---- Step 1. Register initiatives from the priority files (code) ----------

type Registered = RegisteredInitiative & { companyId: string; targetDate: string; owner: string; promisedBenefit?: string; measureDirection?: "down" | "up" };

function registerInitiatives(): Registered[] {
  const out: Registered[] = [];
  for (const file of readdirSync(join(ROOT, "data/priorities")).filter((f) => f.endsWith(".md")).sort()) {
    const companyId = file.replace(/\.md$/, "");
    const blocks = read(`data/priorities/${file}`).split(/\n(?=## )/).slice(1);
    for (const b of blocks) {
      const name = /^## (.+)$/m.exec(b)?.[1]?.trim() ?? "";
      const field = (k: string) => new RegExp(`^- ${k}: (.+)$`, "m").exec(b)?.[1]?.trim();
      const id = field("id");
      if (!id) continue;
      out.push({
        id,
        companyId,
        name,
        boardTarget: field("Board target") ?? "",
        targetDate: field("Target date") ?? "",
        owner: field("Owner") ?? "",
        measure: field("Measure"),
        promisedBenefit: field("Promised benefit"),
        measureDirection: field("Measure direction") as "down" | "up" | undefined,
      });
    }
  }
  return out;
}

// ---- Steps 2 and 3. Extract and structure ---------------------------------

type Extracted = { sentence: string; section: string; page: number; facts: Facts };
type Extraction = Map<string, Partial<Record<Month, Extracted>>>; // initiativeId -> month -> read

function parseJson<T>(text: string): T {
  const body = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(body) as T;
}

async function extractWithClaude(client: Anthropic, registered: Registered[]): Promise<Extraction> {
  const out: Extraction = new Map();
  const knownKeys = new Map<string, Set<string>>();
  for (const c of companies) {
    const own = registered.filter((r) => r.companyId === c.id);
    for (const m of MONTHS) {
      const id = reportId(c.id, m);
      const md = read(`data/reports/${id}.md`);
      for (const page of parsePages(md)) {
        const res = await client.messages.create({
          model: "claude-sonnet-5",
          max_tokens: 4000,
          system: SYSTEM,
          messages: [{ role: "user", content: extractPrompt({ reportId: id, n: page.n, text: page.text }, own) }],
        });
        const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
        const found = parseJson<{ initiativeId: string; sentence: string; section: string }[]>(text);
        for (const f of found) {
          const init = own.find((r) => r.id === f.initiativeId);
          if (!init) {
            console.warn(`  rejected: unknown initiative ${f.initiativeId} on ${id} p${page.n}`);
            continue;
          }
          // Verification: the sentence must be on this page, character for character.
          if (!page.text.includes(f.sentence)) {
            console.warn(`  rejected: not a substring of ${id} p${page.n}: "${f.sentence}"`);
            continue;
          }
          const loc = locateSentence(md, f.sentence);
          if (!loc || loc.page !== page.n) {
            console.warn(`  rejected: page mismatch for "${f.sentence}"`);
            continue;
          }
          const keys = knownKeys.get(init.id) ?? new Set<string>();
          const sres = await client.messages.create({
            model: "claude-sonnet-5",
            max_tokens: 1500,
            system: SYSTEM,
            messages: [{ role: "user", content: structurePrompt(f.sentence, init, [...keys]) }],
          });
          const facts = parseJson<Facts>(sres.content.map((b) => (b.type === "text" ? b.text : "")).join(""));
          for (const k of facts.commitments ?? []) keys.add(k.key);
          knownKeys.set(init.id, keys);
          const per = out.get(init.id) ?? {};
          const prev = per[m];
          // Two hits for one month on one page: keep the longer, it is the fuller update.
          if (!prev || prev.sentence.length < f.sentence.length) per[m] = { sentence: f.sentence, section: loc.section, page: page.n, facts };
          out.set(init.id, per);
        }
      }
      console.log(`  read ${id}`);
    }
  }
  return out;
}

function extractWithCode(registered: Registered[]): Extraction {
  const out: Extraction = new Map();
  for (const r of registered) {
    const arc = arcById.get(r.id);
    if (!arc) throw new Error(`no arc for ${r.id}`);
    const per: Partial<Record<Month, Extracted>> = {};
    for (const m of MONTHS) {
      const a = arc.months[m];
      if (!a.sentence) continue;
      const md = read(`data/reports/${reportId(r.companyId, m)}.md`);
      const loc = locateSentence(md, a.sentence);
      if (!loc) throw new Error(`${r.id} ${m}: sentence not found in the report`);
      per[m] = { sentence: a.sentence, section: loc.section, page: loc.page, facts: a.facts ?? {} };
    }
    out.set(r.id, per);
  }
  return out;
}

// ---- Step 6. Benefit detection (code) --------------------------------------

function grossMargin(companyId: string, m: Month): number | null {
  const md = read(`data/reports/${reportId(companyId, m)}.md`);
  const row = /^\| Gross margin \| ([\d.]+)% \|/m.exec(md);
  return row ? Number(row[1]) : null;
}

function benefitNotRolledUp(r: Registered, per: Partial<Record<Month, Extracted>>): boolean {
  if (!r.promisedBenefit) return false;
  const doneMonth = MONTHS.find((m) => per[m]?.facts.completed);
  if (!doneMonth) return false;
  const last = MONTHS[MONTHS.length - 1];
  const before = grossMargin(r.companyId, doneMonth);
  const after = grossMargin(r.companyId, last);
  if (before === null || after === null || after <= before) return false;
  // Connected in the report only if management mentions the initiative after delivery.
  const mentionedAfter = MONTHS.slice(MONTHS.indexOf(doneMonth) + 1).some((m) => per[m]);
  return !mentionedAfter;
}

// ---- Steps 4, 5, 7, 11. Diff, flags, parallels, write ---------------------

async function main() {
  const registered = registerInitiatives();
  console.log(`Registered ${registered.length} initiatives from ${companies.length} priority files.`);

  let mode: Ledger["mode"] = "code";
  let extraction: Extraction;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      console.log("Extracting with claude-sonnet-5, verifying every sentence against its page.");
      extraction = await extractWithClaude(new Anthropic(), registered);
      mode = "claude";
    } catch (e) {
      console.warn(`Claude extraction failed (${(e as Error).message}). Falling back to the code extraction.`);
      extraction = extractWithCode(registered);
    }
  } else {
    console.log("No ANTHROPIC_API_KEY. Locating the ground-truth sentences in the reports with code.");
    extraction = extractWithCode(registered);
  }

  const initiatives: Initiative[] = registered.map((r) => {
    const per = extraction.get(r.id) ?? {};
    const inputs: MonthInput[] = MONTHS.map((m) => ({ month: m, mentioned: !!per[m], facts: per[m]?.facts }));
    const flags = flagsFor(r, inputs);
    const changes = changesFor(r, inputs);
    const months = {} as Record<Month, MonthRead>;
    for (const m of MONTHS) {
      const x = per[m];
      const read: MonthRead = { mentioned: !!x, flag: flags[m] };
      if (x) {
        read.quote = x.sentence;
        read.cite = { reportId: reportId(r.companyId, m), page: x.page, section: x.section };
      }
      if (changes[m]) read.change = changes[m];
      months[m] = read;
    }
    const last = MONTHS[MONTHS.length - 1];
    const cond = conditionsAt(r, inputs, last);
    const arc = arcById.get(r.id);
    const status: Initiative["status"] = { flag: flags[last], pill: pillFor(flags[last], cond.completed), sentence: arc?.status.sentence ?? "" };
    // Step 7 parallels: from the ground truth in Phase 1; each side must have a cite.
    const parallelWith = arc?.parallelWith?.filter((other) => Object.keys(extraction.get(other) ?? {}).length > 0);
    if (parallelWith?.length) {
      const otherCompany = registered.find((x) => x.id === parallelWith[0])?.companyId ?? "";
      const short = companies.find((c) => c.id === otherCompany)?.name.split(" ")[0] ?? otherCompany;
      status.chip = { text: `Parallel with ${short}`, tone: "you" };
    } else if (benefitNotRolledUp(r, per)) {
      status.chip = { text: "Benefit not rolled up", tone: "you" };
    }
    const init: Initiative = {
      id: r.id,
      companyId: r.companyId,
      name: r.name,
      boardTarget: r.boardTarget,
      targetDate: r.targetDate,
      owner: r.owner,
      months,
      status,
    };
    if (r.promisedBenefit) init.promisedBenefit = r.promisedBenefit;
    if (parallelWith?.length) init.parallelWith = parallelWith;
    return init;
  });

  const ledger: Ledger = { generatedAt: new Date().toISOString(), mode, companies, initiatives };
  writeFileSync(join(ROOT, "data/ledger.json"), JSON.stringify(ledger, null, 2) + "\n");
  const counts = { red: 0, amber: 0, grey: 0, green: 0 };
  for (const i of initiatives) counts[i.status.flag] += 1;
  console.log(`Wrote data/ledger.json (${mode}): ${initiatives.length} initiatives, August ${counts.red} / ${counts.amber} / ${counts.grey} / ${counts.green}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
