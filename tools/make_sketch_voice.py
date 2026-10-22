"""
Builds the narration for a sketch Short: public/voice/<id>.wav, from the spec's "voice" block,
using the open-source Kokoro TTS model (Apache-2.0). Each line starts at its "at" time.
It prints every line's length and warns if a line runs into the next one, so timings can be fixed.

Models (not in git, about 340 MB): tools/models/kokoro-v1.0.onnx and tools/models/voices-v1.0.bin
from https://github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0).

Usage: tools/.venv/bin/python -I tools/make_sketch_voice.py sketches/<file>.json
"""
import json
import pathlib
import sys

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = pathlib.Path(__file__).resolve().parent.parent
MODELS = ROOT / "tools" / "models"


def trim(samples, sr, threshold=0.01):
    loud = np.where(np.abs(samples) > threshold)[0]
    if len(loud) == 0:
        return samples
    pad = int(0.03 * sr)
    return samples[max(0, loud[0] - pad) : min(len(samples), loud[-1] + pad)]


def main():
    spec = json.loads(pathlib.Path(sys.argv[1]).read_text())
    v = spec["voice"]
    kokoro = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))
    lang = "en-gb" if v["name"].startswith("b") else "en-us"
    sr = 24000
    track = np.zeros(int(spec["seconds"] * sr), dtype=np.float32)
    lines = sorted(v["lines"], key=lambda l: l["at"])
    problems = 0
    for i, line in enumerate(lines):
        samples, sr = kokoro.create(line["text"], voice=v["name"], speed=v["speed"], lang=lang)
        samples = trim(samples, sr)
        end = line["at"] + len(samples) / sr
        nxt = lines[i + 1]["at"] if i + 1 < len(lines) else spec["seconds"]
        flag = ""
        if end > nxt - 0.15:
            flag = f"  <-- runs to {end:.2f}s, next starts {nxt:.2f}s"
            problems += 1
        a = int(line["at"] * sr)
        b = min(len(track), a + len(samples))
        track[a:b] += samples[: b - a]
        print(f"{line['at']:6.2f}s -> {end:6.2f}s  {line['text']}{flag}")
    track = track / max(1e-6, float(np.max(np.abs(track)))) * 0.9
    out = ROOT / "public" / "voice" / f"{spec['id']}.wav"
    out.parent.mkdir(parents=True, exist_ok=True)
    sf.write(out, track, sr)
    print(f"wrote {out.relative_to(ROOT)}" + (f"  ({problems} overlap warning(s))" if problems else ""))
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
