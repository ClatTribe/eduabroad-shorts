#!/usr/bin/env node
/**
 * Renders the day's Instagram Story to out/stories/<date>.png (1080 x 1920). At most one a day:
 *   stories/<date>.json if it exists (tip or word, any day), otherwise by weekday (IST):
 *   Mon, Thu  share today's post (posts/<date>.json, slide 1, rendered first if needed)
 *   Sat       teaser of the SAT Short planned for today in calendar/sat.json
 *   other days: no Story (exit 3)
 *
 *   node tools/render-story.mjs 2026-11-02
 *   node tools/render-story.mjs stories/samples/tip.json        (render a sample)
 *
 * Prints "STORY <type> out/stories/<name>.png" on success. Exit 3 = no Story planned today.
 */
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

const arg = process.argv[2];
if (!arg) {
  console.error("usage: node tools/render-story.mjs YYYY-MM-DD | stories/<file>.json");
  process.exit(2);
}
const readJson = (f) => JSON.parse(readFileSync(f, "utf8"));

let story;
let name;
if (arg.endsWith(".json")) {
  story = readJson(arg);
  name = path.basename(arg, ".json");
} else {
  const date = arg;
  name = date;
  const dow = new Date(`${date}T12:00:00+05:30`).getUTCDay(); // 0 = Sunday
  if (existsSync(`stories/${date}.json`)) {
    story = readJson(`stories/${date}.json`);
  } else if (dow === 1 || dow === 4) {
    const postFile = `posts/${date}.json`;
    if (!existsSync(postFile)) {
      console.log(`NO_STORY: ${postFile} missing, nothing to share`);
      process.exit(3);
    }
    const slide = `out/posts/${date}/slide-1.png`;
    if (!existsSync(slide)) execFileSync("node", ["tools/render-posts.mjs", postFile], { stdio: "inherit" });
    mkdirSync("public/story-tmp", { recursive: true });
    copyFileSync(slide, `public/story-tmp/${date}.png`);
    story = { date, content: { type: "share", image: `story-tmp/${date}.png`, postType: readJson(postFile).content.type }, claims: [] };
  } else if (dow === 6) {
    const item = readJson("calendar/sat.json").items.find((i) => i.date === date);
    if (!item) {
      console.log(`NO_STORY: no SAT Short planned for ${date}`);
      process.exit(3);
    }
    story = { date, content: { type: "sat", spec: readJson(item.sketch) }, claims: [] };
  } else {
    console.log(`NO_STORY: no Story planned on this weekday (${date})`);
    process.exit(3);
  }
}

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const inputProps = { story };
const composition = await selectComposition({
  serveUrl,
  id: "Story",
  inputProps,
  browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE || null,
});
mkdirSync("out/stories", { recursive: true });
const output = `out/stories/${name}.png`;
await renderStill({
  serveUrl,
  composition,
  inputProps,
  output,
  imageFormat: "png",
  browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE || null,
});
console.log(`STORY ${story.content.type} ${output}`);
