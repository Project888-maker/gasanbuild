// The self-improvement pipeline as a loop, with a spark travelling around it.
const STAGES = [
  { title: "Request", text: "“Hermes, learn to do X.”" },
  { title: "Research", text: "Finds candidate approaches and libraries." },
  { title: "Build", text: "A restricted coding agent writes it in an isolated clone." },
  { title: "Grade", text: "Real tests, exit codes and diff-scope rules. No AI opinions." },
  { title: "Deploy", text: "Merge, restart, health check, stability window." },
  { title: "Rollback", text: "Any failure: back to the last good version, automatically." },
];

export default function SkillLoop() {
  const r = 210;
  const cx = 260;
  const cy = 260;
  const points = STAGES.map((_, i) => {
    const a = (Math.PI * 2 * i) / STAGES.length - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
  const circle = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`;
  return (
    <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr]">
      <div className="relative mx-auto aspect-square w-full max-w-[520px]">
        <svg viewBox="0 0 520 520" className="absolute inset-0 h-full w-full" aria-hidden>
          <path d={circle} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="2" />
          <path data-draw d={circle} fill="none" stroke="var(--accent)" strokeWidth="2" />
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="30" fill="#07080b" stroke="var(--accent)" strokeWidth="1.5" />
              <text x={p.x} y={p.y + 4} textAnchor="middle" fontFamily="var(--font-jet)" fontSize="13" fill="var(--accent)">
                {String(i + 1).padStart(2, "0")}
              </text>
            </g>
          ))}
          <circle r="6" fill="#f3d9a8" filter="url(#spark-glow)">
            <animateMotion dur="9s" repeatCount="indefinite" path={circle} />
          </circle>
          <defs>
            <filter id="spark-glow" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="display text-4xl sm:text-5xl">She teaches</p>
          <p className="display text-4xl italic text-gold sm:text-5xl">herself.</p>
        </div>
      </div>
      <ol className="grid gap-5">
        {STAGES.map((s, i) => (
          <li key={s.title} data-reveal className="flex gap-5 border-b border-line pb-5">
            <span className="font-mono text-xs text-gold">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <p className="text-lg font-semibold">{s.title}</p>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
