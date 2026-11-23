/* room4-fit.js — 房間 4 活動頁一屏看完:內容固定 1280px 寬排版,再依 iframe 視窗等比縮放(zoom),
   內容比視窗高時也一併縮到放得下,不需下捲。只動版面,不動教育內容與流程。 */
(() => {
  const BASE_W = 1280, MIN_Z = 0.5;
  const root = document.documentElement;
  root.classList.add("r4-fit");
  let queued = false;

  function currentZoom(el) { return parseFloat(el && el.style.zoom) || 1; }

  function fit() {
    queued = false;
    const m = document.querySelector("#app > .mission");
    if (!m) { root.style.setProperty("--r4-z", "1"); return; }
    m.style.zoom = "1";
    m.style.width = BASE_W + "px";
    m.style.minHeight = "0";
    const h = Math.max(m.scrollHeight, m.offsetHeight);
    const z = Math.max(MIN_Z, Math.min(innerWidth / BASE_W, innerHeight / Math.max(h, 1)));
    m.style.zoom = z.toFixed(4);
    m.style.minHeight = Math.max(0, Math.floor(innerHeight / z) - 2) + "px";
    root.style.setProperty("--r4-z", z.toFixed(4));
  }
  /* 醫藥盒(醫療資源任務)頁:第三修改計劃 F4-5 / I 節,與房間一相同做法——設計基準 1280×720,
     依視窗等比縮放整頁(可放大),頁高固定為一屏,面板以 flex 填滿,不需下捲、不再狹長 */
  function fitResource() {
    const v = document.querySelector("#resourceView");
    if (!v || v.hidden) return;
    const z = Math.max(0.5, Math.min(innerWidth / 1280, innerHeight / 720));
    v.style.zoom = z.toFixed(4);
    v.style.minHeight = "0";
    v.style.height = (innerHeight / z).toFixed(2) + "px";
    root.style.setProperty("--r4-rz", z.toFixed(4));
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(() => { fit(); fitResource(); }); } }

  function start() {
    const app = document.querySelector("#app");
    if (!app) return;
    new MutationObserver(fit).observe(app, { childList: true, subtree: true, characterData: true });
    addEventListener("resize", queue);
    const rv = document.querySelector("#resourceView");
    if (rv) new MutationObserver(queue).observe(rv, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"], characterData: true });
    queue();
  }
  window.Room4Fit = { refit: () => { fit(); fitResource(); }, zoom: () => currentZoom(document.querySelector("#app > .mission")) };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
