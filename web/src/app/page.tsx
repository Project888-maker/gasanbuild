import Link from "next/link";
import Film from "@/components/Film";
import JasminButton from "@/components/JasminButton";
import ProjectCard from "@/components/ProjectCard";
import Counter from "@/components/Counter";
import StoryReel from "@/components/StoryReel";
import GreetingPlayer from "@/components/GreetingPlayer";
import { projects } from "@/content/projects";
import { JASMIN } from "@/content/jasmin";

const NUMBERS = [
  { value: "10", label: "products built this year" },
  { value: "3", label: "live AI voices: phone, video, IDE" },
  { value: "1400+", label: "automated tests across projects" },
  { value: "60+", label: "tools in one operator agent" },
];

const METHOD = [
  {
    title: "Direct a team of AI engineers",
    text: "Claude, Codex and Gemini work as a team with written briefs, handoff documents and a single source of truth per project. I set the architecture and the standard.",
  },
  {
    title: "Prove it, don't claim it",
    text: "Automated tests, CI on every push, browser checks on real screen sizes, and production logs. A feature is done when it is verified live, not when it compiles.",
  },
  {
    title: "Build for real operations",
    text: "Every project serves real people: patients and clinics, dispatchers and drivers, families, players. Safety gates and human approval where money or messages are involved.",
  },
];

export default function Home() {
  const [first, second, ...rest] = projects;
  return (
    <main>
      {/* Opening */}
      <section id="intro" className="relative flex min-h-[100svh] items-end overflow-hidden">
        <div className="absolute inset-0">
          <Film src="/media/opening.mp4" poster="/media/opening.jpg" alt="A city skyline at dusk, seen from the top of a skyscraper" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-transparent to-transparent" />
        </div>
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-20 pt-40 sm:px-8 sm:pb-28">
          <p className="eyebrow animate-[fadeUp_1.2s_var(--ease-film)_0.2s_both]">Portfolio · AI builder · London</p>
          <h1 className="display mt-6 max-w-5xl text-[clamp(3.4rem,10vw,9.5rem)]">
            <span className="block animate-[fadeUp_1.4s_var(--ease-film)_0.35s_both]">I build AI</span>
            <span className="block animate-[fadeUp_1.4s_var(--ease-film)_0.5s_both] italic text-gold">that does the work.</span>
          </h1>
          <p className="mt-8 max-w-xl animate-[fadeUp_1.4s_var(--ease-film)_0.7s_both] text-lg leading-relaxed text-white/80">
            Autonomous agents, real-time voice and video, platforms and games. Ten products, designed and shipped
            end to end. Presented by Jasmin, my AI Chief of Staff.
          </p>
          <div className="mt-10 flex animate-[fadeUp_1.4s_var(--ease-film)_0.85s_both] flex-wrap gap-3">
            <JasminButton request={{ mode: "tour" }} className="btn btn-gold">▶ Take the guided tour</JasminButton>
            <Link href="/work" className="btn btn-ghost">Explore the work</Link>
          </div>
        </div>
      </section>

      {/* Jasmin */}
      <section id="jasmin" className="relative mx-auto max-w-7xl px-4 py-28 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div data-reveal className="relative overflow-hidden rounded-[28px] border border-line shadow-2xl shadow-black/60">
            <GreetingPlayer />
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 font-mono text-[0.62rem] tracking-[0.2em] backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> ONLINE
            </div>
            <div className="glass hidden rounded-2xl p-4 sm:absolute sm:inset-x-6 sm:bottom-6 sm:block">
              <p className="text-[0.95rem] leading-relaxed">“{JASMIN.greeting}”</p>
            </div>
            <p className="border-t border-line bg-ink-2 p-4 text-[0.92rem] leading-relaxed sm:hidden">“{JASMIN.greeting}”</p>
          </div>
          <div>
            <p data-reveal className="eyebrow">Meet {JASMIN.name} · {JASMIN.title}</p>
            <h2 data-reveal className="display mt-5 text-5xl sm:text-7xl">
              Don&apos;t read about my work. <span className="italic text-gold">Interview it.</span>
            </h2>
            <p data-reveal className="mt-6 max-w-lg leading-relaxed text-white/75">
              Jasmin is an AI agent I built. She knows every project in detail and can present them for me. Chat with her
              here, follow her guided tour, or request a live video interview: she talks with real-time lip-sync and
              brings each project up on screen while she explains it.
            </p>
            <div data-reveal className="mt-8 flex flex-wrap gap-3">
              <JasminButton request={{ mode: "chat" }} className="btn btn-gold">Ask Jasmin anything</JasminButton>
              <JasminButton request={{ mode: "tour" }}>Guided tour</JasminButton>
              <Link href="/jasmin#interview" className="btn btn-ghost">Request a live interview</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="border-y border-line bg-ink-2/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-10 px-4 py-16 sm:px-8 md:grid-cols-4">
          {NUMBERS.map((n) => (
            <div key={n.label} data-reveal className="px-2">
              <p className="display text-5xl text-gold sm:text-6xl"><Counter value={n.value} /></p>
              <p className="mt-2 text-sm text-muted">{n.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Work */}
      <section className="mx-auto max-w-7xl px-4 py-28 sm:px-8">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p data-reveal className="eyebrow">Selected work · 2026</p>
            <h2 data-reveal className="display mt-4 text-5xl sm:text-7xl">Ten projects. <span className="italic text-muted">One builder.</span></h2>
          </div>
          <Link data-reveal href="/work" className="btn btn-ghost">All projects →</Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ProjectCard project={first} index={0} large />
          <ProjectCard project={second} index={1} large />
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {rest.map((p, i) => (
            <ProjectCard key={p.slug} project={p} index={i + 2} />
          ))}
        </div>
      </section>

      <StoryReel />

      {/* How I build */}
      <section id="how" className="relative overflow-hidden border-t border-line">
        <div className="mx-auto max-w-7xl px-4 py-28 sm:px-8">
          <p data-reveal className="eyebrow">How I build</p>
          <h2 data-reveal className="display mt-4 max-w-4xl text-5xl sm:text-7xl">
            One person, <span className="italic text-gold">a whole studio</span> of AI engineers.
          </h2>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {METHOD.map((m, i) => (
              <div key={m.title} data-reveal className="rounded-3xl border border-line bg-ink-2 p-8">
                <p className="font-mono text-xs text-gold">0{i + 1}</p>
                <h3 className="display mt-6 text-3xl">{m.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted">{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="relative overflow-hidden border-t border-line">
        <div className="absolute inset-0 opacity-40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/opening.jpg" alt="" className="h-full w-full object-cover" data-parallax="16" />
          <div className="absolute inset-0 bg-ink/70" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-36 text-center sm:px-8">
          <h2 data-reveal className="display text-5xl sm:text-7xl">Have something to build?</h2>
          <p data-reveal className="mx-auto mt-6 max-w-xl text-white/75">
            Request a live interview with Jasmin. I review every request myself, and she&apos;ll walk you through anything you want to see.
          </p>
          <div data-reveal className="mt-10 flex justify-center gap-3">
            <Link href="/jasmin#interview" className="btn btn-gold">Request a live interview</Link>
            <JasminButton request={{ mode: "chat" }}>Ask Jasmin</JasminButton>
          </div>
        </div>
      </section>
    </main>
  );
}
