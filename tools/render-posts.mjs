#!/usr/bin/env node
/**
 * Renders many posts in one go (bundles once, so it is much faster than render-post.sh per file).
 *   node tools/render-posts.mjs posts/2026-11-02.json posts/2026-11-03.json ...
 *   node tools/render-posts.mjs --preview posts/*.json   (missing live screenshots get a placeholder)
 * Output: out/posts/<name>/slide-1.png, slide-2.png ...
 */
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const PREVIEW = args.includes("--preview");
const files = args.filter((a) => !a.startsWith("--"));
if (!files.length) {
  console.error("usage: node tools/render-posts.mjs [--preview] posts/<file>.json ...");
  process.exit(2);
}
const PLACEHOLDER = "post-shots/live-placeholder.png";
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
let failed = 0;
for (const file of files) {
  const post = JSON.parse(readFileSync(file, "utf8"));
  const c = post.content;
  if (c.type === "feature" && !existsSync(path.join("public", c.screenshot))) {
    if (!PREVIEW) {
      console.log(`SKIP  ${file}: screenshot public/${c.screenshot} missing (film it first)`);
      failed++;
      continue;
    }
    c.screenshot = PLACEHOLDER;
    delete c.screenshotBlur;
  }
  const out = path.join("out/posts", path.basename(file, ".json"));
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const inputProps = { post };
  const composition = await selectComposition({ serveUrl, id: "Post", inputProps, browserExecutable });
  for (let i = 0; i < composition.durationInFrames; i++) {
    await renderStill({
      serveUrl,
      composition,
      inputProps,
      frame: i,
      output: path.join(out, `slide-${i + 1}.png`),
      imageFormat: "png",
      browserExecutable,
    });
  }
  console.log(`RENDERED ${out} (${composition.durationInFrames} slide(s))`);
}
process.exit(failed ? 1 : 0);
