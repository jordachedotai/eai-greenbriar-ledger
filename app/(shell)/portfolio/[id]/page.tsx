"use client";

// Company page. Tabs: Initiatives, Current state, Learning log, Quarterly
// prep. The Initiatives tab is three columns: the initiative list, the
// quote stack for the selected one, the questions rail. Selection and tab
// live in the URL. The default selection is the worst-flagged initiative.

import { Suspense, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { draftModeOf, getCompany, getCurrentState, getGap, getInitiatives, getLogSorted, getQuarterly, getQuestions, worstInitiative } from "@/lib/data";
import { useStore } from "@/lib/store";
import { CompanyTabs, isTabId, type TabId } from "@/components/Company/Tabs";
import { InitiativeList } from "@/components/Company/InitiativeList";
import { QuoteStack } from "@/components/Company/QuoteStack";
import { QuestionsRail } from "@/components/Company/QuestionsRail";
import { CurrentState } from "@/components/Company/CurrentState";
import { LogList } from "@/components/Company/LogList";
import { QuarterlyPrep } from "@/components/Company/QuarterlyPrep";

export default function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={null}>
      <CompanyView id={id} />
    </Suspense>
  );
}

function CompanyView({ id }: { id: string }) {
  const sp = useSearchParams();
  const stateName = useStore((s) => s.stateName);
  const noteDictated = useStore((s) => s.noteDictated);
  const noteReviewed = useStore((s) => s.noteReviewed);
  const drafts = draftModeOf({ noteDictated, noteReviewed });
  const company = getCompany(id);
  if (!company) {
    return (
      <div className="px-7 py-6 text-[15px] text-mut">
        No company with id {id}.{" "}
        <Link href="/portfolio" className="font-semibold text-brand">
          Back to Portfolio
        </Link>
      </div>
    );
  }
  const tabParam = sp.get("tab");
  const tab: TabId = isTabId(tabParam) ? tabParam : "initiatives";
  const initiatives = getInitiatives(company.id, stateName);
  const requested = sp.get("initiative");
  const selected = initiatives.find((i) => i.id === requested) ?? worstInitiative(company.id, stateName) ?? initiatives[0];

  return (
    <div className="flex min-h-full flex-col" data-testid="company-page" data-company={company.id} data-tab={tab} data-state={stateName}>
      <CompanyTabs companyId={company.id} active={tab} initiativeId={requested ?? undefined} />
      {tab === "initiatives" && selected ? (
        <div className="grid grid-cols-[272px_1fr_360px] items-start gap-5 px-7 pb-7 pt-[22px]" data-testid="initiatives-tab">
          <InitiativeList companyId={company.id} initiatives={initiatives} selectedId={selected.id} />
          <QuoteStack key={selected.id} initiative={selected} />
          <QuestionsRail company={company} questions={getQuestions(company.id, stateName)} gap={getGap(company.id)} />
        </div>
      ) : null}
      {tab === "current-state" ? <CurrentState state={getCurrentState(company.id, { drafts, stateName })} companyName={company.name} /> : null}
      {tab === "log" ? (
        <div className="px-7 pb-7 pt-[22px]" data-testid="log-tab">
          <div className="flex max-w-[760px] flex-col gap-3">
            <span className="text-[15px] text-mut">What the team has learned about {company.name}. Each entry is a draft until it is confirmed.</span>
            <LogList entries={getLogSorted({ companyId: company.id, drafts, stateName })} showSource empty={`No entries for ${company.name} yet.`} />
          </div>
        </div>
      ) : null}
      {tab === "quarterly" ? <QuarterlyPrep prep={getQuarterly(company.id)} companyName={company.name} /> : null}
    </div>
  );
}
