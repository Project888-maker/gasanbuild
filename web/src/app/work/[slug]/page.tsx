import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Film from "@/components/Film";
import Counter from "@/components/Counter";
import JasminButton from "@/components/JasminButton";
import StepsTimeline from "@/components/StepsTimeline";
import PlayEmbed from "@/components/PlayEmbed";
import ToolOrbit from "@/components/hermes/ToolOrbit";
import SkillLoop from "@/components/hermes/SkillLoop";
import CallShowcase from "@/components/hermes/CallShowcase";
import { bySlug, projects, STATUS_LABEL } from "@/content/projects";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const project = bySlug((await params).slug);
  if (!project) return {};
  return { title: project.title, description: project.tagline, openGraph: { images: [project.poster] } };
}

function SectionHead({ index, eyebrow, title }: { index: string; eyebrow: string; title: React.ReactNode }) {
  return (
    <div className="mb-14">
      <p data-reveal className="eyebrow"><span className="text-[var(--accent)]">{index}</span> · {eyebrow}</p>
      <h2 data-reveal className="display mt-4 max-w-4xl text-5xl sm:text-6xl">{title}</h2>
    </div>
  );
}

export default async function Chapter({ params }: { params: Promise<{ slug: string }> }) {
  const project = bySlug((await params).slug);
  if (!project) notFound();
  const index = projects.indexOf(project);
  const next = projects[(index + 1) % projects.length];
  const isHermes = project.slug === "hermes";
  const play = project.slug === "neonrun" ? project.links[0]?.href : undefined;
  let n = 0;
  const num = () => String(++n).padStart(2, "0");

  return (
    <main style={{ ["--accent" as string]: project.accent }}>
      {/* Title */}
      <section id="intro" className="relative flex min-h-[92svh] items-end overflow-hidden">
        <div className="absolute inset-0" data-parallax="10">
          <Film src={project.film} poster={project.poster} alt={project.title} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/5" />
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-40 sm:px-8 sm:pb-24">
          <p className="eyebrow animate-[fadeUp_1.2s_var(--ease-film)_0.1s_both]">
            <span className="text-[var(--accent)]">{String(index + 1).padStart(2, "0")}</span> · {project.kicker}
          </p>
          <h1 className="display mt-5 animate-[fadeUp_1.4s_var(--ease-film)_0.25s_both] text-[clamp(3.6rem,11vw,10rem)]">{project.title}</h1>
          <p className="mt-6 max-w-2xl animate-[fadeUp_1.4s_var(--ease-film)_0.4s_both] text-xl leading-relaxed text-white/85">{project.tagline}</p>
          <div className="mt-8 flex animate-[fadeUp_1.4s_var(--ease-film)_0.55s_both] flex-wrap items-center gap-3">
            <span className="rounded-full border border-[var(--accent)]/60 px-3 py-1.5 font-mono text-[0.65rem] tracking-[0.18em] text-[var(--accent)]">
              {STATUS_LABEL[project.status].toUpperCase()}
            </span>
            {project.links.map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="btn btn-gold !py-2.5">{l.label} ↗</a>
            ))}
            <JasminButton request={{ mode: "chat", question: `Tell me about ${project.title}.` }} className="btn btn-ghost !py-2.5">
              Ask Jasmin about {project.title}
            </JasminButton>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="mx-auto max-w-7xl px-4 py-28 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p data-reveal className="eyebrow"><span className="text-[var(--accent)]">{num()}</span> · The problem</p>
            <p data-reveal className="display mt-6 text-4xl leading-[1.08] sm:text-5xl">{project.problem}</p>
          </div>
          <div className="lg:pt-14">
            <p data-reveal className="text-lg leading-relaxed text-white/80">{project.summary}</p>
            <p data-reveal className="mt-6 border-l-2 border-[var(--accent)] pl-4 text-sm text-muted">{project.statusNote}</p>
          </div>
        </div>
      </section>

      {isHermes && (
        <section id="doors" className="border-t border-line py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <SectionHead index={num()} eyebrow="One brain, many doors" title={<>Sixty tools. <span className="italic text-[var(--accent)]">One operator.</span></>} />
            <ToolOrbit />
          </div>
        </section>
      )}

      {/* How it works */}
      <section id="how" className="border-t border-line py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <SectionHead index={num()} eyebrow="How it works" title={<>From input <span className="italic text-[var(--accent)]">to outcome.</span></>} />
          <StepsTimeline steps={project.steps} />
        </div>
      </section>

      {isHermes && (
        <>
          <section id="loop" className="border-t border-line py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-8">
              <SectionHead index={num()} eyebrow="Self-improvement pipeline" title={<>New skills, <span className="italic text-[var(--accent)]">built and tested by her.</span></>} />
              <SkillLoop />
            </div>
          </section>
          <section id="call" className="border-t border-line py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-8">
              <SectionHead index={num()} eyebrow="Jasmin · live video" title={<>A face, a voice, <span className="italic text-[var(--accent)]">in real time.</span></>} />
              <CallShowcase />
            </div>
          </section>
        </>
      )}

      {/* See it */}
      {(play || project.gallery) && (
        <section id="see" className="border-t border-line py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <SectionHead index={num()} eyebrow="See it" title={play ? <>Don&apos;t watch it. <span className="italic text-[var(--accent)]">Play it.</span></> : <>Inside <span className="italic text-[var(--accent)]">the build.</span></>} />
            {play && <PlayEmbed src={play} poster={project.poster} title={project.title} />}
            {project.gallery && (
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {project.gallery.map((g) => (
                  <figure key={g.src} data-reveal className="overflow-hidden rounded-2xl border border-line bg-ink-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.src} alt={g.caption} loading="lazy" className="aspect-video w-full object-cover" />
                    <figcaption className="p-4 text-sm text-muted">{g.caption}</figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Numbers */}
      <section id="numbers" className="border-y border-line bg-ink-2/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-10 px-4 py-16 sm:px-8 md:grid-cols-4">
          {project.stats.map((s) => (
            <div key={s.label} data-reveal className="px-2">
              <p className="display text-4xl text-[var(--accent)] sm:text-5xl"><Counter value={s.value} /></p>
              <p className="mt-2 text-sm text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Hard problems */}
      <section id="hard" className="py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <SectionHead index={num()} eyebrow="Hard problems solved" title={<>The parts <span className="italic text-[var(--accent)]">that were not easy.</span></>} />
          <div className="grid gap-6 md:grid-cols-2">
            {project.hardProblems.map((h) => (
              <article key={h.title} data-reveal className="rounded-3xl border border-line bg-ink-2 p-8 transition hover:border-[var(--accent)]/50">
                <h3 className="display text-3xl">{h.title}</h3>
                <p className="mt-4 leading-relaxed text-white/75">{h.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Stack */}
      <section id="stack" className="border-t border-line py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <p data-reveal className="eyebrow mb-6">Under the hood</p>
          <ul data-reveal className="flex flex-wrap gap-2">
            {project.stack.map((s) => (
              <li key={s} className="rounded-full border border-line px-4 py-2 font-mono text-xs text-white/80">{s}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Next */}
      <Link href={`/work/${next.slug}`} className="group relative block overflow-hidden border-t border-line" style={{ ["--accent" as string]: next.accent }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={next.poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30 transition duration-[1.6s] group-hover:scale-105 group-hover:opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-8">
          <p className="eyebrow">Next chapter</p>
          <p className="display mt-4 text-6xl transition group-hover:text-[var(--accent)] sm:text-8xl">{next.title} →</p>
          <p className="mt-3 text-white/70">{next.tagline}</p>
        </div>
      </Link>
    </main>
  );
}
