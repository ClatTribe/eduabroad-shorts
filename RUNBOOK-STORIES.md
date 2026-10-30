# RUNBOOK: the Instagram Story (at most one a day)

| Day | Story | Posts at (IST) |
|---|---|---|
| Mon, Thu | today's feed post, with a "New post" label | 13:30 |
| Tue | tip (`stories/<date>.json`) | 13:30 |
| Fri | IELTS word (`stories/<date>.json`) | 13:30 |
| Sat | teaser of today's SAT Short ("Answer at 6:30 PM") | 10:30 |
| Wed, Sun | none | |

You are running unattended. Never push to this repository. When in doubt, skip the Story and say why.
Instagram's API can't add stickers (polls, links, mentions), so Stories are plain images.

## 1. Set up
```bash
DATE=$(TZ=Asia/Kolkata date +%F)
git clone --depth 1 https://github.com/ClatTribe/eduabroad-shorts.git ~/shorts && cd ~/shorts
npm ci --no-audit --no-fund
export NODE_USE_ENV_PROXY=1 NODE_NO_WARNINGS=1   # Node's fetch needs this to use the session's proxy
export REMOTION_BROWSER_EXECUTABLE=$(find /opt/pw-browsers -maxdepth 3 -type f \( -name headless_shell -o -name chrome-headless-shell \) | head -1)
```

## 2. Render (no upload yet)
```bash
bash tools/story-day.sh "$DATE" --no-upload
```
- **Exit 3 (NO_STORY):** on Wed and Sun that's expected: stop and reply "No Story today".
  On Tue or Fri it means `stories/$DATE.json` is missing: write it (copy `stories/samples/tip.json` on Tuesday,
  `stories/samples/word.json` on Friday, and an existing Story of the same type as your model). Rules from
  `WRITING-RULES.md`: English only (no Hinglish), no em dashes, no invented numbers, no competitor names, a word must not repeat
  any word in `posts/` or `stories/`. Run `node tools/check-story.mjs stories/$DATE.json` until it passes, then step 2 again.
  On Mon/Thu/Sat it means there is no post or SAT Short today to share: stop and report.
- **Exit 1:** read the log, fix what you can, retry once. Otherwise stop and report.

## 3. Look at the image
Open `out/stories/$DATE.png`. Check: nothing cut off or overlapping, no typos, no em dashes, logo looks normal,
and nothing important in the top 250px or bottom 250px (Instagram's own buttons cover those).
SAT teaser: the question must be fully written and no solution visible.

## 4. Post (waits until the posting time)
```bash
bash tools/story-day.sh "$DATE"
```

## 5. Final report
One or two lines: date, Story type and topic, and whether it posted (or the error).
