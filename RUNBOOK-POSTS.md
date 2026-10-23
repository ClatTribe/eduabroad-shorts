# RUNBOOK: the daily Instagram post (scheduled every day, posts at 13:00 IST)

You are running unattended. Posting is fully automatic by the owner's choice, so when in doubt, skip the
day and say why rather than posting something you are unsure about. Never push to this repository.

## 1. Set up
```bash
DATE=$(TZ=Asia/Kolkata date +%F)
git clone --depth 1 https://github.com/ClatTribe/eduabroad-shorts.git ~/shorts && cd ~/shorts
npm ci --no-audit --no-fund
export NODE_USE_ENV_PROXY=1 NODE_NO_WARNINGS=1   # Node's fetch needs this to use the session's proxy
export REMOTION_BROWSER_EXECUTABLE=$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell | head -1)
```
If `DATE` is before **2026-10-24**, stop and reply "Before start date".

## 2. Render (no upload yet)
```bash
bash tools/post-day.sh "$DATE" --no-upload
```
- **Exit 3 (NO_POST):** there is no `posts/$DATE.json`. Find `$DATE` in `calendar/posts/YYYY-MM.json`; if it's there
  but the file is missing, or the calendar has run out, write `posts/$DATE.json` yourself:
  - Use that weekday's format (see the calendar: Mon checklist, Tue admit-guess, Wed feature, Thu versus, Fri myth,
    Sat word, Sun parents). Copy an existing post of the same format as your model.
  - Prefer formats that need no new data (checklist, versus, myth, word, parents). Use admit-guess only with a real
    Admit Finder card, and feature only with a screenshot filmed by `tools/capture-portal.mjs`.
  - Rules from `WRITING-RULES.md`: warm Hinglish, no em dashes, no invented numbers or stats, no competitor names,
    every claim listed in `claims`. The topic must not repeat any topic in `posts/` or `calendar/posts/`.
  - Run `node tools/check-post.mjs posts/$DATE.json` until it passes, then run step 2 again.
- **Exit 1:** read the log, fix what you can (usually a line that's too long), retry once. Otherwise stop and report.

## 3. Look at the slides before posting
Open every `out/posts/$DATE/slide-*.png`. Check: no text cut off or overlapping, no typos, no em dashes,
the logo looks normal, screenshots show real content (no errors, no "0 found", no endless loading).
Fix `posts/$DATE.json` and re-run step 2 if needed (at most 2 retries). If still wrong, skip the day and report.

## 4. Post (waits until 13:00 IST)
```bash
node tools/upload-post-instagram.mjs "posts/$DATE.json" --publish-at "${DATE}T13:00:00+05:30"
```
If it's already past 13:00 it posts straight away.

## 5. Final report (this becomes the email/phone notification)
Keep it short: date, format, topic, the Instagram link (or the error), and anything the owner must do.
