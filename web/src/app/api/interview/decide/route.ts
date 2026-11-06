// Gasan taps Approve or Decline in Telegram; the signed link lands here.

import { sql } from "@/lib/db";
import { telegram, verify } from "@/lib/decisions";

export const runtime = "nodejs";

function page(title: string, text: string, status = 200) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#07080b;color:#ede9e1;font:16px/1.6 system-ui,sans-serif;padding:24px}
main{max-width:440px;text-align:center}h1{font:400 2.4rem/1.1 Georgia,serif;margin:0 0 12px}p{color:#9a968e}span{color:#e8b86b}</style></head>
<body><main><h1>${title}</h1><p>${text}</p></main></body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export async function GET(request: Request) {
  const decision = verify(new URL(request.url).searchParams);
  if (!decision || !sql) return page("Link not valid", "This approval link is invalid or has been changed.", 400);

  const status = decision.action === "approve" ? "approved" : "declined";
  const rows = await sql`
    update interview_requests
    set status = ${status}, minutes = ${decision.action === "approve" ? decision.minutes : null}, decided_at = now()
    where id = ${decision.id} and status = 'pending'
    returning name, email, company`;
  if (!rows.length) {
    const [row] = await sql`select status, minutes from interview_requests where id = ${decision.id}`;
    return page("Already decided", row ? `This request is already <span>${esc(String(row.status))}</span>.` : "Request not found.");
  }
  const who = `${rows[0].name}${rows[0].company ? ` (${rows[0].company})` : ""}`;
  if (decision.action === "approve") {
    await telegram(`✅ Approved ${decision.minutes} min for ${who} · ${rows[0].email}`);
    return page("Approved", `<span>${esc(who)}</span> is approved for a ${decision.minutes}-minute interview with Jasmin. They will get their private link by email once live calls open.`);
  }
  await telegram(`✖ Declined: ${who}`);
  return page("Declined", `The request from <span>${esc(who)}</span> was declined.`);
}
