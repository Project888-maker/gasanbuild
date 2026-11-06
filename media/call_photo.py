"""Four video-call portraits of Jasmin for her live avatar (LemonSlice): closer
framing, a sharper face, more natural light; the same person and outfit as the
office photo. Gasan chose B (day, close): web/public/media/jasmin-call.jpg.

    FAL_KEY=... python3 media/call_photo.py      # options land in media/raw/call/
"""
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import generate as g  # noqa: E402

KEEP = ("Keep the adult woman from the first reference image exactly the same person: same face, facial "
        "features, long dark wavy hair, brown eyes, light freckles and warm skin tone. Same outfit and setting "
        "as the second image: tailored black blazer over an ivory silk blouse, small gold earrings, a corner "
        "office high in a skyscraper. ")
REAL = ("Shot like a real high-end webcam frame on a professional video call, not a studio portrait: "
        "true-to-life skin with visible pores and fine texture, natural asymmetry, a few flyaway hairs, no "
        "airbrushing, no beauty filter, sharp focus on her eyes and lips, subtle natural catchlights. She looks "
        "straight into the lens, mouth closed with a relaxed, warm, slight smile, shoulders square to the "
        "camera, centred. Photorealistic, the photo fills the whole frame, no text, no logos, no laptop.")
OPTIONS = {
    "a-dusk-close": "Head-and-shoulders framing: her face fills the upper third, the frame ends just below her "
                    "shoulders. Dusk outside the floor-to-ceiling windows, the city lights softly out of focus "
                    "behind her. Soft warm key light from a desk lamp to one side, gentle fill from the window. ",
    "b-day-close": "Head-and-shoulders framing: her face fills the upper third, the frame ends just below her "
                   "shoulders. Late-afternoon daylight through the floor-to-ceiling windows, soft and even on her "
                   "face, the skyline bright and softly out of focus behind her. ",
    "c-dusk-chest": "Chest-up framing, slightly wider, with room for small hand gestures at the bottom of the frame. "
                    "Blue-hour dusk outside, the city lights softly out of focus behind her. Soft warm key light, "
                    "natural window fill. ",
    "d-evening-close": "Head-and-shoulders framing, a touch closer: her face and shoulders fill most of the frame. "
                       "Evening: the office lit by warm practical lamps, the skyline at night softly out of focus "
                       "behind her, a cinematic but natural look. ",
}
ref = g.data_uri(g.ROOT / "src" / "jasmin_reference.jpg")
office = g.data_uri(g.OUT / "jasmin-office.jpg")
out = g.RAW / "call"


def make(name: str) -> str:
    url = g.run(g.IMAGE_EDIT, {"prompt": KEEP + OPTIONS[name] + REAL, "image_urls": [ref, office],
                               "aspect_ratio": "2:3", "resolution": "2K", "num_images": 1})
    g.download(url, out / f"{name}.png")
    return name


out.mkdir(parents=True, exist_ok=True)
with ThreadPoolExecutor(4) as pool:
    for done in pool.map(make, OPTIONS):
        print("made", done, flush=True)
