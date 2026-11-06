// Gasan taps Approve or Decline in Telegram; the signed link lands here.

import { sql } from "@/lib/db";
import { inviteUrl, telegram, verify } from "@/lib/decisions";
import { mailConfigured, sendApproved, sendCallAccepted } from "@/lib/mail";

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
    returning name, email, company, preferred, kind`;
  if (!rows.length) {
    const [row] = await sql`select status, minutes from interview_requests where id = ${decision.id}`;
    return page("Already decided", row ? `This request is already <span>${esc(String(row.status))}</span>.` : "Request not found.");
  }
  const who = `${rows[0].name}${rows[0].company ? ` (${rows[0].company})` : ""}`;
  if (decision.action === "approve" && rows[0].kind === "call") {
    const emailed = mailConfigured()
      ? await sendCallAccepted(String(rows[0].email), String(rows[0].name), String(rows[0].preferred || "")).catch((e) => {
          console.error("mail call", e);
          return false;
        })
      : false;
    await telegram(
      `✅ Call accepted: ${who} · ${rows[0].email}\n` +
        (emailed ? "📧 They've been told you'll email them to fix a time." : "⚠️ No email sent (email not set up). Write to them directly.") +
        (rows[0].preferred ? `\nThey suggested: ${rows[0].preferred}` : ""),
    );
    return page("Call accepted", `Reply to <span>${esc(String(rows[0].email))}</span> to fix a time with <span>${esc(who)}</span>.`);
  }
  if (decision.action === "approve") {
    const invite = inviteUrl(decision.id, decision.minutes);
    let emailed = false;
    if (invite && mailConfigured()) {
      emailed = await sendApproved(String(rows[0].email), String(rows[0].name), decision.minutes, invite.url, String(rows[0].preferred || ""), invite.expires)
        .catch((e) => {
          console.error("mail approved", e);
          return false;
        });
    }
    await telegram(
      `✅ Approved ${decision.minutes} min for ${who} · ${rows[0].email}\n` +
        (emailed ? "📧 Private room link emailed." : `⚠️ Email not sent${mailConfigured() ? " (send failed, see logs)" : " (email not set up)"}.`) +
        (invite ? `\nRoom: ${invite.url}` : ""),
    );
    return page(
      "Approved",
      `<span>${esc(who)}</span> is approved for a ${decision.minutes}-minute interview with Jasmin. ` +
        (emailed ? "Their private room link is on its way by email." : "Email isn't set up yet, so the room link was sent to you on Telegram to forward."),
    );
  }
  await telegram(`✖ Declined: ${who}`);
  return page("Declined", `The request from <span>${esc(who)}</span> was declined.`);
}
