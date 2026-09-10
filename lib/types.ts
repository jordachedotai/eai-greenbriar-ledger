// Types for the ledger. The block marked "from docs/DATA.md" is the data
// model as written there. Below it: the source (arcs) types the generator,
// the skill run, and the check script share.

// ---- from docs/DATA.md ----------------------------------------------------

export type Month = "2026-01" | "2026-02" | "2026-03" | "2026-04" | "2026-05" | "2026-06" | "2026-07" | "2026-08";
export type Flag = "green" | "amber" | "red" | "grey";
export type PillText = "On track" | "Delivered" | "Done" | "Slipping" | "Needs a conversation" | "Not reported";

export type Company = {
  id: string;
  name: string;
  sector: string;
  city: string;
  ceo: { name: string; title: string };
  dealLeadId: string;
  nextCall: string; // ISO date
  initiativeIds: string[];
};

export type Initiative = {
  id: string;
  companyId: string;
  name: string;
  boardTarget: string; // "Go-live end of Q2 2026"
  targetDate: string; // "2026-Q2" or "2026-06"
  owner: string; // CEO or a named fictional exec
  promisedBenefit?: string; // "2 to 3 points of net price"
  months: Record<Month, MonthRead>;
  status: { flag: Flag; pill: PillText; sentence: string; chip?: { text: string; tone: "you" } }; // the August read
  parallelWith?: string[]; // initiative ids in other companies
};

export type MonthRead = {
  mentioned: boolean;
  flag: Flag;
  quote?: string; // verbatim sentence from the report
  cite?: { reportId: string; page: number; section: string };
  change?: { kind: "date" | "scope" | "number" | "reason" | "silent"; from?: string; to?: string; label: string };
};

export type Question = { id: string; companyId: string; initiativeId: string; n: number; text: string; cites: string[]; status: "draft" | "approved" | "dropped" };

export type Pattern = {
  id: string;
  title: string;
  companyIds: string[];
  body: string;
  evidence: { text: string; cite?: { reportId: string; page: number } }[];
  action: string;
  tone: "you" | "red";
};

export type LogEntry = { id: string; date: string; companyId: string; text: string; source: string; status: "on-bench" | "confirmed" | "draft" };

export type CurrentState = { companyId: string; updated: string; lines: { date: string; text: string; status?: "draft" }[] };

export type QuarterlyPrep = {
  companyId: string;
  quarter: string;
  prior: { initiativeId: string; outcome: string; note: string }[];
  next: { initiativeId: string; plan: string }[];
  status: "draft";
};

export type Report = { id: string; companyId: string; month: Month; title: string; pages: { n: number; section: string; text: string }[] };

// "What the reports do not say": one short authored paragraph per company.
// States only absences. Never an outcome the reports do not state.
export type Gap = { companyId: string; text: string };

export type User = { id: string; name: string; title: string; isCurrentUser: boolean };

// ---- source and pipeline types --------------------------------------------

export const MONTHS: Month[] = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"];

export type Section = "Financial summary" | "CEO commentary" | "Strategic initiatives" | "People" | "Risks and asks";

// What the structure step returns for one sentence: the commitments it
// states, as they appear, keyed so the diff can compare month over month.
export type Commitment = {
  key: string; // "go-live", "phase-2", "online", "decision"
  kind: "date" | "number" | "scope";
  value: string; // dates as "2026-06" or "2026-Q4"; numbers as written
  label?: string; // for scope: the change chip text when this key first appears
};

export type Facts = {
  commitments?: Commitment[];
  measure?: { value: number; unit: string }; // a reading of the initiative's own measure
  reason?: string; // a stated reason, normalized to a short phrase
  completed?: "Delivered" | "Done"; // completion or cancellation stated
  restatedWithoutDate?: boolean; // the target was restated with no date
};

export type ArcMonth = {
  sentence: string | null; // verbatim; null when not mentioned
  section?: Section;
  flag: Flag; // the flag the rules should produce
  facts?: Facts;
  change?: MonthRead["change"]; // the change the diff should produce
};

export type Arc = {
  id: string;
  companyId: string;
  name: string;
  boardTarget: string;
  targetDate: string;
  owner: string;
  promisedBenefit?: string;
  measureDirection?: "down" | "up"; // which way the measure should move
  months: Record<Month, ArcMonth>;
  status: Initiative["status"];
  parallelWith?: string[];
};

export type Ledger = {
  generatedAt: string;
  mode: "claude" | "code";
  companies: Company[];
  initiatives: Initiative[];
};
