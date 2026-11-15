// Shared helpers: render a changelog entry, relative dates, and wiring a cirrus sky
// to a section whose content sits on top of the canvas.
import { mount } from "./cirrus.js";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const PLAT = { mac: "macOS", windows: "Windows", site: "Website" };

export function fmtDate(iso) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
export function ago(iso) {
  const days = Math.round((Date.now() - new Date(iso + "T12:00:00")) / 864e5);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}
export function slug(r) { return r.version ? "v" + r.version.replace(/\./g, "-") : r.date; }

export function metaHTML(r) {
  const status = r.status === "released"
    ? `<span class="tag released"><span class="d"></span>released</span>`
    : `<span class="tag main"><span class="d"></span>on main · next build</span>`;
  const ver = r.version ? `<span class="tag ver">v${esc(r.version)}</span>` : "";
  const plats = r.platforms.map((p) => `<span class="tag">${PLAT[p] || esc(p)}</span>`).join("");
  return `<div class="cl-meta">${ver}${status}${plats}<time class="cl-date" datetime="${r.date}">${fmtDate(r.date)}</time></div>`;
}
export function sectionsHTML(r, limit = Infinity) {
  let shown = 0;
  return r.sections.map((s) => {
    const items = s.items.filter(() => shown++ < limit);
    if (!items.length) return "";
    return `<div class="cl-sec"><h4>// ${esc(s.name)}</h4><ul class="cl-items">${items
      .map((it) => `<li><strong>${esc(it.title)}.</strong> ${esc(it.text)}</li>`).join("")}</ul></div>`;
  }).join("");
}

/** Mount a cirrus sky in `skyEl` and let pointer moves over `section` (including over its text) stir the wind. */
export function skyFor(section, skyEl, config) {
  const sky = mount(skyEl, config);
  const canvas = skyEl.querySelector("canvas");
  if (!canvas) return { sky, canvas: null };
  section.addEventListener("pointermove", (e) => {
    if (e.target === canvas || !e.isTrusted) return;
    canvas.dispatchEvent(new PointerEvent("pointermove", { clientX: e.clientX, clientY: e.clientY, pointerType: e.pointerType }));
  });
  section.addEventListener("pointerleave", () => canvas.dispatchEvent(new PointerEvent("pointerleave")));
  return { sky, canvas };
}

export function reveal(sel = ".rv") {
  const els = document.querySelectorAll(sel);
  if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.15 });
  els.forEach((e) => io.observe(e));
}

export async function stars() {
  const el = document.querySelector("[data-stars]");
  if (!el) return;
  try {
    const r = await fetch("https://api.github.com/repos/VedSoni-dev/teachy", { headers: { Accept: "application/vnd.github+json" } });
    if (!r.ok) return;
    const j = await r.json();
    if (typeof j.stargazers_count === "number") { el.textContent = "★ " + j.stargazers_count.toLocaleString(); el.hidden = false; }
  } catch { /* offline or rate-limited: just no count */ }
}
