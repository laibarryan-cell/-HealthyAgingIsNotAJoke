/* room-clear.js — 第三修改計劃新增內容2 C1:輸入正確密碼後的「全螢幕通關畫面」
   畫面 = 這間房間 + 這間房間的老人(story-copy.js 的 roomNpc)+ 玩家在裝扮台做的角色(一位),
   接著由這間房間的老人用對話框說「通關了,繼續下一間」。說完才關閉,回到地圖接原本的恢復色彩演出。

   圖檔:正式 CG(ART-N3-04~09,2026-11-18 接入)= game/assets/art-final/clear/roomN-clear-{slim|round|strong}.png,依玩家體型挑選,圖裡已畫好玩家與該房老人;
   還沒到圖時,自動改用「暫定草圖」= 房間圖 + 片尾老人全身立繪,由程式合成。
   用法:await RoomClear.play({ room: 3, name: "營養照護廚房", seconds: 125, remaining: 3 }); */
(function (root) {
  "use strict";
  const base = (() => { const s = document.currentScript; return s ? s.src.replace(/shared\/room-clear\.js.*$/, "") : "../"; })();   // = game/
  const css = document.createElement("link"); css.rel = "stylesheet"; css.href = base + "shared/room-clear.css?v=20261123-learning"; document.head.appendChild(css);

  const ROOM_ART = {
    1: "assets/art-final/rooms/room1-vision-rest.png",
    2: "assets/art-final/rooms/room2-mobility-bathroom.png",
    3: "assets/art-final/rooms/room3-nutrition-kitchen.png",
    4: "assets/art-final/rooms/room4-hearing-livingroom.png",
    5: "assets/art-final/rooms/room5-cognition-hallway.png",
    6: "room6-depression/assets/room.png"
  };
  /* 片尾老人全身立繪(暫定草圖用):1 酒紅西裝、2 白襯衫眼鏡、3 鯊魚帽 */
  const NPC_FULL = { 1: "../assets/ending/ending-elder-left-clean.png", 2: "../assets/ending/ending-elder-center-clean.png", 3: "../assets/ending/ending-elder-right-clean.png" };
  const finalArt = n => "assets/art-final/clear/room" + n + "-clear.png";

  /* 2026-11-18 使用者:正式 CG 要有草稿的動態 → 在 CG 上疊動態效果(座標 = 圖寬高 %),台詞泡泡沿用草稿;
     另外若有「B 動作格」roomN-clear-{體型}-b.png(ART-N4,ChatGPT 製作),兩格交替播放,人物就會動(只在 m 區域內切換,避免兩張圖細節不同) */
  const FX = {
    1: { m: [10, 15, 60, 70], fx: [["twinkle", 50, 47], ["bubble", 79, 11, "戴上看看!"]] },
    2: { m: [12, 8, 65, 75], fx: [["swoosh", 33, 30], ["swoosh", 53, 30], ["bubble", 50, 7, "一、二、三!"]] },
    3: { m: [8, 10, 85, 70], fx: [["steam", 36, 50], ["steam", 48, 47], ["steam", 61, 33], ["bubble", 86, 9, "吃得好香!"]] },
    4: { m: [25, 15, 50, 55], fx: [["rings", 50, 30], ["bubble", 70, 9, "慢～慢～說"]] },
    5: { m: [30, 10, 50, 75], fx: [["bulb", { slim: [41, 14], round: [42, 21], strong: [41, 22] }], ["circle", 55.6, 29]] },
    6: { m: [25, 15, 45, 50], fx: [["steam", 47.6, 41], ["steam", 52.4, 41], ["hearts", 50, 30], ["bubble", 72, 9, "哈哈,真開心!"]] }
  };
  /* 2026-11-18 使用者:通關 CG 新增的特效只留「背景閃閃」(rc-sparks),蒸氣、愛心、氣泡、燈泡等疊加特效全部關閉;要恢復把 SHOW_FX 改成 true */
  const SHOW_FX = false;
  function addFx(scene, room, body) {
    if (!SHOW_FX) return;
    const conf = FX[room]; if (!conf) return;
    const layer = el("div", "rc-fx");
    for (const [t, a, b, c] of conf.fx) {
      let x = a, y = b; if (t === "bulb") [x, y] = a[body] || a.round;
      const e = el("div", "rc-fx-" + t); e.style.left = x + "%"; e.style.top = y + "%";
      if (t === "steam") e.innerHTML = "<i></i><i></i><i></i>";
      if (t === "hearts") e.innerHTML = "<i>♥</i><i>♥</i><i>♥</i>";
      if (t === "rings") e.innerHTML = "<i></i><i></i><i></i>";
      if (t === "bubble") e.textContent = c;
      layer.append(e);
    }
    scene.append(layer);
  }
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const probe = src => new Promise(res => { const i = new Image(); i.onload = () => res(true); i.onerror = () => res(false); i.src = src; });
  const fmt = s => { s = Math.max(0, Math.round(s || 0)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };

  /* 學習成果採用既有 J（判斷）與 A（評量）紀錄，共 27 項；不再換算百分制。 */
  const ROOM_KEY = { 1: "vision", 2: "mobility", 3: "nutrition", 4: "hearing", 5: "cognition", 6: "depression" };
  const GRADES = [[18, "A", "18–27 題"], [9, "B", "9–17 題"], [0, "C", "0–8 題"]];
  const gradeOf = value => {
    const total = Math.max(0, Math.min(27, Math.floor(Number(value) || 0)));
    const g = GRADES.find(x => total >= x[0]);
    return { grade: g[1], gradeText: g[2] };
  };
  function score(room, seconds) {
    const s = root.AchievementSystem.learning.summary(ROOM_KEY[room]);
    return { room, total: s.score, max: s.max, judgment: s.J, judgmentMax: s.JMax,
      seconds: Math.round(seconds || 0), summary: s };
  }
  const reduced = () => document.documentElement.classList.contains("mm-reduce") || (root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const SK = () => { try { return root.SoundKit || (top && top.SoundKit) || null; } catch (e) { return root.SoundKit || null; } };
  const sfx = n => { try { const k = SK(); k && k.sfx(n); } catch (e) { } };
  const valText = (r, v) => r.kind === "time" ? fmt(v) : r.kind === "pct" ? Math.round(v) + "%" : r.kind === "text" ? r.text : `${Math.round(v)}／${r.maxValue}`;
  function burst(layer, x, y, n, opts) {
    opts = opts || {};
    for (let i = 0; i < n; i++) {
      const b = el("i", "rcs-p" + (opts.gold === false ? "" : " rcs-pg")), a = Math.random() * Math.PI * 2, d = (opts.dist || 120) * (.45 + Math.random() * .75);
      b.style.left = x + "px"; b.style.top = y + "px";
      b.style.setProperty("--dx", (Math.cos(a) * d).toFixed(0) + "px"); b.style.setProperty("--dy", (Math.sin(a) * d * .8 - (opts.up || 0)).toFixed(0) + "px");
      b.style.setProperty("--fall", (opts.fall || 0) + "px"); b.style.setProperty("--r", (Math.random() * 720 - 360).toFixed(0) + "deg");
      b.style.animationDuration = (opts.dur || .8) * (.8 + Math.random() * .5) + "s";
      if (opts.colors) b.style.background = opts.colors[i % opts.colors.length];
      layer.append(b); setTimeout(() => b.remove(), (opts.dur || .8) * 1400 + 200);
    }
  }
  function settlement(host, opt) {
    opt = opt || {};
    const rows = opt.rows || [];
    const box = el("section", "rcs"); box.setAttribute("role", "region"); box.setAttribute("aria-label", opt.title || "結算表");
    box.innerHTML = `<header class="rcs-head"><div><small>${opt.kicker || "通關結算"}</small><strong>${opt.title || ""}</strong></div>
        ${opt.collapsible === false ? "" : `<button type="button" class="rcs-toggle" aria-expanded="true">▾ 收起</button>`}</header>
      <ol class="rcs-rows">${rows.map(r => `<li class="rcs-row"><span class="rcs-ic" aria-hidden="true">${r.icon || "✦"}</span>
        <div class="rcs-lab"><b>${r.label}</b><em>${r.sub || ""}</em><i class="rcs-bar"><u></u></i></div>
        <span class="rcs-val">${valText(r, 0)}</span><span class="rcs-pt">${r.points != null ? "+0" : ""}</span></li>`).join("")}</ol>
      ${opt.showTotal === false ? "" : `<div class="rcs-foot"><div class="rcs-total"><span>${opt.totalLabel || "總分"}</span><strong class="rcs-num">0</strong><em>/ ${opt.max == null ? 27 : opt.max}</em></div>
        <div class="rcs-stamp" data-g="${opt.grade || ""}"><i class="rcs-rays"></i><b>${opt.grade || ""}</b></div></div>`}
      <p class="rcs-best" aria-live="polite"></p>
      <p class="rcs-note">${opt.note || "遊戲化回饋,非醫療評估"}</p>
      <button type="button" class="rcs-skip">略過演出 ⏭</button>
      <div class="rcs-fx" aria-hidden="true"></div>`;
    const tab = el("button", "rcs-tab"); tab.type = "button"; tab.hidden = true; tab.setAttribute("aria-expanded", "false");
    tab.innerHTML = `📋 結算表${opt.grade ? ` <b data-g="${opt.grade}">${opt.grade}</b>` : ""} <span>▴ 展開</span>`;
    host.append(box, tab);
    const q = s => box.querySelector(s), fx = q(".rcs-fx"), liEls = [...box.querySelectorAll(".rcs-row")];
    let cancelled = false, finished = false, resolveDone;
    const done = new Promise(r => resolveDone = r);
    const pause = ms => new Promise(r => setTimeout(r, cancelled ? 0 : ms));
    function collapse(on) {
      box.classList.toggle("rcs-collapsed", on); tab.hidden = !on;
      if (on) {   /* 收起鈕放在左上房名牌正下方(名牌大小隨視窗變,所以用實際位置算) */
        const nb = host.querySelector(".rc-banner"), hb = host.getBoundingClientRect();
        if (nb && hb.height) tab.style.top = (nb.getBoundingClientRect().bottom - hb.top + 10) + "px";
      }
      const t = q(".rcs-toggle"); if (t) { t.setAttribute("aria-expanded", String(!on)); t.textContent = on ? "▴ 展開" : "▾ 收起"; }
      tab.setAttribute("aria-expanded", String(!on));
      sfx(on ? "close" : "open");
      if (!on) (q(".rcs-toggle") || box).focus({ preventScroll: true }); else tab.focus({ preventScroll: true });
    }
    q(".rcs-toggle") && (q(".rcs-toggle").onclick = e => { e.stopPropagation(); collapse(true); });
    tab.onclick = e => { e.stopPropagation(); collapse(false); };
    function finalize() {
      liEls.forEach((li, i) => { const r = rows[i]; li.classList.add("on", "done"); li.querySelector(".rcs-val").textContent = valText(r, r.value);
        li.querySelector(".rcs-bar u").style.width = (r.rate * 100).toFixed(1) + "%"; if (r.points != null) li.querySelector(".rcs-pt").textContent = "+" + r.points; if (r.rate >= 1) li.classList.add("full"); });
      const num = q(".rcs-num"); if (num) num.textContent = opt.total;
      const st = q(".rcs-stamp"); if (st) st.classList.add("on", "still");
      q(".rcs-best").textContent = opt.best || ""; q(".rcs-best").classList.add("on");
      box.classList.add("rcs-ended"); q(".rcs-skip").hidden = true;
      if (!finished) { finished = true; resolveDone(); }
    }
    function skip() { if (finished) return; cancelled = true; box.classList.add("rcs-skipped"); finalize(); }
    q(".rcs-skip").onclick = e => { e.stopPropagation(); skip(); };
    box.addEventListener("click", e => { if (!e.target.closest("button") && !finished) skip(); });
    function countUp(node, from, to, ms, fmtFn, onTick) {
      return new Promise(res => {
        if (cancelled || ms <= 0) { node.textContent = fmtFn(to); return res(); }
        const t0 = performance.now(); let last = -1, n = 0;
        const step = now => {
          if (cancelled) { node.textContent = fmtFn(to); return res(); }
          const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3), v = from + (to - from) * e;
          const shown = Math.round(v); if (shown !== last) { last = shown; node.textContent = fmtFn(v); if (++n % 2 === 0) onTick && onTick(k); }
          if (k < 1) requestAnimationFrame(step); else { node.textContent = fmtFn(to); res(); }
        };
        requestAnimationFrame(step);
      });
    }
    const shake = (cls, ms) => { const t = opt.shakeTarget || host; t.classList.remove(cls); void t.offsetWidth; t.classList.add(cls); setTimeout(() => t.classList.remove(cls), ms); };
    const center = node => { const r = node.getBoundingClientRect(), b = box.getBoundingClientRect(), k = b.width / (box.offsetWidth || b.width) || 1; return [(r.left + r.width / 2 - b.left) / k, (r.top + r.height / 2 - b.top) / k]; };
    async function run() {
      if (reduced()) { box.classList.add("rcs-in", "rcs-calm"); finalize(); return; }
      try { SK() && SK().sfx("tickReset"); } catch (e) { }
      requestAnimationFrame(() => box.classList.add("rcs-in", "rcs-drop"));
      await pause(450); box.classList.remove("rcs-drop"); if (cancelled) return;
      sfx("thud"); shake("rcs-shake-s", 300);
      await pause(380);
      for (let i = 0; i < rows.length && !cancelled; i++) {
        const r = rows[i], li = liEls[i], val = li.querySelector(".rcs-val"), pt = li.querySelector(".rcs-pt");
        li.classList.add("on"); sfx("whooshSoft"); await pause(160);
        li.querySelector(".rcs-bar u").style.width = (r.rate * 100).toFixed(1) + "%";
        await countUp(val, 0, r.value, 540, v => valText(r, v), () => sfx("tick"));
        if (r.points != null) await countUp(pt, 0, r.points, 220, v => "+" + Math.round(v), () => sfx("tick"));
        li.classList.add("done"); const [x, y] = center(val); burst(fx, x, y, r.rate >= 1 ? 10 : 5, { dist: 70, dur: .6 });
        if (r.rate >= 1) { li.classList.add("full"); sfx("collect"); } else sfx("pop");
        await pause(140);
      }
      if (opt.showTotal !== false && !cancelled) {
        await pause(380);
        try { SK() && SK().sfx("tickReset"); } catch (e) { }
        const num = q(".rcs-num"); box.classList.add("rcs-counting");
        await countUp(num, 0, opt.total, 1200, v => String(Math.round(v)), k => { box.style.setProperty("--rcs-glow", k.toFixed(2)); sfx("tick"); });
        box.classList.remove("rcs-counting"); num.classList.add("pop"); sfx("thud");
        await pause(320);
        if (!cancelled && opt.grade) {
          const st = q(".rcs-stamp"); st.classList.add("on", "slam");
          await pause(170);   // 印章砸到的瞬間
          if (!cancelled) {
            box.classList.add("rcs-hitstop"); await pause(60); box.classList.remove("rcs-hitstop");
            sfx("stamp"); setTimeout(() => sfx("fanfare"), 120);
            shake("rcs-shake-l", 520);
            const fl = el("i", "rcs-flash"); (opt.flashHost || host).append(fl); setTimeout(() => fl.remove(), 700);
            const [x, y] = center(st);
            burst(fx, x, y, 36, { dist: 260, dur: 1.3, up: 40, fall: 220, colors: ["#ffd86d", "#fff3c0", "#f0a53a", "#ff7b5a", "#9fe0ff"] });
          }
        }
      }
      await pause(260);
      const best = q(".rcs-best"); best.textContent = opt.best || ""; best.classList.add("on");
      finalize();
    }
    run();
    return { el: box, tab, done, skip, collapse };
  }

  /* 沿用跳數、進度條與粒子演出，兩段之間由玩家確認。 */
  function learningSequence(host, summary, opt = {}) {
    let panel = null, cancelled = false, confirmNext = null;
    const rooms = summary.rooms || [summary];
    const rowsFor = judgment => rooms.map(s => {
      const value = judgment ? s.J : s.score, max = judgment ? s.JMax : s.max;
      return { label: s.label || opt.title || "學習成果", icon: judgment ? "💭" : "📘",
        kind: "ratio", value, maxValue: max, rate: max ? value / max : 0,
        sub: max ? "答對題數／列入題數" : "本房間無此類計分題目" };
    });
    const render = judgment => settlement(host, {
      kicker: judgment ? "第一段・情境判斷" : "第二段・列入評分的題目",
      title: judgment ? "判斷題答對題數" : "有列入評分的題目答對數",
      rows: rowsFor(judgment), showTotal: false,
      best: judgment ? `判斷題答對 ${summary.J}／${summary.JMax} 題` : `列入評分題目答對 ${summary.score}／${summary.max} 題`,
      note: judgment ? "確認後查看列入評分的題目答對數" : "包含判斷題與評量項目；時間與寶物不列入分數",
      collapsible: judgment ? false : opt.collapsible,
      shakeTarget: opt.shakeTarget || host, flashHost: opt.flashHost || host
    });
    const remove = () => { if (panel) { panel.skip(); panel.el.remove(); panel.tab.remove(); } };
    const done = (async () => {
      panel = render(true); await panel.done;
      if (cancelled) return;
      await new Promise(resolve => {
        confirmNext = resolve;
        const next = el("button", "rcs-next", "確認，查看列入評分題目 →");
        next.type = "button"; next.onclick = () => { confirmNext = null; resolve(); };
        panel.el.append(next); next.focus({ preventScroll: true });
      });
      if (cancelled) return;
      remove(); panel = render(false); await panel.done;
    })();
    return {
      done, get el() { return panel.el; }, get tab() { return panel.tab; },
      skip() { panel && panel.skip(); }, collapse(on) { panel && panel.collapse(on); },
      destroy() { cancelled = true; if (confirmNext) { confirmNext(); confirmNext = null; } remove(); }
    };
  }
  async function play({ room, name = "", seconds = 0, remaining = 0, settle = null } = {}) {
    /* 先同步放上全螢幕圖層:地圖的恢復色彩演出會等這個圖層消失才播(不會在背後先播掉) */
    try { (window.SoundKit || (top && top.SoundKit)) && (window.SoundKit || top.SoundKit).sfx("fanfare"); } catch (e) { }
    const ov = el("div", "rc-overlay"); ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", `房間 ${room} 通關`);
    document.body.append(ov);
    if (root.ArtUI && root.ArtUI.loadStory) await root.ArtUI.loadStory();
    const copy = root.StoryCopy || {};
    const npc = copy.npcForRoom ? copy.npcForRoom(room) : 1;
    /* 正式 CG:先找「這間房 + 玩家體型」專屬圖(roomN-clear-slim/round/strong.png),沒有再找 roomN-clear.png */
    let body = "round"; try { body = ["slim", "round", "strong"][JSON.parse(localStorage.getItem("memoryMazeAvatar") || "{}").base] || "round"; } catch (e) {}
    try { window.MemoryGallery && MemoryGallery.unlockCG("room" + room, body); } catch (e) {}   /* 2026-11-18 回憶館:通關就收藏這張 CG */
    let finalSrc = finalArt(room).replace(".png", "-" + body + ".png");
    let hasFinal = await probe(base + finalSrc);
    if (!hasFinal) { finalSrc = finalArt(room); hasFinal = await probe(base + finalSrc); }

    /* 2026-11-17 新增內容3-9:還沒有正式圖時,改用「專屬這間房間的互動 CG 向量草稿」(vector-cast.js:玩家和該房老人在房間裡一起看書、做操、吃飯、聊天、喝茶…) */
    if (!hasFinal && !root.VectorCast) await new Promise(res => { const s = document.createElement("script"); s.src = base + "shared/vector-cast.js?v=3"; s.onload = res; s.onerror = res; document.head.append(s); });
    const vector = !hasFinal && !!root.VectorCast;
    const scene = el("div", "rc-scene" + (hasFinal ? " rc-final" : vector ? " rc-vector" : " rc-draft"));
    if (vector) scene.innerHTML = root.VectorCast.clearScene(room);
    else scene.style.backgroundImage = `url('${base + (hasFinal ? finalSrc : ROOM_ART[room])}')`;
    if (hasFinal) {
      addFx(scene, room, body);
      const bSrc = base + finalSrc.replace(".png", "-b.png");
      if (/-(slim|round|strong)\.png$/.test(finalSrc) && await probe(bSrc)) {
        const m = (FX[room] || {}).m || [0, 0, 100, 100], b2 = el("div", "rc-frameb");
        b2.style.backgroundImage = `url('${bSrc}')`; b2.style.clipPath = `inset(${m[1]}% ${100 - m[0] - m[2]}% ${100 - m[1] - m[3]}% ${m[0]}%)`;
        scene.append(b2);
      }
    }
    scene.append(el("div", "rc-glow"));
    const sparks = el("div", "rc-sparks"); for (let i = 0; i < 26; i++) { const b = el("b"); b.style.left = (Math.random() * 100).toFixed(1) + "%"; b.style.top = (8 + Math.random() * 62).toFixed(1) + "%"; b.style.animationDelay = (Math.random() * 3).toFixed(2) + "s"; b.style.setProperty("--s", (0.6 + Math.random() * 0.9).toFixed(2)); sparks.append(b); } scene.append(sparks);
    if (!hasFinal && !vector) { const n = el("img", "rc-npc"); n.src = base + NPC_FULL[npc]; n.alt = "這間房間的老人"; scene.append(n); }
    const pl = el("div", "rc-player"); const host = el("div"); host.dataset.mmCharacter = "player"; host.dataset.mmFootAnchor = "true"; host.dataset.mmRefScale = "true"; pl.append(host); if (!vector && !hasFinal) scene.append(pl);   /* 正式 CG(ART-N3-04~09)圖裡已畫好玩家與老人,不再疊人物 */
    const banner = el("div", "rc-banner", `<small>房間 ${room}</small><strong>${name || "記憶修復"}・通關</strong><span>本關記憶旅程 ${fmt(seconds)}</span>`);
    /* 2026-11-20:學習成果表不再塞在左上角的名牌裡(會蓋住通關圖),改由下面的「結算表」逐列演出,且可收起 */
    scene.append(banner);
    ov.append(scene);
    try {
      if (!root.MemoryMazeCharacters) await new Promise(res => { const s = document.createElement("script"); s.src = base + "shared/memory-maze-character.js"; s.onload = res; s.onerror = res; document.head.append(s); });
      if (!vector && !hasFinal && root.MemoryMazeCharacters) await root.MemoryMazeCharacters.renderHost(host);
    } catch (e) {}
    requestAnimationFrame(() => ov.classList.add("rc-in"));
    await wait(1300);

    const res = score(room, seconds);
    const panel = learningSequence(scene, res.summary, { title: name, shakeTarget: scene, flashHost: scene });
    await panel.done;
    await wait(900);
    panel.collapse(true);
    await wait(350);

    const lines = copy.roomClear ? copy.roomClear(room, name, remaining) : [{ who: "npc", text: `「${name}」通關了!我們繼續前往下一間房間吧!` }];
    /* 2026-11-18 晚:使用者要由這間房的提示老人親口說明通關(不用卡片)→「今天學到」的重點(StoryCopy.learned,朋友提供)插在最後一句之前;還沒提供就不說 */
    const learned = ((copy.learned || {})[room] || []).filter(Boolean);
    if (learned.length) lines.splice(Math.max(0, lines.length - 1), 0, { who: "npc", pose: "remind", text: "今天在這裡學到的重點:" }, ...learned.map(t => ({ who: "npc", pose: "chat", text: t })));
    try {
      if (root.StoryDialog) await root.StoryDialog.play({ npc, position: "bottom", className: "rc-dialog", lines: lines.map(l => Object.assign({ pose: "talk" }, l)) });
      else await wait(2500);
    } catch (e) {}
    /* 2026-11-18 使用者:老人說完後由玩家決定要不要再看這張通關圖;看完再選「返回房間配置圖,繼續遊玩」才離開 */
    await new Promise(done => {
      const bar = el("div", "rc-choice"); bar.setAttribute("role", "group"); bar.setAttribute("aria-label", "通關後選擇");
      bar.innerHTML = `<p class="rc-choice-q">要再欣賞一下這張通關圖嗎?</p><div class="rc-choice-btns"><button type="button" class="rc-btn rc-view">再看看這張圖</button><button type="button" class="rc-btn rc-back">返回房間配置圖,繼續遊玩</button></div>`;
      ov.append(bar);
      const view = bar.querySelector(".rc-view"), back = bar.querySelector(".rc-back");
      view.onclick = () => { panel.collapse(true); bar.classList.add("rc-mini"); view.hidden = true; back.textContent = "← 返回房間配置圖,繼續遊玩"; back.focus(); };
      back.onclick = () => done();
      requestAnimationFrame(() => { bar.classList.add("rc-show"); view.focus(); });
    });
    ov.classList.add("rc-out"); await wait(450); ov.remove();
  }
  root.RoomClear = { play, score, settlement, learningSequence, gradeOf };
})(window);
