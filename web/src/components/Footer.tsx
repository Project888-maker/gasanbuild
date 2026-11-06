import Link from "next/link";
import { projects } from "@/content/projects";

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="display text-4xl">Gasan builds AI.</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Autonomous agents, real-time voice and video, platforms and games. Presented by Jasmin, AI Chief of Staff.
          </p>
        </div>
        <div>
          <p className="eyebrow mb-4">Work</p>
          <ul className="grid gap-2 text-sm">
            {projects.map((p) => (
              <li key={p.slug}>
                <Link href={`/work/${p.slug}`} className="text-muted transition hover:text-text">{p.title}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4">Talk</p>
          <ul className="grid gap-2 text-sm">
            <li><Link href="/jasmin" className="text-muted transition hover:text-text">Ask Jasmin</Link></li>
            <li><Link href="/jasmin#interview" className="text-muted transition hover:text-text">Request a live interview</Link></li>
          </ul>
        </div>
      </div>
      <p className="pb-10 text-center font-mono text-[0.68rem] tracking-[0.2em] text-muted/70">
        © {new Date().getFullYear()} GASAN · BUILT WITH AI, VERIFIED BY HAND
      </p>
    </footer>
  );
}
