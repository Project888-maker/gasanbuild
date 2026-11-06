// Interview requests: saved for Gasan to review, and sent to him on Telegram.
// Approval (and the private call link) comes in the next phase, through Hermes.

import { sql, today, visitorId } from "@/lib/db";

export const runtime = "nodejs";

const FIELDS = ["name", "email", "company", "role", "topics", "preferred"] as const;
type Request_ = Record<(typeof FIELDS)[number], string>;

const LIMITS: Record<(typeof FIELDS)[number], number> = { name: 120, email: 200, company: 160, role: 120, topics: 1500, preferred: 200 };

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function notify(r: Request_, id: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  const lines = [
    "🗓 New interview request for Jasmin",
    `${r.name}${r.role ? `, ${r.role}` : ""}${r.company ? ` at ${r.company}` : ""}`,
    r.email,
    r.preferred ? `When: ${r.preferred}` : "",
    "",
    r.topics,
    "",
    `Request ${id.slice(0, 8)}`,
  ].filter((line, i, all) => line !== "" || all[i - 1] !== "");
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text: lines.join("\n"), disable_web_page_preview: true }),
    signal: AbortSignal.timeout(8000),
  }).catch((e) => console.error("telegram notify", e));
}

export async function POST(request: Request) {
  const db = sql;
  if (!db) return Response.json({ message: "Requests open very soon." }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  // A field people never see: bots fill it in.
  if (text(body.website, 10)) return Response.json({ ok: true });

  const r = Object.fromEntries(FIELDS.map((f) => [f, text(body[f], LIMITS[f])])) as Request_;
  if (!r.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email) || r.topics.length < 10) {
    return Response.json({ message: "Please add your name, a valid email and what you'd like to discuss." }, { status: 400 });
  }

  const visitor = visitorId(request);
  const [{ count }] = await db`
    select count(*)::int as count from interview_requests where visitor = ${visitor} and created_at::date = ${today()}`;
  if (Number(count) >= 3) {
    return Response.json({ message: "We already have your request. Gasan will be in touch." }, { status: 429 });
  }

  const [row] = await db`
    insert into interview_requests (name, email, company, role, topics, preferred, visitor)
    values (${r.name}, ${r.email}, ${r.company}, ${r.role}, ${r.topics}, ${r.preferred}, ${visitor})
    returning id`;
  await notify(r, String(row.id));
  return Response.json({ ok: true });
}
