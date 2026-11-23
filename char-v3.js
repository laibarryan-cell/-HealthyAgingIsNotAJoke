/* char-v3.js — 第三修改計劃 C:建立冒險角色畫面(放在 game.js 之後載入,不改 game.js 原本的邏輯)
   C1 全螢幕鈕在角色畫面時移到「返回首頁」旁邊,不再蓋住左欄文字
   C3 換基本角色、髮型、服裝、配件、配色、隨機、恢復預設時播放變身特效
   C4 按「確認角色」先跳出確認對話框:「再想想」回到編輯;「決定好了，出發冒險！」直接進入遊戲 */
(function () {
  "use strict";
  const $ = s => document.querySelector(s);
  const screen = $("#screen-character");
  if (!screen || typeof state === "undefined" || typeof renderAll !== "function") return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- C1 ---------- */
  function placeFs() {
    const btn = $("#shell-fullscreen"), home = screen.querySelector('[data-action="home"]');
    const on = screen.classList.contains("active") && btn && home && home.getBoundingClientRect().width > 0;
    document.body.classList.toggle("cv-top-fs", !!on);
    if (!on) return;
    const r = home.getBoundingClientRect(), b = btn.getBoundingClientRect();
    document.body.style.setProperty("--cv-fs-x", Math.round(r.right + Math.max(10, r.height * .25)) + "px");
    document.body.style.setProperty("--cv-fs-y", Math.round(r.top + (r.height - b.height) / 2) + "px");
  }
  new MutationObserver(placeFs).observe(screen, { attributes: true, attributeFilter: ["class"] });
  addEventListener("resize", placeFs);
  document.addEventListener("fullscreenchange", () => setTimeout(placeFs, 60));
  setTimeout(placeFs, 0);

  /* ---------- C3 ---------- */
  const KEYS = ["base", "hair", "outfit", "accessory", "hairColor", "outfitColor"];
  const look = () => KEYS.map(k => state[k]).join(",");
  let last = look(), busy = 0;
  function morph(changed) {
    const stage = screen.querySelector(".preview-stage"); if (!stage) return;
    const target = stage.dataset.mode === "walk" ? $("#walk-preview") : $("#character-preview");
    if (target) { target.classList.remove("cv-morph"); void target.offsetWidth; target.classList.add("cv-morph"); }
    stage.querySelectorAll(".cv-fx").forEach(n => n.parentNode.removeChild(n));
    const fx = document.createElement("div"); fx.className = "cv-fx"; fx.setAttribute("aria-hidden", "true");
    const ring = document.createElement("i"); ring.className = "cv-ring"; fx.appendChild(ring);
    if (!reduce.matches) for (let i = 0; i < 10; i++) {
      const s = document.createElement("i"); s.className = "cv-star";
      const a = (i / 10) * Math.PI * 2 + Math.random() * .4, d = 90 + Math.random() * 70;
      s.style.setProperty("--tx", Math.round(Math.cos(a) * d) + "px"); s.style.setProperty("--ty", Math.round(Math.sin(a) * d * .8) + "px");
      s.style.animationDelay = (Math.random() * .08).toFixed(2) + "s"; fx.appendChild(s);
    }
    stage.appendChild(fx);
    clearTimeout(busy); busy = setTimeout(() => fx.parentNode && fx.parentNode.removeChild(fx), 1200);
  }
  const origRender = renderAll;
  renderAll = function () {
    const r = origRender.apply(this, arguments);
    const now = look();
    if (now !== last) {
      const a = last.split(","), b = now.split(",");
      const changed = KEYS.filter((k, i) => a[i] !== b[i]);
      last = now;
      if (screen.classList.contains("active")) morph(changed);
    }
    return r;
  };
  /* 顏色色塊是另外綁的事件,保險起見:任何點擊後都檢查一次造型有沒有變 */
  screen.addEventListener("click", () => setTimeout(() => {
    const now = look(); if (now === last) return;
    const a = last.split(","), b = now.split(","); last = now;
    morph(KEYS.filter((k, i) => a[i] !== b[i]));
  }, 0));

  /* ---------- C4 ---------- */
  const confirmBtn = $("#confirm-character"), goBtn = $("#go-adventure"), dlg = $("#app-dialog");
  const origConfirm = confirmBtn && confirmBtn.onclick;
  if (confirmBtn && goBtn && dlg && origConfirm) {
    const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const close = () => { dlg.classList.remove("cv-confirm-open"); if (dlg.open) dlg.close(); };
    dlg.addEventListener("close", () => dlg.classList.remove("cv-confirm-open"));
    confirmBtn.onclick = function (e) {
      if (!state.name) return origConfirm.call(this, e);          // 沒有名字:照原本提示
      let pic = "";
      try { pic = $("#preview-character").toDataURL("image/png"); } catch (_) {}
      $("#dialog-content").innerHTML =
        `<div class="cv-confirm" role="document">
           ${pic ? `<img src="${pic}" alt="目前的角色">` : ""}
           <div><h2>真的決定好這個角色了嗎？</h2>
             <p>冒險家 <span class="cv-name">${esc(state.name)}</span> 準備出發了。</p>
             <p>還是想再想一想？</p></div>
           <div class="cv-actions">
             <button type="button" class="soft-button" id="cv-again">再想想</button>
             <button type="button" class="primary-button" id="cv-go">決定好了，出發冒險！</button>
           </div>
         </div>`;
      dlg.classList.add("cv-confirm-open");
      if (!dlg.open) dlg.showModal();
      $("#cv-again").onclick = () => { close(); confirmBtn.focus(); };
      $("#cv-go").onclick = () => { close(); origConfirm.call(confirmBtn, e); goBtn.click(); };
      setTimeout(() => $("#cv-go") && $("#cv-go").focus(), 30);
    };
  }
})();
