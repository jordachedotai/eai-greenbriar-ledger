"use client";

// "Ask the ledger": one question box in the header on every page. Typing
// filters the six scripted questions; Enter or a click answers. An answer
// is quotes with page links, grouped by company and month, silences where
// an initiative was not mentioned, and the drafted questions when the
// question is about the next call. Never uncited prose. A question that
// is not scripted goes to /api/ask when the server has a key; the route
// verifies every sentence against the ledger. Otherwise: "I can answer
// these six in the demo," with the list. Answers respect the month in
// view: nothing later leaks back.

import { useEffect, useRef, useState } from "react";
import type { Answer } from "@/lib/types";
import { useStore } from "@/lib/store";
import { getAnswers, getCompany } from "@/lib/data";
import { ASK_FALLBACK, ASK_PLACEHOLDER, matchQuestion, resolveAnswer, suggestions, verifyLiveItems, type LiveItem, type ResolvedAnswer, type ResolvedItem } from "@/lib/ask";
import { FLAG_COLORS } from "@/lib/flags";
import { monthLabel } from "@/lib/format";
import { parseCite } from "@/lib/cites";
import { companyShortName } from "@/lib/data";
import { citeShort } from "@/lib/cites";
import { CiteLink } from "@/components/ui/CiteLink";
import { FlagCell, YouChip } from "@/components/Portfolio/StatusPill";
import { IconAsk, IconX } from "@/components/ui/icons";

type Mode = { kind: "closed" } | { kind: "suggest" } | { kind: "asking"; question: string } | { kind: "answer"; answer: ResolvedAnswer } | { kind: "fallback"; question: string; reason: "offline" | "nothing" };

export function AskBox() {
  const stateName = useStore((s) => s.stateName);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>({ kind: "closed" });
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const answers = getAnswers();
  const list = suggestions(text, answers);

  useEffect(() => {
    if (mode.kind === "closed") return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setMode({ kind: "closed" });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMode({ kind: "closed" });
        input.current?.blur();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [mode.kind]);

  // An answer follows the month in view.
  useEffect(() => {
    setMode((m) => (m.kind === "answer" && m.answer.source === "scripted" ? { kind: "answer", answer: resolveAnswer(answers.find((a) => a.id === m.answer.id) ?? { id: m.answer.id, question: m.answer.question, items: [] }, stateName) } : m));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateName]);

  const answerScripted = (a: Answer) => {
    setText(a.question);
    setMode({ kind: "answer", answer: resolveAnswer(a, stateName) });
    setActive(0);
  };

  const ask = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const scripted = matchQuestion(trimmed, answers);
    if (scripted) return answerScripted(scripted);
    setMode({ kind: "asking", question: trimmed });
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 15000);
      const res = await fetch("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: trimmed, stateName }), signal: controller.signal });
      window.clearTimeout(timer);
      if (!res.ok) return setMode({ kind: "fallback", question: trimmed, reason: "offline" });
      const data = (await res.json()) as { items?: LiveItem[]; offline?: boolean };
      if (data.offline) return setMode({ kind: "fallback", question: trimmed, reason: "offline" });
      // Verify again on the client: only ledger quotes reach the screen.
      const items = verifyLiveItems(data.items ?? [], stateName);
      if (!items.length) return setMode({ kind: "fallback", question: trimmed, reason: "nothing" });
      setMode({ kind: "answer", answer: resolveAnswer({ id: "live", question: trimmed, items }, stateName, "live") });
    } catch {
      setMode({ kind: "fallback", question: trimmed, reason: "offline" });
    }
  };

  const close = () => {
    setMode({ kind: "closed" });
    input.current?.blur();
  };

  const open = mode.kind !== "closed";
  return (
    <div ref={box} className="relative min-w-0 flex-1" data-testid="ask" data-mode={mode.kind}>
      <div className={"flex h-[36px] items-center gap-2 rounded-[10px] border px-3 " + (open ? "border-white/40 bg-white text-txt" : "border-white/20 bg-white/10 text-white")}>
        <IconAsk size={16} className="shrink-0 opacity-80" />
        <input
          ref={input}
          value={text}
          placeholder={ASK_PLACEHOLDER}
          aria-label={ASK_PLACEHOLDER}
          aria-expanded={open}
          aria-controls="ask-panel"
          role="combobox"
          aria-autocomplete="list"
          onFocus={() => setMode((m) => (m.kind === "closed" ? { kind: "suggest" } : m))}
          onChange={(e) => {
            setText(e.target.value);
            setMode({ kind: "suggest" });
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              close();
            } else if (e.key === "ArrowDown" && mode.kind === "suggest") {
              e.preventDefault();
              setActive((a) => Math.min(list.length - 1, a + 1));
            } else if (e.key === "ArrowUp" && mode.kind === "suggest") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (mode.kind === "suggest" && list[active] && text.trim() && normalizeEq(list[active].question, text)) answerScripted(list[active]);
              else if (mode.kind === "suggest" && !text.trim() && list[active]) answerScripted(list[active]);
              else void ask(text);
            }
          }}
          className={"min-w-0 flex-1 bg-transparent text-[14px] outline-none " + (open ? "placeholder:text-mut" : "placeholder:text-white/60")}
          data-testid="ask-input"
        />
        {text ? (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => {
              setText("");
              setMode({ kind: "suggest" });
              input.current?.focus();
            }}
            className="shrink-0 opacity-60 hover:opacity-100"
            data-testid="ask-clear"
          >
            <IconX size={12} />
          </button>
        ) : null}
      </div>
      {open ? (
        <div id="ask-panel" className="absolute left-0 top-[44px] z-[55] w-[680px] max-w-[calc(100vw-80px)] overflow-hidden rounded-[14px] border border-line bg-white text-txt shadow-[var(--shadow-card-hover)]" data-testid="ask-panel">
          {mode.kind === "suggest" ? (
            <div className="flex flex-col p-2" role="listbox" aria-label="Questions">
              <span className="px-3 pb-1.5 pt-1 text-[12px] font-semibold uppercase tracking-[0.04em] text-mut">{text.trim() ? "Questions that match" : "Questions the ledger can answer"}</span>
              {list.map((a, i) => (
                <button
                  key={a.id}
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => answerScripted(a)}
                  className={"rounded-[8px] px-3 py-2 text-left text-[15px] " + (i === active ? "bg-brand-soft text-brand2" : "hover:bg-bg")}
                  data-testid="ask-suggestion"
                  data-answer={a.id}
                >
                  {a.question}
                </button>
              ))}
              {list.length === 0 ? (
                <span className="px-3 py-2 text-[14px] text-mut" data-testid="ask-no-match">
                  No scripted question matches. Press Enter to ask anyway.
                </span>
              ) : null}
            </div>
          ) : null}
          {mode.kind === "asking" ? (
            <div className="flex items-center gap-2.5 px-4 py-3.5 text-[14px]" data-testid="ask-asking">
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-line border-t-brand" />
              <span className="working">Reading the ledger</span>
            </div>
          ) : null}
          {mode.kind === "fallback" ? (
            <div className="flex flex-col gap-2 p-2" data-testid="ask-fallback" data-reason={mode.reason}>
              <span className="px-3 pt-2 text-[14px] leading-[1.45]">
                {mode.reason === "nothing" ? "Nothing in the reports read so far answers that. " : ""}
                {ASK_FALLBACK}
              </span>
              {answers.map((a) => (
                <button key={a.id} type="button" onClick={() => answerScripted(a)} className="rounded-[8px] px-3 py-2 text-left text-[15px] hover:bg-bg" data-testid="ask-suggestion" data-answer={a.id}>
                  {a.question}
                </button>
              ))}
            </div>
          ) : null}
          {mode.kind === "answer" ? <AnswerView answer={mode.answer} onClose={close} /> : null}
        </div>
      ) : null}
    </div>
  );
}

function normalizeEq(a: string, b: string): boolean {
  const n = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return n(a) === n(b);
}

function AnswerView({ answer, onClose }: { answer: ResolvedAnswer; onClose: () => void }) {
  return (
    <div className="flex max-h-[70vh] flex-col" data-testid="ask-answer" data-answer={answer.id} data-source={answer.source} data-count={answer.items.length}>
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[15px] font-semibold leading-[1.3]">{answer.question}</span>
          <span className="text-[12px] text-mut">{answer.source === "live" ? "Read by the model. Every sentence below was verified against the ledger." : "What management wrote, with the page. Nothing paraphrased."}</span>
        </div>
        <button type="button" aria-label="Close" onClick={onClose} className="shrink-0 rounded-[6px] p-1 text-mut hover:bg-bg hover:text-txt" data-testid="ask-close">
          <IconX size={12} />
        </button>
      </div>
      <div className="flex flex-col gap-3 overflow-y-auto px-4 py-3">
        {answer.groups.length === 0 ? (
          <span className="text-[14px] text-mut" data-testid="ask-empty">
            Nothing in the reports read so far. Add the next month&apos;s reports, or return to August.
          </span>
        ) : null}
        {answer.groups.map((g) => (
          <div key={g.companyId} className="flex flex-col gap-2" data-testid="ask-group" data-company={g.companyId}>
            <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-mut">{getCompany(g.companyId)?.name ?? g.companyId}</span>
            {g.items.map((it, i) => (
              <Item key={i} item={it} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Item({ item }: { item: ResolvedItem }) {
  if (item.kind === "question") {
    const q = item.question;
    return (
      <div className="flex flex-col gap-1 rounded-[10px] border border-line px-3.5 py-2.5" data-testid="ask-item" data-kind="question" data-question={q.id}>
        <div className="flex items-start gap-2">
          <span className="flex-1 text-[15px] leading-[1.45]">{q.text}</span>
          <YouChip text="Draft" />
        </div>
        <span className="flex flex-wrap gap-x-3 text-[12px] text-mut">
          {q.cites.map((c) => {
            const cite = parseCite(c);
            return cite ? (
              <CiteLink key={c} cite={cite}>
                {citeShort(cite, q.companyId, companyShortName)}
              </CiteLink>
            ) : null;
          })}
        </span>
      </div>
    );
  }
  const c = FLAG_COLORS[item.read.flag];
  return (
    <div className="grid grid-cols-[92px_1fr] items-start gap-3" data-testid="ask-item" data-kind={item.kind} data-initiative={item.initiativeId} data-month={item.month}>
      <div className="flex items-center gap-2 pt-0.5">
        <FlagCell flag={item.read.flag} title={c.name} size={20} />
        <span className="text-[14px] font-semibold">{monthLabel(item.month)}</span>
      </div>
      <div className="flex flex-col gap-1 rounded-[10px] border border-line px-3.5 py-2.5">
        <span className="text-[12px] text-mut">{item.name}</span>
        {item.kind === "quote" ? (
          <span className="text-[15px] leading-[1.45]" data-testid="ask-quote">
            {"“" + item.read.quote + "”"}
          </span>
        ) : (
          <span className="text-[15px] leading-[1.45] text-mut" data-testid="ask-quote">
            Not mentioned in {monthLabel(item.month)}.
          </span>
        )}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          {item.read.cite ? (
            <span className="whitespace-nowrap">
              <CiteLink cite={item.read.cite} quote={item.read.quote} />
            </span>
          ) : (
            <span className="text-[12px] text-mut">No report page to cite.</span>
          )}
          {item.read.change ? (
            <span className="ml-auto inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-[3px] text-[12px] font-semibold" style={{ background: c.bg, color: c.text, border: `1px solid ${c.line}` }} data-testid="change-chip">
              {item.read.change.label}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
