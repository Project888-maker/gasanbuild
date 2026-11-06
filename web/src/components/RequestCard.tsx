"use client";

// The card Jasmin prepares in chat: a private call with Gasan, or a live interview with her.
// The visitor checks the details and sends it themselves; nothing goes out without their tap.
import { useState } from "react";

export type Prepared = {
  kind: "call" | "interview";
  name?: string;
  email?: string;
  company?: string;
  role?: string;
  topic?: string;
  when?: string;
  note?: string;
};

const input = "w-full rounded-lg border border-line bg-ink px-3 py-2 text-[0.85rem] outline-none focus:border-gold";

export default function RequestCard({ prepared }: { prepared: Prepared }) {
  const [form, setForm] = useState({
    name: prepared.name || "",
    email: prepared.email || "",
    company: prepared.company || "",
    role: prepared.role || "",
    topics: prepared.topic || "",
    preferred: prepared.when || "",
  });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const call = prepared.kind === "call";

  async function send() {
    setState("sending");
    try {
      const r = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, kind: prepared.kind, note: prepared.note || "", source: "chat" }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.message || "That didn't go through. Please try again.");
      setState("sent");
    } catch (e) {
      setError((e as Error).message);
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-2xl border border-gold/40 bg-ink-2 p-4 text-sm">
        <p className="font-semibold text-gold">Sent to Gasan ✓</p>
        <p className="mt-1 text-white/75">{call ? "He'll reply to you personally to arrange the call." : "He'll review it and you'll get your private link by email."}</p>
      </div>
    );
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="rounded-2xl border border-gold/40 bg-ink-2 p-4">
      <p className="font-mono text-[0.65rem] tracking-[0.2em] text-gold">{call ? "PRIVATE CALL WITH GASAN" : "LIVE INTERVIEW WITH JASMIN"}</p>
      <div className="mt-3 grid gap-2">
        <input className={input} value={form.name} onChange={set("name")} placeholder="Name" maxLength={120} />
        <input className={input} value={form.email} onChange={set("email")} placeholder="Email" type="email" maxLength={200} />
        <div className="grid grid-cols-2 gap-2">
          <input className={input} value={form.company} onChange={set("company")} placeholder="Company" maxLength={160} />
          <input className={input} value={form.role} onChange={set("role")} placeholder="Role" maxLength={120} />
        </div>
        <input className={input} value={form.topics} onChange={set("topics")} placeholder="What you'd like to discuss" maxLength={1500} />
        <input className={input} value={form.preferred} onChange={set("preferred")} placeholder="Preferred times (time zone)" maxLength={200} />
      </div>
      <button onClick={send} disabled={state === "sending" || !form.name || !form.email} className="btn btn-gold mt-3 w-full justify-center !py-2 text-sm disabled:opacity-40">
        {state === "sending" ? "Sending…" : "Send to Gasan"}
      </button>
      {state === "error" && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}
