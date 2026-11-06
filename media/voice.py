"""Jasmin's voice-overs and lip-synced clips for the site.

    python3 media/voice.py audio            # every line in media/voice-lines.json → mp3
    python3 media/voice.py talk [id ...]    # lip-synced clips (OmniHuman v2) from her office still

Audio: her cloned ElevenLabs voice (ElevenLabs v4, the settings Hermes uses).
The ElevenLabs key is injected by this environment's proxy, never stored here.
Clips: OmniHuman v2 on fal, about $0.105 per second, then muxed with the
original voice so the sound is exactly her recording.
"""
from __future__ import annotations

import base64
import json
import subprocess
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent
WEB = ROOT.parent / "web" / "public" / "media"
VOICE_ID = "njynYTWWtWecayrQg0HZ"
MODEL = "eleven_v4"
TALK_MODEL = "bytedance/omnihuman/v2"
STILL = ROOT / "raw" / "jasmin-office.png"
# fal's talking-head model only downloads by URL, and fal's upload host is not
# reachable from the build container, so inputs are read from the public repo.
RAW_BASE = "https://raw.githubusercontent.com/Project888-maker/gasanbuild"
TALK_PROMPT = (
    "A professional woman on a video call at her desk, talking warmly and confidently to the camera "
    "with clear, natural lip movements that match her words, small natural head movements and "
    "occasional subtle hand gestures. Static camera, she stays centred and facing the camera."
)


def lines() -> list[dict]:
    return json.loads((ROOT / "voice-lines.json").read_text())


def seconds(path: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def speak(line: dict) -> Path:
    dest = WEB / "voice" / f"{line['id']}.mp3"
    if dest.exists():
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    body = json.dumps({
        "text": line["text"],
        "model_id": MODEL,
        "voice_settings": {"stability": 0.45, "similarity_boost": 0.85, "style": 0.35},
    }).encode()
    request = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}?output_format=mp3_44100_128",
        data=body, method="POST",
        headers={"Content-Type": "application/json", "xi-api-key": "proxy-injected", "Accept": "audio/mpeg"},
    )
    with urllib.request.urlopen(request, timeout=120) as response:
        dest.write_bytes(response.read())
    print(f"♪ {line['id']} {seconds(dest):.1f}s", flush=True)
    return dest


def data_uri(path: Path, mime: str) -> str:
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()


def talk(line: dict) -> Path:
    import fal_client

    audio = speak(line)
    dest = WEB / "talk" / f"{line['id']}.mp4"
    if dest.exists():
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    ref = subprocess.run(["git", "-C", str(ROOT), "rev-parse", "HEAD"], capture_output=True, text=True, check=True).stdout.strip()
    result = fal_client.subscribe(TALK_MODEL, arguments={
        "image_url": f"{RAW_BASE}/{ref}/web/public/media/jasmin-office.jpg",
        "audio_url": f"{RAW_BASE}/{ref}/web/public/media/voice/{line['id']}.mp3",
        "prompt": TALK_PROMPT,
    }, client_timeout=1200)
    url = result["video"]["url"]
    raw = ROOT / "raw" / f"talk-{line['id']}.mp4"
    urllib.request.urlretrieve(url, raw)
    # Her own recording as the sound; web-friendly H.264.
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-i", str(audio), "-map", "0:v:0", "-map", "1:a:0",
                    "-shortest", "-vf", "scale=1280:-2", "-c:v", "libx264", "-preset", "slow", "-crf", "24",
                    "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", str(dest)], check=True)
    print(f"✓ talk {line['id']} ({url})", flush=True)
    return dest


def main(argv: list[str]) -> None:
    mode, names = (argv[0] if argv else "audio"), argv[1:]
    items = [l for l in lines() if not names or l["id"] in names]
    work = speak if mode == "audio" else talk
    with ThreadPoolExecutor(max_workers=3) as pool:
        for future in [pool.submit(work, l) for l in items]:
            try:
                future.result()
            except Exception as exc:
                print(f"✗ {str(exc)[:300]}", flush=True)


if __name__ == "__main__":
    main(sys.argv[1:])
