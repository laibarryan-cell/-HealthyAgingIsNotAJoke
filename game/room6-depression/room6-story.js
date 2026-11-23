/* room6-story.js — 房間六「方格表模式」共用輔助(進度條、NPC 提示、操作提示鈕、星星)
   依賴 story-copy.js / story-art-config.js / story-dialog.js / story-kit.js。三個入口共用,不重寫對話元件。 */
(function (root) {
  "use strict";
  const K = () => root.StoryKit, C = () => root.StoryCopy.room6;
  const $ = (s) => document.querySelector(s);
  const seen = new Set();
  let hintText = null, total = 0;

  const R6 = {
    say(lines, opts) { return K().say(lines, opts); },
    /* 玩家(左)與 NPC(右)對話:lines = [{who,text}] */
    talk(lines, opts) { const o = Object.assign({ npc: 1, position: "bottom" }, opts); return root.StoryDialog.play({ npc: o.npc, position: o.position, clear: !!o.clear, lines }); },
    /* 進入任務:設定標題、返回鈕文字、進度條格數;提示鈕先隱藏 */
    begin(title, cells) {
      total = cells || 0; hintText = null;
      const t = $("#missionTitle"); if (t) t.textContent = title;
      const back = $("#returnRoom"); if (back) back.textContent = C().backLabel;
      const bar = $("#r6Bar");
      if (bar) { if (total) { bar.hidden = false; K().makeBar(bar, total); } else bar.hidden = true; }
      R6.setHint(null); R6.extra("");
      const btn = $("#r6Hint"); if (btn) { btn.textContent = "💡 " + C().hintLabel; btn.onclick = () => { if (hintText) R6.say([hintText.button]); }; }
    },
    reset() { const bar = $("#r6Bar"); if (bar) bar.replaceChildren(); R6.setHint(null); R6.extra(""); },
    setHint(hint) { hintText = hint; const tb = $("#r6Toolbar"); if (tb) tb.hidden = !hint; if (root.Room6Fit) root.Room6Fit.refit(); },
    extra(html) { const e = $("#r6Extra"); if (e) e.innerHTML = html; return e; },
    /* 換到新的子畫面:更新提示,首次進入時由 NPC 說明(回傳 Promise) */
    enter(id, hint) { R6.setHint(hint); if (!hint || !hint.lines || seen.has(id)) return Promise.resolve(); seen.add(id); return R6.say(hint.lines); },
    resetSeen() { seen.clear(); },
    fill(n) { const b = $("#r6Bar"); if (b) K().setBar(b, n); },
    async star(from, filled) { const b = $("#r6Bar"); if (b) await K().awardStar(from || document.body, b, Math.min(b.children.length || total, filled)); }
  };
  /* 第二修改計劃 C6-0:主畫面物品改成「從房間圖裁出的同一塊畫面」,按下有回饋、不加框;每兩秒輪流亮一個未完成的物品 */
  function pressObjects() {
    const frame = $("#roomView .room-frame"), img = frame && frame.querySelector(".room-bg"); if (!frame || !img) return;
    const fr = frame.getBoundingClientRect(); if (!fr.width) return;
    frame.querySelectorAll(".hotspot").forEach((h) => {
      const x = h.offsetLeft / frame.clientWidth, y = h.offsetTop / frame.clientHeight, w = h.offsetWidth / frame.clientWidth, hh = h.offsetHeight / frame.clientHeight;
      /* 2026-11-18 柔邊:裁圖放進子圖層 .sk-crop 並加羽化遮罩(名牌在按鈕內,不能直接遮按鈕) */
      let c = h.querySelector(":scope > .sk-crop"); if (!c) { c = document.createElement("i"); c.className = "sk-crop"; c.setAttribute("aria-hidden", "true"); h.prepend(c); }
      c.style.backgroundImage = `url('${img.getAttribute("src")}')`;
      c.style.backgroundSize = `${(100 / w).toFixed(2)}% ${(100 / hh).toFixed(2)}%`;
      c.style.backgroundPosition = `${(x / (1 - w) * 100).toFixed(2)}% ${(y / (1 - hh) * 100).toFixed(2)}%`;
    });
  }
  function startShimmer() {
    let i = 0;
    setInterval(() => {
      const open = [...document.querySelectorAll("#roomView:not([hidden]) .hotspot:not(.done)")]; if (!open.length) return;
      const h = open[i++ % open.length]; h.classList.remove("r6-shimmer"); void h.offsetWidth; h.classList.add("r6-shimmer"); setTimeout(() => h.classList.remove("r6-shimmer"), 1200);
    }, 2000);
  }
  const boot = () => { pressObjects(); startShimmer(); addEventListener("resize", pressObjects); if (root.ResizeObserver) { const f = $("#roomView .room-frame"); if (f) new ResizeObserver(pressObjects).observe(f); } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else setTimeout(boot, 0);
  R6.pressObjects = pressObjects;
  root.R6 = R6;
})(window);
