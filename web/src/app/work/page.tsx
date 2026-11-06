import type { Metadata } from "next";
import ProjectCard from "@/components/ProjectCard";
import JasminButton from "@/components/JasminButton";
import { GROUPS, projects, type Project } from "@/content/projects";

export const metadata: Metadata = { title: "Work", description: "Ten AI products built and shipped by Gasan." };

export default function Work() {
  const groups = Object.entries(GROUPS) as [Project["group"], string][];
  return (
    <main className="mx-auto max-w-7xl px-4 pb-28 pt-36 sm:px-8">
      <p data-reveal className="eyebrow">The work · 2026</p>
      <h1 data-reveal className="display mt-5 max-w-5xl text-6xl sm:text-8xl">
        Ten products, <span className="italic text-gold">each one shipped.</span>
      </h1>
      <p data-reveal className="mt-6 max-w-2xl leading-relaxed text-white/75">
        Every chapter shows the problem, how it works, the hard parts I solved and its real status. Want the short version?
      </p>
      <div data-reveal className="mt-8 flex flex-wrap gap-3">
        <JasminButton request={{ mode: "tour" }} className="btn btn-gold">▶ Let Jasmin present</JasminButton>
        <JasminButton request={{ mode: "chat", question: "Which project should I look at first, and why?" }}>Ask where to start</JasminButton>
      </div>

      {groups.map(([key, label]) => {
        const items = projects.map((p, index) => ({ p, index })).filter(({ p }) => p.group === key);
        return (
          <section key={key} className="mt-24">
            <div data-reveal className="mb-8 flex items-baseline justify-between border-b border-line pb-4">
              <h2 className="display text-4xl">{label}</h2>
              <span className="font-mono text-xs text-muted">{String(items.length).padStart(2, "0")}</span>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {items.map(({ p, index }) => (
                <ProjectCard key={p.slug} project={p} index={index} large={items.length <= 2} />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
