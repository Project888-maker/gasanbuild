"use client";

// A muted cinematic loop. Shows only the still when the visitor prefers less motion.
import { useEffect, useRef, useState } from "react";

export default function Film({
  src,
  poster,
  className = "",
  position = "50% 50%",
  alt = "",
}: {
  src?: string;
  poster: string;
  className?: string;
  position?: string;
  alt?: string;
}) {
  const [still, setStill] = useState(!src);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setStill(true);
  }, []);

  // Play only while on screen: saves battery and bandwidth on long pages.
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void video.play().catch(() => {});
      else video.pause();
    }, { threshold: 0.05 });
    observer.observe(video);
    return () => observer.disconnect();
  }, [still]);

  if (still || !src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={poster} alt={alt} className={`h-full w-full object-cover ${className}`} style={{ objectPosition: position }} />;
  }
  return (
    <video
      ref={ref}
      className={`h-full w-full object-cover ${className}`}
      style={{ objectPosition: position }}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      autoPlay
      preload="metadata"
      aria-label={alt || undefined}
    />
  );
}
