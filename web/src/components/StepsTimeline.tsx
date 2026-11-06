// "How it works" as a timeline whose line draws itself as you scroll.
export default function StepsTimeline({ steps }: { steps: { title: string; text: string }[] }) {
  return (
    <div className="relative">
      <svg className="absolute left-[19px] top-2 hidden h-[calc(100%-1rem)] w-1 sm:block" preserveAspectRatio="none" viewBox="0 0 2 100" aria-hidden>
        <path d="M1 0 V100" stroke="rgb(255 255 255 / 0.1)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <path data-draw d="M1 0 V100" stroke="var(--accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <ol className="grid gap-10">
        {steps.map((step, i) => (
          <li key={step.title} data-reveal className="relative grid gap-3 sm:grid-cols-[40px_1fr] sm:gap-8">
            <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--accent)] bg-ink font-mono text-xs text-[var(--accent)]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="max-w-2xl">
              <h3 className="display text-3xl sm:text-4xl">{step.title}</h3>
              <p className="mt-3 leading-relaxed text-white/75">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
