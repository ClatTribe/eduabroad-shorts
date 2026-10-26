#!/usr/bin/env node
/**
 * Uploads a rendered Short to YouTube.
 *
 *   node tools/upload-youtube.mjs 2026-11-04 [--publish-at 2026-11-04T18:30:00+05:30] [--dry-run]
 *   node tools/upload-youtube.mjs sketches/sat-triangle-perimeter-voice.json   (SAT whiteboard Short, English)
 *
 * With --publish-at in the future, the video is uploaded as private and YouTube
 * makes it public at exactly that time. Otherwise it goes public immediately.
 *
 * Needs these environment variables (same names as the portal's existing setup):
 *   YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN
 * The refresh token must have the https://www.googleapis.com/auth/youtube.upload scope, and should also
 * have https://www.googleapis.com/auth/youtube.readonly so the script can confirm the channel before uploading.
 * It only uploads to the channel in YOUTUBE_CHANNEL_HANDLE (default @goeduabroadofficial).
 *
 *   --check     log in and print which channel the token belongs to (uploads nothing)
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
const CHECK = process.argv.includes("--check");
const CHANNEL = (process.env.YOUTUBE_CHANNEL_HANDLE || "@goeduabroadofficial").toLowerCase();

const isSketch = (date ?? "").endsWith(".json");
if (!CHECK && !isSketch && !/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) {
  console.error("usage: node tools/upload-youtube.mjs YYYY-MM-DD|sketches/<file>.json [--publish-at ISO] [--dry-run]");
  process.exit(2);
}
const ep = CHECK && !date?.match(/^\d|\.json$/) ? { youtube: { title: "", description: "" } } : JSON.parse(readFileSync(isSketch ? date : `episodes/${date}.json`, "utf8"));
const file = isSketch ? `out/${ep.id}.mp4` : `out/${date}.mp4`;
const lang = "en"; // all Shorts are in English (since 2026-10-26)
const missing = ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"].filter((k) => !process.env[k]);

const title = ep.youtube.title.slice(0, 100);
const description = (ep.youtube.description.includes("#Shorts") ? ep.youtube.description : `${ep.youtube.description}\n\n#Shorts`).slice(0, 5000);
const future = publishAt && new Date(publishAt).getTime() > Date.now() + 5 * 60 * 1000;
const body = {
  snippet: { title, description, tags: (ep.youtube.tags ?? []).slice(0, 15), categoryId: "27", defaultLanguage: lang, defaultAudioLanguage: lang },
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
if (!CHECK && !existsSync(file)) {
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

/** Which channel the token uploads to. Returns null when the token lacks the youtube.readonly scope. */
async function channelOf(access) {
  const res = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", { headers: { Authorization: `Bearer ${access}` } });
  const data = await res.json();
  if (res.status === 403 && /scope/i.test(data.error?.message ?? "")) return null;
  if (!res.ok) throw new Error(`channel lookup failed (${res.status}): ${data.error?.message ?? ""}`);
  const c = data.items?.[0]?.snippet;
  return c ? { title: c.title, handle: (c.customUrl ?? "").toLowerCase() } : { title: "(no channel)", handle: "" };
}

async function main() {
  const access = await token();
  const ch = await channelOf(access);
  if (CHECK) {
    console.log(ch ? `OK   youtube token belongs to "${ch.title}" ${ch.handle}${ch.handle === CHANNEL ? "" : `  (NOT ${CHANNEL})`}` : "WARN token lacks youtube.readonly, so the channel can't be confirmed");
    process.exit(ch && ch.handle === CHANNEL ? 0 : 1);
  }
  if (!ch) console.log(`WARN can't confirm the channel (token lacks youtube.readonly); uploading anyway`);
  else if (ch.handle !== CHANNEL) throw new Error(`token belongs to "${ch.title}" ${ch.handle}, not ${CHANNEL}. Regenerate the refresh token and pick the right channel.`);
  const video = readFileSync(file);
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
