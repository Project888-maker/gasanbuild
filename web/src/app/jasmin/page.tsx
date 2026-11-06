import type { Metadata } from "next";
import Film from "@/components/Film";
import JasminButton from "@/components/JasminButton";
import InterviewForm from "@/components/InterviewForm";
import { JASMIN } from "@/content/jasmin";

export const metadata: Metadata = {
  title: "Meet Jasmin",
  description: "Jasmin, Gasan's AI Chief of Staff: chat with her, take her guided tour, or request a live video interview.",
};

const STEPS = [
  { title: "Request", text: "Tell us who you are and what you'd like to discuss." },
  { title: "Approval", text: "Gasan reviews it personally and chooses the length of the call." },
  { title: "Private link", text: "You get a one-time link by email, valid for your time window." },
  { title: "Live interview", text: "Jasmin talks with you on video and brings each project up on screen as she explains it." },
  { title: "Follow-up", text: "Gasan gets a summary of the call and follows up with you himself." },
];

export default function JasminPage() {
  return (
    <main>
      <section className="relative overflow-hidden pt-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-24 sm:px-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="eyebrow animate-[fadeUp_1.2s_var(--ease-film)_0.1s_both]">{JASMIN.title}</p>
            <h1 className="display mt-5 animate-[fadeUp_1.4s_var(--ease-film)_0.25s_both] text-7xl sm:text-9xl">Jasmin</h1>
            <p className="mt-6 max-w-lg animate-[fadeUp_1.4s_var(--ease-film)_0.4s_both] text-lg leading-relaxed text-white/80">
              I&apos;m an AI agent Gasan built to represent his work. I know every project, how it works and what it took to
              build. I&apos;m honest about what is live and what is still in testing, and I never make commitments on his behalf.
            </p>
            <div className="mt-8 flex animate-[fadeUp_1.4s_var(--ease-film)_0.55s_both] flex-wrap gap-3">
              <JasminButton request={{ mode: "chat" }} className="btn btn-gold">Chat with me now</JasminButton>
              <JasminButton request={{ mode: "tour" }}>▶ Guided tour</JasminButton>
            </div>
          </div>
          <div className="relative animate-[fadeUp_1.6s_var(--ease-film)_0.3s_both] overflow-hidden rounded-[28px] border border-line shadow-2xl shadow-black/60">
            <div className="aspect-[4/3] sm:aspect-video">
              <Film src="/media/jasmin-office.mp4" poster="/media/jasmin-office.jpg" position="50% 30%" alt="Jasmin at her desk" />
            </div>
          </div>
        </div>
      </section>

      <section id="interview" className="border-t border-line py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p data-reveal className="eyebrow">Live video interview</p>
            <h2 data-reveal className="display mt-4 text-5xl sm:text-6xl">Interview me <span className="italic text-gold">instead of him.</span></h2>
            <p data-reveal className="mt-6 max-w-md leading-relaxed text-white/75">
              Ask me anything about Gasan&apos;s projects and how he builds. While we talk, I can open any project, play its demo
              and walk you through it.
            </p>
            <ol className="mt-10 grid gap-4">
              {STEPS.map((s, i) => (
                <li key={s.title} data-reveal className="flex gap-4">
                  <span className="font-mono text-xs text-gold">{String(i + 1).padStart(2, "0")}</span>
                  <p className="text-sm"><span className="font-semibold">{s.title}.</span> <span className="text-muted">{s.text}</span></p>
                </li>
              ))}
            </ol>
          </div>
          <div data-reveal>
            <InterviewForm />
          </div>
        </div>
      </section>
    </main>
  );
}
