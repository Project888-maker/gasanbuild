// Every night (Vercel Cron, see vercel.json): review the day's chats with Jasmin,
// tell Gasan on Telegram who came and what to follow up, and drop chats older
// than 30 days. Runs once a day; Gasan (or a test) can force it with the secret.

import { sql, today } from "@/lib/db";
import { adminUrl, telegram } from "@/lib/decisions";
import { review, type Review, type Turn } from "@/lib/review";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_REVIEWS = 15;
const REVIEW_BUDGET_USD = 0.5;

function allowed(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const cron = process.env.CRON_SECRET;
  const manual = process.env.INTERVIEW_SECRET;
  if (cron && auth === `Bearer ${cron}`) return "cron";
  if (manual && auth === `Bearer ${manual}`) return "manual";
  if ((request.headers.get("user-agent") || "").includes("vercel-cron")) return "cron";
  return null;
}

const avg = (xs: number[]) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : "–");

export async function GET(request: Request) {
  const who = allowed(request);
  if (!who || !sql) return new Response("Not allowed", { status: 403 });
  const db = sql;
  const day = today();
  // A forced (manual) run doesn't count as tonight's run.
  const force = who === "manual" && new URL(request.url).searchParams.get("force") === "1";
  if (!force) {
    const fresh = await db`insert into job_runs (name, day) values ('nightly', ${day}) on conflict do nothing returning day`;
    if (!fresh.length) return Response.json({ skipped: "already ran today" });
  }

  const chats = await db`
    select id, page, messages, turns, request, ended from chat_conversations
    where updated_at > now() - interval '24 hours' order by turns desc`;
  let spent = 0;
  const reviewed: { id: string; page: string; request: boolean; ended: boolean; r: Review }[] = [];
  // Live interviews were reviewed and sent to Gasan the moment they ended (api/presenter/report).
  const lives = chats.filter((c) => c.page === "/interview").length;
  const queue = chats.filter((c) => c.turns >= 1 && c.page !== "/interview").slice(0, MAX_REVIEWS);
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (queue.length && spent < REVIEW_BUDGET_USD) {
      const c = queue.shift()!;
      try {
        const { review: r, cost } = await review(c.messages as Turn[]);
        spent += cost;
        reviewed.push({ id: String(c.id), page: String(c.page), request: Boolean(c.request), ended: Boolean(c.ended), r });
        await db`update chat_conversations set review = ${JSON.stringify(r)}::jsonb, reviewed_at = now() where id = ${c.id}`;
      } catch (e) {
        console.error("review", e);
      }
    }
  }));

  const [usage] = await db`select coalesce(sum(usd), 0) as usd from chat_days where day >= (current_date - 1)`;
  const requests = await db`
    select kind, count(*)::int as n from interview_requests where created_at > now() - interval '24 hours' group by kind`;
  const calls = requests.find((r) => r.kind === "call")?.n ?? 0;
  const interviews = requests.find((r) => r.kind === "interview")?.n ?? 0;
  // 30-day retention.
  await db`delete from chat_conversations where updated_at < now() - interval '30 days'`;

  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const lines: string[] = [`🌙 Jasmin's night report · ${date}`];
  if (!chats.length) {
    lines.push("", "Quiet day: no conversations.");
  } else {
    const replies = chats.reduce((n, c) => n + Number(c.turns), 0);
    lines.push(
      `💬 ${chats.length} conversation${chats.length === 1 ? "" : "s"} · ${replies} replies · chat spend $${Number(usage.usd).toFixed(2)} (cap $${process.env.CHAT_DAILY_CAP_USD || 1}/day)`,
      `📞 ${calls} call request${calls === 1 ? "" : "s"} · 🗓 ${interviews} interview request${interviews === 1 ? "" : "s"}`,
    );
    if (lives) lines.push(`🎥 ${lives} live interview${lives === 1 ? "" : "s"} (summaries sent when each ended)`);
    if (reviewed.length) {
      const s = (k: keyof Review["scores"]) => avg(reviewed.map((x) => Number(x.r.scores?.[k] || 0)));
      lines.push(`⭐ Jasmin today: human ${s("human")} · accuracy ${s("accuracy")} · boundaries ${s("boundaries")} · next step ${s("goal")}`);
      const serious = reviewed.filter((x) => x.r.serious);
      if (serious.length) {
        lines.push("", "Worth your attention:");
        for (const x of serious.slice(0, 6)) {
          lines.push(`• ${x.r.who}: ${x.r.summary}${x.request ? " (request sent)" : ""}${x.r.follow_up ? `\n  → ${x.r.follow_up}` : ""}`);
        }
      }
      const others = reviewed.filter((x) => !x.r.serious);
      if (others.length) {
        const kinds = others.reduce<Record<string, number>>((m, x) => {
          const k = x.r.intent || "other";
          m[k] = (m[k] || 0) + 1;
          return m;
        }, {});
        const closed = chats.some((c) => c.ended) ? " · Jasmin closed an abusive chat" : "";
        lines.push("", `Others: ${Object.entries(kinds).map(([k, n]) => `${n} ${k}`).join(", ")}${closed}`);
      }
      const issues = reviewed.flatMap((x) => (x.r.issues || []).slice(0, 1)).filter(Boolean).slice(0, 3);
      if (issues.length) lines.push("", "To improve:", ...issues.map((i) => `• ${i}`));
    }
    if (chats.length - lives > reviewed.length) lines.push("", `(${chats.length - lives - reviewed.length} not reviewed today: nightly limit)`);
  }
  const link = adminUrl();
  if (link) lines.push("", `Read every conversation: ${link}`);
  lines.push(`Review cost: $${spent.toFixed(3)}`);
  await telegram(lines.join("\n").slice(0, 4000));
  await db`update job_runs set result = ${JSON.stringify({ chats: chats.length, reviewed: reviewed.length, spent })}::jsonb
           where name = 'nightly' and day = ${day}`;
  return Response.json({ chats: chats.length, reviewed: reviewed.length, spent });
}
