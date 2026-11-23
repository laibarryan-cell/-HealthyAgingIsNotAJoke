/* room1-layout.js — 依視窗大小等比縮放房間 1 的非房間畫面(設計基準 1280x720),讓每個畫面一屏看完。 */
(() => {
  const BASE_W = 1280, BASE_H = 720, MIN_Z = 0.6;
  const root = document.documentElement;
  function fit() {
    const z = Math.max(MIN_Z, Math.min(innerWidth / BASE_W, innerHeight / BASE_H));
    root.style.setProperty("--r1-z", z.toFixed(4));
  }
  root.classList.add("r1-fit");
  fit();
  addEventListener("resize", fit);
})();
