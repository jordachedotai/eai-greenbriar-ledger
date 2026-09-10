"use client";

// Company page. Tabs: Initiatives, Current state, Learning log, Quarterly
// prep. The view itself lives in components/Company/CompanyView so the
// Time Machine can render it for any month.

import { Suspense, use } from "react";
import { CompanyView } from "@/components/Company/CompanyView";

export default function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={null}>
      <CompanyView id={id} />
    </Suspense>
  );
}
