#!/usr/bin/env node
/**
 * Safety checks for a social post before it is rendered and posted.
 * Same rules as the Shorts (WRITING-RULES.md), with limits sized to the post slides.
 * Exits with code 1 and a list of problems if anything is wrong.
 *
 *   node tools/check-post.mjs posts/2026-11-02.json
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const file = process.argv[2];
if (!file) {
  console.error("usage: node tools/check-post.mjs posts/YYYY-MM-DD.json");
  process.exit(2);
}
const post = JSON.parse(readFileSync(file, "utf8"));
const c = post.content ?? {};
const problems = [];
const warn = [];
const fail = (msg) => problems.push(msg);

// ---------- limits (characters) ----------
const L = {
  title: 26, highlight: 26, subtitle: 80, stepTitle: 26, stepDetail: 115, tip: 75, saveLine: 30,
  university: 44, course: 32, intake: 14, major: 10, statLabel: 8, statValue: 10, takeaway: 95,
  feature: 20, promise: 30, shotCaption: 32, benefit: 40, howTo: 44, button: 14,
  vsTitle: 22, vsHighlight: 24, side: 14, rowLabel: 12, cell: 36, bottomLine: 100,
  myth: 50, fact: 34, mythDetail: 120,
  word: 12, pos: 10, meaning: 34, synonym: 14, example: 80,
  label: 30, question: 44, closing: 18,
  igCaption: 2200,
};

const COMPETITORS = [
  "leverage edu", "leverageedu", "yocket", "upgrad", "idp", "leap scholar", "leapscholar", "kc overseas",
  "coursefinder.ai", "coursefinder ai", "edvoy", "aecc", "shiksha", "university living", "amberstudent", "gradright", "prodigy finance",
  "mpower", "idfc first", "avanse", "credila", "collegedunia", "galvanize", "manya", "jamboree",
];
const BANNED = [
  /guarantee/i, /guaranteed/i, /100% admission/i, /pakka admit/i, /admit pakka/i, /visa pakka/i, /job pakki/i,
  /no\.? ?1\b/i, /number one/i, /\bbest in india\b/i, /\bcheapest\b/i, /best rates/i,
];

const onScreen = []; // [label, text, limit]
const add = (label, text, limit) => {
  if (typeof text !== "string" || !text.trim()) return fail(`${label}: missing text`);
  onScreen.push([label, text, limit]);
};
const steps = (label, list, min, max) => {
  if (!Array.isArray(list) || list.length < min || list.length > max) return fail(`${label}: ${min} to ${max} items`);
  list.forEach((s, i) => {
    add(`${label}[${i}].title`, s.title, L.stepTitle);
    add(`${label}[${i}].detail`, s.detail, L.stepDetail);
    if (s.tip !== undefined) add(`${label}[${i}].tip`, s.tip, L.tip);
  });
};

if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date ?? "")) fail("date must be YYYY-MM-DD");
if (!file.includes("samples") && path.basename(file, ".json") !== post.date) fail(`file name must match date (${post.date}.json)`);

switch (c.type) {
  case "checklist":
    add("title", c.title, L.title);
    add("highlight", c.highlight, L.highlight);
    add("subtitle", c.subtitle, L.subtitle);
    steps("steps", c.steps, 3, 5);
    add("saveLine", c.saveLine, L.saveLine);
    break;
  case "admit-guess":
    add("university", c.university, L.university);
    add("course", c.course, L.course);
    add("intake", c.intake, L.intake);
    if (c.major !== undefined) add("major", c.major, L.major);
    if (!Array.isArray(c.stats) || c.stats.length < 1 || c.stats.length > 2) fail("stats: 1 or 2 items");
    (c.stats ?? []).forEach((s, i) => {
      add(`stats[${i}].label`, s.label, L.statLabel);
      add(`stats[${i}].value`, s.value, L.statValue);
    });
    if (!["Accepted", "Rejected"].includes(c.result)) fail("result must be Accepted or Rejected");
    add("takeaway", c.takeaway, L.takeaway);
    if (!post.claims?.some((x) => /Admit Finder/.test(x.source ?? "") && x.text.includes(c.university)))
      fail("admit-guess must cite the real Admit Finder card (claims[].text with the university, source mentioning Admit Finder)");
    break;
  case "feature": {
    add("feature", c.feature, L.feature);
    add("promise", c.promise, L.promise);
    add("screenshotCaption", c.screenshotCaption, L.shotCaption);
    if (!Array.isArray(c.benefits) || c.benefits.length !== 3) fail("benefits: exactly 3");
    (c.benefits ?? []).forEach((b, i) => add(`benefits[${i}]`, b, L.benefit));
    if (!Array.isArray(c.howTo) || c.howTo.length !== 3) fail("howTo: exactly 3");
    (c.howTo ?? []).forEach((h, i) => add(`howTo[${i}]`, h, L.howTo));
    add("button", c.button, L.button);
    if (!/^app\.goeduabroad\.com(\/[a-z0-9\-/&]*)?$/i.test(c.url ?? "")) fail("url must be on app.goeduabroad.com");
    const shot = path.join("public", c.screenshot ?? "");
    if (!existsSync(shot)) {
      if (c.capture) warn.push(`screenshot ${shot} not there yet (filmed on the day from ${c.capture.feature}/${c.capture.clip})`);
      else fail(`screenshot not found: ${shot}`);
    }
    if (/free/i.test(c.button) && !/admit-finder|ielts/.test(c.url)) fail(`button says free but only Admit Finder and the IELTS kit are confirmed free`);
    break;
  }
  case "versus":
    add("title", c.title, L.vsTitle);
    add("highlight", c.highlight, L.vsHighlight);
    add("left", c.left, L.side);
    add("right", c.right, L.side);
    if (!Array.isArray(c.rows) || c.rows.length < 3 || c.rows.length > 4) fail("rows: 3 or 4");
    (c.rows ?? []).forEach((r, i) => {
      add(`rows[${i}].label`, r.label, L.rowLabel);
      add(`rows[${i}].left`, r.left, L.cell);
      add(`rows[${i}].right`, r.right, L.cell);
    });
    add("bottomLine", c.bottomLine, L.bottomLine);
    break;
  case "myth":
    add("myth", c.myth, L.myth);
    add("fact", c.fact, L.fact);
    add("detail", c.detail, L.mythDetail);
    break;
  case "word":
    add("word", c.word, L.word);
    add("partOfSpeech", c.partOfSpeech, L.pos);
    add("meaning", c.meaning, L.meaning);
    if (!Array.isArray(c.synonyms) || c.synonyms.length !== 3) fail("synonyms: exactly 3 (as on the portal flashcard)");
    (c.synonyms ?? []).forEach((s, i) => add(`synonyms[${i}]`, s, L.synonym));
    add("example", c.example, L.example);
    if (!post.claims?.some((x) => /Flashcards/.test(x.source ?? "") && x.text.startsWith(c.word)))
      fail("word must cite the IELTS kit flashcard it comes from");
    break;
  case "parents":
    add("label", c.label, L.label);
    add("question", c.question, L.question);
    steps("answers", c.answers, 3, 3);
    add("closing", c.closing, L.closing);
    break;
  default:
    fail("content.type must be checklist | admit-guess | feature | versus | myth | word | parents");
}

// ---------- caption ----------
const cap = post.caption ?? "";
if (!cap || cap.length > L.igCaption) fail(`caption: required, max ${L.igCaption} chars`);
const tags = cap.match(/#\w+/g) ?? [];
if (tags.length > 5) fail(`caption has ${tags.length} hashtags (max 5)`);
if (!cap.includes("goeduabroad.com")) warn.push("caption has no app.goeduabroad.com mention");

// ---------- text rules ----------
for (const [label, text, limit] of onScreen) {
  if (text.length > limit) fail(`${label} is ${text.length} chars (max ${limit}): "${text}"`);
}
const allText = [...onScreen.map(([l, t]) => [l, t]), ["caption", cap]];
allText.forEach(([label, t]) => {
  // the myth itself is quoted on purpose (then busted); so is the "Myth:" line of the caption
  const quotedMyth = label === "myth";
  const checkable = label === "caption" ? t.replace(/^Myth:.*$/m, "") : t;
  if (/[—–]/.test(t)) fail(`em/en dash found (not allowed) in ${label}: "${t.slice(0, 80)}"`);
  const lower = t.toLowerCase();
  COMPETITORS.forEach((x) => {
    if (new RegExp(`\\b${x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(lower)) fail(`competitor name "${x}" in ${label}`);
  });
  if (!quotedMyth) BANNED.forEach((re) => re.test(checkable) && fail(`risky claim ${re} in ${label}: "${t.slice(0, 80)}"`));
});

// ---------- claims: every on-screen number must be backed by a listed source ----------
const claims = Array.isArray(post.claims) ? post.claims : [];
if (!Array.isArray(post.claims)) fail("claims: list every factual claim with its source (can be empty for pure advice)");
claims.forEach((x, i) => {
  if (!x.text || !x.source) fail(`claims[${i}] needs text and source`);
  if (/VERIFY/.test(x.source ?? "")) fail(`claims[${i}] is marked VERIFY: a human must confirm "${x.text}" before this can post`);
});
const claimText = claims.map((x) => x.text).join(" | ");
for (const [label, text] of onScreen) {
  for (const n of text.match(/\d[\d,.%+]*/g) ?? []) {
    const num = n.replace(/[.,]$/, "");
    if (!claimText.includes(num)) fail(`${label}: number "${num}" is not backed by any entry in claims[]`);
  }
}

warn.forEach((w) => console.log(`WARN  ${w}`));
if (problems.length) {
  console.log(`FAIL  ${file}`);
  problems.forEach((p) => console.log(`  - ${p}`));
  process.exit(1);
}
console.log(`PASS  ${file}  (${c.type}, ${onScreen.length} on-screen lines, ${claims.length} claims)`);
