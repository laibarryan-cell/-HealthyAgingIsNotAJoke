/* puzzle-ui.js — 第三修改計劃 B1:六間房的「物品」組合謎題共用版面與動畫
   不改任何玩法、題目、答案;只做呈現:
   1. 版面統一成房間一小遊戲:頁首(← 返回房間/返回收藏 + 燈籠標題牌 + 步驟進度)、💡 操作提示、說明條、羊皮紙物品格。
   2. 動畫:拖曳時物品浮起、放錯位置彈回原處、放對位置金色光圈+星星飛到進度格、步驟格點亮、密碼數字翻牌出現。
   3. 最後一步不需要上下捲動(版面依視窗高度縮放)。
   由 achievement.js 在 mount 後呼叫 attach();各房 puzzles/*.js 不需要修改。 */
(function (root) {
  'use strict';
  if (root.AchievementPuzzleUI) return;

  /* 每房的步驟(取自 achievement.js 的完成判定旗標,順序即遊玩順序) */
  const STEPS = {
    vision: ['part1Completed', 'glassesUsed', 'alignmentCompleted', 'sliderInstalled', 'focusCompleted', 'part2Completed'],
    mobility: ['mobilityPart1Completed', 'padInstalled', 'gripInstalled', 'levelInstalled', 'platformBalanced', 'mobilityPart2Completed'],
    nutrition: ['guideViewed', 'correctCanChosen', 'nutritionPart1Completed', 'canOpened', 'coinUsed', 'scratchCompleted', 'nutritionPart2Completed'],
    hearing: ['hearingPart1Completed', 'batteryInstalled', 'tapeInstalled', 'quietLocationFound', 'hearingAidActivated', 'hearingPart2Completed'],
    cognition: ['cognitionPart1Completed', 'card8Placed', 'photoASolved', 'card3Placed', 'photoBSolved', 'frameInstalled', 'alignmentCompleted', 'cognitionPart2Completed'],
    depression: ['depressionPart1Completed', 'maskCardPlaced', 'redFilterUsed', 'blueFilterUsed', 'digit2Revealed', 'digit7Revealed', 'depressionPart2Completed']
  };
  const PREFIX = ['vp', 'mp', 'np', 'hp', 'cp', 'dp'];
  const isPuzzlePanel = panel => PREFIX.some(p => panel.classList.contains(p + '-fullscreen'));
  const hasCls = (el, suffix) => !!el && !!el.classList && [...el.classList].some(c => PREFIX.some(p => c === p + suffix));
  const reduced = () => root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function attach(ctx) {
    const { ui, room, data, node } = ctx;
    const shadow = ui.shadow, panel = ui.panel, header = panel.querySelector('.as-header');
    const steps = STEPS[room] || [];
    const password = (data.flows[room] || {}).password;

    /* ---- 樣式表:永遠放在 shadow 最後,蓋過各房 puzzles/*.css ---- */
    const link = node('link'); link.rel = 'stylesheet'; link.href = ctx.cssURL; link.dataset.puzzleSkin = '';
    shadow.append(link);
    new MutationObserver(() => { const links = [...shadow.children].filter(x => x.tagName === 'LINK'); if (links.length && links[links.length - 1] !== link) shadow.append(link); })
      .observe(shadow, { childList: true });

    /* ---- 頁首:左邊放返回/操作提示,右邊放步驟進度 ---- */
    const navSlot = node('div', 'as-navslot');
    const toolSlot = node('div', 'as-toolslot');
    const prog = node('div', 'as-steps'); prog.setAttribute('aria-label', '解謎進度');
    header.prepend(navSlot);
    header.querySelector('.as-close').before(toolSlot, prog);

    /* ---- 一律以 1280×720 設計尺寸等比縮放到視窗(與房間三相同做法),六房比例一致、不需捲動 ---- */
    function fitPanel() {
      if (!panel.classList.contains('as-puzzle')) { panel.style.removeProperty('--pz'); return; }
      const w = panel.ownerDocument.defaultView;            // 面板在最上層視窗,依它的大小縮放(房四、五在內層 iframe)
      const z = Math.max(.5, Math.min(w.innerWidth / 1280, w.innerHeight / 720));
      panel.style.setProperty('--pz', z.toFixed(4));
      fitStage();
    }
    /* 遊玩區若仍比可用高度高(例如最後一步多了密碼與按鈕),整區等比縮小,不出現捲軸 */
    function fitStage() {
      const sc = [...ui.content.children].find(el => PREFIX.some(p => el.classList.contains(p + '-scene')));
      if (!sc) return;
      sc.style.zoom = ''; sc.style.width = '';
      let z = 1;
      for (let i = 0; i < 6; i++) {                          // 縮放後版面會重排,多量幾次直到放得下
        const avail = ui.content.clientHeight - 2, need = ui.content.scrollHeight;
        if (avail <= 0 || need <= avail + 1) break;
        z = Math.max(.5, z * avail / need * .99); sc.style.zoom = z.toFixed(3);
        sc.style.width = (z * 100).toFixed(2) + '%';         // 寬度依比例縮,寬度決定高度的圖(錄音機、日記)才會真的變小
        if (z <= .5) break;
      }
    }
    panel.ownerDocument.defaultView.addEventListener('resize', fitPanel);

    let shownDone = -1;
    function doneCount() { const p = ctx.getProgress(); return steps.filter(k => p[k] === true).length; }
    function paintSteps(animate) {
      const n = doneCount();
      if (prog.children.length !== steps.length) { prog.replaceChildren(...steps.map(() => node('span', 'as-step'))); }
      [...prog.children].forEach((el, i) => {
        const on = i < n; const was = el.classList.contains('on');
        el.classList.toggle('on', on); el.textContent = on ? '★' : '';
        if (on && !was && animate && !reduced()) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
      });
      prog.title = `已完成 ${n}/${steps.length} 步`;
      const grew = shownDone >= 0 && n > shownDone; shownDone = n; return grew;
    }

    /* ---- 依頁面內容整理:把 nav 搬到頁首、按鈕改名、密碼翻牌 ---- */
    /* 放置區:虛線框改成光暈(呼吸閃爍、拖近變亮、放好後消失)。完成與否看謎題自己的進度旗標,不改謎題邏輯 */
    const ZONES = [
      ['.hp-battery-slot', 'batteryInstalled'], ['.hp-tape-slot', 'tapeInstalled'], ['.hp-map-target', 'quietLocationFound'], ['.hp-ear', 'hearingAidActivated'],
      ['.mp-pad-slot', 'padInstalled'], ['.mp-grip-slot', 'gripInstalled'], ['.mp-level-slot', 'levelInstalled'],
      ['.cp-slot-eight', 'card8Placed'], ['.cp-slot-three', 'card3Placed'], ['.cp-frame-slot', 'frameInstalled'],
      ['.dp-page-target', 'depressionPart2Completed'], ['.np-rim', 'canOpened']
    ];
    function markDropZones() {
      const p = ctx.getProgress() || {};
      ZONES.forEach(([sel, flag]) => ui.content.querySelectorAll(sel).forEach(el => {
        el.classList.add('as-drop');
        el.classList.toggle('as-drop-done', p[flag] === true);
      }));
    }
    function decorate() {
      const on = isPuzzlePanel(panel);
      panel.classList.toggle('as-puzzle', on);
      if (!on) { navSlot.replaceChildren(); toolSlot.replaceChildren(); fitPanel(); return; }
      markDropZones();
      const nav = [...ui.content.querySelectorAll('nav')].find(n => hasCls(n, '-nav'));
      if (nav) {
        navSlot.replaceChildren(nav);
        nav.querySelectorAll('button').forEach(b => {
          if (b.dataset.asDeco) return; b.dataset.asDeco = '1';
          const t = b.textContent.trim();
          if (t === '提示') { b.textContent = '💡 操作提示'; b.classList.add('as-hint'); }
          else if (t === '返回房間') { b.textContent = '← 返回房間'; b.classList.add('as-back'); }
          else if (t === '返回收藏') { b.classList.add('as-back2'); }
        });
        /* 操作提示、靜音放到頁首右側(左邊只留返回),不會擠成兩排 */
        toolSlot.replaceChildren(...[...nav.querySelectorAll('button')].filter(b => b.classList.contains('as-hint') || /^(靜音|開啟音效)$/.test(b.textContent.trim())));
      }
      fitPanel();
      [...ui.content.querySelectorAll('img')].forEach(im => { if (!im.complete && !im.dataset.asFit) { im.dataset.asFit = '1'; im.addEventListener('load', fitStage, { once: true }); } });
      paintSteps(false);
      flipPassword();
    }
    function flipPassword() {
      if (!password) return;
      const cand = ui.content.querySelectorAll('strong,[class*="password"],.np-scratch-answer');
      cand.forEach(el => {
        if (el.dataset.asFlip || el.children.length || el.textContent.trim() !== password) return;
        el.dataset.asFlip = '1';
        el.textContent = '';
        [...password].forEach((d, i) => {
          const sp = node('span', 'as-digit', d);
          sp.style.animationDelay = (reduced() ? 0 : 0.25 + i * 0.35) + 's';
          el.append(sp);
        });
        el.classList.add('as-pw');
      });
    }
    let pend = 0;
    const schedule = () => { if (!pend) pend = requestAnimationFrame(() => { pend = 0; decorate(); }); };
    new MutationObserver(schedule).observe(ui.content, { childList: true, subtree: true });
    new MutationObserver(schedule).observe(panel, { attributes: true, attributeFilter: ['class', 'open'] });
    panel.addEventListener('close', () => { navSlot.replaceChildren(); toolSlot.replaceChildren(); panel.classList.remove('as-puzzle'); panel.style.removeProperty('--pz'); });

    /* ---- 拖曳:浮起、放錯彈回、放對光圈 + 星星飛到進度格 ---- */
    let tick = 0, drag = null;
    ctx.onProgress((id) => {
      if (id !== room) return; tick++;
      const grew = paintSteps(true); markDropZones();
      if (grew) flashStep();
    });
    function centerOf(el) { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; }
    shadow.addEventListener('pointerdown', e => {
      if (!panel.classList.contains('as-puzzle')) return;
      const tool = e.composedPath().find(el => hasCls(el, '-tool'));
      if (!tool || tool.disabled) { drag = null; return; }
      const img = tool.querySelector('img');
      drag = { tool, from: centerOf(img || tool), src: img && img.src, tick, at: null };
      tool.classList.add('as-lift');
    }, true);
    shadow.addEventListener('pointermove', e => {
      if (!drag) return;
      const g = panel.querySelector('[class*="ghost"]');
      if (g) drag.at = { x: e.clientX, y: e.clientY };
    }, true);
    const endDrag = e => {
      if (!drag) return; const d = drag; drag = null;
      d.tool.classList.remove('as-lift');
      if (!d.at) return;                                   // 只是點一下(點選模式),不做拖放效果
      const at = { x: e.clientX, y: e.clientY };
      setTimeout(() => {
        if (tick !== d.tick) burst(at);                     // 這一步存檔了 → 放對了
        else bounceBack(d, at);                             // 沒有進度 → 彈回原處
      }, 140);
    };
    shadow.addEventListener('pointerup', endDrag, true);
    shadow.addEventListener('pointercancel', () => { if (drag) { drag.tool.classList.remove('as-lift'); drag = null; } }, true);

    function layer() { return panel; }
    function bounceBack(d, at) {
      if (!d.src || reduced() || !d.tool.isConnected) return;
      const img = node('img', 'as-fly'); img.src = d.src; img.alt = '';
      img.style.left = at.x + 'px'; img.style.top = at.y + 'px'; layer().append(img);
      const dx = d.from.x - at.x, dy = d.from.y - at.y;
      img.animate([
        { transform: 'translate(-50%,-50%) scale(1.15) rotate(-8deg)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx * .55}px),calc(-50% + ${dy * .55 - 40}px)) scale(1.05) rotate(6deg)`, opacity: 1, offset: .5 },
        { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.9)`, opacity: .2 }
      ], { duration: 520, easing: 'cubic-bezier(.3,.7,.4,1)' }).onfinish = () => {
        img.remove();
        d.tool.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 300 });
      };
    }
    function burst(at) {
      if (reduced()) return;
      const ring = node('span', 'as-burst'); ring.style.left = at.x + 'px'; ring.style.top = at.y + 'px'; layer().append(ring);
      setTimeout(() => ring.remove(), 800);
      for (let i = 0; i < 8; i++) {
        const sp = node('span', 'as-spark', '✦'); const a = i / 8 * Math.PI * 2;
        sp.style.left = at.x + 'px'; sp.style.top = at.y + 'px'; layer().append(sp);
        sp.animate([{ transform: 'translate(-50%,-50%) scale(.6)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * 70}px),calc(-50% + ${Math.sin(a) * 70}px)) scale(1.1)`, opacity: 0 }], { duration: 650, easing: 'ease-out' }).onfinish = () => sp.remove();
      }
      lastBurst = at;
    }
    let lastBurst = null;
    function flashStep() {
      const lit = [...prog.querySelectorAll('.as-step.on')].pop(); if (!lit || reduced()) return;
      const to = centerOf(lit), from = lastBurst || { x: root.innerWidth / 2, y: root.innerHeight / 2 }; lastBurst = null;
      const star = node('span', 'as-star', '★'); star.style.left = from.x + 'px'; star.style.top = from.y + 'px'; layer().append(star);
      star.animate([
        { transform: 'translate(-50%,-50%) scale(1) rotate(0)', opacity: 1 },
        { transform: `translate(calc(-50% + ${(to.x - from.x) * .5}px),calc(-50% + ${(to.y - from.y) * .5 - 90}px)) scale(1.6) rotate(200deg)`, opacity: 1, offset: .5 },
        { transform: `translate(calc(-50% + ${to.x - from.x}px),calc(-50% + ${to.y - from.y}px)) scale(.8) rotate(400deg)`, opacity: .9 }
      ], { duration: 750, easing: 'cubic-bezier(.4,.1,.5,1)' }).onfinish = () => { star.remove(); lit.classList.remove('pop'); void lit.offsetWidth; lit.classList.add('pop'); };
    }

    decorate();
  }

  root.AchievementPuzzleUI = { attach, STEPS };
})(window);
