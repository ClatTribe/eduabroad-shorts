#!/usr/bin/env bash
# The day's Instagram Story (at most one a day), in order:
#   bash tools/story-day.sh 2026-11-02 [--no-upload]
#
#  1. work out today's Story: stories/<date>.json (tip/word), else Mon/Thu share today's post, Sat SAT teaser
#                                                                -> exit 3 if there is none today
#  2. safety checks for written Stories (tools/check-story.mjs)
#  3. render out/stories/<date>.png
#  4. post: 10:30 IST on Saturday (SAT teaser), 13:30 IST on other days (prepares early, then waits)
#
# Exit codes: 0 posted (or rendered with --no-upload), 3 no Story today, 1 failure.
set -uo pipefail
# Node's fetch only uses the cloud session's outbound proxy when this is set
export NODE_USE_ENV_PROXY=1 NODE_NO_WARNINGS=1
cd "$(dirname "$0")/.."
DATE="${1:?usage: tools/story-day.sh YYYY-MM-DD [--no-upload]}"
UPLOAD=1
[ "${2:-}" = "--no-upload" ] && UPLOAD=0
log() { echo "[story-day $DATE] $*"; }
DOW=$(date -d "$DATE" +%u) # 6 = Saturday
PUBLISH_AT="${DATE}T$([ "$DOW" = "6" ] && echo 10:30 || echo 13:30):00+05:30"

if [ -f "stories/$DATE.json" ]; then
  node tools/check-story.mjs "stories/$DATE.json" || { log "FAIL: Story failed safety checks"; exit 1; }
fi

node tools/render-story.mjs "$DATE" | tee "out/$DATE-story-render.log"
CODE=${PIPESTATUS[0]}
[ "$CODE" = "3" ] && { log "NO_STORY today"; exit 3; }
[ "$CODE" != "0" ] && { log "FAIL: render failed"; exit 1; }
log "rendered out/stories/$DATE.png"

[ "$UPLOAD" = "0" ] && { log "rendered only (--no-upload)"; exit 0; }

if node tools/upload-story-instagram.mjs "out/stories/$DATE.png" --publish-at "$PUBLISH_AT" | tee "out/$DATE-story-instagram.log"; then
  log "DONE: Story posted"
  exit 0
fi
log "FAIL: Instagram upload failed (see above)"
exit 1
