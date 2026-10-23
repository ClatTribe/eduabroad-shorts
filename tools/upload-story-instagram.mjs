#!/usr/bin/env node
/**
 * Publishes a rendered Story image (out/stories/<date>.png) to Instagram Stories.
 *
 *   node tools/upload-story-instagram.mjs out/stories/2026-11-02.png [--publish-at 2026-11-02T13:30:00+05:30] [--dry-run]
 *
 * Instagram's API can't schedule or add stickers, so the script prepares the Story and waits until --publish-at.
 * Environment variables: INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_BUSINESS_ACCOUNT_ID, CLOUDINARY_* (see ig-lib.mjs)
 */
import { existsSync } from "node:fs";
import { graph, hostAsJpeg, publish, removeFromCloudinary, REQUIRED_ENV, waitReady, waitUntil } from "./ig-lib.mjs";

const file = process.argv[2];
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const publishAt = arg("--publish-at");
if (!file?.endsWith(".png")) {
  console.error("usage: node tools/upload-story-instagram.mjs out/stories/<date>.png [--publish-at ISO] [--dry-run]");
  process.exit(2);
}
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (process.argv.includes("--dry-run")) {
  console.log(`DRY RUN instagram story ${file} ${existsSync(file) ? "" : "(MISSING)"}`);
  console.log(`  publish:     ${publishAt ?? "immediately"}`);
  console.log(`  env missing: ${missing.length ? missing.join(", ") : "none"}`);
  process.exit(missing.length || !existsSync(file) ? 1 : 0);
}
if (missing.length || !existsSync(file)) {
  console.error(`FAIL ${missing.length ? `missing env: ${missing.join(", ")}` : `not found: ${file}`}`);
  process.exit(1);
}

const hosted = await hostAsJpeg(file, "eduabroad-stories").catch((e) => {
  console.error("FAIL instagram story", e.message);
  process.exit(1);
});
try {
  const { id } = await graph(`${process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID}/media`, { media_type: "STORIES", image_url: hosted.url });
  await waitReady(id);
  await waitUntil(publishAt);
  console.log(`OK   instagram story ${await publish(id)}`);
} catch (e) {
  console.error("FAIL instagram story", e.message);
  process.exitCode = 1;
} finally {
  await removeFromCloudinary(hosted.publicId);
}
