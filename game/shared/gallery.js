/* gallery.js — 2026-11-18 今日任務 7、8:回憶館(CG 畫廊+音樂盒)與「已通關」紀錄
   - 收藏存在 localStorage「memoryMazeGallery」。2026-11-18 晚使用者改決定:重新開始、重新整理、開始新的一輪時清空(由 integration/bridge-parent.js 處理);
     片尾「返回首頁」不清,回憶館裡另有「清除收藏」按鈕可手動清空。
   - 解鎖時機:CG = 該房通關時(記下玩家當時的體型);音樂 = 第一次聽到(SoundKit.music 呼叫時);
     片尾 CG = 片尾播完(或按跳過)時,同時記錄「已通關」→ 首頁出現三位老人。
   - 外殼(index.html)與遊戲(game/index.html)都載入本檔,同源共用同一份 localStorage。 */
(function () {
  "use strict";
  if (window.MemoryGallery) return;
  const KEY = "memoryMazeGallery";
  const script = document.currentScript;
  const ROOT = new URL("../../", script ? script.src : location.href).href;   // 專案根目錄(本檔在 game/shared/)
  const BODIES = ["slim", "round", "strong"];

  const CGS = [
    { id: "room1", name: "房間 1・視界休息角" },
    { id: "room2", name: "房間 2・行動防跌浴室" },
    { id: "room3", name: "房間 3・營養照護廚房" },
    { id: "room4", name: "房間 4・聽力照護客廳" },
    { id: "room5", name: "房間 5・認知照護廊道" },
    { id: "room6", name: "房間 6・心理陪伴客廳" },
    { id: "ending", name: "片尾・新年快樂" }
  ];
  /* 曲名與 game/shared/sound-kit.js 的 SONGS 相同 */
  const TRACKS = [
    { id: "home", name: "月光莊園・音樂盒圓舞曲", where: "首頁" },
    { id: "character", name: "裝扮時間・8-bit 跳跳歌", where: "裝扮台" },
    { id: "map", name: "午後散步・Lo-fi", where: "房間配置圖" },
    { id: "room1", name: "視界休息角・豎琴搖籃曲", where: "房間 1" },
    { id: "room2", name: "穩穩走・散步進行曲", where: "房間 2" },
    { id: "room3", name: "廚房小調・巴薩諾瓦", where: "房間 3" },
    { id: "room4", name: "安靜聆聽・環境音樂", where: "房間 4" },
    { id: "room5", name: "記憶拼圖・時鐘解謎", where: "房間 5" },
    { id: "room6", name: "暖暖客廳・爵士抒情", where: "房間 6" },
    { id: "room7", name: "記憶核心・星光瀑布", where: "房間 7" },
    { id: "ending", name: "回想・鋼琴獨奏", where: "片尾" },
    { id: "newyear", name: "新年快樂・鑼鼓喧天", where: "片尾" }
  ];
  /* 2026-11-20 塔羅牌(房間 7 抽到的記憶卡):圖在 assets/tarot/,牌名與籤詩內容在翻牌時一起存進收藏(來源 = game/index.html 的 room7Fortunes) */
  const TAROTS = [1, 2, 3, 4, 5, 6].map(n => ({ id: "tarot" + n, n, num: ["I", "II", "III", "IV", "V", "VI"][n - 1] }));
  const tarotSrc = n => ROOT + "assets/tarot/tarot-0" + n + ".png?v=2";   /* ?v=2:2026-11-20 新牌圖(無字 + 老人),避免瀏覽器用舊快取 */
  const TAROT_BACK = ROOT + "assets/tarot/tarot-back.png?v=2";

  const blank = () => ({ cg: {}, music: { home: 1 }, tarot: {}, cleared: 0 });
  /* 舊存檔沒有 tarot 欄位 → 自動補空物件 */
  function get() { try { const v = JSON.parse(localStorage.getItem(KEY) || "null"); return v ? Object.assign(blank(), v, { music: Object.assign({ home: 1 }, v.music), tarot: Object.assign({}, v.tarot) }) : blank(); } catch (e) { return blank(); } }
  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { } notify(); }
  const listeners = new Set();
  function notify() { listeners.forEach(fn => { try { fn(get()); } catch (e) { } }); }
  addEventListener("storage", e => { if (e.key === KEY) notify(); });   // 另一個頁框改了收藏 → 這裡也更新

  function bodyNow() { try { return BODIES[JSON.parse(localStorage.getItem("memoryMazeAvatar") || "{}").base] || "round"; } catch (e) { return "round"; } }

  /* 角落小提示「🎁 新增收藏」:顯示在最外層頁面,不論在哪個頁框解鎖都看得到 */
  function toast(text) {
    let doc = document; try { if (window.top && window.top.document) doc = window.top.document; } catch (e) { }
    let box = doc.getElementById("mgal-toasts");
    if (!box) { box = doc.createElement("div"); box.id = "mgal-toasts"; box.setAttribute("aria-live", "polite");
      box.style.cssText = "position:fixed;right:18px;top:96px;z-index:2147483000;display:flex;flex-direction:column;gap:8px;pointer-events:none";
      doc.body.appendChild(box); }
    const t = doc.createElement("div");
    t.style.cssText = "background:#1c2340;color:#fff3c4;border:2px solid #d9a441;border-radius:10px;padding:10px 16px;font:800 16px/1.4 system-ui,'Noto Sans TC',sans-serif;box-shadow:0 6px 16px rgba(0,0,0,.45);opacity:0;transform:translateX(30px);transition:opacity .35s,transform .35s";
    t.textContent = "🎁 新增收藏:" + text;
    box.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = "1"; t.style.transform = "none"; });
    setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateX(30px)"; setTimeout(() => t.remove(), 400); }, 3600);
  }

  function unlockCG(id, body) {
    const v = get(); if (v.cg[id]) return false;
    v.cg[id] = id === "ending" ? "ending" : (body || bodyNow()); save(v);
    const c = CGS.find(x => x.id === id); toast((c ? c.name : id) + " 的 CG");
    return true;
  }
  function unlockTarot(n, info) {
    const t = TAROTS.find(x => x.n === Number(n)); if (!t) return false;
    const v = get(); if (v.tarot[t.id]) return false;
    v.tarot[t.id] = { title: (info && info.title) || "", text: (info && info.text) || "" }; save(v);
    toast("塔羅牌「" + ((info && info.title) || t.num) + "」");
    return true;
  }
  function unlockMusic(id) {
    const tr = TRACKS.find(x => x.id === id); if (!tr) return false;
    const v = get(); if (v.music[id]) return false;
    v.music[id] = 1; save(v); toast("音樂「" + tr.name + "」");
    return true;
  }
  /* 2026-11-18 晚 使用者:三位老人是「這一輪完全破關」才有的彩蛋 → 已通關改記在 memoryMazeCleared(屬於進度,
     重新整理/重新開始就清掉),一開始進來不會出現。收藏(CG/音樂)仍跨重新整理保留。 */
  const CLEARED_KEY = "memoryMazeCleared";
  function isCleared() { try { return localStorage.getItem(CLEARED_KEY) === "1"; } catch (e) { return false; } }
  function markCleared() { try { localStorage.setItem(CLEARED_KEY, "1"); } catch (e) { } unlockCG("ending"); listeners.forEach(fn => { try { fn(get()); } catch (e) { } }); }
  function reset() { save(blank()); }

  function cgSrc(id, body, b) {
    if (id === "ending") return ROOT + "assets/ending/v3/ending-v3-newyear.png";
    return ROOT + "game/assets/art-final/clear/" + id + "-clear-" + body + (b ? "-b" : "") + ".png";
  }
  function thumbSrc(id, body) { return ROOT + "assets/ui-shell/gallery/" + (id === "ending" ? "ending" : id + "-" + body) + ".jpg"; }
  /* 總數由資料長度計算(CG 7 + 音樂 12 + 塔羅 6 = 25),不要再寫死 */
  function count(v = get()) { const cg = CGS.filter(c => v.cg[c.id]).length, music = TRACKS.filter(t => v.music[t.id]).length, tarot = TAROTS.filter(t => v.tarot[t.id]).length;
    return { cg, music, tarot, got: cg + music + tarot, total: CGS.length + TRACKS.length + TAROTS.length }; }

  /* ---------------- 回憶館視窗 ---------------- */
  let open_ = null;
  function open() {
    if (open_) return;
    const SK = window.SoundKit;
    try { SK && SK.unlock && SK.unlock(); } catch (e) { }
    const prevMusic = "home";
    const ov = document.createElement("div"); ov.className = "mgal-overlay";
    ov.innerHTML = `<div class="mgal" role="dialog" aria-modal="true" aria-labelledby="mgal-title">
      <header class="mgal-head"><h2 id="mgal-title">回憶館</h2><p class="mgal-count"></p>
        <button class="mgal-x" type="button" aria-label="關閉回憶館">✕</button></header>
      <div class="mgal-tabs" role="tablist">
        <button type="button" role="tab" class="mgal-tab on" data-tab="cg">CG 畫廊</button>
        <button type="button" role="tab" class="mgal-tab" data-tab="music">音樂盒</button>
        <button type="button" role="tab" class="mgal-tab" data-tab="tarot">塔羅牌</button></div>
      <div class="mgal-body">
        <div class="mgal-pane mgal-cgs" data-pane="cg"></div>
        <div class="mgal-pane mgal-tracks" data-pane="music" hidden><p class="mgal-now">點一首已解鎖的曲子來播放</p><ol></ol></div>
        <div class="mgal-pane mgal-tarots" data-pane="tarot" hidden><p class="mgal-tarot-tip">每次旅程在記憶核心只能抽一張牌,多玩幾次就能收集全部六張。</p><div class="mgal-tgrid"></div></div>
      </div>
      <footer class="mgal-foot"><span class="mgal-tip">通關房間、聽到新的音樂、在記憶核心抽牌、看完片尾,就會解鎖新的收藏。點圖片可以全螢幕放大。</span>
        <button type="button" class="mgal-reset">清除收藏</button></footer>
    </div>`;
    document.body.appendChild(ov);
    const $ = s => ov.querySelector(s);
    let playing = null;

    function render() {
      const v = get(), c = count(v);
      $(".mgal-count").textContent = `已收藏 ${c.got}／${c.total}`;
      $(".mgal-cgs").innerHTML = CGS.map(cg => {
        const body = v.cg[cg.id], on = !!body, b = body === "ending" ? "" : body;
        return `<button type="button" class="mgal-card${on ? "" : " locked"}" data-id="${cg.id}" ${on ? "" : 'aria-disabled="true"'} aria-label="${on ? cg.name : "未解鎖"}">
          <span class="mgal-thumb">${on ? `<img src="${thumbSrc(cg.id, b)}" alt="" loading="lazy">` : '<i class="mgal-lock" aria-hidden="true"></i>'}</span>
          <span class="mgal-name">${on ? cg.name : "???"}</span></button>`;
      }).join("");
      $(".mgal-tgrid").innerHTML = TAROTS.map(t => {
        const got = v.tarot[t.id];
        return `<button type="button" class="mgal-card mgal-tcard${got ? "" : " locked"}" data-tarot="${t.n}" ${got ? "" : 'aria-disabled="true"'} aria-label="${got ? got.title || t.num : "未收藏的塔羅牌"}">
          <span class="mgal-tthumb"><img src="${got ? tarotSrc(t.n) : TAROT_BACK}" alt="" loading="lazy">${got ? "" : '<i aria-hidden="true">?</i>'}</span>
          <span class="mgal-name">${got ? (got.title || t.num) : "???"}</span></button>`;
      }).join("");
      $(".mgal-tracks ol").innerHTML = TRACKS.map(t => {
        const on = !!v.music[t.id];
        return `<li><button type="button" class="mgal-track${on ? "" : " locked"}${playing === t.id ? " playing" : ""}" data-id="${t.id}" ${on ? "" : 'aria-disabled="true"'}>
          <span class="mgal-note" aria-hidden="true">${on ? (playing === t.id ? "♪" : "▶") : "🔒"}</span>
          <span class="mgal-tname">${on ? t.name : "???"}</span><span class="mgal-where">${on ? t.where : ""}</span></button></li>`;
      }).join("");
    }
    render();

    /* 2026-11-20 全螢幕檢視(lightbox):同一分頁內已收藏的圖可左右切換、滾輪/雙擊/雙指縮放(1~4 倍)、拖曳平移、瀏覽器全螢幕;Esc 先關這裡 */
    function items(kind) {
      const v = get();
      if (kind === "tarot") return TAROTS.filter(t => v.tarot[t.id]).map(t => ({ key: "t" + t.n, name: v.tarot[t.id].title || t.num, text: v.tarot[t.id].text, a: tarotSrc(t.n) }));
      return CGS.filter(c => v.cg[c.id]).map(c => { const body = v.cg[c.id], b = body === "ending" ? "" : body; return { key: c.id, name: c.name, a: cgSrc(c.id, b), b: c.id === "ending" ? null : cgSrc(c.id, b, true) }; });
    }
    let lb = null;
    function view(kind, key, opener) {
      const list = items(kind); let i = list.findIndex(x => x.key === key); if (i < 0) return;
      const box = document.createElement("div"); box.className = "mgal-lb"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "放大檢視");
      box.innerHTML = `<div class="mgal-lb-stage"><div class="mgal-lb-pan"><img class="mgal-lb-a" alt=""><img class="mgal-lb-b" alt=""></div></div>
        <button type="button" class="mgal-lb-x" aria-label="關閉放大檢視">✕</button>
        <button type="button" class="mgal-lb-fs" aria-label="全螢幕">⛶ 全螢幕</button>
        <button type="button" class="mgal-lb-prev" aria-label="上一張">‹</button><button type="button" class="mgal-lb-next" aria-label="下一張">›</button>
        <div class="mgal-lb-cap"><b class="mgal-lb-name"></b><span class="mgal-lb-idx"></span><p class="mgal-lb-text"></p><small>滾輪或雙擊可放大,放大後可拖曳;← → 切換,Esc 關閉</small></div>`;
      ov.appendChild(box);
      const q = s => box.querySelector(s), pan = q(".mgal-lb-pan"), A = q(".mgal-lb-a"), B = q(".mgal-lb-b");
      let z = 1, tx = 0, ty = 0, flipT = 0;
      const apply = () => { pan.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`; box.classList.toggle("zoomed", z > 1.01); };
      const clamp = () => { const r = q(".mgal-lb-stage").getBoundingClientRect(), mx = r.width * (z - 1) / 2, my = r.height * (z - 1) / 2; tx = Math.max(-mx, Math.min(mx, tx)); ty = Math.max(-my, Math.min(my, ty)); };
      const zoomTo = nz => { z = Math.max(1, Math.min(4, nz)); if (z === 1) { tx = ty = 0; } clamp(); apply(); };
      function show() {
        const it = list[i]; z = 1; tx = ty = 0; apply();
        A.src = it.a; B.hidden = !it.b; B.classList.remove("on"); clearInterval(flipT);
        if (it.b) { B.src = it.b; flipT = setInterval(() => B.classList.toggle("on"), 1600); }
        q(".mgal-lb-name").textContent = it.name; q(".mgal-lb-idx").textContent = `${i + 1} / ${list.length}`;
        q(".mgal-lb-text").textContent = it.text || ""; q(".mgal-lb-text").hidden = !it.text;
        q(".mgal-lb-prev").hidden = q(".mgal-lb-next").hidden = list.length < 2;
        box.classList.toggle("mgal-lb-tarot", kind === "tarot");
      }
      const step = d => { i = (i + d + list.length) % list.length; show(); try { SK && SK.sfx("page"); } catch (e) { } };
      q(".mgal-lb-prev").onclick = e => { e.stopPropagation(); step(-1); };
      q(".mgal-lb-next").onclick = e => { e.stopPropagation(); step(1); };
      q(".mgal-lb-x").onclick = e => { e.stopPropagation(); closeLb(); };
      const fsBtn = q(".mgal-lb-fs"); if (!box.requestFullscreen) fsBtn.hidden = true;
      fsBtn.onclick = e => { e.stopPropagation(); try { if (document.fullscreenElement === box) document.exitFullscreen(); else box.requestFullscreen(); } catch (er) { } };
      box.addEventListener("click", e => { e.stopPropagation(); if (e.target === box || e.target.classList.contains("mgal-lb-stage")) closeLb(); });
      box.addEventListener("wheel", e => { e.preventDefault(); zoomTo(z * Math.exp(-Math.max(-300, Math.min(300, e.deltaY)) * .0025)); }, { passive: false });
      pan.addEventListener("dblclick", e => { e.stopPropagation(); zoomTo(z > 1.01 ? 1 : 2); });
      let drag = null;
      pan.addEventListener("pointerdown", e => { if (z <= 1.01 || e.pointerType === "touch" && touches.size > 1) return; drag = { x: e.clientX - tx, y: e.clientY - ty }; try { pan.setPointerCapture(e.pointerId); } catch (er) { } e.preventDefault(); });
      pan.addEventListener("pointermove", e => { if (!drag) return; tx = e.clientX - drag.x; ty = e.clientY - drag.y; clamp(); apply(); });
      pan.addEventListener("pointerup", () => { drag = null; }); pan.addEventListener("pointercancel", () => { drag = null; });
      /* 雙指縮放 */
      const touches = new Map(); let pinch0 = 0, z0 = 1;
      box.addEventListener("pointerdown", e => { if (e.pointerType !== "touch") return; touches.set(e.pointerId, e); if (touches.size === 2) { drag = null; const [a, b] = [...touches.values()]; pinch0 = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); z0 = z; } }, true);
      box.addEventListener("pointermove", e => { if (!touches.has(e.pointerId)) return; touches.set(e.pointerId, e); if (touches.size === 2 && pinch0) { const [a, b] = [...touches.values()]; zoomTo(z0 * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / pinch0); } });
      ["pointerup", "pointercancel"].forEach(t => box.addEventListener(t, e => { touches.delete(e.pointerId); if (touches.size < 2) pinch0 = 0; }));
      function closeLb() {
        if (!lb) return;
        clearInterval(flipT); try { if (document.fullscreenElement === box) document.exitFullscreen(); } catch (e) { }
        box.classList.remove("in"); box.classList.add("out"); setTimeout(() => box.remove(), 200); lb = null;
        try { SK && SK.sfx("close"); } catch (e) { } opener && opener.focus && opener.focus();
      }
      lb = { close: closeLb, step, zoom: d => zoomTo(z * d) };
      show(); requestAnimationFrame(() => box.classList.add("in")); q(".mgal-lb-x").focus();
      try { SK && SK.sfx("open"); } catch (e) { }
    }
    function unview() { if (lb) lb.close(); }

    ov.addEventListener("click", e => {
      const tab = e.target.closest(".mgal-tab");
      if (tab) {
        ov.querySelectorAll(".mgal-tab").forEach(t => t.classList.toggle("on", t === tab));
        ov.querySelectorAll(".mgal-pane").forEach(p => p.hidden = p.dataset.pane !== tab.dataset.tab);
        try { SK && SK.sfx("tab"); } catch (e2) { } return;
      }
      const card = e.target.closest(".mgal-card");
      if (card) { if (card.classList.contains("locked")) { try { SK && SK.sfx("locked"); } catch (e2) { } return; } if (card.dataset.tarot) view("tarot", "t" + card.dataset.tarot, card); else view("cg", card.dataset.id, card); return; }
      const tr = e.target.closest(".mgal-track");
      if (tr) {
        if (tr.classList.contains("locked")) { try { SK && SK.sfx("locked"); } catch (e2) { } return; }
        playing = tr.dataset.id; try { SK && SK.music(playing); } catch (e2) { }
        const t = TRACKS.find(x => x.id === playing);
        $(".mgal-now").textContent = "♪ 正在播放:" + t.name + (SK && SK.settings && SK.settings.musicOn === false ? "(音樂目前是關閉的,請先打開音樂)" : "");
        render(); return;
      }
      if (e.target.closest(".mgal-x") || e.target === ov) { close(); return; }
      const rs = e.target.closest(".mgal-reset");
      if (rs) {
        if (rs.dataset.armed) { reset(); playing = null; render(); rs.textContent = "已清除"; delete rs.dataset.armed; setTimeout(() => rs.textContent = "清除收藏", 1500); return; }
        rs.dataset.armed = "1"; rs.textContent = "再按一次確認清除"; setTimeout(() => { if (rs.dataset.armed) { delete rs.dataset.armed; rs.textContent = "清除收藏"; } }, 3000);
      }
    });
    const onKey = e => {
      if (lb) {
        if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); lb.close(); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); lb.step(-1); } else if (e.key === "ArrowRight") { e.preventDefault(); lb.step(1); }
        else if (e.key === "+" || e.key === "=") lb.zoom(1.25); else if (e.key === "-") lb.zoom(.8);
        return;
      }
      if (e.key === "Escape") { e.preventDefault(); close(); }
    };
    document.addEventListener("keydown", onKey, true);
    function close() {
      unview(); document.removeEventListener("keydown", onKey, true); ov.remove(); open_ = null;
      if (playing) { try { SK && SK.music(prevMusic); } catch (e) { } }
      try { SK && SK.sfx("close"); } catch (e) { }
      openerBtn && openerBtn.focus && openerBtn.focus();
    }
    open_ = { close };
    try { SK && SK.sfx("open"); } catch (e) { }
    setTimeout(() => $(".mgal-x").focus(), 30);
  }
  let openerBtn = null;

  /* 首頁按鈕(只在外殼頁面有 .home-nav 時加上) */
  function addHomeButton() {
    const nav = document.querySelector("#screen-home .home-nav"); if (!nav || nav.querySelector(".mgal-open")) return;
    const b = document.createElement("button"); b.type = "button"; b.className = "soft-button mgal-open";
    b.innerHTML = '回憶館';   // 2026-11-18 晚 使用者:按鈕只寫「回憶館」,不顯示數字
    b.addEventListener("click", () => { openerBtn = b; open(); });
    nav.insertBefore(b, nav.firstChild);
    const upd = () => { const c = count(); b.setAttribute("aria-label", `回憶館,已收藏 ${c.got} 項,共 ${c.total} 項`); };
    upd(); listeners.add(upd);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addHomeButton); else addHomeButton();

  /* 樣式檔與本檔放在一起 */
  const css = document.createElement("link"); css.rel = "stylesheet"; css.href = new URL("gallery.css?v=3", script ? script.src : location.href).href;
  document.head.appendChild(css);

  window.MemoryGallery = { get, unlockCG, unlockMusic, unlockTarot, markCleared, reset, open, count, isCleared, onChange: fn => listeners.add(fn), CGS, TRACKS, TAROTS, tarotSrc, TAROT_BACK };
})();
