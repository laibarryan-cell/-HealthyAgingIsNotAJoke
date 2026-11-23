/* story-dialog.js — 共用「立繪 + 對話框」元件
   用法:
     await StoryDialog.play({ npc: 1, position: 'center', dual: true,
        lines: [{ who: 'npc', text: '…', pose: 'remind' }, { who: 'player', text: '…' }] });
     await StoryDialog.confirmStart({ npc: 1, title: '要開始冒險了嗎?', text: '…', button: '好,我會加油!' });
   NPC 圖檔路徑集中在 NPC_IMAGES;檔案不存在時自動使用內建佔位圖。 */
(function (root) {
  "use strict";

  /* ===== 圖檔設定(換圖只改這裡)=====
     路徑相對於載入此腳本的頁面所在房間資料夾(game/roomX/ → ../assets/…) */
  /* 圖檔路徑來自 story-art-config.js(window.StoryArt);沒載入或圖片缺檔時用內建佔位圖 */
  const NPC_IMAGES = (root.StoryArt && root.StoryArt.npc) || {};
  const POSES = ["remind", "chat", "talk"];
  const PLACEHOLDER_COLORS = { 1: "#7fa6c9", 2: "#c98f7f", 3: "#8fbf8f" };

  const cssHref = (() => {
    const s = document.currentScript; return s ? s.src.replace(/story-dialog\.js.*$/, "story-dialog.css?v=20261118-2") : "../shared/story-dialog.css";
  })();
  if (!document.querySelector('link[data-story-dialog]')) {
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = cssHref; l.dataset.storyDialog = ""; document.head.appendChild(l);
  }
  const charScript = (() => {
    const s = document.currentScript; return s ? s.src.replace(/story-dialog\.js.*$/, "memory-maze-character.js") : "../shared/memory-maze-character.js";
  })();

  function ensurePlayerRenderer() {
    if (root.MemoryMazeCharacters) return Promise.resolve();
    return new Promise((resolve) => {
      const s = document.createElement("script"); s.src = charScript; s.onload = resolve; s.onerror = resolve; document.head.appendChild(s);
    });
  }

  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  /* 佔位:簡易像素風老人半身(不同姿勢的手勢不同) */
  function placeholderSvg(npc, pose) {
    const c = PLACEHOLDER_COLORS[npc] || "#999";
    const arm = pose === "remind" ? '<rect x="104" y="92" width="14" height="46" fill="#f1c9a0"/><rect x="100" y="84" width="22" height="14" fill="#f1c9a0"/>'
      : pose === "chat" ? '<rect x="96" y="124" width="26" height="12" fill="#f1c9a0"/>'
      : '<rect x="104" y="108" width="30" height="12" fill="#f1c9a0"/>';
    return `<svg viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" role="img" aria-label="NPC ${npc} 佔位圖(${pose})">
      <rect x="40" y="110" width="80" height="90" fill="${c}"/><rect x="30" y="120" width="14" height="70" fill="${c}"/>${arm}
      <rect x="52" y="30" width="56" height="64" fill="#f1c9a0"/><rect x="46" y="22" width="68" height="18" fill="#e8e8e8"/>
      <rect x="46" y="40" width="10" height="28" fill="#e8e8e8"/><rect x="104" y="40" width="10" height="28" fill="#e8e8e8"/>
      <rect x="64" y="56" width="8" height="8" fill="#2a2230"/><rect x="88" y="56" width="8" height="8" fill="#2a2230"/>
      <rect x="68" y="78" width="24" height="6" fill="#a8524a"/>
      <text x="80" y="188" text-anchor="middle" class="sd-placeholder-label">NPC${npc}·${pose}</text></svg>`;
  }

  function buildNpcArt(npc, pose) {
    const art = el("div", "sd-art sd-npc-art");
    const src = NPC_IMAGES[npc] && NPC_IMAGES[npc][pose];
    const fallback = () => { art.innerHTML = placeholderSvg(npc, pose); };
    if (!src) { fallback(); return art; }
    const img = new Image(); img.alt = "NPC"; img.onerror = fallback; img.src = src; art.appendChild(img);
    return art;
  }

  /* 單張圖(例如孫子)當立繪,與 NPC 立繪同一個容器與尺寸規則 */
  function buildImgArt(src, alt) {
    const art = el("div", "sd-art sd-npc-art"); const img = new Image(); img.alt = alt || ""; img.src = src; art.appendChild(img); return art;
  }

  function typewrite(node, text, token) {
    return new Promise((resolve) => {
      let i = 0; node.textContent = "";
      const reduced = root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) { node.textContent = text; resolve(true); return; }
      const timer = setInterval(() => {
        if (token.skip) { clearInterval(timer); node.textContent = text; resolve(true); return; }
        i += 1; node.textContent = text.slice(0, i); if (i % 2 === 1) { try { const SK = window.SoundKit || window.top.SoundKit; SK && (token.voice ? SK.blip(token.voice) : SK.sfx("type")); } catch (e) { } }
        if (i >= text.length) { clearInterval(timer); resolve(true); }
      }, 28);
      token.stop = () => { clearInterval(timer); };
    });
  }

  /* C6 站位:玩家左、NPC右;只有 NPC 時 NPC 放左;只有玩家時玩家放左 */
  function modeOf(whos) {
    const hasP = whos.includes("player"), hasN = whos.some((w) => w !== "player");
    return hasP && hasN ? "both" : hasP ? "player" : "npc";
  }

  /* B1 每間房固定同一位老人:房號由網址(game/roomN-…/)或 StoryDialog.setRoom(n) 決定,NPC 編號由 StoryCopy.npcForRoom 取得 */
  let roomOverride = null;
  function currentRoom() {
    if (roomOverride) return roomOverride;
    const m = /\/room([1-6])-[^/]*\//.exec(root.location.pathname); return m ? Number(m[1]) : null;
  }
  function npcOf(requested) {
    const n = currentRoom(), C = root.StoryCopy;
    return n && C && C.npcForRoom ? C.npcForRoom(n) : requested;
  }

  /* C2 非透明對話框開著時,html 加上 sd-busy;標了 data-after-dialog 的題目區在對話期間隱藏 */
  function syncBusy() { document.documentElement.classList.toggle("sd-busy", !!document.querySelector(".sd-overlay:not(.sd-clear)")); }

  function open(opts) {
    const o = Object.assign({ npc: 1, position: "bottom", mode: "npc", clear: false, npcName: (window.StoryCopy && StoryCopy.npcName) || "神祕老人" }, opts);
    o.npc = npcOf(o.npc);
    const mode = o.mode;
    const overlay = el("div", "sd-overlay"); overlay.dataset.pos = o.position; overlay.dataset.mode = mode;
    if (o.clear) overlay.classList.add("sd-clear");
    if (o.className) overlay.classList.add(...String(o.className).split(/\s+/).filter(Boolean));   /* 各房自訂外觀(例如房三阿福伯提醒:不顯示半身圖) */
    overlay.setAttribute("role", "dialog"); overlay.setAttribute("aria-modal", "true");
    const stage = el("div", "sd-stage");
    const left = el("div", "sd-portrait sd-left"); const right = el("div", "sd-portrait sd-right");
    const box = el("div", "sd-box"); const name = el("div", "sd-name"); const text = el("p", "sd-text");
    const buttons = el("div", "sd-buttons"); const hint = el("span", "sd-hint", "▼ 點一下繼續");
    box.append(name, text, buttons, hint);
    stage.append(left, box, right); overlay.append(stage);
    document.body.appendChild(overlay); syncBusy();

    // 玩家半身(使用已裝扮好的造型):玩家一律在左
    const playerSide = left;
    const npcSide = mode === "both" ? right : left;
    if (mode === "npc") right.hidden = true;
    if (mode === "player") right.hidden = true;
    let playerReady = Promise.resolve();
    if (mode !== "npc") {
      const art = el("div", "sd-art sd-player-art"); const host = el("div"); host.dataset.mmCharacter = "player"; host.dataset.mmFootAnchor = "true"; host.dataset.mmRefScale = "true"; art.appendChild(host); playerSide.appendChild(art);
      playerReady = ensurePlayerRenderer().then(() => root.MemoryMazeCharacters && root.MemoryMazeCharacters.renderHost(host));
    }

    let npcPoseIdx = 0, lastKind = null, lastNpc = null;
    const api = {
      overlay, ready: playerReady,
      async say(line) {
        const isPlayer = (line.who || "npc") === "player";
        const isGrandson = (line.who === "grandson" || (isPlayer && o.partner === "grandson")) && !!o.grandsonSrc;   /* 孫子發話時,站在對話框旁的是孫子本人,不是片尾老人;partner:"grandson" 時玩家發話,對面仍是孫子(房四噪音) */
        const pose = line.pose || POSES[npcPoseIdx % POSES.length];
        if (!isPlayer) npcPoseIdx += 1;
        if (mode !== "player") {
          /* NPC 與孫子共用同一個站位:同一個對話框,圖樣就地對換(換人時播放短動畫) */
          const lineNpc = line.npc || o.npc;   /* 第三修改計劃 J:同一段對話可由不同 NPC 輪流說(房間七三位老人),同站位對換 */
          const kind = isPlayer ? lastKind : isGrandson ? "grandson" : "npc" + lineNpc;
          const swapped = lastKind && kind !== lastKind && !isPlayer;
          npcSide.querySelector(".sd-npc-art")?.remove();
          const art = isGrandson ? buildImgArt(o.grandsonSrc, "孫子") : buildNpcArt(isPlayer ? (lastNpc || o.npc) : lineNpc, pose);
          if (swapped) art.classList.add("sd-swap");
          npcSide.appendChild(art);
          if (!isPlayer) { lastKind = kind; if (!isGrandson) lastNpc = lineNpc; }
        }
        if (mode === "both") { right.classList.toggle("sd-speaking", !isPlayer); left.classList.toggle("sd-speaking", isPlayer); }
        else { left.classList.add("sd-speaking"); }
        const pn = (root.MemoryMazeCharacters && root.MemoryMazeCharacters.getPlayer && root.MemoryMazeCharacters.getPlayer().name) || "我";
        name.textContent = isPlayer ? (o.playerName || pn) : isGrandson ? "孫子" : o.npcName;   /* playerName:玩家角色代表其他人物時(例如房三的阿福伯)顯示的名字 */
        buttons.replaceChildren(); hint.hidden = false;
        const token = { skip: false, voice: isPlayer ? "player" : isGrandson ? "grandson" : "npc" + (line.npc || o.npc || 1) };
        try { const SK = window.SoundKit || window.top.SoundKit; SK && SK.emote(line.text, token.voice); } catch (e) { }   /* 2026-11-17 驚訝、感嘆等情緒音效 */
        const typing = typewrite(text, line.text, token);
        if (line.buttons && line.buttons.length) {
          hint.hidden = true;
          await typing;
          return new Promise((resolve) => {
            line.buttons.forEach((b, i) => {
              const btn = el("button", "sd-btn", b.label); btn.type = "button";
              btn.addEventListener("click", (e) => { e.stopPropagation(); resolve(b.value != null ? b.value : i); });
              buttons.appendChild(btn); if (i === 0) setTimeout(() => btn.focus(), 30);
            });
          });
        }
        return new Promise((resolve) => {
          /* F9(2026-11-18 晚):設定選單「對話自動前進」打開時,打完字後依句子長短停一下自動換下一句(點擊仍可提早) */
          let auto = false; try { auto = !!JSON.parse(localStorage.getItem("memoryMazeSettings") || "{}").auto; } catch (e) { }
          let typed = false, autoT = 0; typing.then(() => { typed = true; if (auto) autoT = setTimeout(() => next(), 1600 + String(line.text || "").length * 70); });
          const next = (e) => {
            if (e && e.type === "keydown" && !["Enter", " ", "ArrowRight"].includes(e.key)) return;
            if (e) e.preventDefault();
            if (!typed) { token.skip = true; return; }
            clearTimeout(autoT);
            overlay.removeEventListener("click", next); root.removeEventListener("keydown", next, true); resolve(true);
          };
          overlay.addEventListener("click", next); root.addEventListener("keydown", next, true);
        });
      },
      close() { overlay.remove(); syncBusy(); }
    };
    return api;
  }

  /* C6 同一時間只會有一個對話框:後來的對話排隊,等前一個完全關閉(圖層移除)後才開始 */
  let chain = Promise.resolve();
  function serial(fn) {
    const run = chain.then(() => fn());
    chain = run.then(() => {}, () => {});
    return run;
  }

  /* 依序播放多句台詞;回傳 Promise,播完後關閉 */
  function play(opts) { return serial(() => playNow(opts)); }
  async function playNow(opts) {
    const d = open(Object.assign({ mode: modeOf(opts.lines.map((l) => l.who || "npc")) }, opts)); await d.ready;
    const results = [];
    for (const line of opts.lines) results.push(await d.say(line));
    if (!opts.keepOpen) d.close();
    return opts.keepOpen ? d : results;
  }

  /* 單句 + 按鈕選項(例如提示、答錯回饋) */
  function ask(opts) { return serial(() => askNow(opts)); }
  async function askNow(opts) {
    const d = open(Object.assign({ mode: modeOf([opts.who || "npc"]) }, opts)); await d.ready;
    const v = await d.say({ who: opts.who || "npc", text: opts.text, pose: opts.pose, buttons: opts.buttons });
    d.close(); return v;
  }

  /* 「要開始冒險了嗎?」面板 */
  function confirmStart(opts) { return serial(() => confirmNow(opts)); }
  async function confirmNow(opts) {
    const o = Object.assign({ npc: 1, title: "要開始冒險了嗎?", text: "", button: "好,我會加油!", position: "center" }, opts);
    const d = open(Object.assign({}, o, { clear: false, mode: "npc" }));
    await d.ready;
    const title = el("p", "sd-panel-title", o.title);
    d.overlay.querySelector(".sd-box").insertBefore(title, d.overlay.querySelector(".sd-text"));
    await d.say({ who: "npc", pose: "talk", text: o.text, buttons: [{ label: o.button, value: true }] });
    d.close(); return true;
  }

  /* 星星帶軌跡飛向目標元素(進度條、背包共用)。回傳 Promise,抵達後 resolve */
  function flyStar(from, toEl, opts) {
    const o = Object.assign({ duration: 900, glyph: "★" }, opts);
    const a = from.getBoundingClientRect ? from.getBoundingClientRect() : { left: from.x, top: from.y, width: 0, height: 0 };
    const b = toEl.getBoundingClientRect();
    const sx = a.left + a.width / 2, sy = a.top + a.height / 2, ex = b.left + b.width / 2, ey = b.top + b.height / 2;
    const star = el("div", "sd-star-fly", o.glyph); document.body.appendChild(star);
    const reduced = root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return new Promise((resolve) => {
      const t0 = performance.now(); const dur = reduced ? 200 : o.duration;
      const arc = -Math.min(160, Math.abs(ex - sx) * 0.3 + 60);
      let lastTrail = 0;
      (function tick(now) {
        const t = Math.min(1, (now - t0) / dur), e = t * t * (3 - 2 * t);
        const x = sx + (ex - sx) * e, y = sy + (ey - sy) * e + Math.sin(Math.PI * e) * arc;
        star.style.left = x - 14 + "px"; star.style.top = y - 14 + "px";
        star.style.transform = `rotate(${t * 540}deg) scale(${1 + Math.sin(Math.PI * t) * 0.6})`;
        if (!reduced && now - lastTrail > 35) {
          lastTrail = now; const d = el("div", "sd-star-trail"); d.style.left = x - 5 + "px"; d.style.top = y - 5 + "px"; document.body.appendChild(d);
          d.animate([{ opacity: 0.9, transform: "scale(1)" }, { opacity: 0, transform: "scale(.2)" }], { duration: 500 }).onfinish = () => d.remove();
        }
        if (t < 1) requestAnimationFrame(tick); else { star.remove(); resolve(); }
      })(t0);
    });
  }

  /* 第三修改計劃 B4:「完成學習」與「返回房間」合併成同一顆按鈕。
     第一段顯示「完成學習」;按下 → finish()(寶物演出等)→ 同一顆按鈕變成 backLabel;再按 → back()。
     同一顆按鈕重複呼叫時會重設回第一段(重玩)。 */
  function finishButton(btn, { finish, back, backLabel = "返回房間", label = "完成學習" } = {}) {
    if (!btn) return null;
    btn.dataset.sdStage = "finish"; btn.textContent = label; btn.disabled = false; btn.classList.remove("sd-stage-back");
    btn.onclick = async (e) => {
      e && e.preventDefault();
      if (btn.dataset.sdStage === "busy") return;
      if (btn.dataset.sdStage === "finish") {
        btn.dataset.sdStage = "busy"; btn.disabled = true;
        try { if (finish) await finish(); } finally {
          btn.dataset.sdStage = "back"; btn.disabled = false; btn.textContent = backLabel;
          btn.classList.remove("sd-stage-back"); void btn.offsetWidth; btn.classList.add("sd-stage-back");
          try { btn.focus({ preventScroll: true }); } catch (_) { }
        }
        return;
      }
      if (btn.dataset.sdStage === "back" && back) back();
    };
    return btn;
  }

  root.StoryDialog = { typewrite, play, ask, open, confirmStart, flyStar, finishButton, NPC_IMAGES, POSES, setRoom(n) { roomOverride = n || null; }, npcOf, currentRoom };
})(window);
