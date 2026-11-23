/* prologue-cast.js — 開場/第 22 幕的角色。正式像素圖(ART)+ 逐格動畫(CLIPS/IDLE/TALK,2026-11-20 37 號文件);底層的 SVG 向量人偶只在圖片載入失敗時當後備。
   ─ 四位角色:hero(主角,預設旅人,尚未選角)、e1 優雅老、e2 躺平老、e3 鯊BEE。
   ─ 骨架:根(位移/旋轉/壓扁)> 呼吸層 > 腿(髖→膝)、軀幹(腰)> 手臂(肩→肘)、頭(頸)> 臉。各關節用 CSS transform + transition 補間。
   ─ 姿勢 POSES[id][poseId] = { t 軀幹, h 頭, hx/hy, aL/aR [肩,肘], lL/lR [髖,膝], y, r 全身旋轉, sx/sy, v 視角 f正/t四分之三/s側/b背, hand {L,R}, anim }
     角度單位度,正值=順時針;0 = 自然下垂。
   ─ 表情 FACES[id][faceId] = { e 眼, b 眉, m 嘴, x [附加:blush/sweat/vein/shade/tear/gloom], p 瞳孔偏移 [x,y], peek(鯊BEE 墨鏡滑下) }
   ─ 調色盤:color 彩色 / mono 黑白 / shadow 暗處看得到輪廓 / dark 幾乎全黑(只剩眼鏡反光)。用已註冊的 CSS 自訂屬性,切換時會漸變。
   ─ 有圖用圖:ART 清單裡列出的 PNG(`角色/姿勢__表情` 或 `角色/姿勢`)才會用;清單是空的就全部用向量。圖到了由 Claude 切圖並更新清單
     (精靈圖格子順序與 id 見 33 號文件第 1 章;建議路徑 assets/prologue/cast/角色/姿勢__表情.png)。用圖時黑白/暗處改用濾鏡。
   介面:PrologueCast.create(id) → actor { el, set({pose, face, pal, flip, emote, anim, ms}), say(on), destroy() } */
(function () {
  'use strict';
  /* ---------- 有圖用圖(正式圖到了才填;格式 '角色/姿勢' 或 '角色/姿勢__表情' → 路徑) ---------- */
  const A = 'assets/prologue/cast/';
  const ART = {
    'e1/bow__polite_smile': A + 'e1/bow__polite_smile.png',
    'e1/conduct__happy': A + 'e1/conduct__happy.png',
    'e1/conduct__mysterious': A + 'e1/conduct__mysterious.png',
    'e1/declare__mysterious': A + 'e1/declare__mysterious.png',
    'e1/explain__talk': A + 'e1/explain__talk.png',
    'e1/hand_chest__polite': A + 'e1/hand_chest__polite.png',
    'e1/hands_back__stern': A + 'e1/hands_back__stern.png',
    'e1/peek__neutral': A + 'e1/peek__neutral.png',
    'e1/raise_brow__raise_brow': A + 'e1/raise_brow__raise_brow.png',
    'e1/stroke_beard__neutral': A + 'e1/stroke_beard__neutral.png',
    'e1/stroke_beard__polite_smile': A + 'e1/stroke_beard__polite_smile.png',
    'e1/surprised__surprised': A + 'e1/surprised__surprised.png',
    'e2/lean_lazy__half': A + 'e2/lean_lazy__half.png',
    'e2/lean_lazy__sleepy': A + 'e2/lean_lazy__sleepy.png',
    'e2/lean_peek__surprised': A + 'e2/lean_peek__surprised.png',
    'e2/one_finger_up__happy': A + 'e2/one_finger_up__happy.png',
    'e2/one_finger_up__mysterious': A + 'e2/one_finger_up__mysterious.png',
    'e2/raise_finger__lazy_smirk': A + 'e2/raise_finger__lazy_smirk.png',
    'e2/shrug__deadpan': A + 'e2/shrug__deadpan.png',
    'e2/slow_turn__half': A + 'e2/slow_turn__half.png',
    'e2/slow_turn__mysterious': A + 'e2/slow_turn__mysterious.png',
    'e2/talk_lazy__talk_flat': A + 'e2/talk_lazy__talk_flat.png',
    'e2/wave_lazy__happy': A + 'e2/wave_lazy__happy.png',
    'e2/yawn_stretch__yawn': A + 'e2/yawn_stretch__yawn.png',
    'e3/arms_crossed__deadpan': A + 'e3/arms_crossed__deadpan.png',
    'e3/flex_double__grin': A + 'e3/flex_double__grin.png',
    'e3/flex_double__mysterious': A + 'e3/flex_double__mysterious.png',
    'e3/knuckle_crack__mysterious': A + 'e3/knuckle_crack__mysterious.png',
    'e3/look_down__bored': A + 'e3/look_down__bored.png',
    'e3/look_down__deadpan': A + 'e3/look_down__deadpan.png',
    'e3/one_leg__grin': A + 'e3/one_leg__grin.png',
    'e3/pick_ear__bored': A + 'e3/pick_ear__bored.png',
    'e3/shock_back__shock_peek': A + 'e3/shock_back__shock_peek.png',
    'e3/talk_point__talk': A + 'e3/talk_point__talk.png',
    'e3/thumbs_up__grin': A + 'e3/thumbs_up__grin.png',
    'hero/akimbo__arrogant': A + 'hero/akimbo__arrogant.png',
    'hero/angry_fists__rage': A + 'hero/angry_fists__rage.png',
    'hero/awkward__awkward': A + 'hero/awkward__awkward.png',
    'hero/boast__proud': A + 'hero/boast__proud.png',
    'hero/collapse__dizzy': A + 'hero/collapse__dizzy.png',
    'hero/count__talk_smug': A + 'hero/count__talk_smug.png',
    'hero/count__thinking': A + 'hero/count__thinking.png',
    'hero/fist_up__furious': A + 'hero/fist_up__furious.png',
    'hero/freeze__dead_stare': A + 'hero/freeze__dead_stare.png',
    'hero/freeze_finger__sweat_realize': A + 'hero/freeze_finger__sweat_realize.png',
    'hero/hold_head__dizzy': A + 'hero/hold_head__dizzy.png',
    'hero/lean_fwd__squint': A + 'hero/lean_fwd__squint.png',
    'hero/lean_in__delighted': A + 'hero/lean_in__delighted.png',
    'hero/look_around__curious': A + 'hero/look_around__curious.png',
    'hero/look_hands__down': A + 'hero/look_hands__down.png',
    'hero/point__indignant': A + 'hero/point__indignant.png',
    'hero/recoil__surprised': A + 'hero/recoil__surprised.png',
    'hero/rub_hands__smug': A + 'hero/rub_hands__smug.png',
    'hero/scratch_head__puzzled': A + 'hero/scratch_head__puzzled.png',
    'hero/shout_jump__yell': A + 'hero/shout_jump__yell.png',
    'hero/sit_rub__pain': A + 'hero/sit_rub__pain.png',
    'hero/stand__curious': A + 'hero/stand__curious.png',
    'hero/stand__squint': A + 'hero/stand__squint.png',
    'hero/stand_back__curious': A + 'hero/stand_back__curious.png',
    'hero/startle__shock': A + 'hero/startle__shock.png',
    'hero/startle__shock_excited': A + 'hero/startle__shock_excited.png',
    'hero/stomp__indignant': A + 'hero/stomp__indignant.png',
    'hero/stomp__yell': A + 'hero/stomp__yell.png',
    'hero/thumb_self__talk_smug': A + 'hero/thumb_self__talk_smug.png',
    'hero/tiptoe__squint': A + 'hero/tiptoe__squint.png',
    'hero/walk__whistle': A + 'hero/walk__whistle.png',
    'hero/walk_back__curious': A + 'hero/walk_back__curious.png',
    'hero/walk_whistle__whistle': A + 'hero/walk_whistle__whistle.png',
    /* 只有動作、沒有完全對上的表情時,退回同動作的第一張圖(避免向量與像素混在一起) */
    'e1/bow': A + 'e1/bow__polite_smile.png',
    'e1/conduct': A + 'e1/conduct__happy.png',
    'e1/declare': A + 'e1/declare__mysterious.png',
    'e1/explain': A + 'e1/explain__talk.png',
    'e1/hand_chest': A + 'e1/hand_chest__polite.png',
    'e1/hands_back': A + 'e1/hands_back__stern.png',
    'e1/peek': A + 'e1/peek__neutral.png',
    'e1/raise_brow': A + 'e1/raise_brow__raise_brow.png',
    'e1/stroke_beard': A + 'e1/stroke_beard__neutral.png',
    'e1/surprised': A + 'e1/surprised__surprised.png',
    'e2/lean_lazy': A + 'e2/lean_lazy__half.png',
    'e2/lean_peek': A + 'e2/lean_peek__surprised.png',
    'e2/one_finger_up': A + 'e2/one_finger_up__happy.png',
    'e2/raise_finger': A + 'e2/raise_finger__lazy_smirk.png',
    'e2/shrug': A + 'e2/shrug__deadpan.png',
    'e2/slow_turn': A + 'e2/slow_turn__half.png',
    'e2/talk_lazy': A + 'e2/talk_lazy__talk_flat.png',
    'e2/wave_lazy': A + 'e2/wave_lazy__happy.png',
    'e2/yawn_stretch': A + 'e2/yawn_stretch__yawn.png',
    'e3/arms_crossed': A + 'e3/arms_crossed__deadpan.png',
    'e3/flex_double': A + 'e3/flex_double__grin.png',
    'e3/knuckle_crack': A + 'e3/knuckle_crack__mysterious.png',
    'e3/look_down': A + 'e3/look_down__bored.png',
    'e3/one_leg': A + 'e3/one_leg__grin.png',
    'e3/pick_ear': A + 'e3/pick_ear__bored.png',
    'e3/shock_back': A + 'e3/shock_back__shock_peek.png',
    'e3/talk_point': A + 'e3/talk_point__talk.png',
    'e3/thumbs_up': A + 'e3/thumbs_up__grin.png',
    'hero/akimbo': A + 'hero/akimbo__arrogant.png',
    'hero/angry_fists': A + 'hero/angry_fists__rage.png',
    'hero/awkward': A + 'hero/awkward__awkward.png',
    'hero/boast': A + 'hero/boast__proud.png',
    'hero/collapse': A + 'hero/collapse__dizzy.png',
    'hero/count': A + 'hero/count__talk_smug.png',
    'hero/fist_up': A + 'hero/fist_up__furious.png',
    'hero/freeze': A + 'hero/freeze__dead_stare.png',
    'hero/freeze_finger': A + 'hero/freeze_finger__sweat_realize.png',
    'hero/hold_head': A + 'hero/hold_head__dizzy.png',
    'hero/lean_fwd': A + 'hero/lean_fwd__squint.png',
    'hero/lean_in': A + 'hero/lean_in__delighted.png',
    'hero/look_around': A + 'hero/look_around__curious.png',
    'hero/look_hands': A + 'hero/look_hands__down.png',
    'hero/point': A + 'hero/point__indignant.png',
    'hero/recoil': A + 'hero/recoil__surprised.png',
    'hero/rub_hands': A + 'hero/rub_hands__smug.png',
    'hero/scratch_head': A + 'hero/scratch_head__puzzled.png',
    'hero/shout_jump': A + 'hero/shout_jump__yell.png',
    'hero/sit_rub': A + 'hero/sit_rub__pain.png',
    'hero/stand': A + 'hero/stand__curious.png',
    'hero/stand_back': A + 'hero/stand_back__curious.png',
    'hero/startle': A + 'hero/startle__shock.png',
    'hero/stomp': A + 'hero/stomp__indignant.png',
    'hero/thumb_self': A + 'hero/thumb_self__talk_smug.png',
    'hero/tiptoe': A + 'hero/tiptoe__squint.png',
    'hero/walk': A + 'hero/walk__whistle.png',
    'hero/walk_back': A + 'hero/walk_back__curious.png',
    'hero/walk_whistle': A + 'hero/walk_whistle__whistle.png',
  };

  /* ---------- 逐格動畫(2026-11-20,36 號文件 ChatGPT 交付;匯入時已把待機/眨眼/說話/嘴型格對齊到基準格) ----------
     圖:assets/prologue/anim/角色/動作.png = 一排 N 格(每格 256×384,腳底 y=379)。
     ─ CLIPS[角色][key]:進入「姿勢__表情」(或只寫姿勢 = 任何表情)時自動播放。
         n 格數、fps、loop 循環(走路/揮手…);不循環的播完停在最後一格(hold)。sc = 這一排畫得比較小,放大補正。
     ─ IDLE[角色][key]:沒在做別的事時的呼吸(2 格)+ 隨機眨眼(1 格)(目前只有主角)。
     ─ TALK[角色][key]:說話時嘴巴開合。strip = 2 格(閉/開);mouth = 單格「嘴張開」(匯入時已把嘴巴區域貼回原靜態圖,只有嘴會動),與該姿勢的靜態圖交替。
     ─ 沒登錄的姿勢:顯示靜態圖(ART)+ 輕微呼吸起伏(CSS)。減少動態:不播循環,一次性的直接停在最後一格。 */
  const M = 'assets/prologue/anim/';
  const CLIPS = {
    hero: {
      'walk__whistle': { src: 'hero/walk', n: 6, fps: 6, loop: 1 },
      'walk_whistle': { src: 'hero/walk-whistle', n: 6, fps: 6, loop: 1 },
      'walk_back': { src: 'hero/walk-back', n: 6, fps: 6, loop: 1 },
      'tiptoe': { src: 'hero/tiptoe', n: 4, fps: 3.5, loop: 1 },
      'recoil': { src: 'hero/recoil', n: 3, fps: 9 },
      'sit_rub': { src: 'hero/fall-sit', n: 4, fps: 7 },
      'shout_jump': { src: 'hero/shout-jump', n: 4, fps: 7, sc: 1.15, seq: [0, 0, 1, 2, 2, 2, 3] },
      'stomp': { src: 'hero/stomp', n: 3, fps: 6, sc: 1.05, seq: [0, 0, 1, 1, 2] },
      'collapse': { src: 'hero/spin-collapse', n: 5, fps: 8 }
    },
    e1: {
      'conduct': { src: 'e1/conduct', n: 4, fps: 4, sc: 1.1 },
      'bow': { src: 'e1/bow', n: 3, fps: 5 },
      'peek': { src: 'e1/peek', n: 3, fps: 5 }
    },
    e2: {
      'yawn_stretch': { src: 'e2/yawn-stretch', n: 4, fps: 4, sc: 1.07 },
      'slow_turn': { src: 'e2/slow-turn', n: 3, fps: 2.5 },
      'wave_lazy': { src: 'e2/wave', n: 3, fps: 4, loop: 1, seq: [0, 1, 2, 1] }
    },
    e3: {
      'knuckle_crack': { src: 'e3/knuckle-crack', n: 3, fps: 5, seq: [0, 1, 2, 1, 2] },
      'flex_double': { src: 'e3/flex', n: 4, fps: 6 },
      'one_leg': { src: 'e3/one-leg', n: 3, fps: 5, sc: 1.03 },
      'shock_back': { src: 'e3/shock-back', n: 3, fps: 8 }
    }
  };
  const IDLE = {
    hero: { 'stand__curious': { src: 'hero/idle', blink: 'hero/blink' }, 'stand__neutral': { src: 'hero/idle', blink: 'hero/blink' } }
    /* 三位老人的待機/眨眼格是重畫的(大小、角度不同),交替會抖,不採用;改用 CSS 呼吸。見 38 號文件與回報。 */
  };
  const TALK = {
    hero: { boast: { strip: 'hero/talk-boast' }, point: { strip: 'hero/talk-point' }, akimbo: { strip: 'hero/talk-akimbo' },
      count__talk_smug: { mouth: 'hero/mouth-count' }, thumb_self: { mouth: 'hero/mouth-thumb-self' }, rub_hands: { mouth: 'hero/mouth-rub-hands' } },
    e1: { hand_chest: { mouth: 'e1/mouth-hand-chest' } },
    e2: { talk_lazy: { strip: 'e2/talk-lazy' }, shrug: { mouth: 'e2/mouth-shrug' }, raise_finger: { mouth: 'e2/mouth-raise-finger' } },
    e3: { talk_point: { strip: 'e3/talk-point' } }
  };
  const pick = (tbl, pose, face) => tbl && (tbl[`${pose}__${face}`] || tbl[pose]);
  const url = s => M + s + '.png';
  /* 預先載入並解碼(開場一開始就呼叫;不擋流程) */
  let preloaded = null;
  function preload() {
    if (preloaded) return preloaded;
    const set = new Set(Object.values(ART));
    for (const T of [CLIPS, IDLE, TALK]) for (const id in T) for (const k in T[id]) { const o = T[id][k]; ['src', 'blink', 'mouth', 'strip'].forEach(f => o[f] && set.add(url(o[f]))); }
    preloaded = Promise.all([...set].map(s => { const im = new Image(); im.src = s; return (im.decode ? im.decode() : Promise.resolve()).catch(() => { }); }));
    return preloaded;
  }
  /* 全部角色共用一個 requestAnimationFrame(分頁不可見時瀏覽器會自動暫停) */
  const ticking = new Set(); let raf = 0;
  function loop(t) { raf = 0; for (const a of ticking) a(t); if (ticking.size) raf = requestAnimationFrame(loop); }
  function wake(fn) { ticking.add(fn); if (!raf) raf = requestAnimationFrame(loop); }
  const isReduced = el => el.classList.contains('pc-reduced') || document.documentElement.classList.contains('mm-reduce') || matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 調色盤 ---------- */
  const KEYS = ['o', 'skin', 'hair', 'top', 'top2', 'acc', 'pants', 'shoe', 'hat', 'hat2', 'lens', 'line', 'mouth', 'eyew', 'blush'];
  const PAL = {
    hero: { o: '#2b1d16', skin: '#f0c6a0', hair: '#d9d6d0', top: '#8b5a33', top2: '#3c4054', acc: '#d9b26f', pants: '#3b3b48', shoe: '#6a4424', hat: '#000', hat2: '#000', lens: '#000', line: '#6d4526', mouth: '#7a2e2e', eyew: '#ffffff', blush: '#f0907a' },
    e1: { o: '#2a1418', skin: '#f1c8a4', hair: '#f4f4f1', top: '#8e2a38', top2: '#fbfbf6', acc: '#2f7d48', pants: '#7c2531', shoe: '#2b1a14', hat: '#000', hat2: '#000', lens: '#000', line: '#c86e7c', mouth: '#7a2e2e', eyew: '#ffffff', blush: '#f0907a' },
    e2: { o: '#2a2018', skin: '#efc29a', hair: '#bdbab3', top: '#f6f5ef', top2: '#d8d2c0', acc: '#6b4a2a', pants: '#c9ad76', shoe: '#5a3d26', hat: '#000', hat2: '#000', lens: '#bfe3ff', line: '#cfc8b4', mouth: '#7a2e2e', eyew: '#ffffff', blush: '#f0907a' },
    e3: { o: '#1d1a22', skin: '#e2a676', hair: '#333333', top: '#e2a676', top2: '#c98a5e', acc: '#f3c22f', pants: '#7c40b2', shoe: '#3b3b3b', hat: '#6e8ea8', hat2: '#f5f5f2', lens: '#16161c', line: '#b97a52', mouth: '#6e2a2a', eyew: '#ffffff', blush: '#f0907a' }
  };
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  function variant(p, kind) {
    const out = {};
    for (const k of KEYS) {
      const [r, g, b] = hex(p[k]), L = .3 * r + .59 * g + .11 * b;
      if (kind === 'mono') out[k] = toHex([L, L, L * 1.02]);
      else if (kind === 'shadow') out[k] = toHex([L * .32 + 8, L * .32 + 9, L * .32 + 16]);
      else if (kind === 'dark') out[k] = k === 'o' ? '#040408' : toHex([12 + L * .05, 12 + L * .05, 20 + L * .06]);
      else out[k] = p[k];
    }
    return out;
  }
  let registered = false;
  function register() {
    if (registered) return; registered = true;
    if (!window.CSS || !CSS.registerProperty) return;
    for (const k of KEYS) { try { CSS.registerProperty({ name: '--k' + k, syntax: '<color>', inherits: true, initialValue: '#000' }); } catch (e) { } }
  }

  /* ---------- 繪圖小工具 ---------- */
  const OUT = 'stroke:var(--ko);stroke-width:3px;stroke-linejoin:round';
  const F = c => `style="fill:var(--k${c});${OUT}"`;
  const FN = c => `style="fill:var(--k${c})"`;
  const S = (c, w) => `style="fill:none;stroke:var(--k${c});stroke-width:${w}px;stroke-linecap:round;stroke-linejoin:round"`;
  const limb = (x1, y1, x2, y2, w, c) => `<path d="M${x1} ${y1}L${x2} ${y2}" ${S('o', w + 6)}/><path d="M${x1} ${y1}L${x2} ${y2}" ${S(c, w)}/>`;
  const cloud = (cs, c) => cs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 3}" ${FN('o')}/>`).join('') + cs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" ${FN(c)}/>`).join('');

  /* 每位角色的身體參數 */
  const BODY = {
    hero: { sleeve: 'top', fore: 'top', aw: 15, hipL: 88, hipR: 112, thigh: 'pants', shin: 'pants', lw: 18, eyeY: 83, mouthY: 101, browC: 'o', browW: 3.2 },
    e1: { sleeve: 'top', fore: 'top', aw: 14, hipL: 89, hipR: 111, thigh: 'pants', shin: 'pants', lw: 16, eyeY: 80, mouthY: 106, browC: 'hair', browW: 5.5 },
    e2: { sleeve: 'top', fore: 'skin', aw: 15, hipL: 86, hipR: 114, thigh: 'pants', shin: 'pants', lw: 19, eyeY: 83, mouthY: 103, browC: 'hair', browW: 4 },
    e3: { sleeve: 'skin', fore: 'skin', aw: 19, hipL: 87, hipR: 113, thigh: 'pants', shin: 'skin', lw: 20, eyeY: 93, mouthY: 108, browC: 'o', browW: 3.6 }
  };
  let uid = 0;

  function armSVG(id, side) {
    const B = BODY[id], x = side === 'L' ? (id === 'e3' ? 64 : 70) : (id === 'e3' ? 136 : 130), y = 128;
    const cuff = id === 'e1' ? `<path d="M${x - 7} 187h14" ${S('top2', 4)}/>` : id === 'hero' ? `<path d="M${x - 7} 186h14" ${S('line', 3)}/>` : '';
    return `<g class="pc-a${side}" style="transform-origin:${x}px ${y}px"><g class="pc-wa${side}" style="transform-origin:${x}px ${y}px">
      ${limb(x, y, x, y + 34, B.aw, B.sleeve)}
      <g class="pc-f${side}" style="transform-origin:${x}px ${y + 34}px">
        ${limb(x, y + 34, x, y + 62, B.aw - 2, B.fore)}${cuff}
        <g class="pc-h${side}">
          <circle cx="${x}" cy="${y + 70}" r="8.5" ${F('skin')}/>
          <path class="hd-pt" d="M${x} ${y + 74}l0 12" ${S('o', 8)}/><path class="hd-pt" d="M${x} ${y + 74}l0 12" ${S('skin', 4)}/>
          <path class="hd-th" d="M${x} ${y + 66}l${side === 'L' ? 11 : -11} -4" ${S('o', 8)}/><path class="hd-th" d="M${x} ${y + 66}l${side === 'L' ? 11 : -11} -4" ${S('skin', 4)}/>
          <path class="hd-fist" d="M${x - 5} ${y + 68}h10M${x - 5} ${y + 72}h10" ${S('o', 1.6)}/>
        </g>
      </g></g></g>`;
  }
  function legSVG(id, side) {
    const B = BODY[id], x = side === 'L' ? B.hipL : B.hipR, y = 196, ft = side === 'L' ? -1 : 1;
    const thigh = id === 'e3' ? limb(x, y, x, y + 30, 22, 'pants') + limb(x, y + 34, x, y + 44, 15, 'skin') : limb(x, y, x, y + 44, B.lw, B.thigh);
    return `<g class="pc-l${side}" style="transform-origin:${x}px ${y}px"><g class="pc-wl${side}" style="transform-origin:${x}px ${y}px">
      ${thigh}
      <g class="pc-s${side}" style="transform-origin:${x}px ${y + 44}px">
        ${limb(x, y + 44, x, y + 86, id === 'e3' ? 15 : B.lw - 1, B.shin)}
        <ellipse class="ftf" cx="${x + ft * 5}" cy="${y + 92}" rx="13" ry="7" ${F('shoe')}/>
        <ellipse class="fts" cx="${x + 8}" cy="${y + 92}" rx="15" ry="7" ${F('shoe')}/>
        ${id === 'e3' ? `<path class="ftf" d="M${x + ft * 5 - 8} ${y + 89}h16" ${S('hat2', 2)}/>` : ''}
      </g></g></g>`;
  }
  function torsoSVG(id, k) {
    if (id === 'hero') return {
      back: '', body: `<path d="M68 124Q100 112 132 124L137 202L63 202Z" ${F('top')}/>`,
      front: `<path d="M90 121L110 121L104 202L96 202Z" ${F('top2')}/><path d="M90 121L99 152M110 121L101 152" ${S('o', 3)}/>
        <circle cx="92" cy="168" r="3" ${F('acc')}/><circle cx="92" cy="186" r="3" ${F('acc')}/><path d="M72 172h12M116 172h12" ${S('line', 3)}/>`,
      backD: `<path d="M100 126V200M76 196h48" ${S('line', 3)}/>`
    };
    if (id === 'e1') return {
      body: `<clipPath id="pcc${k}"><path d="M70 124Q100 114 130 124L135 202L65 202Z"/></clipPath>
        <path d="M70 124Q100 114 130 124L135 202L65 202Z" ${F('top')}/>
        <g clip-path="url(#pcc${k})" style="opacity:.75"><path d="M78 120V204M90 120V204M110 120V204M122 120V204M62 142H138M62 162H138M62 182H138" ${S('line', 2)}/></g>
        <path d="M70 124Q100 114 130 124L135 202L65 202Z" style="fill:none;${OUT}"/>`,
      front: `<path d="M89 121L111 121L100 160Z" ${F('top2')}/><path d="M97 126L103 126L107 152L100 162L93 152Z" ${F('acc')}/>
        <path d="M89 121L98 158M111 121L102 158" ${S('o', 3)}/><path d="M114 140l9 0l-4 -7z" ${F('top2')}/>
        <circle cx="96" cy="176" r="2.6" ${F('o')}/><circle cx="96" cy="190" r="2.6" ${F('o')}/>`,
      backD: `<path d="M100 126V200" ${S('o', 2)}/>`
    };
    if (id === 'e2') return {
      body: `<path d="M71 124Q100 116 129 124Q146 168 131 202L69 202Q54 168 71 124Z" ${F('top')}/>`,
      front: `<path d="M88 121L100 136L112 121L104 118L100 126L96 118Z" ${F('top2')}/><path d="M100 136V190" ${S('line', 2.5)}/>
        <circle cx="100" cy="150" r="2.4" ${F('line')}/><circle cx="100" cy="166" r="2.4" ${F('line')}/><circle cx="100" cy="182" r="2.4" ${F('line')}/>
        <path d="M112 144h12v10h-12z" ${F('top')}/>`,
      backD: `<path d="M84 140Q100 146 116 140" ${S('line', 2.5)}/>`,
      over: `<rect x="68" y="193" width="64" height="9" rx="2" ${F('acc')}/><rect x="95" y="192" width="10" height="11" rx="2" ${F('hat2')}/>`
    };
    return {   /* e3 鯊BEE:赤膊、金項鍊、肌肉 */
      body: `<path d="M58 126Q100 110 142 126L131 202L69 202Z" ${F('skin')}/>`,
      front: `<path d="M72 148Q86 158 99 148M101 148Q114 158 128 148" ${S('o', 3)}/><path d="M100 150V190M88 166h24M89 180h22" ${S('line', 2.5)}/>
        <circle class="pc-navel" cx="100" cy="193" r="2.6" ${F('line')}/>
        <path d="M80 122Q100 152 120 122" ${S('o', 7)}/><path d="M80 122Q100 152 120 122" ${S('acc', 4)}/><circle cx="100" cy="140" r="6" ${F('acc')}/>`,
      backD: `<path d="M78 140Q100 150 122 140M100 130V196" ${S('line', 2.5)}/>`,
      over: `<path d="M68 192H132L134 206H66Z" ${F('pants')}/>`
    };
  }
  function headSVG(id) {
    const ears = `<circle cx="66" cy="${id === 'e3' ? 96 : 86}" r="7.5" ${F('skin')}/><circle cx="134" cy="${id === 'e3' ? 96 : 86}" r="7.5" ${F('skin')}/>`;
    const skull = `<circle cx="100" cy="80" r="34" ${F('skin')}/>`;
    if (id === 'hero') return {
      behind: `<path d="M63 78L56 62L69 63L64 46L80 52L82 35L95 46L102 31L110 46L123 37L122 52L137 47L132 63L144 63L137 80Z" ${F('hair')}/>`,
      head: ears + skull,
      front: `<path d="M69 66Q76 47 92 52Q100 41 112 51Q125 47 131 66Q121 57 112 62Q104 53 96 61Q86 55 78 66Z" ${F('hair')}/>`,
      back: `<path d="M62 92L58 76L64 62L60 48L76 50L80 36L94 44L102 30L111 44L124 37L124 51L140 48L136 64L142 78L138 94Q100 112 62 92Z" ${F('hair')}/><path d="M80 60l8 10M110 54l-4 12M96 74l4 10" ${S('o', 2.2)}/>`
    };
    if (id === 'e1') return {
      behind: cloud([[68, 66, 17], [80, 46, 18], [100, 38, 19], [120, 46, 18], [132, 66, 17], [62, 86, 13], [138, 86, 13], [72, 30, 9], [130, 28, 9]], 'hair'),
      head: ears + skull,
      front: cloud([[84, 52, 10], [100, 48, 11], [116, 52, 10]], 'hair'),
      back: cloud([[68, 66, 18], [80, 46, 19], [100, 38, 20], [120, 46, 19], [132, 66, 18], [70, 88, 16], [100, 84, 22], [130, 88, 16]], 'hair')
    };
    if (id === 'e2') return {
      behind: '',
      head: ears + skull + `<path d="M82 56Q92 49 104 50" ${S('eyew', 4)} opacity=".55"/>`,
      front: cloud([[67, 76, 9], [65, 90, 8], [133, 76, 9], [135, 90, 8]], 'hair'),
      back: cloud([[67, 78, 10], [72, 94, 10], [86, 102, 10], [100, 104, 10], [114, 102, 10], [128, 94, 10], [133, 78, 10]], 'hair')
    };
    return {
      behind: `<path d="M93 34L112 2L121 36Z" ${F('hat')}/>`,
      head: ears + skull,
      front: `<path d="M60 84Q57 26 100 24Q143 26 140 84Z" ${F('hat')}/><path d="M64 72L70 82L76 72L82 82L88 72L94 82L100 72L106 82L112 72L118 82L124 72L130 82L136 72L136 68L64 68Z" ${F('hat2')}/>
        <circle cx="72" cy="52" r="3.4" ${F('o')}/><circle cx="128" cy="52" r="3.4" ${F('o')}/><path d="M76 40l-4 10M82 38l-4 10M118 38l4 10M124 40l4 10" ${S('o', 2)}/>`,
      back: `<path d="M60 92Q57 26 100 24Q143 26 140 92Q100 104 60 92Z" ${F('hat')}/><path d="M80 60Q100 70 120 60" ${S('o', 2)}/>`
    };
  }

  /* ---------- 表情 ---------- */
  function eye(type, cx, cy, side, p) {
    const [px, py] = p || [0, 0], k = side === 'L' ? 1 : -1;
    const white = (rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" style="fill:var(--keyew);stroke:var(--ko);stroke-width:2.2px"/>`;
    const pupil = r => `<circle cx="${cx + px}" cy="${cy + py}" r="${r}" ${FN('o')}/><circle cx="${cx + px + 1.2}" cy="${cy + py - 1.3}" r="1" style="fill:#fff"/>`;
    switch (type) {
      case 'dot': return `<circle cx="${cx + px}" cy="${cy + py}" r="3.4" ${FN('o')}/>`;
      case 'half': return white(5.5, 6) + pupil(3) + `<path d="M${cx - 7} ${cy - 8}h14v7h-14z" ${FN('skin')}/><path d="M${cx - 6.5} ${cy - 1}h13" ${S('o', 2.6)}/>`;
      case 'closed': return `<path d="M${cx - 5.5} ${cy}Q${cx} ${cy + 3.5} ${cx + 5.5} ${cy}" ${S('o', 2.8)}/>`;
      case 'happy': return `<path d="M${cx - 5.5} ${cy + 2}Q${cx} ${cy - 6} ${cx + 5.5} ${cy + 2}" ${S('o', 2.8)}/>`;
      case 'squint': return `<path d="M${cx - 5 * k} ${cy - 4}L${cx + 4 * k} ${cy}L${cx - 5 * k} ${cy + 4}" ${S('o', 2.8)}/>`;
      case 'wide': return white(7.5, 8) + `<circle cx="${cx + px}" cy="${cy + py}" r="2.1" ${FN('o')}/>`;
      case 'blank': return white(6.5, 6.5);
      case 'spiral': return `<path d="M${cx} ${cy}m-1 0a1 1 0 1 1 2 0a2.6 2.6 0 1 1 -5.2 0a4.2 4.2 0 1 1 8.4 0a5.8 5.8 0 1 1 -11.6 0" ${S('o', 1.8)}/>`;
      case 'star': return `<path d="M${cx} ${cy - 7}l2 5h5l-4 3l1.6 5l-4.6 -3l-4.6 3l1.6 -5l-4 -3h5z" style="fill:#ffd84d;stroke:var(--ko);stroke-width:1.5px"/>`;
      case 'angry': return white(5.5, 6) + pupil(3) + `<path d="M${cx - 7 * k} ${cy - 9}L${cx + 7 * k} ${cy - 9}L${cx + 7 * k} ${cy - 1}Z" ${FN('skin')}/><path d="M${cx - 7 * k} ${cy - 6}L${cx + 6 * k} ${cy - 1}" ${S('o', 2.6)}/>`;
      case 'tearful': return white(6, 6.5) + pupil(3.4) + `<path d="M${cx - 4} ${cy + 7}q4 3 8 0" ${S('lens', 2)}/>`;
      default: return white(5.5, 6.5) + pupil(3.2);   /* open */
    }
  }
  function brow(type, x, y, side, c, w) {
    const k = side === 'L' ? 1 : -1, st = S(c, w);
    const out = c === 'o' ? '' : `<path d="__" ${S('o', w + 2.5)}/>`;
    let d;
    switch (type) {
      case 'up': d = `M${x - 6} ${y - 1}Q${x} ${y - 7} ${x + 6} ${y - 1}`; break;
      case 'down': d = `M${x - 6 * k} ${y - 4}L${x + 6 * k} ${y + 2}`; break;
      case 'worry': d = `M${x - 6 * k} ${y + 2}L${x + 6 * k} ${y - 4}`; break;
      case 'r1': d = side === 'R' ? `M${x - 6} ${y - 4}Q${x} ${y - 10} ${x + 6} ${y - 5}` : `M${x - 6} ${y}h12`; break;
      case 'flat': d = `M${x - 6} ${y}h12`; break;
      case 'none': return '';
      default: d = `M${x - 6} ${y}Q${x} ${y - 3} ${x + 6} ${y}`;
    }
    return out.replace('__', d) + `<path d="${d}" ${st}/>`;
  }
  function mouth(type, y) {
    const M = FN('mouth'), O = 'stroke:var(--ko);stroke-width:2.4px;stroke-linejoin:round';
    switch (type) {
      case 'flat': return `<path d="M93 ${y}h14" ${S('o', 2.8)}/>`;
      case 'smile': return `<path d="M91 ${y - 2}Q100 ${y + 6} 109 ${y - 2}" ${S('o', 2.8)}/>`;
      case 'grin': return `<path d="M89 ${y - 3}Q100 ${y + 13} 111 ${y - 3}Z" style="fill:var(--kmouth);${O}"/><path d="M91 ${y - 2}h18v3h-18z" style="fill:#fff"/>`;
      case 'open': return `<ellipse cx="100" cy="${y + 1}" rx="6" ry="5" style="fill:var(--kmouth);${O}"/>`;
      case 'o': return `<circle cx="100" cy="${y + 1}" r="3.6" style="fill:var(--kmouth);${O}"/>`;
      case 'shout': return `<path d="M87 ${y - 5}L113 ${y - 5}L107 ${y + 12}L93 ${y + 12}Z" style="fill:var(--kmouth);${O}"/><path d="M95 ${y + 9}q5 -5 10 0" style="fill:#e0787a"/>`;
      case 'wave': return `<path d="M89 ${y}q3 -3 5.5 0t5.5 0t5.5 0t5.5 0" ${S('o', 2.6)}/>`;
      case 'teeth': return `<rect x="89" y="${y - 4}" width="22" height="9" rx="2" style="fill:#fff;${O}"/><path d="M89 ${y + .5}h22M95 ${y - 4}v9M100 ${y - 4}v9M105 ${y - 4}v9" ${S('o', 1.4)}/>`;
      case 'pout': return `<path d="M94 ${y + 2}Q100 ${y - 3} 106 ${y + 2}" ${S('o', 2.8)}/>`;
      case 'smirk': return `<path d="M91 ${y}Q102 ${y + 3} 109 ${y - 5}" ${S('o', 2.8)}/>`;
      case 'tiny': return `<circle cx="100" cy="${y}" r="1.8" ${FN('o')}/>`;
      case 'yawn': return `<ellipse cx="100" cy="${y + 3}" rx="7" ry="10" style="fill:var(--kmouth);${O}"/>`;
      case 'frown': return `<path d="M92 ${y + 3}Q100 ${y - 4} 108 ${y + 3}" ${S('o', 2.8)}/>`;
      case 'whistle': return `<circle cx="104" cy="${y}" r="3" style="fill:var(--kmouth);${O}"/>`;
      case 'talk': return `<g class="pc-mth"><ellipse cx="100" cy="${y + 1}" rx="5.5" ry="4" style="fill:var(--kmouth);${O}"/></g>`;
      default: return `<path d="M93 ${y}Q100 ${y + 3} 107 ${y}" ${S('o', 2.8)}/>`;
    }
  }
  function extras(list, B, k) {
    let s = '';
    for (const x of list || []) {
      if (x === 'blush') s += `<ellipse cx="78" cy="${B.eyeY + 12}" rx="6" ry="3" style="fill:var(--kblush);opacity:.75"/><ellipse cx="122" cy="${B.eyeY + 12}" rx="6" ry="3" style="fill:var(--kblush);opacity:.75"/>`;
      if (x === 'sweat') s += `<path class="pc-sweat" d="M129 56Q135 66 129 71Q123 66 129 56Z" style="fill:#8fd3ff;stroke:var(--ko);stroke-width:2px"/>`;
      if (x === 'vein') s += `<g transform="translate(124 62)"><path d="M-7 -2q4 0 4 -5M2 -7q0 4 5 4M7 2q-4 0 -4 5M-2 7q0 -4 -5 -4" style="fill:none;stroke:#e0303a;stroke-width:3px;stroke-linecap:round"/></g>`;
      if (x === 'shade') s += `<g clip-path="url(#pch${k})"><path d="M60 ${B.eyeY + 7}Q100 ${B.eyeY - 1} 140 ${B.eyeY + 7}L140 0L60 0Z" style="fill:#0a0614;opacity:.55"/></g>`;
      if (x === 'gloom') s += `<path d="M84 58v10M92 56v13M100 56v13M108 58v10" style="fill:none;stroke:#7a6ad8;stroke-width:3px;stroke-linecap:round;opacity:.85"/>`;
      if (x === 'tear') s += `<path d="M84 ${B.eyeY + 7}q-2 6 1 9q3 -3 1 -9z" style="fill:#8fd3ff;stroke:var(--ko);stroke-width:1.5px"/>`;
    }
    return s;
  }
  function faceSVG(id, f, k) {
    const B = BODY[id], ey = B.eyeY, by = ey - (id === 'e3' ? 11 : 15);
    let s = '';
    const eyes = () => eye(f.e, 86, ey, 'L', f.p) + eye(f.e, 114, ey, 'R', f.p);
    if (id === 'e3') {
      const dy = f.peek ? 13 : 0;
      if (f.peek) s += eyes();
      s += brow(f.b, 86, by - (f.peek ? 2 : 0), 'L', B.browC, B.browW) + brow(f.b, 114, by - (f.peek ? 2 : 0), 'R', B.browC, B.browW);
      s += `<g transform="translate(0 ${dy})"><path d="M70 ${ey - 7}H130V${ey + 1}Q130 ${ey + 10} 118 ${ey + 10}Q105 ${ey + 10} 103 ${ey + 1}H97Q95 ${ey + 10} 82 ${ey + 10}Q70 ${ey + 10} 70 ${ey + 1}Z" style="fill:var(--klens);${OUT}"/>
        <path class="pc-gl" d="M76 ${ey - 3}l6 6M110 ${ey - 3}l6 6" style="fill:none;stroke:#fff;stroke-width:2.6px;stroke-linecap:round"/></g>`;
    } else {
      s += eyes() + brow(f.b, 86, by, 'L', B.browC, B.browW) + brow(f.b, 114, by, 'R', B.browC, B.browW);
      if (id === 'e2') s += `<circle cx="86" cy="${ey}" r="10" style="fill:var(--klens);fill-opacity:.22;${OUT}"/><circle cx="114" cy="${ey}" r="10" style="fill:var(--klens);fill-opacity:.22;${OUT}"/>
        <path d="M96 ${ey}h8M76 ${ey - 2}l-10 2M124 ${ey - 2}l10 2" ${S('o', 3)}/><path class="pc-gl" d="M80 ${ey - 4}l4 -3M108 ${ey - 4}l4 -3" style="fill:none;stroke:#fff;stroke-width:2.6px;stroke-linecap:round"/>`;
      if (id === 'e1') s += `<circle class="pc-gl pc-gl-eye" cx="86" cy="${ey}" r="2.2" style="fill:#ffe9a8"/><circle class="pc-gl pc-gl-eye" cx="114" cy="${ey}" r="2.2" style="fill:#ffe9a8"/>`;
      if (id === 'hero') s += `<circle class="pc-gl pc-gl-eye" cx="86" cy="${ey}" r="1.8" style="fill:#fff"/><circle class="pc-gl pc-gl-eye" cx="114" cy="${ey}" r="1.8" style="fill:#fff"/>`;
    }
    const ny = id === 'e3' ? ey + 11 : ey + 10;
    s += `<path d="M96 ${ny - 2}Q100 ${ny + 5} 104 ${ny - 2}" style="fill:var(--kskin);${OUT}"/>`;
    s += mouth(f.m, B.mouthY);
    if (id === 'e1') s += `<path d="M78 ${B.mouthY - 3}Q88 ${B.mouthY - 11} 100 ${B.mouthY - 6}Q112 ${B.mouthY - 11} 122 ${B.mouthY - 3}Q112 ${B.mouthY - 1} 100 ${B.mouthY - 4}Q88 ${B.mouthY - 1} 78 ${B.mouthY - 3}Z" ${F('hair')}/>
      <path d="M92 ${B.mouthY + 7}Q100 ${B.mouthY + 26} 108 ${B.mouthY + 7}Q100 ${B.mouthY + 11} 92 ${B.mouthY + 7}Z" ${F('hair')}/>`;
    return [s, extras(f.x, B, k)];
  }

  /* ---------- 姿勢與表情資料 ---------- */
  const P = (o) => Object.assign({ t: 0, h: 0, hx: 0, hy: 0, aL: [8, 0], aR: [-8, 0], lL: [3, 0], lR: [-3, 0], x: 0, y: 0, r: 0, sx: 1, sy: 1, v: 'f', hand: {}, anim: '' }, o);
  const POSES = {
    hero: {
      stand: P({}),
      stand_back: P({ v: 'b' }),
      walk: P({ v: 's', anim: 'walk', t: 4, aL: [0, -10], aR: [0, -10] }),
      walk_whistle: P({ v: 's', anim: 'walk', t: -4, h: -12, aL: [0, -20], aR: [0, -20] }),
      walk_back: P({ v: 'b', anim: 'walk' }),
      recoil: P({ v: 't', t: -8, h: -10, aL: [40, 30], aR: [-40, -30], y: -4, lL: [10, 0], lR: [-14, 10], hand: { L: 'o', R: 'o' } }),
      lean_in: P({ v: 's', t: 14, h: 8, aL: [20, -40], aR: [-30, -50], lL: [-6, 10], lR: [10, 0] }),
      rub_hands: P({ v: 't', t: 4, h: 6, aL: [18, -120], aR: [-18, 120] }),
      scratch_head: P({ v: 't', h: 10, aL: [10, 0], aR: [-150, -62], hand: { R: 'o' } }),
      lean_fwd: P({ v: 's', t: 16, h: 10, aL: [-10, -20], aR: [-20, -30] }),
      boast: P({ t: -6, h: -12, aL: [18, -125], aR: [-55, 60], hand: { R: 'th' } }),
      count: P({ v: 't', h: 14, aL: [34, -118], aR: [-30, 104], hand: { L: 'pt', R: 'o' } }),
      look_around: P({ v: 'f', anim: 'look', aL: [14, -40], aR: [-14, 40] }),
      sit_rub: P({ y: 72, aL: [-150, 62], aR: [-30, 40], lL: [78, -60], lR: [-78, 60], t: -6, h: -8 }),
      startle: P({ v: 't', t: -12, h: -14, y: -16, aL: [120, 20], aR: [-120, -20], lL: [26, -30], lR: [-10, 30], hand: { L: 'o', R: 'o' } }),
      point: P({ v: 's', t: 4, h: 0, aL: [10, -30], aR: [-88, -4], hand: { R: 'pt' } }),
      freeze_finger: P({ v: 't', h: -6, aL: [10, 0], aR: [-30, 150], hand: { R: 'pt' } }),
      tiptoe: P({ v: 's', t: 8, y: -8, aL: [60, -100], aR: [50, -100], lL: [-14, 22], lR: [16, 0], anim: 'tiptoe' }),
      akimbo: P({ t: -3, h: -10, aL: [42, -104], aR: [-42, 104], lL: [12, 0], lR: [-12, 0], hand: { L: 'fist', R: 'fist' } }),
      thumb_self: P({ t: -5, h: -12, aL: [42, -104], aR: [-24, 140], hand: { L: 'fist', R: 'th' } }),
      shout_jump: P({ t: -4, h: -14, y: -22, aL: [150, 10], aR: [-150, -10], lL: [20, -40], lR: [-20, 40], hand: { L: 'fist', R: 'fist' }, sy: 1.04 }),
      fist_up: P({ t: 6, h: 6, aL: [30, -110], aR: [-168, 0], lL: [16, 0], lR: [-22, 10], hand: { L: 'fist', R: 'fist' } }),
      stomp: P({ t: 2, h: 8, y: 2, aL: [36, 40], aR: [-36, -40], lL: [4, 0], lR: [-40, 70], hand: { L: 'fist', R: 'fist' }, sy: .97 }),
      angry_fists: P({ t: 0, h: 8, aL: [26, -60], aR: [-26, 60], lL: [12, 0], lR: [-12, 0], hand: { L: 'fist', R: 'fist' }, anim: 'shake', sy: .97 }),
      freeze: P({ v: 'f', aL: [4, 0], aR: [-4, 0], lL: [1, 0], lR: [-1, 0], sy: 1.01 }),
      awkward: P({ v: 't', t: -4, h: 12, aL: [10, 0], aR: [-130, -90], hand: { R: 'pt' } }),
      look_hands: P({ v: 'f', h: 18, hy: 3, aL: [14, -96], aR: [-14, 96], hand: { L: 'o', R: 'o' } }),
      hold_head: P({ v: 'f', t: 0, h: 0, aL: [150, 66], aR: [-150, -66], hand: { L: 'o', R: 'o' }, anim: 'woozy' }),
      collapse: P({ v: 'f', r: 84, x: -112, y: -14, aL: [100, 20], aR: [-20, 10], lL: [8, 10], lR: [-6, 10], h: 10 }),
      crouch: P({ v: 'b', y: 48, sy: .92, aL: [40, -60], aR: [-40, 60], lL: [56, -100], lR: [-56, 100] })
    },
    e1: {
      stand: P({ aL: [18, -80], aR: [-6, 0] }),
      hands_back: P({ v: 'f', aL: [-14, 30], aR: [14, -30], h: -4 }),
      hand_chest: P({ t: 4, h: 6, aL: [6, 0], aR: [-14, 118] }),
      raise_brow: P({ v: 't', h: -10, aL: [-14, 30], aR: [14, -30] }),
      explain: P({ v: 't', t: 3, h: 8, aL: [10, 0], aR: [-60, -50], hand: { R: 'o' } }),
      stroke_beard: P({ v: 't', h: -8, aL: [14, -96], aR: [-26, 152], hand: { R: 'o' } }),
      declare: P({ v: 't', t: -4, h: -6, aL: [14, -90], aR: [-158, 6], hand: { R: 'pt' } }),
      conduct: P({ t: -3, h: -16, aL: [118, 30], aR: [-118, -30], hand: { L: 'o', R: 'o' }, y: -4 }),
      bow: P({ t: 26, h: 14, aL: [-8, -70], aR: [-80, 120], hand: { R: 'o' }, lL: [6, 0], lR: [-6, 0] }),
      surprised: P({ t: -10, h: -10, aL: [40, 70], aR: [-40, -70], y: -6, hand: { L: 'o', R: 'o' } }),
      peek: P({ v: 't', t: 18, h: 16, aL: [-16, 30], aR: [16, -30] })
    },
    e2: {
      stand: P({ aL: [12, 0], aR: [-12, 0] }),
      lean_lazy: P({ r: -9, t: -6, h: -10, aL: [-28, 60], aR: [-6, 100], lL: [-10, 0], lR: [-24, 40] }),
      shrug: P({ h: 10, aL: [56, -110], aR: [-56, 110], hand: { L: 'o', R: 'o' }, sy: .98 }),
      yawn_stretch: P({ t: -6, h: -14, aL: [160, -20], aR: [-160, 20], y: -2, hand: { L: 'fist', R: 'fist' } }),
      talk_lazy: P({ v: 't', h: 8, aL: [10, 0], aR: [-40, 110], hand: { R: 'pt' } }),
      slow_turn: P({ v: 't', h: -16, t: -4, aL: [10, 10], aR: [-10, 10] }),
      raise_finger: P({ v: 't', h: 6, aL: [12, -90], aR: [-24, 156], hand: { R: 'pt' } }),
      one_finger_up: P({ h: -6, aL: [10, 0], aR: [-172, 0], hand: { R: 'pt' } }),
      wave_lazy: P({ h: 12, aL: [12, 0], aR: [-120, -40], hand: { R: 'o' }, anim: 'wave' }),
      lean_peek: P({ v: 't', t: 20, h: 18, aL: [6, 0], aR: [-30, 120], lL: [8, 0], lR: [-8, 0] })
    },
    e3: {
      stand: P({ aL: [20, 0], aR: [-20, 0], lL: [10, 0], lR: [-10, 0] }),
      arms_crossed: P({ h: -6, aL: [26, -118], aR: [-26, 118], lL: [12, 0], lR: [-12, 0] }),
      look_down: P({ h: 22, hy: 4, t: 6, aL: [22, -40], aR: [-22, 40], lL: [10, 0], lR: [-10, 0] }),
      talk_point: P({ v: 't', t: -4, aL: [22, -20], aR: [-90, 0], hand: { R: 'pt' }, lL: [10, 0], lR: [-10, 0] }),
      pick_ear: P({ v: 't', h: 14, aL: [22, 0], aR: [-140, -86], hand: { R: 'pt' }, lL: [10, 0], lR: [-10, 0] }),
      knuckle_crack: P({ t: 4, h: 8, aL: [30, -112], aR: [-30, 112], hand: { L: 'fist', R: 'fist' }, lL: [16, 0], lR: [-16, 0] }),
      flex_double: P({ h: -8, aL: [100, 100], aR: [-100, -100], hand: { L: 'fist', R: 'fist' }, lL: [18, 0], lR: [-18, 0], sy: 1.02 }),
      thumbs_up: P({ v: 't', t: -6, h: -8, aL: [22, -10], aR: [-82, 80], hand: { R: 'th' }, lL: [12, 0], lR: [-12, 0] }),
      one_leg: P({ t: -8, h: -12, aL: [130, 50], aR: [-60, 20], hand: { L: 'fist', R: 'o' }, lL: [6, 0], lR: [-60, -90] }),
      laugh: P({ t: -16, h: -22, aL: [30, -100], aR: [-30, 100], y: -2, anim: 'bounce' }),
      shock_back: P({ t: -14, h: -10, aL: [60, 80], aR: [-60, -80], y: -8, lL: [16, 0], lR: [-26, 20], hand: { L: 'o', R: 'o' } })
    }
  };
  const Fc = (e, b, m, x, extra) => Object.assign({ e, b, m, x: x || [] }, extra || {});
  const FACES = {
    hero: {
      neutral: Fc('open', 'n', 'neutral'), curious: Fc('open', 'up', 'o', [], { p: [1, -1] }), surprised: Fc('wide', 'up', 'o'),
      delighted: Fc('happy', 'up', 'grin', ['blush']), smug: Fc('half', 'r1', 'smirk'), puzzled: Fc('open', 'worry', 'wave', [], { p: [-1, -1] }),
      shock_excited: Fc('star', 'up', 'grin', ['blush']), proud: Fc('closed', 'up', 'smile', ['blush']), whistle: Fc('closed', 'up', 'whistle'),
      pain: Fc('squint', 'worry', 'teeth', ['tear']), squint: Fc('half', 'down', 'pout', [], { p: [2, 0] }), blank: Fc('blank', 'flat', 'tiny'),
      sweat_realize: Fc('dot', 'worry', 'flat', ['sweat']), indignant: Fc('angry', 'down', 'open'), arrogant: Fc('half', 'up', 'smirk', [], { p: [0, -1] }),
      yell: Fc('angry', 'down', 'shout'), furious: Fc('wide', 'down', 'shout', ['vein']), rage: Fc('angry', 'down', 'teeth', ['vein', 'shade']),
      dead_stare: Fc('dot', 'flat', 'flat', ['gloom']), awkward: Fc('dot', 'worry', 'wave', ['sweat', 'blush']), thinking: Fc('open', 'worry', 'pout', [], { p: [-2, -2] }),
      dizzy: Fc('spiral', 'worry', 'wave', ['sweat']), shock: Fc('wide', 'up', 'shout'), down: Fc('open', 'worry', 'o', [], { p: [0, 3] }),
      talk: Fc('open', 'n', 'talk'), talk_smug: Fc('half', 'r1', 'talk')
    },
    e1: {
      neutral: Fc('open', 'n', 'neutral'), polite: Fc('closed', 'up', 'smile'), raise_brow: Fc('half', 'r1', 'flat'), talk: Fc('open', 'n', 'talk'),
      polite_smile: Fc('happy', 'up', 'smile', ['blush']), mysterious: Fc('half', 'down', 'smirk', ['shade']), surprised: Fc('wide', 'up', 'o'),
      happy: Fc('happy', 'up', 'grin'), stern: Fc('half', 'down', 'flat'), talk_myst: Fc('half', 'down', 'talk', ['shade'])
    },
    e2: {
      sleepy: Fc('closed', 'flat', 'neutral'), yawn: Fc('closed', 'worry', 'yawn', ['tear']), talk_flat: Fc('half', 'flat', 'talk'), half: Fc('half', 'flat', 'flat'),
      deadpan: Fc('dot', 'flat', 'flat'), happy: Fc('happy', 'up', 'smile', ['blush']), surprised: Fc('open', 'up', 'o'), smile_closed: Fc('happy', 'n', 'smile'),
      lazy_smirk: Fc('half', 'r1', 'smirk'), mysterious: Fc('half', 'down', 'smirk', ['shade'])
    },
    e3: {
      deadpan: Fc('open', 'flat', 'flat'), bored: Fc('open', 'flat', 'pout'), grin: Fc('open', 'up', 'grin'), laugh: Fc('open', 'up', 'shout'),
      talk: Fc('open', 'n', 'talk'), shock_peek: Fc('wide', 'up', 'o', ['sweat'], { peek: 1 }), cool: Fc('open', 'down', 'smirk'),
      smirk: Fc('open', 'r1', 'smirk'), surprised: Fc('open', 'up', 'open'), mysterious: Fc('open', 'down', 'smirk', ['shade'])
    }
  };

  /* ---------- 頭上的符號 ---------- */
  const ORG = {
    heart: '<path d="M12 20C2 13 2 6 7 4c3 -1 5 1 5 3c0 -2 2 -4 5 -3c5 2 5 9 -5 16z" fill="#e85a6a" stroke="#2b1d16" stroke-width="1.6"/>',
    lung: '<path d="M11 4v8M11 10C6 8 3 13 4 19c3 1 6 0 7 -3zM13 10c5 -2 8 3 7 9c-3 1 -6 0 -7 -3z" fill="#f59ab0" stroke="#2b1d16" stroke-width="1.6"/>',
    stomach: '<path d="M9 3c0 4 -6 6 -5 12c1 6 12 7 15 2c2 -4 -3 -6 -6 -4c-2 -4 -1 -7 -1 -10z" fill="#f2b05e" stroke="#2b1d16" stroke-width="1.6"/>',
    bone: '<path d="M6 8a3 3 0 1 1 3 -3l8 8a3 3 0 1 1 -2 4a3 3 0 1 1 -4 -2l-8 -8a3 3 0 0 1 3 1z" fill="#f4f0e2" stroke="#2b1d16" stroke-width="1.6"/>',
    brain: '<path d="M5 15c-3 -1 -3 -6 0 -7c0 -4 5 -5 7 -3c2 -2 7 -1 7 3c3 1 3 6 0 7c-1 3 -5 3 -7 1c-2 2 -6 2 -7 -1z" fill="#f7a8c4" stroke="#2b1d16" stroke-width="1.6"/>'
  };
  const icon = k => `<svg viewBox="0 0 24 24" width="1em" height="1em">${ORG[k]}</svg>`;
  const EMOTES = {
    '!': '<b class="pce-bang">!</b>', '?': '<b class="pce-q">?</b>', '!!!': '<b class="pce-bang">!!!</b>', '?!': '<b class="pce-bang">?!</b>',
    '…': '<b class="pce-dots"><i>.</i><i>.</i><i>.</i></b>', stars: '<b class="pce-stars"><i>★</i><i>★</i><i>★</i></b>',
    anger: '<b class="pce-anger"><svg viewBox="-10 -10 20 20" width="1em" height="1em"><path d="M-7 -2q4 0 4 -5M2 -7q0 4 5 4M7 2q-4 0 -4 5M-2 7q0 -4 -5 -4" fill="none" stroke="#e8303a" stroke-width="2.6" stroke-linecap="round"/></svg></b>',
    sweat: '<b class="pce-sweat"><svg viewBox="0 0 12 16" width=".7em" height="1em"><path d="M6 1Q12 10 6 15Q0 10 6 1Z" fill="#8fd3ff" stroke="#2b1d16" stroke-width="1.4"/></svg></b>',
    note: '<b class="pce-note">♪</b>', spiral: '<b class="pce-spiral">@</b>',
    organs: '<b class="pce-org">' + ['lung', 'heart', 'stomach', 'bone', 'brain'].map(k => `<i>${icon(k)}</i>`).join('') + '<i>…</i></b>',
    steam: '<b class="pce-steam"><i></i><i></i><i></i></b>'
  };

  /* ---------- 建立角色 ---------- */
  function create(id) {
    register();
    const k = ++uid, T = torsoSVG(id, k), H = headSVG(id);
    const el = document.createElement('div');
    el.className = `pc pc-${id} v-f`; el.dataset.id = id;
    el.innerHTML = `<div class="pc-flip"><svg class="pc-svg" viewBox="0 0 200 300" aria-hidden="true">
      <ellipse class="pc-shadow" cx="100" cy="291" rx="44" ry="7"/>
      <g class="pc-root" style="transform-origin:100px 292px"><g class="pc-br" style="transform-origin:100px 292px">
        ${legSVG(id, 'L')}${legSVG(id, 'R')}
        <g class="pc-torso" style="transform-origin:100px 198px">
          ${armSVG(id, 'L')}
          <g class="pc-tb" style="transform-origin:100px 160px"><rect x="90" y="104" width="20" height="24" ${F('skin')}/>${T.body}<g class="pc-tf">${T.front}</g><g class="pc-tk">${T.backD || ''}</g>${T.over || ''}</g>
          <g class="pc-head" style="transform-origin:100px 118px"><g class="pc-hd2" style="transform-origin:100px 118px">
            <g class="pc-hbh">${H.behind}</g>${H.head}<g class="pc-face" style="transform-origin:100px 84px"></g><g class="pc-hfr">${H.front}</g><g class="pc-fx2"></g><clipPath id="pch${k}"><circle cx="100" cy="80" r="35"/></clipPath><g class="pc-hb">${H.back}</g>
          </g></g>
          ${armSVG(id, 'R')}
        </g>
      </g></g></svg><img class="pc-art" alt="" hidden><div class="pc-clip"></div></div><div class="pc-emote"></div>`;
    const q = s => el.querySelector(s), face = q('.pc-face'), fx2 = q('.pc-fx2'), emote = q('.pc-emote'), art = q('.pc-art'), clipEl = q('.pc-clip');
    const G = {}; ['root', 'torso', 'head', 'aL', 'fL', 'aR', 'fR', 'lL', 'sL', 'lR', 'sR'].forEach(n => G[n] = q('.pc-' + n));
    const st = { pose: null, face: null, pal: null };
    function setPal(kind) {
      if (st.pal === kind) return; st.pal = kind;
      const v = variant(PAL[id], kind); for (const key of KEYS) el.style.setProperty('--k' + key, v[key]);
      el.dataset.pal = kind;
    }
    function setPose(name) {
      const p = POSES[id][name] || POSES[id].stand || POSES[id][Object.keys(POSES[id])[0]];
      st.pose = name; el.dataset.pose = name;
      G.root.style.transform = `translate(${p.x}px,${p.y}px) rotate(${p.r}deg) scale(${p.sx},${p.sy})`;
      G.torso.style.transform = `rotate(${p.t}deg)`;
      G.head.style.transform = `translate(${p.hx}px,${p.hy}px) rotate(${p.h}deg)`;
      G.aL.style.transform = `rotate(${p.aL[0]}deg)`; G.fL.style.transform = `rotate(${p.aL[1]}deg)`;
      G.aR.style.transform = `rotate(${p.aR[0]}deg)`; G.fR.style.transform = `rotate(${p.aR[1]}deg)`;
      G.lL.style.transform = `rotate(${p.lL[0]}deg)`; G.sL.style.transform = `rotate(${p.lL[1]}deg)`;
      G.lR.style.transform = `rotate(${p.lR[0]}deg)`; G.sR.style.transform = `rotate(${p.lR[1]}deg)`;
      el.classList.remove('v-f', 'v-t', 'v-s', 'v-b'); el.classList.add('v-' + p.v);
      el.dataset.hl = p.hand.L || ''; el.dataset.hr = p.hand.R || '';
      el.dataset.anim = p.anim || '';
    }
    function setFace(name) {
      const f = FACES[id][name] || FACES[id][Object.keys(FACES[id])[0]];
      st.face = name; el.dataset.face = name; const [a, b] = faceSVG(id, f, k); face.innerHTML = a; fx2.innerHTML = b;
    }
    function setArt() {
      const src = ART[`${id}/${st.pose}__${st.face}`] || ART[`${id}/${st.pose}`];
      if (src) { if (art.getAttribute('src') !== src) art.src = src; art.hidden = false; el.classList.add('pc-has-art'); }
      else { art.hidden = true; el.classList.remove('pc-has-art'); }
    }
    /* ---- 逐格動畫 ---- */
    const an = { clip: null, t0: 0, idle: null, talkSet: null, talking: false, open: false, nextMouth: 0, nextBlink: 0, blinkUntil: 0, shown: '' };
    function show(src, n, i, sc) {
      if (!src) { if (an.shown) { an.shown = ''; el.classList.remove('pc-anim'); } return; }
      const key = src + '#' + i + '#' + (sc || 1);
      if (an.shown === key) return; an.shown = key;
      clipEl.style.backgroundImage = `url("${url(src)}")`;
      clipEl.style.backgroundSize = `${n * 100}% 100%`;
      clipEl.style.backgroundPosition = `${n > 1 ? (i / (n - 1)) * 100 : 0}% 0`;
      clipEl.style.transform = sc && sc !== 1 ? `scale(${sc})` : '';
      el.classList.add('pc-anim');
    }
    function resolve(started) {
      const p = st.pose, f = st.face;
      const c = pick(CLIPS[id], p, f);
      if (started) an.clip = c || null, an.t0 = performance.now();
      an.idle = pick(IDLE[id], p, f) || null;
      const t = pick(TALK[id], p, f); an.talkSet = t || null;
      if (isReduced(el)) {   /* 減少動態:靜止畫面,一次性動作直接停在最後一格 */
        if (an.clip) { const sq = an.clip.seq || [...Array(an.clip.n).keys()]; show(an.clip.src, an.clip.n, an.clip.loop ? sq[0] : sq[sq.length - 1], an.clip.sc); }
        else if (an.idle) show(an.idle.src, 2, 0); else show('');
        return;
      }
      if (an.clip || an.idle || (an.talking && an.talkSet)) wake(tick); else { show(''); ticking.delete(tick); }
    }
    function tick(t) {
      if (!el.isConnected) { ticking.delete(tick); return; }
      const c = an.clip;
      if (c) {
        const sq = c.seq || [...Array(c.n).keys()]; let k = Math.floor((t - an.t0) / 1000 * c.fps);
        if (c.loop) k %= sq.length; else if (k >= sq.length) k = sq.length - 1;
        show(c.src, c.n, sq[k], c.sc);
        if (c.loop || k < sq.length - 1) return;
        /* 一次性動作播完:若這個姿勢有說話/待機設定就交棒,否則停在最後一格 */
        if (!(an.talking && an.talkSet) && !an.idle) { ticking.delete(tick); return; }
        an.clip = null;
      }
      if (an.talking && an.talkSet) {
        if (t >= an.nextMouth) { an.open = !an.open; an.nextMouth = t + (an.open ? 110 + Math.random() * 90 : 90 + Math.random() * 110); }
        const s = an.talkSet;
        if (s.strip) show(s.strip, 2, an.open ? 1 : 0);
        else if (an.open) show(s.mouth, 1, 0);
        else show('');
        return;
      }
      if (an.idle && !an.talking) {   /* 說話但沒有嘴型圖:交給 CSS 點頭 */
        if (!an.nextBlink) an.nextBlink = t + 1800 + Math.random() * 2500;
        if (t >= an.nextBlink) { an.blinkUntil = t + 130; an.nextBlink = t + 2600 + Math.random() * 3200; }
        if (t < an.blinkUntil) show(an.idle.blink, 1, 0);
        else show(an.idle.src, 2, Math.floor(t / 1150) % 2);
        return;
      }
      show(''); ticking.delete(tick);
    }
    const actor = {
      el, id, st,
      set(o) {
        if (!o) return actor;
        if (o.ms != null) el.style.setProperty('--pc-ms', o.ms + 'ms');
        if (o.pal) setPal(o.pal);
        if (o.pose && o.pose !== st.pose) setPose(o.pose);
        if (o.face && o.face !== st.face) setFace(o.face);
        if (o.flip != null) el.classList.toggle('pc-flipped', !!o.flip);
        if (o.emote !== undefined) { const h = EMOTES[o.emote] || (o.emote ? `<b>${o.emote}</b>` : ''); if (emote.dataset.k !== (o.emote || '')) { emote.dataset.k = o.emote || ''; emote.innerHTML = h; } }
        if (o.glint != null) el.classList.toggle('pc-glints', !!o.glint);
        if (o.talk != null) el.classList.toggle('pc-talking', !!o.talk);
        if (o.fx !== undefined) el.dataset.fx = o.fx || '';
        const changed = (o.pose && o.pose !== prev.pose) || (o.face && o.face !== prev.face);
        if (o.pose || o.face) setArt();
        if (o.pose && o.pose !== prev.pose && prev.pose && !isReduced(el)) { el.classList.remove('pc-pop'); void el.offsetWidth; el.classList.add('pc-pop'); clearTimeout(an.popT); an.popT = setTimeout(() => el.classList.remove('pc-pop'), 340); }
        if (o.talk != null) an.talking = !!o.talk;
        if (changed || o.talk != null) resolve(changed);
        prev.pose = st.pose; prev.face = st.face;
        return actor;
      },
      destroy() { ticking.delete(tick); el.remove(); }
    };
    const prev = { pose: null, face: null };
    setPal('color'); setPose(Object.keys(POSES[id])[0]); setFace(Object.keys(FACES[id])[0]);
    return actor;
  }
  window.PrologueCast = { create, preload, POSES, FACES, EMOTES, PAL, ART, CLIPS, IDLE, TALK, variant };
})();
