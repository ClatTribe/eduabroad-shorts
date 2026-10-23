#!/usr/bin/env node
/**
 * Publishes a rendered Short to Instagram as a Reel.
 *
 *   node tools/upload-instagram.mjs 2026-11-04 [--publish-at 2026-11-04T18:30:00+05:30] [--dry-run]
 *
 * Instagram's API cannot schedule, so with --publish-at this script prepares the
 * Reel early and then waits until that time before pressing "publish".
 *
 * Instagram needs the video at a public URL, so it is first hosted for a few
 * minutes: on Cloudinary when CLOUDINARY_* are set (deleted again after posting),
 * otherwise in the portal's public Supabase Storage bucket.
 *
 *   --check   verify token, account and bucket only (posts nothing)
 *
 * Environment variables:
 *   INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_BUSINESS_ACCOUNT_ID
 *   and EITHER  CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET   (preferred)
 *   OR          SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY,
 *               INSTAGRAM_VIDEO_BUCKET (optional, default "instagram-videos")
 *
 *   node tools/upload-instagram.mjs sketches/<file>.json   posts a SAT whiteboard Short
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";

// Two kinds of Instagram token work:
//  - "Instagram Login" tokens (start with IGAA, made in Meta App Dashboard > Instagram > API setup) use graph.instagram.com
//  - "Facebook Login" / system-user tokens (start with EAA) use graph.facebook.com
// INSTAGRAM_BUSINESS_ACCOUNT_ID is the Instagram user ID shown next to the token in either case.
const GRAPH = (process.env.INSTAGRAM_ACCESS_TOKEN ?? "").startsWith("IGAA")
  ? "https://graph.instagram.com/v21.0"
  : "https://graph.facebook.com/v21.0";
const date = process.argv[2];
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const DRY = process.argv.includes("--dry-run");
const publishAt = arg("--publish-at");

const isSketch = (date ?? "").endsWith(".json");
if (!isSketch && !/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) {
  console.error("usage: node tools/upload-instagram.mjs YYYY-MM-DD|sketches/<file>.json [--publish-at ISO] [--dry-run]");
  process.exit(2);
}
const ep = JSON.parse(readFileSync(isSketch ? date : `episodes/${date}.json`, "utf8"));
const file = isSketch ? `out/${ep.id}.mp4` : `out/${date}.mp4`;
const name = isSketch ? ep.id : date;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const BUCKET = process.env.INSTAGRAM_VIDEO_BUCKET || "instagram-videos";
const CLD = {
  cloud: process.env.CLOUDINARY_CLOUD_NAME,
  key: process.env.CLOUDINARY_API_KEY,
  secret: process.env.CLOUDINARY_API_SECRET,
};
const useCloudinary = Boolean(CLD.cloud && CLD.key && CLD.secret);
const env = {
  INSTAGRAM_ACCESS_TOKEN: process.env.INSTAGRAM_ACCESS_TOKEN,
  INSTAGRAM_BUSINESS_ACCOUNT_ID: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
  ...(useCloudinary
    ? {}
    : {
        "CLOUDINARY_* (or SUPABASE_URL)": SUPABASE_URL,
        "CLOUDINARY_* (or SUPABASE_SERVICE_ROLE_KEY)": process.env.SUPABASE_SERVICE_ROLE_KEY,
      }),
};
const missing = Object.entries(env)
  .filter(([, v]) => !v)
  .map(([k]) => k);
const caption = ep.instagram.caption.slice(0, 2200);

if (DRY) {
  console.log(`DRY RUN instagram ${name}`);
  console.log(`  hosting:     ${useCloudinary ? "Cloudinary" : "Supabase Storage"}`);
  console.log(`  file:        ${file} ${existsSync(file) ? `(${(statSync(file).size / 1e6).toFixed(1)} MB)` : "(MISSING)"}`);
  console.log(`  caption:     ${caption.split("\n")[0]} ...`);
  console.log(`  publish:     ${publishAt ?? "immediately"}`);
  console.log(`  env missing: ${missing.length ? missing.join(", ") : "none"}`);
  process.exit(missing.length || !existsSync(file) ? 1 : 0);
}
if (missing.length) {
  console.error(`FAIL missing env: ${missing.join(", ")}`);
  process.exit(1);
}
if (!existsSync(file)) {
  console.error(`FAIL video not found: ${file}`);
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --check: verify the token, the Instagram account and the video bucket. Posts nothing.
if (process.argv.includes("--check")) {
  const ig = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const me = await fetch(`${GRAPH}/${ig}?fields=username,media_count&access_token=${process.env.INSTAGRAM_ACCESS_TOKEN}`).then((r) => r.json());
  if (me.error) {
    console.error(`FAIL instagram token/account: ${me.error.message}`);
    process.exit(1);
  }
  console.log(`OK   instagram account @${me.username} (${me.media_count} posts)`);
  if (useCloudinary) {
    const ping = await fetch(`https://api.cloudinary.com/v1_1/${CLD.cloud}/ping`, {
      headers: { Authorization: `Basic ${Buffer.from(`${CLD.key}:${CLD.secret}`).toString("base64")}` },
    });
    if (!ping.ok) {
      console.error(`FAIL cloudinary (${ping.status}): ${await ping.text()}`);
      process.exit(1);
    }
    console.log(`OK   cloudinary "${CLD.cloud}" reachable`);
    process.exit(0);
  }
  const list = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: "", limit: 1 }),
  });
  if (!list.ok) {
    console.error(`FAIL video bucket "${BUCKET}" (${list.status}): ${await list.text()}`);
    process.exit(1);
  }
  console.log(`OK   video bucket "${BUCKET}" reachable`);
  process.exit(0);
}

async function graph(path, params, method = "POST") {
  const qs = new URLSearchParams({ ...params, access_token: process.env.INSTAGRAM_ACCESS_TOKEN });
  const res = await fetch(`${GRAPH}/${path}${method === "GET" ? `?${qs}` : ""}`, method === "GET" ? {} : { method, body: qs });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(`${path}: ${data.error?.message ?? res.status}`);
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

async function hostOnCloudinary() {
  const params = { folder: "eduabroad-shorts", timestamp: Math.floor(Date.now() / 1000) };
  const form = new FormData();
  form.append("file", new Blob([readFileSync(file)], { type: "video/mp4" }), `${name}.mp4`);
  for (const [k, v] of Object.entries(params)) form.append(k, String(v));
  form.append("api_key", CLD.key);
  form.append("signature", cldSign(params));
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLD.cloud}/video/upload`, { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok || !data.secure_url) throw new Error(`video hosting failed (${res.status}): ${data.error?.message ?? JSON.stringify(data)}`);
  return { url: data.secure_url, publicId: data.public_id };
}

async function removeFromCloudinary(publicId) {
  const params = { public_id: publicId, timestamp: Math.floor(Date.now() / 1000) };
  const form = new URLSearchParams({ ...params, api_key: CLD.key, signature: cldSign(params) });
  await fetch(`https://api.cloudinary.com/v1_1/${CLD.cloud}/video/destroy`, { method: "POST", body: form }).catch(() => {});
}

async function main() {
  // 1. Host the MP4 publicly for Instagram to fetch
  let videoUrl;
  let cloudinaryId;
  if (useCloudinary) {
    ({ url: videoUrl, publicId: cloudinaryId } = await hostOnCloudinary());
  } else {
  const objectPath = `shorts/${name}-${Date.now()}.mp4`;
  const up = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "video/mp4",
      "x-upsert": "true",
    },
    body: readFileSync(file),
  });
  if (!up.ok) throw new Error(`video hosting failed (${up.status}): ${await up.text()}`);
  videoUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;
  }
  console.log(`     hosted at ${videoUrl}`);

  // 2. Create the Reel container and wait for Instagram to process it
  const ig = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const { id: creationId } = await graph(`${ig}/media`, { media_type: "REELS", video_url: videoUrl, caption, share_to_feed: "true" });
  let status = "IN_PROGRESS";
  for (let i = 0; i < 60 && status !== "FINISHED"; i++) {
    await sleep(10000);
    ({ status_code: status } = await graph(creationId, { fields: "status_code" }, "GET"));
    if (status === "ERROR" || status === "EXPIRED") throw new Error(`Instagram could not process the video (status ${status})`);
  }
  if (status !== "FINISHED") throw new Error("Instagram took too long to process the video (10 min)");

  // 3. Wait for the posting time, then publish
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
  // Instagram keeps its own copy once published, so the temporary hosted file can go
  if (cloudinaryId) await removeFromCloudinary(cloudinaryId);
}

main().catch((e) => {
  console.error("FAIL instagram", e.message);
  process.exit(1);
});
