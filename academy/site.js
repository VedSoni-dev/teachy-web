// Teachy home page: the sky, the cursor that flies in, the buddy that follows you,
// the git graph, the demo desk and the changelog teaser.
import { skyFor, metaHTML, sectionsHTML, ago, reveal, stars, slug } from "./cl.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const CL = window.TEACHY_CHANGELOG || [];

/* ---------------- skies ---------------- */
const hero = $("#hero");
const { canvas: heroCanvas } = skyFor(hero, $("#sky"), { time: "noon", cover: 0.48, cell: 10, gust: false });
skyFor($("#cta"), $("#sky-dusk"), { time: "night", cover: 0.42, cell: 10, seed: 23 });

/* ---------------- intro: the cursor flies in and becomes the logo ---------------- */
const flyer = $("#flyer");
const mark = $("#hero-mark");
const body = document.body;

function landFlyer() {
  flyer.style.transform = "none";
  flyer.classList.add("landed", "bob");
  flyer.style.position = "static";
  flyer.style.width = flyer.style.height = "100%";
  flyer.firstElementChild.style.rotate = "-28deg";
  mark.appendChild(flyer);
  body.classList.remove("intro");
  setTimeout(() => buddyIntro(), 900);
}

function intro() {
  if (reduced || !heroCanvas) { landFlyer(); return; }
  body.classList.add("intro");
  const W = innerWidth, H = innerHeight;
  const size = flyer.offsetWidth;
  const end = () => { const r = mark.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  const [ex, ey] = end();
  // a swoop: in from the lower left, loop up through the sky, glide down to the mark
  const P = [
    [-120, H * 0.82],
    [W * 0.3, H * 0.95],
    [W * 0.12, H * 0.06],
    [W * 0.62, H * 0.1],
    [W * 0.95, H * 0.16],
    [W * 0.8, ey + 40],
    [ex, ey],
  ];
  const bez = (a, b, c, d, t) => { const u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; };
  const at = (t) => {
    // two cubic segments: P0..P3, P3..P6
    if (t < 0.55) { const k = t / 0.55; return [bez(P[0][0], P[1][0], P[2][0], P[3][0], k), bez(P[0][1], P[1][1], P[2][1], P[3][1], k)]; }
    const k = (t - 0.55) / 0.45; return [bez(P[3][0], P[4][0], P[5][0], P[6][0], k), bez(P[3][1], P[4][1], P[5][1], P[6][1], k)];
  };
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2) * 0.35 + t * 0.65;
  const dur = 2100;
  let t0 = 0, prev = at(0), ang = 0, skipped = false;
  const skip = () => { skipped = true; };
  addEventListener("pointerdown", skip, { once: true });
  addEventListener("keydown", skip, { once: true });

  function step(ms) {
    if (!t0) t0 = ms;
    let t = Math.min(1, (ms - t0) / dur);
    if (skipped) t = 1;
    const p = at(ease(t));
    const vx = p[0] - prev[0], vy = p[1] - prev[1];
    if (Math.hypot(vx, vy) > 0.5) {
      const target = (Math.atan2(vy, vx) * 180) / Math.PI + 90; // the triangle's tip points along the flight
      let d = ((target - ang + 540) % 360) - 180; ang += d * 0.25;
    }
    // shrink-to-size on approach, a little scale-up mid-flight
    const s = t < 0.85 ? 0.55 + Math.sin(t * Math.PI) * 0.35 : 0.55 + ((t - 0.85) / 0.15) * 0.45;
    const finalAng = t > 0.86 ? ang + ((-28 - ang) * (t - 0.86)) / 0.14 : ang;
    flyer.style.transform = `translate(${p[0] - size / 2}px, ${p[1] - size / 2}px) scale(${s}) rotate(${finalAng}deg)`;
    // the wind follows the cursor through the sky
    if (t < 0.97) heroCanvas.dispatchEvent(new PointerEvent("pointermove", { clientX: p[0], clientY: p[1] }));
    prev = p;
    if (t < 1) requestAnimationFrame(step);
    else { heroCanvas.dispatchEvent(new PointerEvent("pointerleave")); landFlyer(); }
  }
  requestAnimationFrame(step);
}

/* ---------------- buddy: a little Teachy next to your cursor ---------------- */
const buddy = $("#buddy");
const bubble = $("#buddy-bubble");
let mx = -100, my = -100, bx = -100, by = -100, sayTimer = 0, listening = false, moved = false;

function say(text, ms = 1800, html = false) {
  if (!finePointer) return;
  clearTimeout(sayTimer);
  bubble[html ? "innerHTML" : "textContent"] = text;
  buddy.classList.add("talking");
  if (ms) sayTimer = setTimeout(() => buddy.classList.remove("talking"), ms);
}
function hush() { clearTimeout(sayTimer); buddy.classList.remove("talking"); }

if (finePointer) {
  addEventListener("pointermove", (e) => {
    mx = e.clientX; my = e.clientY;
    if (!moved) { moved = true; bx = mx; by = my; buddy.classList.add("on"); }
  }, { passive: true });
  document.addEventListener("pointerleave", () => buddy.classList.remove("on"));
  document.addEventListener("pointerenter", () => moved && buddy.classList.add("on"));
  (function follow() {
    bx += (mx + 16 - bx) * 0.16; by += (my + 18 - by) * 0.16;
    buddy.style.transform = `translate(${bx}px, ${by}px)`;
    requestAnimationFrame(follow);
  })();
  document.addEventListener("pointerover", (e) => {
    const el = e.target.closest("[data-say]");
    if (el && !listening) say(el.dataset.say, 0);
  });
  document.addEventListener("pointerout", (e) => {
    const el = e.target.closest("[data-say]");
    if (el && !el.contains(e.relatedTarget) && !listening) hush();
  });
}
function buddyIntro() { if (moved) say("hi, i'm teachy 👋", 2200); else addEventListener("pointermove", () => setTimeout(() => say("hi, i'm teachy 👋", 2200), 300), { once: true }); }

// hold control + option, like the real app
const WAVE = '<span class="wave"><b></b><b></b><b></b><b></b><b></b></span>';
addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.altKey && !listening) {
    listening = true; buddy.classList.add("listening", "on");
    if (!moved) { mx = innerWidth / 2; my = innerHeight / 2; bx = mx; by = my; }
    say(WAVE + "listening…", 0, true);
  }
});
addEventListener("keyup", () => {
  if (!listening) return;
  listening = false; buddy.classList.remove("listening");
  say("download me and i'll answer for real", 2600);
});

/* ---------------- clone copy ---------------- */
$$("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy); } catch { /* no clipboard: the text is visible anyway */ }
  b.classList.add("copied"); say("copied. happy hacking", 1600);
  setTimeout(() => b.classList.remove("copied"), 1800);
}));

/* ---------------- ticker ---------------- */
const commits = window.TEACHY_COMMITS || [];
const tickerHTML = commits.map(([h, m]) => `<span><b>${h}</b>${m.replace(/</g, "&lt;")}</span>`).join("");
$("#ticker").innerHTML = tickerHTML + tickerHTML;

/* ---------------- latest pill + changelog teaser ---------------- */
if (CL[0]) {
  $("[data-latest]").textContent = "updated " + ago(CL[0].date);
  const r = CL[0];
  $("#cl-card").innerHTML = `${metaHTML(r)}<h3 class="cl-title">${r.title}</h3><p class="cl-sum">${r.summary}</p>${sectionsHTML(r, 5)}
    <a class="cl-more" href="changelog.html#${slug(r)}">+ ${r.sections.reduce((n, s) => n + s.items.length, 0) - 5} more in this release →</a>`;
}

/* ---------------- git graph: teachy keeps committing ---------------- */
const graph = $(".graph");
const line = $("#teachy-line");
if (line) {
  const L = line.getTotalLength();
  const dots = $("#teachy-dots");
  const n = 11;
  for (let i = 0; i < n; i++) {
    const p = line.getPointAtLength(L * (0.28 + (0.7 * i) / (n - 1)));
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", p.x); c.setAttribute("cy", p.y); c.setAttribute("r", 7); c.setAttribute("class", "d-teachy");
    c.style.transitionDelay = 0.6 + i * 0.13 + "s";
    dots.appendChild(c);
  }
  line.style.strokeDasharray = line.style.strokeDashoffset = L;
  const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { graph.classList.add("seen"); line.style.strokeDashoffset = 0; io.disconnect(); } }, { threshold: 0.35 });
  io.observe(graph);
}

/* ---------------- the demo desk ---------------- */
const stage = $("#stage");
const title = $("#mac-title");
const voice = $("#voice-text");
const TRI = '<svg viewBox="0 0 100 100"><use href="#tri" fill="url(#tri-fill)"/></svg>';
const appChrome = (chips) => `<div class="app-side"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="app-top">${chips}</div>`;
let timers = [];
const later = (fn, ms) => timers.push(setTimeout(fn, ms));

const SCENES = {
  point: {
    title: "Figma",
    ask: "teachy, where's the export button?",
    html: () => `${appChrome('<span class="chip">Share</span><span class="chip">Present</span><span class="chip primary" id="t-export">Export</span>')}
      <div class="app-canvas"><div class="art"></div></div>
      <div class="ptr" id="ptr" style="left:30%;top:70%">${TRI}<span class="ptr-ring"></span><span class="ptr-label">right here!</span></div>`,
    run() {
      later(() => {
        const t = $("#t-export"), s = stage.getBoundingClientRect(), r = t.getBoundingClientRect();
        const p = $("#ptr");
        p.style.left = ((r.left + r.width / 2 - s.left) / s.width) * 100 + "%";
        p.style.top = ((r.top + r.height - s.top) / s.height) * 100 + "%";
        later(() => p.classList.add("hit"), 1000);
        later(() => (voice.textContent = "it's top right, the blue one. click it and pick PNG."), 1100);
      }, 700);
    },
  },
  draw: {
    title: "Teachy · whiteboard",
    ask: "teachy, how does a cube rotate in 3d?",
    html: () => `<svg class="draw-svg" viewBox="0 0 800 500" preserveAspectRatio="none">
        <ellipse class="chalk" cx="250" cy="240" rx="150" ry="120"/>
        <path class="chalk c2" d="M420 240 C 480 200, 520 200, 570 210"/>
        <path class="chalk c3" d="M555 195 L572 211 L550 222"/>
        <path class="chalk c2" d="M150 380 Q 250 420 350 380"/>
      </svg>
      <span class="draw-note" style="left:16%;top:76%">same cube, turning on y</span>
      <div class="cube-wrap"><div class="cube"><div></div><div></div><div></div><div></div><div></div><div></div></div></div>
      <div class="ptr hit" style="left:24%;top:42%">${TRI}<span class="ptr-ring"></span><span class="ptr-label">watch this axis</span></div>`,
    run() { later(() => (voice.textContent = "picture a stick through the middle. it spins around that."), 1600); },
  },
  job: {
    title: "Finder",
    ask: "teachy, rename my screenshots by date",
    html: () => `<div class="job"><div class="job-head">rename screenshots by date <span class="job-status" id="js">working</span></div>
      <ol id="jl"><li>found 48 screenshots on the desktop</li><li>read the date each one was taken</li><li>rename them in Finder</li><li>tell you when it's done</li></ol>
      <div class="gate" id="gate"><p>teachy wants to rename files in Finder.</p><div><span>allow once</span><span>for this job</span><span>not now</span></div></div></div>`,
    run() {
      const li = $$("#jl li");
      const mark = (i, c) => { li.forEach((l, k) => l.className = k < i ? "done" : k === i ? c : ""); };
      mark(0, "run");
      later(() => mark(1, "run"), 900);
      later(() => { mark(2, "run"); $("#gate").classList.add("show"); voice.textContent = "i'll ask before i touch anything."; }, 1800);
      later(() => { $("#gate").classList.remove("show"); mark(3, "run"); }, 3800);
      later(() => { mark(4); $("#js").textContent = "done"; voice.textContent = "done. 48 renamed, nothing else touched."; }, 4800);
    },
  },
  dictate: {
    title: "Mail",
    ask: "holding fn + control…",
    html: () => `<div class="mail"><div class="to">To: Sam</div><div class="typed"><span id="ty"></span><span class="caret"></span></div></div>
      <div class="keys"><kbd id="k1">fn</kbd><kbd id="k2">control</kbd></div>`,
    run() {
      const txt = "hey sam, running ten minutes late. save me a seat and order me the usual?";
      const ty = $("#ty");
      later(() => { $("#k1").classList.add("down"); $("#k2").classList.add("down"); }, 300);
      let i = 0;
      const tick = () => { ty.textContent = txt.slice(0, ++i); if (i < txt.length) later(tick, 38); else { $("#k1").classList.remove("down"); $("#k2").classList.remove("down"); voice.textContent = "typed it. no keyboard needed."; } };
      later(tick, 600);
    },
  },
  memory: {
    title: "PROFILE.md",
    ask: "teachy, keep answers short from now on",
    html: () => `<div class="file"><div class="fname">~/.teachy/PROFILE.md</div>
        <div><span class="h">#</span> about you</div><div>- works in figma most days</div><div>- learning blender on weekends</div>
        <div class="new" id="nl">- likes short answers</div></div>
      <div class="chat-mini"><div class="u" id="c1">keep answers short from now on</div><div class="t" id="c2">got it, noted ✓</div></div>`,
    run() {
      later(() => $("#c1").classList.add("show"), 300);
      later(() => $("#c2").classList.add("show"), 1100);
      later(() => { $("#nl").classList.add("show"); voice.textContent = "it's a plain file. edit it and i'll pick it up."; }, 1700);
    },
  },
};
const order = Object.keys(SCENES);
let current = "", auto = true, autoTimer = 0;

function show(name) {
  timers.forEach(clearTimeout); timers = [];
  current = name;
  const s = SCENES[name];
  title.textContent = s.title;
  voice.textContent = s.ask;
  stage.innerHTML = `<div class="scene">${s.html()}</div>`;
  const sc = stage.firstElementChild;
  requestAnimationFrame(() => requestAnimationFrame(() => sc.classList.add("on")));
  $$(".desk-tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.scene === name)));
  s.run();
  clearTimeout(autoTimer);
  if (auto) autoTimer = setTimeout(() => show(order[(order.indexOf(name) + 1) % order.length]), 7200);
}
$$(".desk-tabs button").forEach((b) => b.addEventListener("click", () => { auto = false; show(b.dataset.scene); }));
$(".desk-tabs").addEventListener("keydown", (e) => {
  if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(e.key)) return;
  e.preventDefault(); auto = false;
  const i = order.indexOf(current) + (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1);
  const next = order[(i + order.length) % order.length]; show(next); $(`[data-scene="${next}"]`).focus();
});
// start the desk when it scrolls into view
const deskIO = new IntersectionObserver((es) => { if (es[0].isIntersecting) { show("point"); deskIO.disconnect(); } }, { threshold: 0.3 });
deskIO.observe($("#desk"));

/* ---------------- go ---------------- */
$$(".open-copy, .graph, .desk h2, .latest-grid > div, .cl-card").forEach((e) => e.classList.add("rv"));
reveal();
stars();
intro();
