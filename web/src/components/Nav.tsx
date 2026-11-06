"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Nav() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${solid ? "glass border-x-0 border-t-0" : "border-b border-transparent"}`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        <Link href="/" className="group flex items-baseline gap-2" aria-label="Gasan builds AI, home">
          <span className="display text-2xl">Gasan</span>
          <span className="font-mono text-[0.68rem] tracking-[0.3em] text-gold">BUILDS·AI</span>
        </Link>
        <div className="flex items-center gap-1 text-sm sm:gap-6">
          <Link href="/work" className="hidden px-2 py-2 text-muted transition hover:text-text sm:inline">Work</Link>
          <Link href="/#how" className="hidden px-2 py-2 text-muted transition hover:text-text sm:inline">How I build</Link>
          <Link href="/jasmin" className="hidden px-2 py-2 text-muted transition hover:text-text md:inline">Meet Jasmin</Link>
          <Link href="/jasmin#interview" className="btn btn-gold !px-4 !py-2 text-[0.82rem]">Request interview</Link>
        </div>
      </nav>
    </header>
  );
}
