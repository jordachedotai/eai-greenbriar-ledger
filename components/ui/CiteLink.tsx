// A cite is always a link to the report page it names. The default look is
// the 12px muted cite from the artboards; pass a className to inherit the
// surrounding text instead.

import Link from "next/link";
import { citeHref, citeLabel, type Cite } from "@/lib/cites";

export function CiteLink({ cite, quote, children, className }: { cite: Cite; quote?: string; children?: React.ReactNode; className?: string }) {
  return (
    <Link
      href={citeHref(cite, quote)}
      className={className ?? "text-[12px] text-mut underline decoration-line decoration-dotted underline-offset-[3px] hover:text-brand hover:decoration-brand"}
      data-testid="cite"
      data-report={cite.reportId}
      data-page={cite.page}
      title={`Open the ${citeLabel(cite)}`}
    >
      {children ?? citeLabel(cite)}
    </Link>
  );
}
