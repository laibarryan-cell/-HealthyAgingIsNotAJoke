/* entrance-story.js — 開場劇情「大門後的奇遇」。2026-11-20 重做 v2:分鏡由 Claude 依 PDF 的「文字劇情」自行設計(不使用 PDF 的任何分鏡畫面),
   角色與場景用正式像素圖 + 逐格動畫(prologue-cast.js 的 ART/CLIPS、prologue-scenes.js 的 ART;2026-11-20 33/36/37 號文件),向量草圖只是最後後備。
   分鏡說明:C:\Users\user\Downloads\分工指令文件\35_開場新分鏡_Opus自行設計.md(鏡頭編號 C01~C35 與本檔 SHOTS 的 id 一一對應)。
   介面不變:window.EntranceStory.play(onDone)(home-v4.js 呼叫;結束後進選角畫面)。
   ─ 台詞全部集中在 SHOTS(who 說話者、text 台詞、A 當下角色的位置/姿勢/表情)。要改台詞只改 text。
   ─ 鏡頭:cam [x%, y%, 倍率, 傾斜°] = 鏡頭對準的點;cam2 = 這個鏡頭裡要移動到的位置 [x, y, 倍率, 傾斜, 毫秒, 曲線]。
     F / F2 = 「對準某位角色的某個部位」:on 角色、part 身體位置(0 頭頂~1 腳底;.28 臉、.45 胸、.62 手)、s 倍率、tgt 該部位放在畫面幾 %(預設 44,永遠在對話框上方)、dx 橫移、rot 傾斜。
   ─ 減少動態(html.mm-reduce 或系統設定):不震動、不閃光、鏡頭直接切換、角色不做循環動作,劇情照樣走完。 */
(function () {
  'use strict';
  const reduced = () => document.documentElement.classList.contains('mm-reduce') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SK = () => window.SoundKit || null;
  const sfx = n => { try { SK() && SK().sfx(n); } catch (e) { } };
  const mood = (m, ms) => { try { SK() && SK().mood && SK().mood(m, ms); } catch (e) { } };
  const NAMES = { hero: '???', e1: '神祕老人', e2: '神祕老人', e3: '神祕老人', elders: '神祕老人們', narr: '旁白' };
  const VOICE = { hero: 'player', e1: 'npc1', e2: 'npc2', e3: 'npc3' };
  /* 常用站位(舞台百分比:x 橫向、y 腳底、h 身高) */
  const POS = {
    e3: { x: 64, y: 100, h: 64 }, e1: { x: 76, y: 90, h: 52 }, e2: { x: 88, y: 94, h: 54 },
    stairs: { e1: { x: 56, y: 66, h: 25 }, e2: { x: 62, y: 71, h: 27 }, e3: { x: 69, y: 76, h: 31 } }
  };
  const at = (p, o) => Object.assign({ show: 1 }, p, o);

  /* =============================== 分鏡(C01~C35) ===============================
     每一筆:id 鏡頭編號、scene 場景、cut 硬切、cam/cam2 鏡頭、light 光(x,y 光圈中心、r 半徑%、dark 暗度)、sat 場景彩度、
             set 場景狀態、A 角色狀態、pre 台詞前的演出、fx 純演出(沒有台詞)、who/text 台詞、big 大字、shake 震動、hold 停留毫秒 */
  const SHOTS = [
    /* 第一段:大門(神祕的開始)*/
    { id: 'C01', scene: 'gate', cut: 1, cam: [50, 44, 1], cam2: [50, 46, 1.12, 0, 6500, 'linear'], light: { x: 50, y: 42, r: 75, dark: .35 }, sat: .5,
      set: { open: 0, lamps: 0, glow: 0, win: [] }, A: { hero: { show: 0 }, e1: { show: 0 }, e2: { show: 0 }, e3: { show: 0 } }, fx: 'gateIntro' },
    { id: 'C02', cut: 1, cam: [36, 74, 1.55], light: { x: 40, y: 60, r: 80, dark: .3 },
      A: { hero: { show: 1, x: 10, y: 97, h: 46, pose: 'walk', face: 'whistle', flip: 0, pal: 'mono', emote: '' } },
      pre: 'gateOpen', who: 'hero', text: '哦～門自己開了欸～' },
    { id: 'C03', cut: 1, F: { part: .3, s: 2.2, tgt: 40 }, light: { x: 46, y: 40, r: 70, dark: .15 },
      A: { hero: { x: 40, y: 97, h: 46, pose: 'rub_hands', face: 'smug', flip: 0, emote: '' } }, who: 'hero', text: '自動門耶，好高級。……那我就不客氣囉～' },
    /* 第二段:大廳(自言自語)*/
    { id: 'C04', scene: 'hall', cut: 1, trans: 'warm', cam: [50, 54, 1], cam2: [50, 60, 1.07, 0, 5200, 'ease-out'], light: { x: 50, y: 92, r: 42, dark: .62 }, sat: .32, set: { chand: 0, sconce: [0, 0], eyes: '' },
      A: { hero: { x: 50, y: 108, h: 34, pose: 'walk_back', face: 'curious', emote: '' }, e1: at(POS.stairs.e1, { pose: 'hands_back', face: 'stern', pal: 'dark', flip: 1 }), e2: at(POS.stairs.e2, { pose: 'lean_lazy', face: 'half', pal: 'dark', flip: 1 }), e3: at(POS.stairs.e3, { pose: 'arms_crossed', face: 'deadpan', pal: 'dark', flip: 1 }) },
      pre: 'hallEnter', who: 'hero', text: '這是哪裡啊?' },
    { id: 'C05', cut: 1, F: { part: .42, s: 1.3, dx: 8 }, F2: { part: .42, s: 1.36, dx: 12, ms: 6000, ease: 'ease-in-out' }, hand: 1, light: { x: 30, y: 42, r: 42, dark: .62 },
      A: { hero: { x: 28, y: 102, h: 62, pose: 'scratch_head', face: 'puzzled', emote: '' }, e2: { glint: 1 }, e3: { glint: 1 } }, who: 'hero', text: '我其實只是路過的……好像也不住這。' },
    { id: 'C06', cut: 1, F: { part: .26, s: 2, tgt: 40, rot: -6 }, light: { x: 50, y: 40, r: 40, dark: .6 }, sfx: 'whoosh',
      A: { hero: { pose: 'startle', face: 'shock_excited', emote: '!' } }, who: 'hero', text: '難道……我穿越了嗎?' },
    { id: 'C07', cut: 1, F: { part: .62, s: 1.08, tgt: 56, dx: 10 }, F2: { part: .6, s: 1.18, tgt: 56, dx: 10, ms: 700, ease: 'ease-out' }, light: { x: 46, y: 40, r: 44, dark: .58 },
      A: { hero: { pose: 'boast', face: 'proud', emote: '' } }, who: 'hero', text: '也是啦，畢竟我可是有 11 個系統的人欸。' },
    { id: 'C08', cut: 1, F: { part: .5, s: 1.42, tgt: 54, dx: 2 }, light: { x: 46, y: 46, r: 46, dark: .58 },
      A: { hero: { pose: 'count', face: 'talk_smug', emote: 'organs' }, e1: { glint: 1 } }, who: 'hero', text: '我有免疫系統、消化系統、呼吸系統……(以下省略)' },
    { id: 'C09', cut: 1, cam: [42, 62, 1.05], light: { x: 30, y: 64, r: 45, dark: .6 }, sfx: 'whisper',
      A: { hero: { x: 30, y: 100, h: 56, pose: 'look_around', face: 'curious', emote: '?' } }, who: 'hero', text: '……等等，找個人問路好了。' },
    /* 第三段:撞到「牆」*/
    { id: 'C10', cut: 1, cam: [30, 58, 1.35], light: { x: 30, y: 60, r: 40, dark: .66 },
      A: { hero: { x: 30, y: 100, h: 56, pose: 'walk_whistle', face: 'whistle', emote: 'note', flip: 0 },
        e1: at(POS.e1, { pose: 'hands_back', face: 'stern', pal: 'dark', glint: 1, flip: 1 }), e2: at(POS.e2, { pose: 'lean_lazy', face: 'half', pal: 'dark', glint: 1, flip: 1 }), e3: at(POS.e3, { pose: 'arms_crossed', face: 'deadpan', pal: 'dark', glint: 1, flip: 1 }) },
      fx: 'walkDark' },
    { id: 'C11', fx: 'bonk' },
    { id: 'C12', cut: 1, cam: [50, 72, 1.9], light: { x: 50, y: 70, r: 40, dark: .68 },
      A: { hero: { x: 50, y: 100, h: 56, pose: 'sit_rub', face: 'pain', emote: 'stars' } }, who: 'hero', text: '痛痛痛……怎麼撞到牆啦!' },
    { id: 'C13', cut: 1, cam: [64, 97, 2.8], cam2: [64, 60, 2.8, 0, 3400, 'ease-in-out'], light: { x: 50, y: 42, r: 70, dark: .4 },
      A: { e3: { pal: 'shadow', glint: 0 } }, pre: 'tiltUp', who: 'hero', text: '(……這面牆，怎麼會有肚臍?)' },
    /* 第四段:三位老人現身 */
    { id: 'C14', cut: 1, cam: [54, 62, 1.08], light: { x: 64, y: 58, r: 60, dark: .45 }, sat: .35,
      A: { hero: { x: 40, y: 100, h: 58, pose: 'recoil', face: 'shock', emote: '!', flip: 0 }, e1: { pose: 'hands_back', face: 'stern' }, e2: { pose: 'lean_lazy', face: 'half' }, e3: { pose: 'look_down', face: 'deadpan' } },
      pre: 'reveal', who: 'hero', text: '原來是人啊!' },
    { id: 'C15', cut: 1, F: { part: .42, s: 1.45, dx: 6 }, light: { x: 50, y: 40, r: 62, dark: .45 },
      A: { hero: { pose: 'point', face: 'indignant', emote: '' }, e1: { pose: 'raise_brow', face: 'raise_brow' }, e2: { pose: 'yawn_stretch', face: 'yawn' }, e3: { pose: 'look_down', face: 'bored' } },
      who: 'hero', text: '走路不看路啊?' },
    { id: 'C16', cut: 1, cam: [72, 59, 1.6], cam2: [80, 59, 1.6, 0, 5200, 'linear'], light: { x: 50, y: 42, r: 60, dark: .5 }, sfx: 'whisper',
      A: { e1: { pose: 'explain', face: 'talk', talk: 1 }, e2: { pose: 'talk_lazy', face: 'talk_flat', talk: 1 }, e3: { pose: 'talk_point', face: 'talk', talk: 1 } },
      who: 'elders', mute: 1, text: '(……嘰哩咕嚕……咕嚕嘰哩……)' },
    { id: 'C17', cut: 1, F: { part: .3, s: 1.9, tgt: 47 }, light: { x: 50, y: 46, r: 42, dark: .55 },
      A: { hero: { pose: 'lean_fwd', face: 'squint', emote: '?' }, e1: { talk: 1 }, e2: { talk: 1 }, e3: { talk: 1 } }, who: 'hero', text: '(他們在說啥?)' },
    { id: 'C18', cut: 1, F: { on: 'e1', part: .3, s: 2.8, tgt: 40 }, light: { x: 50, y: 40, r: 36, dark: .66 }, A: { e1: { talk: 1 }, e2: { talk: 1 }, e3: { talk: 1 } }, pre: 'candleDim', who: 'hero', text: '(可惡，燈光好暗，讀不了唇語……)' },
    { id: 'C19', cut: 1, F: { part: .3, s: 1.95, tgt: 47 }, light: { x: 50, y: 46, r: 40, dark: .66 },
      A: { hero: { pose: 'freeze_finger', face: 'sweat_realize', emote: 'sweat' } }, who: 'hero', text: '(……啊對，我也不會讀唇語。)' },
    { id: 'C20', cut: 1, cam: [48, 74, 1.35], light: { x: 46, y: 48, r: 60, dark: .62 },
      A: { hero: { pose: 'tiptoe', face: 'squint', emote: '' }, e1: { pose: 'stroke_beard', face: 'neutral', talk: 0 }, e2: { pose: 'slow_turn', face: 'half', talk: 0 }, e3: { pose: 'arms_crossed', face: 'deadpan', talk: 0 } },
      pre: 'sneak', who: 'hero', text: '(再走近一點……)' },
    /* 第五段:嗆聲 → 「我們不知道」×2 */
    { id: 'C21', cut: 1, F: { part: .48, s: 1.45, tgt: 46, dx: 4 }, light: { x: 50, y: 40, r: 62, dark: .5 },
      A: { hero: { x: 46, y: 100, h: 60, pose: 'akimbo', face: 'arrogant', emote: '' } }, who: 'hero', text: '撞到人不會說對不起嗎?' },
    { id: 'C21b', A: { hero: { pose: 'thumb_self', face: 'talk_smug' } }, who: 'hero', text: '你知道我爸是誰嗎?' },
    { id: 'C22', cut: 1, cam: [76, 60, 1.35], light: { x: 50, y: 42, r: 64, dark: .48 },
      A: { e1: { pose: 'hand_chest', face: 'polite' }, e2: { pose: 'shrug', face: 'deadpan' }, e3: { pose: 'arms_crossed', face: 'deadpan' } }, who: 'elders', text: '我們不知道。' },
    { id: 'C23', cut: 1, F: { part: .4, s: 1.3, tgt: 46 }, F2: { part: .32, s: 1.85, tgt: 42, ms: 420, ease: 'ease-out' }, light: { x: 50, y: 40, r: 50, dark: .5 },
      A: { hero: { pose: 'shout_jump', face: 'yell', emote: '!' } }, who: 'hero', big: 1, text: '那你們知道我是誰嗎?' },
    { id: 'C24', A: { hero: { pose: 'fist_up', face: 'furious', emote: '!!!' } }, who: 'hero', big: 2, shake: 1, text: '你們完蛋了!!!' },
    { id: 'C24b', A: { hero: { pose: 'stomp', face: 'yell', emote: '!!!' } }, who: 'hero', big: 3, shake: 1, sfx: 'thud', text: '我說的!!!' },
    { id: 'C25', cut: 1, cam: [76, 60, 1.35], light: { x: 50, y: 42, r: 64, dark: .48 }, set: { eyes: 'look' }, sfx: 'clock',
      A: { hero: { emote: '', face: 'indignant' }, e1: { pose: 'stroke_beard', face: 'polite_smile' }, e2: { pose: 'lean_lazy', face: 'sleepy' }, e3: { pose: 'pick_ear', face: 'bored' } }, who: 'elders', text: '我們不知道。' },
    { id: 'C26', cut: 1, F: { part: .42, s: 1.65, tgt: 48 }, light: { x: 50, y: 44, r: 48, dark: .5 },
      A: { hero: { pose: 'angry_fists', face: 'rage', emote: 'anger' } }, fx: 'anger' },
    /* 第六段:「給你一點顏色」— 儀式 → 黑白變彩色 */
    { id: 'C27', cut: 1, cam: [74, 88, 1.3], cam2: [72, 64, 1.5, 0, 4200, 'ease-in-out'], light: { x: 74, y: 60, r: 40, dark: .72 },
      A: { e1: { x: 73, y: 101, h: 58, pose: 'declare', face: 'mysterious', ms: 900 }, e2: { pose: 'slow_turn', face: 'mysterious' }, e3: { pose: 'knuckle_crack', face: 'mysterious' }, hero: { emote: '' } },
      pre: 'relight', who: 'e1', text: '看來……該給你一點顏色瞧瞧了。' },
    { id: 'C28', cut: 1, F: { on: 'e2', part: .32, s: 2.3, tgt: 40 }, light: { x: 50, y: 40, r: 42, dark: .55 },
      A: { e2: { pose: 'raise_finger', face: 'lazy_smirk' } }, who: 'e2', text: '真是莫名其妙欸。' },
    { id: 'C29', cut: 1, cam: [74, 56, 1.12], cam2: [74, 60, 1.26, 0, 3600, 'ease-out'], light: { x: 76, y: 56, r: 48, dark: .6 },
      A: { e1: { pose: 'conduct', face: 'mysterious' }, e2: { pose: 'one_finger_up', face: 'mysterious' }, e3: { pose: 'flex_double', face: 'mysterious' } }, fx: 'colorize' },
    { id: 'C30', A: { e1: { pose: 'bow', face: 'polite_smile' }, e2: { pose: 'wave_lazy', face: 'happy' }, e3: { pose: 'thumbs_up', face: 'grin' } },
      who: 'narr', text: '(嗯對，就真的只是從黑白變成彩色了。不要懷疑，對。)' },
    /* 第七段:尷尬 → 想不起名字 → 暈(按「選擇角色」後播結尾) */
    { id: 'C31', cut: 1, F: { part: .3, s: 2, tgt: 40 }, light: { x: 50, y: 40, r: 60, dark: .3 },
      A: { hero: { pose: 'freeze', face: 'dead_stare', emote: '…' }, e3: { pose: 'one_leg', face: 'grin' } }, who: 'hero', hold: 2400, text: '……' },
    { id: 'C32', cut: 1, F: { part: .45, s: 1.55, dx: -4 }, light: { x: 54, y: 44, r: 70, dark: .28 },
      A: { hero: { pose: 'awkward', face: 'awkward', emote: 'sweat' } }, who: 'hero', text: '(好尷尬……現在到底要幹嘛?想吐槽，可是槽點太多，不知道從哪開始……)' },
    { id: 'C33', cut: 1, F: { part: .6, s: 1.6, tgt: 54 }, light: { x: 50, y: 44, r: 58, dark: .3 },
      A: { hero: { pose: 'look_hands', face: 'down', emote: '?' } }, who: 'hero', text: '(……喔對了，所以我叫啥?)' },
    { id: 'C34', cut: 1, F: { part: .45, s: 1.7, tgt: 46, dx: -2 }, light: { x: 50, y: 42, r: 55, dark: .32 },
      A: { hero: { pose: 'count', face: 'thinking', emote: '…' } }, who: 'hero', text: '(名字……名字……第一個字是……)' },
    { id: 'C35', cut: 1, F: { part: .32, s: 1.5, tgt: 42 }, F2: { part: .3, s: 1.9, tgt: 40, rot: -7, ms: 3600, ease: 'ease-in' }, light: { x: 50, y: 40, r: 48, dark: .45 }, woozy: 1,
      A: { hero: { pose: 'hold_head', face: 'dizzy', emote: 'spiral' }, e1: { pose: 'peek', face: 'neutral' }, e2: { pose: 'lean_peek', face: 'surprised' } },
      who: 'hero', text: '(死腦，快想啊……!)' }
  ];
  const TALK = SHOTS.filter(s => s.text != null).length;

  /* 光圈與暗度用註冊過的 CSS 屬性,才能平滑過渡 */
  let reg = false;
  function registerProps() {
    if (reg || !window.CSS || !CSS.registerProperty) return; reg = true;
    [['--lx', '<percentage>', '50%'], ['--ly', '<percentage>', '50%'], ['--lr', '<percentage>', '60%'], ['--dark', '<number>', '0']].forEach(([name, syntax, initialValue]) => {
      try { CSS.registerProperty({ name, syntax, inherits: true, initialValue }); } catch (e) { }
    });
  }

  let active = false;
  function play(onDone) {
    if (active) return; active = true;
    if (SK()) SK().cinematicMusic("intro");
    registerProps();
    try { window.PrologueCast.preload && window.PrologueCast.preload(); } catch (e) { }   /* 逐格動畫圖先載入解碼 */
    const app = document.getElementById('app'), wasInert = app ? app.inert : false;
    if (app) app.inert = true;
    const box = document.createElement('section');
    box.className = 'entrance-story'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', '序章:大門後的奇遇');
    box.innerHTML = `<div class="es-stage">
        <div class="es-shake"><div class="es-view">
          <div class="es-scenes"></div><div class="es-actors"></div><div class="es-front"></div>
          <div class="es-light"></div><div class="es-fx"></div>
        </div></div>
        <div class="es-bar es-bar-top"></div><div class="es-bar es-bar-bot"></div>
        <header class="es-header"><span>序章・大門後的奇遇</span></header>
        <button type="button" class="es-skip" aria-label="跳過開場劇情"><img src="assets/ui-shell/icon-skip.png" alt="" draggable="false"><span>跳過</span></button>
        <div class="es-dialogue es-hide"><span class="es-name"></span><p class="es-line" aria-live="polite"></p>
          <footer><span class="es-hint">▼ 點一下繼續</span><button type="button" class="es-next" hidden>選擇角色 →</button></footer></div>
        <div class="es-fade"></div>
      </div>`;
    document.body.appendChild(box);
    if (reduced()) box.classList.add('es-reduced');
    const q = s => box.querySelector(s);
    const view = q('.es-view'), shakeEl = q('.es-shake'), scenesEl = q('.es-scenes'), actorsEl = q('.es-actors'), frontEl = q('.es-front'), lightEl = q('.es-light'), fx = q('.es-fx'), fade = q('.es-fade');
    const dlg = q('.es-dialogue'), line = q('.es-line'), next = q('.es-next'), nameEl = q('.es-name');

    /* 場景:兩個場景都先建好;near 層搬到角色前面 */
    const scenes = {}, camLayers = [];
    ['gate', 'hall'].forEach(id => {
      const sc = window.PrologueScenes.build(id); scenes[id] = sc; scenesEl.appendChild(sc.el);
      sc.layers.forEach(l => { if (l.name === 'near') { l.el.classList.add('ps-' + id); l.el.dataset.scene = id; frontEl.appendChild(l.el); } camLayers.push(l); });
    });
    camLayers.push({ el: actorsEl, d: 1, flat: 1 });
    /* 角色 */
    const cast = {}, cs = {};
    ['e1', 'e2', 'e3', 'hero'].forEach(id => {
      const a = window.PrologueCast.create(id); cast[id] = a; cs[id] = { show: 0, x: 50, y: 100, h: 50 };
      if (reduced()) a.el.classList.add('pc-reduced');
      a.el.style.display = 'none'; actorsEl.appendChild(a.el);
    });

    /* ---------- 可取消的計時 ---------- */
    let done = false, i = -1, timer = 0, typed = false, token = null, talkNo = 0, busy = false, curScene = null, ending = false;
    const timers = new Set();
    const pause = ms => new Promise(r => { if (done) return r(); const t = setTimeout(() => { timers.delete(t); r(); }, reduced() ? Math.min(ms, 250) : ms); timers.add(t); });
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!done) fn(); }, reduced() ? Math.min(ms, 200) : ms); timers.add(t); };
    const clear = () => { clearTimeout(timer); timer = 0; };

    /* ---------- 鏡頭(每一層依深度做視差)---------- */
    let camNow = [50, 50, 1, 0];
    function cam(c, ms, ease) {
      const [x, y, s, rot = 0] = c; camNow = [x, y, s, rot];
      const instant = !ms || reduced();
      for (const l of camLayers) {
        const sd = 1 + (s - 1) * l.d, lim = Math.max(0, 58 - 50 / sd), limF = Math.max(0, 58 - 50 / s);
        const clamp = (v, m) => Math.max(-m, Math.min(m, v));
        const tx = l.flat ? clamp(50 - x, limF) : clamp((50 - x) * l.d, lim), ty = l.flat ? clamp(50 - y, limF) : clamp((50 - y) * l.d, lim);
        l.el.style.transition = instant ? 'none' : `transform ${ms}ms ${ease || 'ease-in-out'}`;
        l.el.style.transform = `scale(${sd.toFixed(4)}) translate(${tx.toFixed(3)}cqw, ${ty.toFixed(3)}cqh)`;
      }
      view.style.transition = instant ? 'none' : `transform ${ms}ms ${ease || 'ease-in-out'}`;
      view.style.transform = rot ? `rotate(${rot}deg) scale(${1 + Math.abs(rot) * .03})` : '';
      if (instant) void view.offsetWidth;
    }
    function light(o, ms) {
      if (!o) return;
      lightEl.style.transition = !ms || reduced() ? 'none' : `--lx ${ms}ms, --ly ${ms}ms, --lr ${ms}ms, --dark ${ms}ms`;
      if (o.x != null) lightEl.style.setProperty('--lx', o.x + '%');
      if (o.y != null) lightEl.style.setProperty('--ly', o.y + '%');
      if (o.r != null) lightEl.style.setProperty('--lr', o.r + '%');
      if (o.dark != null) lightEl.style.setProperty('--dark', o.dark);
    }
    function setSat(v, ms) { scenesEl.style.transition = !ms || reduced() ? 'none' : `filter ${ms}ms ease`; scenesEl.style.filter = `saturate(${v}) brightness(${.75 + v * .35})`; }
    function setScene(id) {
      if (!id || id === curScene) return; curScene = id;
      Object.values(scenes).forEach(s => s.el.classList.toggle('on', s.id === id));
      frontEl.querySelectorAll('.ps-layer').forEach(l => l.classList.toggle('on', l.dataset.scene === id));
    }
    /* ---------- 角色 ---------- */
    function actor(id, o, cut) {
      if (!o) return;
      const a = cast[id], c = cs[id], el = a.el;
      if (o.show != null) { c.show = o.show; el.style.display = o.show ? '' : 'none'; }
      const mv = o.mv != null ? o.mv : 0;
      el.style.transition = cut || !mv || reduced() ? 'none' : `left ${mv}ms linear, top ${mv}ms linear, height ${mv}ms linear`;
      ['x', 'y', 'h'].forEach(k => { if (o[k] != null) c[k] = o[k]; });
      el.style.left = c.x + '%'; el.style.top = c.y + '%'; el.style.height = c.h + 'cqh'; el.style.setProperty('--pc-h', c.h + 'cqh');
      el.style.zIndex = Math.round(c.y * 10);
      a.set({ pose: o.pose, face: o.face, pal: o.pal, flip: o.flip, emote: o.emote, glint: o.glint, talk: o.talk, fx: o.fx, ms: o.ms });
      if (o.ms) later(() => a.set({ ms: 480 }), o.ms + 60);
    }
    function frameOf(F) {
      const c = cs[F.on || 'hero'], s = F.s || 1.4, wy = c.y - c.h + c.h * (F.part != null ? F.part : .4);
      return [c.x + (F.dx || 0), wy + (50 - (F.tgt || 44)) / s, s, F.rot || 0];
    }
    function apply(s, cut) {
      if (s.scene) setScene(s.scene);
      if (s.set) scenes[curScene].set(s.set);
      if (s.sat != null) setSat(s.sat, cut ? 0 : 1200);
      if (s.A) for (const id in s.A) actor(id, s.A[id], cut);
      if (s.cam || s.F) cam(s.F ? frameOf(s.F) : s.cam, cut ? 0 : 900, 'ease-in-out');
      if (s.light) light(s.light, cut ? 0 : 900);
      view.classList.toggle('es-hand', !!s.hand && !reduced());
      view.classList.toggle('es-woozy', !!s.woozy && !reduced());
      if (s.F2) { const F = s.F2; requestAnimationFrame(() => requestAnimationFrame(() => { if (!done && SHOTS[i] === s) cam(frameOf(F), F.ms, F.ease); })); }
      if (s.cam2) { const [x, y, sc, r, ms, ease] = s.cam2; requestAnimationFrame(() => requestAnimationFrame(() => { if (!done && SHOTS[i] === s) cam([x, y, sc, r], ms, ease); })); }
    }

    /* ---------- 特效 ---------- */
    const add = (cls, html, ms) => { const n = document.createElement('i'); n.className = cls; if (html) n.innerHTML = html; fx.appendChild(n); if (ms) later(() => n.remove(), ms); return n; };
    const shake = (cls, ms) => { if (reduced()) return; shakeEl.classList.remove(cls); void shakeEl.offsetWidth; shakeEl.classList.add(cls); later(() => shakeEl.classList.remove(cls), ms); };
    const flash = (kind, ms) => { if (reduced()) return; add('es-flash ' + (kind || ''), '', ms || 500); };
    function particles(x, y, n, colors, dist) {
      if (reduced()) return;
      for (let k = 0; k < n; k++) {
        const a = Math.PI * 2 * k / n + Math.random() * .4, d = dist * (.55 + Math.random() * .6);
        const p = add('es-p', ['✦', '●', '■', '★'][k % 4], 1600);
        p.style.left = x + '%'; p.style.top = y + '%'; p.style.color = colors[k % colors.length];
        p.style.setProperty('--dx', (Math.cos(a) * d).toFixed(1) + 'cqw'); p.style.setProperty('--dy', (Math.sin(a) * d * .7).toFixed(1) + 'cqw');
      }
    }
    const FX = {
      async gateIntro() {
        sfx('wind'); mood('tense', 60000);
        await pause(1500); scenes.gate.set({ lamps: 1 }); sfx('candle');
        for (const w of [12, 0, 7, 3]) { await pause(420); scenes.gate.set({ win: [...(scenes.gate.state.win || []), w] }); }
        await pause(1600); sfx('clock');
        await pause(900);
      },
      async gateOpen() {
        actor('hero', { x: 40, mv: 2600 }); for (let k = 0; k < 5; k++) { sfx('step'); await pause(520); }
        actor('hero', { pose: 'stand', face: 'curious' }); await pause(500);
        sfx('creak'); scenes.gate.set({ open: 1, glow: 1 }); light({ x: 50, y: 58, r: 90, dark: .2 }, 2000);
        await pause(500); actor('hero', { pose: 'recoil', face: 'surprised', emote: '!' }); sfx('pop');
        await pause(1300); actor('hero', { pose: 'lean_in', face: 'delighted', emote: '' });
      },
      async hallEnter() {
        if (!reduced()) { add('es-flash es-flash-warm', '', 900); }
        sfx('door'); await pause(300);
        actor('hero', { y: 92, h: 27, mv: 2600 }); for (let k = 0; k < 5; k++) { sfx('step'); await pause(500); }
        actor('hero', { pose: 'stand_back', emote: '?' }); sfx('pop'); await pause(300);
      },
      async walkDark() {
        actor('hero', { x: 57, mv: 3300 }); cam([57, 58, 1.35], 3300, 'linear'); light({ x: 57, y: 60, r: 34, dark: .8 }, 3300);
        for (let k = 0; k < 6; k++) { sfx('step'); await pause(550); }
      },
      async bonk() {
        actor('hero', { emote: '' }); view.classList.add('es-hitstop'); await pause(90); view.classList.remove('es-hitstop');
        sfx('bonk'); sfx('shake'); shake('es-shake-l', 520); flash('', 450);
        add('es-bang', '咚!', 1500); particles(60, 46, 6, ['#ffd86d'], 14);
        cam([52, 66, 1.7]); light({ x: 52, y: 66, r: 40, dark: .7 });
        actor('hero', { x: 50, pose: 'sit_rub', face: 'pain', emote: 'stars', mv: 200 });
        await pause(1500);
      },
      async tiltUp() {
        await pause(3300); sfx('sparkle'); cast.e3.set({ glint: 1 }); await pause(300);
      },
      async reveal() {
        await pause(200); sfx('candle'); scenes.hall.set({ sconce: [0, 1] });
        ['e1', 'e2', 'e3'].forEach(id => actor(id, { pal: 'mono', glint: 0 }));
        light({ x: 64, y: 58, r: 62, dark: .42 }, 700); await pause(500);
      },
      async candleDim() {
        await pause(400); box.classList.add('es-flicker'); await pause(900); box.classList.remove('es-flicker');
        sfx('puff'); scenes.hall.set({ sconce: [0, 0] }); light({ dark: .78 }, 500); await pause(500);
      },
      async sneak() {
        actor('hero', { x: 52, mv: 2400 }); for (let k = 0; k < 4; k++) { sfx('step'); await pause(560); }
        actor('hero', { pose: 'stand', face: 'squint' });
      },
      async anger() {
        sfx('shake'); sfx('thud'); shake('es-shake-s', 1300); box.classList.add('es-red');
        await pause(500); actor('hero', { emote: 'steam' }); sfx('thud');
        await pause(1900); box.classList.remove('es-red'); actor('hero', { emote: '' });
      },
      async relight() {
        await pause(700); sfx('candle'); scenes.hall.set({ sconce: [1, 0] }); light({ dark: .6, r: 46 }, 600);
        await pause(800); sfx('candle'); scenes.hall.set({ sconce: [1, 1] }); light({ dark: .5, r: 55 }, 600);
        await pause(800);
      },
      async colorize() {
        mood('happy', 20000); sfx('memory');
        add('es-gather', '', 1800); await pause(1300);
        sfx('restore'); flash('es-flash-soft', 600);
        const ring = add('es-wave', '', 1800); ring.style.left = '76%'; ring.style.top = '58%';
        const order = ['e1', 'e2', 'e3'];
        for (const id of order) { actor(id, { pal: 'color', face: id === 'e3' ? 'grin' : 'happy' }); sfx('sparkle'); particles(cs[id].x, cs[id].y - cs[id].h * .6, 10, ['#ffd86d', '#ff8a6a', '#8fd6ff', '#c49bff', '#8fe08a'], 14); await pause(380); }
        sfx('fanfare'); scenes.hall.set({ chand: 1, sconce: [1, 1], eyes: '' }); setSat(.72, 1800); light({ x: 60, y: 50, r: 95, dark: .2 }, 1800);
        await pause(1700);
      }
    };
    async function outro() {
      ending = true; dlg.classList.add('es-hide'); view.classList.remove('es-woozy');
      actor('hero', { fx: 'spin', emote: '' }); sfx('dizzy'); await pause(900);
      actor('hero', { fx: '', pose: 'collapse', face: 'dizzy' }); sfx('thud');
      actor('e1', { pose: 'surprised', face: 'surprised' }); actor('e2', { pose: 'lean_peek', face: 'surprised' }); actor('e3', { pose: 'shock_back', face: 'shock_peek' });
      cam([50, 62, 1.15], 700, 'ease-out'); await pause(1300);
      fade.className = 'es-fade es-black'; await pause(700);
      /* 首尾呼應:回到第一個鏡頭的構圖,這次是門自己關上、窗一扇扇熄滅、鏡頭往後拉 */
      Object.keys(cast).forEach(id => actor(id, { show: 0 }));
      setScene('gate'); setSat(.5, 0); scenes.gate.set({ open: 1, glow: 1, lamps: 1, win: [12, 0, 7, 3] }); cam([50, 46, 1.12]); light({ x: 50, y: 42, r: 75, dark: .35 });
      fade.className = 'es-fade'; await pause(700);
      sfx('creak'); scenes.gate.set({ open: 0, glow: 0 }); cam([50, 44, 1], 4200, 'ease-in-out');
      await pause(1200); sfx('door');
      for (const left of [[0, 7, 3], [0, 3], [3], []]) { await pause(380); scenes.gate.set({ win: left }); }
      scenes.gate.set({ lamps: 0 }); sfx('bell'); await pause(900);
      fade.className = 'es-fade es-black es-slow'; await pause(1300);
      finish();
    }

    /* ---------- 台詞流程 ---------- */
    function finish() {
      if (done) return; done = true; clear(); timers.forEach(t => clearTimeout(t)); timers.clear();
      try { token && token.stop && token.stop(); } catch (e) { }
      document.removeEventListener('visibilitychange', visibility);
      mood(null);
      box.remove(); if (app) app.inert = wasInert; active = false;
      onDone && onDone(); const nm = document.getElementById('player-name'); nm && nm.focus();
    }
    function schedule() {
      clear(); if (document.hidden || !typed || done || busy || ending) return;
      const s = SHOTS[i]; if (i === SHOTS.length - 1) return;   /* 最後一句等玩家按「選擇角色」 */
      timer = setTimeout(advance, s.hold || (1150 + s.text.length * 60));
    }
    function advance() {
      if (done || busy || ending) return;
      if (!typed) { if (token) token.skip = true; return; }
      clear(); try { token && token.stop && token.stop(); } catch (e) { }
      if (i >= SHOTS.length - 1) { outro(); return; }
      run(i + 1);
    }
    function speakers(who) { return who === 'elders' ? ['e1', 'e2', 'e3'] : cast[who] ? [who] : []; }
    async function run(n) {
      i = n; const s = SHOTS[i]; busy = true; typed = false; box.dataset.shot = s.id;
      Object.keys(cast).forEach(id => { if (!(s.A && s.A[id] && s.A[id].talk)) cast[id].set({ talk: 0 }); });
      if (s.fx) {
        dlg.classList.add('es-hide'); apply(s, s.cut); await FX[s.fx](); if (done) return;
        busy = false; typed = true; return advance();
      }
      apply(s, s.cut);
      if (s.sfx) sfx(s.sfx);
      if (s.pre) { dlg.classList.add('es-hide'); await FX[s.pre](); if (done) return; }
      talkNo++;
      box.dataset.speaker = s.who; nameEl.textContent = NAMES[s.who] || '';
      dlg.dataset.big = s.big || ''; dlg.dataset.who = s.who; dlg.classList.toggle('es-thought', /^[(（]/.test(s.text)); dlg.classList.remove('es-hide');
      if (s.shake) shake('es-shake-s', 380);
      const last = i === SHOTS.length - 1;   /* 只有最後一句出現按鈕;其他句點一下畫面繼續(與 StoryDialog 一致) */
      next.hidden = !last; next.classList.toggle('es-final', last); q('.es-hint').hidden = last;
      line.textContent = ''; busy = false;
      const who = speakers(s.who), thought = /^[(（]/.test(s.text);
      if (!thought) who.forEach(id => cast[id].set({ talk: 1 }));
      const tk = token = { skip: false, voice: VOICE[who[0]] || 'player' };
      try { if (s.who !== 'narr' && !s.mute && SK()) { SK().emote(s.text, tk.voice); if (s.who === 'elders') { later(() => SK().emote(s.text, 'npc2'), 90); later(() => SK().emote(s.text, 'npc3'), 180); } } } catch (e) { }
      await window.StoryDialog.typewrite(line, s.text, tk);
      if (done || token !== tk) return;
      if (!s.A || !Object.values(s.A).some(a => a.talk)) who.forEach(id => cast[id].set({ talk: 0 }));
      typed = true; schedule();
    }
    function visibility() {
      if (document.hidden) { clear(); if (!typed && SHOTS[i] && SHOTS[i].text != null && !busy) { if (token) token.skip = true; } }
      else schedule();
    }
    next.onclick = e => { e.stopPropagation(); advance(); };
    dlg.addEventListener('click', e => { if (!e.target.closest('button')) advance(); });
    view.addEventListener('click', () => advance());
    q('.es-skip').onclick = e => { e.stopPropagation(); finish(); };
    box.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); finish(); }
      else if ((e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') && !e.target.closest('.es-skip')) { e.preventDefault(); advance(); }
      else if (e.key === 'Tab') { const b = [q('.es-skip'), next.hidden ? q('.es-skip') : next]; if (e.shiftKey && document.activeElement === b[0]) { e.preventDefault(); b[1].focus(); } else if (!e.shiftKey && document.activeElement === b[1]) { e.preventDefault(); b[0].focus(); } }
    });
    document.addEventListener('visibilitychange', visibility);
    run(0); box.tabIndex = -1; box.focus({ preventScroll: true });
  }
  window.EntranceStory = { play, SHOTS };
})();
