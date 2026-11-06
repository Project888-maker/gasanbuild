// Which parts of the site are configured: yes/no only, never a value.

import { sql, today } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let database = false;
  let spentToday: number | null = null;
  if (sql) {
    try {
      const rows = await sql`select coalesce((select usd from chat_days where day = ${today()}), 0) as usd`;
      database = true;
      spentToday = Number(rows[0].usd);
    } catch (e) {
      console.error("health db", e);
    }
  }
  const cap = Number(process.env.CHAT_DAILY_CAP_USD) || 1;
  return Response.json(
    {
      database,
      chat: Boolean(process.env.CHAT_API_KEY),
      telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
      approvals: Boolean(process.env.INTERVIEW_SECRET),
      visitorSalt: Boolean(process.env.VISITOR_SALT),
      chatBudget: { capUsd: cap, spentTodayUsd: spentToday },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
