// One pattern: title, company chips, a paragraph, evidence bullets with
// cite links, an action button (a draft; nothing is sent), and the line
// that says so. Blue dots for a parallel worth acting on, red for one
// worth asking about.

import type { Pattern } from "@/lib/types";
import { companyShortName } from "@/lib/data";
import { FLAG_COLORS, YOU_COLORS } from "@/lib/flags";
import { citeShort } from "@/lib/cites";
import { Button } from "@/components/ui/Button";
import { CiteLink } from "@/components/ui/CiteLink";

export function PatternCard({ pattern }: { pattern: Pattern }) {
  const dot = pattern.tone === "red" ? FLAG_COLORS.red.text : YOU_COLORS.text;
  return (
    <section className="flex flex-col gap-3 rounded-[14px] border border-line bg-white px-5 py-[18px] shadow-[var(--shadow-card)]" data-testid="pattern-card" data-pattern={pattern.id} data-tone={pattern.tone}>
      <div className="flex items-start justify-between gap-4">
        <span className="text-[18px] font-semibold leading-[1.3]">{pattern.title}</span>
        <div className="flex shrink-0 gap-1.5">
          {pattern.companyIds.map((id) => (
            <span key={id} className="inline-flex items-center whitespace-nowrap rounded-full bg-panel2 px-2.5 py-[3px] text-[13px] font-semibold text-txt" data-testid="company-chip">
              {companyShortName(id)}
            </span>
          ))}
        </div>
      </div>
      <span className="text-[15px] leading-[1.45]">{pattern.body}</span>
      <ul className="flex flex-col gap-1.5">
        {pattern.evidence.map((e, i) => (
          <li key={i} className="flex items-start gap-2.5" data-testid="evidence">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: dot }} />
            <span className="text-[14px] leading-[1.45]">
              <Evidence text={e.text} cite={e.cite} />
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2.5">
        <Button variant="secondary" size={36} testId="pattern-action">
          {pattern.action}
        </Button>
        <span className="text-[13px] text-mut">Draft. Nothing is sent until you approve it.</span>
      </div>
    </section>
  );
}

// "Harlan, June p. 3: “...”": the report-and-page prefix becomes the link,
// carrying the quoted words so the report page marks them. Evidence with
// a cite but no such prefix gets a small link after the text.
function Evidence({ text, cite }: { text: string; cite?: { reportId: string; page: number } }) {
  if (!cite) return <>{text}</>;
  const quoted = /[“"]([^”"]+)[”"]/.exec(text)?.[1];
  const m = /^([A-Z][A-Za-z]+, [A-Z][a-z]+ p\. \d+)([\s\S]*)$/.exec(text);
  const linkClass = "font-semibold text-txt underline decoration-line decoration-dotted underline-offset-[3px] hover:text-brand hover:decoration-brand";
  if (m) {
    return (
      <>
        <CiteLink cite={cite} quote={quoted} className={linkClass}>
          {m[1]}
        </CiteLink>
        {m[2]}
      </>
    );
  }
  return (
    <>
      {text}{" "}
      <CiteLink cite={cite} quote={quoted} className={linkClass}>
        {citeShort(cite, "", companyShortName)}
      </CiteLink>
    </>
  );
}
