#!/usr/bin/env node
/**
 * Films a live portal page on a virtual phone and saves crisp clips for the Shorts.
 *
 *   node tools/capture-portal.mjs <feature>          e.g. course-finder
 *   node tools/capture-portal.mjs <feature> --base http://localhost:3000
 *
 * Clips land in public/footage/<feature>/<clip>.mp4 (798 x 1380, 30 fps).
 * Steps for each feature live in tools/portal-pages.json.
 * Exits with code 1 if the page looks broken (no data, error text) so a bad
 * page never ends up in a video.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require("playwright");
} catch {
  playwright = require("/opt/node22/lib/node_modules/playwright"); // preinstalled in Claude cloud sessions
}

const feature = process.argv[2];
const baseIdx = process.argv.indexOf("--base");
const BASE = baseIdx > 0 ? process.argv[baseIdx + 1] : "https://app.goeduabroad.com";
const pages = JSON.parse(readFileSync("tools/portal-pages.json", "utf8"));
const cfg = pages[feature];
if (!cfg) {
  console.error(`Unknown feature "${feature}". Options: ${Object.keys(pages).filter((k) => !k.startsWith("_")).join(", ")}`);
  process.exit(2);
}

const FPS = 30;
const VIEW = { width: 432, height: 747 }; // x1.85 = 799 x 1382, cropped to 798 x 1380
const SCALE = 1.85;
const launchOpts = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {};

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

async function main() {
  const browser = await playwright.chromium.launch(launchOpts);
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: SCALE, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const outDir = path.join("public/footage", feature);
  mkdirSync(outDir, { recursive: true });

  for (const [clipName, steps] of Object.entries(cfg.clips)) {
    await page.goto(BASE + encodeURI(cfg.path), { waitUntil: "domcontentloaded", timeout: 60000 });
    // Wait for real content
    const deadline = Date.now() + 30000;
    let ok = false;
    while (Date.now() < deadline) {
      const text = await page.innerText("body").catch(() => "");
      const seen = cfg.mustSee.every((s) => text.includes(s));
      const broken = cfg.mustNotSee.find((s) => text.includes(s));
      if (seen && !broken) {
        ok = true;
        break;
      }
      await page.waitForTimeout(1000);
    }
    if (!ok) {
      const text = (await page.innerText("body").catch(() => "")).replace(/\s+/g, " ").slice(0, 300);
      console.error(`FAIL ${feature}/${clipName}: page did not load real content. Saw: ${text}`);
      await browser.close();
      process.exit(1);
    }
    await page.waitForTimeout(1500); // images settle
    // Pages with the portal's sidebar layout scroll an inner panel, not the window: find it.
    await page.evaluate(() => {
      window.__scroller = null;
      if (document.scrollingElement.scrollHeight > window.innerHeight + 50) return;
      let best = null;
      for (const el of document.querySelectorAll("*")) {
        const st = getComputedStyle(el);
        if (/(auto|scroll)/.test(st.overflowY) && el.scrollHeight > el.clientHeight + 50) {
          if (!best || el.clientHeight * el.clientWidth > best.clientHeight * best.clientWidth) best = el;
        }
      }
      window.__scroller = best;
    });

    const tmp = path.join("out/capture-tmp", feature, clipName);
    rmSync(tmp, { recursive: true, force: true });
    mkdirSync(tmp, { recursive: true });
    let n = 0;
    let last = null;
    const shoot = async () => {
      last = await page.screenshot({ type: "jpeg", quality: 92 });
      const f = path.join(tmp, `f${String(n++).padStart(4, "0")}.jpg`);
      (await import("node:fs")).writeFileSync(f, last);
    };
    const repeatLast = async (count) => {
      const fs = await import("node:fs");
      if (!last) await shoot();
      for (let i = 0; i < count; i++) fs.writeFileSync(path.join(tmp, `f${String(n++).padStart(4, "0")}.jpg`), last);
    };

    for (const step of steps) {
      if (step.hold !== undefined) {
        await shoot();
        await repeatLast(Math.max(0, Math.round(step.hold * FPS) - 1));
      } else if (step.scroll !== undefined) {
        const from = await page.evaluate(() => (window.__scroller ? window.__scroller.scrollTop : window.scrollY));
        const frames = Math.max(1, Math.round(step.seconds * FPS));
        for (let i = 1; i <= frames; i++) {
          const y = from + (step.scroll - from) * ease(i / frames);
          await page.evaluate((yy) => (window.__scroller ? (window.__scroller.scrollTop = yy) : window.scrollTo(0, yy)), y);
          if (frames > 1) await shoot();
        }
        if (frames === 1) await page.waitForTimeout(300);
      } else if (step.click !== undefined) {
        const target = page.getByRole("button", { name: new RegExp(step.click, "i") }).first();
        await target.click({ timeout: 10000 }).catch(async () => {
          await page.getByText(step.click, { exact: false }).first().click({ timeout: 10000 });
        });
        await page.waitForTimeout(600);
      }
    }

    const out = path.join(outDir, `${clipName}.mp4`);
    execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y", "-framerate", String(FPS), "-i", path.join(tmp, "f%04d.jpg"),
      "-vf", "crop=798:1380:0:0", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", out,
    ]);
    console.log(`OK   ${out}  (${(n / FPS).toFixed(1)}s)`);
  }
  await browser.close();
}

main().catch((e) => {
  console.error("FAIL", e.message);
  process.exit(1);
});
