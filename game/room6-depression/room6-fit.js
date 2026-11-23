/* room6-fit.js — 房間 6 活動頁一屏看完:#missionView 的內容固定 1280px 寬排版,再依視窗等比縮放(zoom),
   內容比視窗高時也一併縮到放得下,不需下捲。只動版面,不動內容與流程。 */
(() => {
  const BASE_W = 1280, MIN_Z = 0.5;
  const root = document.documentElement;
  root.classList.add("r6-fit");
  let queued = false;

  function fit() {
    queued = false;
    const v = document.querySelector("#missionView:not([hidden])");
    if (!v) { root.style.setProperty("--r6-z", "1"); return; }
    const kids = [...v.children].filter(c => c.offsetParent !== null || getComputedStyle(c).display !== "none");
    kids.forEach(c => { c.style.zoom = "1"; c.style.width = BASE_W + "px"; c.style.marginLeft = "auto"; c.style.marginRight = "auto"; c.style.minHeight = "0"; });
    const h = kids.reduce((s, c) => s + c.offsetHeight, 0);
    const z = Math.max(MIN_Z, Math.min(innerWidth / BASE_W, innerHeight / Math.max(h, 1)));
    kids.forEach(c => { c.style.zoom = z.toFixed(4); });
    const content = v.querySelector("#missionContent");
    if (content) { const rest = kids.filter(c => c !== content).reduce((s, c) => s + c.offsetHeight * z, 0); content.style.minHeight = Math.max(0, Math.floor((innerHeight - rest) / z) - 2) + "px"; }
    root.style.setProperty("--r6-z", z.toFixed(4));
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(fit); } }

  function start() {
    const app = document.querySelector("#app");
    if (!app) return;
    new MutationObserver(fit).observe(app, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["hidden"] });
    addEventListener("resize", queue);
    queue();
  }
  window.Room6Fit = { refit: fit };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
