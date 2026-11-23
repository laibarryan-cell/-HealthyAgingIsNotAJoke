/* shell-extras.js — 2026-11-18 晚 任務清單補完(只在最外層頁面 index.html 載入,往下照顧每一層頁框)
   J1  展示模式:網址加 ?kiosk=1 開啟(同一個分頁會記住)。閒置 2 分鐘 → 清進度回首頁;關閉右鍵選單、F5/Ctrl+R 重新整理。
   K2  iPad/手機:瀏覽器要先點一下才會出聲 → 首頁顯示「點一下畫面開啟聲音」,點過就消失。
   K6  無痕視窗或儲存空間滿,存不了進度 → 畫面上方顯示提醒。
   C16 長輩專注力約 30 分鐘:每玩 30 分鐘溫和提醒休息一下(不中斷遊戲)。
   K3  遊戲頁框 20 秒還沒載入完成 → 自動重新載入一次。
   K9  圖片載入失敗 → 隱藏破圖示,不讓畫面出現破圖。
   F5  游標:可拖曳的東西顯示「抓取」手勢,不能按的按鈕顯示「禁止」。
   F7  所有按鈕按下時輕輕凹陷(用 CSS scale 屬性,不影響原本 transform 定位與原本的 transition)。
   G6  鍵盤操作時,目前焦點有明顯金框。
   H4  片尾結束時提示這一趟哪個面向答錯最多。
   F4  拖曳手感:拿起放大加陰影、靠近目標金框脈動、放在空白處影子滑回原位(只加視覺,判定不變)。
   K11 匿名遊玩紀錄(只存在這台電腦,不上傳):各房停留時間、答錯音效次數、提示次數;設定選單可匯出。 */
(function () {
  "use strict";
  if (window.top !== window) return;
  const doc = document;
  const toast = (html, ms = 6000, cls = "") => {
    const t = doc.createElement("div"); t.className = "sx-toast " + cls; t.innerHTML = html; doc.body.appendChild(t);
    setTimeout(() => t.classList.add("sx-out"), ms); setTimeout(() => t.remove(), ms + 500); return t;
  };
  const css = doc.createElement("style");
  css.textContent = `.sx-toast{position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:2147483200;max-width:min(620px,92vw);padding:10px 20px;border:3px solid #d9a441;border-radius:12px;background:#1c2340;color:#fff3c4;font:800 18px/1.5 inherit;box-shadow:0 0 0 3px #0b1426,0 8px 20px #0008;text-align:center;transition:opacity .45s,transform .45s}
    .sx-toast.sx-out{opacity:0;transform:translate(-50%,-12px)}
    .sx-warn{background:#4a1d16;border-color:#d0705c;color:#ffd6c8}
    .sx-tap{position:fixed;left:50%;bottom:16%;transform:translateX(-50%);z-index:2147482500;padding:10px 22px;border-radius:999px;border:3px solid #d9a441;background:#1c2340e6;color:#fff3c4;font:900 19px/1.4 inherit;pointer-events:none;animation:sxTap 1.6s ease-in-out infinite}
    @keyframes sxTap{50%{transform:translate(-50%,-6px)}}
    .sx-kiosk-badge{position:fixed;right:10px;bottom:10px;z-index:2147482500;padding:2px 8px;border-radius:6px;background:#0008;color:#fff3c4;font:700 12px/1.6 sans-serif;pointer-events:none}`;
  doc.head.appendChild(css);

  /* ---- 走訪所有同源頁框 ---- */
  function frames(w, out) { out.push(w); for (let i = 0; i < w.frames.length; i++) { try { if (w.frames[i].document) frames(w.frames[i], out); } catch (e) { } } return out; }
  const attached = new WeakSet();
  const perFrame = [];
  function attachAll() { frames(window, []).forEach(w => { let d; try { d = w.document; } catch (e) { return; } if (!d || attached.has(d)) return; attached.add(d); perFrame.forEach(fn => { try { fn(w, d); } catch (e) { } }); }); }
  setInterval(attachAll, 1500);

  /* ---- K6 儲存檢查 ---- */
  let canSave = true;
  try { localStorage.setItem("__mm_test", "1"); localStorage.removeItem("__mm_test"); } catch (e) { canSave = false; }
  if (!canSave) addEventListener("load", () => toast("⚠ 目前無法儲存進度(可能是無痕視窗或儲存空間已滿)。<br>可以照常遊玩,但重新整理後進度與設定不會保留。", 12000, "sx-warn"));

  /* ---- K2 點一下開啟聲音 ---- */
  let tapHint = null;
  const unlockedOnce = () => { if (tapHint) { tapHint.remove(); tapHint = null; } };
  addEventListener("load", () => {
    const s = window.SoundKit && SoundKit.settings;
    if (s && !s.musicOn && !s.sfxOn) return;
    tapHint = doc.createElement("div"); tapHint.className = "sx-tap"; tapHint.textContent = "🔊 點一下畫面開啟聲音";
    const home = doc.getElementById("screen-home"); (home || doc.body).appendChild(tapHint);
  });

  /* ---- 活動偵測(所有頁框) ---- */
  let lastAct = Date.now();
  const act = () => { lastAct = Date.now(); unlockedOnce(); };
  perFrame.push((w, d) => ["pointerdown", "keydown", "pointermove", "wheel", "touchstart"].forEach(ev => d.addEventListener(ev, act, { capture: true, passive: true })));

  /* ---- J1 展示模式 ---- */
  let kiosk = false;
  try { if (/[?&]kiosk=1\b/.test(location.search)) sessionStorage.setItem("memoryMazeKiosk", "1"); if (/[?&]kiosk=0\b/.test(location.search)) sessionStorage.removeItem("memoryMazeKiosk"); kiosk = sessionStorage.getItem("memoryMazeKiosk") === "1"; } catch (e) { }
  if (kiosk) {
    const badge = doc.createElement("div"); badge.className = "sx-kiosk-badge"; badge.textContent = "展示模式"; addEventListener("load", () => doc.body.appendChild(badge));
    perFrame.push((w, d) => {
      d.addEventListener("contextmenu", e => e.preventDefault(), true);
      d.addEventListener("keydown", e => { if (e.key === "F5" || ((e.ctrlKey || e.metaKey) && /^[rR]$/.test(e.key))) { e.preventDefault(); e.stopPropagation(); } }, true);
    });
    let warned = false;
    setInterval(() => {
      const idle = Date.now() - lastAct, onHome = !!(doc.getElementById("screen-home") || {}).classList?.contains("active");
      if (onHome) { warned = false; return; }
      if (idle > 105000 && !warned) { warned = true; toast("一陣子沒有操作了,15 秒後會回到首頁,讓下一位玩家開始。", 14000); }
      if (idle < 105000) warned = false;
      if (idle > 120000) { lastAct = Date.now(); warned = false; try { window.MemoryMazeShell && MemoryMazeShell.restart(); } catch (e) { } }
    }, 1000);
  }

  /* ---- C16 休息提醒 + K11 遊玩紀錄 ---- */
  const SK = "memoryMazeStats";
  const stats = (() => { try { return JSON.parse(localStorage.getItem(SK) || "null") || {}; } catch (e) { return {}; } })();
  stats.v = 1; stats.sessions = (stats.sessions || 0) + 1; stats.time = stats.time || {}; stats.errors = stats.errors || {}; stats.hints = stats.hints || {}; stats.started = stats.started || new Date().toISOString();
  const saveStats = () => { try { localStorage.setItem(SK, JSON.stringify(stats)); } catch (e) { } };
  let played = 0, nextRest = 30 * 60;
  setInterval(() => {
    if (doc.hidden || Date.now() - lastAct > 60000) return;   // 沒在玩(切走或超過 1 分鐘沒動)不算
    const where = (window.SoundKit && SoundKit.current) || "other";
    stats.time[where] = (stats.time[where] || 0) + 5; played += 5;
    if (played >= nextRest) { nextRest += 30 * 60; toast(`☕ 已經玩了 ${Math.round(played / 60)} 分鐘囉,起來喝口水、讓眼睛休息一下吧!<br>進度都還在,休息完再繼續。`, 10000); }
    saveStats();
  }, 5000);
  const session = { errors: {} };   // 這一次開啟遊戲的答錯次數(H4 用,不跨次累計)
  const count = (bucket) => { const where = (window.SoundKit && SoundKit.current) || "other"; stats[bucket][where] = (stats[bucket][where] || 0) + 1; if (bucket === "errors") session.errors[where] = (session.errors[where] || 0) + 1; saveStats(); };

  /* ---- H4 片尾結束:告訴玩家這次哪個面向答錯最多,建議到回憶館或重玩複習(只用房間名稱,不新增衛教內容) ---- */
  const FACET = { room1: "視力", room2: "行動", room3: "營養", room4: "聽力", room5: "認知", room6: "心理" };
  function weakTip() {
    const box = doc.getElementById("ending-finish-actions"); if (!box) return;
    let p = box.querySelector(".sx-weak"); if (!p) { p = doc.createElement("p"); p.className = "sx-weak"; box.querySelector("p") ? box.querySelector("p").after(p) : box.prepend(p); }
    const rank = Object.entries(session.errors).filter(([k]) => FACET[k]).sort((a, b) => b[1] - a[1]);
    p.textContent = rank.length && rank[0][1] >= 2
      ? `這一趟在「${FACET[rank[0][0]]}」面向答錯比較多次(${rank[0][1]} 次),有空可以再回去那間房間複習一下喔!`
      : "這一趟幾乎沒有答錯,太厲害了!";
  }
  addEventListener("load", () => {
    const seq = doc.getElementById("ending-sequence");
    if (seq) new MutationObserver(() => { if (seq.classList.contains("done")) weakTip(); }).observe(seq, { attributes: true, attributeFilter: ["class"] });
  });
  css.textContent += `.sx-weak{margin:.2em 0 .6em;font-weight:800;color:#ffe2a0}`;
  addEventListener("load", () => {
    const S = window.SoundKit; if (!S) return;
    const orig = S.sfx;
    S.sfx = function (name) { if (name === "error") count("errors"); if (name === "hint") count("hints"); return orig.apply(this, arguments); };
  });
  window.MemoryMazeStats = {
    get: () => JSON.parse(JSON.stringify(stats)),
    export() {
      const blob = new Blob([JSON.stringify(stats, null, 2)], { type: "application/json" });
      const a = doc.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "遊玩紀錄-" + new Date().toISOString().slice(0, 10) + ".json";
      doc.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    },
    reset() { Object.keys(stats).forEach(k => delete stats[k]); try { localStorage.removeItem(SK); } catch (e) { } }
  };

  /* ---- K3 遊戲頁框載入逾時 ---- */
  const gf = doc.getElementById("integrated-game-frame");
  if (gf) {
    let timer = 0, retried = "";
    const arm = () => { clearTimeout(timer); const src = gf.getAttribute("src"); if (!src) return; timer = setTimeout(() => { if (retried !== src) { retried = src; gf.src = src; } }, 20000); };
    gf.addEventListener("load", () => clearTimeout(timer));
    new MutationObserver(arm).observe(gf, { attributes: true, attributeFilter: ["src"] });
  }

  /* ---- K9 破圖 + F5 游標 ---- */
  perFrame.push((w, d) => {
    d.addEventListener("error", e => { const t = e.target; if (t && t.tagName === "IMG" && !t.dataset.sxBroken) { t.dataset.sxBroken = "1"; t.style.visibility = "hidden"; try { console.warn("[圖片載入失敗]", t.currentSrc || t.src); } catch (er) { } } }, true);
    const st = d.createElement("style"); st.textContent = `button:not(:disabled):active,[role=button]:not([aria-disabled=true]):active{scale:.96}html.mm-reduce button:active{scale:none}html body :is(button,a,input,select,textarea,[role=button],[tabindex]):focus-visible{outline:3px solid #ffd86d!important;outline-offset:3px!important}[draggable=true]{cursor:grab}[draggable=true]:active{cursor:grabbing}button:disabled,[aria-disabled=true]{cursor:not-allowed!important}`;
    (d.head || d.documentElement).appendChild(st);
  });
  /* ---- F4 拖曳手感(只加視覺,不碰各房的判定):拿起放大加陰影、靠近目標金框脈動、放在空白處影子滑回原位 ---- */
  const GHOST = ".fl-ghost,.drag-ghost,.k-ghost,.f-drag-ghost";
  const HOT = ".fl-hot,.k-over,[data-drop].is-over,#dropzone.over";
  perFrame.push((w, d) => {
    const st = d.createElement("style");
    st.textContent = `html body :is(${GHOST}){scale:1.07;filter:drop-shadow(0 18px 14px #0008)!important;animation:sx-lift .16s ease-out;cursor:grabbing}
      @keyframes sx-lift{from{scale:1}to{scale:1.07}}
      html body :is(${HOT}){outline:4px solid #ffd86d!important;outline-offset:3px;animation:sx-magnet .7s ease-in-out infinite alternate}
      @keyframes sx-magnet{from{box-shadow:0 0 0 0 #ffd86d00}to{box-shadow:0 0 22px 6px #ffd86daa}}
      .sx-snapback{position:fixed!important;pointer-events:none!important;z-index:2147483000!important;transition:translate .32s cubic-bezier(.3,1.4,.5,1),opacity .32s ease-in!important}
      html.mm-reduce :is(${GHOST}),html.mm-reduce :is(${HOT}){animation:none;scale:none}`;
    (d.head || d.documentElement).appendChild(st);
    let origin = null, last = null, hot = false, moved = 0;
    d.addEventListener("pointerdown", e => {
      const t = e.target.closest && e.target.closest("[data-drag],.card,.k-card,.f-card,.fl-card,button");
      origin = t ? t.getBoundingClientRect() : null; last = null; hot = false; moved = 0;
    }, true);
    d.addEventListener("pointermove", () => {
      const g = d.querySelector(GHOST); if (!g) return;
      setTimeout(() => { const gg = d.querySelector(GHOST); if (gg) { last = gg.getBoundingClientRect(); hot = !!d.querySelector(HOT); moved++; } }, 0);
    }, true);
    new w.MutationObserver(ms => {
      for (const m of ms) for (const n of m.removedNodes) {
        if (n.nodeType !== 1 || !n.matches(GHOST) || !origin || !last || hot || moved < 3) continue;
        if (d.documentElement.classList.contains("mm-reduce")) continue;
        const dx = (origin.left + origin.width / 2) - (last.left + last.width / 2), dy = (origin.top + origin.height / 2) - (last.top + last.height / 2);
        if (Math.hypot(dx, dy) < 30) continue;
        const c = n.cloneNode(true); c.classList.add("sx-snapback"); c.removeAttribute("id"); c.style.animation = "none";
        d.body.appendChild(c);
        requestAnimationFrame(() => requestAnimationFrame(() => { c.style.translate = dx + "px " + dy + "px"; c.style.opacity = ".15"; }));
        setTimeout(() => c.remove(), 420);
        origin = null;
      }
    }).observe(d.body || d.documentElement, { childList: true, subtree: !d.body });
  });
  attachAll();
})();
