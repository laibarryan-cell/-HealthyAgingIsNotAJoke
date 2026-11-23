/* pixel-cursor.js — 第三修改計劃新增內容2 A1:滑鼠游標改成像素圖示
   一般 = assets/ui-shell/cursor-default.png(尖端 2,2);可點擊 = cursor-hand.png(指尖 12,1)。2026-11-17 換成遊戲專屬草稿:鑰匙圈箭頭+長者指路的手(穿外套袖口)。
   首頁外殼與 game/ 下每一頁都會載入(game 內由 art-ui.js 自動載入)。
   CSS 無法把別的樣式寫的 cursor:pointer 換成圖,所以滑鼠經過時把「pointer」改成手指圖示。
   正式圖(ChatGPT ART-N2-01)到了,用同檔名覆蓋兩張圖即可。 */
(function (root) {
  "use strict";
  const doc = root.document;
  if (!doc || root.__pixelCursor) return;
  root.__pixelCursor = true;
  const me = doc.currentScript && doc.currentScript.src;
  const shell = me ? me.replace(/game\/shared\/pixel-cursor\.js.*$/, "") : "";   // 專案根目錄
  const ARROW = `url("${shell}assets/ui-shell/cursor-default.png?v=3") 2 2, auto`;
  const HAND = `url("${shell}assets/ui-shell/cursor-hand.png?v=3") 12 1, pointer`;
  const css = doc.createElement("style");
  css.textContent = `html{cursor:${ARROW}}
:is(a[href],button,[role="button"],select,summary,label[for],.door-hotspot,.swatch,.base-character,.hotspot,.map-hotspot,[data-object],[data-search],.sd-overlay):not(:disabled){cursor:${HAND}}
input:not([type="range"]):not([type="checkbox"]):not([type="radio"]),textarea{cursor:text}`;
  (doc.head || doc.documentElement).appendChild(css);
  const done = new WeakSet();
  doc.addEventListener("pointerover", e => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    let t = e.target;
    for (let i = 0; t && t.nodeType === 1 && i < 4; i++, t = t.parentElement) {
      if (done.has(t)) return;
      const c = root.getComputedStyle(t).cursor;
      if (c === "pointer") { t.style.setProperty("cursor", HAND, "important"); done.add(t); return; }
      if (c === "default") { t.style.setProperty("cursor", ARROW); done.add(t); return; }
      if (c !== "auto") { done.add(t); return; }
    }
  }, true);
})(window);
