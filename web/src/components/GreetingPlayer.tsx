"use client";

// Jasmin's card on the home page: her idle loop, and her spoken, lip-synced greeting on request.
import { useRef, useState } from "react";
import Film from "@/components/Film";

export default function GreetingPlayer() {
  const [talking, setTalking] = useState(false);
  const [voiceOnly, setVoiceOnly] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);

  return (
    <div className="relative aspect-video">
      {talking && !voiceOnly ? (
        <video
          src="/media/talk/greeting.mp4"
          poster="/media/jasmin-office.jpg"
          className="h-full w-full object-cover"
          style={{ objectPosition: "50% 30%" }}
          autoPlay
          playsInline
          onEnded={() => setTalking(false)}
          onError={() => {
            setVoiceOnly(true);
            void audio.current?.play();
          }}
        />
      ) : (
        <Film src="/media/jasmin-office.mp4" poster="/media/jasmin-office.jpg" position="50% 30%" alt="Jasmin at her desk in a skyscraper office" />
      )}
      <audio ref={audio} src="/media/voice/greeting.mp3" preload="none" onEnded={() => setTalking(false)} />
      {!talking && (
        <button
          onClick={() => setTalking(true)}
          className="group absolute inset-0 flex items-center justify-center"
          aria-label="Hear Jasmin's greeting"
        >
          <span className="flex items-center gap-3 rounded-full bg-black/55 py-2 pl-2 pr-5 text-sm font-semibold backdrop-blur transition group-hover:bg-black/70">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-ink">▶</span>
            Hear Jasmin
          </span>
        </button>
      )}
    </div>
  );
}
