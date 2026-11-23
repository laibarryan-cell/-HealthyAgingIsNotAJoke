/* prologue-scenes.js — 開場與第 22 幕的「向量場景」。2026-11-20 開場重做 v2 新增。
   ─ 兩個場景,各自分層(遠 → 近),每層一張 1600×900 的 SVG,層的 data-d = 視差深度(鏡頭移動時越近的層移動越多):
       gate 莊園大門外(夜):sky 天空月亮 / far 宅邸與窗戶 / mid 石柱、鐵門、燈籠、小路、樹籬 / near 前景樹枝與霧
       hall 玄關大廳:back 牆、窗、肖像畫、落地鐘、樓梯、吊燈、壁燈 / floor 地板與紅地毯、月光 / near 前景柱子、塵埃
   ─ 可以控制的狀態 set({...}):
       gate:open(0~1 鐵門打開程度)、lamps(燈籠 0/1)、win(亮著的窗戶編號陣列)、glow(門後暖光 0~1)
       hall:chand(吊燈 0/1)、sconce([左,右] 壁燈 0/1)、eyes(肖像畫眼睛 ''/'look'/'glow')
   ─ 有圖用圖:ART[場景] 依「狀態」各一張完整背景圖(gate:dark 全暗/lit 燈籠與窗亮/open 門開;hall:dark 全暗/half 壁燈亮/lit 全亮),
     有填 dark 就改用圖(向量層全部隱藏,狀態切換變成交叉淡入);沒填就用向量。圖到了由 Claude 填路徑(見 33 號文件第 1 章)。
   介面:PrologueScenes.build(id) → { el, layers:[{el,d}], set(state), id } */
(function () {
  'use strict';
  const B = 'assets/prologue/bg/';
  const ART = { gate: { dark: B + 'gate-dark.png', lit: B + 'gate-lit.png', open: B + 'gate-open.png' }, hall: { dark: B + 'hall-dark.png', half: B + 'hall-half.png', lit: B + 'hall-lit.png' } };
  const svg = (inner, extra) => `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" ${extra || ''}>${inner}</svg>`;
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  /* ======================= 莊園大門外 ======================= */
  function gate() {
    seed = 11;
    let stars = ''; for (let i = 0; i < 70; i++) stars += `<circle cx="${(rnd() * 1600).toFixed(0)}" cy="${(rnd() * 420).toFixed(0)}" r="${(rnd() * 1.8 + .6).toFixed(1)}" class="ps-star" style="animation-delay:${(-rnd() * 4).toFixed(1)}s"/>`;
    const sky = svg(`<defs><linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070b1d"/><stop offset=".55" stop-color="#18203f"/><stop offset="1" stop-color="#2d2d4b"/></linearGradient>
        <radialGradient id="gMoon"><stop offset="0" stop-color="#fffbe0" stop-opacity=".55"/><stop offset="1" stop-color="#fffbe0" stop-opacity="0"/></radialGradient></defs>
      <rect width="1600" height="900" fill="url(#gSky)"/>${stars}
      <circle cx="1230" cy="170" r="150" fill="url(#gMoon)"/><circle cx="1230" cy="170" r="54" fill="#f6f0cf"/><circle cx="1210" cy="158" r="10" fill="#e3dbb4"/><circle cx="1248" cy="188" r="7" fill="#e3dbb4"/>
      <g class="ps-cloud"><path d="M-200 250q60 -40 140 -10q50 -40 120 0q60 -10 80 30h-340z" fill="#3a3f62" opacity=".55"/><path d="M900 120q50 -30 110 -6q40 -30 100 0q50 -6 66 24h-276z" fill="#3a3f62" opacity=".45"/></g>`);
    let wins = '', n = 0;
    const W = (x, y, w, h) => { wins += `<g class="ps-win" data-i="${n++}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/><path d="M${x + w / 2} ${y}v${h}M${x} ${y + h / 2}h${w}" stroke="#141a30" stroke-width="3"/></g>`; };
    [560, 640, 720, 880, 960, 1040].forEach(x => { W(x - 18, 330, 36, 56); W(x - 18, 440, 36, 56); });
    W(782, 230, 36, 50); W(782, 330, 36, 56);
    const far = svg(`<path d="M0 560Q200 470 420 520T900 500T1600 540V900H0Z" fill="#141a30"/>
      <g fill="#10162a" stroke="#0a0e1c" stroke-width="4"><path d="M500 560V300L560 240L620 300H980L1040 240L1100 300V560Z"/><path d="M740 300V180L800 100L860 180V300Z"/>
        <path d="M800 100V60" stroke-width="5"/><rect x="600" y="210" width="26" height="60"/><rect x="972" y="210" width="26" height="60"/>
        <path d="M480 300H1120" stroke-width="8"/></g>
      ${wins}
      <path d="M760 560V478Q800 446 840 478V560Z" class="ps-door"/>
      <g fill="#0c1222"><path d="M0 600Q60 420 120 600Z"/><path d="M90 610Q170 380 250 610Z"/><path d="M1380 610Q1450 400 1520 610Z"/><path d="M1480 600Q1560 450 1640 600Z"/></g>`);
    const bars = (x0, x1) => { let b = ''; for (let x = x0 + 14; x < x1; x += 22) b += `<path d="M${x} 400V686"/><path d="M${x - 5} 404l5 -18l5 18z" fill="#1b1f2e"/>`; return b; };
    const mid = svg(`<defs><radialGradient id="gGlow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".75"/><stop offset="1" stop-color="#ffb24a" stop-opacity="0"/></radialGradient>
        <linearGradient id="gGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2236"/><stop offset="1" stop-color="#0d101c"/></linearGradient></defs>
      <rect y="600" width="1600" height="300" fill="url(#gGround)"/>
      <ellipse class="ps-gateglow" cx="800" cy="560" rx="330" ry="220" fill="url(#gGlow)"/>
      <path d="M640 690L960 690L1200 900L400 900Z" fill="#2a2d3e"/><g stroke="#1b1d2a" stroke-width="3" fill="none"><path d="M610 730H990M560 780H1040M500 840H1100"/><path d="M720 690L680 900M880 690L920 900M800 690V900"/></g>
      <path d="M0 610Q70 560 150 600Q230 556 320 600Q400 560 470 600L560 610V720H0Z" fill="#14261f" stroke="#0b1612" stroke-width="5"/>
      <path d="M1040 610Q1130 556 1210 600Q1290 560 1370 600Q1450 556 1530 600Q1580 590 1600 600V720H1040Z" fill="#14261f" stroke="#0b1612" stroke-width="5"/>
      <g class="ps-leaf ps-leafL" style="transform-origin:612px 540px"><g stroke="#1b1f2e" stroke-width="7" fill="none">${bars(612, 800)}<path d="M612 420H800M612 640H800M612 686H800"/><path d="M640 420Q706 360 772 420"/><circle cx="706" cy="530" r="34"/></g></g>
      <g class="ps-leaf ps-leafR" style="transform-origin:988px 540px"><g stroke="#1b1f2e" stroke-width="7" fill="none">${bars(800, 988)}<path d="M800 420H988M800 640H988M800 686H988"/><path d="M828 420Q894 360 960 420"/><circle cx="894" cy="530" r="34"/></g></g>
      ${[575, 1025].map(x => `<g><rect x="${x - 40}" y="340" width="80" height="360" fill="#3b3d4c" stroke="#191b26" stroke-width="6"/><rect x="${x - 50}" y="322" width="100" height="26" fill="#4a4c5c" stroke="#191b26" stroke-width="6"/>
        <path d="M${x - 40} 420H${x + 40}M${x - 40} 520H${x + 40}M${x - 40} 620H${x + 40}" stroke="#2c2e3a" stroke-width="4"/>
        <g class="ps-lamp"><circle class="ps-lampglow" cx="${x}" cy="280" r="90" fill="url(#gGlow)"/><path d="M${x - 18} 316h36l-6 -54h-24z" fill="#1d1f2a" stroke="#0d0e14" stroke-width="4"/><rect class="ps-lampfire" x="${x - 10}" y="270" width="20" height="38" rx="4"/><path d="M${x - 22} 262h44l-22 -22z" fill="#1d1f2a"/></g></g>`).join('')}`);
    let grass = ''; for (let i = 0; i < 40; i++) { const x = rnd() * 1600; grass += `<path d="M${x.toFixed(0)} 900q${(rnd() * 10 - 5).toFixed(0)} -${(30 + rnd() * 40).toFixed(0)} ${(rnd() * 16 - 8).toFixed(0)} -${(50 + rnd() * 40).toFixed(0)}"/>`; }
    const near = svg(`<g class="ps-fog"><ellipse cx="400" cy="720" rx="600" ry="60" fill="#8a90b8" opacity=".14"/><ellipse cx="1300" cy="760" rx="520" ry="50" fill="#8a90b8" opacity=".12"/></g>
      <g fill="#05070d"><path d="M-40 0H260Q200 40 230 70Q150 60 120 110Q90 90 40 150Q20 120 -40 180Z"/><path d="M1640 0H1330Q1390 30 1360 60Q1450 60 1480 100Q1520 80 1560 140Q1590 110 1640 160Z"/>
        <path d="M-40 900V560Q0 600 30 700Q50 820 90 900Z"/><path d="M1640 900V540Q1600 600 1580 720Q1560 830 1520 900Z"/></g>
      <g stroke="#05070d" stroke-width="4" fill="none">${grass}</g>`);
    return [['sky', .2, sky], ['far', .45, far], ['mid', .85, mid], ['near', 1.3, near]];
  }

  /* ======================= 玄關大廳 ======================= */
  function hall() {
    seed = 23;
    let damask = ''; for (let y = 40; y < 470; y += 70) for (let x = (y / 70) % 2 ? 35 : 0; x < 1600; x += 70) damask += `<path d="M${x} ${y - 9}l7 9l-7 9l-7 -9z"/>`;
    const portrait = (x, y, i) => `<g class="ps-portrait"><rect x="${x - 70}" y="${y - 90}" width="140" height="180" rx="6" fill="#2a1d14" stroke="#c9a14a" stroke-width="10"/>
        <rect x="${x - 56}" y="${y - 76}" width="112" height="152" fill="#1b1622"/><path d="M${x - 46} ${y + 76}Q${x - 44} ${y + 10} ${x} ${y + 6}Q${x + 44} ${y + 10} ${x + 46} ${y + 76}Z" fill="#2e2533"/>
        <circle cx="${x}" cy="${y - 20}" r="30" fill="#3a2f3c"/><path d="M${x - 30} ${y - 30}q30 -34 60 0" fill="#4a4250"/>
        <g class="ps-peye" data-i="${i}"><circle cx="${x - 11}" cy="${y - 20}" r="4.5" fill="#d8cfa8"/><circle cx="${x + 11}" cy="${y - 20}" r="4.5" fill="#d8cfa8"/>
        <circle class="ps-pupil" cx="${x - 11}" cy="${y - 20}" r="2.2" fill="#111"/><circle class="ps-pupil" cx="${x + 11}" cy="${y - 20}" r="2.2" fill="#111"/></g></g>`;
    const sconce = (x, i) => `<g class="ps-sconce" data-i="${i}"><circle class="ps-glow" cx="${x}" cy="300" r="140" fill="url(#hGlow)"/>
        <path d="M${x - 24} 350h48l-10 18h-28z" fill="#b8913d" stroke="#3a2a14" stroke-width="4"/><path d="M${x} 368v30" stroke="#b8913d" stroke-width="6"/>
        ${[-16, 0, 16].map(dx => `<rect x="${x + dx - 5}" y="${312 + (dx ? 8 : 0)}" width="10" height="${38 - (dx ? 8 : 0)}" fill="#f1e6cc" stroke="#3a2a14" stroke-width="2"/><path class="ps-flame" d="M${x + dx} ${300 + (dx ? 8 : 0)}q7 9 0 14q-7 -5 0 -14z"/>`).join('')}</g>`;
    let steps = ''; for (let k = 0; k < 9; k++) { const y = 600 - k * 27, w = 250 - k * 13; steps += `<rect x="${800 - w}" y="${y - 27}" width="${w * 2}" height="27" fill="${k % 2 ? '#4a2e22' : '#553427'}" stroke="#24150f" stroke-width="3"/><rect x="${800 - w * .55}" y="${y - 27}" width="${w * 1.1}" height="27" fill="#7a1f26" opacity=".9"/>`; }
    const back = svg(`<defs><radialGradient id="hGlow"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".6"/><stop offset="1" stop-color="#ffb04a" stop-opacity="0"/></radialGradient>
        <linearGradient id="hMoon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb6ff"/><stop offset="1" stop-color="#4c5a92"/></linearGradient></defs>
      <rect width="1600" height="620" fill="#3a262c"/><g fill="#4a3038">${damask}</g>
      <rect y="455" width="1600" height="165" fill="#2c1b17"/><path d="M0 455H1600M0 470H1600" stroke="#5b3a26" stroke-width="6"/>
      ${[80, 280, 1320, 1520].map(x => `<rect x="${x - 70}" y="490" width="140" height="100" fill="none" stroke="#45291d" stroke-width="5"/>`).join('')}
      ${[200, 1400].map(x => `<g><rect x="${x - 90}" y="90" width="180" height="350" rx="90" ry="90" fill="#151a33" stroke="#24150f" stroke-width="10"/>
        <rect x="${x - 76}" y="104" width="152" height="322" rx="76" fill="url(#hMoon)" opacity=".35"/><path d="M${x} 104V426M${x - 76} 230H${x + 76}M${x - 76} 330H${x + 76}" stroke="#24150f" stroke-width="7"/>
        <path d="M${x - 110} 70Q${x - 80} 260 ${x - 100} 460L${x - 60} 460Q${x - 70} 250 ${x - 50} 80Z" fill="#5c1820" stroke="#2a0b10" stroke-width="5"/>
        <path d="M${x + 110} 70Q${x + 80} 260 ${x + 100} 460L${x + 60} 460Q${x + 70} 250 ${x + 50} 80Z" fill="#5c1820" stroke="#2a0b10" stroke-width="5"/></g>`).join('')}
      ${portrait(440, 230, 0)}${portrait(1160, 230, 1)}
      <g><rect x="330" y="330" width="70" height="280" fill="#3a2418" stroke="#1d110b" stroke-width="5"/><path d="M322 330h86l-10 -40h-66z" fill="#4a2e1e" stroke="#1d110b" stroke-width="5"/>
        <circle cx="365" cy="370" r="25" fill="#e8dcc0" stroke="#1d110b" stroke-width="4"/><path d="M365 370v-15M365 370l10 6" stroke="#1d110b" stroke-width="3"/>
        <rect x="345" y="410" width="40" height="150" fill="#1d110b"/><g class="ps-pend" style="transform-origin:365px 412px"><path d="M365 412v100" stroke="#c9a14a" stroke-width="3"/><circle cx="365" cy="520" r="11" fill="#c9a14a"/></g></g>
      <rect x="560" y="120" width="480" height="260" rx="240" ry="200" fill="#0d0a12" stroke="#24150f" stroke-width="12"/>
      <path d="M690 380V220Q800 140 910 220V380Z" fill="#05040a"/>
      ${steps}
      <path d="M548 600L668 360M1052 600L932 360" stroke="#24150f" stroke-width="16"/><path d="M548 600L668 360M1052 600L932 360" stroke="#7a4a2c" stroke-width="9"/>
      ${[0, 1, 2, 3, 4, 5, 6].map(k => `<path d="M${560 + k * 16} ${585 - k * 34}v-46M${1040 - k * 16} ${585 - k * 34}v-46" stroke="#5b3a26" stroke-width="5"/>`).join('')}
      <path d="M530 556l40 -16v60h-40zM1070 556l-40 -16v60h40z" fill="#7a4a2c" stroke="#24150f" stroke-width="4"/>
      ${sconce(560, 0)}${sconce(1040, 1)}
      <g class="ps-chand"><path d="M800 0V70" stroke="#2a1d14" stroke-width="5"/><circle class="ps-glow" cx="800" cy="120" r="300" fill="url(#hGlow)"/>
        <path d="M680 120Q800 190 920 120M710 100Q800 150 890 100" stroke="#c9a14a" stroke-width="7" fill="none"/><path d="M790 70h20l10 70h-40z" fill="#c9a14a"/>
        ${[680, 730, 800, 870, 920].map((x, i) => { const y = [120, 108, 132, 108, 120][i]; return `<rect x="${x - 6}" y="${y - 30}" width="12" height="30" fill="#f1e6cc" stroke="#3a2a14" stroke-width="2"/><path class="ps-flame" d="M${x} ${y - 44}q8 10 0 15q-8 -5 0 -15z"/>`; }).join('')}
        ${[700, 760, 840, 900].map(x => `<path d="M${x} 150l6 16l-6 10l-6 -10z" fill="#d8ecff" opacity=".7"/>`).join('')}</g>`);
    const floor = svg(`<defs><linearGradient id="hFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2419"/><stop offset="1" stop-color="#1e120c"/></linearGradient>
        <linearGradient id="hBeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8c8ff" stop-opacity=".0"/><stop offset="1" stop-color="#b8c8ff" stop-opacity=".22"/></linearGradient></defs>
      <rect y="600" width="1600" height="300" fill="url(#hFloor)"/>
      <g stroke="#24150c" stroke-width="3">${[-900, -700, -500, -300, -100, 100, 300, 500, 700, 900, 1100, 1300, 1500, 1700, 1900, 2100, 2300].map(x => `<path d="M${800 + (x - 800) * .32} 600L${x} 900"/>`).join('')}
        <path d="M0 640H1600M0 700H1600M0 780H1600M0 880H1600" stroke-opacity=".6"/></g>
      <path d="M560 600H1040L1260 900H340Z" fill="#7a1f26"/><path d="M582 610H1018L1222 892H378Z" fill="none" stroke="#d1a64a" stroke-width="6"/>
      <g class="ps-beams"><path d="M110 440L290 440L520 900L80 900Z" fill="url(#hBeam)"/><path d="M1310 440L1490 440L1520 900L1080 900Z" fill="url(#hBeam)"/></g>`);
    let dust = ''; for (let i = 0; i < 26; i++) dust += `<circle cx="${(rnd() * 1600).toFixed(0)}" cy="${(rnd() * 800).toFixed(0)}" r="${(rnd() * 2.5 + 1).toFixed(1)}" class="ps-dust" style="animation-delay:${(-rnd() * 12).toFixed(1)}s;animation-duration:${(9 + rnd() * 8).toFixed(1)}s"/>`;
    const near = svg(`<g>${[-30, 1630].map(x => `<g><rect x="${x - 70}" y="0" width="140" height="900" fill="#140c0a" stroke="#050304" stroke-width="6"/><path d="M${x - 50} 0V900M${x + 50} 0V900" stroke="#2a1a14" stroke-width="6"/></g>`).join('')}
      <path d="M-40 0H1640V40Q1400 90 1200 50Q1000 100 800 60Q600 100 400 50Q200 90 -40 40Z" fill="#3a0d14" stroke="#1a0508" stroke-width="5"/></g>
      <g class="ps-fog"><ellipse cx="500" cy="860" rx="700" ry="70" fill="#9a8a9a" opacity=".1"/><ellipse cx="1300" cy="880" rx="520" ry="60" fill="#9a8a9a" opacity=".1"/></g>${dust}`);
    return [['back', .6, back], ['floor', 1, floor], ['near', 1.3, near]];
  }

  const BUILD = { gate, hall };
  function build(id) {
    const el = document.createElement('div'); el.className = 'ps-scene ps-' + id; el.dataset.scene = id;
    const layers = BUILD[id]().map(([name, d, html]) => { const l = document.createElement('div'); l.className = 'ps-layer ps-l-' + name; l.dataset.d = d; l.innerHTML = html; el.appendChild(l); return { el: l, d, name }; });
    const art = ART[id] || {}, useArt = !!art.dark;
    if (useArt) {
      const im = document.createElement('div'); im.className = 'ps-layer ps-art'; im.dataset.d = 1;
      for (const k in art) if (art[k]) { const d = document.createElement('div'); d.className = 'ps-art-img'; d.dataset.k = k; d.style.backgroundImage = `url("${art[k]}")`; im.appendChild(d); }
      el.appendChild(im); layers.forEach(l => { l.el.hidden = true; l.name = 'hidden'; }); layers.push({ el: im, d: 1, name: 'art' });
    }
    const q = s => el.querySelectorAll(s);
    const state = {};
    function artState() {   /* 依目前狀態挑一張圖(沒有那張就退回較暗的那張) */
      if (!useArt) return;
      const want = id === 'gate' ? (state.open > .5 ? ['open', 'lit', 'dark'] : state.lamps || (state.win || []).length ? ['lit', 'dark'] : ['dark'])
        : (state.chand ? ['lit', 'half', 'dark'] : (state.sconce || []).some(Boolean) ? ['half', 'dark'] : ['dark']);
      const k = want.find(x => art[x]); q('.ps-art-img').forEach(d => d.classList.toggle('on', d.dataset.k === k));
    }
    function set(o) {
      if (!o) return;
      Object.assign(state, o);
      if (o.open != null) { el.style.setProperty('--open', o.open); }
      if (o.glow != null) el.style.setProperty('--glow', o.glow);
      if (o.lamps != null) el.classList.toggle('ps-lamps-on', !!o.lamps);
      if (o.win) q('.ps-win').forEach(w => w.classList.toggle('on', o.win.includes(+w.dataset.i)));
      if (o.chand != null) el.classList.toggle('ps-chand-on', !!o.chand);
      if (o.sconce) q('.ps-sconce').forEach(s => s.classList.toggle('on', !!o.sconce[+s.dataset.i]));
      if (o.eyes != null) el.dataset.eyes = o.eyes;
      artState();
    }
    artState();
    return { el, layers, set, id, state };
  }
  /* 共用鏡頭計算(開場的 frameOf/cam 同一套概念;第 22 幕直接使用):c = [x%, y%, 倍率, 傾斜°] = 要放在畫面正中央的「世界」座標。
     k = 世界比舞台大幾倍(例:inset -4% → 1.08)。會自動夾住,畫面不會露出世界以外的黑邊;傾斜時多放大一點補角落。 */
  function camera(c, k) {
    const [x, y, s = 1, rot = 0] = c, z = (k || 1) * s, lim = Math.max(0, 50 - 50 / z);
    const cl = v => Math.max(-lim, Math.min(lim, v));
    return `${rot ? `rotate(${rot}deg) scale(${(1 + Math.abs(rot) * .03).toFixed(3)}) ` : ''}scale(${s}) translate(${cl(50 - x).toFixed(3)}%, ${cl(50 - y).toFixed(3)}%)`;
  }
  window.PrologueScenes = { build, camera, ART };
})();
