// Sends Gasan a fresh private planner link on his own Telegram. Safe to leave public:
// the link only ever goes to his chat, and at most once every 10 minutes.

import { sql } from "@/lib/db";
import { telegram } from "@/lib/decisions";
import { ADMIN_DAYS, plannerUrl } from "@/lib/sputnik";

export const runtime = "nodejs";

export async function POST() {
  const db = sql;
  const link = plannerUrl();
  if (!db || !link) return Response.json({ message: "Not configured yet." }, { status: 503 });
  const slot = Math.floor(Date.now() / 600_000);
  const rows = await db`
    insert into job_runs (name, day, result) values (${`sputnik_link_${slot}`}, current_date, '{}'::jsonb)
    on conflict do nothing returning name`;
  if (rows.length) await telegram(`📋 Your Sputnik posting planner (valid ${ADMIN_DAYS} days):\n${link}`);
  return Response.json({ ok: true });
}
