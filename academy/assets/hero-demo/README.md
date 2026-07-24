# Teachy hero demo

Self-contained HTML/CSS coaching loop used to generate the landing-page hero video.

## Files

- `index.html` — 1280×720 animated demo (point → act → check)
- `teachy-hero.webm` — primary hero video (VP9, silent, 14s loop)
- `teachy-hero.mp4` — H.264 fallback
- `teachy-hero-poster.jpg` — poster frame
- `record.mjs` — Playwright + ffmpeg recorder

## Re-record

```bash
cd academy/assets/hero-demo
npm install
npx playwright install chromium
node record.mjs
```

Requires system `ffmpeg` on `PATH`.
