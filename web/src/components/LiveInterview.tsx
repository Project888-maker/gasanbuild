"use client";

// The live video interview with Jasmin, on every page so the call carries on
// while she moves the guest around the site.
//
// The call runs on Gasan's server (Hermes, /presenter/ws): the guest's mic goes
// there as 24 kHz PCM16; Jasmin answers in her ElevenLabs voice through her
// LemonSlice lip-sync avatar, which this page watches over LiveKit. Without the
// avatar her voice comes over the socket and plays here. Her page moves arrive
// as "stage" events and run on the same Stage as the guided tour.
//
// Audio handling follows Hermes's own call page (interfaces/static/jasmin_call.html),
// which its engine is tuned for.

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { RemoteTrack, Room } from "livekit-client";
import { PRESENTER_URL, announceLive, type LiveRequest } from "@/lib/live";
import { runAction, type StageAction } from "@/lib/stage";
import { scrollToTarget } from "@/components/Motion";
import { projects } from "@/content/projects";

type Phase = "idle" | "connecting" | "live" | "ended";
type Caption = { role: "user" | "assistant"; text: string };
type Ending = { text: string; rejoin: boolean };

const SLUGS = new Set(projects.map((p) => p.slug));

// Only the moves Jasmin is allowed to make, and only to real pages.
function allowed(a: StageAction): StageAction | null {
  if (a.type === "show_project") return SLUGS.has(a.slug) ? a : null;
  if (a.type === "go_to_section" || a.type === "highlight") return /^[a-z0-9-]{1,40}$/.test(a.id) ? a : null;
  if (a.type === "back_to_overview" || a.type === "go_home") return a;
  return null;
}

function ending(reason: string, first: string): Ending {
  const thanks = `Thank you${first ? `, ${first}` : ""}. Gasan will see a summary of your interview and get back to you personally.`;
  switch (reason) {
    case "Jasmin said goodbye":
    case "time limit":
      return { text: thanks, rejoin: false };
    case "guest hung up":
      return { text: `${thanks} If you have minutes left, you can rejoin from your room.`, rejoin: true };
    case "used up":
      return { text: `Your interview time has been used. ${thanks.replace(/^Thank you[^.]*\. /, "")}`, rejoin: false };
    case "busy":
      return { text: "Jasmin is in another interview right now. Please try again in a few minutes.", rejoin: true };
    case "not approved":
      return { text: "This interview isn't active any more. Reply to Gasan's email if you think that's a mistake.", rejoin: false };
    case "link":
      return { text: "This link can't start a call. Please open the room link from your email again.", rejoin: false };
    case "mic":
      return { text: "Jasmin needs your microphone to hear you. Allow it for this site in your browser settings, then try again.", rejoin: true };
    default:
      return { text: "The call dropped. Please try again in a minute; if it keeps happening, reply to Gasan's email.", rejoin: true };
  }
}

// Mic capture: resample to the call's rate, PCM16 chunks of 40 ms.
const WORKLET = `
class Capture extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.ratio = sampleRate / options.processorOptions.target;
    this.size = Math.round(options.processorOptions.target * 0.04);
    this.out = new Int16Array(this.size);
    this.n = 0; this.pos = 0; this.carry = new Float32Array(0);
  }
  process(inputs) {
    const input = inputs[0] && inputs[0][0];
    if (!input) return true;
    const data = new Float32Array(this.carry.length + input.length);
    data.set(this.carry); data.set(input, this.carry.length);
    let pos = this.pos;
    while (pos + 1 < data.length) {
      const i = Math.floor(pos), f = pos - i;
      const s = data[i] * (1 - f) + data[i + 1] * f;
      this.out[this.n++] = Math.max(-1, Math.min(1, s)) * 0x7fff;
      if (this.n === this.out.length) {
        this.port.postMessage(this.out.buffer, [this.out.buffer]);
        this.out = new Int16Array(this.size); this.n = 0;
      }
      pos += this.ratio;
    }
    const keep = Math.floor(pos);
    this.carry = data.slice(keep); this.pos = pos - keep;
    return true;
  }
}
registerProcessor('capture', Capture);`;

// The page Jasmin is told about. The room's own path carries the guest's private link: never send it.
const where = (path: string) => (path.startsWith("/interview/") ? "/interview (their private room)" : path.slice(0, 120));

const clock = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

export default function LiveInterview() {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const [view, setView] = useState<"full" | "pip">("full");
  const [status, setStatus] = useState("");
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [left, setLeft] = useState(0);
  const [muted, setMuted] = useState(false);
  const [avatarOn, setAvatarOn] = useState(false);
  const [needTap, setNeedTap] = useState(false);
  const [ended, setEnded] = useState<Ending | null>(null);

  const request = useRef<LiveRequest | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const ctx = useRef<AudioContext | null>(null);
  const mic = useRef<MediaStream | null>(null);
  const outGain = useRef<GainNode | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const avatarSource = useRef<MediaStreamAudioSourceNode | null>(null);
  const sources = useRef(new Set<AudioBufferSourceNode>());
  const nextTime = useRef(0);
  const rate = useRef(24000);
  const lk = useRef<Room | null>(null);
  // Her avatar's tracks, kept so they can be attached again: switching between the
  // full view and the corner window makes React create new <video> elements.
  const herVideo = useRef<RemoteTrack | null>(null);
  const herAudio = useRef<RemoteTrack | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mutedRef = useRef(false);
  const lastLoud = useRef(0);
  const voicedSince = useRef(0);
  const lastInterrupt = useRef(0);
  const wake = useRef<{ release: () => Promise<void> } | null>(null);
  const done = useRef(false);

  const first = (request.current?.name || "").split(" ")[0];

  const log = (text: string) => {
    try {
      if (ws.current?.readyState === 1) ws.current.send(JSON.stringify({ type: "log", text: String(text).slice(0, 300) }));
    } catch {}
  };

  // ---------- her voice without the avatar: PCM16 chunks back to back
  const play = (buffer: ArrayBuffer) => {
    const audio = ctx.current;
    if (!audio || !outGain.current) return;
    const pcm = new Int16Array(buffer);
    if (!pcm.length) return;
    const f = new Float32Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) f[i] = pcm[i] / 0x8000;
    const chunk = audio.createBuffer(1, f.length, rate.current);
    chunk.copyToChannel(f, 0);
    const src = audio.createBufferSource();
    src.buffer = chunk;
    src.connect(outGain.current);
    const now = audio.currentTime;
    if (nextTime.current < now + 0.04) nextTime.current = now + 0.04;
    src.start(nextTime.current);
    nextTime.current += chunk.duration;
    sources.current.add(src);
    src.onended = () => sources.current.delete(src);
  };
  const flush = () => {
    for (const s of sources.current) {
      try {
        s.stop();
      } catch {}
    }
    sources.current.clear();
    nextTime.current = ctx.current ? ctx.current.currentTime : 0;
  };

  // Talking over her stops her voice at once. While she talks, her own voice
  // can leak into the mic, so it takes a clearly louder and longer voice.
  // Returns true while the guest is clearly talking (over her, or on their turn).
  const bargeIn = (pcm: Int16Array) => {
    let sum = 0;
    for (let i = 0; i < pcm.length; i++) sum += pcm[i] * pcm[i];
    const rms = Math.sqrt(sum / pcm.length);
    const now = performance.now();
    const herTurn = herVoicePlaying();
    if (rms > (herTurn ? 3200 : 1800)) {
      voicedSince.current = voicedSince.current || now;
      if (now - voicedSince.current > (herTurn ? 550 : 320)) {
        if (sources.current.size) flush();
        if (lk.current && now - lastLoud.current < 300 && now - lastInterrupt.current > 1000 && ws.current?.readyState === 1) {
          lastInterrupt.current = now;
          ws.current.send(JSON.stringify({ type: "interrupt" }));
        }
        return true;
      }
    } else voicedSince.current = 0;
    return false;
  };

  // Is her voice coming out of the speakers right now? (Her fallback voice is
  // scheduled here; the avatar's is measured by the analyser.)
  const herVoicePlaying = () => {
    const audio = ctx.current;
    const scheduled = !!audio && (sources.current.size > 0 || audio.currentTime < nextTime.current + 0.35);
    return scheduled || performance.now() - lastLoud.current < 450;
  };

  // Echo guard: while she speaks, her voice from the speakers reaches the mic,
  // and Hermes would hear it as the guest (she then answers herself, and the
  // garbled echo comes back as another language). So while she speaks the mic
  // sends silence, keeping the last 0.6 s; when the guest clearly talks over
  // her, those 0.6 s go first so the start of their words isn't lost.
  const held = useRef<Int16Array[]>([]);
  const guardEcho = (pcm: Int16Array, talking: boolean): Int16Array[] => {
    if (herVoicePlaying() && !talking) {
      held.current = [...held.current, pcm.slice()].slice(-15);
      pcm.fill(0);
      return [pcm];
    }
    const out = [...held.current, pcm];
    held.current = [];
    return out;
  };

  // ---------- her avatar (LemonSlice in a LiveKit room)
  const showVideo = (v: HTMLVideoElement) => {
    const track = herVideo.current;
    if (!track) return;
    v.muted = true;
    v.playsInline = true;
    track.attach(v);
    v.play().catch((e) => {
      setNeedTap(true);
      log(`avatar video needs a tap: ${e.name}`);
    });
    // A phone can attach the video and still show no frames.
    setTimeout(() => {
      if (videoRef.current === v && herVideo.current === track && (v.paused || !v.videoWidth)) {
        setNeedTap(true);
        log("avatar video: no frames after 6 s");
      }
    }, 6000);
  };
  const playVoice = (el: HTMLAudioElement) => {
    const track = herAudio.current;
    if (!track) return;
    track.attach(el);
    el.muted = false;
    el.play().catch(() => setNeedTap(true));
  };
  // Every <video>/<audio> React creates for her gets her tracks again. Stable
  // callbacks (they only touch refs), so a re-render doesn't re-attach them.
  const bindVideo = useCallback((el: HTMLVideoElement | null) => {
    if (videoRef.current && videoRef.current !== el) herVideo.current?.detach(videoRef.current);
    videoRef.current = el;
    if (el) showVideo(el);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const bindAudio = useCallback((el: HTMLAudioElement | null) => {
    if (audioRef.current && audioRef.current !== el) herAudio.current?.detach(audioRef.current);
    audioRef.current = el;
    if (el) playVoice(el);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const watchAvatar = async (info: { url: string; token: string; identity: string }, attempt = 1) => {
    try {
      const LK = await import("livekit-client");
      // adaptiveStream pauses a video it thinks is hidden; phones then never got frames.
      const room = new LK.Room({ adaptiveStream: false, dynacast: false });
      room.on(LK.RoomEvent.TrackSubscribed, (track, _pub, participant) => {
        if (participant.identity !== info.identity) return;
        if (track.kind === LK.Track.Kind.Video) {
          herVideo.current = track;
          if (videoRef.current) showVideo(videoRef.current);
          setAvatarOn(true);
          log(`avatar video on (${navigator.userAgent.slice(0, 120)})`);
        } else if (track.kind === LK.Track.Kind.Audio && ctx.current) {
          // Her voice plays from the <audio> element: the browser's echo
          // cancellation only removes sound it plays that way.
          herAudio.current = track;
          if (audioRef.current) playVoice(audioRef.current);
          avatarSource.current?.disconnect();
          avatarSource.current = ctx.current.createMediaStreamSource(new MediaStream([track.mediaStreamTrack]));
          if (analyser.current) avatarSource.current.connect(analyser.current);
        }
      });
      room.on(LK.RoomEvent.TrackUnsubscribed, (track, _pub, participant) => {
        if (participant.identity !== info.identity) return;
        track.detach();
        if (track.kind === LK.Track.Kind.Video) {
          herVideo.current = null;
          setAvatarOn(false);
        } else if (track.kind === LK.Track.Kind.Audio) herAudio.current = null;
      });
      room.on(LK.RoomEvent.AudioPlaybackStatusChanged, () => {
        if (!room.canPlaybackAudio) setNeedTap(true);
      });
      await room.connect(info.url, info.token);
      lk.current = room;
      if (!room.canPlaybackAudio) setNeedTap(true);
    } catch (e) {
      log(`avatar failed (try ${attempt}): ${(e as Error)?.message || e}`);
      if (attempt < 2 && !done.current) setTimeout(() => watchAvatar(info, attempt + 1), 1500);
    }
  };

  const tapToPlay = async () => {
    setNeedTap(false);
    try {
      await lk.current?.startAudio();
    } catch {}
    try {
      await ctx.current?.resume();
    } catch {}
    for (const el of [videoRef.current, audioRef.current]) if (el?.srcObject) el.play().catch(() => setNeedTap(true));
  };

  // ---------- ending
  const finish = useCallback((reason: string) => {
    if (done.current) return;
    done.current = true;
    try {
      ws.current?.close();
    } catch {}
    ws.current = null;
    mic.current?.getTracks().forEach((t) => t.stop());
    mic.current = null;
    try {
      lk.current?.disconnect();
    } catch {}
    lk.current = null;
    avatarSource.current?.disconnect();
    avatarSource.current = null;
    sources.current.clear();
    ctx.current?.close().catch(() => {});
    ctx.current = null;
    wake.current?.release().catch(() => {});
    wake.current = null;
    herVideo.current?.detach();
    herAudio.current?.detach();
    herVideo.current = null;
    herAudio.current = null;
    setAvatarOn(false);
    setNeedTap(false);
    setEnded(ending(reason, (request.current?.name || "").split(" ")[0]));
    setPhase("ended");
    setView("full");
    announceLive(false);
  }, []);

  const hangUp = () => {
    try {
      ws.current?.send(JSON.stringify({ type: "hangup" }));
    } catch {}
    setTimeout(() => finish("guest hung up"), 1500);
  };

  // ---------- starting
  const start = useCallback(
    async (req: LiveRequest) => {
      if (phase === "connecting" || phase === "live") {
        setView("full");
        return;
      }
      request.current = req;
      done.current = false;
      setEnded(null);
      setCaptions([]);
      setMuted(false);
      mutedRef.current = false;
      setView("full");
      setPhase("connecting");
      setStatus("Allow your microphone so Jasmin can hear you…");
      announceLive(true);
      try {
        mic.current = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
        });
      } catch {
        finish("mic");
        return;
      }
      const audio = new AudioContext();
      ctx.current = audio;
      await audio.resume().catch(() => {});
      outGain.current = audio.createGain();
      analyser.current = audio.createAnalyser();
      analyser.current.fftSize = 1024;
      outGain.current.connect(audio.destination);
      outGain.current.connect(analyser.current);
      const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
      await audio.audioWorklet.addModule(url);

      setStatus("Connecting you to Jasmin…");
      const socket = new WebSocket(`${PRESENTER_URL.replace(/^http/, "ws")}/presenter/ws?invite=${encodeURIComponent(req.token)}`);
      socket.binaryType = "arraybuffer";
      ws.current = socket;
      socket.onmessage = (e) => {
        if (ws.current !== socket) return; // a previous call's socket
        if (typeof e.data !== "string") {
          play(e.data as ArrayBuffer);
          return;
        }
        const msg = JSON.parse(e.data);
        if (msg.type === "status") setStatus(msg.text || "");
        else if (msg.type === "ready") {
          rate.current = msg.rate || 24000;
          if (msg.avatar) void watchAvatar(msg.avatar);
          const sink = audio.createGain();
          sink.gain.value = 0;
          sink.connect(audio.destination);
          const worklet = new AudioWorkletNode(audio, "capture", { processorOptions: { target: rate.current } });
          worklet.port.onmessage = (m) => {
            const pcm = new Int16Array(m.data);
            const talking = bargeIn(pcm);
            if (mutedRef.current) {
              pcm.fill(0); // keep the line open with silence
              held.current = [];
              if (socket.readyState === 1) socket.send(pcm.buffer);
              return;
            }
            if (socket.readyState === 1) for (const frame of guardEcho(pcm, talking)) socket.send(frame);
          };
          if (mic.current) audio.createMediaStreamSource(mic.current).connect(worklet);
          worklet.connect(sink);
          setLeft(Number(msg.seconds_left) || 0);
          setPhase("live");
          setStatus("");
          const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
          nav.wakeLock?.request("screen").then((w) => (wake.current = w)).catch(() => {});
        } else if (msg.type === "stage") {
          const action = allowed(msg.action as StageAction);
          if (action) {
            setView("pip");
            void runAction(action, router, (el) => scrollToTarget(el, -120));
          }
        } else if (msg.type === "caption") {
          const role: Caption["role"] = msg.role === "user" ? "user" : "assistant";
          setCaptions((list) => {
            const last = list[list.length - 1];
            if (last && last.role === role) return [...list.slice(0, -1), { role, text: (last.text + msg.delta).slice(-400) }];
            return [...list, { role, text: String(msg.delta) }].slice(-4);
          });
        } else if (msg.type === "flush") flush();
        else if (msg.type === "ended") finish(String(msg.reason || ""));
      };
      socket.onclose = (e) => {
        if (ws.current === socket) finish(e.code === 4401 || e.code === 4403 ? "link" : "dropped");
      };
      socket.onerror = () => {
        if (ws.current === socket) finish("dropped");
      };
    },
    // play/bargeIn/watchAvatar only touch refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phase, finish, router],
  );

  useEffect(() => {
    const onStart = (e: Event) => void start((e as CustomEvent<LiveRequest>).detail);
    window.addEventListener("jasmin-live", onStart);
    return () => window.removeEventListener("jasmin-live", onStart);
  }, [start]);

  // Tell Jasmin which page the guest is on (she moves it, they can too).
  useEffect(() => {
    if (phase === "live" && ws.current?.readyState === 1) ws.current.send(JSON.stringify({ type: "page", path: where(pathname) }));
  }, [pathname, phase]);

  // The countdown, and a warning before leaving the site mid-call.
  useEffect(() => {
    if (phase !== "live") return;
    const timer = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    const leave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", leave);
    return () => {
      clearInterval(timer);
      window.removeEventListener("beforeunload", leave);
    };
  }, [phase]);

  // A soft ring that follows her voice, and the "she's talking" signal for barge-in.
  useEffect(() => {
    if (phase !== "live") return;
    let frame = 0;
    const data = new Float32Array(1024);
    const tick = () => {
      const a = analyser.current;
      if (a) {
        a.getFloatTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
        const level = Math.sqrt(sum / data.length);
        if (level > 0.02) lastLoud.current = performance.now();
        if (ringRef.current) ringRef.current.style.opacity = String(Math.min(1, level * 9));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  // Leaving the site (not just changing page) ends a call that is on.
  useEffect(() => () => {
    if (ws.current || mic.current) finish("page closed");
  }, [finish]);

  if (phase === "idle") return null;

  const toggleMute = () => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
  };
  // Her current words: the last two sentences she has started saying.
  const said = ([...captions].reverse().find((c) => c.role === "assistant")?.text || "")
    .trim()
    .split(/(?<=[.!?…])\s+/)
    .slice(-2)
    .join(" ");
  const heard = captions[captions.length - 1]?.role === "user" ? captions[captions.length - 1].text : "";
  const pip = view === "pip" && phase === "live";

  const picture = (
    <div className={`relative overflow-hidden bg-ink ${pip ? "aspect-[3/4] w-full sm:aspect-[2/3]" : "aspect-[2/3] h-[min(62svh,680px)] rounded-[24px] border border-line shadow-2xl shadow-black/70"}`}>
      <video
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${avatarOn ? "opacity-0" : "opacity-100"}`}
        src="/media/jasmin-office.mp4"
        poster="/media/jasmin-office.jpg"
        autoPlay
        muted
        loop
        playsInline
        style={{ objectPosition: "50% 25%" }}
      />
      <video
        ref={bindVideo}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${avatarOn ? "opacity-100" : "opacity-0"}`}
        style={{ objectPosition: "50% 20%" }}
        playsInline
        muted
      />
      <div ref={ringRef} className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 shadow-[inset_0_0_0_2px_var(--color-gold)] transition-opacity duration-150" />
      {phase === "connecting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-black/85 via-black/20 to-transparent p-6 text-center">
          <span className="mb-3 h-2 w-2 animate-pulse rounded-full bg-gold" />
          <p className="text-sm text-white/90">{status || "Connecting…"}</p>
        </div>
      )}
      {needTap && (
        <button onClick={tapToPlay} className="absolute inset-x-4 bottom-4 rounded-full bg-gold px-4 py-2.5 text-sm font-semibold text-ink">
          Tap to hear Jasmin
        </button>
      )}
      {phase === "live" && (
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 font-mono text-[0.62rem] tracking-[0.18em] text-white/90">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> LIVE · {clock(left)}
        </span>
      )}
    </div>
  );

  const small = "!px-0 !py-1.5 text-[0.7rem] justify-center";
  const controls = phase === "live" && (
    <div className={pip ? "grid grid-cols-3 gap-1 p-2" : "mt-5 flex items-center justify-center gap-2"}>
      <button onClick={toggleMute} className={`btn ${muted ? "btn-gold" : "btn-ghost"} ${pip ? small : ""}`} aria-label={muted ? "Unmute your microphone" : "Mute your microphone"}>
        {muted ? "Unmute" : "Mute"}
      </button>
      <button onClick={() => setView(pip ? "full" : "pip")} className={`btn btn-ghost ${pip ? small : ""}`}>
        {pip ? "Expand" : "Show the site"}
      </button>
      <button onClick={hangUp} className={`btn !border-red-500/60 !bg-red-600 !text-white hover:!bg-red-500 ${pip ? small : ""}`}>
        {pip ? "End" : "End interview"}
      </button>
    </div>
  );

  // Her voice's <audio> sits outside the views, so it is never recreated.
  const voice = <audio ref={bindAudio} />;

  if (pip) {
    return (
      <>
      {voice}
      <aside aria-label="Live interview with Jasmin" className="glass fixed bottom-3 right-3 z-[80] w-[176px] overflow-hidden rounded-2xl shadow-2xl shadow-black/70 sm:w-[230px]">
        {picture}
        {said && <p className="line-clamp-2 px-3 pt-2 text-[0.72rem] leading-snug text-white/85 sm:line-clamp-3">{said}</p>}
        {controls}
      </aside>
      </>
    );
  }

  return (
    <>
    {voice}
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center overflow-y-auto bg-ink/95 px-4 py-8 backdrop-blur" data-lenis-prevent role="dialog" aria-label="Live interview with Jasmin">
      <p className="eyebrow mb-4">Live interview · Jasmin, AI Chief of Staff</p>
      {picture}
      {phase === "live" && (
        <div aria-live="polite" className="mt-4 min-h-[4.5rem] w-full max-w-xl text-center">
          <p className="text-[0.98rem] leading-relaxed text-white/90">{said}</p>
          {heard && <p className="mt-2 text-xs text-muted">You: {heard}</p>}
        </div>
      )}
      {controls}
      {phase === "ended" && ended && (
        <div className="mt-6 max-w-md text-center">
          <p className="leading-relaxed text-white/85">{ended.text}</p>
          <div className="mt-5 flex justify-center gap-3">
            {ended.rejoin && request.current && (
              <button className="btn btn-gold" onClick={() => request.current && start(request.current)}>
                Try again
              </button>
            )}
            <button className="btn btn-ghost" onClick={() => setPhase("idle")}>
              Close
            </button>
          </div>
        </div>
      )}
      {phase === "connecting" && (
        <button className="btn btn-ghost mt-5" onClick={hangUp}>
          Cancel
        </button>
      )}
      {phase !== "ended" && first && <p className="mt-4 text-xs text-muted">Headphones help Jasmin hear you clearly.</p>}
    </div>
    </>
  );
}
