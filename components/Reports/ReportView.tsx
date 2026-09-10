"use client";

// One monthly report, rendered from its markdown with a visible "Page N"
// rule between pages. Scrolls to the requested page; when the URL carries
// the cited sentence, marks it and scrolls there instead. This is what
// makes "cites the page" true. The bar with "Back to [company]" sticks to
// the top of the scroll, so it is there when the page lands deep in.

import { useEffect } from "react";
import Link from "next/link";
import type { Report } from "@/lib/types";
import { getCompany } from "@/lib/data";
import { monthYear } from "@/lib/format";
import { parseBlocks, splitAround, type Block } from "@/lib/markdown";
import { IconChevronLeft } from "@/components/ui/icons";

export function ReportView({ report, page, quote }: { report: Report; page: number; quote?: string }) {
  const company = getCompany(report.companyId);
  const hasPage = report.pages.some((p) => p.n === page);
  const hitPage = quote ? report.pages.find((p) => p.text.includes(quote))?.n : undefined;
  const target = hitPage ?? (hasPage ? page : report.pages[0]?.n);

  useEffect(() => {
    const mark = quote ? document.querySelector<HTMLElement>('[data-hit="true"]') : null;
    const el = mark ?? document.getElementById(`page-${target}`);
    if (!el) return;
    // Let the layout settle before scrolling inside main.
    const id = window.setTimeout(() => el.scrollIntoView({ block: mark ? "center" : "start" }), 30);
    return () => window.clearTimeout(id);
  }, [report.id, target, quote]);

  return (
    <div className="flex flex-col gap-2 px-7 pb-10" data-testid="report-view" data-report={report.id} data-page={String(target)}>
      <div className="sticky top-0 z-10 -mx-7 flex items-center justify-between gap-4 border-b border-line bg-bg/95 px-7 py-3 backdrop-blur-sm" data-testid="report-bar">
        <Link href={`/portfolio/${report.companyId}`} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand hover:text-brand2" data-testid="back-to-company">
          <IconChevronLeft size={14} />
          Back to {company?.name ?? report.companyId}
        </Link>
        <span className="text-[13px] text-mut">
          {report.pages.length} pages · {monthYear(report.month)}
          {quote && hitPage === undefined ? " · The cited sentence was not found on this report." : null}
          {quote && hitPage !== undefined && hitPage !== page ? ` · The cited sentence is on page ${hitPage}.` : null}
        </span>
      </div>

      <article className="mx-auto mt-2 w-full max-w-[860px] rounded-[14px] border border-line bg-white px-10 py-8 shadow-[var(--shadow-card)]" data-testid="report">
        <div className="flex flex-col gap-4">
          {report.pages.map((p) => (
            <section key={p.n} className="flex flex-col gap-3" data-testid="report-page" data-page={p.n}>
              <PageRule n={p.n} current={p.n === target} />
              {parseBlocks(p.text).map((b, i) => (
                <BlockView key={i} block={b} quote={quote} />
              ))}
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}

function PageRule({ n, current }: { n: number; current: boolean }) {
  return (
    <div id={`page-${n}`} className={"flex items-center gap-3 scroll-mt-16 " + (n === 1 ? "" : "pt-4")} data-testid="page-marker" data-page={n}>
      <span className="h-px flex-1" style={{ background: current ? "#1f5a2d" : "#dde3da" }} />
      <span className={"text-[12px] font-semibold uppercase tracking-[0.06em] " + (current ? "text-brand" : "text-mut")}>Page {n}</span>
      <span className="h-px flex-1" style={{ background: current ? "#1f5a2d" : "#dde3da" }} />
    </div>
  );
}

function BlockView({ block, quote }: { block: Block; quote?: string }) {
  switch (block.type) {
    case "h1":
      return <h1 className="serif text-[26px] font-semibold leading-[1.2]">{block.text}</h1>;
    case "h2":
      return <h2 className="serif mt-2 text-[20px] font-semibold leading-[1.25]">{block.text}</h2>;
    case "h3":
      return <h3 className="mt-1 text-[15px] font-semibold">{block.text}</h3>;
    case "list":
      return (
        <ul className="list-disc pl-5 text-[15px] leading-[1.55]">
          {block.items.map((it, i) => (
            <li key={i}>
              <Marked text={it} quote={quote} />
            </li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[14px]">
            {block.head.length ? (
              <thead>
                <tr>
                  {block.head.map((h, i) => (
                    <th key={i} className={"border-b border-line px-2.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-mut " + (i === 0 ? "text-left" : "text-right")}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            ) : null}
            <tbody>
              {block.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j} className={"border-b border-line px-2.5 py-1.5 " + (j === 0 ? "text-left" : "text-right tabular-nums")}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return (
        <p className="text-[15px] leading-[1.55]">
          <Marked text={block.text} quote={quote} />
        </p>
      );
  }
}

function Marked({ text, quote }: { text: string; quote?: string }) {
  const split = quote ? splitAround(text, quote) : null;
  if (!split) return <>{text}</>;
  return (
    <>
      {split.before}
      <mark className="rounded-[3px] bg-[#fbf3dd] px-0.5 text-txt shadow-[0_0_0_2px_#fbf3dd,inset_0_-2px_0_#8a5a08]" data-hit="true" data-testid="cited-sentence">
        {split.hit}
      </mark>
      {split.after}
    </>
  );
}
