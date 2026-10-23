#!/usr/bin/env bash
# The whole posting day, in order:
#   bash tools/run-day.sh 2026-11-04 [--no-upload]
#
#  1. find today's episode (episodes/<date>.json)            -> exit 3 if it still needs writing
#  2. film fresh portal footage if the episode needs it      -> falls back to a backup episode if the portal is broken
#  3. safety checks                                          -> falls back to a backup episode if they fail
#  4. render + review sheet (out/<date>-sheet.png)
#  5. upload: YouTube (scheduled for 18:30 IST) + Instagram (waits, then publishes at 18:30 IST)
#
# Exit codes: 0 posted (or rendered with --no-upload), 3 episode needs writing, 1 failure.
set -uo pipefail
# Node's fetch only uses the cloud session's outbound proxy when this is set
export NODE_USE_ENV_PROXY=1 NODE_NO_WARNINGS=1
cd "$(dirname "$0")/.."
DATE="${1:?usage: tools/run-day.sh YYYY-MM-DD [--no-upload]}"
UPLOAD=1
[ "${2:-}" = "--no-upload" ] && UPLOAD=0
EP="episodes/$DATE.json"
PUBLISH_AT="${DATE}T18:30:00+05:30"
log() { echo "[run-day $DATE] $*"; }

use_backup() {
  local reason="$1"
  local dow kind
  dow=$(date -d "$DATE" +%u)            # 1=Mon 3=Wed 5=Fri
  kind=$([ "$dow" = "1" ] && echo tips || echo myth)
  log "FALLBACK: $reason -> using episodes/backup/$kind.json"
  [ -f "$EP" ] && cp "$EP" "out/$DATE-original.json"
  node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync('episodes/backup/$kind.json','utf8'));d.date='$DATE';fs.writeFileSync('$EP',JSON.stringify(d,null,2)+'\n')"
  echo "$reason" > "out/$DATE-FALLBACK.txt"
}

mkdir -p out
rm -f "out/$DATE-FALLBACK.txt"

# 1. episode
if [ ! -f "$EP" ]; then
  log "NEEDS_WRITING: $EP does not exist. Write it from the calendar (see RUNBOOK.md), then run me again."
  exit 3
fi

# 2. fresh portal footage
for FEATURE in $(node -e "const d=require('./$EP');console.log((d.requiresCapture||[]).join(' '))"); do
  log "filming $FEATURE"
  if ! node tools/capture-portal.mjs "$FEATURE"; then
    use_backup "portal page '$FEATURE' could not be filmed (site or data not loading)"
    break
  fi
done

# 3. checks
if ! node tools/check-episode.mjs "$EP"; then
  if [ -f "out/$DATE-FALLBACK.txt" ]; then log "backup episode failed checks too"; exit 1; fi
  use_backup "episode failed safety checks (see log above)"
  node tools/check-episode.mjs "$EP" || exit 1
fi

# 4. render
if ! bash tools/render.sh "$DATE"; then
  log "render failed"
  exit 1
fi

[ "$UPLOAD" = "0" ] && { log "rendered only (--no-upload)"; exit 0; }

# 5. upload (YouTube is scheduled server-side; Instagram waits locally until 18:30 IST)
YT=0; IG=0
node tools/upload-youtube.mjs "$DATE" --publish-at "$PUBLISH_AT" | tee "out/$DATE-youtube.log" || YT=1
node tools/upload-instagram.mjs "$DATE" --publish-at "$PUBLISH_AT" | tee "out/$DATE-instagram.log" || IG=1
if [ "$YT" = "0" ] && [ "$IG" = "0" ]; then log "DONE: posted to YouTube and Instagram"; exit 0; fi
log "PARTIAL: youtube_failed=$YT instagram_failed=$IG"
exit 1
