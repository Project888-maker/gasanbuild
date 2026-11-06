// Hermes at the centre, the channels and tools she works through orbiting her.
const INNER = ["Telegram", "Phone calls", "Video calls"];
const OUTER = [
  "Gmail", "Calendar", "Web search", "Website factory", "Images", "Video",
  "Social posts", "Business CRM", "Reminders", "Voice-overs", "Research", "Self-update",
];

function Ring({ items, radius, seconds, reverse = false }: { items: string[]; radius: number; seconds: number; reverse?: boolean }) {
  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{ width: 0, height: 0, animation: `${reverse ? "counter-orbit" : "orbit"} ${seconds}s linear infinite` }}
    >
      {items.map((label, i) => {
        const angle = (360 / items.length) * i;
        return (
          <div
            key={label}
            className="absolute left-0 top-0"
            style={{ transform: `rotate(${angle}deg) translate(${radius}px) rotate(${-angle}deg)` }}
          >
            <div style={{ animation: `${reverse ? "orbit" : "counter-orbit"} ${seconds}s linear infinite` }}>
              <span className="block -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-gold/30 bg-ink/80 px-3 py-1.5 font-mono text-[0.62rem] tracking-[0.12em] text-gold-soft backdrop-blur sm:text-[0.7rem]">
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ToolOrbit() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[640px] overflow-hidden" aria-label="Hermes and the tools she uses">
      <div className="absolute inset-[18%] rounded-full border border-dashed border-gold/20" />
      <div className="absolute inset-[4%] rounded-full border border-dashed border-gold/10" />
      <div className="absolute inset-0 origin-center scale-[0.56] sm:scale-[0.9] lg:scale-100">
        <div
          className="absolute left-1/2 top-1/2 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff3d6,#e8b86b_45%,#8a5a1c)]"
          style={{ animation: "pulse-core 4s ease-in-out infinite" }}
        >
          <span className="display text-3xl text-ink">Hermes</span>
        </div>
        <Ring items={INNER} radius={150} seconds={46} />
        <Ring items={OUTER} radius={252} seconds={90} reverse />
      </div>
    </div>
  );
}
