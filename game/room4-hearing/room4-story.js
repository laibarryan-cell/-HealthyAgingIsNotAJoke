/* room4-story.js — 房間四「方格表模式」共用輔助(進度條、NPC 提示、暫停鉤子、選擇題演出)
   依賴 story-copy.js / story-art-config.js / story-dialog.js / story-kit.js。四個小遊戲與醫藥盒共用,不重寫對話元件。 */
(function (root) {
  "use strict";
  const K = () => root.StoryKit, C = () => root.StoryCopy.room4;
  let pauser = null, hintText = null, total = 0;
  const seen = new Set();
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const R4 = {
    /* 對話出現時,即時遊戲的暫停/恢復:pauser = { pause(), resume() };換頁時用 setPauser(null) 清除 */
    setPauser(p) { pauser = p || null; },
    async paused(fn) {
      const p = pauser;
      if (p && p.pause) p.pause();
      try { return await fn(); } finally { if (p && p.resume && p === pauser) p.resume(); }
    },
    say(lines, opts) { return R4.paused(() => K().say(lines, opts)); },
    ask(text, opts) { return R4.paused(() => root.StoryDialog.ask(Object.assign({ npc: 1, position: "center" }, opts, { text }))); },
    resetSeen() { seen.clear(); },
    /* 第三修改計劃 F4-1:衛教句子改由房間 NPC 用共用對話框逐句說;onStep(k) 在每句出現時呼叫(例如點亮右側重點) */
    teach(lines, onStep, opts) {
      return R4.paused(async () => {
        const d = root.StoryDialog.open(Object.assign({ npc: 1, position: "bottom", mode: "npc" }, opts)); await d.ready;
        try { for (let k = 0; k < lines.length; k++) { if (onStep) onStep(k); await d.say({ who: "npc", text: lines[k] }); } }
        finally { d.close(); }
      });
    },
    sleep,

    /* 統一頁首:返回、標題(遊戲名)、顏色進度條;其下為「💡 操作提示」與其正下方的重置類按鈕 */
    frame({ cls, backId, title, sub = "", content, extra = "", barExtra = "" }) {
      return `<section class="mission ${cls}"><header class="mission-bar"><button class="back" id="${backId}">← 返回房間</button><div class="mission-heading"><h2 tabindex="-1">${title}</h2></div>${barExtra ? `<div class="r4-barextra">${barExtra}</div>` : ""}<div id="r4Bar" class="progress-chip color-progress" aria-label="進度"></div></header>${sub ? `<p class="r4-sub">${sub}</p>` : ""}<div class="act-toolbar"><button id="r4Hint" class="secondary hint-btn" type="button">💡 ${C().hintLabel}</button><div id="r4Extra" class="act-extra">${extra}</div></div>${content}</section>`;
    },
    /* frame 寫入頁面後呼叫:建立進度條、綁定操作提示按鈕;首次進入該畫面由 NPC 給提示 */
    init(id, hint, totalCells, filled) {
      hintText = hint; total = totalCells;
      const bar = document.querySelector("#r4Bar");
      if (bar) { K().makeBar(bar, totalCells); K().setBar(bar, filled); }
      const btn = document.querySelector("#r4Hint");
      if (btn) btn.onclick = () => { if (hintText) R4.say([hintText.button]); };
      if (!hint) { const tb = document.querySelector(".act-toolbar"); if (tb && !document.querySelector("#r4Extra").children.length) tb.hidden = true; if (btn) btn.hidden = true; return Promise.resolve(); }
      if (seen.has(id) || !hint.lines) return Promise.resolve();
      seen.add(id);
      if (!hint.lines) return Promise.resolve();
      return R4.say(hint.lines);
    },
    setHint(hint) { hintText = hint; const btn = document.querySelector("#r4Hint"); if (btn) btn.hidden = !hint; },
    async star(from, filled) {
      const bar = document.querySelector("#r4Bar");
      if (bar) await K().awardStar(from || document.body, bar, Math.min(bar.children.length || total, filled));
    },

    /* 選擇題:NPC 念題 → 選項由上往下下拉 → 玩家疑惑。list = 選項容器,alive() 為頁面仍存在 */
    async quiz({ list, ask, wonder, alive }) {
      list.classList.add("sk-drop-list"); K().dropHide(list);
      await R4.ask(ask);
      if (!alive()) return;
      K().dropShow(list);
      await sleep(1000);
      if (!alive()) return;
      await R4.say([wonder], { who: "player", clear: true });
    }
  };
  root.R4 = R4;
})(window);
