"use client";

import { useState } from "react";

const field = "w-full rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-gold";

export default function InterviewForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || "Something went wrong. Please try again.");
      setState("sent");
    } catch (e) {
      setError((e as Error).message);
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-3xl border border-gold/40 bg-ink-2 p-10 text-center">
        <p className="display text-4xl">Request received.</p>
        <p className="mx-auto mt-4 max-w-md text-white/75">
          Gasan reviews every request personally. Once he approves it, you&apos;ll get a private link by email for your live
          video interview with Jasmin.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-3xl border border-line bg-ink-2/60 p-6 sm:grid-cols-2 sm:p-8">
      <label className="grid gap-2 text-sm">Your name *<input name="name" required maxLength={120} className={field} placeholder="Anna Smith" /></label>
      <label className="grid gap-2 text-sm">Email *<input name="email" type="email" required maxLength={200} className={field} placeholder="anna@company.com" /></label>
      <label className="grid gap-2 text-sm">Company<input name="company" maxLength={160} className={field} placeholder="Acme Capital" /></label>
      <label className="grid gap-2 text-sm">Your role<input name="role" maxLength={120} className={field} placeholder="Partner, CTO, founder…" /></label>
      <label className="grid gap-2 text-sm sm:col-span-2">
        What would you like to discuss? *
        <textarea name="topics" required minLength={10} maxLength={1500} rows={4} className={field} placeholder="Which projects interest you, and what you might want to build together." />
      </label>
      <label className="grid gap-2 text-sm sm:col-span-2">Preferred time (with time zone)<input name="preferred" maxLength={200} className={field} placeholder="Weekdays after 2pm GMT" /></label>
      {/* Hidden from people; bots fill it in. */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button disabled={state === "sending"} className="btn btn-gold disabled:opacity-50">
          {state === "sending" ? "Sending…" : "Request a live interview"}
        </button>
        <p className="text-xs text-muted">Reviewed personally. Your details are only used to arrange the call.</p>
      </div>
      {state === "error" && <p className="text-sm text-red-300 sm:col-span-2">{error}</p>}
    </form>
  );
}
