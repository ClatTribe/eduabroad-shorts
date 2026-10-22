#!/usr/bin/env bash
# Renders every slide of a social post to PNG (1080 x 1350):
#   bash tools/render-post.sh posts/2026-11-02.json            -> out/posts/2026-11-02/slide-1.png, slide-2.png ...
#   bash tools/render-post.sh posts/samples/mon-checklist.json -> out/posts/mon-checklist/...
set -euo pipefail
cd "$(dirname "$0")/.."
POST="${1:?usage: tools/render-post.sh posts/<file>.json}"
NAME="$(basename "$POST" .json)"
OUT="out/posts/$NAME"
rm -rf "$OUT" && mkdir -p "$OUT"
node -e "const fs=require('fs');fs.writeFileSync('$OUT/props.json',JSON.stringify({post:JSON.parse(fs.readFileSync('$POST','utf8'))}))"
npx remotion render src/index.ts Post "$OUT" --sequence --image-format=png --props="$OUT/props.json" --log=error
rm -f "$OUT/props.json"
# Remotion names frames element-0.png ...; rename to slide-1.png ...
i=1; for f in $(ls "$OUT"/*.png | sort -V); do mv "$f" "$OUT/slide-$i.png"; i=$((i+1)); done
echo "RENDERED $OUT ($((i-1)) slide(s))"
