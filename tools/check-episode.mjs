#!/usr/bin/env node
/**
 * Safety checks for an episode before it is rendered and posted.
 * Exits with code 1 and a list of problems if anything is wrong.
 *
 *   node tools/check-episode.mjs episodes/2026-11-04.json
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const file = process.argv[2];
if (!file) {
  console.error("usage: node tools/check-episode.mjs episodes/YYYY-MM-DD.json");
  process.exit(2);
}
const ep = JSON.parse(readFileSync(file, "utf8"));
// --preview: VERIFY claims become warnings (for local previews only; never for posting)
const PREVIEW = process.argv.includes("--preview");
const problems = [];
const warn = [];
const fail = (msg) => problems.push(msg);

// ---------- limits (characters) ----------
const L = {
  hookLine: 18,
  subline: 34,
  chip: 14,
  beatLine: 46,
  speaker: 12,
  punch: 24,
  caption: 34,
  subcaption: 30,
  pill: 20,
  kicker: 18,
  headline: 16,
  proof: 42,
  tipTitle: 40,
  tipDetail: 110,
  myth: 64,
  fact: 48,
  factDetail: 110,
  closing: 24,
  button: 16,
  quizPrompt: 26,
  quizSection: 16,
  passage: 170,
  option: 22,
  whyTitle: 12,
  whyFocus: 20,
  whyPoint: 40,
  ytTitle: 100,
  ytDescription: 4500,
  igCaption: 2200,
};

const COMPETITORS = [
  "leverage edu", "leverageedu", "yocket", "upgrad", "idp", "leap scholar", "leapscholar", "kc overseas",
  "coursefinder.ai", "coursefinder ai", "edvoy", "aecc", "shiksha", "university living", "amberstudent", "gradright", "prodigy finance",
  "mpower", "idfc first", "avanse", "credila", "collegedunia", "galvanize", "manya", "jamboree",
];
const BANNED = [
  /guarantee/i, /guaranteed/i, /100% admission/i, /pakka admit/i, /visa pakka/i, /no\.? ?1\b/i, /number one/i,
  /\bbest in india\b/i, /\bcheapest\b/i,
];

// ---------- collect every on-screen string ----------
const onScreen = []; // [label, text, limit]
const add = (label, text, limit) => {
  if (typeof text !== "string" || !text.trim()) {
    fail(`${label}: missing text`);
    return;
  }
  onScreen.push([label, text, limit]);
};

if (!/^\d{4}-\d{2}-\d{2}$/.test(ep.date ?? "")) fail("date must be YYYY-MM-DD");
if (!file.includes("samples") && path.basename(file, ".json") !== ep.date) fail(`file name must match date (${ep.date}.json)`);
if (!["feature", "tips", "mythfact", "quiz"].includes(ep.template)) fail("template must be feature | tips | mythfact | quiz");
if (!["portal", "seedhi-baat", "myth-fact", "sat"].includes(ep.series)) fail("series must be portal | seedhi-baat | myth-fact | sat");
if (!Number.isInteger(ep.musicSeed)) fail("musicSeed must be a whole number");

const claims0 = Array.isArray(ep.claims) ? ep.claims : [];
const h = ep.hook ?? {};
if (!Array.isArray(h.line1) || !Array.isArray(h.line2)) fail("hook.line1 and hook.line2 must be arrays of words");
else {
  add("hook.line1", h.line1.join(" "), L.hookLine);
  add("hook.line2", h.line2.join(" "), L.hookLine);
  if (![...h.line1, ...h.line2].includes(h.highlight)) fail("hook.highlight must be one of the hook words");
}
add("hook.subline", h.subline, L.subline);
(h.chips ?? []).forEach((c, i) => add(`hook.chips[${i}]`, c, L.chip));

if (ep.template === "feature") {
  const b = ep.build;
  if (!b?.beats?.length || b.beats.length > 3) fail("build.beats: 1 to 3 beats");
  b?.beats?.forEach((x, i) => {
    add(`build.beats[${i}].speaker`, x.speaker, L.speaker);
    add(`build.beats[${i}].line`, x.line, L.beatLine);
  });
  add("build.punchline.line1", b?.punchline?.line1, L.punch);
  add("build.punchline.line2", b?.punchline?.line2, L.punch);
  const r = ep.reveal;
  add("reveal.kicker", r?.kicker, L.kicker);
  add("reveal.headline", r?.headline, L.headline);
  add("reveal.featurePill", r?.featurePill, L.pill);
  if (!r?.clips?.length) fail("reveal.clips: at least one clip");
  r?.clips?.forEach((c, i) => {
    add(`reveal.clips[${i}].caption`, c.caption, L.caption);
    add(`reveal.clips[${i}].subcaption`, c.subcaption, L.subcaption);
    if (!(c.seconds >= 1 && c.seconds <= 5)) fail(`reveal.clips[${i}].seconds must be 1 to 5`);
    if (c.kind === "video" && !existsSync(path.join("public", c.src))) fail(`reveal.clips[${i}].src not found: public/${c.src}`);
    if (c.kind === "card" && typeof c.card === "string" && !["admit-accepted", "admit-rejected"].includes(c.card))
      fail(`reveal.clips[${i}].card: unknown card "${c.card}"`);
  });
  if (!ep.proof?.points?.length || ep.proof.points.length > 3) fail("proof.points: 1 to 3 points");
  ep.proof?.points?.forEach((p, i) => add(`proof.points[${i}]`, p, L.proof));
}
if (ep.template === "tips") {
  const t = ep.tips;
  if (!t?.items || t.items.length < 3 || t.items.length > 5) fail("tips.items: 3 to 5 tips");
  add("tips.seriesLabel", t?.seriesLabel, L.pill);
  t?.items?.forEach((x, i) => {
    add(`tips.items[${i}].title`, x.title, L.tipTitle);
    add(`tips.items[${i}].detail`, x.detail, L.tipDetail);
  });
}
if (ep.template === "mythfact") {
  const m = ep.myths;
  if (!m?.items || m.items.length < 2 || m.items.length > 3) fail("myths.items: 2 or 3 myths");
  add("myths.seriesLabel", m?.seriesLabel, L.pill);
  m?.items?.forEach((x, i) => {
    add(`myths.items[${i}].myth`, x.myth, L.myth);
    add(`myths.items[${i}].fact`, x.fact, L.fact);
    add(`myths.items[${i}].detail`, x.detail, L.factDetail);
  });
}
if (ep.template === "quiz") {
  const q = ep.quiz;
  add("quiz.seriesLabel", q?.seriesLabel, L.pill);
  add("quiz.section", q?.section, L.quizSection);
  add("quiz.prompt", q?.prompt, L.quizPrompt);
  add("quiz.passage", q?.passage, L.passage);
  if ((q?.passage ?? "").split("____").length !== 2) fail('quiz.passage must contain exactly one blank written as "____"');
  if (!Array.isArray(q?.options) || q.options.length !== 4) fail("quiz.options: exactly 4");
  q?.options?.forEach((o, i) => add(`quiz.options[${i}]`, o, L.option));
  if (!Number.isInteger(q?.answer) || q.answer < 0 || q.answer > 3) fail("quiz.answer must be 0 to 3 (A to D)");
  add("quiz.why.title", q?.why?.title, L.whyTitle);
  add("quiz.why.focus", q?.why?.focus, L.whyFocus);
  if (!q?.why?.points?.length || q.why.points.length > 3) fail("quiz.why.points: 1 to 3");
  q?.why?.points?.forEach((x, i) => add(`quiz.why.points[${i}]`, x, L.whyPoint));
  if (!claims0.some((c) => /Study Materials/.test(c.source ?? ""))) fail("quiz must cite the portal Study Materials question it comes from");
}
add("closing.line1", ep.closing?.line1, L.closing);
add("closing.line2", ep.closing?.line2, L.closing);
add("cta.button", ep.cta?.button, L.button);
add("cta.url", ep.cta?.url, 48);
if (ep.cta?.url && !/^app\.goeduabroad\.com(\/[a-z0-9\-/&]*)?$/i.test(ep.cta.url)) fail("cta.url must be on app.goeduabroad.com");

// ---------- upload copy ----------
const yt = ep.youtube ?? {};
const ig = ep.instagram ?? {};
if (!yt.title || yt.title.length > L.ytTitle) fail(`youtube.title: required, max ${L.ytTitle} chars`);
if (!yt.description || yt.description.length > L.ytDescription) fail("youtube.description: required, max 4500 chars");
if (!Array.isArray(yt.tags) || yt.tags.length > 15) fail("youtube.tags: array, max 15");
if (!ig.caption || ig.caption.length > L.igCaption) fail("instagram.caption: required, max 2200 chars");
const igTags = (ig.caption ?? "").match(/#\w+/g) ?? [];
if (igTags.length > 5) warn.push(`instagram.caption has ${igTags.length} hashtags (aim for 5)`);
if (!(ig.caption ?? "").includes("goeduabroad.com")) warn.push("instagram.caption has no app.goeduabroad.com mention");
if (!(yt.description ?? "").includes("app.goeduabroad.com")) fail("youtube.description must include an app.goeduabroad.com link");

// ---------- text rules ----------
// Myth statements are quoted on purpose (then busted), so they skip the risky-claim filter.
const allText = [...onScreen.map(([label, t]) => [label, t]), ["youtube.title", yt.title ?? ""], ["youtube.description", yt.description ?? ""], ["instagram.caption", ig.caption ?? ""]];
for (const [label, text, limit] of onScreen) {
  if (text.length > limit) fail(`${label} is ${text.length} chars (max ${limit}): "${text}"`);
}
allText.forEach(([label, t]) => {
  const isMyth = /\.myth$/.test(label);
  if (/[—–]/.test(t)) fail(`em/en dash found (not allowed): "${t.slice(0, 80)}"`);
  const lower = t.toLowerCase();
  COMPETITORS.forEach((c) => {
    if (new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(lower)) fail(`competitor name "${c}" in: "${t.slice(0, 80)}"`);
  });
  BANNED.forEach((re) => {
    if (!isMyth && re.test(t)) fail(`risky claim ${re} in: "${t.slice(0, 80)}"`);
  });
});

// ---------- claims: every on-screen number must be backed by a listed source ----------
const claims = Array.isArray(ep.claims) ? ep.claims : [];
if (!Array.isArray(ep.claims)) fail("claims: list every factual claim with its source (can be empty for pure advice)");
claims.forEach((c, i) => {
  if (!c.text || !c.source) fail(`claims[${i}] needs text and source`);
  if (/VERIFY/.test(c.source ?? "")) (PREVIEW ? warn.push.bind(warn) : fail)(`claims[${i}] is marked VERIFY: a human must confirm "${c.text}" and edit its source before this can post`);
});
const claimText = claims.map((c) => c.text).join(" | ");
for (const [label, text] of onScreen) {
  if (label.startsWith("hook.chips")) continue; // made-up example profile, labelled as such
  const nums = text.match(/\d[\d,.%+]*/g) ?? [];
  for (const n of nums) {
    if (!claimText.includes(n)) fail(`${label}: number "${n}" is not backed by any entry in claims[]`);
  }
}

// ---------- duration ----------
const T = { question: 10, answer: 3.4, why: 6, hook: 3, beat: 2.2, punchline: 2.4, revealIntro: 1.2, proof: 5, seriesCard: 1.2, tip: 4.2, myth: 2.4, fact: 4.2, closing: 2.6, cta: 3 };
let total = T.hook + T.cta;
if (ep.template === "feature")
  total += (ep.build?.beats?.length ?? 0) * T.beat + T.punchline + T.revealIntro + (ep.reveal?.clips ?? []).reduce((s, c) => s + (c.seconds ?? 0), 0) + T.proof;
if (ep.template === "tips") total += T.seriesCard + (ep.tips?.items?.length ?? 0) * T.tip + T.closing;
if (ep.template === "quiz") total += T.question + T.answer + T.why + T.closing;
if (ep.template === "mythfact") total += T.seriesCard + (ep.myths?.items?.length ?? 0) * (T.myth + T.fact) + T.closing;
if (total < 20 || total > 40) fail(`total length ${total.toFixed(1)}s (keep between 20 and 40s)`);

warn.forEach((w) => console.log(`WARN  ${w}`));
if (problems.length) {
  console.log(`FAIL  ${file}`);
  problems.forEach((p) => console.log(`  - ${p}`));
  process.exit(1);
}
console.log(`PASS  ${file}  (${total.toFixed(1)}s, ${onScreen.length} on-screen lines, ${claims.length} claims)`);
