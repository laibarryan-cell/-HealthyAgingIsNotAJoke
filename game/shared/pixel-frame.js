/* pixel-frame.js — 第三修改計劃 B5:消除像素框按鈕/名牌/面板上的細線
   原因:CSS border-image 九宮格是「九張圖分開畫」。元件位置或寬度是小數像素(置中、等比縮放、滑過時的縮放)時,
   九塊之間會露出 1px 接縫(使用者看到的「下一句 ▶」按鈕內的長方形細線)。
   做法:把同一個九宮格(同一張圖、同樣切片與框寬)先在 canvas 上合成成「一整張」圖,改用背景貼上;
   瀏覽器只畫一張圖,就不會有接縫。外觀(框圖、切片、框寬、fill)完全照原本 CSS 計算值,不改樣式檔。
   自動處理:新加入的元件、class 改變(例如 .active)、尺寸改變。只處理 stretch 模式;其他模式維持原樣。 */
(function (root) {
  "use strict";
  if (root.PixelFrame) return;
  const doc = root.document;
  const OFF = "data-pf";                       // 已接手的元件
  const imgCache = new Map();                  // src -> Promise<Image|null>
  const bakeCache = new Map();                 // key -> dataURL
  const state = new WeakMap();                 // el -> {sig, key}
  const SCALE = 3;                             // 合成解析度(CSS px × 3,縮放後仍銳利)
  let ro = null, pending = new Set(), timer = 0;

  function loadImg(src) {
    if (!imgCache.has(src)) imgCache.set(src, new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }));
    return imgCache.get(src);
  }
  const num = v => parseFloat(v) || 0;
  function four(list) { const a = list.slice(0, 4); while (a.length < 4) a.push(a.length === 1 ? a[0] : a.length === 2 ? a[0] : a[1]); if (list.length === 3) a[3] = list[1]; return a; }

  /* 讀「原本」的 border-image 計算值(先暫時拿掉自己的覆寫) */
  function readOriginal(el) {
    const had = el.hasAttribute(OFF);
    if (had) { el.style.removeProperty("border-image-source"); }
    const cs = root.getComputedStyle(el);
    const src = cs.borderImageSource, out = {
      src: src && src !== "none" ? (src.match(/url\(["']?(.*?)["']?\)/) || [])[1] : null,
      slice: cs.borderImageSlice, width: cs.borderImageWidth, repeat: cs.borderImageRepeat, outset: cs.borderImageOutset,
      bw: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].map(num)
    };
    if (had) el.style.setProperty("border-image-source", "none", "important");
    return out;
  }

  function clear(el) {
    if (!el.hasAttribute(OFF)) return;
    el.removeAttribute(OFF);
    ["border-image-source", "background-image", "background-size", "background-origin", "background-clip", "background-repeat", "background-position"].forEach(p => el.style.removeProperty(p));
    state.delete(el);
  }

  async function bake(el) {
    if (!el.isConnected) return;
    const o = readOriginal(el);
    if (!o.src || !/stretch/.test(o.repeat) || /[1-9]/.test(o.outset)) { clear(el); return; }
    const w = el.offsetWidth, h = el.offsetHeight;
    if (!w || !h) return;                                    // 隱藏中:顯示後 ResizeObserver 會再叫一次
    const parts = o.slice.split(/\s+/), fill = parts.includes("fill");
    const sl = four(parts.filter(p => p !== "fill").map(num));          // top right bottom left(圖檔像素)
    const wl = four(o.width.split(/\s+/)).map((v, i) => v === "auto" ? sl[i] : /px$/.test(v) ? num(v) : num(v) * o.bw[i]);
    const sig = [o.src, sl.join(","), wl.map(v => v.toFixed(3)).join(","), fill, w, h].join("|");
    const st = state.get(el); if (st && st.sig === sig && el.hasAttribute(OFF)) return;
    const img = await loadImg(o.src); if (!img || !el.isConnected) return;
    let url = bakeCache.get(sig);
    if (!url) {
      const k = SCALE, cw = Math.round(w * k), ch = Math.round(h * k);
      const c = doc.createElement("canvas"); c.width = cw; c.height = ch;
      const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      let [T, R, B, L] = wl.map(v => Math.round(v * k));
      /* 框寬加起來超過元件時等比縮小(與 CSS 規則相同) */
      const f = Math.min(1, cw / Math.max(1, L + R), ch / Math.max(1, T + B)); if (f < 1) { T = Math.floor(T * f); R = Math.floor(R * f); B = Math.floor(B * f); L = Math.floor(L * f); }
      const sx = [0, sl[3], iw - sl[1], iw], sy = [0, sl[0], ih - sl[2], ih];
      const dx = [0, L, cw - R, cw], dy = [0, T, ch - B, ch];
      for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) {
        if (r === 1 && q === 1 && !fill) continue;
        const sw = sx[q + 1] - sx[q], shh = sy[r + 1] - sy[r], dw = dx[q + 1] - dx[q], dh = dy[r + 1] - dy[r];
        if (sw > 0 && shh > 0 && dw > 0 && dh > 0) g.drawImage(img, sx[q], sy[r], sw, shh, dx[q], dy[r], dw, dh);
      }
      try { url = c.toDataURL("image/png"); } catch (e) { return; }
      if (bakeCache.size > 400) bakeCache.clear();
      bakeCache.set(sig, url);
    }
    /* 原本若已有背景圖,合成圖疊在最上層,原本的背景保留 */
    ["background-image", "background-size", "background-origin", "background-clip", "background-repeat", "background-position"].forEach(p => el.style.removeProperty(p));
    const cs = root.getComputedStyle(el), bg = cs.backgroundImage;
    const keep = bg && bg !== "none" ? bg : "";
    const list = (v, d) => keep ? `${d}, ${v}` : d;
    el.style.setProperty("border-image-source", "none", "important");
    el.style.setProperty("background-image", list(bg, `url("${url}")`), "important");
    el.style.setProperty("background-size", list(cs.backgroundSize, "100% 100%"), "important");
    el.style.setProperty("background-origin", list(cs.backgroundOrigin, "border-box"), "important");
    el.style.setProperty("background-clip", list(cs.backgroundClip, "border-box"), "important");
    el.style.setProperty("background-repeat", list(cs.backgroundRepeat, "no-repeat"), "important");
    el.style.setProperty("background-position", list(cs.backgroundPosition, "0 0"), "important");
    el.setAttribute(OFF, "");
    state.set(el, { sig });
  }

  /* 第三修改計劃 B1:物品面板在 Shadow DOM 裡,也要一起處理(新加入的節點、class 改變都要跟上) */
  const shadows = new WeakSet();
  function watchShadow(sr) {
    if (!sr || shadows.has(sr)) return; shadows.add(sr);
    new MutationObserver(recs => {
      for (const r of recs) {
        if (r.type === "childList") r.addedNodes.forEach(n => { if (n.nodeType === 1) queue(n); });
        else if (r.attributeName === "class") queue(r.target);
      }
    }).observe(sr, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
    sr.querySelectorAll("*").forEach(consider);
  }
  function consider(el) {
    if (!(el instanceof root.Element)) return;
    if (el.shadowRoot) watchShadow(el.shadowRoot);
    if (el.hasAttribute(OFF)) { bake(el); return; }
    const s = root.getComputedStyle(el).borderImageSource;
    if (s && s !== "none") { if (ro) ro.observe(el); bake(el); }
  }
  function scan(rootEl) {
    if (!rootEl || !rootEl.querySelectorAll) return;
    consider(rootEl);
    rootEl.querySelectorAll("*").forEach(consider);
  }
  function flush() {
    timer = 0; const list = [...pending]; pending.clear();
    if (list.includes(doc.documentElement)) { scan(doc.documentElement); return; }
    list.forEach(n => scan(n));
  }
  function queue(n) { pending.add(n); if (!timer) timer = setTimeout(flush, 60); }

  function start() {
    if (root.ResizeObserver) ro = new ResizeObserver(es => es.forEach(e => bake(e.target)));
    new MutationObserver(recs => {
      for (const r of recs) {
        if (r.type === "childList") r.addedNodes.forEach(n => { if (n.nodeType === 1) queue(n); });
        else if (r.attributeName === "class") queue(r.target);
      }
    }).observe(doc.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
    queue(doc.documentElement);
    /* 樣式表晚一點才載入、字型載入後尺寸改變:再掃一次 */
    root.addEventListener("load", () => queue(doc.documentElement));
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(() => queue(doc.documentElement));
  }
  root.PixelFrame = { refresh: () => queue(doc.documentElement) };
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start); else start();
})(window);
