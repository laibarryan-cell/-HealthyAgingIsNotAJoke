/* home-v4.js — 第三修改計劃新增內容2(放在 game.js 之後載入,不改 game.js 原本邏輯)
   A2 首頁背景圖上的星星一閃一閃、夜燈(兩側燈籠、門口壁燈)微微明暗閃爍 —— 只加特效圖層,不改背景圖
   A3 點大門 → 門打開、門口出現漩渦,主角背影被吸進門裡、一道白光 → 進入「建立角色」;動畫中點一下可跳過 */
(function () {
  "use strict";
  const $ = s => document.querySelector(s);
  const home = $("#screen-home"), door = $("#door");
  if (!home || !door) return;
  const IMG_W = 1672, IMG_H = 941;   // 首頁背景 home-night-candidate-v1.png 尺寸(background-size:cover、置中)

  /* 星星位置:由背景圖的星空亮點自動找出(以圖的百分比表示) */
  const STARS = [[25.1,2.2],[75.0,2.2],[39.2,6.3],[65.6,7.2],[34.3,7.3],[29.2,12.2],[9.0,20.3],[81.0,16.6],[14.5,2.8],[21.7,3.9],[62.2,7.2],[83.6,12.3],[46.5,1.1],[89.5,23.9],[15.7,8.1],[44.1,7.5],[17.7,17.2],[76.0,17.2],[56.3,3.3],[28.4,2.8],[43.6,2.4],[26.2,5.5],[23.4,3.4],[36.2,9.7],[90.9,4.9],[71.8,7.0],[68.0,2.6],[19.9,6.8],[31.0,3.4],[93.5,2.8],[50.5,3.3],[89.0,9.4],[51.3,5.7],[28.1,10.6],[88.2,24.8],[63.0,3.3]];
  /* 夜燈:兩側大燈籠、矮燈籠、門口兩盞壁燈(圖的百分比,w = 光暈大小佔圖寬的百分比) */
  const LAMPS = [[10.6,62.5,11],[84.9,62.2,11],[27.6,71.0,7],[70.6,71.0,7],[38.3,58.3,5.5],[61.5,58.3,5.5]];
  const ELDER = { x: 49.8, top: 78, h: 17.7 };   // 背景圖裡主角背影的位置
  const DOOR = { x: 50, y: 63.8 };               // 大門中心

  const fx = document.createElement("div"); fx.className = "hv4-fx"; fx.setAttribute("aria-hidden", "true");
  STARS.forEach(([x, y], i) => {
    const s = document.createElement("i"); s.className = "hv4-star" + (i % 5 === 0 ? " hv4-cross" : "");
    s.style.left = x + "%"; s.style.top = y + "%";
    s.style.setProperty("--sz", (i % 5 === 0 ? 7 : 4 + (i % 3)) + "px");
    s.style.setProperty("--d", (2.2 + (i * 0.37) % 2.6).toFixed(2) + "s");
    s.style.setProperty("--delay", ((i * 0.53) % 3).toFixed(2) + "s");
    fx.appendChild(s);
  });
  const shoot = document.createElement("i"); shoot.className = "hv4-shoot"; shoot.style.left = "78%"; shoot.style.top = "9%"; fx.appendChild(shoot);
  LAMPS.forEach(([x, y, w], i) => {
    const l = document.createElement("i"); l.className = "hv4-lamp"; l.style.left = x + "%"; l.style.top = y + "%";
    l.dataset.w = w; l.style.setProperty("--d", (3.4 + i * 0.7).toFixed(1) + "s"); l.style.setProperty("--delay", (i * 0.45).toFixed(2) + "s");
    fx.appendChild(l);
  });
  home.appendChild(fx);

  /* 2026-11-17 使用者:首頁只要夜燈有特效、不要太強烈,不要風痕/落葉/窗戶明暗;樹擺動要保留(同前一版) */
  /* 樹隨風搖:從背景圖切出的樹(assets/ui-shell/home-fx/),以樹根為軸輕輕擺動 */
  const TREES = [["tree-left", 0, 8.5, 13.76, 69.08, 1.6], ["tree-right", 87.92, 11.16, 12.08, 70.67, 1.4], ["cypress-left", 16.75, 44.63, 7.78, 32.41, 2.2], ["cypress-right", 70.57, 44.63, 7.48, 32.41, 2.0]];
  TREES.forEach(([name, x, y, w, h, amp], i) => {
    const t = document.createElement("i"); t.className = "hv4-tree";
    Object.assign(t.style, { left: x + "%", top: y + "%", width: w + "%", height: h + "%", backgroundImage: 'url("assets/ui-shell/home-fx/' + name + '.png")' });
    t.style.setProperty("--amp", amp + "deg"); t.style.setProperty("--delay", (-i * 0.7) + "s");
    fx.appendChild(t);
  });

  /* 落葉:從兩側樹上飄落(使用者 2026-11-17 要保留) */
  const LEAF_COLORS = ["#6f9a3a", "#a8c050", "#c9862c", "#d9a83e", "#8a5a24"];
  for (let i = 0; i < 18; i++) {
    const left = i % 2 === 0, lf = document.createElement("i"); lf.className = "hv4-leaf";
    const sx = left ? 2 + (i * 7.3) % 12 : 88 + (i * 5.1) % 10, sy = 14 + (i * 11.7) % 40;
    lf.style.left = sx + "%"; lf.style.top = sy + "%"; lf.style.background = LEAF_COLORS[i % LEAF_COLORS.length];
    lf.style.setProperty("--dx", (left ? 1 : -1) * (18 + (i * 3.7) % 22) + "vw"); lf.style.setProperty("--dy", (38 + (i * 6.1) % 30) + "vh");
    lf.style.setProperty("--d", (7 + (i * 1.3) % 6).toFixed(1) + "s"); lf.style.setProperty("--delay", (-(i * 1.9) % 12).toFixed(1) + "s");
    lf.style.setProperty("--sz", (11 + i % 4 * 2) + "px");
    fx.appendChild(lf);
  }

  let box = { x: 0, y: 0, w: 0, h: 0 };
  function place() {
    const W = home.clientWidth, H = home.clientHeight; if (!W || !H) return;
    const k = Math.max(W / IMG_W, H / IMG_H), w = IMG_W * k, h = IMG_H * k;
    box = { x: (W - w) / 2, y: (H - h) / 2, w, h };
    Object.assign(fx.style, { left: box.x + "px", top: box.y + "px", width: w + "px", height: h + "px" });
    fx.querySelectorAll(".hv4-lamp").forEach(l => l.style.setProperty("--w", (w * l.dataset.w / 100).toFixed(0) + "px"));
  }
  addEventListener("resize", place); document.addEventListener("fullscreenchange", () => setTimeout(place, 60));
  new MutationObserver(() => home.classList.contains("active") && place()).observe(home, { attributes: true, attributeFilter: ["class"] });
  place();

  /* ---------- A3 ---------- */
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const imgPt = (px, py) => { const r = home.getBoundingClientRect(); return { x: r.left + box.x + box.w * px / 100, y: r.top + box.y + box.h * py / 100 }; };
  door.onclick = () => {
    if (typeof homeOpening !== "undefined" && homeOpening) return;
    /* 必須在點擊當下請求全螢幕，保留瀏覽器的使用者操作授權。 */
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const screenRoot = document.documentElement;
        const enterFullscreen = screenRoot.requestFullscreen || screenRoot.webkitRequestFullscreen;
        if (enterFullscreen) {
          const request = enterFullscreen.call(screenRoot);
          if (request && request.catch) request.catch(() => {});
        }
      }
    } catch (e) { /* 不支援或被瀏覽器拒絕時，繼續開場。 */ }
    try { homeOpening = true; } catch (e) {}
    place();
    if (window.SoundKit) SoundKit.cinematicMusic("intro");
    home.classList.add("opening");
    const nav = home.querySelector(".home-nav"); if (nav) nav.inert = true;
    const d = imgPt(DOOR.x, DOOR.y), eTop = imgPt(ELDER.x, ELDER.top), eh = box.h * ELDER.h / 100;
    if (window.SoundKit) { SoundKit.sfx("door"); SoundKit.sfx("portal"); }
    const ov = document.createElement("div"); ov.className = "hv4-portal"; ov.setAttribute("aria-label", "進入記憶之家(點一下跳過)");
    ov.style.setProperty("--px", d.x + "px"); ov.style.setProperty("--py", d.y + "px");
    ov.style.setProperty("--vs", Math.round(box.h * 0.42) + "px");
    const elderCenterY = eTop.y + eh * 0.5;
    ov.style.setProperty("--ex", eTop.x + "px"); ov.style.setProperty("--ey", eTop.y + "px"); ov.style.setProperty("--eh", eh + "px");
    ov.style.setProperty("--dx", (d.x - eTop.x) + "px"); ov.style.setProperty("--dy", (d.y - elderCenterY) + "px");
    ov.style.setProperty("--dx2", ((d.x - eTop.x) * 0.55) + "px"); ov.style.setProperty("--dy2", ((d.y - elderCenterY) * 0.55) + "px");
    let html = '<div class="hv4-dim"></div><img class="hv4-elder" src="assets/ending/ending-elder-back-clean.png" alt="">';
    for (let i = 0; i < 28; i++) {
      const a = Math.random() * Math.PI * 2, r = box.h * (0.25 + Math.random() * 0.35);
      const sx = d.x + Math.cos(a) * r, sy = d.y + Math.sin(a) * r * 0.8;
      html += `<i class="hv4-dust" style="--sx:${sx}px;--sy:${sy}px;--tx:${(d.x - sx).toFixed(0)}px;--ty:${(d.y - sy).toFixed(0)}px;--delay:${(0.3 + Math.random() * 1.2).toFixed(2)}s"></i>`;
    }
    html += '<span class="hv4-skip">點一下跳過</span>';   /* 2026-11-18 使用者:不要紫色旋渦與閃光,只留「老人被吸入大門」 */
    ov.innerHTML = html;
    document.body.appendChild(ov);
    home.classList.add("hv4-shake");
    let done = false;
    const finish = () => {
      if (done) return; done = true;
      if (nav) nav.inert = false;
      window.EntranceStory.play(() => showScreen("character"));
      home.classList.remove("opening", "hv4-shake");
      try { homeOpening = false; } catch (e) {}
      ov.style.transition = "opacity .45s"; ov.style.opacity = "0"; setTimeout(() => ov.remove(), 480);
    };
    ov.addEventListener("click", finish);
    setTimeout(finish, reduce() ? 300 : 2850);
  };

  /* ---------- 2026-11-18 今日任務 1:大門提示 ----------
     門前閃爍「點擊大門開始」;滑鼠移到門上(或鍵盤聚焦)時門縫透出光、像微微打開,並播一聲開門聲 */
  const seam = document.createElement("i"); seam.className = "hv4-doorseam"; fx.appendChild(seam);
  const hint = document.createElement("span"); hint.className = "hv4-door-hint"; hint.textContent = "點擊大門開始"; fx.appendChild(hint);
  let creakAt = 0;
  const doorOn = on => {
    home.classList.toggle("hv4-door-hover", on);
    if (on && window.SoundKit && Date.now() - creakAt > 1500) { creakAt = Date.now(); try { SoundKit.sfx("door"); } catch (e) {} }
  };
  door.addEventListener("pointerenter", () => doorOn(true));
  door.addEventListener("pointerleave", () => doorOn(false));
  door.addEventListener("focus", () => doorOn(true));
  door.addEventListener("blur", () => doorOn(false));

  /* ---------- 2026-11-18 今日任務 8:看完片尾(回憶館記錄「已通關」)後,三位片尾老人出現在首頁大門前 ----------
     位置以背景圖百分比表示(x = 腳底中心,b = 腳底離圖底的距離,h = 身高);右下角是首頁按鈕,三位老人都站在廣場中央、主角兩側;點一下會說一句話 */
  const ELDERS = [
    { img: "left", x: 31, b: 3.2, h: 16.5, say: "歡迎回來!要不要再走一趟記憶之家?", sfx: "npc1" },
    { img: "center", x: 39.5, b: 7.5, h: 14.4, say: "回憶館裡收著你一路的回憶喔。", sfx: "npc2" },
    { img: "right", x: 60, b: 3.2, h: 16.8, say: "新年快樂!鏘鏘鏘鏘!", sfx: "npc3" }
  ];
  const crew = document.createElement("div"); crew.className = "hv4-crew"; crew.hidden = true;
  ELDERS.forEach((e, i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "hv4-crewman"; b.setAttribute("aria-label", "片尾老人:" + e.say);
    b.style.left = e.x + "%"; b.style.bottom = e.b + "%"; b.style.height = e.h + "%"; b.style.setProperty("--delay", (-i * 0.6) + "s");
    b.innerHTML = '<img src="assets/ending/ending-elder-' + e.img + '-clean.png" alt=""><span class="hv4-say"></span>';
    b.addEventListener("click", ev => {
      ev.stopPropagation();
      const say = b.querySelector(".hv4-say"); say.textContent = e.say; b.classList.remove("talk"); void b.offsetWidth; b.classList.add("talk");
      try { window.SoundKit && SoundKit.speak(e.sfx, e.say); } catch (er) {}
      clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove("talk"), 3200);
    });
    crew.appendChild(b);
  });
  fx.appendChild(crew);
  /* 2026-11-18 晚 彩蛋:通關後首頁換成「新年裝飾版」背景(ART-N5-01~03,三位老人直接畫在圖裡,依場景真實比例)。
     A/B 兩張交替讓老人動起來;點老人(NY_SPOTS,圖收到後依位置填)會說話。圖還沒放進來前,沿用上面的三位老人立繪。 */
  const NY = "assets/art-production/home/home-night-newyear";
  /* 2026-11-18 ART-N5 接入:依圖上老人實際位置(圖的百分比)設定點擊範圍 */
  const NY_SPOTS = [
    { x: 32.8, y: 62.5, w: 7, h: 23, say: "新年快樂!燈籠掛高一點,記憶之家才會亮亮的!", sfx: "npc1" },
    { x: 58.9, y: 71.5, w: 5, h: 14.5, say: "嗯……這步棋讓我想想,先別催我喔。", sfx: "npc2" },
    { x: 64, y: 70, w: 5.2, h: 16, say: "將軍!哈哈哈,鏘鏘鏘鏘!", sfx: "npc3" }
  ];
  let nyReady = false;
  const nyb = document.createElement("i"); nyb.className = "hv4-nyb"; fx.insertBefore(nyb, fx.firstChild);
  /* 原首頁的主角背影是畫在背景圖裡的;新年版圖上沒有 → 用同一張背影圖疊回原位置(圖的百分比) */
  const nyHero = document.createElement("img"); nyHero.className = "hv4-nyhero"; nyHero.alt = ""; nyHero.src = "assets/ending/ending-elder-back-clean.png";
  nyb.after(nyHero);
  NY_SPOTS.forEach(e => {
    const b = document.createElement("button"); b.type = "button"; b.className = "hv4-nyspot"; b.setAttribute("aria-label", e.say);
    Object.assign(b.style, { left: e.x + "%", top: e.y + "%", width: e.w + "%", height: e.h + "%" });
    b.innerHTML = '<span class="hv4-say"></span>';
    b.addEventListener("click", ev => { ev.stopPropagation(); const t = b.querySelector(".hv4-say"); t.textContent = e.say; b.classList.remove("talk"); void b.offsetWidth; b.classList.add("talk");
      try { window.SoundKit && SoundKit.speak(e.sfx, e.say); } catch (er) {} clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove("talk"), 3200); });
    nyb.after(b);
  });
  /* 2026-11-18 晚 新年裝飾亮亮特效:在燈籠、紅綢、對聯、鞭炮的位置(圖的百分比)放小小的閃光,錯開時間輪流閃 */
  [[40.2,40.3],[43.6,40.3],[47.4,40.3],[51.4,40.3],[54.8,40.3],[58.2,40.3],[61.8,40.3],[44.5,28.6],[47.8,28.6],[51.3,28.6],[54.6,28.6],
   [45,24.2],[53.4,24.2],[48,36.2],[52,36.2],[40.5,64.5],[40.6,68],[59.4,64.5],[59.5,68],[37.4,36.5],[66.5,36.5],[27,28.4],[72,28.4],[49,45.4]].forEach((q, i) => {
    const sp = document.createElement("i"); sp.className = "hv4-nysp" + (i % 3 === 0 ? " hv4-cross" : "");
    sp.style.left = q[0] + "%"; sp.style.top = q[1] + "%"; sp.style.setProperty("--d", (2.2 + (i % 5) * 0.55) + "s"); sp.style.setProperty("--delay", (-(i * 0.47) % 3) + "s");
    nyb.after(sp);
  });
  let probed = false;   // 只有已通關才去找新年圖(圖還沒生成時,平常不會出現 404)
  const probeNY = () => { if (probed) return; probed = true; const probe = new Image(); probe.onload = () => { nyReady = true; crewSync(); }; probe.src = NY + ".png"; };
  const crewSync = () => {
    const cleared = !!(window.MemoryGallery && MemoryGallery.isCleared());
    if (cleared) probeNY();
    const ny = cleared && nyReady;
    if (home.classList.contains("hv4-ny") !== ny) home.classList.toggle("hv4-ny", ny);   // 只在需要時改 class,避免觸發下面的 MutationObserver 無限循環
    crew.hidden = !cleared || ny;
  };
  crewSync();
  if (window.MemoryGallery) MemoryGallery.onChange(crewSync);
  new MutationObserver(crewSync).observe(home, { attributes: true, attributeFilter: ["class"] });
})();

/* A10(2026-11-18 晚):角色名字輸入框加「隨機取名」按鈕(只填入名字,照原本輸入流程觸發 input 事件) */
(function () {
  const inp = document.getElementById("player-name"); if (!inp) return;
  const NAMES = ["阿福", "金水", "阿土", "志明", "阿德", "阿財", "大同", "阿雄", "建國", "阿輝", "文雄", "添丁"];   // 角色全為男性
  const b = document.createElement("button"); b.type = "button"; b.className = "hv4-randname"; b.textContent = "🎲 隨機取名";
  b.addEventListener("click", () => {
    let n; do { n = NAMES[Math.floor(Math.random() * NAMES.length)]; } while (n === inp.value && NAMES.length > 1);
    inp.value = n; inp.dispatchEvent(new Event("input", { bubbles: true })); inp.focus();
  });
  (inp.closest("label") || inp).after(b);
})();
