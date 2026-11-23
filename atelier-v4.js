/* atelier-v4.js — 第三修改計劃新增內容2 B(放在 char-v3.js 之後載入,不改 game.js 原本邏輯)
   B3 每次進入「長者的裝扮台」,展示台前的窗簾是關的;點一下,左右兩邊窗簾拉開才看得到角色
   B4 按「隨機造型」:兩邊窗簾先合起來 → 在窗簾後換好造型 → 再拉開
   B5 操作說明改成遊戲樣式、內容改成目前的操作方式(裝扮台內不出現片尾老人);首頁的操作說明也同步更新 */
(function () {
  "use strict";
  const $ = s => document.querySelector(s);
  const screen = $("#screen-character"), stage = screen && screen.querySelector(".preview-stage");
  if (!screen || !stage) return;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- B2 行走預覽:一律維持裝扮特寫 ---------- */
  try { if (typeof state !== "undefined" && state.previewMode === "walk") $("#preview-mode").click(); } catch (e) {}

  /* ---------- B3 窗簾 ---------- */
  const cur = document.createElement("div");
  cur.className = "av4-curtains"; cur.setAttribute("aria-hidden", "true");
  cur.innerHTML = '<div class="av4-valance"></div><div class="av4-half av4-left"></div><div class="av4-half av4-right"></div>';
  stage.appendChild(cur);
  let isOpen = false, busy = false;
  const T = () => reduce() ? 60 : 900;
  function setClosed(closed) {
    isOpen = !closed; cur.classList.toggle("av4-open", !closed); stage.classList.toggle("av4-closed", closed);
    stage.setAttribute("aria-label", closed ? "長者的裝扮台:窗簾關著,點一下拉開" : "角色即時預覽");
  }
  async function openCurtain() { if (isOpen || busy) return; busy = true; cur.classList.add("av4-busy"); setClosed(false); await wait(T()); cur.classList.remove("av4-busy"); busy = false; }
  async function closeCurtain() { if (!isOpen || busy) return; busy = true; cur.classList.add("av4-busy"); setClosed(true); await wait(T()); cur.classList.remove("av4-busy"); busy = false; }
  stage.tabIndex = 0;
  stage.addEventListener("click", () => { if (!isOpen) openCurtain(); });
  stage.addEventListener("keydown", e => { if (!isOpen && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openCurtain(); } });
  /* 窗簾還關著就去換造型時,先自動拉開,讓玩家看得到變化 */
  screen.querySelector(".customizer")?.addEventListener("click", e => { if (!isOpen && e.target.closest("button,.swatch")) openCurtain(); }, true);
  $("#reset-look")?.addEventListener("click", () => { if (!isOpen) openCurtain(); });
  screen.querySelector(".character-choice")?.addEventListener("click", e => { if (!isOpen && e.target.closest(".base-character,button")) openCurtain(); }, true);
  /* 每次進入裝扮台都重新關上窗簾 */
  let wasActive = false;
  const onScreen = () => { const a = screen.classList.contains("active"); if (a && !wasActive) { busy = false; cur.classList.remove("av4-busy"); setClosed(true); } wasActive = a; };
  new MutationObserver(onScreen).observe(screen, { attributes: true, attributeFilter: ["class"] });
  setClosed(true); onScreen();

  /* ---------- B4 隨機造型 ---------- */
  const rnd = $("#randomize"), origRandom = rnd && rnd.onclick;
  if (rnd && origRandom) {
    rnd.onclick = async function (e) {
      if (busy) return;
      rnd.disabled = true;
      try {
        if (isOpen) await closeCurtain(); else { setClosed(true); }
        origRandom.call(this, e);                 // 在窗簾後面換好造型(原本的隨機規則不變)
        await wait(reduce() ? 0 : 260);
        await openCurtain();
      } finally { rnd.disabled = false; }
    };
  }

  /* 大標題換選項時輕彈一下 */
  ["#item-prev", "#item-next"].forEach(s => $(s)?.addEventListener("click", () => { const c = $(".customizer .item-card"); if (!c) return; c.classList.remove("av4-pop"); void c.offsetWidth; c.classList.add("av4-pop"); }));

  /* ---------- B5 操作說明 ---------- */
  const dlg = $("#app-dialog");
  const HELP = {
    character: {
      title: "裝扮台操作說明", sub: "打扮好你的長者,就可以出發冒險。",
      steps: [
        "點一下展示台的<b>窗簾</b>,左右兩邊拉開,就能看到你的角色。",
        "左邊選擇<b>基本角色</b>(沉穩、和善、活力長者),再輸入<b>角色名字</b>(最多 10 個字)。",
        "右邊用<b>髮型／服裝／配件</b>分頁切換部位,按 <b>‹ ›</b> 換樣式,下面的色塊換顏色。",
        "<b>隨機造型</b>會先拉上窗簾幫你打扮,再拉開給你看;<b>恢復預設</b>回到原本的造型。",
        "都決定好了,按<b>確認角色</b>,出發冒險!"
      ]
    },
    home: {
      title: "操作說明", sub: "歡迎來到記憶之家。",
      steps: [
        "點擊<b>莊園大門</b>,開始冒險。",
        "在<b>長者的裝扮台</b>拉開窗簾、選角色、取名字、打扮造型,按<b>確認角色</b>出發。",
        "在記憶之家地圖上點選<b>房間</b>進入,點擊亮著微光的物品探索、完成小遊戲。",
        "找到密碼後按<b>輸入密碼</b>,通關後房間會恢復色彩。",
        "不知道下一步時,打開<b>任務</b>面板,或按<b>💡 操作提示</b>。",
        "六個房間都修復後,前往中央的<b>記憶核心</b>。"
      ]
    }
  };
  function openHelp(kind) {
    const h = HELP[kind];
    $("#dialog-content").innerHTML = `<div class="av4-help" role="document"><h2>${h.title}</h2><p class="av4-sub">${h.sub}</p><ol>${h.steps.map(s => `<li><span>${s}</span></li>`).join("")}</ol><button type="button" class="av4-ok">我知道了</button></div>`;
    dlg.classList.add("av4-help-open");
    if (!dlg.open) dlg.showModal();
    const ok = $(".av4-help .av4-ok"); ok.onclick = () => dlg.close(); setTimeout(() => ok.focus(), 30);
  }
  if (dlg) dlg.addEventListener("close", () => dlg.classList.remove("av4-help-open"));
  document.querySelectorAll('[data-modal="instructions"]').forEach(b => {
    b.onclick = () => openHelp(b.closest("#screen-character") ? "character" : "home");
  });
})();
