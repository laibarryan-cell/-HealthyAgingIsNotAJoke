/* ending-v3.js — 第三修改計劃新增內容3-10 片尾向量動畫草稿(2026-11-17 第二版)
   使用者:片尾要符合遊戲內容和故事劇本,春聯只是最後的彩蛋。
   依 Google 文件「故事劇本」3.結局(新版):
     (遊戲裡)房間七 六段記憶回顧 → 旅程分析 → 按離開 → 這裡開始
     01 主角:嗯等等,好像哪裡不太對勁,我想想……
     02 圖1 鏡子:主角看著鏡子裡的老人,沒意識到是自己(欸這是我嗎…/我已經老成這樣了嗎…/可是我記得我剛滿18歲阿…)
     03 圖2 回憶:主角躺在有滾輪的病床上揮動手腳,三位老人推著他往診療間趕,旁人指指點點(原來那時候耳朵也不好…/他們是在喚醒我,只是周圍太吵我沒聽清楚…)
     04 圖3 回憶:主角躺在床上睜眼,圓形大燈下三位老人(有顏色的)手上拿的是毛巾不是手術刀(啊…我好像眼睛有問題,所以看錯了…)
     05 主角:但我還是有點不信,我要問媽祖 → 主角:我先喚回我平常的穿著再去
     06 廟裡抽籤(籤筒,不是塔羅)→ 主角:蝦米?我沒有穿越?媽祖沒有同意這件事嗎? → 我真的是老了搞不清楚欸! → 過年後我真的要去看醫生好好保養自己的身體了
     07 大年初一清晨,三老(優雅老/躺平老/鯊BEE)從莊園跑出來,說出那天的真相、約好年後陪看醫生 → 大家一起說新年快樂
     08 彩蛋:春聯(柏茂安康迎暖歲/萱繁芝馥啟長旅)+ 橫批「鏘鏘鏘鏘」一字一聲 → 重新開始/返回首頁
   台詞照劇本原文;籤詩劇本寫「到時候掰」,這裡先放草稿(SIGN),待使用者審閱。
   2026-11-18 接入 ART-N3-10~15 像素定稿:大廳(想事情/鏡子/換裝)、大門打開、新年莊園(天亮漸變)、三老跑步/歡呼序列圖、空白橫批;
   結尾的玩家改用遊戲行走動畫(MapWalker.drawPose,跟著裝扮台造型)。回憶段(病床)與廟裡仍是向量草稿。
   每句台詞自動往下播,點一下畫面可提早下一句;右上「跳過」或 Esc 直接到最後。 */
(function () {
  "use strict";
  const $ = s => document.querySelector(s);
  const seq = $("#ending-sequence");
  if (!seq || typeof startEndingSequence !== "function" || !window.VectorCast) return;
  if (!window.startEndingSequenceV1) window.startEndingSequenceV1 = startEndingSequence;
  const VC = window.VectorCast, INK = VC.INK, fig = VC.figure;

  const COUPLET_L = [...document.querySelectorAll(".ending-couplet-left span")].map(s => s.textContent).join("") || "柏茂安康迎暖歲";
  const COUPLET_R = [...document.querySelectorAll(".ending-couplet-right span")].map(s => s.textContent).join("") || "萱繁芝馥啟長旅";
  const BANNER = (typeof ENDING_BANNER_TEXT === "string" && ENDING_BANNER_TEXT) || "鏘鏘鏘鏘";
  const PITCH = (typeof ENDING_BEAT_PITCH !== "undefined" && ENDING_BEAT_PITCH) || [880, 1175, 1175, 740];
  /* 籤詩:劇本寫「隨便找6個籤詩或者到時候掰」→ 草稿,待審閱 */
  const SIGN = { no: "第七籤", text: ["莫問穿越何處去", "鏡中白髮是自身", "年後記得看醫生", "保養身心福壽長"] };

  const SFX = n => { try { window.SoundKit && SoundKit.sfx(n); } catch (e) { } }, BGM = n => { try { window.SoundKit && SoundKit.music(n); } catch (e) { } };
  let look = null, root = null, token = 0, timers = [];
  const name = () => (typeof state !== "undefined" && state.name) || "冒險家";
  const stopTimers = () => timers.splice(0).forEach(clearTimeout);
  const later = (ms, fn) => timers.push(setTimeout(fn, ms));

  /* ---------- 共用畫面元件 ---------- */
  const A3 = "assets/ending/v3/";
  const hallImg = () => `<image href="${A3}ending-v3-hall.png" x="0" y="0" width="1600" height="900" preserveAspectRatio="xMidYMid slice"/>`;
  const svg = (inner, cls = "") => `<svg class="ev3-bg ${cls}" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">${VC.DEFS}${inner}</svg>`;
  const place = (x, y, s, inner) => `<g transform="translate(${x},${y}) scale(${s})">${inner}</g>`;
  const hallWall = () => `<rect width="1600" height="900" fill="#2c2018"/>${Array.from({ length: 9 }, (_, i) => `<rect x="${i * 180 - 20}" y="0" width="12" height="700" fill="#241a13"/>`).join("")}
    <rect y="700" width="1600" height="200" fill="#5a3a22"/>${Array.from({ length: 12 }, (_, i) => `<rect x="${i * 140}" y="700" width="4" height="200" fill="#4a2e1a"/>`).join("")}
    ${[300, 1300].map(x => `<circle class="vc-glow" cx="${x}" cy="300" r="130" fill="url(#vcLampGlow)"/><rect x="${x - 18}" y="270" width="36" height="56" rx="8" fill="#ffd98a" stroke="${INK}" stroke-width="5"/>`).join("")}`;
  const door = `<path d="M620 700 V310 Q800 160 980 310 V700Z" fill="#6b4424" stroke="${INK}" stroke-width="10"/><path d="M800 240 V700" stroke="${INK}" stroke-width="8"/><circle cx="780" cy="520" r="10" fill="#f0c25a"/><circle cx="820" cy="520" r="10" fill="#f0c25a"/>`;
  const qmarks = `${[[0, 0], [70, -40], [-50, -60]].map(([x, y], i) => `<text class="vc-float" style="animation-delay:${i * .7}s" x="${x}" y="${y}" font-size="70" font-weight="900" fill="#ffd877" stroke="${INK}" stroke-width="3" font-family="sans-serif">?</text>`).join("")}`;
  const sparkle = (cx, cy) => Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2, r = 120 + (i % 3) * 40; return `<path class="vc-float" style="animation-delay:${(i * .23).toFixed(2)}s" transform="translate(${(cx + Math.cos(a) * r).toFixed(0)},${(cy + Math.sin(a) * r * .9).toFixed(0)})" d="M0 -18 L5 -5 L18 0 L5 5 L0 18 L-5 5 L-18 0 L-5 -5Z" fill="#fff3a0" stroke="${INK}" stroke-width="2"/>`; }).join("");
  const bed = (w = 420) => `<rect x="${-w / 2}" y="-70" width="${w}" height="34" rx="10" fill="#e9eef3" stroke="${INK}" stroke-width="6"/><rect x="${-w / 2 + 6}" y="-100" width="${w - 12}" height="34" rx="14" fill="#9fc3e0" stroke="${INK}" stroke-width="5"/>
    <rect x="${-w / 2 - 10}" y="-130" width="20" height="100" rx="6" fill="#b8c2cc" stroke="${INK}" stroke-width="5"/><rect x="${w / 2 - 10}" y="-110" width="20" height="80" rx="6" fill="#b8c2cc" stroke="${INK}" stroke-width="5"/>
    <path d="M${-w / 2 + 30} -36 V-14 M${w / 2 - 30} -36 V-14" stroke="${INK}" stroke-width="8"/><circle cx="${-w / 2 + 30}" cy="-8" r="12" fill="#444" stroke="${INK}" stroke-width="4"/><circle cx="${w / 2 - 30}" cy="-8" r="12" fill="#444" stroke="${INK}" stroke-width="4"/>`;
  /* 躺著的主角:頭朝左、臉朝上 */
  const lying = (opts) => `<g transform="translate(150,-104) rotate(-90)">${fig("player", Object.assign({ look }, opts))}</g>`;
  const crowd = (x, y, s, text, f) => place(x, y, s, `<g style="filter:brightness(0) opacity(.75)">${fig("npc2", { facing: f, arm: "point", armCls: "vc-point" })}</g>`) + (text ? VC.bubble(x, y - 470 * s, 360, text, f > 0 ? 1 : -1) : "");

  const SCENES = {
    /* 01 旅程分析之後:主角在大廳想事情 */
    think: () => svg(hallImg() + place(560, 800, 1.35, fig("player", { look, arm: "ear", cls: "vc-talk" })) + `<g transform="translate(700,330)">${qmarks}</g>`),
    /* 02 圖1:鏡子裡的老人(只秀臉) */
    mirror: () => svg(hallImg() +
      `<defs><clipPath id="ev3Mirror"><ellipse cx="1080" cy="390" rx="210" ry="270"/></clipPath></defs>
       <ellipse cx="1080" cy="390" rx="232" ry="292" fill="#b88a3a" stroke="${INK}" stroke-width="8"/><ellipse cx="1080" cy="390" rx="210" ry="270" fill="#cfe1ea"/>
       <g clip-path="url(#ev3Mirror)"><g transform="translate(1080,1020) scale(-2.6,2.6)">${fig("player", { look })}</g><path d="M900 160 L1000 120 L940 260Z" fill="#fff" opacity=".35"/></g>
       <rect x="1040" y="680" width="80" height="30" fill="#6b4424" stroke="${INK}" stroke-width="5"/>` +
      place(520, 820, 1.4, fig("player", { look, arm: "ear", cls: "vc-talk" }))),
    /* 03 圖2(回憶):病床上揮動手腳,三位老人推著往診療間趕,旁人指指點點;周圍很吵 */
    bed1: () => svg(`<rect width="1600" height="900" fill="#d9e6dc"/><rect y="600" width="1600" height="300" fill="#b9c6bc"/>
      <rect x="1290" y="150" width="240" height="450" fill="#8fb3a0" stroke="${INK}" stroke-width="8"/><rect x="1310" y="100" width="200" height="50" rx="8" fill="#fffaf0" stroke="${INK}" stroke-width="5"/>
      <text x="1410" y="137" text-anchor="middle" font-size="34" font-weight="900" fill="#14294a" font-family="Noto Sans TC,Microsoft JhengHei,sans-serif">診療間</text>` +
      crowd(120, 640, .8, "", 1) + crowd(1180, 600, .7, "", -1) + VC.bubble(330, 270, 400, "躺在床上瞎折騰啥?", 1) +
      `<g class="ev3-rush">${place(960, 560, .85, fig("npc3", { pose: "walk", facing: 1, arm: "offer" }))}
       <g transform="translate(740,640) scale(1.3)">${bed()}${lying({ arm: "up", armL: "up", armCls: "vc-flail", armLCls: "vc-flail" })}</g>
       ${place(420, 680, .95, fig("npc1", { pose: "walk", facing: 1, arm: "offer" }))}${place(1080, 690, .95, fig("npc2", { pose: "walk", facing: 1, arm: "point", armCls: "vc-point" }))}</g>
      ${[[620, 190, "嗡嗡嗡"], [980, 150, "吵吵吵"], [780, 300, "叭叭!"]].map(([x, y, t], i) => `<text class="vc-pulse" style="transform-origin:${x}px ${y}px;animation-delay:${i * .3}s;paint-order:stroke" x="${x}" y="${y}" text-anchor="middle" font-size="60" font-weight="900" fill="#c0392b" stroke="#fff" stroke-width="8" stroke-linejoin="round" font-family="Noto Sans TC,Microsoft JhengHei,sans-serif">${t}</text>`).join("")}`, "ev3-memory"),
    /* 04 圖3(回憶):圓形大燈下睜眼,三位老人手上其實是毛巾 */
    bed2: () => svg(`<rect width="1600" height="900" fill="#cfd8de"/><rect y="640" width="1600" height="260" fill="#aab6bf"/>
      <circle class="vc-glow" cx="800" cy="110" r="320" fill="url(#vcLampGlow)"/><ellipse cx="800" cy="90" rx="190" ry="70" fill="#fffbe6" stroke="${INK}" stroke-width="8"/><ellipse cx="800" cy="90" rx="120" ry="40" fill="#fff" opacity=".9"/><path d="M800 0 V24" stroke="${INK}" stroke-width="10"/>
      ${place(520, 590, .9, fig("npc1", { facing: 1, arm: "offer", prop: "towel", armCls: "vc-offer" }))}${place(800, 560, .85, fig("npc2", { arm: "offer", prop: "towel", armCls: "vc-offer" }))}${place(1080, 590, .9, fig("npc3", { facing: -1, arm: "offer", prop: "towel", armCls: "vc-offer" }))}
      <g transform="translate(800,690) scale(1.3)">${bed(520)}${lying({ arm: "down" })}</g>`, "ev3-memory"),
    /* 05 不信 → 先喚回平常的穿著 */
    dress: () => svg(hallImg() + place(800, 800, 1.4, fig("player", { look, arm: "wave", armCls: "vc-wave" })) + sparkle(800, 520)),
    /* 06 廟裡抽籤(籤筒) */
    temple: () => svg(`<rect width="1600" height="900" fill="#5a1a14"/><rect y="690" width="1600" height="210" fill="#7a4a2a"/>
      ${[160, 1440].map(x => `<rect x="${x - 40}" y="0" width="80" height="700" fill="#b3201f" stroke="${INK}" stroke-width="6"/>`).join("")}
      <rect x="520" y="60" width="560" height="90" rx="10" fill="#1f1a14" stroke="#f0c25a" stroke-width="8"/>
      <text x="800" y="125" text-anchor="middle" font-size="54" font-weight="900" fill="#f0c25a" font-family="DFKai-SB,BiauKai,標楷體,Kaiti TC,KaiTi,serif">天上聖母</text>
      <path d="M560 200 H1040 V420 H560Z" fill="#3a120e" stroke="#f0c25a" stroke-width="6"/><circle class="vc-glow" cx="800" cy="310" r="140" fill="url(#vcLampGlow)"/><path d="M760 400 Q800 220 840 400Z" fill="#d9a83e" opacity=".55"/>
      <rect x="480" y="440" width="640" height="60" rx="8" fill="#a8741f" stroke="${INK}" stroke-width="6"/><rect x="520" y="500" width="560" height="190" fill="#c0392b" stroke="${INK}" stroke-width="6"/>
      <ellipse cx="800" cy="430" rx="70" ry="20" fill="#7a5418" stroke="${INK}" stroke-width="5"/>${VC.steam(790, 400)}
      ${[380, 1220].map(x => `<ellipse cx="${x}" cy="220" rx="44" ry="40" fill="#d7262e" stroke="${INK}" stroke-width="5"/><rect x="${x - 20}" y="174" width="40" height="10" fill="#f0c25a"/>`).join("")}` +
      place(800, 840, 1.25, fig("player", { look, arm: "offer", armL: "offer", prop: "qian", armCls: "vc-shake", armLCls: "vc-shake", cls: "ev3-shaker" }))),
    /* 06.5 走到大門前,大門向內打開、金光湧入(ART-N3-10/11) */
    gate: () => `<img class="ev3-bg ev3-img" src="${A3}ending-v3-hall.png" alt=""><div class="ev3-doorlight"></div><img class="ev3-leaf3 ev3-leafL3" src="${A3}ending-v3-door-left.png" alt=""><img class="ev3-leaf3 ev3-leafR3" src="${A3}ending-v3-door-right.png" alt="">`,
    /* 07 屋外(大年初一,天亮前 → 天亮)(ART-N3-12) */
    outside: () => `<img class="ev3-bg ev3-img" src="${A3}ending-v3-newyear.png" alt=""><div class="ev3-dawn"></div>`
  };

  /* 台詞:who = "me"(主角,名字用玩家名字)| "crowd" | null(旁白) */
  const STORY = [
    { scene: "think", lines: [["me", "嗯等等,好像哪裡不太對勁,我想想……"]] },
    { scene: "mirror", lines: [["me", "欸這是我嗎……?"], ["me", "我已經老成這樣了嗎……?"], ["me", "可是我記得我剛滿18歲阿……"]] },
    { scene: "bed1", lines: [["me", "阿……原來那時候耳朵也不好……"], ["me", "他們是在喚醒我,只是周圍太吵我沒聽清楚……"]] },
    { scene: "bed2", lines: [["me", "啊……我好像眼睛有問題,所以看錯了……"]] },
    { scene: "dress", lines: [["me", "但我還是有點不信,我要問媽祖。"], ["me", "我先喚回我平常的穿著再去!"]] },
    { scene: "temple", sign: true, lines: [["me", "蝦米?我沒有穿越?媽祖沒有同意這件事嗎?"], ["me", "我真的是老了搞不清楚欸!"], ["me", "過年後我真的要去看醫生,好好保養自己的身體了。"]] }
  ];

  /* 三老(名字用劇本的):n1 = 優雅老(格紋西裝)、n2 = 躺平老(圓眼鏡)、n3 = 鯊BEE(鯊魚帽)
     依劇本:三老就是片頭推病床的「三個黑衣人」,其實是主角的朋友(心情、營養房「回憶起三老是朋友」);
     主角是在浴室滑倒、亂穿鞋不扶牆才被送醫(行動房)。台詞為 Claude 草稿,待使用者/朋友審閱。 */
  const ELDER = { n1: { who: "npc1", name: "優雅老" }, n2: { who: "npc2", name: "躺平老" }, n3: { who: "npc3", name: "鯊BEE" } };
  const known = new Set();
  const MEET = [
    ["n3", "找到你了!一大早的,你跑去哪啦?"],
    ["n2", "你啊,那天穿錯鞋又不扶牆,在浴室滑了一大跤,是我們三個推你去急診的。"],
    ["n3", "你在病床上手腳一直揮,我們還以為你在跳廣場舞咧!"],
    ["n1", "我們拿熱毛巾要幫你擦臉,你卻大喊我們要把你拆了……¯\\_(ツ)_/¯"],
    ["me", "原來你們不是黑衣人……是一直陪在我身邊的老朋友。"],
    ["n1", "眼睛、耳朵、走路、吃飯、記性、心情,都要好好照顧。過完年,我們陪你去看醫生。"],
    ["n3", "還有啊,那 11 萬就不用賠了,請我們吃一頓年夜飯就好!"],
    ["me", "好!謝謝你們。"],
    ["n2", "好啦好啦,你們看——天亮了。"]
  ];

  /* ---------- 播放引擎 ---------- */
  function build() {
    root && root.remove();
    look = VC.playerLook(); known.clear();
    root = document.createElement("div"); root.className = "ev3"; root.setAttribute("aria-live", "polite");
    const col = (txt, side) => `<div class="ev3-couplet ev3-c${side}"><div class="ev3-paper">${[...txt].map((ch, i) => `<span style="--i:${i}">${ch}</span>`).join("")}</div></div>`;
    root.innerHTML = `<svg width="0" height="0" style="position:absolute">${VC.STYLE}</svg><div class="ev3-frame">
      ${Object.keys(SCENES).map(k => `<section class="ev3-scene" data-s="${k}">${SCENES[k]()}</section>`).join("")}
      <div class="ev3-memory-tag">回憶</div>
      <div class="ev3-sign"><small>${SIGN.no}</small>${SIGN.text.map(t => `<span>${t}</span>`).join("")}</div>
      <div class="ev3-actors"></div>
      <div class="ev3-firecracker ev3-fl"></div><div class="ev3-firecracker ev3-fr"></div>
      <div class="ev3-confetti"></div>
      ${col(COUPLET_L, "l")}${col(COUPLET_R, "r")}
      <div class="ev3-banner">${[...BANNER].map(ch => `<span>${ch}</span>`).join("")}</div>
      <div class="ev3-title"><strong>新年快樂</strong><span>謝謝遊玩・記憶之家</span></div>
      <div class="ev3-flash"></div>
      <div class="ev3-talk"><b class="ev3-who"></b><p class="ev3-line"></p><i>▼ 點一下繼續</i></div></div>`;
    seq.insertBefore(root, seq.firstChild);
    /* 2026-11-18 ART-N4-02~07:片尾劇情改成首頁老人的像素圖(A/B 兩格交替 = 動作)。圖到了就自動換掉向量草稿 */
    const RASTER = { think: "think", mirror: "mirror", bed1: "hospital", bed2: "surgery", dress: "dress", temple: "temple" };
    Object.entries(RASTER).forEach(([k, f]) => {
      const a = `${A3}ending-v3-${f}-a.png`, b = `${A3}ending-v3-${f}-b.png`, img = new Image();
      img.onload = () => { const sec = root && root.querySelector(`.ev3-scene[data-s="${k}"]`); if (sec) { sec.innerHTML = `<img class="ev3-bg ev3-img" src="${a}" alt=""><img class="ev3-bg ev3-img ev3-frameb" src="${b}" alt="" onerror="this.remove()">`; sec.classList.add("ev3-raster"); } };
      img.src = a;
    });
    root.addEventListener("click", e => { if (!e.target.closest("button")) advance(); });
  }
  let advance = () => {};
  const sleep = (ms, my) => new Promise((res, rej) => { const t = setTimeout(() => { advance = () => {}; my === token ? res() : rej(0); }, ms); timers.push(t); advance = () => { clearTimeout(t); advance = () => {}; my === token ? res() : rej(0); }; });
  const pause = (ms, my) => new Promise((res, rej) => later(ms, () => my === token ? res() : rej(0)));
  function scene(k) { root.querySelectorAll(".ev3-scene").forEach(s => s.classList.toggle("on", s.dataset.s === k)); root.classList.toggle("ev3-in-memory", k === "bed1" || k === "bed2"); }
  function talk(who, text) {
    const box = root.querySelector(".ev3-talk");
    if (!text) { box.classList.remove("on"); return; }
    box.querySelector(".ev3-who").textContent = who === "me" ? name() : who === "crowd" ? "旁人" : ELDER[who] ? ELDER[who].name : "";
    root.querySelectorAll(".ev3-actor").forEach(a => a.classList.toggle("ev3-speaking", a.dataset.actor === who || (who === "me" && a.dataset.actor === "p") || (who === "all" && true)));
    box.querySelector(".ev3-who").hidden = !who;
    box.querySelector(".ev3-line").textContent = text;
    try { window.SoundKit && SoundKit.speak(who === "me" ? "player" : ELDER[who] ? ELDER[who].who : "other", text); } catch (e) { }
    /* 2026-11-20 不再每句「移除 on → 重排 → 加回 on」(那會讓整個對話框每句都消失再淡入 = 一閃一閃);
       框已經在畫面上時只讓文字淡入,框本身不動 */
    if (!box.classList.contains("on")) box.classList.add("on");
    else { const l = box.querySelector(".ev3-line"); l.classList.remove("ev3-fade"); void l.offsetWidth; l.classList.add("ev3-fade"); }
  }
  async function flash(my) { SFX("flash"); root.classList.add("ev3-flashing"); await pause(380, my); root.classList.remove("ev3-flashing"); }

  /* 結尾:三人跑出來迎新年 + 春聯彩蛋 */
  function actor(id, who, opts) {
    let el = root.querySelector(`[data-actor="${id}"]`);
    if (!el) { el = document.createElement("div"); el.className = "ev3-actor"; el.dataset.actor = id; root.querySelector(".ev3-actors").append(el); }
    el.innerHTML = `<svg viewBox="-130 -400 260 410" class="ev3-fig">${fig(who, Object.assign({ look }, opts))}</svg>`;
    return el;
  }
  /* 像素角色:三老 = 序列圖(跑步 6 格、歡呼 4 格,每格 256,腳底第 234 列);玩家 = 遊戲行走動畫(256 格,腳底第 240 列)。
     k = 讓身高與向量角色一致的放大倍率,f = 圖格下方留白比例(腳要踩在 bottom 上) */
  const ELDER_N = { n1: 1, n2: 2, n3: 3 };
  function holder(id, cls, k, f, html) {
    let el = root.querySelector(`[data-actor="${id}"]`);
    if (!el || !el.classList.contains(cls)) { el && el.remove(); el = document.createElement("div"); el.className = "ev3-actor " + cls; el.dataset.actor = id; el.dataset.k = k; el.dataset.f = f; el.innerHTML = html; root.querySelector(".ev3-actors").append(el); }
    return el;
  }
  function elder(id, mode, facing) {
    const el = holder(id, "ev3-sp", 1.24, .086, "<i></i>"), i = el.querySelector("i");
    i.className = "ev3-sp-" + mode; i.style.backgroundImage = `url("${A3}ending-v3-elder${ELDER_N[id]}-${mode === "run" ? "run" : "cheer"}.png")`;
    i.style.transform = mode === "run" && facing < 0 ? "scaleX(-1)" : "";
    return el;
  }
  /* 2026-11-18 使用者:走向大門 = 首頁那位老人(背影);最後走出莊園 = 裝扮台畫風的玩家角色(CharacterRenderer,跟著玩家造型) */
  function me(dir, walking) {
    let el;
    if (dir === "up") el = holder("p", "ev3-back", .976, 0, '<img src="assets/ending/ending-elder-back-clean.png" alt="">');
    else {
      el = holder("p", "ev3-doll", 1.0, .0746, '<canvas width="364" height="362"></canvas>');
      if (!el._drawn) { el._drawn = true; try {
        const st = typeof state !== "undefined" ? state : {}, pal = typeof palettes !== "undefined" ? palettes : { hair: [], outfit: [] };
        CharacterRenderer.render(el.querySelector("canvas"), { body: ["slim", "round", "strong"][st.base || 0], hair: (st.hair || 0) + 1, outfit: st.outfit || 0, acc: ["none", "glasses", "hat", "scarf"][st.accessory || 0],
          hairTint: st.hairColor ? pal.hair[st.hairColor] : null, outfitTint: st.outfitColor ? pal.outfit[st.outfitColor] : null });
      } catch (e) { } }
    }
    el.classList.toggle("ev3-walking", !!walking);
    return el;
  }
  function move(el, left, bottom, h, ms) { const k = +el.dataset.k || 1, f = +el.dataset.f || 0, H = h * k; el.style.transitionDuration = (ms || 0) + "ms"; el.style.left = left + "%"; el.style.bottom = (bottom - H * f) + "%"; el.style.height = H + "%"; }
  const next = fn => requestAnimationFrame(() => requestAnimationFrame(fn));
  function jumpAll() { root.querySelectorAll(".ev3-actor").forEach(a => { a.classList.remove("ev3-jump"); void a.offsetWidth; a.classList.add("ev3-jump"); }); }
  function confetti() {
    const c = root.querySelector(".ev3-confetti"); c.innerHTML = "";
    for (let i = 0; i < 46; i++) { const b = document.createElement("b"); b.style.left = (Math.random() * 100).toFixed(1) + "%"; b.style.animationDelay = (Math.random() * 2.4).toFixed(2) + "s"; b.style.animationDuration = (3 + Math.random() * 2.5).toFixed(2) + "s"; b.style.background = ["#d7262e", "#f0c25a", "#ff7b5a", "#ffd877"][i % 4]; c.append(b); }
    c.classList.add("on");
  }
  const cheer = id => id === "p" ? me("down", false) : elder(id, "cheer");
  function finalPose() {
    scene("outside"); talk(""); root.classList.remove("ev3-night"); Object.keys(ELDER).forEach(k => known.add(k));
    root.querySelector(".ev3-sign").classList.remove("on");
    root.classList.add("ev3-dawned");
    move(cheer("p"), 40, 6, 46); move(cheer("n1"), 20, 6, 44); move(cheer("n2"), 60, 6, 44); move(cheer("n3"), 80, 6, 46);
    root.querySelectorAll(".ev3-couplet").forEach(c => c.classList.add("on", "full"));
    root.querySelector(".ev3-banner").classList.add("on"); root.querySelectorAll(".ev3-banner span").forEach(s => s.classList.add("on"));
    root.querySelector(".ev3-title").classList.add("on"); root.querySelectorAll(".ev3-firecracker").forEach(f => f.classList.add("on"));
  }
  function done() { try { window.MemoryGallery && MemoryGallery.markCleared(); } catch (e) { } seq.classList.add("done"); setTimeout(() => $("#restart-game")?.focus(), 50); }

  async function run(my) {
    for (const beat of STORY) {
      scene(beat.scene);
      if (beat.scene === "bed1" || beat.scene === "dress") await flash(my);
      await pause(700, my);
      for (let i = 0; i < beat.lines.length; i++) {
        const [who, text] = beat.lines[i];
        if (beat.sign && i === 0) { talk(""); SFX("shake"); await pause(1600, my); SFX("page"); root.querySelector(".ev3-sign").classList.add("on"); await pause(2600, my); }
        talk(who, text);
        await sleep(2200 + text.length * 110, my);
      }
      talk("");
      root.querySelector(".ev3-sign").classList.remove("on");
    }
    /* 07 大年初一清晨:三老從莊園跑出來找主角,說出那天的真相 → 約好年後看醫生 */
    /* 06.5 走到大廳的大門前,大門打開、金光湧入 */
    await flash(my); scene("gate");
    const G = me("up", true); move(G, 50, -4, 50); next(() => move(G, 50, 17, 30, 2400));
    SFX("step"); await pause(2500, my); me("up", false);
    SFX("door"); root.classList.add("ev3-open"); await pause(1900, my);
    /* 大年初一(天還沒亮):主角從莊園大門走出來,三老跑出來 → 說完真相才天亮 */
    await flash(my); scene("outside");
    const P = me("down", true); move(P, 50, 20, 14); next(() => move(P, 40, 6, 46, 2000));
    await pause(2100, my); me("down", false);
    SFX("run");
    const A = elder("n1", "run", 1); move(A, -12, 6, 44); next(() => move(A, 20, 6, 44, 1700));
    const C = elder("n3", "run", -1); move(C, 112, 6, 46); next(() => move(C, 80, 6, 46, 1700));
    const B = elder("n2", "run", 1); move(B, -26, 6, 44); next(() => move(B, 60, 6, 44, 1900));   /* 使用者:躺平老改從左邊、與優雅老一起跑出來 */
    await pause(2100, my);
    ["n1", "n2", "n3"].forEach(id => elder(id, "talk"));
    for (const [who, text] of MEET) {
      if (/天亮/.test(text)) root.classList.add("ev3-dawned");
      talk(who, text);
      await sleep(2000 + text.length * 100, my);
    }
    talk("");
    /* 天亮 → 大年初一:這時才一起說新年快樂 */
    ["p", "n1", "n2", "n3"].forEach(cheer);
    await pause(400, my);
    ["p", "n1", "n2", "n3"].forEach(id => { const b = document.createElement("span"); b.className = "ev3-say"; b.textContent = "新年快樂!"; root.querySelector(`[data-actor="${id}"]`).append(b); });
    BGM("newyear"); SFX("firecracker");
    root.querySelectorAll(".ev3-firecracker").forEach(f => f.classList.add("on")); confetti(); jumpAll();
    if (typeof endingClang === "function") endingClang(660);
    await pause(3000, my);
    root.querySelectorAll(".ev3-say").forEach(b => b.remove());
    /* 08 彩蛋:春聯 + 橫批鏘鏘鏘鏘 */
    SFX("unroll"); root.querySelector(".ev3-cl").classList.add("on"); await pause(800, my);
    SFX("unroll"); root.querySelector(".ev3-cr").classList.add("on"); await pause(4400, my);
    root.querySelector(".ev3-banner").classList.add("on"); await pause(900, my);
    for (let i = 0; i < 4; i++) { root.querySelectorAll(".ev3-banner span")[i]?.classList.add("on"); jumpAll(); if (typeof endingClang === "function") endingClang(PITCH[i]); await pause(600, my); }
    await pause(800, my);
    root.querySelector(".ev3-title").classList.add("on"); SFX("sparkle");
    await pause(2600, my);
    done();
  }
  function play() {
    stopTimers(); const my = ++token;
    try { if (typeof clearEnding === "function") clearEnding(); } catch (e) {}
    $("#finish-name").textContent = name();
    seq.classList.remove("done", "ev2-mode"); seq.classList.add("ev3-mode");
    void seq.offsetWidth; seq.classList.remove("ending-instant");
    showScreen("finish");
    if (window.SoundKit) SoundKit.cinematicMusic("ending");
    BGM("ending");
    build();
    run(my).catch(() => {});
  }
  function skip() {
    if (!$("#screen-finish")?.classList.contains("active") || seq.classList.contains("done")) return;
    token++; stopTimers(); advance = () => {};
    if (!root) build();
    finalPose(); done(); BGM("newyear");
  }
  startEndingSequence = play;
  const skipBtn = $("#ending-skip"); if (skipBtn) skipBtn.onclick = e => { e.stopPropagation(); skip(); };
  document.addEventListener("keydown", e => {
    if (!seq.classList.contains("ev3-mode") || $("#app-dialog")?.open) return;
    if (e.key === "Escape") { e.stopImmediatePropagation(); skip(); }
    else if ((e.key === "Enter" || e.key === " ") && !seq.classList.contains("done")) { e.preventDefault(); advance(); }
  }, true);
  if (new URLSearchParams(location.search).get("ending") === "1") setTimeout(play, 0);
  new MutationObserver(() => { if (!$("#screen-finish").classList.contains("active")) { token++; stopTimers(); root && root.remove(); root = null; seq.classList.remove("ev3-mode"); } })
    .observe($("#screen-finish"), { attributes: true, attributeFilter: ["class"] });
})();
