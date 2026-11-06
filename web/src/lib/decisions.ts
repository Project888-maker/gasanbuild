// Signed approve/decline links for interview requests, sent to Gasan on Telegram.
// Only someone holding the link can decide, and a link cannot be altered
// (say, from 20 to 90 minutes) without breaking its signature.

import { createHmac, timingSafeEqual } from "node:crypto";

export type Decision = { id: string; action: "approve" | "decline"; minutes: number };

const secret = () => process.env.INTERVIEW_SECRET || "";

function sign(d: Decision): string {
  return createHmac("sha256", secret()).update(`${d.id}|${d.action}|${d.minutes}`).digest("base64url");
}

export function decisionUrl(d: Decision): string | null {
  if (!secret()) return null;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://gasanbuildsai.vercel.app").replace(/\/$/, "");
  const q = new URLSearchParams({ id: d.id, action: d.action, minutes: String(d.minutes), sig: sign(d) });
  return `${base}/api/interview/decide?${q}`;
}

export function verify(params: URLSearchParams): Decision | null {
  const id = params.get("id") || "";
  const action = params.get("action");
  const minutes = Number(params.get("minutes") || 0);
  const sig = params.get("sig") || "";
  if (!secret() || !/^[0-9a-f-]{36}$/.test(id) || (action !== "approve" && action !== "decline")) return null;
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 120) return null;
  const d: Decision = { id, action, minutes };
  const expected = Buffer.from(sign(d));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given) ? d : null;
}

export async function telegram(text: string, buttons?: { text: string; url: string }[][]) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chat,
      text,
      disable_web_page_preview: true,
      ...(buttons ? { reply_markup: { inline_keyboard: buttons } } : {}),
    }),
    signal: AbortSignal.timeout(8000),
  }).catch((e) => console.error("telegram", e));
}

// The guest's private room link: request id, approved minutes and expiry, signed.
export type Invite = { id: string; minutes: number; expires: number };

export const INVITE_DAYS = 14;

export function inviteUrl(id: string, minutes: number): { url: string; expires: Date } | null {
  if (!secret()) return null;
  const expires = Date.now() + INVITE_DAYS * 86_400_000;
  const payload = Buffer.from(JSON.stringify({ i: id, m: minutes, e: expires })).toString("base64url");
  const sig = createHmac("sha256", secret()).update(`invite|${payload}`).digest("base64url");
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://gasanbuildsai.vercel.app").replace(/\/$/, "");
  return { url: `${base}/interview/${payload}.${sig}`, expires: new Date(expires) };
}

export function readInvite(token: string): Invite | null {
  if (!secret()) return null;
  const [payload, sig] = decodeURIComponent(token).split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(createHmac("sha256", secret()).update(`invite|${payload}`).digest("base64url"));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data.i !== "string" || typeof data.m !== "number" || typeof data.e !== "number") return null;
    return data.e > Date.now() ? { id: data.i, minutes: data.m, expires: data.e } : null;
  } catch {
    return null;
  }
}

// Gasan's private link to read the saved chats, sent in the nightly report (valid 7 days).
export function adminUrl(days = 7): string | null {
  if (!secret()) return null;
  const expires = Date.now() + days * 86_400_000;
  const sig = createHmac("sha256", secret()).update(`admin|${expires}`).digest("base64url");
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://gasanbuildsai.vercel.app").replace(/\/$/, "");
  return `${base}/admin/conversations?e=${expires}&k=${sig}`;
}

export function verifyAdmin(expires: string | undefined, key: string | undefined): boolean {
  if (!secret() || !expires || !key || Number(expires) < Date.now()) return false;
  const expected = Buffer.from(createHmac("sha256", secret()).update(`admin|${expires}`).digest("base64url"));
  const given = Buffer.from(key);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
