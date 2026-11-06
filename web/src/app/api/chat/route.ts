// Jasmin's public text chat, with a hard daily budget for the whole site.
//
// Before each answer the expected cost is reserved against today's budget in
// Postgres, atomically: when the reservation does not fit under the cap, the
// chat says it is closed for today. After the answer the reservation is
// replaced by the real cost (the endpoint's own figure when it reports one).
// No database or no key: the chat is off. It never runs without the cap.

import { sql, today, visitorId } from "@/lib/db";
import { systemPrompt } from "@/content/jasmin";

export const runtime = "nodejs";
export const maxDuration = 60;

const num = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const CAP = () => num("CHAT_DAILY_CAP_USD", 1);
const VISITOR_LIMIT = () => num("CHAT_VISITOR_LIMIT", 20);
// Jasmin's model is chosen by the conversation tests in eval/ (see eval/README.md).
// JASMIN_MODEL overrides it without a code change.
// Sonnet 5.5 won the 2026-11-06 tests (eval/results): most human and best at boundaries.
const DEFAULT_MODEL = "anthropic/claude-sonnet-5.5";
const MODEL = () => process.env.JASMIN_MODEL || DEFAULT_MODEL;
// USD per million tokens, for the reservation made before each answer. The real
// cost reported by the endpoint replaces the reservation afterwards.
const PRICES: Record<string, [number, number]> = {
  "google/gemini-2.5-flash": [0.3, 2.5],
  "anthropic/claude-haiku-5.5": [1, 5],
  "anthropic/claude-sonnet-5.5": [3, 15],
  "anthropic/claude-opus-5.5": [6, 30],
};
const PRICE_IN = () => (PRICES[MODEL()] ?? [3, 15])[0];
const PRICE_OUT = () => (PRICES[MODEL()] ?? [3, 15])[1];
// Chat answers don't need long silent thinking; Sonnet can't turn it off, so it gets the lowest effort.
const REASONING = () => (/sonnet|opus/.test(MODEL()) ? { effort: "low" } : { enabled: false });
const MAX_OUT = 1000;
// Default: Gemini Flash through fal's OpenRouter route, billed to the fal account,
// which reports the exact cost of every answer.
const BASE_URL = () => (process.env.CHAT_BASE_URL || "https://fal.run/openrouter/router/openai/v1").replace(/\/$/, "");

type Message = { role: "user" | "assistant"; content: string };

function reply(status: number, message: string) {
  return Response.json({ message }, { status });
}

function clean(body: unknown): Message[] | null {
  const list = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(list) || list.length === 0) return null;
  const messages = list
    .slice(-12)
    .filter((m): m is Message => !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));
  return messages.length && messages[messages.length - 1].role === "user" ? messages : null;
}

const cost = (tokensIn: number, tokensOut: number) => (tokensIn * PRICE_IN() + tokensOut * PRICE_OUT()) / 1_000_000;

export async function POST(request: Request) {
  const key = process.env.CHAT_API_KEY;
  const db = sql;
  if (!db || !key) {
    return reply(503, "My chat is being set up. In the meantime, take the guided tour or request a live interview.");
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const messages = clean(body);
  if (!messages) return reply(400, "I didn't catch a question there.");
  // Saved for 30 days so Gasan can review how Jasmin is doing (no IP addresses).
  const conversationId = typeof body?.conversationId === "string" && /^[0-9a-f-]{36}$/.test(body.conversationId) ? body.conversationId : null;
  const page = typeof body?.page === "string" ? body.page.slice(0, 120) : "";

  const day = today();
  const visitor = visitorId(request);

  // Per-visitor limit.
  const [seen] = await db`
    insert into chat_visitors (day, visitor, messages) values (${day}, ${visitor}, 1)
    on conflict (day, visitor) do update set messages = chat_visitors.messages + 1
    returning messages`;
  if (Number(seen.messages) > VISITOR_LIMIT()) {
    return reply(429, "We've talked a lot today! For more, request a live interview and Gasan will follow up.");
  }

  // Reserve the expected cost under today's cap.
  const system = systemPrompt();
  const chars = system.length + messages.reduce((n, m) => n + m.content.length, 0);
  const estimate = cost(Math.ceil(chars / 3.2), MAX_OUT);
  await db`insert into chat_days (day) values (${day}) on conflict (day) do nothing`;
  const reserved = await db`
    update chat_days set usd = usd + ${estimate}, messages = messages + 1
    where day = ${day} and usd + ${estimate} <= ${CAP()}
    returning usd`;
  if (!reserved.length) {
    return reply(429, "My chat budget for today is used up. Please come back tomorrow, or request a live interview.");
  }

  const settle = async (actual: number) => {
    await db`update chat_days set usd = greatest(0, usd - ${estimate} + ${actual}) where day = ${day}`;
  };

  let upstream: Response;
  try {
    upstream = await fetch(`${BASE_URL()}/chat/completions`, {
      method: "POST",
      headers: {
        // fal's OpenRouter route wants "Key <fal key>"; other endpoints use Bearer.
        Authorization: `${BASE_URL().includes("fal.run") ? "Key" : "Bearer"} ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://gasanbuildsai.vercel.app",
        "X-Title": "GasanbuildsAI - Jasmin",
      },
      body: JSON.stringify({
        model: MODEL(),
        // Every visitor gets the same system prompt, so Claude models cache it:
        // repeat turns cost about a tenth.
        messages: [
          MODEL().startsWith("anthropic/")
            ? { role: "system", content: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }] }
            : { role: "system", content: system },
          ...messages,
        ],
        max_tokens: MAX_OUT,
        temperature: 0.5,
        stream: true,
        stream_options: { include_usage: true },
        usage: { include: true },
        reasoning: REASONING(),
      }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    await settle(0);
    return reply(502, "I couldn't reach my thoughts just now. Please try again.");
  }
  if (!upstream.ok || !upstream.body) {
    await settle(0);
    console.error("chat upstream", upstream.status, await upstream.text().catch(() => ""));
    return reply(502, "I couldn't answer that one. Please try again in a moment.");
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body.getReader();
  let buffer = "";
  let usage: { prompt_tokens?: number; completion_tokens?: number; cost?: number } | null = null;
  let outChars = 0;
  let full = "";

  // fal's route keeps the connection open after "[DONE]", so the answer ends at
  // "[DONE]" (or when the connection closes), not when the socket does: waiting
  // for the socket ran every reply into the 60 s function timeout before the
  // real cost was recorded.
  let finished = false;
  const finish = async (controller: ReadableStreamDefaultController<Uint8Array>) => {
    if (finished) return;
    finished = true;
    const actual =
      typeof usage?.cost === "number"
        ? usage.cost
        : usage?.prompt_tokens != null
          ? cost(usage.prompt_tokens, usage.completion_tokens ?? 0)
          : cost(Math.ceil(chars / 3.2), Math.ceil(outChars / 3.2));
    await settle(actual).catch((e) => console.error("chat settle", e));
    if (conversationId) {
      const added = JSON.stringify([
        { role: "user", content: messages[messages.length - 1].content },
        { role: "assistant", content: full },
      ]);
      await db`
        insert into chat_conversations (id, visitor, page, messages, turns, cost, request, ended)
        values (${conversationId}, ${visitor}, ${page}, ${added}::jsonb, 1, ${actual},
                ${full.includes("[[request")}, ${full.includes("[[end]]")})
        on conflict (id) do update set
          messages = chat_conversations.messages || excluded.messages,
          turns = chat_conversations.turns + 1,
          cost = chat_conversations.cost + excluded.cost,
          request = chat_conversations.request or excluded.request,
          ended = chat_conversations.ended or excluded.ended,
          updated_at = now()
        where chat_conversations.visitor = excluded.visitor`.catch((e) => console.error("chat save", e));
    }
    // Jasmin ended the chat (repeated abuse or nonsense): no more messages today.
    if (full.includes("[[end]]")) {
      await db`update chat_visitors set messages = greatest(messages, ${VISITOR_LIMIT() + 1})
               where day = ${day} and visitor = ${visitor}`.catch((e) => console.error("chat end", e));
    }
    controller.close();
    reader.cancel().catch(() => {});
  };

  const stream = new ReadableStream<Uint8Array>({
    // A pull that enqueues nothing is not called again, so it reads on until it
    // has text to hand over or the answer has ended. (Chunks without text, like
    // the opening role chunk and the closing cost chunk, used to stall the
    // stream until the function timed out.)
    async pull(controller) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) return finish(controller);
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        let sent = false;
        for (const line of lines) {
          const data = line.startsWith("data:") ? line.slice(5).trim() : "";
          if (data === "[DONE]") return finish(controller);
          if (!data) continue;
          try {
            const chunk = JSON.parse(data);
            if (chunk.usage) usage = chunk.usage;
            const text: string | undefined = chunk.choices?.[0]?.delta?.content;
            if (text) {
              outChars += text.length;
              full += text;
              controller.enqueue(encoder.encode(text));
              sent = true;
            }
          } catch {
            // keep-alive comments and partial lines
          }
        }
        if (sent) return;
      }
    },
    async cancel() {
      if (finished) return;
      finished = true;
      await reader.cancel().catch(() => {});
      await settle(cost(Math.ceil(chars / 3.2), Math.ceil(outChars / 3.2))).catch(() => {});
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
