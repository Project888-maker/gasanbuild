// Gasan's private view of the saved chats (last 30 days), opened from the
// signed link in the nightly Telegram report.

import type { Metadata } from "next";
import { sql } from "@/lib/db";
import { verifyAdmin } from "@/lib/decisions";
import type { Review, Turn } from "@/lib/review";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Conversations", robots: { index: false, follow: false } };

const clean = (s: string) => s.replace(/\[\[[\s\S]*?\]\]/g, "").trim();
const actions = (s: string) => [...s.matchAll(/\[\[([a-z_]+)/g)].map((m) => (m[1] === "request" ? "request card" : m[1] === "end" ? "chat closed" : m[1]));

export default async function Conversations({ searchParams }: { searchParams: Promise<{ e?: string; k?: string }> }) {
  const { e, k } = await searchParams;
  if (!verifyAdmin(e, k) || !sql) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-24 pt-40 text-center">
        <h1 className="display text-5xl">Link expired.</h1>
        <p className="mt-4 text-white/70">Open the newest link from Jasmin&apos;s nightly report in Telegram.</p>
      </main>
    );
  }
  const rows = await sql`
    select id, started_at, updated_at, page, messages, turns, cost, request, ended, review
    from chat_conversations order by updated_at desc limit 200`;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-32 sm:px-8">
      <p className="eyebrow">Private · last 30 days</p>
      <h1 className="display mt-3 text-5xl sm:text-6xl">Jasmin&apos;s conversations</h1>
      <p className="mt-4 text-sm text-muted">{rows.length} saved. Reviews are added each night. Visitors are anonymous unless they gave their details.</p>
      <div className="mt-12 grid gap-6">
        {rows.map((row) => {
          const r = row.review as Review | null;
          const turns = (row.messages as Turn[]) || [];
          return (
            <details key={String(row.id)} className="group rounded-2xl border border-line bg-ink-2 p-5 open:border-gold/40">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="font-semibold">{r?.who || clean(turns[0]?.content || "").slice(0, 80) || "Conversation"}</p>
                  <p className="font-mono text-[0.68rem] tracking-[0.15em] text-muted">
                    {new Date(row.updated_at as string).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    {" · "}{row.turns} replies · ${Number(row.cost).toFixed(3)}{row.page ? ` · ${row.page}` : ""}
                  </p>
                </div>
                {r && (
                  <div className="mt-2 text-sm text-white/75">
                    <p>{r.summary}</p>
                    {r.follow_up && <p className="mt-1 text-gold">→ {r.follow_up}</p>}
                    <p className="mt-2 font-mono text-[0.68rem] tracking-[0.12em] text-muted">
                      {r.intent?.toUpperCase()}{r.serious ? " · SERIOUS" : ""}{row.request ? " · REQUEST SENT" : ""}{row.ended ? " · CLOSED BY JASMIN" : ""}
                      {" · "}human {r.scores?.human} · accuracy {r.scores?.accuracy} · boundaries {r.scores?.boundaries} · next step {r.scores?.goal}
                    </p>
                  </div>
                )}
                {!r && <p className="mt-2 font-mono text-[0.68rem] tracking-[0.12em] text-muted">NOT REVIEWED YET</p>}
              </summary>
              <div className="mt-5 space-y-3 border-t border-line pt-5">
                {turns.map((t, i) => (
                  <div key={i} className={t.role === "user" ? "flex justify-end" : "flex"}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[0.9rem] leading-relaxed ${t.role === "user" ? "bg-gold/90 text-ink" : "bg-ink-3"}`}>
                      <p className="whitespace-pre-wrap">{clean(t.content)}</p>
                      {actions(t.content).length > 0 && (
                        <p className="mt-1 font-mono text-[0.62rem] tracking-[0.15em] opacity-70">[{actions(t.content).join(", ")}]</p>
                      )}
                    </div>
                  </div>
                ))}
                {r?.issues?.length ? (
                  <div className="rounded-xl border border-line p-3 text-sm text-white/70">
                    <p className="eyebrow mb-1">To improve</p>
                    {r.issues.map((x, i) => <p key={i}>• {x}</p>)}
                  </div>
                ) : null}
              </div>
            </details>
          );
        })}
      </div>
    </main>
  );
}
