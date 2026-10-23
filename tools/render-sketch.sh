#!/usr/bin/env bash
# Renders a whiteboard (sketch) Short:
#   bash tools/render-sketch.sh sketches/sat-exponent-trick.json  -> out/sat-exponent-trick.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
SPEC="${1:?usage: tools/render-sketch.sh sketches/<file>.json}"
NAME="$(basename "$SPEC" .json)"
mkdir -p out
DUR=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$SPEC','utf8')).seconds)")
SEED=$(node -e "let h=0;for(const c of '$NAME')h=(h*31+c.charCodeAt(0))%9973;console.log(h)")

if [ ! -x tools/.venv/bin/python ]; then
  python3 -m venv tools/.venv
  tools/.venv/bin/pip install -q numpy scipy soundfile
fi
tools/.venv/bin/python -I tools/make_sketch_audio.py --duration "$DUR" --seed "$SEED"
# narration, if the spec has a "voice" block. Scheduled sessions don't have the 340 MB voice model,
# so they use the narration committed in public/voice/ (made on a machine that has the model).
if node -e "process.exit(JSON.parse(require('fs').readFileSync('$SPEC','utf8')).voice?0:1)"; then
  if [ -f tools/models/kokoro-v1.0.onnx ]; then
    tools/.venv/bin/python -c "import kokoro_onnx" 2>/dev/null || tools/.venv/bin/pip install -q kokoro-onnx==0.6.1
    tools/.venv/bin/python -I tools/make_sketch_voice.py "$SPEC"
  elif [ -f "public/voice/$NAME.wav" ]; then
    echo "using committed narration public/voice/$NAME.wav"
  else
    echo "FAIL no narration: public/voice/$NAME.wav is missing and the voice model isn't installed" >&2
    exit 1
  fi
fi

node -e "const fs=require('fs');fs.writeFileSync('out/props-$NAME.json',JSON.stringify({spec:JSON.parse(fs.readFileSync('$SPEC','utf8'))}))"
npx remotion render src/index.ts Sketch "out/$NAME-raw.mp4" --props="out/props-$NAME.json" --codec=h264 --crf=18 --log=error
npx remotion ffmpeg -hide_banner -loglevel error -y -i "out/$NAME-raw.mp4" -c:v copy \
  -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k "out/$NAME.mp4"
rm -f "out/$NAME-raw.mp4" "out/props-$NAME.json"
echo "RENDERED out/$NAME.mp4 (${DUR}s)"
