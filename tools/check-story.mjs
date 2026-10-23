#!/usr/bin/env node
/**
 * Safety checks for a written Story (stories/YYYY-MM-DD.json: tip or word) before it is rendered and posted.
 * Same rules as the posts (see check-post.mjs and WRITING-RULES.md), with limits sized to the Story layout.
 *
 *   node tools/check-story.mjs stories/2026-10-27.json
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const file = process.argv[2];
if (!file) {
  console.error("usage: node tools/check-story.mjs stories/YYYY-MM-DD.json");
  process.exit(2);
}
const story = JSON.parse(readFileSync(file, "utf8"));
const c = story.content ?? {};
const problems = [];
const fail = (msg) => problems.push(msg);
const L = { title: 24, highlight: 22, point: 52, word: 12, pos: 10, meaning: 32, synonym: 14, example: 75 };

// same lists as check-post.mjs
const COMPETITORS = [
  "leverage edu", "leverageedu", "yocket", "upgrad", "idp", "leap scholar", "leapscholar", "kc overseas",
  "coursefinder.ai", "coursefinder ai", "edvoy", "aecc", "shiksha", "university living", "amberstudent", "gradright", "prodigy finance",
  "mpower", "idfc first", "avanse", "credila", "collegedunia", "galvanize", "manya", "jamboree",
];
const BANNED = [
  /guarantee/i, /guaranteed/i, /100% admission/i, /pakka admit/i, /admit pakka/i, /visa pakka/i, /job pakki/i,
  /no\.? ?1\b/i, /number one/i, /\bbest in india\b/i, /\bcheapest\b/i, /best rates/i,
];

const onScreen = [];
const add = (label, text, limit) => {
  if (typeof text !== "string" || !text.trim()) return fail(`${label}: missing text`);
  onScreen.push([label, text]);
  if (text.length > limit) fail(`${label} is ${text.length} chars (max ${limit}): "${text}"`);
};

if (!/^\d{4}-\d{2}-\d{2}$/.test(story.date ?? "")) fail("date must be YYYY-MM-DD");
if (path.basename(file, ".json") !== story.date) fail(`file name must match date (${story.date}.json)`);
switch (c.type) {
  case "tip":
    add("title", c.title, L.title);
    add("highlight", c.highlight, L.highlight);
    if (!Array.isArray(c.points) || c.points.length !== 3) fail("points: exactly 3");
    (c.points ?? []).forEach((p, i) => add(`points[${i}]`, p, L.point));
    break;
  case "word":
    add("word", c.word, L.word);
    add("partOfSpeech", c.partOfSpeech, L.pos);
    add("meaning", c.meaning, L.meaning);
    if (!Array.isArray(c.synonyms) || c.synonyms.length !== 3) fail("synonyms: exactly 3");
    (c.synonyms ?? []).forEach((s, i) => add(`synonyms[${i}]`, s, L.synonym));
    add("example", c.example, L.example);
    if (!story.claims?.some((x) => x.text.startsWith(c.word))) fail("word must cite where the word and synonyms come from");
    break;
  default:
    fail("content.type must be tip | word (share and sat Stories are made automatically)");
}

for (const [label, t] of onScreen) {
  if (/[—–]/.test(t)) fail(`em/en dash found (not allowed) in ${label}: "${t}"`);
  const lower = t.toLowerCase();
  COMPETITORS.forEach((x) => new RegExp(`\\b${x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(lower) && fail(`competitor name "${x}" in ${label}`));
  BANNED.forEach((re) => re.test(t) && fail(`risky claim ${re} in ${label}: "${t}"`));
}
const claims = Array.isArray(story.claims) ? story.claims : [];
if (!Array.isArray(story.claims)) fail("claims: list every factual claim with its source (can be empty for pure advice)");
const claimText = claims.map((x) => x.text).join(" | ");
for (const [label, text] of onScreen) {
  for (const n of text.match(/\d[\d,.%+]*/g) ?? []) {
    const num = n.replace(/[.,]$/, "");
    if (!claimText.includes(num)) fail(`${label}: number "${num}" is not backed by any entry in claims[]`);
  }
}

if (problems.length) {
  console.log(`FAIL  ${file}`);
  problems.forEach((p) => console.log(`  - ${p}`));
  process.exit(1);
}
console.log(`PASS  ${file}  (${c.type}, ${onScreen.length} on-screen lines, ${claims.length} claims)`);
