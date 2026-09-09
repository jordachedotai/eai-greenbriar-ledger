"use client";

// Company page. Phase 1 placeholder: the initiatives and their August read.
// The quote stack, questions rail, and tabs arrive in Phase 2.

import { use } from "react";
import Link from "next/link";
import { getCompany, getInitiatives } from "@/lib/data";
import { StatusPill, FlagCell } from "@/components/Portfolio/StatusPill";

export default function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const company = getCompany(id);
  if (!company) {
    return (
      <div className="px-7 py-6 text-[15px] text-mut">
        No company with id {id}. <Link href="/portfolio" className="font-semibold text-brand">Back to Portfolio</Link>
      </div>
    );
  }
  const initiatives = getInitiatives(company.id);
  return (
    <div className="flex flex-col gap-4 px-7 pb-7 pt-[22px]">
      <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-mut">{initiatives.length} initiatives</span>
      <div className="flex max-w-[640px] flex-col gap-2">
        {initiatives.map((i) => (
          <div key={i.id} className="flex items-center justify-between gap-3 rounded-[10px] border border-line bg-white px-3.5 py-3" data-testid="company-initiative" data-initiative={i.id}>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[15px] font-semibold">{i.name}</span>
              <span className="truncate text-[13px] text-mut">{i.status.sentence}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <StatusPill flag={i.status.flag} text={i.status.pill} />
              <FlagCell flag={i.status.flag} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[14px] text-mut">The month by month quote stack and the drafted questions arrive in Phase 2.</p>
    </div>
  );
}
