// Requests from visitors, saved for Gasan to review and sent to him on Telegram:
//   kind "interview": a live video interview with Jasmin (the form, or Jasmin's chat card)
//   kind "call":      a private call with Gasan himself (Jasmin's chat card)

import { sql, today, visitorId } from "@/lib/db";
import { decisionUrl, telegram, type Decision } from "@/lib/decisions";
import { sendReceived } from "@/lib/mail";

type Kind = "interview" | "call";

export const runtime = "nodejs";

const FIELDS = ["name", "email", "company", "role", "topics", "preferred"] as const;
type Request_ = Record<(typeof FIELDS)[number], string>;

const LIMITS: Record<(typeof FIELDS)[number], number> = { name: 120, email: 200, company: 160, role: 120, topics: 1500, preferred: 200 };

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function notify(r: Request_, id: string, kind: Kind, note: string, source: string) {
  const lines = [
    kind === "call" ? "📞 New request for a private call with you" : "🗓 New interview request for Jasmin",
    `${r.name}${r.role ? `, ${r.role}` : ""}${r.company ? ` at ${r.company}` : ""}`,
    r.email,
    r.preferred ? `When: ${r.preferred}` : "",
    "",
    r.topics,
    note ? `\n🧠 Jasmin's note: ${note}` : "",
    source === "chat" ? "(arranged by Jasmin in chat)" : "",
  ].filter((line, i, all) => line !== "" || all[i - 1] !== "");
  const link = (action: Decision["action"], minutes: number) => decisionUrl({ id, action, minutes });
  const no = link("decline", 0);
  let buttons: { text: string; url: string }[][] | undefined;
  if (kind === "call") {
    const yes = link("approve", 30);
    buttons = yes && no ? [[{ text: "✅ Accept call", url: yes }, { text: "✖ Decline", url: no }]] : undefined;
  } else {
    const a20 = link("approve", 20);
    const a45 = link("approve", 45);
    buttons = a20 && a45 && no
      ? [[{ text: "✅ Approve 20 min", url: a20 }, { text: "✅ Approve 45 min", url: a45 }], [{ text: "✖ Decline", url: no }]]
      : undefined;
  }
  await telegram(lines.join("\n"), buttons);
}

export async function POST(request: Request) {
  const db = sql;
  if (!db) return Response.json({ message: "Requests open very soon." }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  // A field people never see: bots fill it in.
  if (text(body.website, 10)) return Response.json({ ok: true });

  const r = Object.fromEntries(FIELDS.map((f) => [f, text(body[f], LIMITS[f])])) as Request_;
  const kind: Kind = body.kind === "call" ? "call" : "interview";
  const note = text(body.note, 400);
  const source = body.source === "chat" ? "chat" : "form";
  if (!r.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email) || r.topics.length < 3) {
    return Response.json({ message: "Please add your name, a valid email and what you'd like to discuss." }, { status: 400 });
  }

  const visitor = visitorId(request);
  const [{ count }] = await db`
    select count(*)::int as count from interview_requests where visitor = ${visitor} and created_at::date = ${today()}`;
  if (Number(count) >= 3) {
    return Response.json({ message: "We already have your request. Gasan will be in touch." }, { status: 429 });
  }

  const [row] = await db`
    insert into interview_requests (name, email, company, role, topics, preferred, visitor, kind, note, source)
    values (${r.name}, ${r.email}, ${r.company}, ${r.role}, ${r.topics}, ${r.preferred}, ${visitor}, ${kind}, ${note}, ${source})
    returning id`;
  await Promise.all([
    notify(r, String(row.id), kind, note, source),
    sendReceived(r.email, r.name, kind).catch((e) => console.error("mail received", e)),
  ]);
  return Response.json({ ok: true });
}
