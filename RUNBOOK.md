# RUNBOOK: what the scheduled Claude session does on a posting day

You are running unattended. The owner chose **fully automatic posting**, so be careful: when in doubt,
post the backup episode rather than something you are unsure about. Never push to this repository.

## 0. Is today a posting day?
```bash
DATE=$(TZ=Asia/Kolkata date +%F); DOW=$(TZ=Asia/Kolkata date +%u)   # 1=Mon 3=Wed 5=Fri
```
If `DOW` is not 1, 3 or 5, stop and reply "Not a posting day".
If `DATE` is before **2026-10-24**, stop and reply "Before start date" (2026-10-23 was posted by hand).
Daily Instagram posts and the Saturday SAT Short have their own runbooks: `RUNBOOK-POSTS.md`, `RUNBOOK-SAT.md`.

## 1. Set up (about 2 minutes)
```bash
git clone --depth 1 https://github.com/ClatTribe/eduabroad-shorts.git ~/shorts && cd ~/shorts
npm ci --no-audit --no-fund
export NODE_USE_ENV_PROXY=1 NODE_NO_WARNINGS=1   # Node's fetch needs this to use the session's proxy
export REMOTION_BROWSER_EXECUTABLE=$(find /opt/pw-browsers -maxdepth 3 -type f \( -name headless_shell -o -name chrome-headless-shell \) | head -1)
node tools/upload-youtube.mjs "$DATE" --dry-run; node tools/upload-instagram.mjs "$DATE" --dry-run
```
The dry runs tell you which credentials are missing. If any are missing, still render, but do not upload,
and say so in the final report.

## 2. Make sure today's episode exists
```bash
bash tools/run-day.sh "$DATE" --no-upload
```
- **Exit 3 (NEEDS_WRITING):** find `$DATE` in `calendar/YYYY-MM.json`, then write `episodes/$DATE.json`.
  - Follow `WRITING-RULES.md` exactly. Copy an existing episode with the same `template` as your model.
  - Portal episodes: set `requiresCapture` to the calendar's `feature`. Use clip paths
    `footage/<feature>/<clip>.mp4` (clip names are in `tools/portal-pages.json`). To read what the live page
    actually says, run `node tools/capture-portal.mjs <feature>` and look at the frames. Only claim what you can see.
  - If there's no calendar entry: write a general-advice episode for the day's series, on a topic not in the
    calendar files.
  - Run `node tools/check-episode.mjs episodes/$DATE.json` until it passes, then run `run-day.sh` again.
- **Exit 1:** read the log, fix what you can (usually shorten a line that's too long), and retry once.
  If it still fails, stop and report.
- If the log says **FALLBACK**, a backup episode was used. That's fine; mention it in the report.

## 3. Look at the video before posting
Open `out/$DATE-sheet.png` (one frame every 2 seconds; the last tile is the final frame). Check:
- no text cut off at the edges or overlapping other text
- no text in the top 10% or bottom 20% of the frame (YouTube's buttons cover these areas)
- portal footage shows real content (no error messages, no "0 found", no endless loading)
- the logo looks normal; the last tile is the plain background (seamless loop)
- no typos, no em dashes

If something is wrong, fix `episodes/$DATE.json` and re-run step 2 (at most 2 retries). If it is still wrong,
use the backup: `cp episodes/backup/tips.json` (Monday) or `episodes/backup/myth.json` (Wed/Fri) to
`episodes/$DATE.json`, set its `"date"` to `$DATE`, and re-run step 2.

## 4. Post
```bash
node tools/upload-youtube.mjs "$DATE" --publish-at "${DATE}T18:30:00+05:30"
node tools/upload-instagram.mjs "$DATE" --publish-at "${DATE}T18:30:00+05:30"   # waits until 18:30 IST
```
YouTube is scheduled on YouTube's side (uploaded private, goes public at 18:30 IST).
Instagram can't be scheduled through its API, so the script prepares the Reel and waits. **Run it in the
background** (it can take 30+ minutes) and wait for it to finish. If one platform fails, still try the other.

## 5. Final report (this becomes the email/phone notification)
Keep it short:
- Date, series, topic, and whether a FALLBACK was used (and why)
- YouTube: link + visibility (public / scheduled / stuck private: see README "YouTube audit")
- Instagram: link, or the error
- Anything the owner must do (e.g. "remove VERIFY from 2026-11-30 after checking the Germany facts",
  "Instagram token expired")
