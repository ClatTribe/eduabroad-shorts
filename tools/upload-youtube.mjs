#!/usr/bin/env node
/**
 * Uploads a rendered Short to YouTube.
 *
 *   node tools/upload-youtube.mjs 2026-11-04 [--publish-at 2026-11-04T18:30:00+05:30] [--dry-run]
 *
 * With --publish-at in the future, the video is uploaded as private and YouTube
 * makes it public at exactly that time. Otherwise it goes public immediately.
 *
 * Needs these environment variables (same names as the portal's existing setup):
 *   YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN
 * The refresh token must have the https://www.googleapis.com/auth/youtube.upload scope.
 *
 *   --private   setup test: upload but keep it private (delete it afterwards in YouTube Studio)
 *
 * Note: Google keeps videos uploaded by an UNVERIFIED API project private
 * (even if we ask for public) until the project passes Google's audit.
 */
import { existsSync, readFileSync, statSync } from "node:fs";

const date = process.argv[2];
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const DRY = process.argv.includes("--dry-run");
const publishAt = arg("--publish-at");
const PRIVATE = process.argv.includes("--private"); // setup test: stays private, never goes public

if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) {
  console.error("usage: node tools/upload-youtube.mjs YYYY-MM-DD [--publish-at ISO] [--dry-run]");
  process.exit(2);
}
const ep = JSON.parse(readFileSync(`episodes/${date}.json`, "utf8"));
const file = `out/${date}.mp4`;
const missing = ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"].filter((k) => !process.env[k]);

const title = ep.youtube.title.slice(0, 100);
const description = (ep.youtube.description.includes("#Shorts") ? ep.youtube.description : `${ep.youtube.description}\n\n#Shorts`).slice(0, 5000);
const future = publishAt && new Date(publishAt).getTime() > Date.now() + 5 * 60 * 1000;
const body = {
  snippet: { title, description, tags: (ep.youtube.tags ?? []).slice(0, 15), categoryId: "27", defaultLanguage: "hi", defaultAudioLanguage: "hi" },
  status: {
    privacyStatus: future || PRIVATE ? "private" : "public",
    ...(future && !PRIVATE ? { publishAt: new Date(publishAt).toISOString() } : {}),
    selfDeclaredMadeForKids: false,
    containsSyntheticMedia: false,
  },
};

if (DRY) {
  console.log(`DRY RUN youtube ${date}`);
  console.log(`  file:        ${file} ${existsSync(file) ? `(${(statSync(file).size / 1e6).toFixed(1)} MB)` : "(MISSING)"}`);
  console.log(`  title:       ${title}`);
  console.log(`  visibility:  ${body.status.privacyStatus}${future ? ` until ${body.status.publishAt}` : ""}`);
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

async function token() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.YOUTUBE_CLIENT_ID,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET,
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`YouTube login failed: ${data.error_description ?? data.error ?? res.status}`);
  return data.access_token;
}

async function main() {
  const video = readFileSync(file);
  const access = await token();
  const init = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": "video/mp4",
      "X-Upload-Content-Length": String(video.length),
    },
    body: JSON.stringify(body),
  });
  if (!init.ok) throw new Error(`upload start failed (${init.status}): ${await init.text()}`);
  const url = init.headers.get("location");
  if (!url) throw new Error("YouTube did not return an upload URL");

  const put = await fetch(url, { method: "PUT", headers: { "Content-Type": "video/mp4", "Content-Length": String(video.length) }, body: video });
  const result = await put.json();
  if (!put.ok || !result.id) throw new Error(`upload failed (${put.status}): ${JSON.stringify(result.error ?? result)}`);

  const status = result.status ?? {};
  console.log(`OK   youtube https://youtube.com/shorts/${result.id}`);
  console.log(`     privacy=${status.privacyStatus}${status.publishAt ? ` publishAt=${status.publishAt}` : ""} uploadStatus=${status.uploadStatus}`);
  if (!future && !PRIVATE && status.privacyStatus !== "public") {
    console.log("WARN video is not public. If your Google Cloud project is unverified, YouTube locks API uploads to private until it passes Google's audit.");
  }
}

main().catch((e) => {
  console.error("FAIL youtube", e.message);
  process.exit(1);
});
