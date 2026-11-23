(function(root){'use strict';
  const base=new URL('.',document.currentScript.src);
  const asset=id=>new URL('assets/cognition/'+({cognition_number_card_8:'photo-8-scrambled.svg',cognition_number_card_3:'photo-3-scrambled.svg'}[id]||id+'.png'),base).href;
  const photoAsset=(digit,kind)=>new URL('assets/cognition/photo-'+digit+'-'+kind+'.svg',base).href;
  const ids=['cognition_key','cognition_memory_box','cognition_number_card_8','cognition_number_card_3','cognition_alignment_frame'];
  const initialA=[1,1,3,2,1,2,1,3,3],initialB=[2,1,1,3,1,2,1,3,2];
  const defaults={cognitionPuzzleVersion:3,keyInserted:false,keyTurn:0,cognitionPart1Completed:false,card8Placed:false,card3Placed:false,photoASolved:false,photoBSolved:false,photoATurns:initialA,photoBTurns:initialB,frameInstalled:false,alignmentPosition:-24,alignmentCompleted:false,cognitionPart2Completed:false,cognitionPasswordRevealed:false};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const validTurns=(v,fallback)=>Array.isArray(v)&&v.length===9&&v.every(n=>Number.isInteger(n)&&n>=0&&n<4)?v.slice():fallback.slice();
  const solved=(digit,turns)=>turns.length===9&&turns.every((n,i)=>[1,4,7].includes(i)?n%2===0:n===0);
  function stateFrom(p){
    // Keep earned objects, completed room and existing key work; invalidate only old Part 2.
    if(p.cognitionPuzzleVersion!==3)return {...defaults,keyInserted:!!p.keyInserted,keyTurn:clamp(Number(p.keyTurn)||0,0,70),cognitionPart1Completed:!!p.cognitionPart1Completed};
    const q={...defaults,...p,photoATurns:validTurns(p.photoATurns,initialA),photoBTurns:validTurns(p.photoBTurns,initialB),keyTurn:clamp(Number(p.keyTurn)||0,0,70),alignmentPosition:clamp(Number(p.alignmentPosition??-24)||0,-35,35)};
    q.photoASolved=!!q.card8Placed&&solved(8,q.photoATurns);q.photoBSolved=q.photoASolved&&!!q.card3Placed&&solved(3,q.photoBTurns);
    if(!q.photoBSolved){q.frameInstalled=false;q.alignmentCompleted=false;q.cognitionPart2Completed=false;q.cognitionPasswordRevealed=false;}
    return q;
  }
  const installed=s=>s.photoASolved&&s.photoBSolved&&s.card8Placed&&s.card3Placed&&s.frameInstalled;
  const ready=s=>s.cognitionPart1Completed&&installed(s)&&s.alignmentCompleted;
  const angleDelta=(a,b)=>(a-b+540)%360-180;
  const hit=(x,y,r)=>x>=r.left-20&&x<=r.right+20&&y>=r.top-20&&y<=r.bottom+20;
  const pending=new Map();

  // The brief local reveal hands off to the existing shared acquisition animation/storage.
  function drop(id,anchor){
    if(root.AchievementSystem.hasItem(id))return Promise.resolve();
    if(pending.has(id))return pending.get(id);
    const leave=()=>root.AchievementSystem.obtainItem(id);
    root.addEventListener('pagehide',leave,{capture:true,once:true});
    const task=(async()=>{
      const doc=root.document,r=anchor?.getBoundingClientRect(),el=doc.createElement('div');
      el.style.cssText='position:fixed;z-index:2147482998;width:150px;height:170px;pointer-events:none;';
      el.style.left=clamp((r?r.left+r.width/2:root.innerWidth/2)-75,8,Math.max(8,root.innerWidth-158))+'px';
      el.style.top=clamp(r?r.top:root.innerHeight/2-85,8,Math.max(8,root.innerHeight-178))+'px';
      const shadow=el.attachShadow({mode:'open'}),img=doc.createElement('img');
      img.src=asset(id);img.alt=root.AchievementSystem.getItemDefinition(id).name;
      img.style.cssText='width:100%;height:100%;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 8px 12px #33445555)';
      shadow.append(img);doc.body.append(el);
      try{
        const a=img.animate?.([{opacity:0,transform:'translateY(20px) scale(.7)'},{opacity:1,transform:'translateY(-14px) scale(1)'}],{duration:root.matchMedia('(prefers-reduced-motion: reduce)').matches?1:600,fill:'forwards'});
        await a?.finished.catch(()=>{});el.remove();await root.AchievementSystem.obtainItem(id);
      }finally{el.remove();pending.delete(id);root.removeEventListener('pagehide',leave,true);}
    })();pending.set(id,task);return task;
  }

  function create(c){
    const {node,ui,host}=c;
    let s=stateFrom(c.getProgress()),active=false,busy=false,epoch=0,selected=null,cleanupPointer=null,ghost=null,muted=false;
    const animations=new Set(),sound=new root.Audio(new URL('assets/cognition/mechanical-click.wav',base).href);sound.volume=.18;
    const picture=(id,cls='')=>{const e=node('img',cls);e.src=asset(id);e.alt='';e.draggable=false;return e;};
    const button=(label,fn,cls='cp-button')=>{const e=node('button',cls,label);e.type='button';e.onclick=fn;return e;};
    const say=text=>{const e=ui.content.querySelector('.cp-status');if(e)e.textContent=text;};
    const save=patch=>{s={...s,...patch,cognitionPuzzleVersion:3};c.update({...s,finalChallengeCompleted:!!s.cognitionPart2Completed,objectOpened:!!s.cognitionPart2Completed});};
    function click(){if(muted)return;sound.currentTime=0;try{sound.play()?.catch(()=>{});}catch(_){}}
    async function animate(el,frames,duration=350){
      if(!el?.animate)return;
      const a=el.animate(frames,{duration:host.matchMedia('(prefers-reduced-motion: reduce)').matches?1:duration,easing:'ease-in-out',fill:'forwards'});
      animations.add(a);try{await a.finished;}catch(_){}finally{animations.delete(a);a.cancel();}
    }
    function cancel(){epoch++;cleanupPointer?.();active=false;busy=false;selected=null;ghost?.remove();ghost=null;for(const a of animations)a.cancel();animations.clear();sound.pause();ui.panel.classList.remove('cp-fullscreen');}
    function decorate(card,item){
      card.dataset.special=item.id;
      card.append(node('span','as-object-state',stateFrom(c.getProgress()).cognitionPart2Completed?'數字已對齊':'鑰匙與照片拼圖'),button('查看記憶盒',()=>openObject(item.id),'as-inspect'));
      card.addEventListener('click',e=>{if(!e.target.closest('button'))openObject(item.id);});
    }
    function openObject(id){
      if(id!=='cognition_memory_box'||!c.hasItem(id)||active||!ui.panel.open)return false;
      s=stateFrom(c.getProgress());active=true;
      if(!ui.shadow.querySelector('[data-cognition-css]')){const link=node('link');link.rel='stylesheet';link.href=new URL('cognition.css',base).href;link.dataset.cognitionCss='';ui.shadow.append(link);}
      ui.panel.classList.add('cp-fullscreen');c.sync();render();return true;
    }
    function page(title){
      cleanupPointer?.();ghost?.remove();selected=null;ui.title.textContent=title;ui.content.replaceChildren();
      const p=node('section','cp-scene'),nav=node('nav','cp-nav');
      const mute=button(muted?'開啟音效':'靜音',()=>{muted=!muted;sound.muted=muted;mute.textContent=muted?'開啟音效':'靜音';});
      nav.append(button('返回收藏',()=>{cancel();c.render();c.sync();}),button('返回房間',()=>{cancel();c.close();c.sync();}),mute,button('提示',()=>say(s.cognitionPart1Completed?'先放照片 A，點格子旋轉把線條接好，再放照片 B。兩張拼好後安裝滑框。':'鑰匙拖到盒子鎖孔，順時針轉一小段。也可點選鑰匙、鎖孔，再用右側按鈕轉動。')));
      const status=node('p','cp-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');p.append(nav,status);ui.content.append(p);return p;
    }
    function bindDrag(tool,id,target,action){
      tool.onclick=()=>{selected=id;ui.content.querySelectorAll('.cp-tool').forEach(t=>t.classList.remove('cp-selected'));tool.classList.add('cp-selected');say('已選取'+tool.textContent+'，請點選對應放置區。');};
      target.addEventListener('click',()=>{if(selected===id&&!busy){selected=null;action();}});
      tool.addEventListener('pointerdown',e=>{
        if(e.button!==0||busy||tool.disabled)return;e.preventDefault();cleanupPointer?.();tool.setPointerCapture(e.pointerId);
        ghost=picture(id,'cp-ghost');ui.panel.append(ghost);
        const motion=ev=>{ghost.style.left=ev.clientX+'px';ghost.style.top=ev.clientY+'px';target.classList.toggle('cp-near',hit(ev.clientX,ev.clientY,target.getBoundingClientRect()));};
        const clean=()=>{tool.removeEventListener('pointermove',motion);tool.removeEventListener('pointerup',up);tool.removeEventListener('pointercancel',clean);tool.removeEventListener('lostpointercapture',clean);ghost?.remove();ghost=null;target.classList.remove('cp-near');cleanupPointer=null;};
        const up=ev=>{const valid=hit(ev.clientX,ev.clientY,target.getBoundingClientRect());clean();if(valid)action();else{selected=id;say('還沒放入，請再拖一次，或點選放置區。');}};
        cleanupPointer=clean;tool.addEventListener('pointermove',motion);tool.addEventListener('pointerup',up);tool.addEventListener('pointercancel',clean);tool.addEventListener('lostpointercapture',clean);motion(e);
      });
    }
    function tool(tray,id,target,action,done){
      const own=c.hasItem(id),name=c.data.items.find(i=>i.id===id).name;
      const b=button(name+(done?' · 已放入':own?' · 拖曳或點選':' · 尚未取得'),()=>{},'cp-tool');b.prepend(picture(id));b.disabled=!own||done;tray.append(b);if(own&&!done)bindDrag(b,id,target,action);
    }
    async function install(id,patch,target){
      if(busy||!active||!c.hasItem(id))return;busy=true;
      const run=epoch,part=picture(id,'cp-install');target.append(part);click();
      await animate(part,[{transform:'translateY(-20%) scale(.7)',opacity:.4},{transform:'translateY(0) scale(1)',opacity:1}]);
      if(!active||run!==epoch)return;save(patch);busy=false;render();
    }
    function render(){if(active){if(!s.cognitionPart1Completed)box();else if(s.card8Placed&&!s.photoASolved)rotation(8);else if(s.card3Placed&&!s.photoBSolved)rotation(3);else alignment();}}
    function box(){
      const p=page('記憶盒 · 插入鑰匙'),layout=node('div','cp-box-layout'),stage=node('div','cp-box-stage'),side=node('aside','cp-controls'),tray=node('div','cp-tray');
      const cover=picture('cognition_memory_box','cp-box-art');stage.append(cover);layout.append(stage,side);p.append(layout,tray);
      const lock=button('',()=>{},'cp-keyhole');lock.setAttribute('aria-label','記憶盒正面的鎖孔');stage.append(lock);
      tool(tray,'cognition_key',lock,()=>install('cognition_key',{keyInserted:true},lock),s.keyInserted);
      if(!s.keyInserted){side.append(node('h3','','鑰匙放進鎖孔'),node('p','','拖到盒子正面的圓形鎖孔，放開即可。'));say(c.hasItem('cognition_key')?'將小鑰匙拖到鎖孔。':'還需要小鑰匙，可以先返回房間探索。');return;}
      const pivot=node('div','cp-key-pivot');pivot.append(picture('cognition_key','cp-inserted-key'));stage.append(pivot);
      const ring=button('↻',()=>{},'cp-turn-ring');ring.setAttribute('aria-label','順時針沿圓弧拖動鑰匙；右方向鍵也可轉動');stage.append(ring);
      const progress=node('p','cp-turn-progress');side.append(node('h3','','順時針轉一小段'),progress);
      let turn=s.keyTurn;
      const paint=()=>{pivot.style.transform='rotate('+turn+'deg)';progress.textContent='開鎖 '+Math.round(turn/70*100)+'%';};
      async function finish(){
        if(busy||turn<70)return;busy=true;const run=epoch;save({keyTurn:70});click();
        await animate(lock,[{transform:'translate(-50%,-50%) rotate(0deg)'},{transform:'translate(-50%,-50%) rotate(70deg)'}],220);
        if(!active||run!==epoch)return;
        pivot.hidden=true;ring.hidden=true;lock.hidden=true;cover.src=asset('memory-box-open');
        await animate(cover,[{opacity:.35,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],500);
        if(!active||run!==epoch)return;save({cognitionPart1Completed:true});busy=false;render();
      }
      const rotate=delta=>{if(busy)return;turn=clamp(turn+delta,0,70);paint();save({keyTurn:turn});if(turn>=70)finish();};
      side.append(button('順時針轉一小段',()=>rotate(35)),node('p','cp-note','只需轉動小段圓弧，不必繞整圈。'));
      ring.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();rotate(e.key==='ArrowRight'?20:-20);}});
      ring.addEventListener('pointerdown',e=>{
        if(e.button!==0||busy)return;e.preventDefault();ring.setPointerCapture(e.pointerId);
        const r=ring.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
        let previous=Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI;
        const motion=ev=>{if(Math.hypot(ev.clientX-cx,ev.clientY-cy)<10)return;const next=Math.atan2(ev.clientY-cy,ev.clientX-cx)*180/Math.PI;rotate(angleDelta(next,previous));previous=next;};
        const end=()=>{ring.removeEventListener('pointermove',motion);ring.removeEventListener('pointerup',end);ring.removeEventListener('pointercancel',end);ring.removeEventListener('lostpointercapture',end);cleanupPointer=null;};
        cleanupPointer=end;ring.addEventListener('pointermove',motion);ring.addEventListener('pointerup',end);ring.addEventListener('pointercancel',end);ring.addEventListener('lostpointercapture',end);
      });paint();say('鑰匙已插入。沿鎖孔周圍的圓弧順時針拖一小段。');if(turn>=70)finish();
    }

    function rotation(digit){
      const isA=digit===8,key=isA?'photoATurns':'photoBTurns',done=isA?'photoASolved':'photoBSolved';
      const p=page('記憶盒 · 破碎照片 '+(isA?'A':'B')),board=node('div','cp-rotation-board'),notice=node('p','cp-rotation-progress');
      p.append(node('p','cp-note','點一下格子，順時針轉 90°。將線條接成一張完整照片。'),board,notice);
      let turns=s[key].slice();const tiles=[];
      function paint(){tiles.forEach((b,i)=>{b.children[0].style.transform='rotate('+turns[i]*90+'deg)';b.setAttribute('aria-label','第 '+(i+1)+' 格，旋轉 '+turns[i]*90+' 度，點擊再旋轉');});notice.textContent='沒有時間限制，已完成的轉動會自動保存。';}
      function turn(i){if(busy||s[done])return;turns[i]=(turns[i]+1)%4;save({[key]:turns.slice()});click();paint();if(solved(digit,turns)){save({[done]:true});board.classList.add('cp-photo-solved');notice.textContent='照片 '+(isA?'A':'B')+' 已拼好！';tiles.forEach(b=>b.disabled=true);p.append(button(isA?'照片 A 已拼好，繼續':'照片 B 已拼好，安裝滑框',()=>render()));}}
      for(let i=0;i<9;i++){const b=button('',()=>turn(i),'cp-rotation-tile'),img=node('img');img.src=new URL('assets/cognition/rotation-'+digit+'-'+i+'.svg',base).href;img.alt='';img.draggable=false;b.append(img);tiles.push(b);board.append(b);}
      paint();say('像醫療盒的道路拼接：只要旋轉格子，不用交換位置。');
    }
    function alignment(){
      const p=page('記憶盒 · 數字對位'),desk=node('div','cp-desk'),stage=node('div','cp-frame-stage'),tray=node('div','cp-tray');
      // Symmetric outer space keeps the main frame centered; the sole control is horizontal.
      desk.append(stage);p.append(desk,tray);
      const frame=node('div','cp-main-frame'),cards=node('div','cp-cards');frame.append(cards);stage.append(frame);
      const slot8=button(s.card8Placed?'':'放入照片 A',()=>{},'cp-card-slot cp-slot-eight');slot8.setAttribute('aria-label','右側照片 A 槽位');
      const slot3=button(s.card3Placed?'':'先拼好照片 A',()=>{},'cp-card-slot cp-slot-three');slot3.setAttribute('aria-label','左側照片 B 槽位');
      if(s.card8Placed){const img=picture('cognition_number_card_8');img.src=photoAsset(8,'template');slot8.append(img);slot8.classList.add('cp-filled');}
      if(s.card3Placed){const img=picture('cognition_number_card_3');img.src=photoAsset(3,'template');slot3.append(img);slot3.classList.add('cp-filled');}
      cards.append(slot3,slot8);
      const surround=button(s.frameInstalled?'滑框已安裝':'放入對位滑框',()=>{},'cp-frame-slot');surround.setAttribute('aria-label','畫框上緣滑框安裝軌道');surround.hidden=s.cognitionPart2Completed;stage.append(surround);
      const overlay=picture('cognition_alignment_frame','cp-overlay');overlay.hidden=!s.frameInstalled;frame.append(overlay);
      const reading=node('div','cp-reading-order');reading.append(node('span','cp-read-second','第二位'),node('span','cp-read-arrow','← 讀取方向'),node('span','cp-read-first','第一位'));frame.append(reading);
      const instruction=node('p','cp-order-instruction','照片位置不代表密碼順序。移動滑框，找出讀取方向。');desk.append(instruction);
      tool(tray,'cognition_number_card_8',slot8,()=>install('cognition_number_card_8',{card8Placed:true},slot8),s.card8Placed);
      if(s.photoASolved){if(!s.card3Placed)slot3.textContent='放入照片 B';tool(tray,'cognition_number_card_3',slot3,()=>install('cognition_number_card_3',{card3Placed:true},slot3),s.card3Placed);}else slot3.disabled=true;
      if(s.photoBSolved)tool(tray,'cognition_alignment_frame',surround,()=>install('cognition_alignment_frame',{frameInstalled:true},surround),s.frameInstalled);else {surround.disabled=true;surround.textContent='兩張照片拼好後安裝滑框';}
      let position=s.alignmentCompleted?0:s.alignmentPosition;
      const controls=node('div','cp-alignment-controls'),track=node('div','cp-track'),center=node('span','cp-center-mark'),handle=button('左右拖動',()=>{},'cp-handle');
      handle.disabled=!installed(s)||s.alignmentCompleted;handle.setAttribute('role','slider');handle.setAttribute('aria-label','左右拖曳對位把手到中央');handle.setAttribute('aria-valuemin','-35');handle.setAttribute('aria-valuemax','35');
      track.append(center,handle);controls.append(track);desk.append(controls);
      function paint(){
        handle.style.left=(50+position)+'%';handle.setAttribute('aria-valuenow',String(Math.round(position)));
        overlay.style.transform='translateX('+position*.32+'%)';
        slot8.style.transform='translateX('+position*.45+'%)';slot3.style.transform='translateX('+(-position*.45)+'%)';
        track.classList.toggle('cp-aligned',Math.abs(position)<=7);
        reading.hidden=!s.alignmentCompleted;
        reading.style.transform='translateX('+position*.32+'%)';
        instruction.hidden=!!s.alignmentCompleted;
      }
      async function settle(){
        if(!installed(s)||s.alignmentCompleted||busy)return;
        save({alignmentPosition:position});
        if(Math.abs(position)>7){say('再向中央移一點，接近時會自動對齊。');return;}
        position=0;save({alignmentPosition:0,alignmentCompleted:true});paint();await finish(frame);
      }
      const adjust=v=>{if(!installed(s)||s.alignmentCompleted||busy)return;position=clamp(v,-35,35);paint();};
      handle.addEventListener('pointerdown',e=>{
        if(e.button!==0||handle.disabled||busy)return;e.preventDefault();handle.setPointerCapture(e.pointerId);
        const r=track.getBoundingClientRect(),startX=e.clientX,startPosition=position;
        const motion=ev=>adjust(startPosition+(ev.clientX-startX)/Math.max(1,r.width)*100);
        const clean=()=>{handle.removeEventListener('pointermove',motion);handle.removeEventListener('pointerup',up);handle.removeEventListener('pointercancel',clean);handle.removeEventListener('lostpointercapture',clean);cleanupPointer=null;save({alignmentPosition:position});};
        const up=()=>{clean();settle();};cleanupPointer=clean;handle.addEventListener('pointermove',motion);handle.addEventListener('pointerup',up);handle.addEventListener('pointercancel',clean);handle.addEventListener('lostpointercapture',clean);
      });
      handle.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();adjust(position+(e.key==='ArrowRight'?6:-6));settle();});
      const assist=button('輔助：向中央移一格',()=>{adjust(position-Math.sign(position)*Math.min(12,Math.abs(position)));settle();});assist.disabled=handle.disabled;controls.append(assist);
      paint();
      if(s.cognitionPart2Completed){result(desk,p);return;}
      if(ready(s)){finish(frame);return;}
      say(installed(s)?'將下方把手向中央拖一下，接近中央就會吸附。':'先放照片 A 並拼好，再放照片 B。兩張完成後，將滑框放到上方軌道。');
    }
    async function finish(frame){
      if(busy||!ready(s)||!ids.every(c.hasItem))return;busy=true;const run=epoch;click();
      await animate(frame,[{filter:'brightness(1)'},{filter:'brightness(1.12)'},{filter:'brightness(1)'}],400);
      if(!active||run!==epoch)return;save({cognitionPart2Completed:true});busy=false;render();
    }
    function result(desk,p){
      if(!c.reveal()){say('前面的區域之後再探索吧!先完成這房間的內容哦!');p.append(node('p','cp-note','對位進度已保存，完成房內其餘活動後再來查看。'));return;}
      if(!s.cognitionPasswordRevealed)save({cognitionPasswordRevealed:true});
      const drawer=node('div','cp-drawer');drawer.append(node('span','','認知房密碼'),node('strong','','83'));desk.append(drawer);
      animate(drawer,[{opacity:0,transform:'translate(-50%,-16px)'},{opacity:1,transform:'translate(-50%,0)'}],400);
      p.append(button('記住密碼並返回房間',()=>{cancel();c.close();c.sync();}));say('滑框顯示由右向左讀：右側 8 是第一位，左側 3 是第二位。記住 83，返回房間親自輸入。');
    }
    return {get active(){return active;},decorate,openObject,cancel};
  }
  root.CognitionPuzzle={create,drop,logic:Object.freeze({ids,defaults,stateFrom,installed,ready,angleDelta,hit,solved,initialA,initialB})};
})(window);
