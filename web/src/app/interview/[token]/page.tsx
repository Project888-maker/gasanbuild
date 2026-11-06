// A guest's private interview room, opened from their approval email.
// Live video with Jasmin plugs in here; until then the room offers her chat and tour.

import type { Metadata } from "next";
import Link from "next/link";
import GreetingPlayer from "@/components/GreetingPlayer";
import JasminButton from "@/components/JasminButton";
import { readInvite } from "@/lib/decisions";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your interview room", robots: { index: false, follow: false } };

export default async function Room({ params }: { params: Promise<{ token: string }> }) {
  const invite = readInvite((await params).token);
  const rows = invite && sql
    ? await sql`select name, company, status, minutes from interview_requests where id = ${invite.id}`
    : [];
  const guest = rows[0];

  if (!invite || !guest || guest.status !== "approved") {
    return (
      <main className="mx-auto flex min-h-[80svh] max-w-xl flex-col items-center justify-center px-4 pt-24 text-center">
        <p className="eyebrow">Interview room</p>
        <h1 className="display mt-4 text-5xl">This link isn&apos;t active.</h1>
        <p className="mt-5 text-white/75">It may have expired or been replaced. You can request a new interview, and Gasan will review it personally.</p>
        <Link href="/jasmin#interview" className="btn btn-gold mt-8">Request an interview</Link>
      </main>
    );
  }

  const first = String(guest.name).split(" ")[0];
  const until = new Date(invite.expires).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-32 sm:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        <div className="overflow-hidden rounded-[28px] border border-line shadow-2xl shadow-black/60">
          <GreetingPlayer />
        </div>
        <div>
          <p className="eyebrow">Private interview room · {invite.minutes} minutes</p>
          <h1 className="display mt-5 text-5xl sm:text-7xl">Welcome, <span className="italic text-gold">{first}.</span></h1>
          <p className="mt-6 max-w-lg leading-relaxed text-white/80">
            Gasan approved your {invite.minutes}-minute live video interview with me. This room is yours alone until {until}.
          </p>
          <div className="mt-6 rounded-2xl border border-gold/30 bg-ink-2 p-5">
            <p className="flex items-center gap-2 font-mono text-[0.7rem] tracking-[0.2em] text-gold">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" /> WHAT HAPPENS NEXT
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/75">
              The live video call isn&apos;t open yet. Gasan will email you personally to confirm a time and how you&apos;ll
              join. Until then, ask me anything here in chat or take my guided tour.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <JasminButton request={{ mode: "chat", question: `Hi Jasmin, I'm ${first}. What should I know about Gasan before our interview?` }} className="btn btn-gold">
              Chat with me now
            </JasminButton>
            <JasminButton request={{ mode: "tour" }}>▶ Guided tour</JasminButton>
            <Link href="/work" className="btn btn-ghost">Explore the projects</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
