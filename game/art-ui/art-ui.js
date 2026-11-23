/* ==========================================================================
   art-ui.js — shared UI kit built only from the approved sprites in assets/art-final/ui.
   Used by game/index.html (map, room 6, room 7, rooms 4/5 HUD) and by room pages 1–3 (iframes).
   No dependencies.  Public API: window.ArtUI
   ========================================================================== */
(() => {
  'use strict';
  if (window.ArtUI) return;
  const scriptEl = document.currentScript;
  /* 第三修改計劃新增內容2 A1:像素游標(每一頁都載入) */
  if (scriptEl && !window.__pixelCursor) { const pc = document.createElement("script"); pc.src = new URL("../shared/pixel-cursor.js?v=2", scriptEl.src).href; document.head.appendChild(pc); }
  const UI = new URL('../assets/art-final/ui/', scriptEl.src).href;
  const CHARS = new URL('../assets/characters/', scriptEl.src).href;
  const ROOMS_IMG = new URL('../assets/art-final/rooms/', scriptEl.src).href;
  /* 第三修改計劃 B5:像素框九宮格合成成一張圖,消除接縫細線(所有載入 art-ui 的頁面一起生效) */
  if (!window.PixelFrame && !document.querySelector('script[data-pixel-frame]')) { const pf = document.createElement('script'); pf.src = new URL('../shared/pixel-frame.js', scriptEl.src).href; pf.dataset.pixelFrame = ''; document.head.appendChild(pf); }
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const sprite = (name, cls = '') => `<img class="au-img ${cls}" src="${UI}${name}.png" alt="" draggable="false">`;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- room catalogue (official names) ---------------- */
  const ROOMS = {
    0: { name: '任務說明', theme: '記憶之家', total: 6, intro: '', hint: '點選地圖上發亮的入口進入房間。' },
    1: { name: '視界休息角', theme: '視力照護', img: 'room1-vision-rest.png', total: 5,
      intro: '這是我常坐著看書的角落。方格表、眼鏡、眼藥水……好像都藏著和視力有關的線索。', hint: '留意每兩秒亮起一次的物品，逐一點擊調查；完成探索並在「物品」中完成組合後，輸入本房密碼。' },
    2: { name: '行動防跌浴室', theme: '行動與防跌', img: 'room2-mobility-bathroom.png', total: 5,
      intro: '浴室最怕滑倒。扶手、地墊和鞋子，都值得仔細看看。', hint: '依序調查洗手台、馬桶扶手、淋浴區等物品；完成探索並在「物品」中完成組合後，輸入本房密碼。' },
    3: { name: '營養照護廚房', theme: '營養', img: 'room3-nutrition-kitchen.png', total: 5,
      intro: '廚房的味道讓我想起每天吃飯的習慣。桌上、冰箱旁，有哪些營養的線索呢？', hint: '桌上的食物、調味料、體重計和冰箱上的便利貼都藏著線索。' },
    4: { name: '聽力照護客廳', theme: '聽力', img: 'room4-hearing-livingroom.png', total: 5,
      intro: '客廳的電視、電話和說話的聲音……這些好像都和我聽不聽得清楚有關。', hint: '留意每兩秒亮起一次的物品；聽力線索要仔細聆聽。' },
    5: { name: '認知照護廊道', theme: '認知', img: 'room5-cognition-hallway.png', total: 5,
      intro: '走廊上好多照片和日常用品。日期、藥盒和電話，也許能幫我把生活順序想起來。', hint: '照片、藥盒、電話、錢包與廚房，都是記憶的線索。' },
    6: { name: '心理陪伴客廳', theme: '心理能力', img: 'room6-sunny-plant-corner.png', total: 3,
      intro: '客廳裡有平板、家庭相簿和醫藥盒。看看它們想告訴我什麼。', hint: '依序探索平板、家庭相簿與醫藥盒；完成探索並在「物品」中完成組合後，輸入本房密碼。' },
    7: { name: '記憶核心', theme: '終點', img: 'room7-memory-core.png', total: 6, intro: '六段記憶都回來了。走近每一座記憶臺，把這趟旅程重新看一遍。', hint: '點選六座記憶臺回顧，全部看完後點中間的記憶核心。' }
  };

  /* ---------------- fit: integer sprite multiples ---------------- */
  function fit() {
    const w = innerWidth, h = innerHeight;
    const s = (h >= 1000 && w >= 1700) ? 3 : (h >= 600 && w >= 960) ? 2 : 1;
    const hh = 1;                       // HUD plates stay 1x (a 2x title bar would eat 12% of a 1080p screen)
    const q = s >= 3 ? 2 : 1;
    const r = document.documentElement.style;
    r.setProperty('--au-s', s); r.setProperty('--au-o', Math.min(s, 2)); r.setProperty('--au-h', hh); r.setProperty('--au-q', q);
    const top = $('#endingScreen .topbar');
    if (top && top.offsetHeight) r.setProperty('--au-top', top.offsetHeight + 'px');
    return { s, h: hh, q };
  }
  addEventListener('resize', fit);

  /* ---------------- shared store (same-origin: shell + room iframes) ---------------- */
  const KEY = 'memoryMazeArt';
  const store = {
    get() { try { return Object.assign({ visited: [], completed: [], clues: {}, intro: {} }, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return { visited: [], completed: [], clues: {}, intro: {} }; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { } },
    patch(fn) { const v = store.get(); fn(v); store.set(v); return v; },
    visit(n) { store.patch(v => { if (!v.visited.includes(n)) v.visited.push(n); }); },
    complete(n) { store.patch(v => { if (!v.completed.includes(n)) v.completed.push(n); if (!v.visited.includes(n)) v.visited.push(n); }); },
    setClues(n, list) { store.patch(v => { v.clues[n] = list; }); },
    introSeen(n) { const v = store.get(); return !!v.intro[n]; },
    markIntro(n) { store.patch(v => { v.intro[n] = 1; }); },
    reset() { try { localStorage.removeItem(KEY); } catch (e) { } }
  };

  /* ---------------- player (character data persisted by the shell) ---------------- */
  function player() { try { return JSON.parse(localStorage.getItem('memoryMazePlayer') || 'null'); } catch (e) { return null; } }
  function avatarHTML(p = player()) {
    if (!p) return '';
    if (p.portrait) return `<span class="au-av au-av-doll-wrap" data-base="${Number(p.base) || 0}"><img class="au-av-doll" src="${p.portrait}" alt=""></span>`;
    const body = CHARS + (p.characterAsset || 'elder-1-look-1.png');
    const acc = CHARS + (p.accessoryAsset || 'acc-none.png');
    return `<span class="au-av" data-base="${Number(p.base) || 0}"><img class="au-av-body" src="${body}" alt=""><img class="au-av-acc" src="${acc}" alt=""></span>`;
  }

  /* ======================================================================
     KEYPAD  (密碼輸入面板): digits 0-9, display, back, clear, confirm, lock / error / success
     ====================================================================== */
  const LOCK_AFTER = 3, LOCK_MS = 3000;
  function buildKeypad({ existingInput } = {}) {
    const root = el('div', 'au-keypad');
    root.dataset.state = 'idle';
    root.innerHTML = `
      <div class="au-pin-display"><div class="au-pin-slot"></div><span class="au-pin-state" aria-hidden="true">${sprite('pin-lock', 'au-st-lock')}${sprite('pin-error', 'au-st-error')}${sprite('pin-success', 'au-st-success')}</span></div>
      <div class="au-pin-grid">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(d => `<button type="button" class="au-key" data-k="${d}" aria-label="數字 ${d}">${sprite('pin-key-' + d)}</button>`).join('')}</div>
      <div class="au-pin-actions">
        <button type="button" class="au-key au-act" data-act="back" aria-label="返回（刪除一碼）">${sprite('pin-back')}</button>
        <button type="button" class="au-key au-act" data-act="clear" aria-label="清除">${sprite('pin-clear')}</button>
        <button type="button" class="au-key au-act au-confirm" data-act="confirm" aria-label="確認">${sprite('pin-confirm')}</button>
      </div>
      <p class="au-pin-msg" role="status" aria-live="polite"></p>`;
    const slot = $('.au-pin-slot', root);
    let input = existingInput;
    if (!input) { input = el('input'); input.setAttribute('inputmode', 'numeric'); input.setAttribute('autocomplete', 'off'); input.setAttribute('aria-label', '密碼'); input.placeholder = '輸入數字密碼'; }
    input.classList.add('au-input'); input.maxLength = 12;
    slot.appendChild(input);
    return { root, input };
  }

  function wireKeypad(root, input, { onConfirm, isErrorNow, maxLen = 12, silent = false }) {
    const msg = $('.au-pin-msg', root);
    let errs = 0, lockTimer = 0, stateTimer = 0, locked = false;
    const setState = (s, m) => {
      clearTimeout(stateTimer); root.dataset.state = s; msg.textContent = m || '';
      if (s === 'error') { root.classList.remove('au-shake'); void root.offsetWidth; root.classList.add('au-shake'); }
    };
    const idleSoon = ms => { clearTimeout(stateTimer); stateTimer = setTimeout(() => { if (!locked) setState('idle', ''); }, ms); };
    const api = {
      root, input,
      value: () => input.value,
      set(v) { input.value = String(v).replace(/\D/g, '').slice(0, maxLen); input.dispatchEvent(new Event('input', { bubbles: true })); },
      clear() { api.set(''); input.focus({ preventScroll: true }); },
      state: () => root.dataset.state,
      error(m = '密碼不正確，再試一次') {
        if (!silent) sfx.play('error');
        errs++; setState('error', m); if (!silent && errs >= 3) { const SK = skRef(); SK && setTimeout(() => SK.sfx('dizzy'), 260); }
        if (errs >= LOCK_AFTER) return api.lock();
        idleSoon(1200);
      },
      success(m = '密碼正確！') { if (!silent) sfx.play('success'); errs = 0; setState('success', m); },
      lock() {
        locked = true; let left = Math.round(LOCK_MS / 1000); setState('locked', `錯誤太多次，鎖定 ${left} 秒`);
        input.disabled = true; $$('.au-key', root).forEach(b => b.disabled = true);
        clearInterval(lockTimer);
        lockTimer = setInterval(() => {
          left--;
          if (left > 0) { msg.textContent = `錯誤太多次，鎖定 ${left} 秒`; return; }
          clearInterval(lockTimer); locked = false; errs = 0; input.disabled = false; $$('.au-key', root).forEach(b => b.disabled = false);
          setState('idle', ''); api.clear();
        }, 1000);
      },
      reset() { if (locked) return; errs = 0; setState('idle', ''); input.value = ''; },
      destroy() { clearInterval(lockTimer); clearTimeout(stateTimer); },
      isLocked: () => locked
    };
    const confirm = () => {
      if (locked) return;
      if (!input.value.trim()) { api.error('請先輸入密碼'); errs = Math.max(0, errs - 1); return; }
      const r = onConfirm && onConfirm(input.value.trim(), api);
      Promise.resolve(r).then(res => { if (res === 'wrong') api.error(); else if (res === 'ok') api.success(); });
    };
    root.addEventListener('mousedown', e => { if (e.target.closest('.au-key')) e.preventDefault(); });
    root.addEventListener('click', e => {
      const b = e.target.closest('.au-key'); if (!b || b.disabled) return;
      if (b.dataset.k != null) { if (input.value.length < maxLen) api.set(input.value + b.dataset.k); }
      else if (b.dataset.act === 'back') api.set(input.value.slice(0, -1));
      else if (b.dataset.act === 'clear') api.clear();
      else if (b.dataset.act === 'confirm') confirm();
      if (root.dataset.state === 'error') setState('idle', '');
      input.focus({ preventScroll: true });
    });
    input.addEventListener('input', () => { const c = input.value.replace(/\D/g, '').slice(0, maxLen); if (c !== input.value) input.value = c; });
    api.confirm = confirm;
    return api;
  }

  /** standalone keypad (shell-controlled dialogs): host is any element */
  function mountKeypad(host, opts = {}) {
    const { root, input } = buildKeypad();
    host.appendChild(root);
    const api = wireKeypad(root, input, opts);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); api.confirm(); } });
    return api;
  }

  /** upgrade an existing numeric <input> + submit button without touching the page's own logic */
  function enhanceExisting({ input, submit, feedback, onState }) {
    if (!input || input.dataset.auKeypad) return null;
    input.dataset.auKeypad = '1';
    if (submit) submit.classList.add('au-submit-proxy');
    const parent = input.parentNode, before = input.nextSibling;
    const { root } = buildKeypad({ existingInput: input });
    parent.insertBefore(root, before);
    const api = wireKeypad(root, input, {
      onConfirm() {
        const beforeText = feedback ? feedback.textContent.trim() : '';
        const beforeVal = input.value;
        submit.click();
        return new Promise(res => setTimeout(() => {
          const fbText = feedback ? feedback.textContent.trim() : '';
          const fbShown = feedback && !feedback.hidden && fbText && getComputedStyle(feedback).display !== 'none';
          const overlay = input.closest('[hidden],.overlay,.dialog-overlay');
          const gone = !input.offsetParent;               // dialog closed → success
          const cleared = input.value === '' && beforeVal !== '';
          const err = /不正確|錯誤|再試|不對/.test(fbText) || (fbShown && fbText !== beforeText) || (cleared && !gone);
          const okMsg = /密碼正確/.test(fbText) && !/不正確/.test(fbText);   // 房間六:成功訊息留在對話框裡一下才關
          if (gone || okMsg) res('ok'); else if (err) res('wrong'); else res('ok');
        }, 220));
      }
    });
    // Enter: handled here (capture phase) so the page's own Enter handler does not submit a second time
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); api.confirm(); } }, true);
    // each time the page opens its dialog the keypad starts fresh (a lock-out in progress is kept)
    const host = input.closest('[hidden],.overlay,.dialog-overlay');
    if (host) new MutationObserver(() => { if (!host.hidden) api.reset(); }).observe(host, { attributes: true, attributeFilter: ['hidden'] });
    if (onState) onState(api);
    return api;
  }

  /* ======================================================================
     DIALOG  (對話框與角色對話框): big dialog, name bar, portrait frame, next arrow, listening icon
     ====================================================================== */
  let dlg = null;
  function dialogClose(skip) { if (!dlg) return; const d = dlg; dlg = null; clearTimeout(d.timer); document.removeEventListener('keydown', d.key, true); d.root.remove(); d.done(skip === true); }
  function skRef() { try { return window.SoundKit || (window.top && window.top.SoundKit) || null; } catch (e) { return window.SoundKit || null; } }   /* function skRef2:最上層共用音效 */
  function dialogOpen({ host = document.body, name, avatar = true, lines = [], listening = false, onClose } = {}) {
    dialogClose(true);
    lines = lines.map(l => typeof l === 'string' ? { text: l } : l).filter(l => l && l.text);
    if (!lines.length) return Promise.resolve(false);
    const p = player();
    const who = name || (p && p.name) || '我';
    const root = el('div', 'au-dialog');
    if (host === document.body) root.classList.add('au-fixed');
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-live', 'polite');
    root.innerHTML = `
      <div class="au-dlg-row">
        ${avatar ? `<div class="au-portrait">${sprite('dialog-portrait-frame-leaf', 'au-portrait-frame')}<div class="au-portrait-inner">${avatarHTML(p)}</div></div>` : ''}
        <div class="au-dlg-wrap">
          <div class="au-plate au-dlg-name">${esc(who)}</div>
          <div class="au-dlgbox"><div class="au-dlg-text" aria-atomic="true"></div>
            <span class="au-dlg-listen" hidden>${sprite('dialog-listen-icon')}<b>仔細聆聽中…</b></span>
            ${sprite('dialog-next-arrow', 'au-dlg-next')}
          </div>
          <div class="au-dlg-count"></div>
        </div>
      </div>`;
    host.appendChild(root);
    const textEl = $('.au-dlg-text', root), cnt = $('.au-dlg-count', root), listen = $('.au-dlg-listen', root), nameEl = $('.au-dlg-name', root);
    let i = -1, full = '', pos = 0, typing = false, resolve;
    const done = skipped => { onClose && onClose(skipped); resolve(skipped); };
    const prom = new Promise(r => resolve = r);
    const show = () => {
      const l = lines[i]; full = l.text; pos = 0; typing = true;
      const SK = skRef(), vname = l.name || who, voice = /孫/.test(vname) ? 'grandson' : (!l.name && !name) || (p && vname === p.name) ? 'player' : 'other';
      if (SK) SK.emote(full, voice);
      if (l.name) nameEl.textContent = l.name; else nameEl.textContent = who;
      listen.hidden = !(l.listening || listening);
      cnt.textContent = lines.length > 1 ? `${i + 1} / ${lines.length}` : '';
      root.classList.toggle('au-last', i === lines.length - 1);
      const step = () => {
        if (!typing) return;
        pos = Math.min(full.length, pos + 1); textEl.textContent = full.slice(0, pos); if (SK && pos % 2) SK.blip(voice);
        if (pos >= full.length) { typing = false; root.classList.add('au-ready'); return; }
        dlg.timer = setTimeout(step, 26);
      };
      root.classList.remove('au-ready'); textEl.textContent = '';
      if (reduced()) { typing = false; textEl.textContent = full; root.classList.add('au-ready'); } else step();
    };
    const next = () => {
      if (typing) { typing = false; clearTimeout(dlg.timer); textEl.textContent = full; root.classList.add('au-ready'); return; }
      if (i >= lines.length - 1) return dialogClose(false);
      i++; show();
    };
    const key = e => {
      if (!dlg || dlg.root !== root) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); next(); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); dialogClose(true); }
    };
    dlg = { root, key, done, timer: 0 };
    document.addEventListener('keydown', key, true);
    root.addEventListener('click', next);
    i = 0; show();
    return prom;
  }

  /* ======================================================================
     STORY INTRO (B5–B8): NPC 立繪 + 玩家立繪的進房對話,最後出現「要開始冒險了嗎?」面板
     實際元件在 game/shared/story-dialog.js,台詞在 game/shared/story-copy.js
     ====================================================================== */
  let storyLoading = null;
  function loadStory() {
    if (window.StoryDialog && window.StoryCopy) return Promise.resolve(true);
    if (storyLoading) return storyLoading;
    const load = name => new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = new URL('../shared/' + name, scriptEl.src).href; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); });
    storyLoading = load('story-copy.js?v=20261118-3').then(() => load('story-art-config.js')).then(() => load('story-dialog.js?v=20261118-2')).then(() => true).catch(() => { storyLoading = null; return false; });
    return storyLoading;
  }
  async function storyIntro(n, { host } = {}) {
    const ok = await loadStory();
    const r = ROOMS[n];
    if (!ok) return dialogOpen({ host, lines: [{ text: r.intro }, { text: `房間 ${n}｜${r.name}：${r.hint}`, name: '任務提示' }] });
    const lines = window.StoryCopy.introFor(n, r);
    /* 2026-11-18 教學只講一次:第一間進去的房間播完整開場;之後的房間只講歡迎句+這間房的提示,也不再跳「要開始冒險了嗎?」 */
    const seenOther = Object.keys(store.get().intro).some(k => Number(k) !== n && Number(k) !== 7);
    if (seenOther) {
      const all = lines.lines || [], hint = all.find(l => l && l.text === r.hint);
      await window.StoryDialog.play({ npc: lines.npc, position: 'bottom', lines: [all[0], hint].filter(Boolean) });
      return true;
    }
    await window.StoryDialog.play({ npc: lines.npc, position: 'bottom', lines: lines.lines });
    await window.StoryDialog.confirmStart({ npc: lines.npc, text: lines.start });
    return true;
  }

  /* ======================================================================
     CLUE CARDS / COLLECTION  (線索卡與收集面板)
     ====================================================================== */
  function photoStyle(c) {   // c = {room:1..7|img, x,y,w,h in % of the room picture}
    const src = c.src || (ROOMS_IMG + (ROOMS[c.room] ? ROOMS[c.room].img : ''));
    const w = Math.max(4, c.w), h = Math.max(4, c.h);
    return `background-image:url('${src}');background-size:${(10000 / w).toFixed(1)}% auto;background-position:${(c.x / Math.max(.1, 100 - w) * 100).toFixed(1)}% ${(c.y / Math.max(.1, 100 - h) * 100).toFixed(1)}%;aspect-ratio:${(w * 1672 / (h * 941)).toFixed(3)}`;
  }
  const openModals = new Set();
  function modal(cls, inner, { onClose } = {}) {
    const ov = el('div', 'au-overlay');
    ov.innerHTML = `<div class="au-modal ${cls}" role="dialog" aria-modal="true">${inner}</div>`;
    document.body.appendChild(ov);
    const close = () => { if (!openModals.has(close)) return; openModals.delete(close); document.removeEventListener('keydown', onKey, true); ov.remove(); onClose && onClose(); };
    openModals.add(close);
    const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
    document.addEventListener('keydown', onKey, true);
    ov.addEventListener('mousedown', e => { if (e.target === ov) close(); });
    $$('[data-au-close]', ov).forEach(b => b.addEventListener('click', close));
    const first = $('[data-au-close]', ov); if (first) first.focus({ preventScroll: true });
    return { ov, close, box: $('.au-modal', ov) };
  }
  /** found clue card with photo frame + magnifier (click magnifier = enlarge) */
  function clueCard({ title, text, photo, found = true, room, onClose } = {}) {
    const m = modal('au-cluemodal', `
      <div class="au-cc" data-zoom="0">
        <div class="au-cc-card">${sprite('clue-card-blank', 'au-cc-bg')}
          <div class="au-cc-photo">${sprite('clue-photo-frame-s', 'au-cc-frame')}${photo ? `<i class="au-cc-pic" style="${photoStyle(photo)}"></i>` : ''}</div>
          <div class="au-cc-text"><h3>${esc(title || '線索')}</h3><p>${text ? esc(text) : '這張線索卡還沒有內容。'}</p></div>
        </div>
        <div class="au-cc-actions"><button type="button" class="au-btn au-zoom" aria-label="放大線索卡">${sprite('clue-magnifier-s', 'au-ico')}<span>放大</span></button><button type="button" class="au-btn primary" data-au-close>關閉</button></div>
      </div>`, { onClose });
    const cc = $('.au-cc', m.ov);
    $('.au-zoom', m.ov).addEventListener('click', () => { const z = cc.dataset.zoom === '1' ? '0' : '1'; cc.dataset.zoom = z; $('.au-zoom span', m.ov).textContent = z === '1' ? '縮小' : '放大'; });
    return m;
  }
  /** six-slot collection panel: locked / open / found(+fragment) and the completion seal */
  function collection({ onOpenClue } = {}) {
    const st = store.get();
    const slots = [1, 2, 3, 4, 5, 6].map(n => {
      const done = st.completed.includes(n), open = st.visited.includes(n);
      return { n, state: done ? 'found' : open ? 'open' : 'locked', clues: st.clues[n] || [] };
    });
    const all = slots.every(s => s.state === 'found');
    const cells = slots.map((s, i) => `<button type="button" class="au-slot" data-n="${s.n}" data-state="${s.state}" style="--i:${i}" aria-label="房間 ${s.n} ${ROOMS[s.n].name}：${s.state === 'found' ? '已取得記憶碎片' : s.state === 'open' ? '探索中' : '尚未解鎖'}">
        ${s.state === 'found' ? sprite('clue-fragment-s', 'au-slot-frag') : s.state === 'locked' ? sprite('clue-slot-locked-s', 'au-slot-lock') : '<b class="au-slot-open">…</b>'}
        <span class="au-slot-no">${s.n}</span></button>`).join('');
    const legend = slots.map(s => `<li data-state="${s.state}"><b>${s.n}</b> ${esc(ROOMS[s.n].name)}<em>${s.state === 'found' ? '✓ 已取得' : s.state === 'open' ? '探索中' : '🔒'}</em></li>`).join('');
    const m = modal('au-colmodal', `
      <div class="au-col">
        <h2 class="au-titlebar au-col-title"><span>記憶碎片收集</span></h2>
        <div class="au-col-body">
          <div class="au-col-panel">${sprite('clue-collection-panel', 'au-col-bg')}<div class="au-slots">${cells}</div>${all ? `<div class="au-seal" title="六枚記憶碎片全部集齊">${sprite('clue-seal-complete')}</div>` : ''}</div>
          <ul class="au-col-legend au-scroll">${legend}</ul>
        </div>
        <p class="au-col-note">${all ? '六枚記憶碎片已集齊，記憶核心的大門開啟了！' : '進入房間會解鎖欄位，完成房間可取得記憶碎片。'}</p>
        <button type="button" class="au-btn primary" data-au-close>關閉</button>
      </div>`);
    $$('.au-slot', m.ov).forEach(b => b.addEventListener('click', () => {
      const s = slots[Number(b.dataset.n) - 1];
      if (s.state === 'locked') { b.classList.remove('au-nudge'); void b.offsetWidth; b.classList.add('au-nudge'); return; }
      const c = s.clues[s.clues.length - 1];
      m.close();
      if (onOpenClue) return onOpenClue(s, c);
      clueCard({ title: `${ROOMS[s.n].name}｜${s.state === 'found' ? '記憶碎片' : '探索中'}`, text: s.state === 'found' ? `你修復了「${ROOMS[s.n].theme}」這段記憶。` : '這段記憶還在尋找中，繼續調查房間裡的物品吧。', photo: c && c.crop ? c.crop : { room: s.n, x: 20, y: 20, w: 60, h: 60 } });
    }));
    return m;
  }

  /* ======================================================================
     MISSION PANEL  (房間任務面板): title, progress list, hint, done/error state, clue slots
     ====================================================================== */
  function missionPanel({ room, title, getState, onPick, host = document.body }) {
    /* 第二修改計劃 B2-3 / B3:只留「房間標題 + 物品清單 + 完成狀態」與「收合面板」;點物品 → 收合面板並指出物品位置 */
    const r = ROOMS[room] || {};
    const heading = title || (room ? `房間${room}・${r.theme || ''} ${r.name || ''}` : (r.name || ''));
    const box = el('aside', 'au-mission au-mission-v2');
    box.setAttribute('aria-label', '任務面板');
    box.hidden = true;
    box.innerHTML = `
      <h2 class="au-titlebar au-m-title"><span class="au-m-name">${esc(heading)}</span></h2>
      <ul class="au-scroll au-m-list" role="list"></ul>
      <div class="au-m-actions"><button type="button" class="au-btn au-m-help" aria-label="再聽一次任務面板說明">💡 再聽一次說明</button><button type="button" class="au-btn au-m-close">收合面板</button></div>`;
    host.appendChild(box);
    const q = s => $(s, box);
    const api = {
      box, data: null,
      render(d = getState()) {
        api.data = d;
        const items = d.items || [];
        q('.au-m-list').innerHTML = items.map((i, k) => `<li class="${i.done ? 'done' : ''}"><button type="button" class="au-m-item" data-k="${k}" aria-label="${esc(i.label)}${i.done ? '（已完成）' : '（未完成）'}，點一下指出位置"><i class="au-chk" aria-hidden="true">${i.done ? '✓' : ''}</i><span>${esc(i.label)}</span><em class="au-m-state">${i.done ? '已完成' : '未完成'}</em></button></li>`).join('');
        $$('.au-m-item', box).forEach(b => b.addEventListener('click', () => { const it = items[Number(b.dataset.k)]; api.close(); if (it && onPick) setTimeout(() => onPick(it), 60); }));
      },
      open() { api.render(); api._maybeIntro(); if (!api.back) { api.back = el('div', 'au-m-backdrop'); box.before(api.back); } box.hidden = false; box.classList.add('au-open'); document.addEventListener('keydown', api._esc, true); setTimeout(() => document.addEventListener('pointerdown', api._out, true), 0); const b = box.querySelector('.au-m-item') || box.querySelector('.au-m-close'); if (b) b.focus({ preventScroll: true }); },
      close() { if (api.back) { api.back.remove(); api.back = null; } box.hidden = true; box.classList.remove('au-open'); document.removeEventListener('keydown', api._esc, true); document.removeEventListener('pointerdown', api._out, true); },
      _esc(e) { if (e.key === 'Escape') { e.stopPropagation(); api.close(); } },
      _out(e) { if (!box.contains(e.target) && !e.target.closest('.au-hudbtn, .sd-overlay')) api.close(); },
      /* 第三修改計劃 B2:第一次打開時,這個房間的 NPC 說明任務面板怎麼用(台詞在 story-copy.js 的 taskPanel);💡 可以再聽一次 */
      _maybeIntro() { const k = String(room || 0); const v = store.get(); if ((v.taskIntro || {})[k]) return; store.patch(x => { x.taskIntro = Object.assign({}, x.taskIntro, { [k]: 1 }); }); setTimeout(() => api.explain(), 250); },
      async explain() {
        if (api._talking) return; api._talking = true;
        try {
          if (!(await loadStory())) return;
          const c = window.StoryCopy && StoryCopy.taskPanel; if (!c) return;
          const lines = (room ? c.room : c.map).map(t => ({ who: 'npc', text: t }));
          await StoryDialog.play({ npc: room ? StoryCopy.npcForRoom(room) : 1, position: 'bottom', clear: true, lines });
        } finally { api._talking = false; }
      },
      toggle() { box.hidden ? api.open() : api.close(); },
      error() { /* 舊版的錯誤狀態列已移除;密碼錯誤由密碼面板本身提示 */ }
    };
    q('.au-m-close').addEventListener('click', () => api.close());
    q('.au-m-help').addEventListener('click', () => api.explain());
    return api;
  }

  /* B2-4:用箭頭 + 星星閃光指出畫面上的物品。target = 元素(可在同源 iframe 裡)或 {left,top,width,height}(視窗座標)。
     au-obj 物品(整張圖大小的可點區)改用物件輪廓的外框位置。 */
  let pointerTimer = 0;
  function pointAt(target, { ms = 2800 } = {}) {
    if (activePointerClear) activePointerClear();
    $$('.sk-pointer,.sk-ring').forEach(n => n.remove()); clearTimeout(pointerTimer);
    let r = target;
    if (target && target.getBoundingClientRect) {
      r = target.getBoundingClientRect();
      const box = target._auBox;
      if (box) r = { left: r.left + box[0] * r.width, top: r.top + box[1] * r.height, width: (box[2] - box[0]) * r.width, height: (box[3] - box[1]) * r.height };
      let w = target.ownerDocument && target.ownerDocument.defaultView;
      while (w && w !== window && w.frameElement) { const f = w.frameElement.getBoundingClientRect(); r = { left: r.left + f.left, top: r.top + f.top, width: r.width, height: r.height }; w = w.parent; }
    }
    if (!r || !r.width) return;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const ring = el('div', 'sk-ring'); const d = Math.min(240, Math.max(90, Math.min(r.width, r.height) * 1.3));
    Object.assign(ring.style, { position: 'fixed', left: cx + 'px', top: cy + 'px', width: d + 'px', height: d + 'px' });
    const ptr = el('div', 'sk-pointer');
    ptr.innerHTML = '<i class="sk-arrow"></i><span class="sk-stars"><b style="left:-46px;top:6px">★</b><b style="left:30px;top:-4px;animation-delay:.3s">★</b><b style="left:-8px;top:34px;animation-delay:.6s">✦</b></span>';
    /* 第二修改計劃追加 B5-0:指向物品時,同時亮出它的名稱牌(名稱在最上層,不被光圈蓋住) */
    const fx = target && target._auFx; if (fx) { fx.classList.add('on', 'au-pointed'); }
    if (target && target.classList) target.classList.add('au-pointed');   // E8:房間六的名稱牌也一起亮
    /* E8:箭頭放在名稱牌上方,不蓋住名稱(名稱牌出現時有滑入動畫,動畫結束後再對一次位置) */
    const lab = (fx && fx.querySelector('.au-fx-label')) || (target && target.querySelector && target.querySelector('.hotspot-label'));
    const placePtr = () => {
      let top = r.top;
      if (lab) {
        let lr = lab.getBoundingClientRect(), w = lab.ownerDocument && lab.ownerDocument.defaultView;
        while (w && w !== window && w.frameElement) { const f = w.frameElement.getBoundingClientRect(); lr = { top: lr.top + f.top, height: lr.height }; w = w.parent; }
        if (lr.height) top = Math.min(top, lr.top - 12);   // 箭頭上下擺動 10px,多留一點距離
      }
      Object.assign(ptr.style, { position: 'fixed', left: cx + 'px', top: Math.max(40, top - 6) + 'px' });
    };
    if (lab) ptr.classList.add('sk-has-label');
    placePtr(); setTimeout(placePtr, 280);
    document.body.append(ring, ptr);
    try { sfx.play('pop'); } catch (e) { }
    /* 第三修改計劃 B2:玩家一點畫面(包含點進那個小遊戲),箭頭與光圈立刻消失,不等計時 */
    const docs = [...new Set([document, target && target.ownerDocument].filter(Boolean))];
    let done = false;
    const clearPtr = () => {
      if (done) return; done = true; clearTimeout(pointerTimer);
      ring.remove(); ptr.remove();
      docs.forEach(d => d.removeEventListener('pointerdown', clearPtr, true));
      if (target && target.classList) target.classList.remove('au-pointed');
      if (fx) { fx.classList.remove('au-pointed'); try { if (!target.matches(':hover') && !target.classList.contains('nearby')) fx.classList.remove('on'); } catch (e) { } }
      if (activePointerClear === clearPtr) activePointerClear = null;
    };
    setTimeout(() => { if (!done) docs.forEach(d => d.addEventListener('pointerdown', clearPtr, true)); }, 0);
    pointerTimer = setTimeout(clearPtr, ms);
    activePointerClear = clearPtr;
  }
  let activePointerClear = null;

  /** a slim bar directly under a room picture: tools on the left, the hint line on the right; always exactly as wide as the picture */
  function mountDock(canvas, hintSel) {
    let dock = canvas.parentElement.querySelector(':scope>.au-dock');
    if (dock) return dock;
    dock = el('div', 'au-dock'); canvas.after(dock);
    const hint = canvas.parentElement.querySelector(hintSel);
    if (hint) { hint.classList.add('au-dock-hint'); dock.appendChild(hint); }
    const sync = () => { dock.style.width = canvas.getBoundingClientRect().width + 'px'; };
    sync(); addEventListener('resize', sync); if (window.ResizeObserver) new ResizeObserver(sync).observe(canvas);
    return dock;
  }

  /* ---------------- player chip (frame + name bar) ---------------- */
  function playerChip() {
    const p = player(); if (!p) return null;
    const c = el('div', 'au-chip-player');
    c.innerHTML = `<span class="au-portrait au-portrait-sm">${sprite('dialog-portrait-frame-navy-s', 'au-portrait-frame')}<span class="au-portrait-inner">${avatarHTML(p)}</span></span><span class="au-plate au-chip-name">${esc(p.name || '冒險家')}</span>`;
    return c;
  }

  /* ======================================================================
     ROOM PAGE ADAPTERS (rooms 1–3 live in their own iframe pages)
     ====================================================================== */
  const PAGES = {
    1: { hud: '.game-hud', hs: '.hotspot[data-item]', foundCls: 'is-found', canvas: '.room-canvas', label: h => h.getAttribute('aria-label') || h.dataset.item,
      code: { overlay: '#room1CodeOverlay', input: '#room1CodeInput', submit: '#submitRoom1Code', feedback: '#room1CodeFeedback', open: '#openRoom1Code' } },
    2: { hud: '.hud', hs: '.hotspot[data-key]', foundCls: 'done', canvas: '.room-canvas', label: h => h.getAttribute('aria-label') || h.dataset.key,
      code: { overlay: '#codeOverlay', input: '#codeInput', submit: '#submitCode', feedback: '#codeFeedback', open: '#openCode' } },
    3: { hud: '.hud', hs: '.hotspot[data-item]', foundCls: 'done', canvas: '.room-canvas', label: h => h.getAttribute('aria-label') || h.dataset.item,
      code: { overlay: '#codeOverlay', input: '#codeInput', submit: '#submitCode', feedback: '#codeFeedback', open: '#openCode' } },
    /* 第二修改計劃 C6-0:房間六主畫面比照房間一(頁首、下方工具列、任務面板);物件輪廓不用 objects.js(那是舊房間圖) */
    6: { hud: '.game-hud', hs: '.hotspot[data-item]', foundCls: 'done', canvas: '.room-frame', objects: false, label: h => (h.getAttribute('aria-label') || h.dataset.item).replace(/：.*$/, ''),
      /* E8:房間六密碼也用房間一的數字鍵盤 */
      code: { overlay: '#room6CodeDialog', input: '#room6CodeInput', submit: '#submitRoom6Code', feedback: '#room6CodeFeedback', open: '#openRoom6Code' } }
  };

  function cropOf(h, canvas) {
    const cr = canvas.getBoundingClientRect(), r = h.getBoundingClientRect();
    if (!cr.width) return null;
    const pad = 3;
    return { x: Math.max(0, (r.left - cr.left) / cr.width * 100 - pad), y: Math.max(0, (r.top - cr.top) / cr.height * 100 - pad), w: Math.min(100, r.width / cr.width * 100 + pad * 2), h: Math.min(100, r.height / cr.height * 100 + pad * 2) };
  }

  function pageInit(n) {
    const cfg = PAGES[n]; if (!cfg) return;
    document.documentElement.classList.add('au-on'); document.body.dataset.auRoom = n;
    fit(); store.visit(n);
    const canvas = $(cfg.canvas), hud = $(cfg.hud);
    const setHud = () => { if (hud) document.documentElement.style.setProperty('--au-hud', hud.offsetHeight + 'px'); };
    setHud(); addEventListener('resize', setHud); if (hud && window.ResizeObserver) new ResizeObserver(setHud).observe(hud);
    const hsAll = () => $$(cfg.hs);
    const items = () => hsAll().map(h => ({ id: h.dataset.item || h.dataset.key, label: (cfg.label(h) || '').replace(/[：:].*$/, ''), done: h.classList.contains(cfg.foundCls), crop: canvas ? cropOf(h, canvas) : null }));
    const state = () => {
      const it = items(); const comp = store.get().completed.includes(n);
      return { items: it, total: ROOMS[n].total, complete: comp, hint: null, clues: it.map(i => ({ done: i.done, label: i.label, crop: i.crop && Object.assign({ room: n }, i.crop) })) };
    };
    const mission = missionPanel({ room: n, getState: state, onPick: it => { const h = hsAll().find(x => (x.dataset.item || x.dataset.key) === it.id); if (h) pointAt(h); } });
    // HUD: [back] [player chip][任務][收集] ... title ... [timer][found][code]
    if (hud) {
      const tools = el('div', 'au-hud-tools');
      const btn = el('button', 'au-hudbtn'); btn.type = 'button'; btn.setAttribute('aria-label', '任務與提示'); btn.innerHTML = `${sprite('task-icon-hint-s', 'au-ico')}<span>任務</span>`;
      btn.addEventListener('click', () => mission.toggle());
      const chip = playerChip(); if (chip) tools.appendChild(chip);
      tools.append(btn);
      const dock = mountDock(canvas, '.hint, .room-hint');
      dock.prepend(tools);
    }
    // keep the mission panel and clue store current
    const sync = () => {
      const st = state(); store.setClues(n, st.clues.filter(c => c.done).map(c => ({ label: c.label, crop: c.crop })));
      if (!mission.box.hidden) mission.render(st);
    };
    const obs = new MutationObserver(sync);
    hsAll().forEach(h => obs.observe(h, { attributes: true, attributeFilter: ['class'] }));
    window.addEventListener('storage', e => { if (e.key === KEY && !mission.box.hidden) mission.render(); });
    sync();
    idleHints(n, hsAll, cfg.foundCls);
    if (canvas) followLight(canvas);
    if (cfg.objects !== false) watchObjects({ room: n, canvasSel: cfg.canvas, hsSel: cfg.hs, keyOf: b => b.dataset.item || b.dataset.key });
    // code overlay → keypad
    const c = cfg.code || {}, ov = c.overlay && $(c.overlay), input = c.input && $(c.input);
    if (ov && input) {
      const modalEl = $('.modal, .dialog-card', ov);
      const api = enhanceExisting({ input, submit: $(c.submit), feedback: $(c.feedback) });
      new MutationObserver(() => { if (!ov.hidden) { mission.close(); } }).observe(ov, { attributes: true, attributeFilter: ['hidden'] });
      // success → remember completion for the shared collection
      const fb = $(c.feedback);
      $(c.submit).addEventListener('click', () => setTimeout(() => {
        const txt = fb ? fb.textContent : '';
        if (/不正確|錯誤|再試/.test(txt)) { mission.data = Object.assign({}, state(), { error: '密碼不正確，再確認一次線索。' }); }
      }, 260));
    }
    // intro dialog (first visit this game)
    if (!store.introSeen(n)) {
      store.markIntro(n);
      setTimeout(() => storyIntro(n), 450);
    }
    // stop everything if the page is hidden/unloaded (shell swaps rooms)
    addEventListener('pagehide', () => { dialogClose(true); mission.close(); });
    return { mission };
  }


  /* ======================================================================
     SFX  (synthesised, no files) + click ripple
     ====================================================================== */
  const skRefUnused = () => { try { return window.SoundKit || (window.top && window.top.SoundKit) || null; } catch (e) { return window.SoundKit || null; } };
  const sfx = (() => {
    const AC = window.AudioContext || window.webkitAudioContext;
    let ctx = null, master = null, last = {}, muted = false;
    try { muted = localStorage.getItem('memoryMazeSfx') === 'off'; } catch (e) { }
    function ensure() {
      if (!AC) return null;
      if (!ctx) { ctx = new AC(); master = ctx.createGain(); master.gain.value = .55; master.connect(ctx.destination); }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    function tone(f, t0, dur, type = 'square', vol = .1, to) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t0); if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
      g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + .006); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
      o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + .03);
    }
    const SOUNDS = {
      hover: t => tone(1500, t, .03, 'sine', .028),
      click: t => { tone(620, t, .07, 'square', .08, 940); tone(1240, t + .01, .05, 'triangle', .04); },
      key: t => { tone(520, t, .05, 'square', .07, 700); },
      found: t => { [784, 988, 1319].forEach((f, i) => tone(f, t + i * .07, .16, 'triangle', .09)); },
      pop: t => { tone(420, t, .09, 'sine', .08, 760); },
      success: t => { [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * .09, .2, 'square', .07)); },
      unlock: t => { tone(330, t, .35, 'sawtooth', .05, 990); [659, 880, 1175].forEach((f, i) => tone(f, t + .25 + i * .08, .18, 'triangle', .08)); },
      error: t => { tone(190, t, .16, 'sawtooth', .09, 120); tone(150, t + .12, .2, 'sawtooth', .08, 90); }
    };
    return {
      play(name) {
        const SK = skRef(); if (SK) { SK.sfx(name); return; }   // 2026-11-17 全遊戲共用音效(最上層的 SoundKit)
        if (muted || !SOUNDS[name]) return;
        const now = performance.now();
        if (last[name] && now - last[name] < (name === 'hover' ? 90 : 30)) return;
        last[name] = now;
        const c = ensure(); if (!c || c.state !== 'running') return;
        try { SOUNDS[name](c.currentTime + .005); } catch (e) { }
      },
      unlock() { const SK = skRef(); if (SK) { SK.unlock(); return; } ensure(); },
      setMuted(v) { muted = !!v; try { localStorage.setItem('memoryMazeSfx', muted ? 'off' : 'on'); } catch (e) { } },
      isMuted: () => muted
    };
  })();

  function ripple(x, y, big) {
    const r = el('i', 'au-ripple' + (big ? ' au-ripple-big' : ''));
    r.style.left = x + 'px'; r.style.top = y + 'px';
    for (let i = 0; i < 6; i++) { const p = el('b'); p.style.setProperty('--a', (i * 60 + Math.random() * 30) + 'deg'); r.appendChild(p); }
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 650);
  }
  const CLICKABLE = 'button,a[href],[role=button],.au-obj,.hit,.au-key,.au-slot,.memory-hotspot,.hotspot,summary,select';
  document.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.pointerType === 'pen') return;
    sfx.unlock();
    const c = e.target.closest && e.target.closest(CLICKABLE);
    if (e.target.closest && e.target.closest('input,textarea')) return;
    ripple(e.clientX, e.clientY, !!(c && c.matches('.au-obj,.hit,.hotspot,.memory-hotspot')));
    if (c && !c.disabled && c.getAttribute('aria-disabled') !== 'true') sfx.play(c.classList.contains('au-key') ? 'key' : 'click');
  }, true);
  document.addEventListener('pointerover', e => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    const c = e.target.closest && e.target.closest(CLICKABLE);
    if (!c || c.disabled || (e.relatedTarget && c.contains(e.relatedTarget))) return;
    sfx.play('hover');
  }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Tab') sfx.unlock(); }, true);

  /* ======================================================================
     OBJECTS: precise, shape-true hover highlight + hit area for every room object
     (no frames: the object itself brightens and grows a little; clicking only works on the object)
     ====================================================================== */
  const R7_SPRITES = new URL('../assets/art-final/clickable-original-imagegen/room7/', scriptEl.src).href;
  const SVGNS = 'http://www.w3.org/2000/svg';
  let svgDefs = null;
  function getDefs() {
    if (svgDefs && svgDefs.isConnected) return svgDefs;
    const s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('width', '0'); s.setAttribute('height', '0'); s.setAttribute('aria-hidden', 'true');
    s.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;overflow:hidden;pointer-events:none';
    svgDefs = document.createElementNS(SVGNS, 'defs'); s.appendChild(svgDefs); document.body.appendChild(s);
    return svgDefs;
  }
  function clipFor(room, key) {
    const id = `au-clip-${room}-${key}`;
    if (!document.getElementById(id)) {
      const cp = document.createElementNS(SVGNS, 'clipPath'); cp.id = id; cp.setAttribute('clipPathUnits', 'objectBoundingBox');
      const p = document.createElementNS(SVGNS, 'path'); p.setAttribute('d', window.ArtObjects[room][key].d); cp.appendChild(p); getDefs().appendChild(cp);
    }
    return id;
  }
  /* 2026-11-18 使用者:物件亮起時的切割邊界不要那麼明顯,要跟地圖一樣邊界模糊 →
     亮起的圖層改用「柔邊遮罩」:同一個輪廓先往外擴一點、再高斯模糊(地圖 mask-roomN-soft.png 的做法),邊緣漸淡融進房間圖;
     點擊範圍仍用原本精準的輪廓(hitClip),不受影響。 */
  const softMasks = {};
  function softMaskFor(room, key) {
    const id = room + ':' + key;
    if (!softMasks[id]) {
      const d = window.ArtObjects[room][key].d;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" preserveAspectRatio="none" width="1672" height="941"><filter id="f" filterUnits="userSpaceOnUse" x="-0.2" y="-0.2" width="1.4" height="1.4" color-interpolation-filters="sRGB"><feMorphology operator="dilate" radius="0.0024 0.0042"/><feGaussianBlur stdDeviation="0.0042 0.0075"/></filter><path d="${d}" fill="#fff" filter="url(#f)"/></svg>`;
      softMasks[id] = `url('data:image/svg+xml,${encodeURIComponent(svg)}')`;
    }
    return softMasks[id];
  }
  /* ISS-024:輪廓太小的物件(寬或高 < 6.5% 畫面)改用「外框加邊」的矩形可點區,避免只剩 24px 的點擊範圍 */
  function hitClip(o, id) {
    const w = o.b[2] - o.b[0], h = o.b[3] - o.b[1];
    if (w >= 0.065 && h >= 0.065 && w * h >= 0.02) return `url(#${id})`;   /* G4(2026-11-18 晚):細長或面積小的物件(如拐杖)也改用加邊矩形,長輩比較點得到 */
    const pad = 0.025, p = v => (Math.max(0, Math.min(1, v)) * 100).toFixed(2) + '%';
    return `inset(${p(o.b[1] - pad)} ${p(1 - o.b[2] - pad)} ${p(1 - o.b[3] - pad)} ${p(o.b[0] - pad)})`;
  }
  const FOUND = ['done', 'is-found', 'found', 'visited', 'completed', 'explored', 'reviewed'];
  /* 名稱牌的上緣位置(0–1):物品頂端貼近畫框時,改放進物品裡面一點 */
  const labelTop = b => b[1] < 0.1 ? b[1] + Math.min(0.12, (b[3] - b[1]) * 0.18) : b[1];
  /* 靠近左右邊緣的物件:名稱牌改對齊物件的外側邊,不超出畫框 */
  const labelSide = b => { const cx = (b[0] + b[2]) / 2; return cx > 0.78 ? ' au-fx-label-r' : cx < 0.22 ? ' au-fx-label-l' : ''; };
  const labelX = b => { const cx = (b[0] + b[2]) / 2; return cx > 0.78 ? Math.min(0.99, b[2]) : cx < 0.22 ? Math.max(0.01, b[0]) : cx; };
  function installObjects({ room, canvas, items, hint = true }) {
    const data = window.ArtObjects && window.ArtObjects[room];
    if (!data || !canvas) return null;
    $$(':scope>.au-fx-layer', canvas).forEach(n => n.remove());
    if (canvas._auHintTimer) { clearInterval(canvas._auHintTimer); canvas._auHintTimer = 0; }
    const img = ROOMS_IMG + ROOMS[room].img;
    const layer = el('div', 'au-fx-layer'); canvas.appendChild(layer);
    const fxs = [];
    items.forEach(({ key, el: btn, label }) => {
      const o = data[key]; if (!o) return;
      const id = clipFor(room, key), cx = (o.c[0] * 100).toFixed(2), cy = (o.c[1] * 100).toFixed(2);
      btn.classList.add('au-obj'); btn.dataset.auKey = key; btn._auBox = o.b;
      const st = btn.style;
      [['left', '0'], ['top', '0'], ['width', '100%'], ['height', '100%'], ['right', 'auto'], ['bottom', 'auto'], ['clip-path', hitClip(o, id)], ['-webkit-clip-path', hitClip(o, id)]].forEach(([k, v]) => st.setProperty(k, v, 'important'));
      const name = label || (btn.getAttribute('aria-label') || key).replace(/^[\p{Extended_Pictographic}️\s]+/u, '').replace(/[：:].*$/, '').replace(/^進入/, '').replace(/介面$/, '');
      const fx = el('div', 'au-fx');
      const spr = (room === 7 && window.ArtRoom7Sprites && window.ArtRoom7Sprites[key]) || (window.ArtExtraSprites && window.ArtExtraSprites[room] && window.ArtExtraSprites[room][key]);
      btn._auFx = fx;
      const body = spr
        ? `<div class="au-fx-glow au-plat" style="left:${(spr.x * 100).toFixed(3)}%;top:${(spr.y * 100).toFixed(3)}%;width:${(spr.w * 100).toFixed(3)}%;height:${(spr.h * 100).toFixed(3)}%"><img class="au-plat-img" src="${spr.base || R7_SPRITES}${spr.file}" alt="" draggable="false"></div>`
        : `<div class="au-fx-glow"><i class="au-fx-img au-fx-soft" style="background-image:url('${img}');-webkit-mask-image:${softMaskFor(room, key)};mask-image:${softMaskFor(room, key)};transform-origin:${cx}% ${cy}%"></i></div>`;
      fx.innerHTML = body +
        /* 第二修改計劃追加 B5-0:物品頂端貼近畫框上緣時,名稱改放在物品裡面上方,不被畫框裁掉 */
        `<span class="au-fx-label${o.b[1] < 0.1 ? ' au-fx-label-in' : ''}${labelSide(o.b)}" style="left:${(labelX(o.b) * 100).toFixed(2)}%;top:${(labelTop(o.b) * 100).toFixed(2)}%">${esc(name)}</span>` +
        `<img class="au-img au-fx-check" style="left:${cx}%;top:${cy}%" src="${UI}task-icon-done-s.png" alt="" draggable="false">`;
      layer.appendChild(fx); fxs.push(fx);
      const isFound = () => FOUND.some(c => btn.classList.contains(c));
      const sync = (silent) => { const f = isFound(); if (f && fx.dataset.found !== '1' && !silent) { sfx.play('found'); const r = fx.getBoundingClientRect(); ripple(r.left + r.width * o.c[0], r.top + r.height * o.c[1], true); } fx.dataset.found = f ? '1' : '0'; };
      sync(true);
      new MutationObserver(() => sync(false)).observe(btn, { attributes: true, attributeFilter: ['class'] });
      const on = v => fx.classList.toggle('on', v);
      btn.addEventListener('pointerenter', e => { if (!e.pointerType || e.pointerType === 'mouse') on(true); });
      btn.addEventListener('pointerleave', () => { on(btn.classList.contains('nearby')); fx.classList.remove('press'); });
      btn.addEventListener('pointerdown', () => fx.classList.add('press'));
      btn.addEventListener('pointerup', () => fx.classList.remove('press'));
      btn.addEventListener('click', () => { fx.classList.remove('bounce'); void fx.offsetWidth; fx.classList.add('bounce'); setTimeout(() => fx.classList.remove('bounce'), 380); });
      btn.addEventListener('focus', () => { if (btn.matches(':focus-visible')) on(true); });
      btn.addEventListener('blur', () => on(btn.classList.contains('nearby')));
    });
    // gentle shimmer on one not-yet-found object every two seconds (the "look here" hint)
    if (hint && fxs.length) {
      let i = 0;
      canvas._auHintTimer = setInterval(() => {
        if (!canvas.offsetParent) return;
        const open = fxs.filter(f => f.dataset.found !== '1' && !f.classList.contains('on'));
        if (!open.length) return;
        const f = open[i++ % open.length]; f.classList.add('hint'); setTimeout(() => f.classList.remove('hint'), 1150);
      }, 2000);
    }
    return { destroy() { layer.remove(); clearInterval(canvas._auHintTimer); } };
  }
  /** keeps objects installed when a page re-renders its room (rooms 4/5 rebuild their DOM) */
  function watchObjects({ room, canvasSel, hsSel, keyOf, root = document.body, hint = true }) {
    let t = 0;
    const scan = () => {
      t = 0;
      $$(canvasSel).forEach(canvas => {
        const btns = $$(hsSel, canvas); if (!btns.length) return;
        const keys = btns.map((b, i) => keyOf(b, i));
        const sig = keys.join(',');
        const fresh = btns.some(b => !b.classList.contains('au-obj')) || !canvas.querySelector(':scope>.au-fx-layer') || canvas.dataset.auSig !== sig;
        if (!fresh) return;
        canvas.dataset.auSig = sig;
        installObjects({ room, canvas, hint, items: btns.map((b, i) => ({ key: keys[i], el: b })) });
      });
    };
    new MutationObserver(() => { if (!t) t = setTimeout(scan, 30); }).observe(root, { childList: true, subtree: true });
    scan();
  }

  /* D11(2026-11-18 晚)光影互動:滑鼠在房間畫面上移動時,一圈柔和暖光跟著走(像拿著小燈照東西);不擋點擊,減少動態時關閉 */
  function followLight(canvas) {
    if (canvas.querySelector(':scope>.au-follow-light')) return;
    const L = el('i', 'au-follow-light'); canvas.appendChild(L);
    if (!document.getElementById('au-light-css')) {
      const st = document.createElement('style'); st.id = 'au-light-css';
      st.textContent = `.au-follow-light{position:absolute;inset:0;z-index:4;pointer-events:none;opacity:0;transition:opacity .4s;mix-blend-mode:soft-light;
        background:radial-gradient(circle at var(--lx,50%) var(--ly,50%),#fff2c8 0,#ffd98a66 9%,transparent 24%)}
        .au-follow-light.on{opacity:.75}html.mm-reduce .au-follow-light{display:none}`;
      document.head.appendChild(st);
    }
    let raf = 0, px = 0, py = 0;
    canvas.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = canvas.getBoundingClientRect(); px = (e.clientX - r.left) / r.width * 100; py = (e.clientY - r.top) / r.height * 100;
      L.classList.add('on');
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; L.style.setProperty('--lx', px + '%'); L.style.setProperty('--ly', py + '%'); });
    });
    canvas.addEventListener('pointerleave', () => L.classList.remove('on'));
  }

  /* C1(2026-11-18 晚)房內分級提示:沒有操作 30 秒 → 還沒調查的物品發光;60 秒 → 這房老人提醒還剩幾樣、可看「任務」;
     90 秒 → 箭頭直接指出一樣。只用現有物品名稱與 pointAt,不新增教育內容。對話框/面板開著時延後;一有操作就重來。 */
  function idleHints(room, hsAll, foundCls) {
    if (!document.getElementById('au-idle-css')) {
      const st = document.createElement('style'); st.id = 'au-idle-css';
      st.textContent = `.au-idle-target{animation:auIdleGlow 1.4s ease-in-out infinite!important}
        @keyframes auIdleGlow{0%,100%{filter:drop-shadow(0 0 0 #ffd86d00)}50%{filter:drop-shadow(0 0 10px #ffd86d) drop-shadow(0 0 4px #fff3c4) brightness(1.15)}}
        .au-idle-tip{position:fixed;left:50%;bottom:110px;transform:translateX(-50%);z-index:2147481000;max-width:min(560px,86vw);padding:10px 18px;border:3px solid #d9a441;border-radius:12px;background:#fff8e4;color:#2b1d0e;font:800 18px/1.5 inherit;box-shadow:0 0 0 3px #1c2340,0 8px 20px #0007;pointer-events:none;animation:auTipIn .3s ease-out}
        .au-idle-tip b{color:#7a4f10;margin-right:.4em}
        @keyframes auTipIn{from{opacity:0;transform:translate(-50%,10px)}}
        html.mm-reduce .au-idle-target{animation:none!important;outline:3px solid #ffd86d}`;
      document.head.appendChild(st);
    }
    let timers = [], tip = null;
    const vis = el => el.getClientRects().length > 0;
    const busy = () => document.hidden || [...document.querySelectorAll('.sd-overlay,.au-overlay,dialog[open],.au-mission.au-open,.rc-overlay,[aria-modal=true]:not([hidden])')].some(vis);
    const todo = () => hsAll().filter(h => !h.classList.contains(foundCls) && vis(h));
    const npc = () => (window.StoryCopy && StoryCopy.common && StoryCopy.common.npcName) || '神祕老人';
    const say = text => { hideTip(); tip = el('div', 'au-idle-tip'); tip.innerHTML = `<b>${esc(npc())}</b>${esc(text)}`; document.body.appendChild(tip); setTimeout(hideTip, 7000); try { window.SoundKit && SoundKit.sfx('hint'); } catch (e) { } };
    function hideTip() { if (tip) { tip.remove(); tip = null; } }
    const clearGlow = () => $$('.au-idle-target').forEach(h => h.classList.remove('au-idle-target'));
    /* 對話框、面板開著 → 整輪暫停,等關掉後重新從 0 秒起算 */
    let waitT = 0;
    const waitIdle = () => { timers.forEach(clearTimeout); timers = []; clearTimeout(waitT); waitT = setTimeout(function poll() { if (busy()) waitT = setTimeout(poll, 2000); else arm(); }, 2000); };
    const later = (fn, ms) => timers.push(setTimeout(() => busy() ? waitIdle() : fn(), Math.max(0, ms)));
    const stages = [
      [30000, () => todo().forEach(h => h.classList.add('au-idle-target'))],
      [60000, () => { const n = todo().length; if (n) say(`還有 ${n} 樣東西還沒調查喔,點左下的「任務」可以看清單。`); }],
      [90000, () => { const h = todo()[0]; if (!h) return; pointAt(h, { ms: 4000 }); say('看這裡!點點看這個。'); arm(45000); }]
    ];
    function arm(offset = 0) { timers.forEach(clearTimeout); timers = []; clearTimeout(waitT); stages.forEach(([ms, fn]) => later(fn, ms - offset)); }
    function activity() { clearGlow(); hideTip(); arm(); }
    ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, activity, { capture: true, passive: true }));
    arm();
  }

  const ArtUI = { UI, ROOMS, fit, store, player, avatarHTML, esc, el, $, $$, sprite,
    keypad: { mount: mountKeypad, enhance: enhanceExisting },
    dialog: { open: dialogOpen, close: dialogClose, isOpen: () => !!dlg },
    storyIntro, loadStory,
    clueCard, collection, mission: missionPanel, pointAt, mountDock, playerChip, sfx, ripple, installObjects, watchObjects, modal, closeAllModals: () => [...openModals].forEach(c => c()), pageInit, photoStyle, cropOf };
  window.ArtUI = ArtUI;
  /* F3(2026-11-18 晚)觸控:平板沒有「滑過顯示名稱」→ 長按物品/房間 0.5 秒顯示名稱牌(放開後 1.5 秒消失);一般點一下照舊 */
  (function () {
    let t = 0, tag = null, held = false;
    const hide = () => { clearTimeout(t); if (tag) { const x = tag; setTimeout(() => x.remove(), 1500); tag = null; } };
    document.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'touch') return;
      const h = e.target.closest && e.target.closest('.au-obj,.map-hotspot,.hotspot,[data-item]'); if (!h) return;
      const name = (h.getAttribute('aria-label') || h.title || '').replace(/[,，(（].*$/, '').trim(); if (!name) return;
      held = false; clearTimeout(t);
      t = setTimeout(() => { held = true; tag = document.createElement('div'); tag.className = 'au-touch-name'; tag.textContent = name;
        Object.assign(tag.style, { left: e.clientX + 'px', top: (e.clientY - 56) + 'px' }); document.body.appendChild(tag); }, 500);
    }, true);
    ['pointerup', 'pointercancel', 'pointermove'].forEach(ev => document.addEventListener(ev, e => { if (e.pointerType === 'touch' && (ev !== 'pointermove' || !held)) hide(); }, true));
    document.addEventListener('click', e => { if (held) { held = false; e.preventDefault(); e.stopPropagation(); } }, true);   // 長按看名稱時,放開不算點擊
    const st = document.createElement('style');
    st.textContent = '.au-touch-name{position:fixed;transform:translateX(-50%);z-index:2147482600;padding:6px 14px;border:3px solid #d9a441;border-radius:10px;background:#1c2340;color:#fff3c4;font:900 18px/1.3 sans-serif;pointer-events:none;white-space:nowrap}';
    (document.head || document.documentElement).appendChild(st);
  })();

  /* D7+G5(2026-11-18 晚)對錯回饋統一:答錯 → 搖頭+紅光+「✗」;答對 → 綠光+「✓」(除了顏色也有符號,色盲也看得出)。只加外觀,不改判定 */
  (function () {
    if (document.getElementById('au-fb-css')) return;
    const st = document.createElement('style'); st.id = 'au-fb-css';
    const W = ':is(button,[role=button]):is(.wrong,.is-wrong)', C = ':is(button,[role=button]):is(.correct,.is-correct)';
    st.textContent = `${W}{animation:auNo .4s ease;box-shadow:0 0 0 3px #d8402c,0 0 14px #d8402c88!important}
      ${C}{box-shadow:0 0 0 3px #2c7a4b,0 0 14px #2c7a4b88!important}
      ${W}::after,${C}::after{position:absolute;top:-10px;right:-10px;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font:900 16px/1 sans-serif;color:#fff;border:2px solid #fff;pointer-events:none;z-index:2}
      ${W}::after{content:"✗";background:#d8402c}${C}::after{content:"✓";background:#2c7a4b}
      ${W},${C}{position:relative}
      :is(.meal-object,.alarm-button,.prep-option):is(.wrong,.is-wrong){animation:auNo .4s ease;filter:drop-shadow(0 0 8px #d8402c)}
      @keyframes auNo{20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
      html.mm-reduce ${W}{animation:none}`;
    (document.head || document.documentElement).appendChild(st);
  })();
  /* E6(2026-11-18)情緒音效:小遊戲裡按鈕一變成「答錯/答對」就播柔和的「噗」或溫暖和弦(只聽 class 變化,不改判定);
     同一批同時出現錯和對(例如答錯後標出正解)只播答錯;重新繪製畫面時同一顆按鈕不重複播 */
  (function () {
    const BAD = '.wrong,.is-wrong', GOOD = '.correct,.is-correct', ANY = ':is(button,[role=button],.meal-object,.alarm-button,.prep-option)';
    const heard = new Set(); let lastAt = 0;
    const sig = (e, k) => k + '|' + (e.dataset && (e.dataset.id || e.dataset.answer || e.dataset.option) || '') + '|' + (e.textContent || '').trim().slice(0, 40);
    function scan(list) {
      let bad = false, good = false;
      for (const e of list) {
        if (!e.matches || !e.matches(ANY)) continue;
        const k = e.matches(BAD) ? 'x' : e.matches(GOOD) ? 'o' : ''; if (!k) continue;
        const id = sig(e, k); if (heard.has(id)) continue; heard.add(id);
        if (k === 'x') bad = true; else good = true;
      }
      if (!bad && !good) return;
      const now = Date.now(); if (now - lastAt < 300) return; lastAt = now;
      const SK = skRef(); SK && SK.sfx(bad ? 'error' : 'success');
    }
    const start = () => new MutationObserver(ms => {
      const list = [];
      for (const m of ms) {
        if (m.type === 'attributes') { const t = m.target, was = m.oldValue || ''; if (!/(^|\s)(is-)?(wrong|correct)(\s|$)/.test(was)) list.push(t); }
        else m.addedNodes.forEach(n => { if (n.nodeType === 1) { list.push(n); n.querySelectorAll && list.push(...n.querySelectorAll(ANY)); } });
      }
      if (list.length) scan(list);
    }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
    if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  })();
  document.documentElement.classList.add('au-on');
  fit();
  if (scriptEl.dataset.objects) {   // rooms 4 / 5 pages: object highlight only
    const r = Number(scriptEl.dataset.objects);
    const go = () => watchObjects({ room: r, canvasSel: '.room-frame', hsSel: '[data-object]', keyOf: b => b.dataset.object });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  }
  if (document.currentScript && scriptEl.dataset.room) {
    const go = () => pageInit(Number(scriptEl.dataset.room));
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  }
})();
