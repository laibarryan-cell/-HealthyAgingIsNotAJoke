/* story-kit.js — 「方格表模式」共用輔助(顏色進度條、星星飛入、操作提示、選項下拉)
   依賴:story-dialog.js(window.StoryDialog)。載入順序:story-copy.js → story-art-config.js → story-dialog.js → story-kit.js
   配套樣式:story-kit.css。房間二起使用;房間一沿用自己的版本,不引用此檔。 */
(function (root) {
  "use strict";
  const SD = () => root.StoryDialog;

  /* 重建進度條為 n 格並歸零。bar 為任何容器元素 */
  function makeBar(bar, n) {
    bar.classList.add("color-progress");
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", String(n));
    bar.replaceChildren(...Array.from({ length: n }, () => document.createElement("i")));
    setBar(bar, 0);
    return bar;
  }
  function setBar(bar, filled) {
    [...bar.children].forEach((seg, i) => seg.classList.toggle("is-filled", i < filled));
    bar.classList.toggle("is-full", bar.children.length > 0 && filled >= bar.children.length);
    bar.setAttribute("aria-valuenow", String(filled));
  }
  /* 星星帶軌跡飛向進度條,抵達後填色 */
  async function awardStar(fromEl, bar, filled) {
    try { await SD().flyStar(fromEl, bar); } catch (e) { /* 元素已移除時略過動畫 */ }
    setBar(bar, filled);
  }

  /* 一般提示:lines 可為字串或字串陣列;NPC 在下方,按一下繼續。opts.clear 讓背景不變暗(即時遊戲用) */
  function say(lines, opts) {
    const o = Object.assign({ npc: 1, position: "bottom", clear: false }, opts);
    const arr = (Array.isArray(lines) ? lines : [lines]).map((t) => ({ who: o.who || "npc", text: t }));
    return SD().play({ npc: o.npc, position: o.position, clear: o.clear, lines: arr });
  }
  /* 提示 + 「知道了」按鈕(最後一句帶按鈕) */
  function showHint(lines, opts) {
    const o = Object.assign({ npc: 1, position: "bottom", clear: false, label: "知道了" }, opts);
    const arr = (Array.isArray(lines) ? lines : [lines]).map((t) => ({ who: "npc", text: t }));
    arr[arr.length - 1].buttons = [{ label: o.label, value: true }];
    return SD().play({ npc: o.npc, position: o.position, clear: o.clear, lines: arr });
  }
  /* 一句話 + 按鈕選項(例如「重新挑戰」);回傳被按的 value */
  function askButtons(text, buttons, opts) {
    const o = Object.assign({ npc: 1, position: "bottom", clear: false }, opts);
    return SD().ask({ npc: o.npc, position: o.position, clear: o.clear, text, buttons });
  }

  /* 選項由上而下下拉展開 */
  function dropHide(list) { list.classList.remove("sk-stagger"); list.classList.add("sk-hidden"); }
  function dropShow(list) { list.classList.remove("sk-hidden"); list.classList.add("sk-stagger"); }

  /* 暫停/繼續即時遊戲:pausable = { pause(), resume() };顯示 fn() 期間暫停 */
  async function withPause(pausable, fn) {
    if (pausable && pausable.pause) pausable.pause();
    try { return await fn(); } finally { if (pausable && pausable.resume) pausable.resume(); }
  }

  /* C7 阿公(玩家角色)移動:用裝扮台的走路圖集(MemoryMazeCharacters.prepareWalk)沿座標點走。
     container 需為定位容器;points = [{x,y}](容器寬高的百分比);opts.height 角色高度(px 或 css 長度);
     opts.el 可傳入既有 .sk-walker 以接續位置。回傳 Promise,走完 resolve 並回傳 walker 元素。 */
  const walkCache = { draw: null, p: null };
  function walkDrawer() {
    const M = root.MemoryMazeCharacters;
    if (!M || !M.prepareWalk) return Promise.resolve(null);
    if (!walkCache.p) walkCache.p = M.prepareWalk().then((d) => (walkCache.draw = d)).catch(() => { walkCache.p = null; return null; });
    return walkCache.p;
  }
  function walker(container, at, opts) {
    const o = Object.assign({ height: 120 }, opts);
    let w = o.el;
    if (!w) {
      w = document.createElement("div"); w.className = "sk-walker"; w.setAttribute("aria-hidden", "true");
      const cv = document.createElement("canvas"); cv.width = 256; cv.height = 256; w.appendChild(cv); container.appendChild(w);
    }
    const h = typeof o.height === "number" ? o.height + "px" : o.height;
    w.style.height = h; w.style.width = typeof o.height === "number" ? h : "auto"; w.style.aspectRatio = "1";
    if (at) { w.style.left = at.x + "%"; w.style.top = at.y + "%"; w.dataset.x = at.x; w.dataset.y = at.y; }
    walkDrawer().then((d) => { if (d && w.isConnected) d(w.querySelector("canvas"), o.facing || "down", 0); });
    return w;
  }
  function facingOf(dx, dy) { return Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "right" : "left") : (dy >= 0 ? "down" : "up"); }
  async function walk(container, points, opts) {
    const o = Object.assign({ speed: 22, height: 120, endFacing: null }, opts);   /* speed:每秒走過容器寬度的百分比 */
    const w = o.el || walker(container, points[0], o);
    const draw = await walkDrawer();
    const cv = w.querySelector("canvas");
    const reduced = root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let x = Number(w.dataset.x != null ? w.dataset.x : points[0].x), y = Number(w.dataset.y != null ? w.dataset.y : points[0].y);
    const rect = container.getBoundingClientRect(); const aspect = rect.width && rect.height ? rect.height / rect.width : 0.6;
    let facing = "down";
    for (const pt of points) {
      const dx = pt.x - x, dy = pt.y - y; const dist = Math.hypot(dx, dy * aspect);
      if (dist < 0.01) continue;
      facing = facingOf(dx, dy * aspect);
      const dur = reduced ? 1 : (dist / o.speed) * 1000;
      const sx = x, sy = y;
      await new Promise((resolve) => {
        const t0 = performance.now();
        (function tick(now) {
          if (!w.isConnected) { resolve(); return; }
          const t = Math.min(1, (now - t0) / dur);
          x = sx + dx * t; y = sy + dy * t;
          w.style.left = x + "%"; w.style.top = y + "%";
          if (o.onMove) o.onMove(x, y, w);   /* 選用:每一格回呼(例:依遠近改大小) */
          if (draw) draw(cv, facing, Math.floor(now / 110) % 6);
          if (t < 1) requestAnimationFrame(tick); else resolve();
        })(t0);
      });
    }
    w.dataset.x = x; w.dataset.y = y;
    if (draw && w.isConnected) draw(cv, o.endFacing || facing, 0);
    return w;
  }

  root.StoryKit = { makeBar, setBar, awardStar, say, showHint, askButtons, dropHide, dropShow, withPause, walker, walk };
})(window);
