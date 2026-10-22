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

node -e "const fs=require('fs');fs.writeFileSync('out/props-$NAME.json',JSON.stringify({spec:JSON.parse(fs.readFileSync('$SPEC','utf8'))}))"
npx remotion render src/index.ts Sketch "out/$NAME-raw.mp4" --props="out/props-$NAME.json" --codec=h264 --crf=18 --log=error
npx remotion ffmpeg -hide_banner -loglevel error -y -i "out/$NAME-raw.mp4" -c:v copy \
  -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k "out/$NAME.mp4"
rm -f "out/$NAME-raw.mp4" "out/props-$NAME.json"
echo "RENDERED out/$NAME.mp4 (${DUR}s)"
