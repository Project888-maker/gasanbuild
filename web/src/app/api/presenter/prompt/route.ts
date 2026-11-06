// Hermes asks here, when a guest presses "Start live interview", for Jasmin's
// instructions for that guest. Only for an interview Gasan approved and hasn't
// since declined; only with the shared secret.

import { sql } from "@/lib/db";
import { fromHermes, presenterPrompt, type Guest } from "@/lib/presenter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const notFound = () => Response.json({ error: "no approved interview" }, { status: 404 });

export async function GET(request: Request) {
  if (!fromHermes(request) || !sql) return new Response("Not allowed", { status: 403 });
  const id = new URL(request.url).searchParams.get("invite") || "";
  if (!/^[0-9a-f-]{36}$/.test(id)) return notFound();
  const [row] = await sql`
    select name, company, role, topics, minutes, status, kind from interview_requests where id = ${id}`;
  if (!row || row.status !== "approved" || row.kind === "call") return notFound();
  const guest: Guest = {
    name: String(row.name),
    company: String(row.company || ""),
    role: String(row.role || ""),
    topics: String(row.topics || ""),
    minutes: Number(row.minutes) || 20,
  };
  return Response.json(
    { prompt: presenterPrompt(guest), guest: { name: guest.name, company: guest.company, role: guest.role, minutes: guest.minutes } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
