"use client";

// All learning-log entries, filterable by company and status.

import { useState } from "react";
import type { LogEntry } from "@/lib/types";
import { draftModeOf, getCompanies, getLogSorted } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useStateName } from "@/lib/view";
import { LogList } from "@/components/Company/LogList";
import { plural } from "@/lib/format";

type StatusFilter = "all" | LogEntry["status"];

const STATUS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "on-bench", label: "On bench" },
  { id: "confirmed", label: "Confirmed" },
  { id: "draft", label: "Draft" },
];

export default function LogPage() {
  const stateName = useStateName();
  const noteDictated = useStore((s) => s.noteDictated);
  const noteReviewed = useStore((s) => s.noteReviewed);
  const [company, setCompany] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const all = getLogSorted({ drafts: draftModeOf({ noteDictated, noteReviewed }), stateName });
  // Filter by the companies that have entries; in `monday` most do not yet.
  const companies = getCompanies(stateName).filter((c) => all.some((e) => e.companyId === c.id));
  const shown = all.filter((e) => (company === "all" || e.companyId === company) && (status === "all" || e.status === status));
  return (
    <div className="flex flex-col gap-4 px-7 pb-7 pt-[22px]" data-testid="log-page">
      <div className="flex flex-wrap items-center gap-4">
        <FilterGroup label="Company" value={company} onChange={setCompany} options={[{ id: "all", label: "All" }, ...companies.map((c) => ({ id: c.id, label: c.name.split(" ")[0] }))]} testId="filter-company" />
        <FilterGroup label="Status" value={status} onChange={(v) => setStatus(v as StatusFilter)} options={STATUS} testId="filter-status" />
        <span className="ml-auto text-[14px] text-mut">{plural(shown.length, "entry", "entries")}</span>
      </div>
      <div className="max-w-[760px]">
        <LogList entries={shown} showSource empty="No entries match this filter." />
      </div>
    </div>
  );
}

function FilterGroup({ label, value, onChange, options, testId }: { label: string; value: string; onChange: (v: string) => void; options: { id: string; label: string }[]; testId: string }) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-mut">{label}</span>
      <div className="flex items-center rounded-[8px] border border-line bg-white p-[3px]">
        {options.map((o) => {
          const on = o.id === value;
          return (
            <button key={o.id} type="button" aria-pressed={on} onClick={() => onChange(o.id)} data-testid={`${testId}-${o.id}`} className={"rounded-[6px] px-3 py-[5px] text-[14px] " + (on ? "bg-brand-soft font-semibold text-brand2" : "font-medium text-mut hover:text-txt")}>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
