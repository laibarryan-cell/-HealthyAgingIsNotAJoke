/* room3-layout.js — 依視窗大小等比縮放房間 3 的非房間畫面(設計基準 1280x720),讓每個畫面一屏看完。 */
(() => {
  const BASE_W = 1280, BASE_H = 720, MIN_Z = 0.6;
  const root = document.documentElement;
  function fit() {
    const z = Math.max(MIN_Z, Math.min(innerWidth / BASE_W, innerHeight / BASE_H));
    root.style.setProperty("--r3-z", z.toFixed(4));
  }
  root.classList.add("r3-fit");
  fit();
  addEventListener("resize", fit);
})();

/* 營養食物(.fl)是一整張卡片、內部有拖曳座標:不重排內部,只把整張卡片縮放到內容區放得下(不改它的邏輯)。 */
(() => {
  let queued = false;
  function fitFl() {
    queued = false;
    const host = document.querySelector("#missionContent");
    const fl = host && host.querySelector(".fl");
    if (!fl) return;
    fl.style.zoom = "1";
    const availH = host.clientHeight, availW = host.clientWidth;
    const s = Math.min(1, availH / fl.offsetHeight, availW / fl.offsetWidth);
    fl.style.zoom = String(Math.max(0.5, s).toFixed(3));
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(fitFl); } }
  function start() {
    const host = document.querySelector("#missionContent");
    if (!host) return;
    new MutationObserver(queue).observe(host, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["hidden", "class"] });
    addEventListener("resize", queue);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

/* 兩張食物圖集(food-realistic-pixel.png、food-atlas.png)四周烘了深藍邊:量出實際內容範圍(0~1),
   供 CSS 與 food-learning.js / rpg/ui.js 切格子時使用。新圖沒有邊時範圍就是整張圖,行為不變。 */
(() => {
  window.R3FoodBox = { x: 0, y: 0, w: 1, h: 1 };
  function measure(src, done) {
    const img = new Image();
    img.onload = () => {
      try {
        const w = img.naturalWidth, h = img.naturalHeight, c = document.createElement("canvas");
        c.width = w; c.height = h;
        const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(img, 0, 0);
        const d = x.getImageData(0, 0, w, h).data;
        const bar = (px, py) => { const o = (py * w + px) * 4; return d[o + 3] > 200 && (d[o] < 40 && d[o + 1] < 50 && d[o + 2] < 90); };
        const colBar = (col) => { let n = 0, t = 0; for (let y = 0; y < h; y += 8) { t++; if (bar(col, y)) n++; } return n / t > .9; };
        const rowBar = (row) => { let n = 0, t = 0; for (let x2 = 0; x2 < w; x2 += 8) { t++; if (bar(x2, row)) n++; } return n / t > .9; };
        let l = 0, r = w - 1, tp = 0, b = h - 1;
        while (l < w / 4 && colBar(l)) l++;
        while (r > w * 3 / 4 && colBar(r)) r--;
        while (tp < h / 4 && rowBar(tp)) tp++;
        while (b > h * 3 / 4 && rowBar(b)) b--;
        done({ x: l / w, y: tp / h, w: (r - l + 1) / w, h: (b - tp + 1) / h });
      } catch (e) { /* 量不到就維持整張圖 */ }
    };
    img.src = src;
  }
  const set = (prefix, box) => {
    const s = document.documentElement.style;
    s.setProperty(`--${prefix}-x0`, box.x.toFixed(4)); s.setProperty(`--${prefix}-y0`, box.y.toFixed(4));
    s.setProperty(`--${prefix}-w`, box.w.toFixed(4)); s.setProperty(`--${prefix}-h`, box.h.toFixed(4));
  };
  measure("assets/food-realistic-pixel.png", (box) => { window.R3FoodBox = box; set("fl", box); });
  measure("assets/food-atlas.png", (box) => { window.R3AtlasBox = box; set("at", box); });
})();
