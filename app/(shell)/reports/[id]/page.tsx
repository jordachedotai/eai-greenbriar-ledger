"use client";

// One report at a page: /reports/harlan-2026-05?page=2&q=<the cited sentence>.

import { Suspense, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getReport } from "@/lib/data";
import { ReportView } from "@/components/Reports/ReportView";

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={null}>
      <ReportAt id={id} />
    </Suspense>
  );
}

function ReportAt({ id }: { id: string }) {
  const sp = useSearchParams();
  const report = getReport(id);
  if (!report) {
    return (
      <div className="px-7 py-6 text-[15px] text-mut">
        No report with id {id}.{" "}
        <Link href="/reports" className="font-semibold text-brand">
          All reports
        </Link>
      </div>
    );
  }
  const page = Number(sp.get("page") ?? "1") || 1;
  const quote = sp.get("q") ?? undefined;
  return <ReportView key={`${id}:${page}:${quote ?? ""}`} report={report} page={page} quote={quote} />;
}
