// How a live video call with Jasmin works, beside her on a "call" screen.
import Film from "@/components/Film";

const FLOW = [
  { who: "You", text: "speak in the browser; audio streams over a WebSocket." },
  { who: "Realtime voice", text: "hears you and answers in her own voice, in real time; you can interrupt her like a person." },
  { who: "LiveKit + avatar", text: "her voice drives a LemonSlice avatar of her photo: lips, face and head in sync." },
  { who: "Vision", text: "with your camera on, she sees you and reacts to what she sees." },
  { who: "Mood engine", text: "if the avatar is unavailable, a fast model picks clips that match the conversation." },
];

export default function CallShowcase() {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
      <div data-reveal className="relative overflow-hidden rounded-[26px] border border-line shadow-2xl shadow-black/60">
        <div className="aspect-video">
          <Film src="/media/jasmin-office.mp4" poster="/media/jasmin-office.jpg" position="50% 30%" alt="Jasmin on a video call" />
        </div>
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 font-mono text-[0.62rem] tracking-[0.2em] backdrop-blur">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> LIVE · 00:42
        </div>
        <div className="absolute bottom-4 right-4 hidden h-24 w-40 overflow-hidden rounded-xl border border-white/20 bg-ink-3 sm:block">
          <div className="flex h-full items-center justify-center font-mono text-[0.6rem] tracking-[0.2em] text-muted">YOUR CAMERA</div>
        </div>
        <div className="absolute bottom-4 left-4 glass max-w-[60%] rounded-xl px-3 py-2 text-xs sm:text-sm">
          “Let me show you how the self-update works…”
        </div>
      </div>
      <ol className="grid gap-4">
        {FLOW.map((f) => (
          <li key={f.who} data-reveal className="rounded-2xl border border-line bg-ink-2 p-5">
            <p className="font-mono text-[0.7rem] tracking-[0.18em] text-gold">{f.who.toUpperCase()}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/80">{f.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
