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
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const GRAPH = (process.env.INSTAGRAM_ACCESS_TOKEN ?? "").startsWith("IGAA")
  ? "https://graph.instagram.com/v21.0"
  : "https://graph.facebook.com/v21.0";
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
const CLD = { cloud: process.env.CLOUDINARY_CLOUD_NAME, key: process.env.CLOUDINARY_API_KEY, secret: process.env.CLOUDINARY_API_SECRET };
const missing = ["INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_BUSINESS_ACCOUNT_ID", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"].filter(
  (k) => !process.env[k],
);

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function graph(p, params, method = "POST") {
  const qs = new URLSearchParams({ ...params, access_token: process.env.INSTAGRAM_ACCESS_TOKEN });
  const res = await fetch(`${GRAPH}/${p}${method === "GET" ? `?${qs}` : ""}`, method === "GET" ? {} : { method, body: qs });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(`${p}: ${data.error?.message ?? res.status}`);
  return data;
}

// Cloudinary signed requests: sha1 of the sorted params + the API secret
const cldSign = (params) =>
  createHash("sha1")
    .update(
      Object.keys(params)
        .sort()
        .map((k) => `${k}=${params[k]}`)
        .join("&") + CLD.secret,
    )
    .digest("hex");

async function hostAsJpeg(slide) {
  const params = { folder: "eduabroad-posts", format: "jpg", timestamp: Math.floor(Date.now() / 1000) };
  const form = new FormData();
  form.append("file", new Blob([readFileSync(slide)], { type: "image/png" }), path.basename(slide));
  for (const [k, v] of Object.entries(params)) form.append(k, String(v));
  form.append("api_key", CLD.key);
  form.append("signature", cldSign(params));
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLD.cloud}/image/upload`, { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok || !data.secure_url) throw new Error(`image hosting failed (${res.status}): ${data.error?.message ?? JSON.stringify(data)}`);
  return { url: data.secure_url, publicId: data.public_id };
}

async function removeFromCloudinary(publicId) {
  const params = { public_id: publicId, timestamp: Math.floor(Date.now() / 1000) };
  const form = new URLSearchParams({ ...params, api_key: CLD.key, signature: cldSign(params) });
  await fetch(`https://api.cloudinary.com/v1_1/${CLD.cloud}/image/destroy`, { method: "POST", body: form }).catch(() => {});
}

async function waitReady(containerId) {
  for (let i = 0; i < 30; i++) {
    const { status_code: status } = await graph(containerId, { fields: "status_code" }, "GET");
    if (status === "FINISHED") return;
    if (status === "ERROR" || status === "EXPIRED") throw new Error(`Instagram could not process the image (status ${status})`);
    await sleep(5000);
  }
  throw new Error("Instagram took too long to process the post");
}

async function main() {
  const ig = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const hosted = [];
  try {
    for (const s of slides) hosted.push(await hostAsJpeg(s));
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

    if (publishAt) {
      const wait = new Date(publishAt).getTime() - Date.now();
      if (wait > 0) {
        console.log(`     ready; waiting ${Math.round(wait / 60000)} min until ${publishAt}`);
        await sleep(wait);
      }
    }
    const { id: mediaId } = await graph(`${ig}/media_publish`, { creation_id: creationId });
    const { permalink } = await graph(mediaId, { fields: "permalink" }, "GET").catch(() => ({}));
    console.log(`OK   instagram ${permalink ?? `media ${mediaId}`}`);
  } finally {
    // Instagram keeps its own copy once published (and a failed post doesn't need them), so the hosted files can go
    for (const h of hosted) await removeFromCloudinary(h.publicId);
  }
}

main().catch((e) => {
  console.error("FAIL instagram post", e.message);
  process.exit(1);
});
