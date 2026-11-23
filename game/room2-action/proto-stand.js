/* 原型(PROTO-R2-STAND):房間 2「行動記憶翻翻樂」的改版互動。
   只在網址加 ?proto=stand 時載入;預設(原版翻牌)完全不受影響。
   教育內容:四組「做法 ↔ 提醒」與原版逐字相同;完成後同樣進入原本的衛教(openLesson('stand'))與成就流程。 */
(() => {
  const PAIRS = [
    { id: 0, act: '扶穩扶手', why: '幫助站穩起身', spot: { x: 53.5, y: 40, w: 8.5, h: 17 }, from: '馬桶旁的扶手' },
    { id: 1, act: '防滑鞋', why: '走動更有抓地力', spot: { x: 80.5, y: 78, w: 16, h: 17 }, from: '鞋架上的浴室鞋' },
    { id: 2, act: '站穩再走', why: '起身後先停一下再前進', spot: { x: 39.5, y: 74, w: 24, h: 11 }, from: '馬桶前的地墊' },
    { id: 3, act: '適度活動', why: '久坐不動會讓肌力下降', spot: { x: 0.5, y: 70, w: 13, h: 28 }, from: '牆邊的長凳' },
  ];
  const IMG = '../assets/art-final/rooms/room2-mobility-bathroom.png';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function start(api) {
    const K = api.K, C = api.C2.stand.proto;
    const body = document.querySelector('#activityBody');
    document.querySelector('#activityIntro').innerHTML = '';
    api.clearFeedback(); api.hideContinue(); const _c=document.querySelector('#activityContinue'); if(_c){ _c.hidden=true; _c.style.display='none'; } document.documentElement.classList.add('ps-on');
    K.makeBar(api.bar(), 4);
    const done = new Set(); let current = null, wrong = 0;
    const order = PAIRS.map(p => p.id).sort(() => Math.random() - .5);

    body.innerHTML = `
      <div class="ps-wrap" data-proto="stand">
        <div class="ps-left"><div class="ps-scene" aria-label="浴室場景">
          <img src="${IMG}" alt="浴室場景:馬桶、扶手、地墊、長凳與鞋架">
          ${PAIRS.map(p => `<button type="button" class="ps-spot" data-id="${p.id}" style="left:${p.spot.x}%;top:${p.spot.y}%;width:${p.spot.w}%;height:${p.spot.h}%" aria-label="${esc(p.from)}:${esc(p.act)}"><i class="ps-ring"></i><b class="ps-tag">${esc(p.act)}</b></button>`).join('')}
        </div>
          <ul class="ps-list" id="psList" aria-label="已整理的安全行動"></ul>
        </div>
        <div class="ps-panel">
          <h3 class="ps-q" id="psQ" hidden></h3>
          <div class="ps-choices sk-drop-list" id="psChoices" role="group" aria-label="提醒選項"></div>
        </div>
      </div>`;
    /* 「重新開始」放在「操作提示」正下方 */
    const reset = document.createElement('button'); reset.type = 'button'; reset.className = 'secondary'; reset.textContent = '↺ 重新開始'; reset.onclick = () => start(api);
    api.setExtra(reset);
    api.enterPhase('proto', C.hint);
    const $ = s => body.querySelector(s);
    const spots = [...body.querySelectorAll('.ps-spot')];

    function renderChoices() {
      const left = order.filter(id => !done.has(id)); const box = $('#psChoices');
      box.classList.remove('sk-stagger');
      box.innerHTML = left.map(id => `<button type="button" class="ps-choice" data-id="${id}">${esc(PAIRS[id].why)}</button>`).join('');
      box.querySelectorAll('.ps-choice').forEach(b => b.onclick = () => choose(+b.dataset.id, b));
      void box.offsetWidth; box.classList.add('sk-stagger');   // 選項由上往下下拉展開
    }
    function select(id) {
      if (done.has(id)) return;
      current = id; spots.forEach(s => s.classList.toggle('on', +s.dataset.id === id));
      $('#psQ').hidden = false;
      $('#psQ').innerHTML = `爺爺在「${esc(PAIRS[id].from)}」做到了「<em>${esc(PAIRS[id].act)}</em>」。這對什麼有幫助?`;
      renderChoices();
    }
    async function choose(id, btn) {
      if (current === null) return;
      if (id === current) {
        done.add(id); const p = PAIRS[id];
        const spot = spots.find(s => +s.dataset.id === id);
        spot.classList.add('ok'); spots.forEach(s => s.classList.remove('on'));
        $('#psList').insertAdjacentHTML('beforeend', `<li><span>${esc(p.act)}</span><em>→</em><span>${esc(p.why)}</span></li>`);
        current = null; $('#psChoices').innerHTML = ''; $('#psQ').hidden = true;
        const star = K.awardStar(spot, api.bar(), done.size);
        if (done.size === 4) {
          await star; await K.say(C.done);
          if (api.alive()) api.openLesson('stand');
        }
      } else {
        wrong++; btn.classList.add('bad'); setTimeout(() => btn.classList.remove('bad'), 650);
        await K.say(C.wrong(PAIRS[current].act));
      }
    }
    spots.forEach(s => s.onclick = () => select(+s.dataset.id));
    window.__psState = () => ({ done: [...done], wrong });
  }
  window.Room2StandProto = { start };
})();
