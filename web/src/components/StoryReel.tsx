"use client";

// The creator story: on wide screens the section pins and the chapters slide
// past horizontally as you scroll; on phones they simply stack.
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { chapters, WHY } from "@/content/story";

gsap.registerPlugin(ScrollTrigger);

export default function StoryReel() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !section.current || !track.current) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      const el = track.current!;
      const distance = () => el.scrollWidth - window.innerWidth + 64;
      const tween = gsap.to(el, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
      return () => tween.scrollTrigger?.kill();
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={section} id="story" className="relative overflow-hidden border-t border-line bg-ink lg:h-screen">
      <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-8 lg:absolute lg:inset-x-0 lg:top-0 lg:pt-24">
        <p className="eyebrow">The story · Why I build</p>
        <h2 className="display mt-4 max-w-3xl text-5xl sm:text-6xl">
          Champion, speaker, fleet owner. <span className="italic text-gold">Then builder.</span>
        </h2>
      </div>
      <div
        ref={track}
        className="mt-10 grid gap-6 px-4 pb-24 sm:px-8 lg:absolute lg:bottom-[8vh] lg:mt-0 lg:flex lg:gap-8 lg:pb-0 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))]"
      >
        {chapters.map((c, i) => (
          <article key={c.title} className="group relative overflow-hidden rounded-3xl border border-line bg-ink-2 lg:w-[30rem] lg:shrink-0">
            <div className="relative aspect-[3/2] overflow-hidden lg:aspect-[16/9]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-[1.6s] group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-2 via-transparent to-transparent" />
              <span className="absolute left-5 top-5 font-mono text-[0.68rem] tracking-[0.25em] text-white/75">
                {String(i + 1).padStart(2, "0")} · {c.place.toUpperCase()}
              </span>
            </div>
            <div className="p-6">
              <h3 className="display text-3xl">{c.title}</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-white/75">{c.text}</p>
            </div>
          </article>
        ))}
        <article className="flex flex-col justify-center rounded-3xl border border-gold/30 bg-ink-2 p-8 lg:w-[28rem] lg:shrink-0">
          <p className="eyebrow !text-gold">Why</p>
          <p className="display mt-5 text-4xl leading-[1.1]">“{WHY}”</p>
          <p className="mt-6 font-mono text-xs tracking-[0.2em] text-muted">GASAN</p>
        </article>
      </div>
    </section>
  );
}
