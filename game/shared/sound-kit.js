/* sound-kit.js — 全遊戲共用的背景音樂與音效(2026-11-17 使用者:每間房間音樂都不一樣、地圖要放鬆的音樂、
   按鈕/滑鼠靠近可點的東西/切換畫面/轉場/互動都要有音效)。
   - 全部用 Web Audio 即時合成,不需要音樂檔。
   - 只在最上層頁面(index.html)建立一份;遊戲殼層與各房間 iframe 透過 window.top.SoundKit 共用同一份,
     所以換房間時音樂可以淡入淡出接續,音量與開關也只有一套。
   - 會自動避開教育內容的聲音:任何頁面在播放影片/音檔、語音朗讀,或房間自己的 Web Audio 聲音(例如房間四聽力的噪音示範)在響時,背景音樂自動降到幾乎無聲。
   使用:SoundKit.music("map" | "room1".."room7" | "home" | "character" | "ending" | "newyear" | null)
         SoundKit.sfx("click" | "hover" | "whoosh" | ...)
   設定存在 localStorage:memoryMazeMusic(on/off)、memoryMazeMusicVol、memoryMazeSfx(on/off,沿用)、memoryMazeSfxVol */
(function () {
  "use strict";
  if (window.SoundKit) return;
  try { if (window.top !== window && window.top.SoundKit) { window.SoundKit = window.top.SoundKit; return; } } catch (e) { }

  const AC = window.AudioContext || window.webkitAudioContext;
  /* 角色語氣:2026-11-18 晚起一律用機器人聲(robotEmote);真人錄音檔與載入程式已於 2026-11-20 整理時刪除 */
  const LS = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
  const SET = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };
  const cfg = {
    musicOn: LS("memoryMazeMusic", "on") !== "off",
    sfxOn: LS("memoryMazeSfx", "on") !== "off",
    musicVol: Math.max(0, Math.min(1, Number(LS("memoryMazeMusicVol", ".55")) || 0)),
    sfxVol: Math.max(0, Math.min(1, Number(LS("memoryMazeSfxVol", ".8")) || 0)),
    voiceVol: Math.max(0, Math.min(1, Number(LS("memoryMazeVoiceVol", ".9")))) || 0   /* 2026-11-18 語音(角色說話聲)獨立音量 */
  };

  let ctx = null, master, musicBus, sfxBus, voiceBus, duckGain, reverb, revSend, revRet;
  function ensure() {
    if (!AC) return null;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = .9;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      master.connect(comp); comp.connect(ctx.destination);
      duckGain = ctx.createGain(); duckGain.connect(master);
      musicBus = ctx.createGain(); musicBus.connect(duckGain);
      sfxBus = ctx.createGain(); sfxBus.connect(master);
      voiceBus = ctx.createGain(); voiceBus.connect(master);
      /* 簡單的殘響:合成的衰減雜訊當脈衝響應 */
      reverb = ctx.createConvolver();
      const len = Math.floor(ctx.sampleRate * 2.4), ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
      /* revRet:殘響回送;換場景時瞬間關掉,舊曲的殘響尾巴就不會疊到新曲上 */
      reverb.buffer = ir; revSend = ctx.createGain(); revSend.gain.value = .32; revRet = ctx.createGain(); revSend.connect(reverb); reverb.connect(revRet); revRet.connect(musicBus);
      applyVolumes();
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => { });
    return ctx;
  }
  function applyVolumes() {
    syncCinematic();
    if (!ctx) return;
    const t = ctx.currentTime;
    if (cinematic) { musicBus.gain.cancelScheduledValues(t); musicBus.gain.setValueAtTime(0, t); }
    else musicBus.gain.setTargetAtTime(cfg.musicOn ? cfg.musicVol * .55 : 0, t, .25);
    sfxBus.gain.setTargetAtTime(cfg.sfxOn ? cfg.sfxVol : 0, t, .05);
    voiceBus.gain.setTargetAtTime(cfg.sfxOn ? cfg.voiceVol : 0, t, .05);
  }
  const running = () => ctx && ctx.state === "running";
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  /* ======================= 樂器 ======================= */
  function env(g, t, a, peak, dur, rel) {
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, .0002), t + a);
    g.gain.setTargetAtTime(.0001, t + a + dur, rel);
  }
  function osc(type, f, t, stop, dest, detune) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; if (detune) o.detune.value = detune;
    o.connect(dest); o.start(t); o.stop(stop); return o;
  }
  /* inst(name, midi, t, dur, vel, out) */
  const INST = {
    musicbox(m, t, d, v, out) { const f = mtof(m), g = ctx.createGain(); env(g, t, .004, .22 * v, .02, .35); g.connect(out); osc("sine", f, t, t + 2, g); const g2 = ctx.createGain(); env(g2, t, .002, .06 * v, .01, .12); g2.connect(out); osc("sine", f * 4, t, t + 1, g2); },
    bell(m, t, d, v, out) { const f = mtof(m), g = ctx.createGain(); env(g, t, .003, .18 * v, .05, .6); g.connect(out); osc("sine", f, t, t + 3, g); const g2 = ctx.createGain(); env(g2, t, .002, .07 * v, .02, .25); g2.connect(out); osc("sine", f * 2.76, t, t + 2, g2); const g3 = ctx.createGain(); env(g3, t, .002, .03 * v, .01, .1); g3.connect(out); osc("sine", f * 5.4, t, t + 1, g3); },
    marimba(m, t, d, v, out) { const f = mtof(m), g = ctx.createGain(); env(g, t, .003, .26 * v, .01, .14); g.connect(out); osc("sine", f, t, t + 1.2, g); const g2 = ctx.createGain(); env(g2, t, .002, .08 * v, .005, .04); g2.connect(out); osc("sine", f * 4, t, t + .5, g2); },
    pluck(m, t, d, v, out) { const f = mtof(m), lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(f * 8, t); lp.frequency.exponentialRampToValueAtTime(f * 1.2, t + .3); lp.connect(out); const g = ctx.createGain(); env(g, t, .003, .16 * v, .02, .18); g.connect(lp); osc("triangle", f, t, t + 1.4, g); osc("sawtooth", f, t, t + 1.4, g, 6); },
    zheng(m, t, d, v, out) { const f = mtof(m), g = ctx.createGain(); env(g, t, .003, .2 * v, .03, .3); g.connect(out); const o = osc("triangle", f * 1.012, t, t + 2, g); o.frequency.setTargetAtTime(f, t + .01, .03); const g2 = ctx.createGain(); env(g2, t, .002, .05 * v, .01, .1); g2.connect(out); osc("sine", f * 3, t, t + 1, g2); },
    piano(m, t, d, v, out) { const f = mtof(m), lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(f * 6, t); lp.frequency.exponentialRampToValueAtTime(f * 2, t + .8); lp.connect(out); const g = ctx.createGain(); env(g, t, .004, .2 * v, Math.min(d, .4), .5); g.connect(lp); osc("triangle", f, t, t + d + 2.5, g); osc("sine", f * 2, t, t + d + 2.5, g, 3); },
    epiano(m, t, d, v, out) { const f = mtof(m), g = ctx.createGain(); env(g, t, .006, .17 * v, Math.min(d, .5), .45); g.connect(out); osc("sine", f, t, t + d + 2.5, g); const g2 = ctx.createGain(); env(g2, t, .003, .05 * v, .04, .15); g2.connect(out); osc("sine", f * 7, t, t + .8, g2); },
    flute(m, t, d, v, out) { const f = mtof(m), g = ctx.createGain(); env(g, t, .09, .1 * v, d * .8, .25); g.connect(out); const o = osc("sine", f, t, t + d + 1.5, g); const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5; lg.gain.value = f * .006; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t + .15); lfo.stop(t + d + 1.5); osc("triangle", f * 2, t, t + d + 1.5, g, 4); },
    pad(m, t, d, v, out) { const f = mtof(m), lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900; lp.connect(out); const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.045 * v, t + d * .35); g.gain.linearRampToValueAtTime(.035 * v, t + d * .85); g.gain.linearRampToValueAtTime(.0001, t + d + .6); g.connect(lp); osc("sawtooth", f, t, t + d + .8, g, -7); osc("sawtooth", f, t, t + d + .8, g, 7); osc("triangle", f / 2, t, t + d + .8, g); },
    bass(m, t, d, v, out) { const f = mtof(m), g = ctx.createGain(); env(g, t, .01, .2 * v, d * .6, .12); g.connect(out); osc("sine", f, t, t + d + .8, g); osc("triangle", f, t, t + d + .8, g); },
    shaker(m, t, d, v, out) { const n = noiseSrc(.08), hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 6000; const g = ctx.createGain(); env(g, t, .004, .05 * v, .01, .02); n.connect(hp); hp.connect(g); g.connect(out); n.start(t); n.stop(t + .1); },
    block(m, t, d, v, out) { const g = ctx.createGain(); env(g, t, .002, .16 * v, .005, .03); g.connect(out); osc("sine", 1200 + (m % 3) * 260, t, t + .12, g); },
    gong(m, t, d, v, out) { const f = mtof(m), g = ctx.createGain(); env(g, t, .01, .12 * v, .2, 1.2); g.connect(out); [1, 1.48, 2.1, 2.9].forEach((k, i) => osc("sine", f * k, t, t + 4, g, i * 4)); }
  };
  let noiseBuf = null;
  function noiseSrc(sec) {
    if (!noiseBuf) { const len = ctx.sampleRate * 2; noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; }
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = sec > 2; return s;
  }

  /* ---- 更多樂器(2026-11-17 第二版:讓每首歌的曲風真的不同) ---- */
  function nz(t, dur, type, freq, q, vol, out, a) {
    const n = noiseSrc(dur), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = type; f.frequency.value = freq; f.Q.value = q; env(g, t, a || .002, vol, .005, dur / 3);
    n.connect(f); f.connect(g); g.connect(out); n.start(t); n.stop(t + dur + .3);
  }
  Object.assign(INST, {
    chip(m, t, d, v, out) { const f = mtof(m), g = ctx.createGain(); env(g, t, .004, .07 * v, Math.min(d, .25), .06); g.connect(out); osc("square", f, t, t + d + .5, g); },
    chipbass(m, t, d, v, out) { const f = mtof(m), g = ctx.createGain(); env(g, t, .004, .11 * v, d * .5, .04); g.connect(out); osc("triangle", f, t, t + d + .3, g); },
    harp(m, t, d, v, out) { const f = mtof(m), g = ctx.createGain(); env(g, t, .002, .16 * v, .05, .5); g.connect(out); osc("triangle", f, t, t + 3, g); const g2 = ctx.createGain(); env(g2, t, .002, .05 * v, .02, .15); g2.connect(out); osc("sine", f * 2, t, t + 1, g2); },
    clarinet(m, t, d, v, out) { const f = mtof(m), lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = f * 3.2; lp.Q.value = 2; lp.connect(out); const g = ctx.createGain(); env(g, t, .04, .08 * v, d * .75, .08); g.connect(lp); osc("square", f, t, t + d + .6, g); },
    suona(m, t, d, v, out) { const f = mtof(m), bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1400; bp.Q.value = 1.4; bp.connect(out); const g = ctx.createGain(); env(g, t, .03, .14 * v, d * .8, .06); g.connect(bp); const o = osc("sawtooth", f, t, t + d + .5, g); const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 6; lg.gain.value = f * .012; l.connect(lg); lg.connect(o.frequency); l.start(t + .1); l.stop(t + d + .5); },
    upright(m, t, d, v, out) { const f = mtof(m), lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(f * 6, t); lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + .2); lp.connect(out); const g = ctx.createGain(); env(g, t, .006, .3 * v, d * .5, .15); g.connect(lp); osc("triangle", f, t, t + d + .6, g); osc("sine", f, t, t + d + .6, g); },
    strings(m, t, d, v, out) { const f = mtof(m), lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2200; lp.connect(out); const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.03 * v, t + .5); g.gain.linearRampToValueAtTime(.0001, t + d + .7); g.connect(lp); [-8, 0, 8].forEach(dt => osc("sawtooth", f, t, t + d + .8, g, dt)); },
    drone(m, t, d, v, out) { const f = mtof(m), lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 500; lp.connect(out); const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.05 * v, t + d * .4); g.gain.linearRampToValueAtTime(.0001, t + d + 1); g.connect(lp); osc("sine", f, t, t + d + 1.2, g); osc("triangle", f * 1.5, t, t + d + 1.2, g, 5); },
    kick(m, t, d, v, out) { const g = ctx.createGain(); env(g, t, .002, .45 * v, .02, .08); g.connect(out); const o = osc("sine", 120, t, t + .4, g); o.frequency.exponentialRampToValueAtTime(42, t + .18); },
    snare(m, t, d, v, out) { nz(t, .16, "bandpass", 2200, .8, .1 * v, out); const g = ctx.createGain(); env(g, t, .002, .06 * v, .01, .04); g.connect(out); osc("triangle", 190, t, t + .15, g); },
    brush(m, t, d, v, out) { nz(t, .22, "bandpass", 3800, .6, .035 * v, out, .03); },
    hat(m, t, d, v, out) { nz(t, .05, "highpass", 8000, .7, .04 * v, out); },
    rim(m, t, d, v, out) { const g = ctx.createGain(); env(g, t, .001, .09 * v, .003, .02); g.connect(out); osc("square", 1700, t, t + .06, g); osc("sine", 820, t, t + .06, g); },
    tick(m, t, d, v, out) { const g = ctx.createGain(); env(g, t, .001, .07 * v, .002, .012); g.connect(out); osc("square", m % 2 ? 2400 : 3000, t, t + .04, g); },
    drum(m, t, d, v, out) { const g = ctx.createGain(); env(g, t, .002, .5 * v, .04, .16); g.connect(out); const o = osc("sine", 160, t, t + .6, g); o.frequency.exponentialRampToValueAtTime(70, t + .25); nz(t, .08, "lowpass", 900, .7, .12 * v, out); },
    cymbal(m, t, d, v, out) { nz(t, .3, "highpass", 6500, .5, .045 * v, out); [540, 800, 1130].forEach(f => { const g = ctx.createGain(); env(g, t, .001, .012 * v, .02, .1); g.connect(out); osc("square", f, t, t + .4, g); }); },
    crackle(m, t, d, v, out) { for (let i = 0; i < 6; i++) { const tt = t + Math.random() * d; nz(tt, .01, "highpass", 3000, .5, .02 * v * Math.random(), out); } },
    swell(m, t, d, v, out) { const n = noiseSrc(d), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = "bandpass"; f.Q.value = 3; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(5000, t + d); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.04 * v, t + d * .9); g.gain.exponentialRampToValueAtTime(.0001, t + d + .1); n.connect(f); f.connect(g); g.connect(out); n.start(t); n.stop(t + d + .2); }
  });

  /* ======================= 曲目(每首的拍子、節奏型、樂器編制都不同) =======================
     beats:每小節拍數;sub:每拍幾格(4=十六分、3=三連音);swing:搖擺;play(x):每一格要彈什麼 */
  const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10], DOR = [0, 2, 3, 5, 7, 9, 10], LYD = [0, 2, 4, 6, 7, 9, 11], PENT = [0, 2, 4, 7, 9];
  const SONGS = {
    /* 首頁:3/4 拍音樂盒圓舞曲,小調,夜晚的神秘感 */
    home: { vol: 1.5, name: "月光莊園・音樂盒圓舞曲", bpm: 84, key: 57, scale: MIN, beats: 3, sub: 4, prog: [0, 5, 3, 4, 0, 5, 6, 4], mel: { inst: "musicbox", grid: 2, oct: 1, dens: .7 }, seed: 11,
      play(x) { const { s, ch, P } = x; if (s === 0) { P("bass", ch[0] - 24, 3, .5); P("strings", ch[0] - 12, 8, .5); } if (s === 4 || s === 8) { P("celesta", ch[1], 1, .35); P("celesta", ch[2], 1, .3); } } },
    /* 裝扮台:8-bit 跳跳歌,輕快的換裝時間 */
    character: { vol: 1.7, name: "裝扮時間・8-bit 跳跳歌", bpm: 128, key: 65, scale: MAJ, beats: 4, sub: 4, prog: [0, 5, 3, 4], mel: { inst: "chip", grid: 2, oct: 1, dens: .85 }, seed: 23,
      play(x) { const { s, ch, P } = x; if (s % 2 === 0) P("chipbass", ch[0] - 24 + (s % 4 === 2 ? 12 : 0), 1, .8); P("chip", ch[[0, 1, 2, 3][s % 4]] + 12, .5, .18); if (s === 0 || s === 8) P("kick", 0, 1, .7); if (s === 4 || s === 12) P("snare", 0, 1, .6); if (s % 4 === 2) P("hat", 0, 1, .8); } },
    /* 地圖:Lo-fi 慢搖擺,電鋼琴七和弦 + 刷鼓 + 黑膠雜音,最放鬆 */
    map: { vol: 0.9, name: "午後散步・Lo-fi", bpm: 72, key: 60, scale: MAJ, beats: 4, sub: 4, swing: .32, seventh: true, prog: [3, 2, 1, 4, 0, 5, 1, 4], mel: { inst: "epiano", grid: 2, oct: 1, dens: .45 }, seed: 5,
      play(x) { const { s, ch, P } = x; if (s === 0) { ch.forEach((m, i) => P("epiano", m, 6, .45 - i * .05)); P("upright", ch[0] - 24, 4, .7); P("crackle", 0, 16, 1); } if (s === 10) { P("epiano", ch[1], 2, .3); P("epiano", ch[3], 2, .25); } if (s === 8) P("upright", ch[2] - 24, 3, .55); if (s === 0 || s === 7) P("kick", 0, 1, .45); if (s === 4 || s === 12) P("brush", 0, 1, 1); if (s % 2 === 0) P("hat", 0, 1, s % 4 ? .5 : .3); } },
    /* 房一 視力(休息角):3/4 拍搖籃曲,豎琴往上的琶音 + 鐘琴,沒有鼓 */
    room1: { vol: 1.8, name: "視界休息角・豎琴搖籃曲", bpm: 66, key: 62, scale: MAJ, beats: 3, sub: 4, prog: [0, 4, 5, 3, 0, 3, 4, 0], mel: { inst: "celesta", grid: 4, oct: 1, dens: .8 }, seed: 31,
      play(x) { const { s, ch, P } = x; if (s % 2 === 0) { const k = s / 2; P("harp", ch[k % 3] + 12 * Math.floor(k / 3), 2, .5); } if (s === 0) { P("strings", ch[0] - 12, 12, .45); P("bass", ch[0] - 24, 6, .35); } } },
    /* 房二 行動:輕快進行曲,撥弦低音一步一步走 + 豎笛 + 木魚「滴答滴答」像腳步 */
    room2: { vol: 0.9, name: "穩穩走・散步進行曲", bpm: 108, key: 55, scale: MAJ, beats: 4, sub: 4, prog: [0, 3, 0, 4, 0, 3, 4, 0], mel: { inst: "clarinet", grid: 2, oct: 1, dens: .7 }, seed: 47,
      play(x) { const { s, ch, P } = x; if (s % 4 === 0) { P("upright", [ch[0], ch[1], ch[2], ch[1]][s / 4] - 24, 1, .8); P("rim", s, 1, s % 8 ? .5 : .8); } if (s === 4 || s === 12) P("snare", 0, 1, .35); if (s === 2 || s === 10) { P("pluck", ch[1], 1, .3); P("pluck", ch[2], 1, .3); } } },
    /* 房三 營養(廚房):巴薩諾瓦,吉他切分和弦 + 沙鈴 + 響棒 + 木琴旋律 */
    room3: { vol: 0.75, name: "廚房小調・巴薩諾瓦", bpm: 116, key: 58, scale: MAJ, beats: 4, sub: 4, seventh: true, prog: [0, 0, 1, 4, 2, 5, 1, 4], mel: { inst: "marimba", grid: 2, oct: 1, dens: .75 }, seed: 59,
      play(x) { const { s, ch, P } = x; if ([0, 6, 8, 14].includes(s)) P("upright", (s % 8 === 0 ? ch[0] : ch[2]) - 24, 1.5, .75); if ([0, 3, 6, 10, 12].includes(s)) ch.slice(1).forEach(m => P("pluck", m, 1, .22)); P("shaker", s, 1, s % 4 === 2 ? 1 : .55); if ([3, 6, 10, 14].includes(s)) P("rim", s, 1, .5); } },
    /* 房四 聽力:環境音樂,很長的和聲 + 偶爾一聲鐘,幾乎沒有節奏(不干擾聽力活動) */
    room4: { vol: 2.2, name: "安靜聆聽・環境音樂", bpm: 54, key: 64, scale: MAJ, beats: 4, sub: 4, prog: [0, 0, 3, 3, 5, 5, 4, 4], mel: null, seed: 67,
      play(x) { const { s, bar, ch, P, R } = x; if (s === 0 && bar % 2 === 0) { P("drone", ch[0] - 24, 32, .8); ch.forEach(m => P("strings", m - 12, 30, .35)); } if (s === 8 && R() < .55) P("bell", ch[Math.floor(R() * 4)] + 12, 4, .35); } },
    /* 房五 認知:懸疑解謎,時鐘滴答 + 斷奏撥弦固定音型 + 半音靠近的旋律 */
    room5: { vol: 2.8, name: "記憶拼圖・時鐘解謎", bpm: 96, key: 62, scale: DOR, beats: 4, sub: 4, prog: [0, 0, 3, 0, 5, 3, 4, 4], mel: { inst: "pluck", grid: 4, oct: 1, dens: .55, chroma: true }, seed: 71,
      play(x) { const { s, ch, P } = x; if (s % 2 === 0) P("tick", s / 2, 1, s % 8 === 0 ? 1 : .6); if (s % 2 === 0) P("pluck", [ch[0], ch[2], ch[3], ch[2]][(s / 2) % 4], .5, .32); if (s === 0) P("clarinet", ch[0] - 24, 14, .6); if (s === 0) P("kick", 0, 1, .35); } },
    /* 房六 心理(客廳):慢板爵士抒情,三連音搖擺 + 分解的鋼琴七和弦 + 低音大提琴 + 刷子鼓 */
    room6: { vol: 0.7, name: "暖暖客廳・爵士抒情", bpm: 60, key: 63, scale: MAJ, beats: 4, sub: 3, seventh: true, prog: [0, 5, 1, 4, 2, 5, 1, 4], mel: { inst: "piano", grid: 3, oct: 1, dens: .6 }, seed: 83,
      play(x) { const { s, ch, P } = x; if (s === 0) ch.forEach((m, i) => P("piano", m, 3, .4, i * .045)); if (s === 6) { P("piano", ch[1], 1.5, .25); P("piano", ch[3], 1.5, .22); } if (s === 0 || s === 6) P("upright", (s ? ch[2] : ch[0]) - 24, 5, .7); if (s % 3 === 0) P("brush", 0, 1, s % 6 ? 1 : .6); if (s % 3 === 2) P("hat", 0, 1, .35); } },
    /* 房七 記憶核心:夢幻,鐘琴往下瀑布般的琶音 + 弦樂 + 每兩小節一次倒吸氣 */
    room7: { vol: 1.9, name: "記憶核心・星光瀑布", bpm: 70, key: 56, scale: LYD, beats: 4, sub: 4, prog: [0, 1, 0, 1, 5, 4, 1, 0], mel: { inst: "bell", grid: 4, oct: 1, dens: .5 }, seed: 97,
      play(x) { const { s, bar, ch, P } = x; const casc = [3, 2, 1, 0]; P("musicbox", ch[casc[s % 4]] + 24 - 12 * Math.floor(s / 8), .5, .3); if (s === 0) { ch.slice(0, 3).forEach(m => P("strings", m - 12, 16, .5)); P("drone", ch[0] - 24, 16, .5); } if (s === 8 && bar % 2 === 1) P("swell", 0, 8, 1); } },
    /* 片尾劇情:鋼琴獨奏,左手分解和弦 */
    ending: { vol: 0.75, name: "回想・鋼琴獨奏", bpm: 64, key: 60, scale: MAJ, beats: 4, sub: 4, seventh: true, prog: [5, 3, 0, 4, 5, 3, 1, 4], mel: { inst: "piano", grid: 2, oct: 1, dens: .55 }, seed: 101,
      play(x) { const { s, ch, P } = x; if (s % 2 === 0) { const k = s / 2; P("piano", [ch[0] - 12, ch[2] - 12, ch[1], ch[2] - 12, ch[0], ch[2] - 12, ch[1], ch[3] - 12][k], 1.2, .3); } if (s === 0) P("bass", ch[0] - 24, 6, .4); } },
    /* 片尾天亮:中國風喜慶,大鼓 + 鈸 + 鑼 + 古箏掃弦 + 嗩吶般的旋律 */
    newyear: { vol: 1.0, name: "新年快樂・鑼鼓喧天", bpm: 132, key: 67, scale: MAJ, pent: PENT, beats: 4, sub: 4, prog: [0, 0, 3, 4, 0, 0, 3, 0], mel: { inst: "suona", grid: 2, oct: 1, dens: .8 }, seed: 113,
      play(x) { const { s, bar, ch, P } = x; if ([0, 6, 8].includes(s)) P("drum", 0, 1, s ? .7 : 1); if (s === 12) P("drum", 0, 1, .55); if (s % 4 === 2) P("cymbal", 0, 1, .6); if (s % 2 === 0) P("block", s, 1, .4); if (s === 0 && bar % 4 === 0) P("gong", x.S.key - 24, 1, .8); if (s === 0) for (let i = 0; i < 6; i++) P("zheng", x.pent(i + 3), .5, .45, i * .035); if (s === 8) P("zheng", ch[0], 1, .4); } }
  };
  INST.celesta = INST.musicbox;

  function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
  /* 由種子作一段 4 小節旋律,排成 A A' B A' C B A A' 八小節,之後重複 → 有記憶點 */
  function compose(S) {
    const M = S.mel; if (!M) return null;
    const R = rng(S.seed), L = S.beats * S.sub, slots = Math.floor(L / M.grid), bars = [];
    let deg = 4 + Math.floor(R() * 3);
    for (let b = 0; b < 4; b++) {
      const notes = new Array(L).fill(null);
      for (let k = 0; k < slots; k++) {
        const strong = (k * M.grid) % S.sub === 0 && (k * M.grid) / S.sub % 2 === 0;
        if (R() > M.dens * (strong ? 1.25 : .8)) continue;
        deg += [-2, -1, -1, 0, 1, 1, 2, -3, 3][Math.floor(R() * (b === 2 ? 9 : 7))];
        deg = Math.max(0, Math.min(10, deg));
        notes[k * M.grid] = { deg, chroma: M.chroma && R() < .18 };
      }
      if (b === 3) { for (let i = Math.floor(L / 2); i < L; i++) notes[i] = null; notes[Math.floor(L / 2)] = { deg: 0, long: true }; }
      bars.push(notes);
    }
    const vary = n => n.map(x => x && Object.assign({}, x, { deg: Math.max(0, x.deg + (x.deg > 5 ? -1 : 1)) }));
    return [bars[0], vary(bars[0]), bars[2], vary(bars[1]), bars[1], bars[2], bars[0], bars[3]];
  }
  function degToMidi(S, deg, oct) {
    const sc = S.pent || S.scale, n = sc.length;
    return S.key + 12 * (oct + Math.floor(deg / n)) + sc[((deg % n) + n) % n];
  }
  function chordTones(S, root) {
    const sc = S.scale, n = sc.length, out = [];
    [0, 2, 4, 6].forEach(k => { const d = root + k; out.push(S.key + 12 * Math.floor(d / n) + sc[d % n]); });
    return S.seventh ? out : out.slice(0, 3).concat(out[0] + 12);
  }

  /* 一首正在播的歌。
     2026-11-20 修正「換場景時新舊音樂攪在一起」:每首歌有自己的輸出 out,停止時 out 在 fade 秒內「線性」降到 0 並斷線
     (之前用 0.5 秒時間常數,聽得到約 2 秒,長音、和弦、殘響都會跟新曲疊在一起)。新曲可延後 delay 秒才開始,淡入 fadeIn 秒。 */
  const live = new Set();
  function Player(id, mood, opt) {
    opt = opt || {};
    const delay = opt.delay || 0, fadeIn = opt.fadeIn || .35;
    const S = moodSong(id, mood), out = ctx.createGain(); out.connect(musicBus); out.connect(revSend);
    const t0s = ctx.currentTime + delay;
    out.gain.setValueAtTime(0, ctx.currentTime); out.gain.setValueAtTime(0, t0s); out.gain.linearRampToValueAtTime(S.vol || 1, t0s + fadeIn);
    const mel = compose(S), L = S.beats * S.sub, sd = 60 / S.bpm / S.sub, R = rng(S.seed * 7 + 3);
    let step = 0, next = t0s + .05, stopped = false;
    function schedule() {
      if (stopped) return;
      while (next < ctx.currentTime + .3) {
        const bar = Math.floor(step / L), s = step % L, t = next + (S.swing && S.sub === 4 && s % 4 === 2 ? S.swing * sd : 0);
        const ch = chordTones(S, S.prog[bar % S.prog.length]);
        const P = (inst, m, durSteps, vel, delay) => { try { INST[inst](m, t + (delay || 0), durSteps * sd, vel, out); } catch (e) { } };
        const x = { s, bar, ch, P, R, S, pent: i => degToMidi(S, i, 0) };
        S.play(x);
        if (mel) {
          const n = mel[bar % mel.length][s];
          if (n) { let m = degToMidi(S, n.deg, S.mel.oct); if (n.chroma) m -= 1; P(S.mel.inst, m, n.long ? L / 2 : S.mel.grid * 1.6, .8); if (n.chroma) P(S.mel.inst, m + 1, S.mel.grid, .7, sd * S.mel.grid * .5); }
        }
        next += sd; step++;
      }
    }
    const timer = setInterval(schedule, 50); schedule();
    const p = {
      id, key: id + "|" + (mood || "calm"), name: S.name, stop(fade) {
        if (stopped) return; stopped = true; p.stopped = true; clearInterval(timer);
        fade = fade == null ? .15 : fade;
        const now = ctx.currentTime, g = out.gain;
        try { const v = g.value; g.cancelScheduledValues(now); g.setValueAtTime(v, now); g.linearRampToValueAtTime(0, now + fade); } catch (e) { g.value = 0; }
        setTimeout(() => { try { out.disconnect(); } catch (e) { } live.delete(p); }, fade * 1000 + 60);
      }
    };
    live.add(p);
    return p;
  }
  /* 換場景時把殘響回送瞬間壓掉,0.4 秒後再打開 */
  function cutReverb() {
    if (!revRet) return;
    const now = ctx.currentTime, g = revRet.gain;
    g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(0, now + .1); g.setValueAtTime(0, now + .4); g.linearRampToValueAtTime(1, now + .7);
  }

  /* ======================= 情境配樂(2026-11-17:依小遊戲情境中途換樂) =======================
     同一間房間的歌會依情境變奏(調性相同,所以接得順):
       calm  平常探索 → 原曲
       focus 小遊戲進行中 → 原曲 + 滴答節拍、低音脈動(專心)
       action 動作小遊戲(房二打擊)→ 加快 + 鼓組
       urgent 剩 10 秒內 → 緊急:快速和聲小調、四拍大鼓、十六分音符
       tense 台詞緊張(跌倒、急診、黑影…)或連續答錯 → 心跳鼓、低音持續音、小二度固定音型
       sad 台詞悲傷(孤單、忘記、看不清…)→ 慢、小調、弦樂 + 鋼琴
       happy 答對/通關後幾秒、台詞開心 → 原曲轉明亮 + 沙鈴拍手 */
  const HMIN = [0, 2, 3, 5, 7, 8, 11];
  const beatOf = (S, s) => ({ on: s % S.sub === 0, b: Math.floor(s / S.sub), off: S.sub === 4 ? s % 4 === 2 : s % 3 === 2 });
  const moodCache = {};
  function moodSong(id, mood) {
    const B = SONGS[id]; if (!mood || mood === "calm" || !B) return B;
    const ck = id + "|" + mood; if (moodCache[ck]) return moodCache[ck];
    const lead = (B.mel && B.mel.inst) || "piano", key = B.key > 62 ? B.key - 12 : B.key;
    let S;
    if (mood === "focus") S = Object.assign({}, B, { name: B.name + "(專心)", vol: (B.vol || 1) * .65, bpm: B.bpm * 1.08, seed: B.seed + 1,
      play(x) { B.play(x); const { s, ch, P } = x, k = beatOf(x.S, s); if (k.on || k.off) P("tick", s, 1, k.on ? .8 : .45); if (k.on) P("upright", ch[0] - 24, x.S.sub * .7, .5); } });
    else if (mood === "action") S = Object.assign({}, B, { name: B.name + "(動起來)", vol: (B.vol || 1) * .85, bpm: Math.min(150, B.bpm * 1.28), seed: B.seed + 2,
      play(x) { B.play(x); const { s, P } = x, k = beatOf(x.S, s); if (k.on && k.b % 2 === 0) P("kick", 0, 1, .85); if (k.on && k.b % 2 === 1) P("snare", 0, 1, .65); if (k.on || k.off) P("hat", 0, 1, .8); } });
    else if (mood === "happy") S = Object.assign({}, B, { name: B.name + "(開心)", vol: (B.vol || 1) * .85, bpm: B.bpm * 1.12, scale: B.scale === MIN || B.scale === DOR ? MAJ : B.scale, prog: [0, 3, 4, 0, 5, 3, 4, 0], seed: B.seed + 3,
      play(x) { B.play(x); const { s, ch, P } = x, k = beatOf(x.S, s); P("shaker", s, 1, .55); if (k.on && k.b % 2 === 1) P("snare", 0, 1, .4); if (k.on) P("chip", ch[k.b % 4] + 24, .5, .2); } });
    else if (mood === "sad") S = { vol: 1.7, name: "悲傷", bpm: 54, key, scale: MIN, beats: 4, sub: 4, prog: [0, 5, 3, 4, 0, 5, 1, 4], mel: { inst: lead === "chip" || lead === "marimba" ? "piano" : lead, grid: 4, oct: 1, dens: .55 }, seed: B.seed + 4,
      play(x) { const { s, ch, P } = x; if (s === 0) { ch.slice(0, 3).forEach(m => P("strings", m - 12, 16, .7)); P("bass", ch[0] - 24, 14, .5); } if (s % 4 === 0) P("piano", [ch[0], ch[2], ch[1], ch[2]][s / 4], 3, .32); } };
    else if (mood === "tense") S = { vol: 1.05, name: "緊張", bpm: 92, key, scale: HMIN, beats: 4, sub: 4, prog: [0, 0, 5, 4, 0, 0, 3, 4], mel: { inst: lead, grid: 4, oct: 1, dens: .35, chroma: true }, seed: B.seed + 5,
      play(x) { const { s, bar, ch, P } = x; if (s === 0) P("kick", 0, 1, .9); if (s === 3) P("kick", 0, 1, .6); if (s % 2 === 0) P("upright", ch[0] - 24 + (s % 4 === 2 ? 1 : 0), .8, .55); if (s === 0) P("drone", ch[0] - 24, 16, .9); if (s % 2 === 1) P("tick", s, 1, .4); if (s === 8 && bar % 2 === 1) P("swell", 0, 8, 1.4); if (s === 0 && bar % 2 === 0) P("strings", ch[2], 16, .6); } };
    else if (mood === "urgent") S = { vol: .85, name: "緊急", bpm: 148, key, scale: HMIN, beats: 4, sub: 4, prog: [0, 0, 5, 4], mel: { inst: lead, grid: 2, oct: 1, dens: .65 }, seed: B.seed + 6,
      play(x) { const { s, bar, ch, P } = x; if (s % 4 === 0) P("kick", 0, 1, .9); if (s === 4 || s === 12) P("snare", 0, 1, .7); P("hat", 0, 1, s % 2 ? .4 : .7); if (s % 2 === 0) P("upright", ch[0] - 24 + (s % 4 === 2 ? 12 : 0), .9, .6); if ([0, 3, 6].includes(s)) ch.slice(0, 3).forEach(m => P("pluck", m, .5, .3)); if (s === 0 && bar % 4 === 3) P("swell", 0, 16, 1.4); } };
    return (moodCache[ck] = S || B);
  }

  /* 情境判斷:每 0.4 秒看一次所有頁面 */
  const moodState = { dialog: null, dialogAt: 0, errors: [], happyUntil: 0, explicit: null, explicitUntil: 0 };
  /* 小遊戲畫面(各房間的寫法不同,逐一列出):房一各測驗/視力檢查畫面、房二活動、房三/六任務、房四/五活動模式、成就密碼謎題 */
  const MINIGAME = ".view.is-active:not(.room-view):not(.education-view):not(.resource-view), #activityView, #missionView, .shoot-game, .au-modal, .room45-screen.activity-mode.active";
  const ACTIONGAME = ".impact-runner-view.is-active, .shoot-game";
  const DIALOGS = ".sd-overlay, .au-dialog, .ev3-talk.on, .rc-overlay";
  const vis = el => { try { return el.checkVisibility ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) : !!el.offsetParent; } catch (e) { return false; } };
  const anyVis = (d, sel) => { for (const el of d.querySelectorAll(sel)) if (vis(el)) return el; return null; };
  function detectMood(wins) {
    const now = performance.now();
    if (moodState.explicit && now < moodState.explicitUntil) return moodState.explicit;
    let dialog = false, mini = false, shoot = null;
    for (const w of wins) {
      try {
        const d = w.document;
        if (!dialog && anyVis(d, DIALOGS)) dialog = true;
        const st = d.getElementById("shootTime"); if (st && vis(st)) shoot = Number(st.textContent);
        if (!mini && anyVis(d, MINIGAME)) mini = true;
        if (shoot == null && anyVis(d, ACTIONGAME)) shoot = 99;
      } catch (e) { }
    }
    if (!dialog) moodState.dialog = null;
    moodState.errors = moodState.errors.filter(t => now - t < 25000);
    if (shoot != null && !isNaN(shoot)) return shoot <= 10 ? "urgent" : "action";
    if (dialog && moodState.dialog) return moodState.dialog;
    if (moodState.errors.length >= 2) return "tense";
    if (now < moodState.happyUntil) return "happy";
    if (mini) return "focus";
    return "calm";
  }
  let curMood = "calm", pendingMood = null, pendingSince = 0, moodChangedAt = 0;
  function applyMood(m) {
    const now = performance.now();
    if (m === curMood) { pendingMood = null; return; }
    const urgentish = m === "urgent" || m === "action" || curMood === "urgent" || curMood === "action";
    if (pendingMood !== m) { pendingMood = m; pendingSince = now; if (!urgentish) return; }
    if (!urgentish && (now - pendingSince < 700 || now - moodChangedAt < 2500)) return;
    curMood = m; moodChangedAt = now; pendingMood = null;
    if (api.debug) try { api.debug("mood_" + m); } catch (e) { }
    refreshMusic("mood");
  }

  /* kind:"scene" 換畫面/換曲 → 舊曲 0.15 秒內靜音、殘響切掉,新曲等舊曲完全安靜後才淡入(不重疊);
          "mood"  同一首的情境變奏 → 0.25 秒交叉淡化(同調性,接得順) */
  /* 指定片頭／片尾歌曲獨佔音樂；場景換曲仍記住 wanted，離開動畫後恢復。 */
  let cinematic = null;
  const CINEMATIC = {
    intro: { src: "assets/audio/片頭.mp3", name: "片頭" },
    ending: { src: "assets/audio/片尾.mp3", name: "片尾" }
  };
  function syncCinematic() {
    if (!cinematic) return;
    const a = cinematic.audio;
    a.volume = Math.max(0, Math.min(1, cfg.musicVol));
    if (!cfg.musicOn || document.hidden) { a.pause(); return; }
    if (a.paused && !cinematic.pending) {
      const track = cinematic;
      track.pending = true;
      Promise.resolve(a.play()).catch(() => { /* 首次互動時由 unlock 再試。 */ })
        .finally(() => { track.pending = false; });
    }
  }
  function cinematicMusic(id) {
    if (!CINEMATIC[id]) return;
    if (cinematic && cinematic.id === id) { syncCinematic(); return; }
    if (cinematic) { cinematic.audio.pause(); cinematic.audio.currentTime = 0; }
    const song = CINEMATIC[id], audio = new Audio(new URL(song.src, document.baseURI).href);
    audio.loop = true; audio.preload = "auto";
    cinematic = { id, name: song.name, audio, pending: false };
    applyVolumes(); refreshMusic("scene"); api._sync && api._sync();
  }
  function stopCinematicMusic(id) {
    if (!cinematic || (id && cinematic.id !== id)) return;
    cinematic.audio.pause(); cinematic.audio.currentTime = 0; cinematic = null;
    refreshMusic("scene"); applyVolumes(); api._sync && api._sync();
  }
  let wanted = null, current = null, unlocked = false, epoch = 0;
  function refreshMusic(kind) {
    if (!unlocked || !ensure()) return;
    const target = wanted && cfg.musicOn && !cinematic ? wanted + "|" + curMood : null;
    if (current && current.key === target) return;
    const sameSong = current && target && current.id === wanted;
    const mood = kind === "mood" && sameSong;
    if (current) { current.stop(mood ? .25 : .15); current = null; }
    for (const p of live) p.stop(.12);   /* 保險:任何殘留的舊曲一律停掉,同時間只會有一首在出聲 */
    if (!mood) cutReverb();
    if (target) current = Player(wanted, curMood, mood ? { delay: 0, fadeIn: .25 } : { delay: .17, fadeIn: .35 });
  }
  function music(id) {
    if (id !== null && !SONGS[id]) return;
    if (id !== wanted) {
      epoch++;
      moodState.happyUntil = 0; moodState.errors = []; moodState.explicit = null; moodState.dialog = null;
      /* 換畫面時情境一律回到 calm,不要把上一個畫面的「專心/緊張」帶到新曲 */
      curMood = "calm"; pendingMood = null; moodChangedAt = performance.now();
    }
    wanted = id; refreshMusic("scene"); ambient(id);
    if (id) { try { window.MemoryGallery && MemoryGallery.unlockMusic(id); } catch (e) { } }   /* 2026-11-18 回憶館:第一次聽到就收藏 */
  }
  /* E5(2026-11-18 晚)房間環境音:很小聲地鋪在音樂底下,跟著「音效」開關與音量。房 4 是聽力房,刻意保持安靜。
     房1 書房掛鐘滴答、房2 浴室水滴、房3 廚房冰箱低鳴、房5 走廊老鐘(慢)、房6 客廳窗邊風鈴 */
  let ambT = 0, ambId = null, ambHum = null;
  const AMB = {
    room1: { every: 1000, play: t => { tone(2600, t, .03, "square", .006); } },
    room2: { every: 2600, play: t => { if (Math.random() < .55) tone(1400 + Math.random() * 500, t, .12, "sine", .02, 700); } },
    room3: { hum: 58, every: 0 },
    room5: { every: 1500, play: t => { tone(1800, t, .05, "triangle", .008); } },
    room6: { every: 3400, play: t => { if (Math.random() < .5) [0, 1, 2].forEach(i => tone([2093, 2349, 2637, 3136][Math.floor(Math.random() * 4)], t + i * .18, 1.2, "sine", .008)); } }
  };
  function ambient(id) {
    if (id === ambId) return; ambId = id;
    clearInterval(ambT); ambT = 0;
    if (ambHum) { try { ambHum.g.gain.setTargetAtTime(.0001, ctx.currentTime, .3); const h = ambHum; setTimeout(() => { try { h.o.stop(); } catch (e) { } }, 1200); } catch (e) { } ambHum = null; }
    const a = AMB[id]; if (!a) return;
    if (a.every) ambT = setInterval(() => { if (!cfg.sfxOn || !unlocked || !ensure() || !running() || document.hidden) return; try { a.play(t0()); } catch (e) { } }, a.every);
    if (a.hum) { const start = () => { if (ambId !== id || ambHum) return; if (!cfg.sfxOn || !unlocked || !ensure() || !running()) { setTimeout(start, 1500); return; }
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = "sawtooth"; o.frequency.value = a.hum; f.type = "lowpass"; f.frequency.value = 180;
      g.gain.setValueAtTime(.0001, ctx.currentTime); g.gain.setTargetAtTime(.012, ctx.currentTime, .8); o.connect(f); f.connect(g); g.connect(sfxBus); o.start(); ambHum = { o, g }; }; start(); }
  }

  /* ======================= 音效 ======================= */
  function t0() { return ctx.currentTime + .005; }
  function tone(f, t, dur, type = "sine", vol = .1, to, dest) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(dest || sfxBus); o.start(t); o.stop(t + dur + .05);
  }
  function swish(t, dur, from, to, vol, q = 1.2, type = "bandpass") {
    const n = noiseSrc(dur), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = type; f.Q.value = q; f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * .35); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    n.connect(f); f.connect(g); g.connect(sfxBus); n.start(t); n.stop(t + dur + .05);
  }
  const SFX = {
    hover: t => tone(1560, t, .035, "sine", .03),
    click: t => { tone(620, t, .07, "square", .05, 940); tone(1240, t + .01, .05, "triangle", .035); },
    key: t => tone(520, t, .05, "square", .05, 700),
    tab: t => { tone(880, t, .05, "triangle", .07); tone(1320, t + .04, .06, "triangle", .05); },
    toggle: t => { tone(700, t, .04, "square", .04); tone(1050, t + .05, .05, "square", .04); },
    pop: t => tone(420, t, .09, "sine", .09, 780),
    open: t => { swish(t, .18, 600, 2400, .05); tone(660, t + .04, .12, "triangle", .06, 990); },
    close: t => { swish(t, .16, 2200, 500, .04); tone(800, t, .1, "triangle", .05, 520); },
    whoosh: t => swish(t, .45, 300, 3200, .09, .9),
    whooshSoft: t => swish(t, .35, 500, 2000, .05, .9),
    door: t => { tone(110, t, .35, "sine", .16, 70); swish(t + .05, .5, 900, 300, .05, 6); tone(320, t + .12, .25, "sawtooth", .015, 240); },
    curtain: t => { swish(t, .9, 1400, 4200, .07, .6, "highpass"); swish(t + .1, .8, 2600, 900, .05, .7); },
    portal: t => { swish(t, 2.2, 200, 4200, .1, 1.5); [0, 1, 2, 3, 4, 5].forEach(i => tone(440 * Math.pow(1.26, i), t + .25 + i * .22, .4, "sine", .05)); tone(80, t, 2.2, "sine", .1, 240); },
    sparkle: t => [1568, 2093, 2637, 3136].forEach((f, i) => tone(f, t + i * .05, .18, "sine", .045)),
    found: t => [784, 988, 1319].forEach((f, i) => tone(f, t + i * .07, .16, "triangle", .09)),
    collect: t => { tone(988, t, .08, "square", .05); tone(1319, t + .07, .2, "square", .05); },
    pickup: t => tone(380, t, .12, "triangle", .08, 760),
    drop: t => { tone(240, t, .1, "sine", .12, 140); tone(900, t + .05, .08, "triangle", .04); },
    /* E6:答對 = 溫暖和弦(柔和三角波疊根音,不刺耳);答錯 = 輕輕「噗」一聲(低通氣音 + 兩個往下的圓潤音,不像警報) */
    success: t => { tone(262, t, .7, "sine", .05); [523, 659, 784].forEach((f, i) => tone(f, t + i * .05, .65, "triangle", .045)); tone(1047, t + .2, .55, "sine", .03); },
    error: t => { swish(t, .2, 1200, 260, .05, .7, "lowpass"); tone(330, t, .14, "sine", .07, 262); tone(247, t + .14, .24, "sine", .06, 196); },
    unlock: t => { tone(330, t, .35, "sawtooth", .04, 990); [659, 880, 1175].forEach((f, i) => tone(f, t + .25 + i * .08, .18, "triangle", .08)); },
    fanfare: t => { [[523, 0], [659, .12], [784, .24], [1047, .4]].forEach(([f, d]) => { tone(f, t + d, .3, "square", .05); tone(f / 2, t + d, .3, "triangle", .06); }); [1047, 1319, 1568].forEach(f => tone(f, t + .62, .9, "triangle", .05)); SFX.sparkle(t + .7); },
    restore: t => { swish(t, 1.4, 300, 5000, .05, 1); [523, 659, 784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * .14, .5, "sine", .05)); },
    type: t => tone(1100 + Math.random() * 300, t, .025, "square", .012),
    page: t => swish(t, .3, 3000, 1200, .06, .8),
    random: t => [0, 1, 2, 3, 4, 5].forEach(i => tone(500 + Math.random() * 900, t + i * .045, .05, "square", .04)),
    reset: t => { swish(t, .3, 2400, 600, .05); tone(880, t, .15, "triangle", .06, 440); },
    confirm: t => { [659, 988].forEach((f, i) => tone(f, t + i * .1, .2, "triangle", .09)); SFX.sparkle(t + .15); },
    step: t => { tone(150, t, .06, "sine", .08, 90); swish(t, .05, 1800, 900, .02, 2); },
    shake: t => [0, 1, 2, 3, 4, 5, 6, 7].forEach(i => { tone(1600 + (i % 3) * 300, t + i * .07, .03, "square", .025); }),
    flash: t => { swish(t, .6, 6000, 800, .06, .7, "highpass"); tone(1760, t, .5, "sine", .04, 880); },
    /* 2026-11-20 結算演出:tick = 數字滾動的滴答(音高每次往上爬,tickReset 歸零);thud = 低頻重擊;stamp = 評級印章砸下 */
    tick: t => { tone(900 + Math.min(1400, (SFX._tk = (SFX._tk || 0) + 1) * 28), t, .035, "square", .022); },
    tickReset: () => { SFX._tk = 0; },
    thud: t => { tone(95, t, .32, "sine", .22, 48); swish(t, .18, 900, 120, .06, .8, "lowpass"); },
    stamp: t => { tone(70, t, .5, "sine", .3, 38); swish(t, .25, 3000, 200, .08, .7); tone(2400, t, .05, "square", .03); SFX.sparkle(t + .12); },
    /* 2026-11-20 塔羅翻牌(房間 7):charge = 蓄力(低頻嗡聲 + 氣流漸強,約 0.65 秒);impact = 翻開瞬間的重擊(低頻 boom + 碎裂高音) */
    charge: t => {
      const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = "sawtooth"; o.frequency.setValueAtTime(52, t); o.frequency.exponentialRampToValueAtTime(150, t + .66);
      lp.type = "lowpass"; lp.Q.value = 4; lp.frequency.setValueAtTime(160, t); lp.frequency.exponentialRampToValueAtTime(1500, t + .66);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.075, t + .6); g.gain.exponentialRampToValueAtTime(.0001, t + .74);
      o.connect(lp); lp.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + .8);
      swish(t, .68, 300, 6000, .05, 1.6); [0, 1, 2, 3, 4].forEach(i => tone(660 * Math.pow(1.19, i), t + .1 + i * .11, .14, "sine", .02 + i * .006));
    },
    impact: t => { tone(92, t, 1.2, "sine", .34, 28); tone(46, t, 1.4, "triangle", .14, 26); swish(t, .55, 2600, 70, .15, .7, "lowpass"); tone(3100, t, .07, "square", .03, 1400); swish(t + .02, .35, 7000, 2500, .04, .7, "highpass"); },
    faint: t => { tone(55, t, 2.4, "sine", .12, 48); tone(82, t + .2, 2.2, "triangle", .04, 70); },
    heartbeat: t => { tone(60, t, .18, "sine", .22, 40); tone(58, t + .26, .2, "sine", .16, 40); },
    firecracker: t => { for (let i = 0; i < 14; i++) { const d = i * .07 + Math.random() * .04; swish(t + d, .06, 3000, 1500, .12 + Math.random() * .06, .7); tone(90, t + d, .05, "sine", .1); } },
    unroll: t => swish(t, 1.1, 800, 3000, .05, .9),
    run: t => [0, 1, 2, 3, 4, 5].forEach(i => SFX.step(t + i * .16)),
    /* 情緒小音效 */
    emo_surprise: t => { tone(420, t, .16, "square", .05, 1300); tone(1300, t + .14, .12, "triangle", .06); tone(1760, t + .2, .1, "sine", .05); },
    emo_laugh: t => [0, 1, 2, 3].forEach(i => tone([880, 784, 698, 659][i], t + i * .09, .08, "square", .035)),
    emo_realize: t => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * .05, .25, "sine", .05)); },
    emo_sigh: t => { swish(t, .7, 1600, 400, .035, .7); tone(392, t, .6, "triangle", .04, 294); },
    emo_cheer: t => { [659, 784, 1047].forEach((f, i) => tone(f, t + i * .08, .18, "triangle", .07)); },
    emo_ponder: t => { tone(330, t, .14, "triangle", .05); tone(294, t + .18, .2, "triangle", .045); },
    emo_exclaim: t => { tone(660, t, .06, "square", .045); tone(990, t + .06, .1, "square", .045); },
    emo_question: t => tone(500, t, .18, "triangle", .05, 760),
    /* 其他細節 */
    locked: t => { tone(150, t, .12, "square", .07, 110); tone(120, t + .09, .14, "square", .06, 90); },
    hint: t => { [1047, 1319].forEach((f, i) => tone(f, t + i * .1, .3, "sine", .05)); },
    dizzy: t => { for (let i = 0; i < 6; i++) tone(700 - i * 60, t + i * .07, .1, "sine", .04, 760 - i * 60); },
    cloth: t => { swish(t, .22, 1200, 3800, .06, .8); swish(t + .12, .18, 3000, 1500, .04, .8); },
    snip: t => { swish(t, .05, 5000, 4000, .08, 3); swish(t + .09, .05, 5200, 4200, .08, 3); },
    clink: t => { tone(2637, t, .2, "sine", .05); tone(3520, t + .03, .15, "sine", .035); },
    drip: t => tone(900, t, .12, "sine", .07, 1800),
    memory: t => { swish(t, .9, 500, 3000, .03, 1); [523, 784, 1047, 1319].forEach((f, i) => tone(f, t + .1 + i * .12, .6, "sine", .045)); },
    next: t => tone(760, t, .05, "triangle", .035, 900),
    fullscreen: t => swish(t, .25, 900, 2600, .04, 1),
    rustle: t => swish(t, .3, 2200, 3600, .025, .6, "highpass"),
    /* 2026-11-20 開場重做 v2:神祕氣氛用(全部即時合成) */
    creak: t => { for (let i = 0; i < 11; i++) tone(150 + Math.random() * 70, t + i * .085, .11, "sawtooth", .016, 120); swish(t, 1, 500, 260, .03, 3, "lowpass"); },
    candle: t => { swish(t, .35, 500, 2600, .05, .8); tone(1300, t + .06, .22, "sine", .018, 1900); },
    puff: t => swish(t, .32, 1900, 260, .06, .7),
    wind: t => { swish(t, 2.6, 260, 900, .045, .5); swish(t + .9, 2.2, 620, 240, .035, .5); },
    whisper: t => { for (let i = 0; i < 9; i++) swish(t + i * .15, .13, 1600 + Math.random() * 1600, 2400 + Math.random() * 1600, .018, 4); },
    clock: t => { tone(1500, t, .05, "square", .02); tone(1080, t + .5, .05, "square", .02); },
    bell: t => { [196, 392, 590, 784].forEach((f, i) => tone(f, t, 3.2 - i * .6, "sine", .1 / (i + 1))); },
    bonk: t => { tone(320, t, .16, "square", .07, 110); tone(85, t, .32, "sine", .22, 40); }
  };
  /* ---- 角色聲音:每位角色一組基準音高(f0)。說話用機器人語氣聲(robotEmote)+ 打字滴答(blip),不是人聲錄音 ---- */
  const VOICES = {
    player0: { f0: 122, vib: .035, breath: .28, name: "沉穩長者" },
    player1: { f0: 112, vib: .04, breath: .32, name: "和善長者" },
    player2: { f0: 100, vib: .03, breath: .22, name: "活力長者" },
    npc1: { f0: 128, vib: .04, breath: .3, name: "優雅老" },
    npc2: { f0: 96, vib: .045, breath: .4, slow: true, name: "躺平老" },
    npc3: { f0: 150, vib: .035, breath: .25, name: "鯊BEE" },
    grandson: { f0: 245, vib: .012, breath: .12, young: true, name: "孫子" },
    other: { f0: 135, vib: .035, breath: .3 }
  };
  function playerVoice() { try { const b = JSON.parse(localStorage.getItem("memoryMazeAvatar") || "{}").base; return "player" + ([0, 1, 2].includes(b) ? b : 1); } catch (e) { return "player1"; } }
  function voiceKey(v) { if (v === "player") return playerVoice(); return VOICES[v] ? v : "other"; }
  /* 打字聲:每個角色不同音高的輕柔滴答(不假裝是人聲) */
  function blipAt(v, t, vol) {
    const V = VOICES[voiceKey(v)], f = V.f0 * (V.young ? 4 : 5.2) * [1, 1.06, .95, 1.12][Math.floor(Math.random() * 4)];
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "triangle"; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + (V.slow ? .07 : .045));
    o.connect(g); g.connect(voiceBus); o.start(t); o.stop(t + .1);
  }
  let lastBlip = 0;
  function blip(v) {
    if (!cfg.sfxOn || !unlocked || !ensure() || !running()) return;
    const now = performance.now(), V = VOICES[voiceKey(v)];
    if (now - lastBlip < (V.slow ? 120 : 85) || now - lastEmote < 700) return; lastBlip = now;
    blipAt(v, t0(), .035);
  }
  function babble(v, n) {
    if (!cfg.sfxOn || !unlocked || !ensure() || !running()) return;
    const V = VOICES[voiceKey(v)], gap = V.slow ? .13 : .095;
    for (let i = 0; i < n; i++) blipAt(v, t0() + i * gap, .035);
  }
  /* 依台詞判斷情緒 */
  const EMOTES = [
    ["surprise", /(哇|咦|欸|誒|蝦米|什麼[!！?？]|天啊|我的天|不會吧|真的假的|嚇|竟然|居然|！？|!\?|\?!|？！)/],
    ["laugh", /(哈哈|呵呵|嘿嘿|嘻嘻|笑)/],
    ["realize", /(原來|難怪|我懂了|我知道了|想起來|對了|恍然)/],
    ["sigh", /(唉|哎|嘆|可惜|難過|寂寞|孤單|好累|累了|辛苦|擔心)/],
    ["cheer", /(太好了|好棒|做得好|成功|厲害|恭喜|謝謝|萬歲|讚)/],
    ["ponder", /^(嗯|呃|這個|讓我想想|我想想|等等|奇怪)|……$/],
    ["exclaim", /[!！]$/],
    ["question", /[?？]$/]
  ];
  /* 台詞的氣氛 → 背景音樂情境 */
  const MOODWORDS = [
    ["tense", /(小心|危險|不好了|糟了|糟糕|救命|快點|來不及|跌倒|摔倒|滑倒|摔了|受傷|緊急|警報|著火|昏倒|撞到|急診|送醫|手術刀|拆開|攻擊|黑衣人|黑影|不對勁)/],
    ["sad", /(唉|難過|傷心|孤單|寂寞|哭|眼淚|想念|過世|再也|沒有人|沒用|憂鬱|心情不好|悶悶|失落|後悔|老成這樣|忘了|忘記|記不得|看不清|聽不清)/],
    ["happy", /(太好了|好開心|真開心|恭喜|做得好|好棒|哈哈|謝謝你|新年快樂|萬歲)/]
  ];
  function emotion(text) { text = String(text || "").trim(); for (const [k, re] of EMOTES) if (re.test(text)) return k; return null; }
  function moodOfText(text) { text = String(text || ""); for (const [k, re] of MOODWORDS) if (re.test(text)) return k; return null; }
  /* 機器人語氣聲:方波短音依情緒畫出音高起伏(像老式遊戲機角色說話),每位老人基準音高不同 */
  const ROBO = {
    surprise: [[1, .07], [1.5, .07], [2, .14]],
    laugh: [[1.6, .06], [1.4, .06], [1.6, .06], [1.4, .06], [1.6, .06]],
    realize: [[1.5, .09], [1.1, .09], [1.35, .16]],
    sigh: [[1.3, .12], [1.1, .12], [.85, .22]],
    cheer: [[1.2, .07], [1.5, .07], [1.8, .15]],
    ponder: [[1, .14], [1.06, .1], [.94, .16]],
    exclaim: [[1.4, .06], [1.7, .1]],
    question: [[1, .08], [1.2, .08], [1.55, .12]]
  };
  function robotEmote(v, e) {
    const seq = ROBO[e]; if (!seq) return;
    const V = VOICES[voiceKey(v)], base = V.f0 * (V.young ? 3.2 : 4);
    let t = t0();
    seq.forEach(([m, d]) => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "square"; o.frequency.setValueAtTime(base * m, t);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.05, t + .008); g.gain.setValueAtTime(.05, t + d * .7); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g); g.connect(voiceBus); o.start(t); o.stop(t + d + .02); t += d + .025;
    });
  }
  let lastEmote = 0;
  function emote(text, v) {
    const e = emotion(text), m = moodOfText(text);
    if (m) { moodState.dialog = m; moodState.dialogAt = performance.now(); }
    if (!e || !cfg.sfxOn || !unlocked || !ensure() || !running()) return e;
    const now = performance.now(); if (now - lastEmote < 250) return e; lastEmote = now;
    robotEmote(v || "other", e);   /* 2026-11-18 晚 使用者:不要聽得出是人聲的錄音,老人一律用機器人聲 */
    if (api.debug) try { api.debug("vocal_" + e); } catch (err) { }
    return e;
  }
  function speak(v, text) { const e = emote(text, v); setTimeout(() => babble(v, Math.min(6, Math.max(2, Math.round(String(text || "").length / 6)))), e ? 700 : 0); return e; }

  const last = {};
  function sfx(name) {
    if (!cfg.sfxOn || !SFX[name] || !unlocked) return;
    const now = performance.now(), gap = name === "hover" ? 80 : name === "type" ? 35 : name === "step" ? 260 : name === "tick" ? 28 : 40;
    if (last[name] && now - last[name] < gap) return;
    if ((name === "click" || name === "hover") && last._any && now - last._any < 30) return;
    last[name] = now; last._any = now;
    if (name === "error") moodState.errors.push(now);
    if (name === "success" || name === "fanfare" || name === "unlock") { moodState.errors = []; moodState.happyUntil = now + 9000; }
    if (api.debug) try { api.debug(name); } catch (e) { }
    if (!ensure() || !running()) return;
    try { SFX[name](t0()); } catch (e) { }
  }

  /* ======================= 解鎖、互動偵測 ======================= */
  function unlock() {
    syncCinematic();
    if (!ensure()) return;
    if (!unlocked) { unlocked = true; refreshMusic(); }   /* 不再預載真人語氣錄音 */
  }
  const CLICKABLE = "button,a[href],[role=button],[role=tab],summary,select,label[for],.au-obj,.hit,.au-key,.au-slot,.memory-hotspot,.hotspot,.map-hotspot,.av4-half,[onclick],[tabindex]:not([tabindex='-1'])";
  function isHand(el, win) {
    if (!el || el.nodeType !== 1) return false;
    if (el.disabled || el.getAttribute("aria-disabled") === "true") return false;
    try { const c = win.getComputedStyle(el).cursor || ""; return c.includes("pointer") || c.includes("cursor-hand") || c.includes("grab"); } catch (e) { return false; }
  }
  function classify(el) {
    if (!el || !el.closest) return "click";
    if (el.closest("#item-prev,#item-next")) { const tab = el.ownerDocument.querySelector(".tabs .tab.active"); return { hair: "snip", outfit: "cloth", accessory: "clink" }[tab && tab.dataset.tab] || "pop"; }
    if (el.closest(".swatch")) return "drip";
    if (el.closest("#shell-fullscreen")) return "fullscreen";
    if (el.closest(".locked-room")) return "locked";
    if (el.closest(".av4-half,.av4-curtains")) return "curtain";
    if (el.closest("[role=tab],.tab,.tabs button,.cv-tab,.av4-tab,[data-tab]")) return "tab";
    if (el.closest("#randomize")) return "random";
    if (el.closest("#reset-look")) return "reset";
    if (el.closest("#confirm-character")) return "confirm";
    if (el.closest(".au-key")) return "key";
    if (el.closest("[aria-pressed],input[type=checkbox],input[type=radio],.switch,.toggle")) return "toggle";
    if (el.closest(".swatch,.color,.option,.au-obj,.hit,.hotspot,.memory-hotspot,.choice,.card")) return "pop";
    return "click";
  }
  function attach(win) {
    try { if (!win || win.__soundKit) return; win.__soundKit = true; } catch (e) { return; }
    const doc = win.document;
    let lastHover = null;
    doc.addEventListener("pointerover", e => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      const target = e.target.closest ? (e.target.closest(CLICKABLE) || e.target) : e.target;
      if (target === lastHover) return;
      const hand = isHand(e.target, win);
      lastHover = hand ? target : null;
      if (hand && !(e.relatedTarget && target.contains && target.contains(e.relatedTarget))) sfx(e.target.closest && e.target.closest(".av4-half") ? "rustle" : "hover");
    }, true);
    doc.addEventListener("pointerdown", e => {
      if (e.button !== 0) return;
      unlock();
      if (e.target.closest && e.target.closest("input[type=text],input:not([type]),textarea,input[type=range]")) return;
      const c = e.target.closest && e.target.closest(CLICKABLE);
      if (c || isHand(e.target, win)) sfx(classify(c || e.target));
    }, true);
    doc.addEventListener("keydown", e => {
      unlock();
      if (e.key === "Escape" && !e.repeat && api.toggleSettings) {
        const busy = frames(window.top, []).some(w => { try { return [...w.document.querySelectorAll(".sd-overlay,.au-overlay,.au-dialog:not([hidden]),dialog[open],.mgal-overlay,.rc-overlay,.modal-overlay.show,#modalOverlay.show,[aria-modal=true]:not([hidden]),.ev3:not(.done)")].some(el => el.getClientRects().length > 0); } catch (er) { return false; } });
        if (!busy) { e.preventDefault(); api.toggleSettings(); }
      }
      if ((e.key === "Enter" || e.key === " ") && e.target && e.target.matches && e.target.matches("button,[role=button],[role=tab]")) sfx(classify(e.target));
    }, true);
    doc.addEventListener("input", e => { if (e.target && e.target.matches && e.target.matches("input[type=text],input:not([type]),textarea")) sfx("type"); }, true);
    /* 計算這個頁面自己正在播放的 Web Audio 聲音數量(不含 SoundKit 自己的,SoundKit 的節點屬於最上層頁面) */
    if (win !== window) try {
      const P = win.AudioScheduledSourceNode && win.AudioScheduledSourceNode.prototype;
      if (P && !P.__skCount) {
        P.__skCount = true; win.__skActive = 0;
        const start = P.start, stop = P.stop;
        P.start = function () {
          if (!this.__skOn) { this.__skOn = true; win.__skActive++; this.addEventListener("ended", () => { if (this.__skOn) { this.__skOn = false; win.__skActive = Math.max(0, win.__skActive - 1); } }); }
          return start.apply(this, arguments);
        };
        P.stop = function () { return stop.apply(this, arguments); };
      }
    } catch (e) { }
    doc.addEventListener("dragstart", () => sfx("pickup"), true);
    doc.addEventListener("drop", () => sfx("drop"), true);
    /* 對話框與彈窗出現:<dialog> 打開時 */
    try {
      const proto = win.HTMLDialogElement && win.HTMLDialogElement.prototype;
      if (proto && !proto.__skWrapped) {
        proto.__skWrapped = true;
        const sm = proto.showModal, sh = proto.show, cl = proto.close;
        if (sm) proto.showModal = function () { sfx("open"); return sm.apply(this, arguments); };
        if (sh) proto.show = function () { sfx("open"); return sh.apply(this, arguments); };
        if (cl) proto.close = function () { if (this.open) sfx("close"); return cl.apply(this, arguments); };
      }
    } catch (e) { }
  }

  /* 走訪所有同源 iframe:裝上互動音效,並偵測是否有教育內容的聲音正在播放 → 背景音樂讓路 */
  function frames(win, out) {
    out.push(win);
    try { for (let i = 0; i < win.frames.length; i++) frames(win.frames[i], out); } catch (e) { }
    return out;
  }
  function eduAudioActive(wins) {
    try { if (window.speechSynthesis && window.speechSynthesis.speaking) return true; } catch (e) { }
    for (const w of wins) {
      try {
        const d = w.document;
        for (const m of d.querySelectorAll("audio,video")) if (!m.paused && !m.muted && m.volume > 0 && m.id !== "bgm" && !m.closest("#sfxClick,#sfxError,#sfxSuccess,#sfxUnlock") && !/sfx-/.test(m.currentSrc || "")) return true;
        if (w.speechSynthesis && w.speechSynthesis.speaking) return true;
        /* 房間自己用 Web Audio 播的聲音(例如房間四聽力的噪音示範、測驗回饋音)正在響 */
        if (w !== window && w.__skActive > 0) return true;
      } catch (e) { }
    }
    return false;
  }
  /* 切到背景分頁:整個音訊暫停(背景分頁的計時器會被節流,排程會亂);回來時只恢復現在這一首 */
  document.addEventListener("visibilitychange", () => {
    syncCinematic();
    if (!ctx) return;
    if (document.hidden) { try { ctx.suspend(); } catch (e) { } }
    else if (unlocked) { try { ctx.resume(); } catch (e) { } refreshMusic("scene"); }
  });
  let ducked = 0;
  setInterval(() => {
    const wins = frames(window, []);
    wins.forEach(attach);
    if (!ctx) return;
    /* E4(2026-11-18 晚):衛教聲音播放時幾乎靜音(原本);老人對話框開著時背景音樂壓低到 55%,讓說話聲更清楚 */
    const talking = wins.some(w => { try { return w.document.documentElement.classList.contains("sd-busy"); } catch (e) { return false; } });
    const duck = eduAudioActive(wins) ? 2 : talking ? 1 : 0;
    if (duck !== ducked) { ducked = duck; duckGain.gain.setTargetAtTime(duck === 2 ? .04 : duck === 1 ? .55 : 1, ctx.currentTime, duck ? .15 : .8); }
    applyMood(detectMood(wins));
  }, 400);
  attach(window);

  /* ======================= 音量面板(放在全螢幕鈕旁邊) ======================= */
  function buildPanel() {
    if (window.top !== window || document.getElementById("sk-sound")) return;
    const css = document.createElement("style");
    css.textContent = `
      .sk-btn{position:fixed;z-index:100;width:44px;height:44px;padding:0;display:flex;align-items:center;justify-content:center;background:#0d1b31cc;border:2px solid #c89443;color:#ffe2a0;cursor:pointer}
      .sk-btn:hover,.sk-btn:focus-visible{background:#1b3358;outline:2px solid #fff0c0;outline-offset:2px}
      .sk-btn svg{width:28px;height:28px;image-rendering:pixelated}
      .sk-btn.sk-off svg .sk-wave{display:none}.sk-btn:not(.sk-off) svg .sk-x{display:none}
      .sk-panel{position:fixed;z-index:101;min-width:230px;padding:12px 14px;background:#0d1b31f2;border:3px solid #c89443;box-shadow:0 0 0 3px #2a1a08,0 12px 30px rgba(0,0,0,.5);color:#fff2cf;font:800 14px/1.3 "Noto Sans TC","Microsoft JhengHei",sans-serif}
      .sk-panel[hidden]{display:none}
      .sk-row{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;margin:6px 0}
      .sk-row input[type=range]{width:120px;accent-color:#e0a84a}
      .sk-row button{min-width:46px;padding:3px 8px;border:2px solid #c89443;background:#1b3358;color:#ffe2a0;font:inherit;cursor:pointer}
      .sk-row button[aria-pressed=false]{background:#3a2a1a;color:#b9a68a}
      .sk-now{margin-top:6px;font-size:12px;color:#d9c08a}
      .sk-panel{min-width:300px;max-height:calc(100vh - 20px);overflow:auto}
      .sk-sep{margin:10px 0 4px;padding-top:8px;border-top:2px solid #c8944366;color:#ffd86d;font-size:13px;letter-spacing:.2em}
      .sk-row2{grid-template-columns:1fr auto}
      .sk-seg{display:flex;gap:4px}.sk-seg button{min-width:44px}
      .sk-row button[aria-pressed=true]{background:#c89443;color:#1b1206}
      .sk-row [data-s][aria-pressed=true]{background:#1b3358;color:#ffe2a0}
      .sk-acts{display:flex;gap:8px;margin-top:4px}.sk-acts[hidden],.sk-note[hidden]{display:none}
      .sk-acts button{flex:1;min-height:40px;border:2px solid #c89443;background:#1b3358;color:#ffe2a0;font:inherit;cursor:pointer}
      .sk-acts button[data-act=restart]{border-color:#d0705c;background:#4a1d16;color:#ffd6c8}
      .sk-acts button:hover,.sk-row button:hover{outline:2px solid #fff0c0}
      .sk-note{margin:6px 0 0;font-size:12px;color:#d9c08a;font-weight:700}
      @media (min-width:1800px) and (min-height:1000px){.sk-btn{width:64px;height:64px}.sk-btn svg{width:40px;height:40px}}`;
    document.head.appendChild(css);
    const btn = document.createElement("button");
    btn.id = "sk-sound"; btn.className = "sk-btn"; btn.type = "button"; btn.setAttribute("aria-label", "設定(音量、字體、高對比、回首頁)"); btn.title = "設定";
    btn.innerHTML = `<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><path fill="currentColor" d="M2 6h3l4-3v10l-4-3H2z"/><g class="sk-wave" fill="currentColor"><rect x="11" y="5" width="1" height="6"/><rect x="13" y="3" width="1" height="10"/></g><g class="sk-x" fill="#ff8a7a"><rect x="11" y="6" width="1" height="1"/><rect x="12" y="7" width="1" height="1"/><rect x="13" y="8" width="1" height="1"/><rect x="13" y="6" width="1" height="1"/><rect x="11" y="8" width="1" height="1"/></g></svg>`;
    const panel = document.createElement("div");
    panel.className = "sk-panel"; panel.hidden = true; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "設定");
    panel.innerHTML = `<div class="sk-row"><span>音樂</span><input type="range" min="0" max="1" step="0.05" data-k="musicVol" aria-label="音樂音量"><button type="button" data-t="musicOn"></button></div>
      <div class="sk-row"><span>音效</span><input type="range" min="0" max="1" step="0.05" data-k="sfxVol" aria-label="音效音量"><button type="button" data-t="sfxOn"></button></div>
      <div class="sk-row"><span>語音</span><input type="range" min="0" max="1" step="0.05" data-k="voiceVol" aria-label="角色說話聲音量"><i></i></div>
      <div class="sk-now"></div>
      <div class="sk-sep">畫面</div>
      <div class="sk-row sk-row2"><span>字體大小</span><div class="sk-seg" role="group" aria-label="字體大小"><button type="button" data-font="0">標準</button><button type="button" data-font="1">大</button><button type="button" data-font="2">特大</button></div></div>
      <div class="sk-row sk-row2"><span>高對比</span><button type="button" data-s="contrast"></button></div>
      <div class="sk-row sk-row2"><span>減少動態</span><button type="button" data-s="reduce"></button></div>
      <div class="sk-row sk-row2"><span>對話自動前進</span><button type="button" data-s="auto"></button></div>
      <div class="sk-sep">遊戲</div>
      <div class="sk-acts"><button type="button" data-act="home">返回首頁</button><button type="button" data-act="restart">重新開始</button></div>
      <div class="sk-acts"><button type="button" data-act="stats" title="下載這台電腦上的匿名遊玩紀錄(各房時間、答錯與提示次數),給測試觀察用">匯出遊玩紀錄</button></div>
      <p class="sk-note">回首頁會保留進度;重新開始會清空所有房間的進度。</p>`;
    document.body.append(btn, panel);
    const sync = () => {
      btn.classList.toggle("sk-off", !cfg.musicOn && !cfg.sfxOn);
      panel.querySelectorAll("[data-k]").forEach(i => { i.value = cfg[i.dataset.k]; });
      panel.querySelectorAll("[data-t]").forEach(b => { b.setAttribute("aria-pressed", String(cfg[b.dataset.t])); b.textContent = cfg[b.dataset.t] ? "開" : "關"; });
      panel.querySelector(".sk-now").textContent = cinematic ? (cfg.musicOn ? "♪ 正在播放:" + cinematic.name : "音樂已關閉") : current ? "♪ 正在播放:" + current.name : (cfg.musicOn ? "" : "音樂已關閉");
      const S = UI.get();
      panel.querySelectorAll("[data-font]").forEach(b => b.setAttribute("aria-pressed", String(Number(b.dataset.font) === S.font)));
      panel.querySelectorAll("[data-s]").forEach(b => { const on = !!S[b.dataset.s]; b.setAttribute("aria-pressed", String(on)); b.textContent = on ? "開" : "關"; });
      const inShell = !!(window.top && window.top.MemoryMazeShell);
      panel.querySelector(".sk-acts").hidden = !inShell; panel.querySelector(".sk-note").hidden = !inShell;
    };
    const place = () => {
      const fs = document.getElementById("shell-fullscreen"), r = fs && fs.getBoundingClientRect();
      if (r && r.width) { btn.style.left = (r.right + 6) + "px"; btn.style.top = r.top + "px"; btn.style.width = r.width + "px"; btn.style.height = r.height + "px"; }
      else { btn.style.left = "6px"; btn.style.bottom = "6px"; }
      const b = btn.getBoundingClientRect(), pw = panel.offsetWidth || 300, ph = panel.offsetHeight || 110;
      panel.style.left = Math.min(innerWidth - pw - 8, b.left) + "px";
      panel.style.top = (b.top > ph + 12 ? b.top - ph - 8 : b.bottom + 8) + "px";
    };
    btn.addEventListener("click", e => { e.stopPropagation(); panel.hidden = !panel.hidden; sync(); place(); });
    /* F2(2026-11-18 晚):按 Esc 開/關設定選單(畫面上有其他對話框、面板時不搶 Esc) */
    api.toggleSettings = () => { panel.hidden = !panel.hidden; sync(); place(); if (!panel.hidden) { const f = panel.querySelector("input,button"); f && f.focus(); } };
    document.addEventListener("pointerdown", e => { if (!panel.hidden && !panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) panel.hidden = true; }, true);
    panel.addEventListener("input", e => { const k = e.target.dataset.k; if (!k) return; cfg[k] = Number(e.target.value); SET({ musicVol: "memoryMazeMusicVol", sfxVol: "memoryMazeSfxVol", voiceVol: "memoryMazeVoiceVol" }[k], cfg[k]); applyVolumes(); if (k === "sfxVol") sfx("pop"); if (k === "voiceVol") babble("npc1", 3); });
    panel.addEventListener("click", e => {
      const el = e.target.closest("button"); if (!el) return; const d = el.dataset;
      if (d.t) { api.set(d.t, !cfg[d.t]); sync(); return; }
      if (d.font != null) { UI.set({ font: Number(d.font) }); sfx("toggle"); sync(); return; }
      if (d.s) { const S = UI.get(); UI.set({ [d.s]: !S[d.s] }); sfx("toggle"); sync(); return; }
      if (d.act === "stats") { try { window.top.MemoryMazeStats.export(); } catch (er) { } return; }
      if (d.act === "home") { panel.hidden = true; try { window.top.MemoryMazeShell.home(); } catch (er) { } return; }
      if (d.act === "restart") {
        if (!d.armed) { d.armed = "1"; el.textContent = "再按一次確認"; setTimeout(() => { delete el.dataset.armed; el.textContent = "重新開始"; }, 3000); return; }
        panel.hidden = true; delete el.dataset.armed; el.textContent = "重新開始"; try { window.top.MemoryMazeShell.restart(); } catch (er) { } return;
      }
    });
    setInterval(() => { place(); if (!panel.hidden) sync(); }, 500); place(); sync();
    api._sync = sync;
  }

  /* ======================= 2026-11-18 設定選單:字體大小、高對比、減少動態 =======================
     設定存在 localStorage「memoryMazeSettings」(重新整理不會清掉);由最外層頁面往下,套用到每一層頁框(外殼 → 遊戲 → 房間) */
  const UI = (() => {
    const K = "memoryMazeSettings", D = { font: 0, contrast: false, reduce: false, auto: false };
    const get = () => { try { return Object.assign({}, D, JSON.parse(localStorage.getItem(K) || "{}")); } catch (e) { return Object.assign({}, D); } };
    const TXT = ".sd-text,.sd-name,.au-dlg-text,.au-dlg-name,.mg-bubble,.room-hint,.room45-hint,p.hint,.hv4-say,.mgal-name,.mgal-tname,.mgal-now,.au-modal p,.au-modal li,.au-modal h2,.au-modal h3,.au-mission-item,.dialog-content p";
    const CSS = `
html[data-mm-font="1"] :is(${TXT}){zoom:1.15}
html[data-mm-font="2"] :is(${TXT}){zoom:1.3}
html.mm-contrast :is(.sd-box,.au-dlgbox,.mg-bubble,.mgal-body,.mgal-card,.mgal-track,.hv4-say){background:#fff!important;border-color:#000!important}
html.mm-contrast :is(.sd-text,.au-dlg-text,.mg-bubble,.mg-text,.mgal-name,.mgal-tname,.hv4-say,.au-modal p,.au-modal li){color:#000!important;font-weight:900!important;text-shadow:none!important}
html.mm-contrast :is(.room-hint,.room45-hint,p.hint){background:#000!important;color:#fff!important;font-weight:900!important;padding:2px 8px!important}
html.mm-contrast :is(.sd-name,.au-dlg-name){background:#000!important;color:#fff!important}
html.mm-reduce *,html.mm-reduce *::before,html.mm-reduce *::after{animation-duration:.01ms!important;animation-delay:0s!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}`;
    function applyDoc(doc, S) {
      const h = doc.documentElement; if (!h) return;
      if (h.dataset.mmFont !== String(S.font)) h.dataset.mmFont = String(S.font);
      if (h.classList.contains("mm-contrast") !== !!S.contrast) h.classList.toggle("mm-contrast", !!S.contrast);
      if (h.classList.contains("mm-reduce") !== !!S.reduce) h.classList.toggle("mm-reduce", !!S.reduce);
      if (!doc.getElementById("mm-settings-css")) { const st = doc.createElement("style"); st.id = "mm-settings-css"; st.textContent = CSS; (doc.head || h).appendChild(st); }
    }
    function walk(win, S, depth) {
      if (depth > 5) return;
      try { applyDoc(win.document, S); } catch (e) { return; }   // 不同來源的頁框讀不到,略過
      for (let i = 0; i < win.frames.length; i++) walk(win.frames[i], S, depth + 1);
    }
    function applyAll() { const S = get(); let top = window; try { if (window.top && window.top.document) top = window.top; } catch (e) { } walk(top, S, 0); }
    function set(patch) { try { localStorage.setItem(K, JSON.stringify(Object.assign(get(), patch))); } catch (e) { } applyAll(); }
    applyAll(); setInterval(applyAll, 1000);   // 新開的房間頁框一秒內就會套用
    return { get, set, applyAll };
  })();

  const api = {
    music, sfx, unlock, attach, blip, babble, emote, speak, emotion, ui: UI,
    cinematicMusic, stopCinematicMusic,
    get cinematic() { return cinematic ? cinematic.id : null; },
    songs: Object.keys(SONGS),
    get current() { return current ? current.id : null; },
    /* 驗證用(唯讀):目前想播的曲、情境、仍在出聲的播放器數(換曲 0.3 秒後應該 ≤ 1) */
    debugState() { let playing = 0, fading = 0; for (const p of live) p.stopped ? fading++ : playing++; return { wanted, mood: curMood, epoch, livePlayers: playing, fadingOut: fading, ctxState: ctx ? ctx.state : "none", unlocked }; },
    get currentMood() { return curMood; },
    mood(m, ms) { moodState.explicit = m || null; moodState.explicitUntil = performance.now() + (ms || 8000); },
    get settings() { return Object.assign({}, cfg); },
    set(k, v) {
      if (!(k in cfg)) return;
      cfg[k] = v;
      if (k === "musicOn") { SET("memoryMazeMusic", v ? "on" : "off"); refreshMusic(); }
      if (k === "sfxOn") SET("memoryMazeSfx", v ? "on" : "off");
      if (k === "musicVol") SET("memoryMazeMusicVol", v);
      if (k === "sfxVol") SET("memoryMazeSfxVol", v);
      if (k === "voiceVol") SET("memoryMazeVoiceVol", v);
      applyVolumes(); api._sync && api._sync();
    },
    toggleMusic() { api.set("musicOn", !cfg.musicOn); return cfg.musicOn; },
    _sync: null
  };
  window.SoundKit = api;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", buildPanel); else buildPanel();
})();
