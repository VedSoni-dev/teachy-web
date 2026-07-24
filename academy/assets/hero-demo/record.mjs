#!/usr/bin/env node
/**
 * Records academy/assets/hero-demo/index.html to teachy-hero.webm (+ mp4).
 * Uses Playwright page video (1280x720), then ffmpeg to trim/compress.
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync, copyFileSync, unlinkSync, statSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 8765;
const WIDTH = 1280;
const HEIGHT = 720;
const DURATION_MS = 15000;
const RECORD_MS = DURATION_MS + 1000; // capture just over one loop
const OUT_WEBM = join(__dirname, "teachy-hero.webm");
const OUT_MP4 = join(__dirname, "teachy-hero.mp4");
const OUT_POSTER = join(__dirname, "teachy-hero-poster.jpg");
const TMP_DIR = join(__dirname, ".record-tmp");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

function startStaticServer() {
  const server = createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    const rel = urlPath === "/" ? "/index.html" : urlPath;
    const filePath = join(__dirname, rel);
    if (!filePath.startsWith(__dirname) || !existsSync(filePath)) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    const ext = extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(readFileSync(filePath));
  });
  return new Promise((resolve) => {
    server.listen(PORT, "127.0.0.1", () => resolve(server));
  });
}

function resolveFfmpeg() {
  const candidates = [
    "ffmpeg",
    "/opt/homebrew/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
  ];
  for (const candidate of candidates) {
    const result = spawnSync(candidate, ["-version"], { encoding: "utf8" });
    if (result.status === 0) return candidate;
  }
  throw new Error("ffmpeg not found — brew install ffmpeg");
}

function runFfmpeg(args) {
  const ffmpegBin = resolveFfmpeg();
  const result = spawnSync(ffmpegBin, args, { encoding: "utf8" });
  if (result.status !== 0) {
    console.error(result.stderr);
    throw new Error(`ffmpeg failed: ${args.join(" ")}`);
  }
}

function mb(path) {
  return (statSync(path).size / (1024 * 1024)).toFixed(2);
}

async function main() {
  mkdirSync(TMP_DIR, { recursive: true });
  const server = await startStaticServer();
  console.log(`Serving demo on http://127.0.0.1:${PORT}/`);

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-dev-shm-usage",
      "--autoplay-policy=no-user-gesture-required",
      `--window-size=${WIDTH},${HEIGHT}`,
    ],
  });

  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: TMP_DIR,
      size: { width: WIDTH, height: HEIGHT },
    },
  });

  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__TEACHY_HERO_DEMO__?.ready === true);

  // Align near loop start: reload so CSS animations restart cleanly.
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(RECORD_MS);

  const video = page.video();
  await context.close();
  await browser.close();
  server.close();

  const rawPath = await video.path();
  console.log("Raw recording:", rawPath, `${mb(rawPath)} MB`);

  // Trim to exactly one loop and compress for the web.
  runFfmpeg([
    "-y",
    "-i", rawPath,
    "-ss", "0.25",
    "-t", "15",
    "-an",
    "-c:v", "libvpx",
    "-b:v", "900k",
    "-crf", "32",
    "-pix_fmt", "yuv420p",
    "-vf", `scale=${WIDTH}:${HEIGHT}:flags=lanczos`,
    OUT_WEBM,
  ]);
  console.log("Wrote", OUT_WEBM, `${mb(OUT_WEBM)} MB`);

  runFfmpeg([
    "-y",
    "-i", OUT_WEBM,
    "-an",
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", "26",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    OUT_MP4,
  ]);
  console.log("Wrote", OUT_MP4, `${mb(OUT_MP4)} MB`);

  runFfmpeg([
    "-y",
    "-i", OUT_WEBM,
    "-ss", "2.5",
    "-vframes", "1",
    "-q:v", "3",
    OUT_POSTER,
  ]);
  console.log("Wrote", OUT_POSTER, `${mb(OUT_POSTER)} MB`);

  // Cleanup temp playwright video.
  try {
    unlinkSync(rawPath);
  } catch {}

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
