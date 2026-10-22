#!/usr/bin/env bash
# Renders one episode end to end:
#   bash tools/render.sh 2026-11-04
# 1. checks the episode  2. composes its music  3. renders with Remotion
# 4. evens out loudness (-14 LUFS, YouTube standard)  5. saves review frames
set -euo pipefail
cd "$(dirname "$0")/.."
ARG="${1:?usage: tools/render.sh YYYY-MM-DD (or a path like episodes/samples/sat-quiz.json)}"
if [[ "$ARG" == *.json ]]; then EP="$ARG"; DATE="$(basename "$ARG" .json)"; else DATE="$ARG"; EP="episodes/$DATE.json"; fi
mkdir -p out
# Full ffmpeg if installed (cloud sessions have it); otherwise the one bundled with Remotion
if command -v ffmpeg >/dev/null; then FF=ffmpeg; else FF="npx remotion ffmpeg"; fi

node tools/check-episode.mjs "$EP" ${PREVIEW:+--preview}

INFO="$(npx tsx tools/episode-info.ts "$EP")"
DUR=$(node -e "console.log(JSON.parse(process.argv[1]).duration)" "$INFO")
DROP=$(node -e "console.log(JSON.parse(process.argv[1]).drop)" "$INFO")
SEED=$(node -e "console.log(JSON.parse(process.argv[1]).musicSeed)" "$INFO")

# Python tools for the music (created once)
if [ ! -x tools/.venv/bin/python ]; then
  python3 -m venv tools/.venv
  tools/.venv/bin/pip install -q numpy scipy soundfile
fi
tools/.venv/bin/python -I tools/make_music.py --seed "$SEED" --drop "$DROP" --duration "$DUR"

node -e "const fs=require('fs');fs.writeFileSync('out/props-$DATE.json',JSON.stringify({episode:JSON.parse(fs.readFileSync('$EP','utf8'))}))"
npx remotion render src/index.ts Short "out/$DATE-raw.mp4" --props="out/props-$DATE.json" --codec=h264 --crf=18 --log=error
npx remotion ffmpeg -hide_banner -loglevel error -y -i "out/$DATE-raw.mp4" -c:v copy \
  -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k "out/$DATE.mp4"
rm -f "out/$DATE-raw.mp4"

# Review sheet: one frame every 2 seconds (+ first and last frame for the loop check), tiled into one image
rm -rf "out/$DATE-frames" && mkdir -p "out/$DATE-frames"
$FF -hide_banner -loglevel error -y -i "out/$DATE.mp4" -vf "fps=1/2,scale=270:-1" "out/$DATE-frames/f%02d.png"
$FF -hide_banner -loglevel error -y -sseof -0.05 -i "out/$DATE.mp4" -frames:v 1 -vf scale=270:-1 "out/$DATE-frames/zz-last.png"
$FF -hide_banner -loglevel error -y -pattern_type glob -i "out/$DATE-frames/*.png" -vf "tile=8x2:padding=6:color=white" -frames:v 1 "out/$DATE-sheet.png"
echo "RENDERED out/$DATE.mp4 (${DUR}s). Review sheet: out/$DATE-sheet.png (frames every 2s, last tile = final frame)"
