/*! cirrus · a sky drawn in tiny characters; the wind writes //// where you move · MIT · https://frontend.vedantsoni.com/sky
 * After unvalley's "blue sky study" (https://x.com/unvalley_/status/2121293930641997992), rebuilt clean-room: own code,
 * palette, glyphs. One canvas 2D, no dependencies, no network.
 *   import { mount } from "./cirrus.js";  const sky = mount(el, { time: "dusk" });  sky.set({ cover: 0.7 }); sky.destroy();
 *   or: <cirrus-sky time="noon" cover="0.5" style="display:block;height:45vh"></cirrus-sky>
 */

export const DEFAULTS = { v: 1, seed: 7, time: "noon", cover: 0.5, wind: 0.5, speed: 0.5, cell: 9, glyphs: "ascii", trail: true, gust: true, fade: true };
export const TIMES = ["dawn", "noon", "dusk", "night"];
export const GLYPH_SETS = ["ascii", "dots", "blocks"];

// Our own palettes: sky ramp from deep to pale (top to bottom), the dot inside each cell, cloud fill, cloud edge type,
// the wind's blue (written on its wake, the cell it clears), the page colour the sky fades into, and stars (night only).
export const PALETTES = {
  dawn: { sky: ["#8fb4dc", "#a9c6e6", "#c7d8ee", "#e9dfe8"], dot: "#6f90bd", cloud: "#fff8f3", edge: "#8a7f9e", wake: "#fff8f3", trail: "#3f5fd8", page: "#fbf8f6", stars: null },
  noon: { sky: ["#4ea4dc", "#74bae6", "#9dd0ef", "#c6e4f6"], dot: "#2f86c6", cloud: "#ffffff", edge: "#6684a3", wake: "#ffffff", trail: "#1652e0", page: "#fbfcfd", stars: null },
  dusk: { sky: ["#3d4f8f", "#6c6aa6", "#b88aa8", "#f0b99a"], dot: "#2d3a74", cloud: "#ffe9dc", edge: "#7d5f86", wake: "#2d3a74", trail: "#ffd166", page: "#fbf3ee", stars: null },
  night: { sky: ["#0b1530", "#11204a", "#182b5c", "#22386e"], dot: "#2a427e", cloud: "#2c3d6e", edge: "#7d93c9", wake: "#0b1530", trail: "#9ec5ff", page: "#0d1222", stars: "#e8eeff" },
};

// Cloud edges, thin to thick. Each step lists its look-alikes, picked by a per-cell hash so edges don't repeat.
const RAMPS = {
  ascii: [".'", ":.", ";:", "~_", "()", "o;", "o8", "8o"],
  dots: ["·", "·∙", "∙", "•∙", "•", "•●", "●", "●"],
  blocks: ["░", "░", "░▒", "▒", "▒▓", "▓", "▓█", "█"],
};
const SKYDOT = { ascii: "■", dots: "•", blocks: "▪" };
const TRAIL_GLYPHS = ["-", "/", "|", "\\"];
const STARS = "*+·";

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const num = (v, d, a, b) => { const n = typeof v === "string" ? parseFloat(v) : v; return typeof n === "number" && isFinite(n) ? clamp(n, a, b) : d; };
const bool = (v, d) => (v === true || v === "true" || v === "" ? true : v === false || v === "false" ? false : d);

/** Any input (storage, URL hash, attributes, junk) -> a valid config. */
export function normalize(c) {
  const o = c && typeof c === "object" ? c : {};
  return {
    v: 1,
    seed: Math.floor(num(o.seed, DEFAULTS.seed, 0, 1e9)),
    time: TIMES.includes(o.time) ? o.time : DEFAULTS.time,
    cover: num(o.cover, DEFAULTS.cover, 0, 1),
    wind: num(o.wind, DEFAULTS.wind, 0, 1),
    speed: num(o.speed, DEFAULTS.speed, 0, 1),
    cell: Math.round(num(o.cell, DEFAULTS.cell, 6, 16)),
    glyphs: GLYPH_SETS.includes(o.glyphs) ? o.glyphs : DEFAULTS.glyphs,
    trail: bool(o.trail, DEFAULTS.trail),
    gust: bool(o.gust, DEFAULTS.gust),
    fade: bool(o.fade, DEFAULTS.fade),
  };
}

// ---- seeded noise (no Math.random in the render path: a seed reproduces a sky) ----
export function mulberry32(a) {
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hash2(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
const smooth = (t) => t * t * (3 - 2 * t);
/** 2D value noise in [0,1], deterministic for (x, y, seed). */
export function noise2(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  const u = smooth(xf), v = smooth(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s) { return noise2(x, y, s) * 0.62 + noise2(x * 2.07 + 13.1, y * 2.07 + 7.7, s + 1) * 0.28 + noise2(x * 4.3 + 3.3, y * 4.3 + 1.9, s + 2) * 0.1; }

/** Frame-rate independent decay: the share of trail left after dt seconds when it lasts ~life seconds. */
export function decayFactor(dt, life) { return Math.exp(-dt / Math.max(0.05, life / 3)); }

/** Stroke direction -> trail glyph index into "-/|\\", with hysteresis so a wobbly stroke doesn't flicker. */
export function glyphFor(vx, vy, prev = -1) {
  let deg = (Math.atan2(-vy, vx) * 180) / Math.PI; // screen y points down; up-right is +45
  deg = ((deg % 180) + 180) % 180;
  const bucket = Math.round(deg / 45) % 4;
  if (prev >= 0 && prev !== bucket) {
    const centre = prev * 45; let diff = Math.abs(deg - centre); diff = Math.min(diff, 180 - diff);
    if (diff < 30) return prev; // still within 30 deg of the old bucket: keep it
  }
  return bucket;
}
export { TRAIL_GLYPHS };

const FONT = 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

/** Draw one sky frame into ctx (device pixels). Pure apart from the canvas: the live loop and toPNG share it. */
function paint(ctx, g, cfg, t, field, trail, atlas) {
  const pal = PALETTES[cfg.time];
  const { cols, rows, cw, ch } = g;
  const W = cols * cw, H = rows * ch;
  ctx.fillStyle = pal.page; ctx.fillRect(0, 0, W, H);
  const gap = Math.max(1, Math.round(cw * 0.1));
  const ramp = RAMPS[cfg.glyphs];
  // sky cells, batched by tint
  for (let k = 0; k < 4; k++) {
    ctx.beginPath();
    for (let i = 0; i < field.n; i++) if (field.kind[i] === 0 && field.tint[i] === k) { const x = (i % cols) * cw, y = ((i / cols) | 0) * ch; ctx.rect(x, y, cw - gap, ch - gap); }
    ctx.fillStyle = pal.sky[k]; ctx.fill();
  }
  // cloud interiors and edge backgrounds
  ctx.beginPath();
  for (let i = 0; i < field.n; i++) if (field.kind[i] !== 0) { const x = (i % cols) * cw, y = ((i / cols) | 0) * ch; ctx.rect(x, y, cw - gap, ch - gap); }
  ctx.fillStyle = pal.cloud; ctx.fill();
  // glyphs: sky dots, stars, cloud edges, trail
  const twinkle = t * 1.7;
  for (let i = 0; i < field.n; i++) {
    const x = (i % cols) * cw, y = ((i / cols) | 0) * ch;
    const ti = trail ? trail.I[i] : 0;
    if (ti > 0.04) { ctx.globalAlpha = Math.min(1, ti * 1.6) * 0.92; ctx.fillStyle = pal.wake; ctx.fillRect(x, y, cw - gap, ch - gap); ctx.globalAlpha = Math.min(1, ti * 1.5); atlas.draw(ctx, TRAIL_GLYPHS[trail.D[i]], "trail", x, y); ctx.globalAlpha = 1; continue; }
    let kind = field.kind[i], d = field.dens[i];
    if (kind === 2 && ti > 0.01) { kind = 1; d = 0.95; } // the wind breaks a cloud into characters near it
    if (kind === 1) {
      const step = ramp[Math.min(ramp.length - 1, (d * ramp.length) | 0)];
      atlas.draw(ctx, step[(field.h[i] * step.length) | 0], "edge", x, y);
    } else if (kind === 0) {
      if (pal.stars && field.h[i] < 0.035) {
        ctx.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(twinkle + field.h[i] * 300));
        atlas.draw(ctx, STARS[(field.h[i] * 1000) % 3 | 0], "star", x, y); ctx.globalAlpha = 1;
      } else if (field.h[i] > 0.12) {
        ctx.globalAlpha = 0.35 + field.tint[i] * 0.1; atlas.draw(ctx, SKYDOT[cfg.glyphs], "dot", x, y); ctx.globalAlpha = 1;
      }
    }
  }
  if (cfg.fade) {
    const gr = ctx.createLinearGradient(0, H * 0.45, 0, H * 0.94);
    gr.addColorStop(0, hexA(pal.page, 0)); gr.addColorStop(0.6, hexA(pal.page, 0.7)); gr.addColorStop(1, hexA(pal.page, 1));
    ctx.fillStyle = gr; ctx.fillRect(0, H * 0.45, W, H * 0.55 + 1);
  }
}
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

/** Recompute the cloud field: kind 0 sky, 1 cloud edge (glyph), 2 cloud interior. */
function computeField(field, g, cfg, t) {
  const { cols, rows } = g;
  const s = cfg.seed, cover = cfg.cover;
  const thr = 0.8 - cover * 0.3; // more cover, lower threshold
  const drift = t * (0.02 + cfg.speed * 0.16);
  for (let r = 0; r < rows; r++) {
    const fy = r / Math.max(1, rows - 1);
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const n = fbm(c * 0.06 + drift, r * 0.12 + drift * 0.15 + t * 0.004, s);
      const d = (n - thr) / (1 - thr);
      if (d > 0.16) { field.kind[i] = 2; field.dens[i] = 1; }
      else if (d > 0) { field.kind[i] = 1; field.dens[i] = d / 0.16; }
      else {
        field.kind[i] = 0;
        const m = noise2(c * 0.11 + t * 0.05 * (0.3 + cfg.speed), r * 0.16 - t * 0.02, s + 9) * 1.6 + fy * 2.6;
        field.tint[i] = clamp(m | 0, 0, 3);
      }
    }
  }
}

function makeField(n, seed) {
  const f = { n, kind: new Uint8Array(n), tint: new Uint8Array(n), dens: new Float32Array(n), h: new Float32Array(n) };
  for (let i = 0; i < n; i++) f.h[i] = hash2(i, 77, seed);
  return f;
}

/** Each (glyph, colour) is drawn once into an offscreen atlas, then blitted. */
function makeAtlas(cw, ch, pal) {
  const colours = { edge: pal.edge, trail: pal.trail, dot: pal.dot, star: pal.stars || pal.edge };
  const glyphs = [...new Set([...Object.values(RAMPS).join(""), ...Object.values(SKYDOT), ...TRAIL_GLYPHS, ...STARS])];
  const keys = Object.keys(colours);
  const cv = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(cw * glyphs.length, ch * keys.length) : Object.assign(document.createElement("canvas"), { width: cw * glyphs.length, height: ch * keys.length });
  const x = cv.getContext("2d");
  x.textAlign = "center"; x.textBaseline = "middle";
  const map = new Map();
  keys.forEach((k, row) => {
    x.fillStyle = colours[k];
    glyphs.forEach((gl, col) => {
      const big = k === "trail" ? 700 : 500;
      const size = gl === SKYDOT.ascii || gl === "▪" ? ch * 0.32 : gl === "•" && k === "dot" ? ch * 0.6 : ch * (k === "trail" ? 1.02 : 0.92);
      x.font = `${big} ${size}px ${FONT}`;
      x.fillText(gl, col * cw + cw / 2, row * ch + ch / 2 + ch * 0.04);
      map.set(k + gl, [col * cw, row * ch]);
    });
  });
  return { draw(ctx, gl, k, dx, dy) { const p = map.get(k + gl); if (p) ctx.drawImage(cv, p[0], p[1], cw, ch, dx, dy, cw, ch); } };
}

function grid(wCss, hCss, cellCss, dpr) {
  let cell = cellCss;
  if (wCss < 480) cell = Math.max(cell, 11);
  while ((wCss / cell) * (hCss / (cell * 1.2)) > 26000) cell++; // hard cap on cells
  const cw = Math.max(4, Math.round(cell * dpr)), ch = Math.max(5, Math.round(cell * 1.2 * dpr));
  return { cw, ch, cols: Math.ceil((wCss * dpr) / cw), rows: Math.ceil((hCss * dpr) / ch), dpr, cell };
}

/** Mount a live sky into el (it fills el). Returns { set, frame, toPNG, destroy, config }. */
export function mount(el, config) {
  let cfg = normalize(config);
  const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y;";
  if (getComputedStyle(el).position === "static") el.style.position = "relative";
  el.style.background ||= "linear-gradient(#4ea4dc,#c6e4f6 70%,#fbfcfd)"; // the poster if JS or canvas fails
  let ctx = null;
  try { ctx = canvas.getContext("2d", { alpha: false }); } catch (e) { /* fall through */ }
  if (!ctx) { console.warn("cirrus: no canvas 2D, showing the gradient"); return { set() {}, frame() {}, async toPNG() { return null; }, destroy() {}, get config() { return cfg; } }; }
  el.appendChild(canvas);

  let g, field, trail, atlas, extra = 0;
  let t = 0, last = 0, raf = 0, visible = true, onscreen = true, lastField = -1, slow = 0, fast = 0, ema = 8;
  let lastReal = -1e9, gust = null, prev = null, vx = 0, vy = 0, dir = -1, alive = true, now = 0;

  function build() {
    const r = el.getBoundingClientRect();
    const dpr = Math.min(2, typeof devicePixelRatio === "number" ? devicePixelRatio : 1);
    g = grid(Math.max(1, r.width), Math.max(1, r.height), cfg.cell + extra, dpr);
    canvas.width = g.cols * g.cw; canvas.height = g.rows * g.ch;
    canvas.style.width = (g.cols * g.cw) / dpr + "px"; canvas.style.height = (g.rows * g.ch) / dpr + "px";
    const n = g.cols * g.rows;
    field = makeField(n, cfg.seed);
    trail = { I: new Float32Array(n), D: new Uint8Array(n) };
    atlas = makeAtlas(g.cw, g.ch, PALETTES[cfg.time]);
    computeField(field, g, cfg, t); lastField = now;
  }

  function splat(px, py, d) {
    if (!cfg.trail) return;
    const cx = (px * g.dpr) / g.cw, cy = (py * g.dpr) / g.ch, R = 1.4;
    for (let r = Math.floor(cy - R); r <= Math.ceil(cy + R); r++) {
      if (r < 0 || r >= g.rows) continue;
      for (let c = Math.floor(cx - R * 1.2); c <= Math.ceil(cx + R * 1.2); c++) {
        if (c < 0 || c >= g.cols) continue;
        const dist = Math.hypot((c + 0.5 - cx) / 1.2, r + 0.5 - cy);
        if (dist > R) continue;
        const i = r * g.cols + c, v = 1 - (dist / (R + 0.6)) ** 2;
        if (v > trail.I[i]) { trail.I[i] = v; trail.D[i] = d; }
      }
    }
  }
  function stroke(x, y) {
    if (prev) {
      const dx = x - prev[0], dy = y - prev[1], len = Math.hypot(dx, dy);
      if (len < 0.5) return;
      vx = vx * 0.6 + dx * 0.4; vy = vy * 0.6 + dy * 0.4; // low-passed direction
      dir = glyphFor(vx, vy, dir);
      const step = Math.max(1, (g.cw / g.dpr) * 0.5), n = Math.ceil(len / step);
      for (let k = 1; k <= n; k++) splat(prev[0] + (dx * k) / n, prev[1] + (dy * k) / n, dir);
    }
    prev = [x, y];
    if (reduced) draw();
  }
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const onMove = (e) => { lastReal = now; if (gust) { gust = null; prev = null; } const [x, y] = pos(e); stroke(x, y); };
  const onDown = (e) => { prev = null; onMove(e); };
  const onLeave = () => { prev = null; };
  const onBlur = () => { prev = null; if (trail) trail.I.fill(0); };
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("pointercancel", onLeave);
  addEventListener("blur", onBlur);

  // the ghost gust: a scripted sweep so the wind shows before anyone moves (and on phones, which have no hover)
  function runGust(dt) {
    if (!cfg.gust || reduced) return;
    if (!gust) {
      const idle = now - lastReal;
      if (idle > 8000 && now - (runGust.lastEnd || -1e9) > 8000 && now > 600) { gust = { p: 0, flip: (runGust.n = (runGust.n || 0) + 1) % 2 === 0 }; prev = null; vx = vy = 0; dir = -1; }
      else return;
    }
    gust.p += dt / 1.5;
    const W = g.cols * g.cw / g.dpr, H = g.rows * g.ch / g.dpr;
    const e = gust.p < 0.5 ? 2 * gust.p * gust.p : 1 - (-2 * gust.p + 2) ** 2 / 2, u = Math.min(1, e);
    // a cubic curve: comes in level, bends down, ends falling (so it writes ---- then //// then ||||)
    const P = gust.flip ? [[0.92, 0.18], [0.55, 0.12], [0.42, 0.3], [0.36, 0.78]] : [[0.08, 0.16], [0.42, 0.1], [0.56, 0.32], [0.62, 0.78]];
    const b = (k) => (1 - u) ** 3 * P[0][k] + 3 * (1 - u) ** 2 * u * P[1][k] + 3 * (1 - u) * u * u * P[2][k] + u ** 3 * P[3][k];
    stroke(b(0) * W, b(1) * H);
    if (gust.p >= 1) { gust = null; prev = null; runGust.lastEnd = now; }
  }

  function draw() {
    const t0 = performance.now();
    paint(ctx, g, cfg, t, field, cfg.trail ? trail : null, atlas);
    return performance.now() - t0;
  }

  function loop(ms) {
    raf = 0;
    if (!alive || !visible || !onscreen) return;
    now = ms;
    const dt = Math.min(0.1, last ? (ms - last) / 1000 : 0.016); last = ms;
    t += dt;
    if (ms - lastField > 50) { computeField(field, g, cfg, t); lastField = ms; } // the cloud field at ~20 Hz
    runGust(dt);
    const f = decayFactor(dt, 0.6 + cfg.wind * 2.2);
    for (let i = 0; i < trail.I.length; i++) if (trail.I[i] > 0) trail.I[i] = trail.I[i] < 0.01 ? 0 : trail.I[i] * f;
    const cost = draw();
    // governor: too slow for ~30 frames -> bigger cells; well under budget for a long time -> back down
    ema = ema * 0.9 + cost * 0.1;
    if (ema > 12) { if (++slow > 30 && extra < 4) { extra++; slow = 0; build(); } } else slow = 0;
    if (ema < 5 && extra > 0) { if (++fast > 600) { extra--; fast = 0; build(); } } else fast = 0;
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!raf && alive && !reduced && visible && onscreen) { last = 0; raf = requestAnimationFrame(loop); } }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  const onVis = () => { visible = document.visibilityState !== "hidden"; visible ? start() : stop(); };
  document.addEventListener("visibilitychange", onVis);
  const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((es) => { onscreen = es[es.length - 1].isIntersecting; onscreen ? start() : stop(); }) : null;
  io?.observe(el);
  let rt = 0;
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { if (!alive) return; build(); draw(); }, 80); }) : null;
  ro?.observe(el);
  const mq = typeof matchMedia !== "undefined" ? matchMedia(`(resolution: ${typeof devicePixelRatio === "number" ? devicePixelRatio : 1}dppx)`) : null;
  const onDpr = () => { build(); draw(); };
  mq?.addEventListener?.("change", onDpr);

  // reduced motion: a single finished frame a few seconds into the drift
  if (reduced) t = 12;
  build(); draw();
  if (typeof document !== "undefined" && document.fonts?.ready) document.fonts.ready.then(() => { if (alive) { atlas = makeAtlas(g.cw, g.ch, PALETTES[cfg.time]); draw(); } });
  start();

  return {
    get config() { return cfg; },
    set(next) {
      const old = cfg; cfg = normalize({ ...cfg, ...next });
      if (old.cell !== cfg.cell || old.seed !== cfg.seed) { extra = 0; build(); }
      else { if (old.time !== cfg.time) atlas = makeAtlas(g.cw, g.ch, PALETTES[cfg.time]); computeField(field, g, cfg, t); }
      if (!cfg.trail) trail.I.fill(0);
      draw();
    },
    frame() { draw(); },
    /** The current sky (same seed, time and drift, no trail) as a PNG Blob at w x h pixels. */
    async toPNG(w, h) {
      w = Math.round(clamp(w, 16, 8192)); h = Math.round(clamp(h, 16, 8192));
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      const x = cv.getContext("2d", { alpha: false });
      if (!x) throw new Error("no canvas");
      const scale = Math.max(1, w / 1600);
      const gg = grid(w / scale, h / scale, cfg.cell, scale);
      const ff = makeField(gg.cols * gg.rows, cfg.seed);
      computeField(ff, gg, cfg, t);
      paint(x, gg, cfg, t, ff, null, makeAtlas(gg.cw, gg.ch, PALETTES[cfg.time]));
      return new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error("export failed"))), "image/png"));
    },
    destroy() {
      alive = false; stop(); clearTimeout(rt);
      canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerleave", onLeave); canvas.removeEventListener("pointercancel", onLeave);
      removeEventListener("blur", onBlur); document.removeEventListener("visibilitychange", onVis);
      io?.disconnect(); ro?.disconnect(); mq?.removeEventListener?.("change", onDpr);
      canvas.remove();
    },
  };
}

/** <cirrus-sky time="noon" cover="0.5" wind="0.5" speed="0.5" cell="9" glyphs="ascii" trail gust fade seed="7"> */
function defineElement() {
  if (typeof customElements === "undefined" || customElements.get("cirrus-sky")) return;
  const ATTRS = ["seed", "time", "cover", "wind", "speed", "cell", "glyphs", "trail", "gust", "fade"];
  customElements.define("cirrus-sky", class extends HTMLElement {
    static get observedAttributes() { return ATTRS; }
    read() { const o = {}; for (const a of ATTRS) if (this.hasAttribute(a)) o[a] = this.getAttribute(a); return o; }
    connectedCallback() { if (!this.style.display) this.style.display = "block"; this.sky = mount(this, this.read()); }
    attributeChangedCallback() { this.sky?.set(this.read()); }
    disconnectedCallback() { this.sky?.destroy(); this.sky = null; }
  });
}
defineElement();
