#!/usr/bin/env bash
# The daily Instagram post, in order:
#   bash tools/post-day.sh 2026-11-04 [--no-upload]
#
#  1. find the day's post (posts/<date>.json)                  -> exit 3 if there is none
#  2. feature posts: film the live portal page for the screenshot
#  3. safety checks (tools/check-post.mjs)
#  4. render the slides (out/posts/<date>/slide-*.png)
#  5. post to Instagram at 13:00 IST (prepares early, then waits)
#
# Exit codes: 0 posted (or rendered with --no-upload), 3 no post for this day, 1 failure.
set -uo pipefail
# Node's fetch only uses the cloud session's outbound proxy when this is set
export NODE_USE_ENV_PROXY=1 NODE_NO_WARNINGS=1
cd "$(dirname "$0")/.."
DATE="${1:?usage: tools/post-day.sh YYYY-MM-DD [--no-upload]}"
UPLOAD=1
[ "${2:-}" = "--no-upload" ] && UPLOAD=0
POST="posts/$DATE.json"
PUBLISH_AT="${DATE}T13:00:00+05:30"
log() { echo "[post-day $DATE] $*"; }
if command -v ffmpeg >/dev/null; then FF=ffmpeg; else FF="npx remotion ffmpeg"; fi

# 1. post
if [ ! -f "$POST" ]; then
  log "NO_POST: $POST does not exist"
  exit 3
fi

# 2. live screenshot for feature posts, cut from a fresh portal recording
read -r SHOT FEATURE CLIP AT <<<"$(node -e "const c=require('./$POST').content;const k=c.capture;console.log(c.type==='feature'&&k?[c.screenshot,k.feature,k.clip,k.at].join(' '):'')")"
if [ -n "${SHOT:-}" ] && [ ! -f "public/$SHOT" ]; then
  log "filming $FEATURE for the screenshot"
  if ! node tools/capture-portal.mjs "$FEATURE"; then
    log "FAIL: portal page '$FEATURE' could not be filmed (site or data not loading)"
    exit 1
  fi
  mkdir -p "$(dirname "public/$SHOT")"
  $FF -hide_banner -loglevel error -y -ss "$AT" -i "public/footage/$FEATURE/$CLIP.mp4" -frames:v 1 "public/$SHOT" || {
    log "FAIL: could not cut the screenshot from public/footage/$FEATURE/$CLIP.mp4"
    exit 1
  }
fi

# 3. checks
node tools/check-post.mjs "$POST" || { log "FAIL: post failed safety checks"; exit 1; }

# 4. render
node tools/render-posts.mjs "$POST" || { log "FAIL: render failed"; exit 1; }

[ "$UPLOAD" = "0" ] && { log "rendered only (--no-upload)"; exit 0; }

# 5. upload
if node tools/upload-post-instagram.mjs "$POST" --publish-at "$PUBLISH_AT" | tee "out/$DATE-post-instagram.log"; then
  log "DONE: posted to Instagram"
  exit 0
fi
log "FAIL: Instagram upload failed (see above)"
exit 1
