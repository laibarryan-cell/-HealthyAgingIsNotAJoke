/* ==========================================================================
   art-ui-guard.js — load FIRST in every room page (inside <head>, before the page's own scripts).
   Lets the shell pause / resume a room that is no longer on screen:
     parent.postMessage({type:'memoryMaze:pause'|'memoryMaze:resume'}, '*')
   While paused: timeouts / intervals / requestAnimationFrame callbacks are frozen (and resumed with the
   remaining delay), CSS animations are paused, audio / speech / Web Audio is stopped, and pointer / key
   events cannot reach the page.  Timer ids stay valid across pause/resume.
   ========================================================================== */
(() => {
  'use strict';
  if (window.__auGuard) return;
  const W = window;
  const rSet = W.setTimeout.bind(W), rClear = W.clearTimeout.bind(W), rSetI = W.setInterval.bind(W), rClearI = W.clearInterval.bind(W);
  const rRaf = W.requestAnimationFrame.bind(W), rCaf = W.cancelAnimationFrame.bind(W);
  let paused = false, nextId = 1e6;
  const timers = new Map();   // fake id -> {real, fn, args, delay, start, interval}
  const rafs = new Map();     // fake id -> {real, cb}
  const media = new Set(), ctxs = new Set(), wasPlaying = new Set();

  function arm(id, t, delay) {
    t.start = performance.now(); t.left = delay;
    if (t.interval) { t.real = rSetI(() => { try { t.fn(...t.args); } catch (e) { setTimeout(() => { throw e; }); } }, t.delay); }
    else { t.real = rSet(() => { timers.delete(id); try { typeof t.fn === 'function' ? t.fn(...t.args) : (0, eval)(String(t.fn)); } catch (e) { setTimeout(() => { throw e; }); } }, delay); }
  }
  W.setTimeout = function (fn, delay = 0, ...args) {
    const id = nextId++, t = { fn, args, delay: Math.max(0, +delay || 0), interval: false };
    timers.set(id, t); if (paused) { t.real = 0; t.left = t.delay; } else arm(id, t, t.delay); return id;
  };
  W.setInterval = function (fn, delay = 0, ...args) {
    const id = nextId++, t = { fn, args, delay: Math.max(1, +delay || 0), interval: true };
    timers.set(id, t); if (paused) { t.real = 0; t.left = t.delay; } else arm(id, t, t.delay); return id;
  };
  W.clearTimeout = W.clearInterval = function (id) {
    const t = timers.get(id);
    if (t) { if (t.real) (t.interval ? rClearI : rClear)(t.real); timers.delete(id); } else { rClear(id); rClearI(id); }
  };
  W.requestAnimationFrame = function (cb) {
    const id = nextId++, o = { cb, real: 0 };
    rafs.set(id, o);
    if (!paused) o.real = rRaf(ts => { rafs.delete(id); cb(ts); });
    return id;
  };
  W.cancelAnimationFrame = function (id) { const o = rafs.get(id); if (o) { if (o.real) rCaf(o.real); rafs.delete(id); } else rCaf(id); };

  /* media + Web Audio + speech */
  const origPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { media.add(this); if (paused) { wasPlaying.add(this); return Promise.resolve(); } return origPlay.apply(this, arguments); };
  const AC = W.AudioContext || W.webkitAudioContext;
  if (AC) {
    const P = function (...a) { const c = new AC(...a); ctxs.add(c); return c; };
    P.prototype = AC.prototype; W.AudioContext = P; if (W.webkitAudioContext) W.webkitAudioContext = P;
  }

  /* input is ignored while paused */
  ['click', 'dblclick', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'pointermove', 'keydown', 'keyup', 'input', 'touchstart', 'wheel'].forEach(type =>
    W.addEventListener(type, e => { if (paused) { e.stopImmediatePropagation(); e.preventDefault(); } }, true));

  function pause() {
    if (paused) return; paused = true;
    document.documentElement.classList.add('au-paused');
    const now = performance.now();
    timers.forEach(t => {
      if (!t.real) return;
      if (t.interval) rClearI(t.real); else { rClear(t.real); t.left = Math.max(0, t.left - (now - t.start)); }
      t.real = 0;
    });
    rafs.forEach(o => { if (o.real) { rCaf(o.real); o.real = 0; } });
    media.forEach(m => { try { if (!m.paused) { wasPlaying.add(m); m.pause(); } } catch (e) { } });
    ctxs.forEach(c => { try { c.suspend(); } catch (e) { } });
    try { W.speechSynthesis && W.speechSynthesis.cancel(); } catch (e) { }
  }
  function resume() {
    if (!paused) return; paused = false;
    document.documentElement.classList.remove('au-paused');
    timers.forEach((t, id) => { if (!t.real) arm(id, t, t.interval ? t.delay : t.left); });
    rafs.forEach((o, id) => { if (!o.real) o.real = rRaf(ts => { rafs.delete(id); o.cb(ts); }); });
    wasPlaying.forEach(m => { try { origPlay.call(m).catch(() => { }); } catch (e) { } }); wasPlaying.clear();
    ctxs.forEach(c => { try { c.resume(); } catch (e) { } });
  }
  W.addEventListener('message', e => {
    if (e.source !== W.parent || W.parent === W) return;
    const t = e.data && e.data.type;
    if (t === 'memoryMaze:pause') pause(); else if (t === 'memoryMaze:resume') resume();
  });
  const st = document.createElement('style');
  st.textContent = 'html.au-paused *,html.au-paused *::before,html.au-paused *::after{animation-play-state:paused!important;transition:none!important}';
  document.documentElement.appendChild(st);
  W.__auGuard = { pause, resume, isPaused: () => paused, stats: () => ({ timers: timers.size, rafs: rafs.size, media: media.size, ctxs: ctxs.size }) };
})();
