# RUNBOOK: the Saturday SAT Short (posts at 18:30 IST on YouTube and Instagram)

You are running unattended. Never push to this repository. If anything looks wrong, don't post; report instead.

## 1. Set up
```bash
DATE=$(TZ=Asia/Kolkata date +%F); DOW=$(TZ=Asia/Kolkata date +%u)   # 6 = Saturday
git clone --depth 1 https://github.com/ClatTribe/eduabroad-shorts.git ~/shorts && cd ~/shorts
npm ci --no-audit --no-fund
export NODE_USE_ENV_PROXY=1 NODE_NO_WARNINGS=1
export REMOTION_BROWSER_EXECUTABLE=$(find /opt/pw-browsers -maxdepth 3 -type f \( -name headless_shell -o -name chrome-headless-shell \) | head -1)
```
If `DOW` is not 6, stop and reply "Not a SAT day".

## 2. Render (no upload yet)
```bash
bash tools/sat-day.sh "$DATE" --no-upload
```
- **Exit 3 (NO_SKETCH):** nothing is planned in `calendar/sat.json` for today. Do NOT write a new one (the narration
  needs a voice model this session doesn't have). Stop and report "No SAT Short planned for $DATE: add more to
  calendar/sat.json".
- **Exit 1:** stop and report the error.

## 3. Look at the video
Open `out/<id>-sheet.png` (a frame every 3 seconds, last tile = final frame). Check: nothing cut off at the edges,
no overlapping text, the maths on screen is correct, the end card shows "Follow", the EduAbroad logo and
"for more SAT tricks". If anything is wrong, stop and report.

## 4. Post
```bash
SPEC=$(node -e "console.log(require('./calendar/sat.json').items.find(x=>x.date==='$DATE').sketch)")
node tools/upload-youtube.mjs "$SPEC" --publish-at "${DATE}T18:30:00+05:30"
node tools/upload-instagram.mjs "$SPEC" --publish-at "${DATE}T18:30:00+05:30"   # waits until 18:30 IST
```
The YouTube uploader refuses to post unless the token belongs to @goeduabroadofficial. Run the Instagram step in the
background and wait for it. If one platform fails, still try the other.

## 5. Final report
Date, topic, YouTube link and visibility, Instagram link (or the errors), and how many planned SAT Shorts are left
in `calendar/sat.json` after today (warn the owner when 2 or fewer remain).
