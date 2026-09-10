"use client";

// Right column, 360px. The Needs you card: "Before Thursday's call," the
// three drafted questions with their cites, Approve for Thursday and Edit.
// Approve marks them approved in the store and turns the card plain;
// nothing is sent. Before the newest report arrives (state `july`) the
// card says questions are drafted when it does. Then "What the reports do
// not say." Then "After the call" with the dictate control, which runs
// the same beat as the presenter menu. Questions approved from a pattern
// card's draft follow the drafted three with a "From Patterns" note.

import type { Company, Gap, Question } from "@/lib/types";
import { companyShortName, getNotes } from "@/lib/data";
import { FLAG_COLORS, YOU_COLORS } from "@/lib/flags";
import { fmtWeekday, numberWord } from "@/lib/format";
import { citeShort, parseCite } from "@/lib/cites";
import { useStore } from "@/lib/store";
import { Button, LABEL } from "@/components/ui/Button";
import { CiteLink } from "@/components/ui/CiteLink";
import { IconMic } from "@/components/ui/icons";

const CARD = "flex flex-col rounded-[14px] border border-line bg-white shadow-[var(--shadow-card)]";

export function QuestionsRail({ company, questions, gap, extras = [] }: { company: Company; questions: Question[]; gap?: Gap; extras?: Question[] }) {
  const approvedIds = useStore((s) => s.questionsApproved);
  const approve = useStore((s) => s.approveQuestions);
  const startDictation = useStore((s) => s.startDictation);
  const dictation = useStore((s) => s.dictation);
  const note = getNotes().find((n) => n.companyId === company.id) ?? getNotes()[0];
  const approved = approvedIds.includes(company.id);
  const weekday = fmtWeekday(company.nextCall);
  const count = numberWord(questions.length);
  const countCap = count.charAt(0).toUpperCase() + count.slice(1);
  const tone = approved ? { text: FLAG_COLORS.green.text, bg: FLAG_COLORS.green.bg } : { text: YOU_COLORS.text, bg: YOU_COLORS.bg };

  return (
    <div className="flex flex-col gap-3.5" data-testid="questions-rail">
      {questions.length === 0 ? (
        <section className={CARD + " gap-1.5 px-5 py-[18px]"} data-testid="questions-empty">
          <span className={LABEL}>Before {weekday}&apos;s call</span>
          <span className="text-[15px] leading-[1.45] text-mut">Questions are drafted when the next report arrives.</span>
        </section>
      ) : (
        <section
          className={CARD + " gap-3.5 px-5 py-[18px]"}
          style={approved ? undefined : { border: "1px solid #b9cbe3", borderLeft: "4px solid #2b5f9e", paddingLeft: 17 }}
          data-testid="needs-you"
          data-approved={approved ? "true" : "false"}
        >
          <div className="flex flex-col gap-0.5">
            <span className={LABEL} style={{ color: tone.text }}>
              {approved ? "Approved" : "Needs you"}
            </span>
            <span className="text-[18px] font-semibold">{approved ? `${weekday}'s call` : `Before ${weekday}'s call`}</span>
            <span className="text-[14px] text-mut">{approved ? `${countCap} questions approved. Nothing was sent; they are yours for the call.` : `${countCap} drafted questions. Edit or drop any of them.`}</span>
          </div>
          {questions.map((q) => (
            <div key={q.id} className="flex items-start gap-3" data-testid="question" data-question={q.id}>
              <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold" style={{ background: tone.bg, color: tone.text }}>
                {q.n}
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-[15px] leading-[1.4]">{q.text}</span>
                <QuestionCites cites={q.cites} companyId={company.id} />
              </div>
            </div>
          ))}
          {extras.map((q) => (
            <div key={q.id} className="flex items-start gap-3" data-testid="question" data-question={q.id} data-from="patterns">
              <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold" style={{ background: FLAG_COLORS.green.bg, color: FLAG_COLORS.green.text }}>
                {q.n}
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-[15px] leading-[1.4]">{q.text}</span>
                <span className="flex flex-wrap items-center gap-x-2 text-[12px] text-mut">
                  <span className="rounded-full bg-panel2 px-2 py-[1px] font-semibold text-txt" data-testid="from-patterns">
                    From Patterns
                  </span>
                  <QuestionCites cites={q.cites} companyId={company.id} />
                </span>
              </div>
            </div>
          ))}
          <div className="flex gap-2.5">
            {approved ? null : (
              <Button variant="you" onClick={() => approve(company.id)} testId="approve-questions">
                Approve for {weekday}
              </Button>
            )}
            <Button variant="secondary" testId="edit-questions">
              Edit
            </Button>
          </div>
        </section>
      )}

      <section className={CARD + " gap-2 px-5 py-4"} data-testid="gaps">
        <span className={LABEL}>What the reports do not say</span>
        <span className="text-[14px] leading-[1.45]">{gap?.text ?? "Nothing noted for this company yet."}</span>
      </section>

      <section className={CARD + " gap-2.5 px-5 py-4"} data-testid="after-the-call">
        <span className={LABEL}>After the call</span>
        <div className="flex items-center gap-2.5">
          <IconMic size={18} stroke="#61705f" />
          <span className="text-[14px] leading-[1.45]">Dictate two minutes. The learning log and current state update as a draft for review.</span>
        </div>
        <div>
          <Button variant="secondary" size={36} testId="dictate-note" onClick={() => note && dictation?.status !== "playing" && startDictation(note.id)}>
            Dictate a note
          </Button>
        </div>
      </section>
    </div>
  );
}

// "From March p. 2 and August p. 2", each a link. Another company's report
// carries its name: "Corvus August p. 2".
function QuestionCites({ cites, companyId }: { cites: string[]; companyId: string }) {
  const parsed = cites.map(parseCite).filter((c): c is NonNullable<typeof c> => !!c);
  if (!parsed.length) return null;
  const nodes = parsed.map((c, i) => (
    <CiteLink key={`${c.reportId}:${c.page}`} cite={c} className="underline decoration-line decoration-dotted underline-offset-[3px] hover:text-brand hover:decoration-brand">
      {citeShort(c, companyId, companyShortName)}
    </CiteLink>
  ));
  const out: React.ReactNode[] = [];
  nodes.forEach((n, i) => {
    if (i > 0) out.push(nodes.length === 2 ? " and " : i === nodes.length - 1 ? ", and " : ", ");
    out.push(n);
  });
  return (
    <span className="text-[12px] text-mut" data-testid="question-cites">
      From {out}
    </span>
  );
}
