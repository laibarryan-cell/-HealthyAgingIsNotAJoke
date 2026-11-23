/* A small offline walking engine. Coordinates use a 1000 × 562.5 room. */
(function (root) {
  'use strict';
  const WIDTH = 1000, HEIGHT = 562.5, SPEED = 155, FRAME_SECONDS = 0.09;
  // 便利貼是獨立小圖(ART-012),疊在客廳底圖上;位置對應 objects.js 房間 4 的 note 輪廓
  root.ArtExtraSprites = root.ArtExtraSprites || {};
  root.ArtExtraSprites[4] = Object.assign(root.ArtExtraSprites[4] || {}, {
    note: { base: new URL('assets/hearing/', document.currentScript ? document.currentScript.src : location.href).href, file: 'sticky-note.png', x: 1212 / 1672, y: 224 / 941, w: 58 / 1672, h: 56 / 941 }
  });
  const objects = [
    { id: 'subtitle', name: '電視', x: 13, y: 35, w: 14, h: 32, approach: [282, 355], radius: 64 },
    { id: 'talk', name: '餐桌', x: 78, y: 44, w: 17, h: 16, approach: [717, 350], radius: 64 },
    { id: 'message', name: '手機', x: 52.3, y: 63.2, w: 6, h: 8, approach: [520, 496], radius: 64 },
    { id: 'note', name: '便利貼', x: 74.2, y: 26.7, w: 3.5, h: 5, approach: [660, 300], radius: 52 }
  ];
  // Foot collision boxes keep the character out of furniture while allowing both aisles.
  const obstacles = [
    { x: 0, y: 0, w: 256, h: 457 },
    { x: 280, y: 200, w: 346, h: 130 },
    { x: 320, y: 342, w: 315, h: 131 },
    { x: 694, y: 205, w: 208, h: 128 },
    { x: 770, y: 367, w: 230, h: 196 }
  ];
  function blocked(x, y) {
    return x < 265 || x > 940 || y < 282 || y > 546 || obstacles.some(r =>
      x > r.x - 7 && x < r.x + r.w + 7 && y > r.y - 5 && y < r.y + r.h + 5);
  }
  function step(position, dx, dy, dt) {
    const length = Math.hypot(dx, dy) || 1, distance = SPEED * Math.min(.035, Math.max(0, dt));
    let x = position.x, y = position.y;
    if (!blocked(x + dx / length * distance, y)) x += dx / length * distance;
    if (!blocked(x, y + dy / length * distance)) y += dy / length * distance;
    return { x, y };
  }
  const nearby = position => objects.filter(o => Math.hypot(position.x - o.approach[0], position.y - o.approach[1]) <= o.radius);
  const initial = p => p && Number.isFinite(p.x) && Number.isFinite(p.y) && !blocked(p.x,p.y) ? {x:p.x,y:p.y} : {x:470,y:522};
  function mount(options) {
    const stage = document.querySelector('#exploreStage'), player = document.querySelector('#explorePlayer');
    const thought = document.querySelector('#playerThought'), status = document.querySelector('#exploreStatus');
    const buttons = [...stage.querySelectorAll('[data-inspect]')], keys = new Set();
    let position = initial(options.position), last = 0, frame = 0, messageUntil = 0, messageText = '好像沒有異常', live = true, walking = false;
    let nearbyIds = '', facing = 'down';
    // 玩家在探索畫面用「裝扮台」做的走路動圖(同房間 1:每個方向 6 格)
    const avatar = player.querySelector('.explore-avatar canvas');
    let walkDraw = null, drawnKey = '', animFrame = 0, animClock = 0;
    if (avatar && root.MemoryMazeCharacters && root.MemoryMazeCharacters.prepareWalk) {
      root.MemoryMazeCharacters.prepareWalk().then(draw => { if (!live || !draw) return; walkDraw = draw; drawnKey = ''; player.classList.add('has-avatar'); paintAvatar(); }).catch(() => {});
    }
    function paintAvatar() {
      if (!walkDraw) return;
      const key = facing + ':' + animFrame;
      if (key === drawnKey) return;
      walkDraw(avatar, facing, animFrame); drawnKey = key;
    }
    function remember() { options.onPosition({...position}); }
    function paint(now = performance.now()) {
      const near = nearby(position), ids = near.map(o=>o.id).join(',');
      player.style.left = `${position.x / WIDTH * 100}%`;
      player.style.top = `${position.y / HEIGHT * 100}%`;
      player.classList.toggle('walking',walking);
      player.dataset.facing = facing;
      const isMessage = now < messageUntil;
      thought.hidden = !near.length && !isMessage;
      thought.textContent = isMessage ? messageText : '!';
      thought.classList.toggle('thought-text',isMessage);
      buttons.forEach(b=>{
        const available = near.some(o=>o.id===b.dataset.inspect);
        b.setAttribute('aria-disabled',String(!available));
        b.classList.toggle('nearby',available);
        if (b._auFx) b._auFx.classList.toggle('on',available);
      });
      paintAvatar();
      if (ids !== nearbyIds) {
        nearbyIds = ids;
        status.textContent = near.length ? `附近有${near.map(o=>o.name).join('、')}，點擊物品查看。` : '使用方向鍵或 WASD 移動，靠近物品再點擊查看。';
      }
    }
    function inspect(id) {
      if (!live || (document.querySelector('#dialog').open||document.querySelector('.sd-overlay'))) return;
      if (!nearby(position).some(o=>o.id===id)) {
        messageText = '再走近一點'; messageUntil = performance.now()+1800; paint();
        stage.focus({preventScroll:true});
        return;
      }
      keys.clear(); walking = false; remember();
      if (id === 'message' || id === 'note') { messageText = '好像沒有異常'; messageUntil = performance.now()+2600; paint(); }
      options.onInspect(id);
    }
    const buttonHandlers = buttons.map(b=>{const handler=()=>inspect(b.dataset.inspect);b.addEventListener('click',handler);return [b,handler];});
    const movementKeys = ['arrowleft','arrowright','arrowup','arrowdown','w','a','s','d'];
    function keydown(e) {
      if (!live || (document.querySelector('#dialog').open||document.querySelector('.sd-overlay')) || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      const key=e.key.toLowerCase();
      if(movementKeys.includes(key)){e.preventDefault();keys.add(key);}
    }
    function keyup(e){keys.delete(e.key.toLowerCase());remember();}
    function blur(){keys.clear();walking=false;remember();}
    function loop(now) {
      if (!live) return;
      const dt=last ? (now-last)/1000 : 0;last=now;
      if(document.hidden || (document.querySelector('#dialog').open||document.querySelector('.sd-overlay'))){keys.clear();walking=false;}
      else {
        const dx=Number(keys.has('arrowright')||keys.has('d'))-Number(keys.has('arrowleft')||keys.has('a'));
        const dy=Number(keys.has('arrowdown')||keys.has('s'))-Number(keys.has('arrowup')||keys.has('w'));
        walking=!!(dx||dy);
        if(walking){if(dx)facing=dx<0?'left':'right';else facing=dy<0?'up':'down';position=step(position,dx,dy,dt);animClock+=dt;while(animClock>=FRAME_SECONDS){animClock-=FRAME_SECONDS;animFrame=(animFrame+1)%6;}}
        else{animFrame=0;animClock=0;}
      }
      paint(now);frame=requestAnimationFrame(loop);
    }
    const padHandlers=[];
    document.querySelectorAll('[data-walk]').forEach(b=>{
      const down=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.walk);};
      const up=()=>{keys.delete(b.dataset.walk);remember();};
      b.addEventListener('pointerdown',down);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);
      padHandlers.push([b,down,up]);
    });
    document.addEventListener('keydown',keydown);document.addEventListener('keyup',keyup);
    window.addEventListener('blur',blur);document.addEventListener('visibilitychange',blur);
    paint();frame=requestAnimationFrame(loop);stage.focus({preventScroll:true});
    return ()=>{live=false;cancelAnimationFrame(frame);remember();document.removeEventListener('keydown',keydown);document.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',blur);buttonHandlers.forEach(([b,f])=>b.removeEventListener('click',f));padHandlers.forEach(([b,d,u])=>{b.removeEventListener('pointerdown',d);b.removeEventListener('pointerup',u);b.removeEventListener('pointercancel',u);b.removeEventListener('lostpointercapture',u);});};
  }
  root.HearingExplore={objects,obstacles,blocked,step,nearby,initial,mount};
})(typeof window === 'undefined' ? globalThis : window);
