# EduAbroad Shorts: automatic YouTube Shorts + Instagram Reels

Three Shorts a week, made and posted automatically:

| Day (6:30 PM IST) | Series | What it is |
|---|---|---|
| **Monday** | Seedhi Baat | 3 to 5 quick, practical tips for students and parents |
| **Wednesday** | Portal feature | A real EduAbroad feature, filmed live from app.goeduabroad.com, in the Version 1 style |
| **Friday** | Myth vs Fact | 2 or 3 common myths, stamped "MYTH" and busted |

## How it works

```
calendar/YYYY-MM.json      what posts on which day (topics)
        │
episodes/YYYY-MM-DD.json   the words for one Short (written ahead, or by Claude on the day)
        │  tools/check-episode.mjs   safety checks: no em dashes, no unsourced numbers,
        │                            no competitor names, no "guarantee", text fits the screen
        │  tools/capture-portal.mjs  films the live portal page (Wednesdays)
        │  tools/make_music.py       composes an original, royalty-free track for this episode
        │  Remotion (src/)           renders the 1080 x 1920 video in the EduAbroad brand
        ▼
out/YYYY-MM-DD.mp4  ──►  YouTube Short (scheduled for 18:30 IST)
                    ──►  Instagram Reel (published at 18:30 IST)
```

A **Claude scheduled task** starts a fresh cloud session at 5:50 PM IST every Monday, Wednesday and
Friday. It follows `RUNBOOK.md`: writes the episode if it doesn't exist yet, renders it, looks at the
frames, posts it, and sends you a short summary by email and phone notification.

**Safety net (posting is fully automatic, by your choice):**
- If a portal page doesn't load properly, or an episode fails the safety checks, a **backup episode**
  (`episodes/backup/`) posts instead, so nothing broken or unchecked goes out.
- Any claim marked `VERIFY` blocks that episode from posting until a person confirms it (see below).

## Things you can do without touching code

**Change a topic:** edit `calendar/YYYY-MM.json`. If that date already has an episode file, delete or
edit `episodes/YYYY-MM-DD.json` too (otherwise the old one is used).

**Edit the words of a Short:** open `episodes/YYYY-MM-DD.json` and change the text inside the quotes.
Rules: `WRITING-RULES.md`.

**Confirm a fact marked VERIFY:** episodes 23 Nov (education loan wording) and 30 Nov (Germany fees)
contain claims whose source starts with `VERIFY`. Check the fact; if it's right, replace the word
`VERIFY` in its `source` with where you checked it (e.g. your magazine article link). If it's wrong,
fix the text. Until then, a backup posts on that day instead.

**Pause posting:** in the Claude app, open your scheduled tasks and switch off "EduAbroad Shorts".

**Preview a Short on your computer:** install Node.js, then in this folder:
```
npm install
npm run preview        # opens Remotion Studio; pick the episode in the props panel
bash tools/render.sh 2026-11-09     # renders out/2026-11-09.mp4 (needs Python 3 for the music)
```

## One-time setup (already explained in chat)

The scheduled sessions run in this Claude cloud environment, which needs:

1. **Secrets** (cloud environment settings, as environment variables). They're the same values your
   portal's own automation uses:
   `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`,
   `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID`,
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Instagram needs the video at a public link; it goes in
   your existing public `instagram-videos` bucket).
2. **Allowed domains:** `graph.facebook.com`, `inxxmyjxizswmtxumrop.supabase.co`, `app.goeduabroad.com`
   (YouTube's `googleapis.com` already works).
3. This repository on GitHub, **public**, so the fresh sessions can download it.

### YouTube audit
Google keeps videos uploaded through the API **private** if the Google Cloud project hasn't passed
Google's audit (projects created after July 2020). If your Shorts arrive private, apply for the audit:
Google Cloud Console → YouTube Data API v3 → "API audit and quota extension" form.

### Instagram token
Long-lived Instagram tokens expire after about 60 days. A **System User** token from Meta Business
Settings doesn't expire and avoids sudden failures. The run's report will tell you if the token stops working.

## Files

| Path | What |
|---|---|
| `calendar/` | Month plans (Nov 2026 to Jan 2027 ready) |
| `episodes/` | One JSON per Short; `episodes/backup/` holds the two fallback episodes |
| `src/` | Remotion video templates (feature = Version 1, tips, mythfact) in the EduAbroad brand |
| `public/` | Logo, fonts, sound effects, real portal footage |
| `tools/run-day.sh` | Does the whole day: film, check, render, post |
| `tools/check-episode.mjs` | Safety checks |
| `tools/capture-portal.mjs` + `portal-pages.json` | Films portal pages |
| `tools/make_music.py` | Original music per episode |
| `tools/upload-youtube.mjs`, `tools/upload-instagram.mjs` | Posting (`--dry-run` to test settings) |
| `RUNBOOK.md` | Step-by-step instructions the scheduled Claude session follows |
| `WRITING-RULES.md` | Tone and claims rules for every Short |
