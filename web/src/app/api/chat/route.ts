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
const PRICE_IN = () => num("CHAT_PRICE_IN", 0.3);
const PRICE_OUT = () => num("CHAT_PRICE_OUT", 2.5);
const MAX_OUT = 450;

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
  const messages = clean(await request.json().catch(() => null));
  if (!messages) return reply(400, "I didn't catch a question there.");

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
    upstream = await fetch(`${process.env.CHAT_BASE_URL || "https://openrouter.ai/api/v1"}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://gasanbuildsai.vercel.app",
        "X-Title": "GasanbuildsAI - Jasmin",
      },
      body: JSON.stringify({
        model: process.env.CHAT_MODEL || "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, ...messages],
        max_tokens: MAX_OUT,
        temperature: 0.5,
        stream: true,
        stream_options: { include_usage: true },
        usage: { include: true },
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

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        const actual =
          typeof usage?.cost === "number"
            ? usage.cost
            : usage?.prompt_tokens != null
              ? cost(usage.prompt_tokens, usage.completion_tokens ?? 0)
              : cost(Math.ceil(chars / 3.2), Math.ceil(outChars / 3.2));
        await settle(actual).catch((e) => console.error("chat settle", e));
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const data = line.startsWith("data:") ? line.slice(5).trim() : "";
        if (!data || data === "[DONE]") continue;
        try {
          const chunk = JSON.parse(data);
          if (chunk.usage) usage = chunk.usage;
          const text: string | undefined = chunk.choices?.[0]?.delta?.content;
          if (text) {
            outChars += text.length;
            controller.enqueue(encoder.encode(text));
          }
        } catch {
          // keep-alive comments and partial lines
        }
      }
    },
    async cancel() {
      await reader.cancel();
      await settle(cost(Math.ceil(chars / 3.2), Math.ceil(outChars / 3.2))).catch(() => {});
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
