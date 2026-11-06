"use client";

// Jasmin on every page: the chat panel and the guided-tour picture-in-picture.
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { tour } from "@/content/tour";
import { JASMIN } from "@/content/jasmin";
import { runAction, clearHighlight } from "@/lib/stage";
import { scrollToTarget } from "@/components/Motion";
import type { JasminRequest } from "@/lib/jasmin-events";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What has Gasan built?",
  "How does Hermes teach herself new skills?",
  "Which projects are live?",
  "How can I work with Gasan?",
];

function Portrait({ className = "" }: { className?: string }) {
  return (
    <video
      className={`h-full w-full object-cover ${className}`}
      src="/media/jasmin-office.mp4"
      poster="/media/jasmin-office.jpg"
      autoPlay
      muted
      loop
      playsInline
      style={{ objectPosition: "50% 25%" }}
    />
  );
}

export default function JasminDock() {
  const router = useRouter();
  const [mode, setMode] = useState<"closed" | "chat" | "tour">("closed");
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: JASMIN.greeting }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim().slice(0, 1200);
      if (!question || busy) return;
      const history: Message[] = [...messages, { role: "user", content: question }];
      setMessages([...history, { role: "assistant", content: "" }]);
      setInput("");
      setBusy(true);
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history.slice(1).slice(-12) }),
        });
        if (!response.ok || !response.body) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || "I can't answer right now. Please try again in a moment.");
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let answer = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          answer += decoder.decode(value, { stream: true });
          setMessages([...history, { role: "assistant", content: answer }]);
        }
        if (!answer.trim()) throw new Error("I lost my train of thought. Could you ask that again?");
      } catch (error) {
        setMessages([...history, { role: "assistant", content: (error as Error).message }]);
      } finally {
        setBusy(false);
      }
    },
    [busy, messages],
  );

  // Buttons elsewhere on the site open the chat or start the tour.
  useEffect(() => {
    const onRequest = (event: Event) => {
      const detail = (event as CustomEvent<JasminRequest>).detail;
      if (detail.mode === "tour") {
        setStep(0);
        setPaused(false);
        setMode("tour");
      } else {
        setMode("chat");
        if (detail.question) void send(detail.question);
      }
    };
    window.addEventListener("jasmin", onRequest);
    return () => window.removeEventListener("jasmin", onRequest);
  }, [send]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // The tour: run each step's page actions, then wait long enough to read the caption.
  useEffect(() => {
    if (mode !== "tour") return;
    const current = tour[step];
    if (!current) return;
    let cancelled = false;
    (async () => {
      for (const action of current.actions) {
        if (cancelled) return;
        await runAction(action, router, (el) => scrollToTarget(el, -120));
        await new Promise((r) => setTimeout(r, 700));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, step, router]);

  useEffect(() => {
    if (mode !== "tour" || paused) return;
    const ms = Math.max(5500, tour[step].say.length * 62);
    const timer = setTimeout(() => {
      if (step < tour.length - 1) setStep(step + 1);
    }, ms);
    return () => clearTimeout(timer);
  }, [mode, step, paused]);

  const endTour = () => {
    clearHighlight();
    setMode("closed");
  };

  if (mode === "tour") {
    const current = tour[step];
    return (
      <aside
        aria-live="polite"
        className="glass fixed bottom-4 left-4 right-4 z-[70] overflow-hidden rounded-2xl shadow-2xl shadow-black/60 sm:right-auto sm:w-[380px]"
      >
        <div className="relative aspect-video">
          <Portrait />
          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/55 px-2.5 py-1 font-mono text-[0.6rem] tracking-[0.2em]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> GUIDED TOUR
          </div>
          <div className="absolute bottom-3 left-3 text-xs">
            <p className="font-semibold">{JASMIN.name}</p>
            <p className="text-muted">{JASMIN.title}</p>
          </div>
        </div>
        <div className="p-4">
          <p key={step} className="min-h-[4.5rem] text-[0.95rem] leading-relaxed">{current.say}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="font-mono text-[0.65rem] tracking-[0.2em] text-muted">
              {String(step + 1).padStart(2, "0")} / {String(tour.length).padStart(2, "0")}
            </span>
            <div className="flex gap-2 text-xs">
              <button className="btn btn-ghost !px-3 !py-1.5" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Back</button>
              <button className="btn btn-ghost !px-3 !py-1.5" onClick={() => setPaused(!paused)}>{paused ? "Play" : "Pause"}</button>
              {step < tour.length - 1 ? (
                <button className="btn btn-gold !px-3 !py-1.5" onClick={() => setStep(step + 1)}>Next</button>
              ) : (
                <button className="btn btn-gold !px-3 !py-1.5" onClick={endTour}>Done</button>
              )}
            </div>
          </div>
          <button onClick={endTour} className="mt-3 text-[0.7rem] text-muted underline-offset-4 hover:underline">Exit tour</button>
        </div>
      </aside>
    );
  }

  if (mode === "chat") {
    return (
      <aside className="glass fixed inset-x-3 bottom-3 z-[70] flex max-h-[78vh] flex-col overflow-hidden rounded-2xl shadow-2xl shadow-black/60 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[400px]">
        <header className="flex items-center gap-3 border-b border-line p-3">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full ring-1 ring-gold/50"><Portrait /></div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{JASMIN.name}</p>
            <p className="truncate text-xs text-muted">{JASMIN.title} · AI · answers from Gasan&apos;s project files</p>
          </div>
          <button onClick={() => setMode("closed")} className="rounded-full p-2 text-muted hover:text-text" aria-label="Close chat">✕</button>
        </header>
        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4" data-lenis-prevent>
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex"}>
              <p
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[0.92rem] leading-relaxed ${
                  m.role === "user" ? "bg-gold text-ink" : "bg-ink-3 text-text"
                }`}
              >
                {m.content || <span className="inline-flex gap-1"><span className="animate-pulse">•</span><span className="animate-pulse [animation-delay:150ms]">•</span><span className="animate-pulse [animation-delay:300ms]">•</span></span>}
              </p>
            </div>
          ))}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-line px-3 py-1.5 text-xs text-muted transition hover:border-gold hover:text-gold">{s}</button>
              ))}
            </div>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex gap-2 border-t border-line p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about any project…"
            maxLength={1200}
            className="min-w-0 flex-1 rounded-full border border-line bg-ink-2 px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-gold"
          />
          <button disabled={busy || !input.trim()} className="btn btn-gold !px-4 !py-2 disabled:opacity-40">Send</button>
        </form>
      </aside>
    );
  }

  return (
    <button
      onClick={() => setMode("chat")}
      className="glass fixed bottom-5 right-5 z-[70] flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-4 shadow-xl shadow-black/50 transition hover:border-gold/60"
      aria-label="Ask Jasmin, Gasan's AI Chief of Staff"
    >
      <span className="relative h-10 w-10 overflow-hidden rounded-full ring-1 ring-gold/50">
        <Portrait />
      </span>
      <span className="text-left leading-tight">
        <span className="block text-sm font-semibold">Ask Jasmin</span>
        <span className="block text-[0.68rem] text-muted">AI Chief of Staff</span>
      </span>
      <span className="ml-1 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px] shadow-emerald-400" />
    </button>
  );
}
