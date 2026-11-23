/* room5-story.js — 房間五「方格表模式」共用輔助(進度條、NPC 提示、暫停鉤子、選擇題演出)
   依賴 story-copy.js / story-art-config.js / story-dialog.js / story-kit.js。五個入口共用,不重寫對話元件。 */
(function (root) {
  "use strict";
  const K = () => root.StoryKit, C = () => root.StoryCopy.room5;
  let pauser = null, hintText = null, total = 0;
  const seen = new Set();
  const GRANDSON = new URL("assets/phone/grandson.png", document.baseURI).href;   /* 孫子立繪(對話框裡孫子發話時使用) */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const R5 = {
    /* 即時計時的暫停/恢復:pauser = { pause(), resume() };換頁時用 setPauser(null) 清除 */
    setPauser(p) { pauser = p || null; },
    async paused(fn) {
      const p = pauser;
      if (p && p.pause) p.pause();
      try { return await fn(); } finally { if (p && p.resume && p === pauser) p.resume(); }
    },
    say(lines, opts) { return R5.paused(() => K().say(lines, opts)); },
    ask(text, opts) { return R5.paused(() => root.StoryDialog.ask(Object.assign({ npc: 1, position: "center" }, opts, { text }))); },
    /* 玩家與 NPC 對話:lines = [{who,text}] */
    talk(lines, opts) { const o = Object.assign({ npc: 1, position: "bottom" }, opts); const d = { npc: o.npc, position: o.position, clear: !!o.clear, lines, grandsonSrc: GRANDSON }; if (o.npcName) d.npcName = o.npcName; return R5.paused(() => root.StoryDialog.play(d)); },
    resetSeen() { seen.clear(); },
    sleep,

    /* 統一頁首:返回、標題、顏色進度條 */
    header({ backId = "returnRoom", title, barId = "r5Bar" }) {
      return `<header class="mission-bar r5-bar"><button class="back" id="${backId}">← 返回房間</button><h1 id="moduleTitle" class="r5-title" tabindex="-1">${title}</h1><div id="${barId}" class="progress-chip color-progress" aria-label="進度"></div></header>`;
    },
    /* 「💡 操作提示」按鈕列;extra = 其正下方的重置類按鈕 html */
    toolbar(extra = "") {
      return `<div class="act-toolbar r5-toolbar"><button id="r5Hint" class="secondary hint-btn" type="button">💡 ${C().hintLabel}</button><div id="r5Extra" class="act-extra">${extra}</div></div>`;
    },
    /* 頁面寫入後呼叫:建立進度條、綁定操作提示;首次進入該畫面由 NPC 給提示(回傳 Promise) */
    init(id, hint, totalCells, filled, barSel = "#r5Bar") {
      hintText = hint; total = totalCells;
      const bar = document.querySelector(barSel);
      if (bar && totalCells) { K().makeBar(bar, totalCells); K().setBar(bar, filled || 0); }
      else if (bar) bar.hidden = true;
      const btn = document.querySelector("#r5Hint");
      if (btn) { btn.onclick = () => { if (hintText) R5.say([hintText.button]); }; btn.hidden = !hint; }
      if (!hint || seen.has(id) || !hint.lines) return Promise.resolve();
      seen.add(id);
      return R5.say(hint.lines);
    },
    /* 換到新的子畫面:更新操作提示,並在第一次進入時由 NPC 說明 */
    enter(id, hint) { R5.setHint(hint); if (!hint || !hint.lines || seen.has(id)) return Promise.resolve(); seen.add(id); return R5.say(hint.lines); },
    setHint(hint) { hintText = hint; const btn = document.querySelector("#r5Hint"); if (btn) btn.hidden = !hint; },
    bar() { return document.querySelector("#r5Bar"); },
    fill(n) { const b = R5.bar(); if (b) K().setBar(b, n); },
    async star(from, filled) {
      const bar = R5.bar();
      if (bar) await K().awardStar(from || document.body, bar, Math.min(bar.children.length || total, filled));
    },

    /* 選擇題:NPC 念題 → 選項由上往下下拉 → 玩家疑惑。list = 選項容器,alive() 為頁面仍存在 */
    async quiz({ list, ask, wonder, alive }) {
      list.classList.add("sk-drop-list"); K().dropHide(list);
      await R5.ask(ask);
      if (!alive()) return;
      K().dropShow(list);
      await sleep(1000);
      if (!alive()) return;
      await R5.say([wonder], { who: "player", clear: true });
    }
  };
  root.R5 = R5;
})(window);
