// Emails to guests, sent from Gasan's Gmail through SMTP with a Google App Password
// (SMTP_USER / SMTP_PASS). Replies go straight to Gasan. No config: nothing is sent.

import nodemailer from "nodemailer";

export function mailConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

const site = () => (process.env.NEXT_PUBLIC_SITE_URL || "https://gasanbuildsai.vercel.app").replace(/\/$/, "");
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function layout(paragraphs: string[], button?: { label: string; url: string }) {
  const body = paragraphs.map((p) => `<p style="margin:0 0 16px;line-height:1.6">${p}</p>`).join("");
  const cta = button
    ? `<p style="margin:28px 0"><a href="${button.url}" style="background:#e8b86b;color:#07080b;text-decoration:none;font-weight:600;padding:14px 22px;border-radius:999px;display:inline-block">${esc(button.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#07080b;padding:32px 16px;font-family:Helvetica,Arial,sans-serif;color:#ede9e1">
<div style="max-width:560px;margin:0 auto;background:#0d0f14;border:1px solid #1f222b;border-radius:20px;padding:32px">
<p style="margin:0 0 24px;font-family:Georgia,serif;font-size:22px">Gasan <span style="color:#e8b86b;font-family:monospace;font-size:12px;letter-spacing:3px">BUILDS·AI</span></p>
${body}${cta}
<p style="margin:24px 0 0;line-height:1.6">Jasmin<br><span style="color:#9a968e">AI Chief of Staff to Gasan</span></p>
<p style="margin:24px 0 0;font-size:12px;color:#6f6c66;line-height:1.5">I'm an AI. To reach Gasan directly, just reply to this email.</p>
</div></body></html>`;
}

async function send(to: string, subject: string, html: string, text: string) {
  if (!mailConfigured()) return false;
  const user = process.env.SMTP_USER!;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user, pass: process.env.SMTP_PASS! },
  });
  await transport.sendMail({
    from: { name: "Jasmin · Gasan builds AI", address: user },
    replyTo: process.env.REPLY_TO || user,
    to,
    subject,
    html,
    text,
  });
  return true;
}

export async function sendReceived(to: string, name: string) {
  const first = name.split(" ")[0];
  const lines = [
    `Hi ${esc(first)},`,
    "Thank you for your interest in Gasan's work. I've passed your interview request to him, and he reviews every request personally.",
    "If it's approved, I'll email you a private link to your live video interview with me. Until then, you're welcome to explore the projects or chat with me on the site.",
  ];
  return send(
    to,
    "I've received your request · Gasan builds AI",
    layout(lines, { label: "Explore the work", url: `${site()}/work` }),
    `Hi ${first},\n\n${lines.slice(1).join("\n\n")}\n\n${site()}/work\n\nJasmin, AI Chief of Staff to Gasan\n(I'm an AI. Reply to this email to reach Gasan directly.)`,
  );
}

export async function sendApproved(to: string, name: string, minutes: number, room: string, preferred: string, validUntil: Date) {
  const first = name.split(" ")[0];
  const until = validUntil.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const lines = [
    `Hi ${esc(first)},`,
    `Good news: Gasan has approved your <strong>${minutes}-minute</strong> live video interview with me.`,
    `Your private room is below. It's yours alone and works until ${until}. Gasan will reply to confirm the exact time${preferred ? ` (you suggested: ${esc(preferred)})` : ""}.`,
    "Until the call, your room is where you can chat with me and take my guided tour of the projects.",
  ];
  return send(
    to,
    `Approved: your ${minutes}-minute interview with Jasmin`,
    layout(lines, { label: "Open your private room", url: room }),
    `Hi ${first},\n\nGasan has approved your ${minutes}-minute live video interview with me.\n\nYour private room (works until ${until}): ${room}\n\nGasan will reply to confirm the exact time${preferred ? ` (you suggested: ${preferred})` : ""}.\n\nJasmin, AI Chief of Staff to Gasan\n(I'm an AI. Reply to this email to reach Gasan directly.)`,
  );
}
