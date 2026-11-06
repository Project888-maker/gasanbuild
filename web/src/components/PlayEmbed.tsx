"use client";

// A game in a frame, loaded only when the visitor presses Play (it is heavy).
import { useState } from "react";

export default function PlayEmbed({ src, poster, title }: { src: string; poster: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="relative aspect-video overflow-hidden rounded-[26px] border border-line bg-black shadow-2xl shadow-black/60">
      {playing ? (
        <iframe src={src} title={title} className="h-full w-full" allow="fullscreen; gamepad; autoplay" allowFullScreen />
      ) : (
        <button onClick={() => setPlaying(true)} className="group absolute inset-0 h-full w-full" aria-label={`Play ${title} here`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={poster} alt="" className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-[1.03] group-hover:opacity-100" />
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/30">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent)] text-2xl text-ink shadow-[0_0_60px] shadow-[var(--accent)] transition group-hover:scale-110">▶</span>
            <span className="font-mono text-xs tracking-[0.25em] text-white">PLAY IN YOUR BROWSER</span>
          </span>
        </button>
      )}
    </div>
  );
}
