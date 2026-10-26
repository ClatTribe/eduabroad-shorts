# Writing rules for EduAbroad Shorts

These rules apply to every episode, whether a person or the scheduled Claude session writes it.
`node tools/check-episode.mjs` enforces the mechanical ones; the rest need judgement.

## Voice
- Warm, conversational, like a friend or a slightly older cousin giving advice. Not corporate, not salesy.
- Audience: Indian students and their parents exploring study abroad.
- **English only** (since 26 Oct 2026; no Hinglish, no Hindi words, no Devanagari). Simple, warm Indian English
  that a 17-year-old and their parents both follow easily ("Stop guessing. Check the data.").
- Short lines. Big text on a phone fits about 14 to 18 characters per line.
- **Never use em dashes (—) or en dashes (–)** anywhere: on screen, titles, descriptions, captions.
- Must not read as AI-written: no "Unlock your potential", "In today's world", "Let's dive in", "game-changer",
  no rhetorical triple-adjective lists, no exclamation-mark spam.

## Claims (most important)
- Only use claims that appear on the portal itself, or general advice that contains no statistics.
- **Never invent numbers.** Every number shown on screen must be listed in `claims[]` with its source
  (the checker blocks the episode otherwise). Counting items in the video ("4 things") is fine.
- Never name competitors. Never promise outcomes ("guarantee", "sure admit", "visa guaranteed").
- Rules that change or differ by country (visa rules, work-hour limits, PR, fees, deadlines, loan rates):
  keep it general ("check the current rules first"). If a specific fact is truly needed, add it to `claims[]` with a
  source starting with `VERIFY` and **it will not post** until a human confirms it and edits the source.
- Portal features: only describe what is visible on the live page. Do not film or quote the IELTS Band
  Predictor tab (it shows unverified accuracy claims).
- Do not use "free" unless the page says so. Safe today: Admit Finder (public), IELTS kit
  ("IELTS FREE LEARNING RESOURCES"). Free mock test needs sign-up; say so in the description.
- Real student data (admit cards) is shown as-is from the portal, with the undergrad college blurred
  on close-ups. Never invent a student, a score, or a result.
- The question-hook chips are a made-up example profile ("CGPA 7.4"), which is allowed because they're
  framed as the viewer's own worry, never as a real person.

## The three series
| Day | Series | `template` | Shape |
|---|---|---|---|
| Monday | Straight Talk (`seedhi-baat`, label "Straight Talk") | `tips` | Question hook, then 3 to 5 numbered tips (title + one-line detail), closing line, CTA |
| Wednesday | Portal feature (`portal`) | `feature` | Version 1 structure: question hook with chips, 3 opinion beats + punchline, crimson reveal with real portal footage, 2 to 3 proof ticks, closing line, CTA |
| Friday | Myth vs Fact (`myth-fact`) | `mythfact` | "Myth or Fact?" hook, 2 or 3 myths each busted by a fact + one-line detail, closing line, CTA |

Copy an existing episode of the same template as your starting point.

## Fields worth knowing
- `musicSeed`: any whole number. Use the date digits (e.g. 1209 for 9 Dec) so every episode sounds different.
- `hook.highlight`: one word from the hook that gets the crimson gradient (usually the last, e.g. "enough?").
- `requiresCapture` (portal episodes): feature names from `tools/portal-pages.json`; footage is filmed fresh
  on the day and referenced as `footage/<feature>/<clip>.mp4`.
- `cta.url`: must be on app.goeduabroad.com. Point to the feature page when there is one.
- `youtube.description`: must include an app.goeduabroad.com link; end with the EduAbroad sign-off line.
- `instagram.caption`: 5 hashtags max, mention app.goeduabroad.com (link in bio).

## SAT Solve-it Shorts (whiteboard style, final format)
Files: `sketches/<name>.json`, rendered with `bash tools/render-sketch.sh sketches/<name>.json`.
Copy `sketches/sat-triangle-perimeter-voice.json` as the starting point.

- English only (no Hinglish). Calm tutor tone, short sentences.
- Every question comes from a portal Study Materials PDF. Cite the PDF and question number in `claims[]`.
  Check the question against the rendered PDF page (text extraction scrambles maths).
- Only use questions whose answer is proved on screen (maths), or that have an answer key. No guessed answers.
- Figures are redrawn to scale with `poly`, `right-angle` and `line` items; label sides with `text` items.
- Colour-code what the steps find (blue, then green) and colour the matching side or term in the figure.
- Voice: `"voice": {"name": "af_heart", "speed": 1.08, "lines": [...]}`. Each line says only what is on screen.
  `tools/make_sketch_voice.py` warns when a line runs into the next; leave about 0.3 s between lines and
  time each drawing step to the word that names it (e.g. the "8" appears on "eight").
- Writing sounds are automatic and sit very low under the voice. The answer gets a `ding` in `sfx`.
- Structure: "Try solving this in 30 seconds." → question (+ figure) → options → "Pause & comment your answer!"
  → 2 to 4 steps → "Answer: X" boxed → "Follow" + EduAbroad logo + "for more SAT tricks". About 30 to 35 s.
