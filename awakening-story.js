/* awakening-story.js — 第 22 幕「醒來」(選完角色後、進地圖前)。2026-11-20 多鏡頭重做(37 號文件第 6 章;分鏡表見 38_第22幕新分鏡_Opus設計.md)。
   ─ 台詞與劇情不變:lines 三句、順序、第 1 句顫抖、第 3 句轉暖 +「!」。新增的鏡頭都沒有台詞。
   ─ 鏡頭(S1~S10,S5 已刪除、編號保留):S1 主觀(眼皮 30%)→ S2 主觀(眼皮 70%,看向吊燈與樓梯)→ S3 大廳遠景(高角度,主角倒在紅地毯上,緩推)
     → S4 主角特寫(倒地抽動,緩推)→ S6 低角度抬鏡,主角搖晃站起 ★?★ → S7 第 1 句(正面近景、手持晃)→ S8 第 2 句(中景橫移環顧)
     → S9 第 3 句(背影拉遠成遠景、轉暖)→ S10 白光。(肖像畫眼睛轉向的鏡頭 S5 依使用者指示刪除)
   ─ 三位老人不出現在這一幕(使用者 2026-11-20 指示刪除「老人窺視」)。
   ─ 鏡頭座標 cam [x%, y%, 倍率, 傾斜°] 以「世界」(背景)為準;鏡頭計算與開場共用 PrologueScenes.camera。
   ─ 玩家角色:MapWalker.drawPose(256×256,四方向 down/left/up/right 各 6 格);畫不出來時用開場主角圖(PrologueCast)代替,流程一樣。
   介面不變:window.AwakeningStory.play(onDone)(integration/bridge-parent.js 呼叫)。 */
(function () {
  'use strict';
  const lines = ['ㄜ...這裡是哪裡...我剛剛好像暈過去了', '我是誰?我在哪?我要去哪裡?', '且看小爺我勇闖異世界'];
  const reduced = () => document.documentElement.classList.contains('mm-reduce') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sfx = n => { try { window.SoundKit && SoundKit.sfx(n); } catch (e) { } };
  let active = false;
  function play(onDone) {
    if (active) return; active = true;
    const app = document.getElementById('app'), wasInert = app ? app.inert : false; if (app) app.inert = true;
    const box = document.createElement('section');
    box.className = 'awakening-story'; box.tabIndex = -1; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', '醒來之後');
    box.innerHTML = `<div class="aw-stage">
        <div class="aw-world"><div class="aw-hand"><div class="aw-cam">
          <div class="aw-bg"></div>
          <div class="aw-hero"><div class="aw-body"><canvas class="aw-cv" width="256" height="256" aria-hidden="true"></canvas><div class="aw-fallback"></div></div><i class="aw-emote"></i></div>
        </div></div><div class="aw-warm"></div></div>
        <div class="aw-lid aw-lid-top"></div><div class="aw-lid aw-lid-bot"></div>
        <button type="button" class="aw-skip" aria-label="跳過"><img src="assets/ui-shell/icon-skip.png" alt="" draggable="false"><span>跳過</span></button>
        <div class="aw-dialogue aw-hide"><span class="aw-name">???</span><p class="aw-text" aria-live="polite"></p>
          <footer><span class="aw-hint">▼ 點一下繼續</span></footer></div>
        <div class="aw-white"></div></div>`;
    document.body.appendChild(box);
    const q = s => box.querySelector(s), text = q('.aw-text'), dlg = q('.aw-dialogue'), emote = q('.aw-emote'), camEl = q('.aw-cam'), heroEl = q('.aw-hero'), cv = q('.aw-cv');
    if (reduced()) box.classList.add('aw-reduced');
    /* 場景:開場的大廳(燈都亮著 = 接在三位老人變彩色之後) */
    let fb = null;
    try {
      const hall = window.PrologueScenes.build('hall'); hall.el.classList.add('on'); hall.set({ chand: 1, sconce: [1, 1] }); q('.aw-bg').appendChild(hall.el);
      fb = window.PrologueCast.create('hero'); fb.set({ pose: 'stand_back', face: 'neutral', pal: 'color' }); if (reduced()) fb.el.classList.add('pc-reduced'); q('.aw-fallback').appendChild(fb.el);
    } catch (e) { }
    /* 玩家的角色(drawPose 有 down/left/up/right × 6 格);畫不出來就用開場主角圖 */
    const st = (typeof state !== 'undefined' && state) || {};
    const MW = typeof MapWalker !== 'undefined' ? MapWalker : window.MapWalker;   // map-walker.js 用 const 宣告,不在 window 上
    let hasPlayer = false;
    const FB_POSE = { up: ['stand_back', 'neutral'], down: ['stand', 'curious'], left: ['look_around', 'curious'], right: ['look_around', 'curious'] };
    function face(dir, k) {
      heroEl.dataset.dir = dir;
      if (fb) { const [p, f] = FB_POSE[dir] || FB_POSE.up; fb.set({ pose: p, face: f, flip: dir === 'left' ? 1 : 0 }); }
      try { if (MW && MW.drawPose) MW.drawPose(cv, st.base || 0, st, dir, k || 0).then(ok => { if (ok && !hasPlayer) { hasPlayer = true; box.classList.add('aw-has-player'); } }).catch(() => { }); } catch (e) { }
    }
    try {
      const name = st.name || (JSON.parse(localStorage.getItem('memoryMazeAvatar') || '{}').name) || '';
      if (name) q('.aw-name').textContent = name;
    } catch (e) { }
    face('up', 0);

    let done = false, i = -1, typed = false, token = null, timer = 0, started = false;
    const timers = new Set();
    const pause = ms => new Promise(r => { if (done) return r(); const t = setTimeout(() => { timers.delete(t); r(); }, reduced() ? Math.min(ms, 200) : ms); timers.add(t); });
    const clear = () => { clearTimeout(timer); timer = 0; };
    /* ---------- 鏡頭 ---------- */
    function cam(c, ms, ease) {
      const instant = !ms || reduced();
      camEl.style.transition = instant ? 'none' : `transform ${ms}ms ${ease || 'ease-in-out'}`;
      camEl.style.transform = window.PrologueScenes.camera(c, 1.08);
      if (instant) void camEl.offsetWidth;
    }
    const cam2 = (c, ms, ease) => requestAnimationFrame(() => requestAnimationFrame(() => { if (!done) cam(c, ms, ease); }));
    function hero(o) {
      if (o.x != null) heroEl.style.left = o.x + '%';
      if (o.y != null) heroEl.style.top = o.y + '%';
      if (o.h != null) heroEl.style.height = o.h + '%';
      if (o.state != null) heroEl.dataset.state = o.state;
    }
    function shot(id) { box.dataset.shot = id; }

    function finish() {
      if (done) return; done = true; clear(); timers.forEach(t => clearTimeout(t)); timers.clear();
      try { token && token.stop && token.stop(); } catch (e) { }
      document.removeEventListener('visibilitychange', visibility);
      fb && fb.destroy();
      box.remove(); if (app) app.inert = wasInert; active = false; onDone && onDone();
    }
    async function ending() { if (done) return; started = false; clear(); shot('S10'); box.classList.add('aw-out'); sfx('whoosh'); await pause(650); finish(); }
    function schedule() { clear(); if (!done && typed && !document.hidden) timer = setTimeout(advance, 1500 + lines[i].length * 70); }
    function advance() {
      if (done || !started) return;
      if (!typed) { if (token) token.skip = true; return; }
      clear(); try { token && token.stop && token.stop(); } catch (e) { }
      if (i >= lines.length - 1) { ending(); return; }
      say(i + 1);
    }
    /* 三句台詞各自的鏡頭(S7~S9) */
    const LINE_SHOT = [
      () => { shot('S7'); face('down', 0); hero({ state: 'wobble' }); box.classList.add('aw-handheld'); cam([50, 77.5, 2.6], 0); cam2([50, 76.5, 2.85], 3600, 'ease-out'); },
      () => {
        shot('S8'); box.classList.remove('aw-handheld'); hero({ state: 'stand' }); face('left', 0); cam([32, 73, 1.7], 0); cam2([68, 73, 1.7], 4200, 'ease-in-out');
        later(() => face('up', 0), 1400); later(() => face('right', 0), 2600);
      },
      () => {
        shot('S9'); face('up', 0); hero({ state: 'proud' }); cam([50, 66, 1.9], 0); cam2([50, 62, 1.15], 3200, 'ease-out');
        box.classList.add('aw-bright'); emote.textContent = '!'; emote.className = 'aw-emote em-bang'; sfx('sparkle');
      }
    ];
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!done) fn(); }, reduced() ? Math.min(ms, 200) : ms); timers.add(t); };
    function say(n) {
      i = n; typed = false; box.dataset.line = i;
      text.classList.toggle('aw-weak', i === 0);
      LINE_SHOT[i]();
      const tk = token = { skip: false, voice: 'player' };
      try { window.SoundKit && SoundKit.emote(lines[i], 'player'); } catch (e) { }
      window.StoryDialog.typewrite(text, lines[i], tk).then(() => { if (done || token !== tk) return; typed = true; schedule(); });
    }
    async function intro() {
      /* 主角倒在紅地毯中央 */
      hero({ x: 50, y: 87, h: 19, state: 'lying' });
      /* S1 主觀:眼皮 30%,模糊泛白、傾斜,只看到暖光與地毯 */
      shot('S1'); cam([50, 80, 1.6, -8], 0); sfx('faint');
      await pause(500); if (done) return;
      box.classList.add('aw-blink1'); sfx('heartbeat'); cam([48, 76, 1.65, -7], 1800, 'ease-in-out');
      await pause(1700); box.classList.remove('aw-blink1'); await pause(400); if (done) return;
      /* S2 主觀:眼皮 70%,稍微對焦;看到吊燈與樓梯 */
      shot('S2'); box.classList.add('aw-half'); cam([50, 30, 1.9, -4], 0); cam2([50, 26, 2.05, -3], 2400, 'ease-out');
      box.classList.add('aw-blink2'); sfx('heartbeat');
      await pause(1700); box.classList.remove('aw-blink2'); await pause(450); if (done) return;
      /* S3 大廳遠景(高角度):眼睛張開,畫面清晰,緩慢推近 */
      shot('S3'); box.classList.remove('aw-half'); box.classList.add('aw-open', 'aw-focus'); sfx('heartbeat');
      cam([50, 50, 1.0], 0); cam2([50, 58, 1.12], 4800, 'ease-in-out');
      await pause(4300); if (done) return;
      /* S4 主角特寫:手指抽動,緩推 */
      shot('S4'); hero({ state: 'twitch' }); cam([44, 84, 4.2], 0); cam2([44, 84, 4.6], 2800, 'linear'); sfx('pop');
      await pause(2900); if (done) return;
      /* S6 低角度:由下往上抬鏡,主角搖晃站起 */
      shot('S6'); cam([50, 92, 2.1], 0); cam2([50, 70, 1.75], 3400, 'ease-in-out');
      await pause(500); hero({ state: 'sit' }); face('up', 1); sfx('step');
      await pause(1100); hero({ state: 'stand' }); face('up', 0); sfx('step');
      await pause(1100); emote.innerHTML = '<b>★</b><b>?</b><b>★</b>'; emote.className = 'aw-emote em-dizzy'; sfx('pop');
      await pause(800); if (done) return;
      emote.textContent = ''; emote.className = 'aw-emote';
      dlg.classList.remove('aw-hide'); started = true; say(0);
    }
    function visibility() { if (document.hidden) clear(); else schedule(); }
    dlg.addEventListener('click', e => { if (!e.target.closest('button')) advance(); });
    q('.aw-world').addEventListener('click', advance);
    q('.aw-skip').onclick = e => { e.stopPropagation(); finish(); };
    box.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); finish(); }
      else if ((e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') && !e.target.closest('.aw-skip')) { e.preventDefault(); advance(); }
      else if (e.key === 'Tab') { e.preventDefault(); q('.aw-skip').focus(); }
    });
    document.addEventListener('visibilitychange', visibility);
    box.focus({ preventScroll: true }); intro();
  }
  window.AwakeningStory = { play, lines };
})();
