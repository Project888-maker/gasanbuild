import Link from "next/link";
import { STATUS_LABEL, type Project } from "@/content/projects";

export default function ProjectCard({ project, index, large = false }: { project: Project; index: number; large?: boolean }) {
  return (
    <Link
      href={`/work/${project.slug}`}
      data-reveal
      className="group relative block overflow-hidden rounded-3xl border border-line bg-ink-2"
      style={{ ["--accent" as string]: project.accent }}
    >
      <div className={`relative overflow-hidden ${large ? "aspect-[4/3] sm:aspect-[16/9]" : "aspect-[3/4]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.poster}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-[1.6s] ease-[var(--ease-film)] group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
        <span className="absolute left-5 top-5 font-mono text-[0.68rem] tracking-[0.25em] text-white/70">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="absolute right-5 top-5 rounded-full bg-black/50 px-3 py-1 font-mono text-[0.6rem] tracking-[0.18em] text-white/85 backdrop-blur">
          {STATUS_LABEL[project.status].split(" · ")[0].toUpperCase()}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-6">
        <p className="eyebrow !text-[var(--accent)]">{project.kicker}</p>
        <h3 className={`display mt-2 ${large ? "text-5xl sm:text-6xl" : "text-[2.1rem] leading-none"}`}>{project.title}</h3>
        <p className={`mt-2 max-w-xl text-sm leading-relaxed text-white/75 ${large ? "" : "line-clamp-3"}`}>{project.tagline}</p>
        <span className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--accent)] opacity-0 transition duration-500 group-hover:opacity-100">
          Open the chapter <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}
