// Render the monthly reports from data/source/arcs.json. Sections in a
// fixed order, a consistent financial table per company, arc sentences
// verbatim in their stated section, unmentioned initiatives absent, and
// padding that never contradicts an arc. The core three companies get the
// full report (three to four pages); the nine that appear only in the
// `monday` state get a one-page report from a shorter template. Also
// writes data/reports/index.json (the parsed pages) for the app.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Arc, Company, Month, Report } from "../lib/types";
import { MONTHS } from "../lib/types";
import { monthLabel, monthYear } from "../lib/format";
import { paginate, reportId, toReport } from "../lib/reports";

const ROOT = join(__dirname, "..");
const companies = JSON.parse(readFileSync(join(ROOT, "data/source/companies.json"), "utf8")) as Company[];
const arcs = JSON.parse(readFileSync(join(ROOT, "data/source/arcs.json"), "utf8")) as Arc[];

// ---- financial baselines, held consistent across months ------------------

type Fin = {
  revBudget: number;
  drift: number[];
  gm: number[];
  gmBudget: number;
  em: number[];
  emBudget: number;
  segments: [string, number][];
  ops: { name: string; budget: string; series: string[] }[];
  cash: number[];
  revolver: number[];
  leverage: string[];
};

const FIN: Record<string, Fin> = {
  harlan: {
    revBudget: 15.0,
    drift: [-0.012, 0.004, 0.018, -0.006, 0.011, 0.023, 0.009, 0.015],
    gm: [30.9, 31.1, 31.0, 31.2, 31.1, 31.3, 31.4, 31.2],
    gmBudget: 30.8,
    em: [14.0, 14.2, 14.1, 14.3, 14.2, 14.4, 14.5, 14.3],
    emBudget: 14.0,
    segments: [["Maintenance services", 0.55], ["Project work", 0.30], ["Parts and consumables", 0.15]],
    cash: [6.1, 6.4, 6.9, 6.6, 7.2, 7.8, 8.1, 8.5],
    revolver: [12.0, 12.0, 10.0, 10.0, 8.0, 8.0, 6.0, 6.0],
    leverage: ["3.4", "3.4", "3.3", "3.3", "3.2", "3.1", "3.1", "3.0"],
    ops: [
      { name: "Backlog ($M)", budget: "40.0", series: ["41.2", "41.8", "42.5", "42.1", "43.0", "43.6", "44.1", "44.4"] },
      { name: "Technician utilization", budget: "78%", series: ["77%", "78%", "79%", "78%", "79%", "80%", "79%", "80%"] },
      { name: "Recordable incidents", budget: "0", series: ["1", "0", "0", "1", "0", "0", "1", "0"] },
    ],
  },
  meridian: {
    revBudget: 20.8,
    drift: [-0.008, 0.002, 0.014, 0.006, 0.019, 0.025, 0.017, 0.021],
    gm: [26.0, 26.2, 26.1, 26.1, 26.9, 27.4, 27.9, 27.9],
    gmBudget: 26.5,
    em: [11.0, 11.2, 11.1, 11.1, 11.9, 12.4, 12.9, 12.9],
    emBudget: 11.4,
    segments: [["Truckload", 0.60], ["Less than truckload", 0.28], ["Warehousing", 0.12]],
    cash: [9.2, 9.6, 9.9, 10.4, 11.1, 11.9, 12.6, 13.4],
    revolver: [15.0, 15.0, 15.0, 12.0, 12.0, 10.0, 10.0, 8.0],
    leverage: ["3.8", "3.8", "3.7", "3.7", "3.6", "3.5", "3.4", "3.3"],
    ops: [
      { name: "Loads per day", budget: "1,250", series: ["1,231", "1,244", "1,262", "1,258", "1,271", "1,284", "1,279", "1,290"] },
      { name: "On-time delivery", budget: "94%", series: ["93%", "94%", "94%", "95%", "94%", "95%", "95%", "95%"] },
      { name: "Fuel cost per mile ($)", budget: "0.62", series: ["0.63", "0.62", "0.61", "0.62", "0.63", "0.64", "0.63", "0.62"] },
    ],
  },
  corvus: {
    revBudget: 10.0,
    drift: [-0.015, 0.006, 0.012, -0.004, 0.009, 0.017, 0.004, 0.011],
    gm: [24.4, 24.6, 24.5, 24.7, 24.5, 24.8, 24.6, 24.7],
    gmBudget: 24.0,
    em: [11.8, 12.0, 11.9, 12.1, 12.0, 12.2, 12.1, 12.2],
    emBudget: 11.8,
    segments: [["Heavy maintenance", 0.50], ["Line maintenance", 0.30], ["Components", 0.20]],
    cash: [4.2, 4.4, 4.7, 4.5, 4.9, 5.3, 5.4, 5.8],
    revolver: [8.0, 8.0, 8.0, 8.0, 6.0, 6.0, 6.0, 5.0],
    leverage: ["3.6", "3.6", "3.5", "3.5", "3.4", "3.4", "3.3", "3.3"],
    ops: [
      { name: "Shop hours sold (000)", budget: "38.0", series: ["37.1", "37.9", "38.4", "37.8", "38.6", "39.2", "38.9", "39.5"] },
      { name: "Average turnaround (days)", budget: "11", series: ["12", "11", "11", "12", "11", "11", "11", "10"] },
      { name: "Parts fill rate", budget: "91%", series: ["90%", "91%", "91%", "92%", "91%", "92%", "92%", "93%"] },
    ],
  },
};

const f1 = (n: number) => n.toFixed(1);
const money = (n: number) => `$${f1(n)}M`;
const pct = (n: number) => `${f1(n)}%`;
const signed = (n: number, unit = "") => `${n >= 0 ? "+" : ""}${f1(n)}${unit}`;

function financials(companyId: string, mi: number) {
  const fin = FIN[companyId];
  const rows: { rev: number; gp: number; ebitda: number; revB: number; gpB: number; ebitdaB: number }[] = [];
  for (let i = 0; i <= mi; i += 1) {
    const rev = fin.revBudget * (1 + fin.drift[i]);
    rows.push({
      rev,
      gp: (rev * fin.gm[i]) / 100,
      ebitda: (rev * fin.em[i]) / 100,
      revB: fin.revBudget,
      gpB: (fin.revBudget * fin.gmBudget) / 100,
      ebitdaB: (fin.revBudget * fin.emBudget) / 100,
    });
  }
  const m = rows[mi];
  const sum = (k: keyof (typeof rows)[number]) => rows.reduce((a, r) => a + r[k], 0);
  const ytd = { rev: sum("rev"), gp: sum("gp"), ebitda: sum("ebitda"), revB: sum("revB"), gpB: sum("gpB"), ebitdaB: sum("ebitdaB") };
  return { fin, m, ytd, gmMonth: fin.gm[mi], emMonth: fin.em[mi], gmYtd: (ytd.gp / ytd.rev) * 100, gmYtdB: (ytd.gpB / ytd.revB) * 100, emYtd: (ytd.ebitda / ytd.rev) * 100, emYtdB: (ytd.ebitdaB / ytd.revB) * 100 };
}

// ---- padding pools: plain, unremarkable, and silent on every initiative --

const COMMENTARY: Record<string, string[]> = {
  harlan: [
    "Demand in the industrial maintenance book held steady through the month.",
    "Project work ran at a normal pace, with two mid-sized shutdowns completed on schedule.",
    "Technician hiring kept pace with attrition and utilization stayed in the high seventies.",
    "Customer service levels were stable and no accounts were lost during the month.",
    "The safety program continued its weekly toolbox talks at every site.",
    "Parts and consumables margin was in line with plan.",
    "Working capital was managed within the revolver, with receivables days flat.",
    "The leadership team held its monthly operating review on the first Tuesday.",
    "Quoting activity for the second half of the year was healthy.",
    "The Toledo campus hosted two customer site visits during the month.",
  ],
  meridian: [
    "Volume was in line with plan and the network ran without major disruption.",
    "On-time delivery held in the mid nineties across all terminals.",
    "Fuel surcharge recovery kept pace with diesel prices during the month.",
    "The Gulf terminal completed its annual equipment inspection.",
    "Customer retention remained strong, with no top twenty accounts lost.",
    "Trailer utilization improved slightly with the seasonal pattern.",
    "The operating team held its monthly safety review with all terminal managers.",
    "Cash collections were ahead of plan and days sales outstanding were flat.",
    "The maintenance shop cleared its backlog of scheduled tractor services.",
    "Less than truckload density improved on the eastern lanes.",
  ],
  corvus: [
    "Shop activity was steady and heavy maintenance inputs arrived as scheduled.",
    "Line maintenance volumes at the Wichita base were in line with plan.",
    "Turnaround times held around eleven days on heavy checks.",
    "The component shop cleared its work in process to a normal level.",
    "Two regulatory audits were completed during the month with no findings.",
    "Technician headcount was stable and overtime was within budget.",
    "Customer scheduling for the fourth quarter is filling as expected.",
    "The quality team closed out all open corrective actions from the prior quarter.",
    "Cash and liquidity remained comfortably within covenant levels.",
    "The parts room completed its cycle count with no material variances.",
  ],
};

const OUTLOOK: Record<string, string[]> = {
  harlan: [
    "Looking ahead, the quoting pipeline supports the second half plan.",
    "Looking ahead, we expect project work to remain the swing factor in monthly revenue.",
    "Looking ahead, technician hiring remains the main constraint on growth.",
    "Looking ahead, the summer shutdown season should keep project work busy.",
  ],
  meridian: [
    "Looking ahead, volume should follow the normal seasonal pattern into the summer.",
    "Looking ahead, we expect the eastern lanes to carry most of the growth.",
    "Looking ahead, diesel prices are the main variable in the quarterly outlook.",
    "Looking ahead, peak season planning begins in the third quarter.",
  ],
  corvus: [
    "Looking ahead, heavy maintenance inputs are booked through the next quarter.",
    "Looking ahead, we expect line maintenance to hold at current volumes.",
    "Looking ahead, the component shop has capacity for additional work.",
    "Looking ahead, customer scheduling supports the second half plan.",
  ],
};

const FILLERS = [
  "Progress is reviewed at the monthly operating meeting.",
  "The steering group met during the month.",
  "Weekly status reporting to the executive team continues.",
  "No board action is requested on this item.",
];

const HEADCOUNT: Record<string, { label: string; series: string[] }> = {
  harlan: { label: "Technician headcount", series: ["408", "410", "412", "411", "414", "416", "415", "418"] },
  meridian: { label: "Total headcount", series: ["1,176", "1,180", "1,178", "1,184", "1,181", "1,186", "1,183", "1,188"] },
  corvus: { label: "Total headcount", series: ["308", "309", "311", "310", "312", "313", "312", "314"] },
};

const RISKS: Record<string, string[]> = {
  harlan: [
    "Steel and consumables pricing remains the main input cost risk. Customer contracts carry pass-through clauses for most of the exposure.",
    "No asks of the board this month.",
  ],
  meridian: [
    "Diesel prices remain the main cost risk. The fuel surcharge program covers about 85% of the exposure.",
    "No asks of the board this month.",
  ],
  corvus: [
    "Parts lead times remain the main operational risk and are being managed through safety stock on high-use items.",
    "No asks of the board this month.",
  ],
};

// ---- the short template, for the companies that appear only in monday ---

type Short = { revBudget: number; emBudget: number; headcount: number; seed: number; commentary: string[]; outlook: string; risk: string };

const SHORT: Record<string, Short> = {
  ashcombe: {
    revBudget: 6.5, emBudget: 15.0, headcount: 180, seed: 3,
    commentary: ["Coating volumes in the industrial book were steady through the month.", "The Erie shop ran two shifts with overtime within budget.", "Customer audits during the month closed with no findings."],
    outlook: "Looking ahead, refinery turnaround season should keep the shop busy through the fall.",
    risk: "Solvent and abrasive pricing remains the main input cost risk, covered by pass-through clauses in most contracts.",
  },
  pellston: {
    revBudget: 11.0, emBudget: 12.5, headcount: 420, seed: 5,
    commentary: ["Rail volumes through the three ramps were in line with plan.", "Chassis availability improved during the month at all three ramps.", "Dwell time at the Kansas City ramp stayed under two days."],
    outlook: "Looking ahead, peak season bookings are tracking ahead of last year.",
    risk: "Rail service reliability remains the main operational risk and is reviewed weekly with the carriers.",
  },
  larkmoor: {
    revBudget: 7.8, emBudget: 13.0, headcount: 260, seed: 7,
    commentary: ["Heavy check inputs at Tulsa arrived on the dates scheduled.", "Line maintenance volumes held at the planned level.", "The quality team completed its internal audit cycle with no open findings."],
    outlook: "Looking ahead, the hangar schedule is booked through the next quarter.",
    risk: "Technician availability remains the main constraint and recruiting continues at the local technical colleges.",
  },
  redfern: {
    revBudget: 14.5, emBudget: 9.0, headcount: 510, seed: 2,
    commentary: ["Order volumes were in line with plan across the branch network.", "Fill rates held above the service target for the month.", "Freight cost as a share of revenue was flat on the prior month."],
    outlook: "Looking ahead, the fall promotional calendar supports the second half plan.",
    risk: "Supplier lead times remain the main risk to fill rates and are managed with safety stock on top movers.",
  },
  thornbury: {
    revBudget: 9.2, emBudget: 10.5, headcount: 1450, seed: 4,
    commentary: ["Service delivery ran at plan across the contract base with no service credits issued.", "Frontline hiring kept pace with seasonal attrition.", "Client satisfaction survey results for the quarter were in line with the prior period."],
    outlook: "Looking ahead, the sales pipeline supports the second half plan.",
    risk: "Wage inflation in frontline roles remains the main cost risk and is covered by annual escalators in most contracts.",
  },
  marlow: {
    revBudget: 8.4, emBudget: 12.0, headcount: 340, seed: 6,
    commentary: ["Production output at Fort Wayne was in line with the monthly plan.", "Steel deliveries arrived on schedule during the month.", "The safety committee held its monthly review with no lost time incidents."],
    outlook: "Looking ahead, order intake supports full production through the year.",
    risk: "Steel pricing remains the main input cost risk and is covered by surcharge clauses on most orders.",
  },
  brightwater: {
    revBudget: 6.0, emBudget: 18.0, headcount: 390, seed: 8,
    commentary: ["Cold storage occupancy at Greenville held above 90% through the month.", "The transport fleet ran at plan with on-time delivery in the mid nineties.", "Energy cost per pallet position was flat on the prior month."],
    outlook: "Looking ahead, produce season should keep occupancy high into the fall.",
    risk: "Electricity pricing remains the main cost risk and a fixed-price contract covers most of the exposure.",
  },
  halvorsen: {
    revBudget: 5.5, emBudget: 11.0, headcount: 210, seed: 1,
    commentary: ["Sales through the branch network were in line with plan.", "Inventory turns held at the level assumed in the annual plan.", "Counter sales at the Milwaukee branch grew on the prior month."],
    outlook: "Looking ahead, the industrial customer base supports the second half plan.",
    risk: "Import tariffs on fasteners remain the main cost risk and are passed through on the standard price list.",
  },
  sablecreek: {
    revBudget: 4.8, emBudget: 24.0, headcount: 275, seed: 9,
    commentary: ["Rental utilization across the fleet was in line with plan.", "Service work at the Baton Rouge branch ran at a normal pace.", "Collections were ahead of plan and days sales outstanding were flat."],
    outlook: "Looking ahead, refinery maintenance schedules support fleet utilization into the fourth quarter.",
    risk: "Equipment residual values remain the main balance sheet risk and are reviewed quarterly.",
  },
};

// Small, deterministic month-to-month movement so the numbers read as a
// real series without a hand-typed table per company.
function shortFinancials(sh: Short, mi: number) {
  const drift = (((mi * 7 + sh.seed) % 11) - 5) / 400;
  const rev = sh.revBudget * (1 + drift);
  const em = sh.emBudget + ((((mi * 3 + sh.seed) % 5) - 2) * 0.1);
  return { rev, revB: sh.revBudget, ebitda: (rev * em) / 100, ebitdaB: (sh.revBudget * sh.emBudget) / 100, em, headcount: sh.headcount + mi * 2 + (mi % 3) };
}

function renderShort(company: Company, month: Month): { md: string; title: string } {
  const mi = MONTHS.indexOf(month);
  const sh = SHORT[company.id];
  const own = arcs.filter((a) => a.companyId === company.id);
  const at = (a: Arc) => a.months[month];
  const title = `${company.name}, ${monthYear(month)}, Monthly report to the board`;
  const L: string[] = [];
  const p = (s: string) => L.push(s, "");
  const x = shortFinancials(sh, mi);

  p(`# ${company.name}`);
  p(`## Monthly report to the board, ${monthYear(month)}`);
  p(`Prepared by ${company.ceo.name}, ${company.ceo.title}. Distributed to the board on ${distributionDate(month)}. Figures are unaudited management accounts.`);

  p("## Financial summary");
  L.push("| Metric | Month actual | Month budget | Variance |");
  L.push("|---|---|---|---|");
  L.push(`| Revenue | ${money(x.rev)} | ${money(x.revB)} | ${signed(x.rev - x.revB)} |`);
  L.push(`| EBITDA | ${money(x.ebitda)} | ${money(x.ebitdaB)} | ${signed(x.ebitda - x.ebitdaB)} |`);
  L.push(`| EBITDA margin | ${pct(x.em)} | ${pct(sh.emBudget)} | ${signed(x.em - sh.emBudget, " pts")} |`);
  L.push("");
  const revVar = ((x.rev - x.revB) / x.revB) * 100;
  p(`Revenue for the month was ${money(x.rev)}, ${f1(Math.abs(revVar))}% ${revVar >= 0 ? "above" : "below"} budget. EBITDA was ${money(x.ebitda)}, ${signed(x.ebitda - x.ebitdaB)} to budget. Liquidity is within plan and all covenants were met at month end.`);

  p("## CEO commentary");
  p(`${pick(sh.commentary, mi)} ${pick(sh.commentary, mi + 1)}`);
  p(sh.outlook);

  p("## Strategic initiatives");
  p("Update on the initiatives agreed with the board in January, in board order.");
  own.forEach((a, ai) => {
    const r = at(a);
    if (!r.sentence) return;
    p(`### ${a.name}`);
    p(`Board target: ${a.boardTarget}. Owner: ${a.owner}.`);
    p(`${r.sentence} ${pick(FILLERS, ai + mi + sh.seed)}`);
  });

  p("## People");
  p(`No changes to the leadership team this month. Total headcount was ${x.headcount.toLocaleString("en-US")} at month end.`);

  p("## Risks and asks");
  p(sh.risk);
  p("No asks of the board this month.");

  return { md: paginate(L), title };
}

function distributionDate(month: Month): string {
  const [y, m] = month.split("-").map(Number);
  const next = new Date(Date.UTC(y, m, 5));
  return next.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function pick<T>(pool: T[], i: number): T {
  return pool[((i % pool.length) + pool.length) % pool.length];
}

function render(company: Company, month: Month): { md: string; title: string } {
  const mi = MONTHS.indexOf(month);
  const own = arcs.filter((a) => a.companyId === company.id);
  const at = (a: Arc) => a.months[month];
  const inSection = (section: string) => own.filter((a) => at(a).sentence && at(a).section === section);
  const title = `${company.name}, ${monthYear(month)}, Monthly report to the board`;
  const L: string[] = [];
  const p = (s: string) => L.push(s, "");

  // 1. Cover line
  p(`# ${company.name}`);
  p(`## Monthly report to the board, ${monthYear(month)}`);
  p(`Prepared by ${company.ceo.name}, ${company.ceo.title}. Distributed to the board on ${distributionDate(month)}. Figures are unaudited management accounts.`);

  // 2. Financial summary
  const x = financials(company.id, mi);
  p("## Financial summary");
  L.push("| Metric | Month actual | Month budget | Variance | Year to date | YTD budget | Variance |");
  L.push("|---|---|---|---|---|---|---|");
  L.push(`| Revenue | ${money(x.m.rev)} | ${money(x.m.revB)} | ${signed(x.m.rev - x.m.revB)} | ${money(x.ytd.rev)} | ${money(x.ytd.revB)} | ${signed(x.ytd.rev - x.ytd.revB)} |`);
  L.push(`| Gross margin | ${pct(x.gmMonth)} | ${pct(x.fin.gmBudget)} | ${signed(x.gmMonth - x.fin.gmBudget, " pts")} | ${pct(x.gmYtd)} | ${pct(x.gmYtdB)} | ${signed(x.gmYtd - x.gmYtdB, " pts")} |`);
  L.push(`| EBITDA | ${money(x.m.ebitda)} | ${money(x.m.ebitdaB)} | ${signed(x.m.ebitda - x.m.ebitdaB)} | ${money(x.ytd.ebitda)} | ${money(x.ytd.ebitdaB)} | ${signed(x.ytd.ebitda - x.ytd.ebitdaB)} |`);
  L.push(`| EBITDA margin | ${pct(x.emMonth)} | ${pct(x.fin.emBudget)} | ${signed(x.emMonth - x.fin.emBudget, " pts")} | ${pct(x.emYtd)} | ${pct(x.emYtdB)} | ${signed(x.emYtd - x.emYtdB, " pts")} |`);
  L.push("");
  const revVar = ((x.m.rev - x.m.revB) / x.m.revB) * 100;
  p(`Revenue for the month was ${money(x.m.rev)}, ${f1(Math.abs(revVar))}% ${revVar >= 0 ? "above" : "below"} budget. Year to date revenue is ${money(x.ytd.rev)} against a budget of ${money(x.ytd.revB)}.`);
  p(`Gross margin was ${pct(x.gmMonth)} for the month against a budget of ${pct(x.fin.gmBudget)}. Year to date gross margin is ${pct(x.gmYtd)}.`);
  p(`EBITDA for the month was ${money(x.m.ebitda)}, ${signed(x.m.ebitda - x.m.ebitdaB)} to budget. Year to date EBITDA is ${money(x.ytd.ebitda)}, ${signed(x.ytd.ebitda - x.ytd.ebitdaB)} to budget.`);
  p("### Monthly trend");
  L.push("| Month | Revenue | Gross margin | EBITDA |");
  L.push("|---|---|---|---|");
  for (let i = 0; i <= mi; i += 1) {
    const rev = x.fin.revBudget * (1 + x.fin.drift[i]);
    L.push(`| ${monthLabel(MONTHS[i])} | ${money(rev)} | ${pct(x.fin.gm[i])} | ${money((rev * x.fin.em[i]) / 100)} |`);
  }
  L.push("");
  p("### Revenue by segment");
  L.push("| Segment | Month | Share |");
  L.push("|---|---|---|");
  const seg = x.fin.segments;
  const wiggle = [0.01, -0.006, -0.004];
  seg.forEach(([name, share], i) => {
    const s = share + wiggle[i] * ((mi % 3) - 1);
    L.push(`| ${name} | ${money(x.m.rev * s)} | ${Math.round(s * 100)}% |`);
  });
  L.push("");
  p("### Operating metrics");
  L.push("| Metric | Month | Prior month | Budget |");
  L.push("|---|---|---|---|");
  for (const o of x.fin.ops) L.push(`| ${o.name} | ${o.series[mi]} | ${mi > 0 ? o.series[mi - 1] : "n/a"} | ${o.budget} |`);
  L.push("");
  p("Operating metrics are shown on the same basis as the annual plan.");
  p("### Cash and liquidity");
  L.push("| Item | Month end | Prior month end |");
  L.push("|---|---|---|");
  const cash = x.fin.cash;
  L.push(`| Cash | ${money(cash[mi])} | ${mi > 0 ? money(cash[mi - 1]) : "n/a"} |`);
  L.push(`| Revolver drawn | ${money(x.fin.revolver[mi])} | ${mi > 0 ? money(x.fin.revolver[mi - 1]) : "n/a"} |`);
  L.push(`| Net leverage | ${x.fin.leverage[mi]}x | ${mi > 0 ? x.fin.leverage[mi - 1] + "x" : "n/a"} |`);
  L.push("");
  p("Liquidity is within plan and all covenants were met at month end.");

  // 3. CEO commentary
  p("## CEO commentary");
  for (const a of inSection("CEO commentary")) p(at(a).sentence as string);
  const pool = COMMENTARY[company.id];
  const n = 3 + (mi % 2);
  for (let i = 0; i < n; i += 1) p(pick(pool, mi * 3 + i * 2));
  p(pick(OUTLOOK[company.id], mi));

  // 4. Strategic initiatives, in board order, unmentioned ones absent
  p("## Strategic initiatives");
  p("Update on the initiatives agreed with the board in January, in board order.");
  own.forEach((a, ai) => {
    const r = at(a);
    if (!r.sentence || r.section !== "Strategic initiatives") return;
    p(`### ${a.name}`);
    p(`Board target: ${a.boardTarget}. Owner: ${a.owner}.`);
    const filler = a.id === "harlan-erp" && mi <= 2 ? "Spend to date is within the approved budget." : pick(FILLERS, ai + mi);
    p(`${r.sentence} ${filler}`);
  });

  // 5. People
  p("## People");
  for (const a of inSection("People")) p(at(a).sentence as string);
  if (inSection("People").length === 0) p("No changes to the leadership team this month.");
  const hc = HEADCOUNT[company.id];
  p(`${hc.label} was ${hc.series[mi]} at month end.`);

  // 6. Risks and asks
  p("## Risks and asks");
  for (const s of RISKS[company.id]) p(s);

  return { md: paginate(L), title };
}

const outDir = join(ROOT, "data/reports");
mkdirSync(outDir, { recursive: true });
const index: Report[] = [];
for (const c of companies) {
  for (const m of MONTHS) {
    const id = reportId(c.id, m);
    if (!FIN[c.id] && !SHORT[c.id]) throw new Error(`${c.id}: no report template (add it to FIN or SHORT)`);
    const { md, title } = FIN[c.id] ? render(c, m) : renderShort(c, m);
    writeFileSync(join(outDir, `${id}.md`), md);
    index.push(toReport(id, title, md));
  }
}
writeFileSync(join(outDir, "index.json"), JSON.stringify(index, null, 2) + "\n");

// Every arc sentence must be in its report exactly once, and no em-dash anywhere.
let bad = 0;
for (const a of arcs) {
  for (const m of MONTHS) {
    const r = a.months[m];
    if (!r.sentence) continue;
    const md = readFileSync(join(outDir, `${reportId(a.companyId, m)}.md`), "utf8");
    const count = md.split(r.sentence).length - 1;
    if (count !== 1) {
      bad += 1;
      console.error(`${a.id} ${m}: sentence found ${count} times`);
    }
    if (md.includes("—")) {
      bad += 1;
      console.error(`${reportId(a.companyId, m)}: em-dash`);
    }
  }
}
const pages = index.map((r) => r.pages.length);
console.log(`Wrote ${index.length} reports to data/reports, ${Math.min(...pages)} to ${Math.max(...pages)} pages each.`);
if (bad) process.exit(1);
