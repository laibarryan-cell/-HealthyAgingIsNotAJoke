/* room4-fit.js — 房間 2 活動頁一屏看完:內容固定 1280px 寬排版,再依 iframe 視窗等比縮放(zoom),
   內容比視窗高時也一併縮到放得下,不需下捲。只動版面,不動教育內容與流程。 */
(() => {
  const BASE_W = 1280, MIN_Z = 0.5;
  const root = document.documentElement;
  root.classList.add("r2-fit");
  let queued = false;

  function currentZoom(el) { return parseFloat(el && el.style.zoom) || 1; }

  function fit() {
    queued = false;
    const m = document.querySelector("#app > .view:not(#roomView):not([hidden])");
    if (!m) { root.style.setProperty("--r2-z", "1"); return; }
    /* 第三修改計劃 I 節:醫藥箱接水管(任務與任務完成畫面)改用房一做法——基準 1280×720 等比縮放、頁高固定一屏 */
    const pipe = m.id === "activityView" && !!m.querySelector("#activityBody > .emergency-layout, #activityBody #nextEmergency");
    m.classList.toggle("r2-pipe", pipe);
    if (pipe) {
      const zr = Math.max(MIN_Z, Math.min(innerWidth / BASE_W, innerHeight / 720));
      m.style.width = BASE_W + "px"; m.style.zoom = zr.toFixed(4); m.style.minHeight = "0";
      m.style.height = (innerHeight / zr).toFixed(2) + "px";
      root.style.setProperty("--r2-z", zr.toFixed(4));
      return;
    }
    m.style.height = "";
    m.style.zoom = "1";
    m.style.width = BASE_W + "px";
    m.style.minHeight = "0";
    const h = Math.max(m.scrollHeight, m.offsetHeight);
    const z = Math.max(MIN_Z, Math.min(innerWidth / BASE_W, innerHeight / Math.max(h, 1)));
    m.style.zoom = z.toFixed(4);
    m.style.minHeight = Math.max(0, Math.floor(innerHeight / z) - 2) + "px";
    root.style.setProperty("--r2-z", z.toFixed(4));
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(fit); } }

  function start() {
    const app = document.querySelector("#app");
    if (!app) return;
    new MutationObserver(fit).observe(app, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["hidden"] });
    addEventListener("resize", queue);
    queue();
  }
  window.Room2Fit = { refit: fit, zoom: () => currentZoom(document.querySelector("#app > .view:not(#roomView):not([hidden])")) };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
