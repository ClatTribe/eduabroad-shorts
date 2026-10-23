#!/usr/bin/env node
/**
 * Publishes a rendered social post (out/posts/<name>/slide-*.png) to Instagram:
 * one slide = a single image post, several slides = a carousel.
 *
 *   node tools/upload-post-instagram.mjs posts/2026-11-02.json [--publish-at 2026-11-02T13:00:00+05:30] [--dry-run]
 *
 * Instagram fetches images from a public URL and only takes JPEG, so each slide is hosted on
 * Cloudinary as a JPEG for a few minutes and deleted again once the post is live.
 * Instagram's API cannot schedule, so with --publish-at the script prepares the post and waits.
 *
 * Environment variables: INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_BUSINESS_ACCOUNT_ID,
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { graph, hostAsJpeg, publish, removeFromCloudinary, REQUIRED_ENV, waitReady, waitUntil } from "./ig-lib.mjs";

const file = process.argv[2];
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const DRY = process.argv.includes("--dry-run");
const publishAt = arg("--publish-at");
if (!file?.endsWith(".json")) {
  console.error("usage: node tools/upload-post-instagram.mjs posts/<file>.json [--publish-at ISO] [--dry-run]");
  process.exit(2);
}

const post = JSON.parse(readFileSync(file, "utf8"));
const dir = path.join("out/posts", path.basename(file, ".json"));
const slides = existsSync(dir)
  ? readdirSync(dir)
      .filter((f) => /^slide-\d+\.png$/.test(f))
      .sort((a, b) => parseInt(a.slice(6)) - parseInt(b.slice(6)))
      .map((f) => path.join(dir, f))
  : [];
const caption = post.caption.slice(0, 2200);
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);

if (DRY) {
  console.log(`DRY RUN instagram post ${file}`);
  console.log(`  slides:      ${slides.length ? `${slides.length} (${slides.length > 1 ? "carousel" : "single image"})` : `NONE in ${dir} (render it first)`}`);
  console.log(`  caption:     ${caption.split("\n")[0]} ...`);
  console.log(`  publish:     ${publishAt ?? "immediately"}`);
  console.log(`  env missing: ${missing.length ? missing.join(", ") : "none"}`);
  process.exit(missing.length || !slides.length ? 1 : 0);
}
if (missing.length) {
  console.error(`FAIL missing env: ${missing.join(", ")}`);
  process.exit(1);
}
if (!slides.length || slides.length > 10) {
  console.error(`FAIL need 1 to 10 slides in ${dir}, found ${slides.length}`);
  process.exit(1);
}

async function main() {
  const ig = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const hosted = [];
  try {
    for (const s of slides) hosted.push(await hostAsJpeg(s, "eduabroad-posts"));
    console.log(`     hosted ${hosted.length} slide(s) as JPEG`);

    let creationId;
    if (hosted.length === 1) {
      ({ id: creationId } = await graph(`${ig}/media`, { image_url: hosted[0].url, caption }));
    } else {
      const children = [];
      for (const h of hosted) {
        const { id } = await graph(`${ig}/media`, { image_url: h.url, is_carousel_item: "true" });
        await waitReady(id);
        children.push(id);
      }
      ({ id: creationId } = await graph(`${ig}/media`, { media_type: "CAROUSEL", children: children.join(","), caption }));
    }
    await waitReady(creationId);

    await waitUntil(publishAt);
    console.log(`OK   instagram ${await publish(creationId)}`);
  } finally {
    // Instagram keeps its own copy once published (and a failed post doesn't need them), so the hosted files can go
    for (const h of hosted) await removeFromCloudinary(h.publicId);
  }
}

main().catch((e) => {
  console.error("FAIL instagram post", e.message);
  process.exit(1);
});
