// The four tabs under the header on a company page. The active tab lives
// in the URL (?tab=) so a cite link can come back to the same place.

import Link from "next/link";

export const TABS = [
  { id: "initiatives", label: "Initiatives" },
  { id: "current-state", label: "Current state" },
  { id: "log", label: "Learning log" },
  { id: "quarterly", label: "Quarterly prep" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export function isTabId(v: string | null): v is TabId {
  return TABS.some((t) => t.id === v);
}

export function tabHref(companyId: string, tab: TabId, initiativeId?: string): string {
  const params = new URLSearchParams();
  if (tab !== "initiatives") params.set("tab", tab);
  if (initiativeId) params.set("initiative", initiativeId);
  const qs = params.toString();
  return `/portfolio/${companyId}${qs ? `?${qs}` : ""}`;
}

export function CompanyTabs({ companyId, active, initiativeId }: { companyId: string; active: TabId; initiativeId?: string }) {
  return (
    <div className="sticky top-0 z-10 flex gap-1 border-b border-line bg-white px-7" role="tablist" data-testid="company-tabs">
      {TABS.map((t) => {
        const on = t.id === active;
        return (
          <Link
            key={t.id}
            href={tabHref(companyId, t.id, initiativeId)}
            scroll={false}
            role="tab"
            aria-selected={on}
            data-testid={`tab-${t.id}`}
            className={"-mb-px border-b-2 px-3.5 pb-3 pt-3.5 text-[15px] " + (on ? "border-brand font-semibold text-brand2" : "border-transparent font-medium text-mut hover:text-txt")}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
