// Hermes sends the transcript here when a live interview ends. It is saved with
// the chats (Gasan reads it on the admin page), reviewed, and Gasan gets the
// summary on Telegram straight away. Hermes gets its answer first; the review
// runs after the response.

import { after } from "next/server";
import { sql } from "@/lib/db";
import { adminUrl, telegram } from "@/lib/decisions";
import { fromHermes, presenterPrompt } from "@/lib/presenter";
import { review, type Review, type Turn } from "@/lib/review";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function turns(raw: unknown): Turn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((t) => t && (t.role === "user" || t.role === "assistant") && typeof t.text === "string" && t.text.trim())
    .slice(0, 400)
    .map((t) => ({ role: t.role, content: String(t.text).trim().slice(0, 4000) }));
}

export async function POST(request: Request) {
  if (!fromHermes(request) || !sql) return new Response("Not allowed", { status: 403 });
  const db = sql;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = typeof body?.invite === "string" && /^[0-9a-f-]{36}$/.test(body.invite) ? body.invite : "";
  const seconds = Math.max(0, Math.min(3 * 3600, Number(body?.seconds) || 0));
  // What the call cost, by part, as Hermes's interview agent measured it (USD).
  const raw = (body?.cost ?? null) as Record<string, unknown> | null;
  const usd = (key: string) => Math.max(0, Math.min(1000, Number(raw?.[key]) || 0)).toFixed(2);
  const cost = raw
    ? `💷 This call: ~$${usd("total")} (${String(raw.brain || "?").slice(0, 20)}) · brain $${usd("brain")} · ` +
      `voice $${usd("voice")} · avatar $${usd("avatar")} · transcription $${usd("transcription")}`
    : "";
  const added = turns(body?.transcript);
  if (!id || !added.length) return Response.json({ error: "nothing to save" }, { status: 400 });
  const [guest] = await db`select name, company, role, topics, minutes from interview_requests where id = ${id}`;
  if (!guest) return Response.json({ error: "unknown interview" }, { status: 404 });

  // One record per interview; a reconnect adds to it.
  const replies = added.filter((t) => t.role === "assistant").length;
  const [saved] = await db`
    insert into chat_conversations (id, visitor, page, messages, turns)
    values (${id}, 'live-interview', '/interview', ${JSON.stringify(added)}::jsonb, ${replies})
    on conflict (id) do update set
      messages = chat_conversations.messages || excluded.messages,
      turns = chat_conversations.turns + excluded.turns,
      updated_at = now()
    returning messages`;

  after(async () => {
    let r: Review | null = null;
    const who = [guest.role, guest.company].filter(Boolean).join(" at ");
    try {
      const prompt = presenterPrompt({
        name: String(guest.name), company: String(guest.company || ""), role: String(guest.role || ""),
        topics: String(guest.topics || ""), minutes: Number(guest.minutes) || 20,
      });
      r = (await review(saved.messages as Turn[], { prompt, guest: `${guest.name}${who ? `, ${who}` : ""}` })).review;
      await db`update chat_conversations set review = ${JSON.stringify(r)}::jsonb, reviewed_at = now() where id = ${id}`;
    } catch (e) {
      console.error("interview review", e);
    }
    const lines = [
      "🎥 Live interview with Jasmin just ended",
      `${guest.name}${who ? ` · ${who}` : ""} · ${Math.max(1, Math.round(seconds / 60))} of ${guest.minutes || "?"} min`,
      "",
    ];
    if (r) {
      lines.push(r.summary);
      if (r.follow_up) lines.push(`→ ${r.follow_up}`);
      if (r.scores) {
        lines.push(`⭐ human ${r.scores.human} · accuracy ${r.scores.accuracy} · boundaries ${r.scores.boundaries} · next step ${r.scores.goal}`);
      }
      if (r.issues?.[0]) lines.push(`To improve: ${r.issues[0]}`);
    } else {
      const asked = added.filter((t) => t.role === "user").slice(0, 3).map((t) => `• ${t.content.slice(0, 160)}`);
      lines.push("(The automatic summary failed. What they asked first:)", ...asked);
    }
    if (cost) lines.push("", cost);
    const link = adminUrl();
    await telegram(lines.join("\n").slice(0, 4000), link ? [[{ text: "Read the whole interview", url: link }]] : undefined);
  });

  return Response.json({ ok: true });
}
