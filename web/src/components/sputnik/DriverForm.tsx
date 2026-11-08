"use client";

import { useState } from "react";

const field =
  "w-full rounded-xl border border-white/12 bg-[#0b1220] px-4 py-3 text-[0.95rem] text-[#eef2f7] outline-none transition placeholder:text-[#6f7a8c] focus:border-[#ff8a2a]";
const label = "mb-1.5 block text-sm font-semibold text-[#c7d0dd]";

export default function DriverForm({ source, groupUrl, whatsapp }: { source: string; groupUrl: string; whatsapp: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setError("");
    const form = new FormData(event.currentTarget);
    const data = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/sputnik/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, source }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || "Something went wrong. Please try again.");
      setState("sent");
    } catch (e) {
      setError((e as Error).message);
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div className="mt-6 rounded-2xl bg-[#ff8a2a]/10 p-5">
        <p className="text-xl font-extrabold">Thanks, we&apos;ve got it. 🚐</p>
        <p className="mt-2 text-sm leading-relaxed text-[#c7d0dd]">
          We&apos;ll call or WhatsApp you within two working days. Meanwhile, join the drivers in our Facebook group for routes,
          updates and news.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href={groupUrl} target="_blank" rel="noopener" className="rounded-full bg-[#ff8a2a] px-5 py-3 font-bold text-[#0b1220]">
            Join the Facebook group
          </a>
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener" className="rounded-full border border-white/20 px-5 py-3 font-semibold">
              WhatsApp us
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="name">Full name</label>
          <input id="name" name="name" required maxLength={120} autoComplete="name" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="phone">Mobile (WhatsApp if you have it)</label>
          <input id="phone" name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="07…" className={field} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="area">Where do you live?</label>
          <input id="area" name="area" maxLength={120} placeholder="Town or postcode, e.g. Ilford, IG1" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="email">Email (optional)</label>
          <input id="email" name="email" type="email" autoComplete="email" className={field} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="vehicle">Vehicle</label>
          <select id="vehicle" name="vehicle" className={field} defaultValue="">
            <option value="" disabled>Choose one</option>
            <option>I have my own van</option>
            <option>I need a van</option>
            <option>I have a car</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="licence">Full UK licence held for</label>
          <select id="licence" name="licence" className={field} defaultValue="">
            <option value="" disabled>Choose one</option>
            <option>Under 1 year</option>
            <option>1 to 2 years</option>
            <option>3 years or more</option>
            <option>No UK licence yet</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="start">When can you start?</label>
          <select id="start" name="start" className={field} defaultValue="">
            <option value="" disabled>Choose one</option>
            <option>Straight away</option>
            <option>Within 2 weeks</option>
            <option>Within a month</option>
            <option>Just looking for now</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="experience">Delivery experience</label>
          <input id="experience" name="experience" maxLength={600} placeholder="e.g. 1 year Amazon, DPD" className={field} />
        </div>
      </div>
      {/* Hidden from people; bots fill it in. */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="flex items-start gap-3 text-sm text-[#c7d0dd]">
        <input type="checkbox" name="rtw" value="yes" required className="mt-0.5 h-5 w-5 accent-[#ff8a2a]" />
        I have the right to work in the UK.
      </label>
      <label className="flex items-start gap-3 text-sm text-[#c7d0dd]">
        <input type="checkbox" name="consent" value="yes" required className="mt-0.5 h-5 w-5 accent-[#ff8a2a]" />
        Sputnik Delivery Ltd may contact me by phone, WhatsApp or email about driving work. I can ask for my details to be
        deleted at any time.
      </label>
      {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
      <button
        disabled={state === "sending"}
        className="mt-1 rounded-full bg-[#ff8a2a] px-6 py-4 text-lg font-extrabold text-[#0b1220] transition disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : "Send my application"}
      </button>
    </form>
  );
}
