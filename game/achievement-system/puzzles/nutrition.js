(function(root){'use strict';
  const base=new URL('.',document.currentScript.src);
  /* 第三修改計劃 E3-4:ART-3P-01 紅色開罐圖已於 2026-11-17 驗收並覆蓋 can-open.png,暫代圖設定已清空 */
  const ART_TEMP={};
  const asset=id=>new URL('assets/nutrition/'+(ART_TEMP[id]||id)+'.png',base).href;
  /* 拖曳時游標抓住的位置(以圖框比例計):開罐器抓藍色握柄,其他物品抓正中央 */
  const GRAB={nutrition_can_opener:[.41,.54]};
  const ids=['nutrition_guide_card','nutrition_can_a','nutrition_can_b','nutrition_can_opener','nutrition_coin'];
  const defaults={nutritionPuzzleVersion:2,guideViewed:false,correctCanChosen:false,openerAttached:false,openerTurn:0,nutritionPart1Completed:false,canOpened:false,coinUsed:false,scratchCells:[],scratchCompleted:false,nutritionPart2Completed:false,nutritionPasswordRevealed:false};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const validCells=cells=>Array.from(new Set(Array.isArray(cells)?cells.filter(n=>Number.isInteger(n)&&n>=0&&n<120):[]));
  const stateFrom=p=>p.nutritionPuzzleVersion===2?{...defaults,...p,openerTurn:clamp(Number(p.openerTurn)||0,0,55),scratchCells:validCells(p.scratchCells)}:{...defaults,scratchCells:[]};
  const ready=s=>s.guideViewed&&s.correctCanChosen&&s.canOpened&&s.nutritionPart1Completed&&s.coinUsed&&s.scratchCompleted;
  const angleDelta=(a,b)=>(a-b+540)%360-180;
  const hit=(x,y,r)=>x>=r.left-24&&x<=r.right+24&&y>=r.top-24&&y<=r.bottom+24;
  // A small 20 x 6 coating mask is erased along actual coin movement.
  function eraseSegment(cells,from,to){
    const result=new Set(validCells(cells));
    const distance=Math.hypot(to.x-from.x,to.y-from.y),steps=Math.max(1,Math.ceil(distance*40));
    for(let k=0;k<=Math.min(steps,80);k++){
      const ratio=k/Math.min(steps,80),x=from.x+(to.x-from.x)*ratio,y=from.y+(to.y-from.y)*ratio;
      for(let row=0;row<6;row++)for(let col=0;col<20;col++)if(Math.pow(((col+.5)/20-x)/.095,2)+Math.pow(((row+.5)/6-y)/.24,2)<=1)result.add(row*20+col);
    }
    return Array.from(result);
  }
  function create(c){
    const {node,ui,host}=c;
    let s=stateFrom(c.getProgress()),active=false,busy=false,epoch=0,selected=null,cleanupPointer=null,ghost=null,muted=false;
    const animations=new Set(),sound=new root.Audio(new URL('assets/nutrition/metal-click.wav',base).href);sound.volume=.18;
    const picture=(id,cls='')=>{const e=node('img',cls);e.src=asset(id);e.alt='';e.draggable=false;return e;};
    const button=(label,fn,cls='np-button')=>{const e=node('button',cls,label);e.type='button';e.onclick=fn;return e;};
    const say=text=>{const e=ui.content.querySelector('.np-status');if(e)e.textContent=text;};
    const save=patch=>{s={...s,...patch,nutritionPuzzleVersion:2};c.update({...s,finalChallengeCompleted:!!s.nutritionPart2Completed,objectOpened:!!s.nutritionPart2Completed});};
    function click(){if(muted)return;sound.currentTime=0;try{sound.play()?.catch(()=>{});}catch(_){}}
    async function animate(el,frames,duration=350){
      if(!el?.animate)return;
      const a=el.animate(frames,{duration:host.matchMedia('(prefers-reduced-motion: reduce)').matches?1:duration,easing:'ease-in-out',fill:'forwards'});
      animations.add(a);try{await a.finished;}catch(_){}finally{animations.delete(a);a.cancel();}
    }
    function fitZoom(){ui.panel.style.setProperty('--np-z',Math.max(.5,Math.min(host.innerWidth/1280,host.innerHeight/720)).toFixed(4));}
    function cancel(){host.removeEventListener('resize',fitZoom);epoch++;cleanupPointer?.();active=false;busy=false;selected=null;ghost?.remove();ghost=null;for(const a of animations)a.cancel();animations.clear();sound.pause();ui.panel.classList.remove('np-fullscreen');ui.panel.style.removeProperty('--np-z');}
    function decorate(card,item){
      card.dataset.special=item.id;
      card.append(node('span','as-object-state',stateFrom(c.getProgress()).nutritionPart2Completed?'刮刮區已揭露':'選罐頭・開罐・刮出密碼'),button('查看營養罐頭',()=>openObject(item.id),'as-inspect'));
      card.addEventListener('click',e=>{if(!e.target.closest('button'))openObject(item.id);});
    }
    function openObject(id){
      if(id!=='nutrition_can_b'||!c.hasItem(id)||active||!ui.panel.open)return false;
      s=stateFrom(c.getProgress());active=true;
      if(!ui.shadow.querySelector('[data-nutrition-css]')){const link=node('link');link.rel='stylesheet';link.href=new URL('nutrition.css?v=2',base).href;link.dataset.nutritionCss='';ui.shadow.append(link);}
      ui.panel.classList.add('np-fullscreen');fitZoom();host.addEventListener('resize',fitZoom);c.sync();render();return true;
    }
    function page(title){
      cleanupPointer?.();ghost?.remove();selected=null;ui.title.textContent=title;ui.content.replaceChildren();
      const p=node('section','np-scene'),nav=node('nav','np-nav');
      const mute=button(muted?'開啟音效':'靜音',()=>{muted=!muted;sound.muted=muted;mute.textContent=muted?'開啟音效':'靜音';});
      nav.append(button('返回收藏',()=>{cancel();c.render();c.sync();}),button('返回房間',()=>{cancel();c.close();c.sync();}),mute,button('提示',()=>say(s.canOpened?'把硬幣放到銀色區，再左右刮幾下。':'看指引卡，選蛋白質較高的罐頭，將開罐器拖到上蓋，再順時針轉一小段。')));
      const status=node('p','np-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');p.append(nav,status);ui.content.append(p);return p;
    }
    function bindDrag(tool,id,target,action){
      tool.onclick=()=>{selected=id;ui.content.querySelectorAll('.np-tool').forEach(t=>t.classList.remove('np-selected'));tool.classList.add('np-selected');say('已選取'+tool.textContent+'，請點選對應放置區。');};
      target.addEventListener('click',()=>{if(selected===id&&!busy){selected=null;action();}});
      tool.addEventListener('pointerdown',e=>{
        if(e.button!==0||busy||tool.disabled)return;e.preventDefault();cleanupPointer?.();tool.setPointerCapture(e.pointerId);
        ghost=picture(id,'np-ghost');ui.panel.append(ghost);
        const [gx,gy]=GRAB[id]||[.5,.5];ghost.style.transform='none';
        /* 物品面板有整體縮放(zoom),fixed 座標會跟著被放大縮小 → 量一次實際位置再修正,讓抓取點永遠在游標下 */
        const place=(x,y)=>{let L=x,T=y;for(let k=0;k<2;k++){ghost.style.left=L+'px';ghost.style.top=T+'px';const r=ghost.getBoundingClientRect(),z=r.width/(ghost.offsetWidth||r.width)||1;L+=(x-(r.left+r.width*gx))/z;T+=(y-(r.top+r.height*gy))/z;}ghost.style.left=L+'px';ghost.style.top=T+'px';};
        const motion=ev=>{place(ev.clientX,ev.clientY);target.classList.toggle('np-near',hit(ev.clientX,ev.clientY,target.getBoundingClientRect()));};
        const clean=()=>{tool.removeEventListener('pointermove',motion);tool.removeEventListener('pointerup',up);tool.removeEventListener('pointercancel',clean);tool.removeEventListener('lostpointercapture',clean);ghost?.remove();ghost=null;target.classList.remove('np-near');cleanupPointer=null;};
        const up=ev=>{const valid=hit(ev.clientX,ev.clientY,target.getBoundingClientRect());clean();if(valid)action();else{selected=id;say('還沒放入，請再拖一次，或點選放置區。');}};
        cleanupPointer=clean;tool.addEventListener('pointermove',motion);tool.addEventListener('pointerup',up);tool.addEventListener('pointercancel',clean);tool.addEventListener('lostpointercapture',clean);motion(e);
      });
    }
    function tool(tray,id,target,action,done){
      const own=c.hasItem(id),name=c.data.items.find(i=>i.id===id).name;
      const b=button(name+(done?' · 已放入':own?' · 拖曳或點選':' · 尚未取得'),()=>{},'np-tool');b.prepend(picture(id));b.disabled=!own||done;tray.append(b);if(own&&!done)bindDrag(b,id,target,action);
    }
    async function install(id,patch,target){
      if(busy||!active||!c.hasItem(id))return;busy=true;
      const run=epoch,part=picture(id,'np-install');target.append(part);click();
      await animate(part,[{transform:'translateY(-20%) scale(.7)',opacity:.4},{transform:'translateY(0) scale(1)',opacity:1}]);
      if(!active||run!==epoch)return;save(patch);busy=false;render();
    }
    function render(){if(active){if(s.canOpened)scratch();else cans();}}
    function guide(parent){
      const b=button('',()=>{if(!c.hasItem('nutrition_guide_card'))return;save({guideViewed:true});say('請選擇蛋白質較高的罐頭。');},'np-guide');
      b.append(picture('nutrition_guide_card'),node('strong','','請選擇蛋白質較高的罐頭。'),node('span','',c.hasItem('nutrition_guide_card')?'營養指引卡 · 點一下查看':'營養指引卡 · 尚未取得'));
      b.disabled=!c.hasItem('nutrition_guide_card');parent.append(b);
    }
    function labeledCan(letter,cls='np-can'){
      const box=node('div',cls);box.append(picture('nutrition_can_'+letter.toLowerCase(),'np-can-art'));
      const label=node('div','np-label');label.append(node('strong','','罐頭 '+letter),node('span','np-serving','每罐 100g'),node('b','','蛋白質 '+(letter==='A'?'12g':'18g')),node('span','','鈉 '+(letter==='A'?'480mg':'220mg')));box.append(label);return box;
    }
    function cans(){
      const p=page('營養罐頭 · 看指引、選罐頭'),body=node('div','np-body'),side=node('div','np-side'),table=node('div','np-table'),row=node('div','np-can-row'),tray=node('div','np-tray');
      guide(side);side.append(tray);table.append(row);body.append(side,table);p.append(body);
      for(const letter of ['A','B']){
        const own=c.hasItem('nutrition_can_'+letter.toLowerCase()),wrap=node('section','np-can-wrap'),stage=labeledCan(letter);
        const choose=button(own?'選擇罐頭 '+letter:'罐頭 '+letter+' 尚未取得',()=>{
          if(busy||!own)return;
          if(!c.hasItem('nutrition_guide_card')){say('先回房間取得營養指引卡。');return;}
          if(!c.hasItem('nutrition_can_a')||!c.hasItem('nutrition_can_b')){say('先收集兩個罐頭，再比較標示。');return;}
          save({guideViewed:true});
          if(letter==='A'){say('再看看指引卡：請選擇蛋白質較高的罐頭。');return;}
          save({correctCanChosen:true});click();render();
        },'np-choose');
        choose.disabled=!own||s.correctCanChosen;wrap.append(stage,choose);row.append(wrap);
        if(letter==='B'&&s.correctCanChosen){wrap.classList.add('np-chosen');choose.textContent='已選擇 · 罐頭 B';opening(stage,table,tray);}
      }
      if(!s.correctCanChosen){
        for(const id of ['nutrition_can_opener','nutrition_coin']){const b=button(c.data.items.find(i=>i.id===id).name+(c.hasItem(id)?' · 已取得':' · 尚未取得'),()=>{},'np-tool');b.prepend(picture(id));b.disabled=true;tray.append(b);}
        say('看上方指引，再點選符合條件的罐頭。');
      }
      p.append(node('p','np-note','標示為遊戲示意，兩罐份量相同；本次只比較蛋白質。'));
    }
    function opening(stage,table,tray){
      const rim=button('',()=>{},'np-rim');rim.setAttribute('aria-label','罐頭 B 上蓋邊緣，放置開罐器');stage.append(rim);
      tool(tray,'nutrition_can_opener',rim,()=>install('nutrition_can_opener',{openerAttached:true},rim),s.openerAttached);
      if(!s.openerAttached){say('選好了！把開罐器拖到紅色罐頭的上蓋邊緣。');return;}
      const pivot=node('div','np-opener-pivot');pivot.append(picture('nutrition_can_opener','np-attached-opener'));stage.append(pivot);
      const arc=button('',()=>{},'np-open-arc');arc.setAttribute('aria-label','順時針沿短圓弧拖曳開罐器；也可按右方向鍵');arc.innerHTML='<svg viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true"><ellipse class="np-ring-track" cx="50" cy="25" rx="49" ry="24"/><ellipse class="np-ring-fill" cx="50" cy="25" rx="49" ry="24" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/></svg><span aria-hidden="true">↻</span>';stage.append(arc);
      const controls=node('div','np-open-controls'),readout=node('span','np-open-progress');controls.append(readout,button('輔助：轉一小段',()=>rotate(28)));table.append(controls);
      let turn=s.openerTurn;
      const ring=arc.querySelector('.np-ring-fill');
      const paint=()=>{pivot.style.transform='rotate('+turn+'deg)';readout.textContent='開罐 '+Math.round(turn/55*100)+'%';ring.style.strokeDashoffset=String(100-Math.round(turn/55*100));};
      const spark=()=>{for(let i=0;i<3;i++){const sp=node('span','np-spark'),a=Math.random()*Math.PI*2,d=18+Math.random()*26;sp.style.cssText='left:'+(72+Math.random()*10-5)+'%;top:'+(22+Math.random()*6-3)+'%;--dx:'+Math.cos(a)*d+'px;--dy:'+(Math.sin(a)*d-14)+'px';stage.append(sp);setTimeout(()=>sp.remove(),520);}};
      async function finish(){
        if(busy||turn<55)return;busy=true;const run=epoch;save({openerTurn:55});click();
        const art=stage.querySelector('.np-can-art');
        stage.append(node('div','np-flash'));
        for(let i=0;i<6;i++){const st=node('span','np-steam');st.style.setProperty('--dx',(Math.random()*80-40)+'px');st.style.left=(38+Math.random()*24)+'%';st.style.animationDelay=(i*90)+'ms';stage.append(st);setTimeout(()=>st.remove(),1600+i*90);}
        art.src=asset('can-open');art.classList.add('np-pop');say('喀！開罐成功，看看罐子裡有什麼。');
        const lid=picture('nutrition_can_b','np-lid-layer');stage.append(lid);
        await animate(lid,[{transform:'translate(0,0) rotate(0)',opacity:1},{transform:'translate(0,-16%) rotate(-6deg)',opacity:1,offset:.3},{transform:'translate(34%,-78%) rotate(38deg)',opacity:0}],900);
        lid.remove();
        if(!active||run!==epoch)return;save({canOpened:true,nutritionPart1Completed:true});busy=false;render();
      }
      const rotate=delta=>{if(busy)return;const before=turn;turn=clamp(turn+delta,0,55);paint();save({openerTurn:turn});if(turn>before){spark();stage.classList.remove('np-working');void stage.offsetWidth;stage.classList.add('np-working');if(Math.floor(turn/11)!==Math.floor(before/11))click();}if(turn>=55)finish();};
      arc.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();rotate(e.key==='ArrowRight'?20:-20);}});
      arc.addEventListener('pointerdown',e=>{
        if(e.button!==0||busy)return;e.preventDefault();cleanupPointer?.();arc.setPointerCapture(e.pointerId);
        const r=arc.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let previous=Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI;
        const motion=ev=>{if(Math.hypot(ev.clientX-cx,ev.clientY-cy)<10)return;const next=Math.atan2(ev.clientY-cy,ev.clientX-cx)*180/Math.PI;rotate(angleDelta(next,previous));previous=next;};
        const end=()=>{arc.removeEventListener('pointermove',motion);arc.removeEventListener('pointerup',end);arc.removeEventListener('pointercancel',end);arc.removeEventListener('lostpointercapture',end);cleanupPointer=null;};
        cleanupPointer=end;arc.addEventListener('pointermove',motion);arc.addEventListener('pointerup',end);arc.addEventListener('pointercancel',end);arc.addEventListener('lostpointercapture',end);
      });paint();say('沿罐頭上緣順時針轉一小段即可開罐，不用轉整圈。');if(turn>=55)finish();
    }
    function scratch(){
      const p=page('營養罐頭 · 用硬幣刮開'),table=node('div','np-table np-scratch-table'),can=labeledCan('B','np-can np-open-can'),surface=node('div','np-scratch-card'),tray=node('div','np-tray');
      can.querySelector('.np-can-art').src=asset('can-open');table.append(can,surface);const body=node('div','np-body'),side=node('div','np-side');side.append(tray);body.append(side,table);p.append(body);
      surface.append(node('h3','','罐內銀色刮刮區'));
      const area=button('',()=>{},'np-scratch-area');area.setAttribute('aria-label','銀色刮刮區，放入硬幣後左右拖曳');
      const answer=node('strong','np-scratch-answer',''),coating=node('div','np-coating'),coin=picture('nutrition_coin','np-scratch-coin');
      answer.textContent=c.getProgress().allActivitiesCompleted&&ids.every(c.hasItem)?'14':'完成房內活動';
      answer.setAttribute('aria-hidden','true');
      area.append(answer,coating,coin);surface.append(area);coin.hidden=!s.coinUsed||s.scratchCompleted;
      const cells=Array.from({length:120},(_,i)=>{const cell=node('span','np-silver-cell');cell.style.setProperty('--shade',String(170+(i*17%65)));coating.append(cell);return cell;});
      let erased=validCells(s.scratchCells);
      const progress=node('p','np-scratch-progress');surface.append(progress);
      const paint=()=>{cells.forEach((cell,i)=>cell.style.opacity=s.scratchCompleted||erased.includes(i)?'0':'1');progress.textContent=s.scratchCompleted?'刮除完成':'刮除 '+Math.min(100,Math.round(erased.length/72*100))+'%';progress.style.setProperty('--p',(s.scratchCompleted?100:Math.min(100,Math.round(erased.length/72*100)))+'%');};
      const allowed=()=>s.coinUsed&&c.hasItem('nutrition_coin')&&!s.scratchCompleted&&!busy;
      const persist=()=>save({scratchCells:erased});
      async function finish(){
        if(busy||erased.length<72||!s.coinUsed||!ids.every(c.hasItem))return;busy=true;const run=epoch;
        save({scratchCells:erased,scratchCompleted:true});click();
        await animate(coating,[{opacity:1},{opacity:0}],250);
        if(!active||run!==epoch)return;save({nutritionPart2Completed:true});busy=false;render();
      }
      const rub=(from,to)=>{if(!allowed())return;erased=eraseSegment(erased,from,to);paint();if(erased.length>=72)finish();};
      tool(tray,'nutrition_coin',area,()=>install('nutrition_coin',{coinUsed:true},area),s.coinUsed);
      area.addEventListener('pointerdown',e=>{
        if(e.button!==0||!allowed())return;e.preventDefault();cleanupPointer?.();area.setPointerCapture(e.pointerId);
        const rect=area.getBoundingClientRect();let last=null;
        const point=ev=>({x:(ev.clientX-rect.left)/rect.width,y:(ev.clientY-rect.top)/rect.height});
        const motion=ev=>{const pt=point(ev);if(pt.x<0||pt.x>1||pt.y<0||pt.y>1){last=null;return;}coin.style.left=pt.x*100+'%';coin.style.top=pt.y*100+'%';if(last)rub(last,pt);last=pt;};
        const end=()=>{area.removeEventListener('pointermove',motion);area.removeEventListener('pointerup',end);area.removeEventListener('pointercancel',end);area.removeEventListener('lostpointercapture',end);cleanupPointer=null;persist();};
        cleanupPointer=end;area.addEventListener('pointermove',motion);area.addEventListener('pointerup',end);area.addEventListener('pointercancel',end);area.addEventListener('lostpointercapture',end);motion(e);
      });
      function assist(){
        if(!allowed())return;
        let bestRow=0,bestCount=-1;
        for(let row=0;row<6;row++){const missing=Array.from({length:20},(_,col)=>row*20+col).filter(i=>!erased.includes(i)).length;if(missing>bestCount){bestCount=missing;bestRow=row;}}
        const y=(bestRow+.5)/6;rub({x:.05,y},{x:.95,y});persist();coin.style.left='95%';coin.style.top=y*100+'%';
      }
      const help=button('輔助：刮一小條',assist);help.disabled=!s.coinUsed||s.scratchCompleted;surface.append(help);
      area.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();assist();}});
      paint();
      if(s.nutritionPart2Completed){result(surface,p);return;}
      if(s.scratchCompleted&&ready(s)){save({nutritionPart2Completed:true});render();return;}
      if(erased.length>=72&&s.coinUsed){finish();return;}
      say(s.coinUsed?'在銀色區左右刮幾下。已刮開的部分會保留。':'把硬幣拖到銀色區，再左右刮幾下。');
    }
    function result(surface,p){
      if(!c.reveal()){say('前面的區域之後再探索吧!先完成這房間的內容哦!');p.append(node('p','np-note','刮除進度已保存，完成其餘活動後再來查看。'));return;}
      if(!s.nutritionPasswordRevealed)save({nutritionPasswordRevealed:true});
      const answer=surface.querySelector('.np-scratch-answer');answer.textContent='14';answer.setAttribute('aria-hidden','false');
      surface.append(node('p','np-result','營養房密碼：14'));
      (p.querySelector('.np-side')||p).append(button('記住密碼並返回房間',()=>{cancel();c.close();c.sync();}));say('刮開了！記住 14，回到房間親自輸入密碼。');
    }
    return {get active(){return active;},decorate,openObject,cancel};
  }
  root.NutritionPuzzle={create,logic:Object.freeze({ids,defaults,stateFrom,ready,angleDelta,hit,validCells,eraseSegment})};
})(window);
