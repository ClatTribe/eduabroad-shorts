#!/usr/bin/env bash
# The Saturday SAT Short, in order:
#   bash tools/sat-day.sh 2026-10-24 [--no-upload]
#
#  1. look up the day's sketch in calendar/sat.json            -> exit 3 if there is none
#  2. render it (tools/render-sketch.sh, uses the narration committed in public/voice/)
#  3. upload: YouTube (scheduled for 18:30 IST) + Instagram (waits, then publishes at 18:30 IST)
#
# Exit codes: 0 posted (or rendered with --no-upload), 3 nothing planned, 1 failure.
set -uo pipefail
# Node's fetch only uses the cloud session's outbound proxy when this is set
export NODE_USE_ENV_PROXY=1 NODE_NO_WARNINGS=1
cd "$(dirname "$0")/.."
DATE="${1:?usage: tools/sat-day.sh YYYY-MM-DD [--no-upload]}"
UPLOAD=1
[ "${2:-}" = "--no-upload" ] && UPLOAD=0
PUBLISH_AT="${DATE}T18:30:00+05:30"
log() { echo "[sat-day $DATE] $*"; }

SPEC=$(node -e "const c=require('./calendar/sat.json');const i=c.items.find(x=>x.date==='$DATE');console.log(i?i.sketch:'')")
if [ -z "$SPEC" ] || [ ! -f "$SPEC" ]; then
  log "NO_SKETCH: nothing planned for $DATE in calendar/sat.json"
  exit 3
fi
NAME=$(node -e "console.log(require('./$SPEC').id)")

mkdir -p out
bash tools/render-sketch.sh "$SPEC" || { log "FAIL: render failed"; exit 1; }
# review sheet: a frame every 3 seconds plus the last frame
if command -v ffmpeg >/dev/null; then FF=ffmpeg; else FF="npx remotion ffmpeg"; fi
rm -rf "out/$NAME-frames" && mkdir -p "out/$NAME-frames"
$FF -hide_banner -loglevel error -y -i "out/$NAME.mp4" -vf "fps=1/3,scale=360:-1" "out/$NAME-frames/f%03d.png"
$FF -hide_banner -loglevel error -y -sseof -0.1 -i "out/$NAME.mp4" -frames:v 1 -vf "scale=360:-1" "out/$NAME-frames/f999.png"
$FF -hide_banner -loglevel error -y -pattern_type glob -i "out/$NAME-frames/*.png" -vf "tile=6x2:padding=6:color=white" -frames:v 1 "out/$NAME-sheet.png" \
  && log "review sheet: out/$NAME-sheet.png"

[ "$UPLOAD" = "0" ] && { log "rendered only (--no-upload)"; exit 0; }

YT=0; IG=0
node tools/upload-youtube.mjs "$SPEC" --publish-at "$PUBLISH_AT" | tee "out/$DATE-sat-youtube.log" || YT=1
node tools/upload-instagram.mjs "$SPEC" --publish-at "$PUBLISH_AT" | tee "out/$DATE-sat-instagram.log" || IG=1
if [ "$YT" = "0" ] && [ "$IG" = "0" ]; then log "DONE: posted to YouTube and Instagram"; exit 0; fi
log "PARTIAL: youtube_failed=$YT instagram_failed=$IG"
exit 1
