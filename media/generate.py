"""Make the portfolio's films and pictures on fal.

    python3 media/generate.py [job ...]      # all jobs, or only the named ones

Every job is in media/jobs.json: what to make, the prompt, the model. Results
land in web/public/media/ and media/log.json records model, prompt, seconds and
the fal URL of each file, so any picture can be remade or traced.

Pictures: Nano Banana Pro (the most real-looking in Hermes's side-by-side
test). Films: a still first, then Kling 3 Pro animates it (FLUX 3 Max as the
fallback), then ffmpeg makes a seamless web loop (forward then backward) and a
poster frame.
"""
from __future__ import annotations

import base64
import json
import subprocess
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import fal_client

ROOT = Path(__file__).resolve().parent
OUT = ROOT.parent / "web" / "public" / "media"
RAW = ROOT / "raw"
LOG = ROOT / "log.json"

IMAGE = "fal-ai/nano-banana-pro"
IMAGE_EDIT = "fal-ai/nano-banana-pro/edit"
VIDEO = ("fal-ai/kling-video/v3/pro/image-to-video", "blackforestlabs/flux-3-max/image-to-video")


def log(entry: dict) -> None:
    items = json.loads(LOG.read_text()) if LOG.exists() else []
    items.append(entry)
    LOG.write_text(json.dumps(items, indent=2))


def download(url: str, dest: Path) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=300) as response:
        dest.write_bytes(response.read())
    return dest


def first_url(result: dict) -> str:
    for key in ("images",):
        if result.get(key):
            return result[key][0]["url"]
    for key in ("image", "video"):
        if isinstance(result.get(key), dict):
            return result[key]["url"]
    raise RuntimeError(f"no file in result: {str(result)[:300]}")


def data_uri(path: Path) -> str:
    """The image inline (fal's upload host is not reachable from here): a JPEG
    at most 2048 px wide keeps the request small."""
    small = RAW / f"{Path(path).stem}.upload.jpg"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-vf", "scale='min(2048,iw)':-2",
                    "-q:v", "3", str(small)], check=True)
    return "data:image/jpeg;base64," + base64.b64encode(small.read_bytes()).decode()


def run(model: str, arguments: dict) -> str:
    started = time.time()
    result = fal_client.subscribe(model, arguments=arguments, client_timeout=900)
    url = first_url(result)
    logged = {k: (v if not str(v).startswith("data:") else "<inline image>") for k, v in arguments.items()}
    if "image_urls" in logged:
        logged["image_urls"] = ["<inline image>"]
    log({"model": model, "arguments": logged, "url": url, "seconds": round(time.time() - started)})
    return url


def still(job: dict) -> Path:
    dest = RAW / f"{job['id']}.png"
    if dest.exists():
        return dest
    arguments = {"prompt": job["image_prompt"], "aspect_ratio": job.get("aspect", "16:9"),
                 "resolution": "2K", "num_images": 1}
    model = IMAGE
    if job.get("reference"):
        arguments["image_urls"] = [data_uri(ROOT / job["reference"])]
        model = IMAGE_EDIT
    return download(run(model, arguments), dest)


def web_image(src: Path, dest: Path, width: int = 1920) -> None:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-vf", f"scale={width}:-2",
                    "-q:v", "3", str(dest)], check=True)


def film(job: dict, frame: Path) -> Path:
    raw = RAW / f"{job['id']}.mp4"
    if not raw.exists():
        image_url = data_uri(frame)
        error = None
        for model in VIDEO:
            arguments = {"prompt": job["video_prompt"], "duration": str(job.get("seconds", 10)),
                         "aspect_ratio": job.get("aspect", "16:9"), "generate_audio": False}
            if "kling" in model:
                arguments.update(image_url=image_url, start_image_url=image_url)
            else:
                arguments.update(image_url=image_url, resolution="720p", duration=job.get("seconds", 10))
            try:
                download(run(model, arguments), raw)
                break
            except Exception as exc:  # try the next model
                print(f"  {model} failed: {str(exc)[:200]}", flush=True)
                error = exc
        else:
            raise error or RuntimeError("no video model worked")
    dest = OUT / f"{job['id']}.mp4"
    loop = "split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0," if job.get("pingpong", True) else ""
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-filter_complex",
                    f"[0:v]{loop}scale=1920:-2,fps=24[v]", "-map", "[v]", "-an", "-c:v", "libx264",
                    "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
                    str(dest)], check=True)
    return dest


def make(job: dict) -> str:
    print(f"> {job['id']}", flush=True)
    frame = still(job)
    web_image(frame, OUT / f"{job['id']}.jpg")
    if job.get("video_prompt"):
        film(job, frame)
    print(f"✓ {job['id']}", flush=True)
    return job["id"]


def main(names: list[str]) -> None:
    RAW.mkdir(exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    jobs = json.loads((ROOT / "jobs.json").read_text())
    if names:
        jobs = [j for j in jobs if j["id"] in names]
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(make, job) for job in jobs]
        for future in futures:
            try:
                future.result()
            except Exception as exc:
                print(f"✗ {exc}", flush=True)


if __name__ == "__main__":
    main(sys.argv[1:])
