// The live path for "Ask the ledger." Only when the server has
// ANTHROPIC_API_KEY; otherwise {offline: true} (a 200, so the browser
// logs no error) and the box falls back to the six scripted questions. The question and the ledger for the months in view
// go to claude-sonnet-5 with a system prompt that allows only sentences
// already in the ledger, returned as JSON. The route then keeps only the
// candidates that are character-exact ledger quotes (lib/ask.ts), so the
// screen never shows a sentence management did not write. Raw HTTP, no
// SDK: the SDK stays in scripts/run-ledger.ts.

import { ledgerContext, verifyLiveItems, type LiveItem } from "@/lib/ask";
import { resolveStateKey } from "@/lib/data";

export const runtime = "nodejs";

const MODEL = "claude-sonnet-5";
const TIMEOUT_MS = 12000;

const SYSTEM = [
  "You are answering a private equity deal lead's question about monthly management reports, using only the ledger provided.",
  "The ledger lists initiatives by company, each with the sentence management wrote about it in each month.",
  'Choose the sentences that answer the question. Return only JSON: {"items": [{"initiativeId": string, "month": "YYYY-MM", "quote": string}]}.',
  "Every quote must be a character-exact copy of a sentence in the ledger, whole, for that initiative and month. Never write a sentence of your own, never shorten or paraphrase one, and never add commentary.",
  "Return at most eight items, in the order they answer the question. Return an empty items array if nothing in the ledger answers it.",
].join(" ");

export async function POST(req: Request): Promise<Response> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ offline: true });
  let body: { question?: string; stateName?: string } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const question = (body.question ?? "").toString().slice(0, 300).trim();
  if (!question) return Response.json({ error: "no question" }, { status: 400 });
  const stateName = resolveStateKey(body.stateName);
  const context = ledgerContext(stateName);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        system: SYSTEM,
        messages: [{ role: "user", content: `Question: ${question}\n\nLedger (JSON):\n${JSON.stringify(context)}` }],
      }),
    });
    if (!res.ok) return Response.json({ offline: true, status: res.status });
    const data = (await res.json()) as { content?: { type: string; text?: string }[]; stop_reason?: string };
    const text = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
    const json = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
    let parsed: { items?: LiveItem[] } = {};
    try {
      parsed = JSON.parse(json);
    } catch {
      return Response.json({ offline: true, reason: "unparseable" });
    }
    const items = verifyLiveItems(Array.isArray(parsed.items) ? parsed.items : [], stateName);
    return Response.json({ items, model: MODEL, stateName });
  } catch {
    return Response.json({ offline: true });
  } finally {
    clearTimeout(timer);
  }
}
