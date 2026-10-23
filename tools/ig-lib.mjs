/**
 * Shared helpers for posting images to Instagram (feed posts and Stories).
 * Instagram fetches images from a public URL and only takes JPEG, so each image is hosted on
 * Cloudinary as a JPEG for a few minutes and deleted again afterwards.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

export const GRAPH = (process.env.INSTAGRAM_ACCESS_TOKEN ?? "").startsWith("IGAA")
  ? "https://graph.instagram.com/v21.0"
  : "https://graph.facebook.com/v21.0";
const CLD = { cloud: process.env.CLOUDINARY_CLOUD_NAME, key: process.env.CLOUDINARY_API_KEY, secret: process.env.CLOUDINARY_API_SECRET };

export const REQUIRED_ENV = ["INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_BUSINESS_ACCOUNT_ID", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function graph(p, params, method = "POST") {
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

export async function hostAsJpeg(file, folder) {
  const params = { folder, format: "jpg", timestamp: Math.floor(Date.now() / 1000) };
  const form = new FormData();
  form.append("file", new Blob([readFileSync(file)], { type: "image/png" }), path.basename(file));
  for (const [k, v] of Object.entries(params)) form.append(k, String(v));
  form.append("api_key", CLD.key);
  form.append("signature", cldSign(params));
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLD.cloud}/image/upload`, { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok || !data.secure_url) throw new Error(`image hosting failed (${res.status}): ${data.error?.message ?? JSON.stringify(data)}`);
  return { url: data.secure_url, publicId: data.public_id };
}

export async function removeFromCloudinary(publicId) {
  const params = { public_id: publicId, timestamp: Math.floor(Date.now() / 1000) };
  const form = new URLSearchParams({ ...params, api_key: CLD.key, signature: cldSign(params) });
  await fetch(`https://api.cloudinary.com/v1_1/${CLD.cloud}/image/destroy`, { method: "POST", body: form }).catch(() => {});
}

export async function waitReady(containerId) {
  for (let i = 0; i < 30; i++) {
    const { status_code: status } = await graph(containerId, { fields: "status_code" }, "GET");
    if (status === "FINISHED") return;
    if (status === "ERROR" || status === "EXPIRED") throw new Error(`Instagram could not process the image (status ${status})`);
    await sleep(5000);
  }
  throw new Error("Instagram took too long to process the image");
}

/** Waits until `publishAt` (ISO time), if it's in the future. */
export async function waitUntil(publishAt) {
  if (!publishAt) return;
  const wait = new Date(publishAt).getTime() - Date.now();
  if (wait > 0) {
    console.log(`     ready; waiting ${Math.round(wait / 60000)} min until ${publishAt}`);
    await sleep(wait);
  }
}

/** Publishes a prepared container and returns its permalink (Stories have none; their media id is returned). */
export async function publish(creationId) {
  const { id: mediaId } = await graph(`${process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID}/media_publish`, { creation_id: creationId });
  const { permalink } = await graph(mediaId, { fields: "permalink" }, "GET").catch(() => ({}));
  return permalink ?? `media ${mediaId}`;
}
