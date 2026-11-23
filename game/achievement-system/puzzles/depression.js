(function(root){'use strict';
  const base=new URL('.',document.currentScript.src);
  const asset=id=>new URL('assets/depression/'+id+'.png',base).href;
  const ids=['depression_diary_key','depression_diary','depression_red_photo_filter','depression_blue_note_filter','depression_support_mask_card'];
  const defaults={depressionPuzzleVersion:2,keyInserted:false,keyTurn:0,depressionPart1Completed:false,maskCardPlaced:false,redFilterUsed:false,blueFilterUsed:false,digit2Revealed:false,digit7Revealed:false,activeFilter:null,depressionPart2Completed:false,depressionPasswordRevealed:false};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const stateFrom=p=>p.depressionPuzzleVersion===2?{...defaults,...p,keyTurn:clamp(Number(p.keyTurn)||0,0,70),activeFilter:['red','blue'].includes(p.activeFilter)?p.activeFilter:null}:{...defaults};
  const ready=s=>s.depressionPart1Completed&&s.maskCardPlaced&&s.redFilterUsed&&s.blueFilterUsed&&s.digit2Revealed&&s.digit7Revealed;
  const angleDelta=(a,b)=>(a-b+540)%360-180;
  const hit=(x,y,r)=>x>=r.left-20&&x<=r.right+20&&y>=r.top-20&&y<=r.bottom+20;
  function create(c){
    const {node,ui,host}=c;
    let s=stateFrom(c.getProgress()),active=false,busy=false,epoch=0,selected=null,cleanupPointer=null,ghost=null,muted=false;
    const animations=new Set(),sound=new root.Audio(new URL('assets/depression/lock-click.wav',base).href);sound.volume=.18;
    const picture=(id,cls='')=>{const e=node('img',cls);e.src=asset(id);e.alt='';e.draggable=false;return e;};
    const button=(label,fn,cls='dp-button')=>{const e=node('button',cls,label);e.type='button';e.onclick=fn;return e;};
    const say=text=>{const e=ui.content.querySelector('.dp-status');if(e)e.textContent=text;};
    const save=patch=>{s={...s,...patch,depressionPuzzleVersion:2};c.update({...s,finalChallengeCompleted:!!s.depressionPart2Completed,objectOpened:!!s.depressionPart2Completed});};
    function click(){if(muted)return;sound.currentTime=0;try{sound.play()?.catch(()=>{});}catch(_){}}
    async function animate(el,frames,duration=350){
      if(!el?.animate)return;
      const a=el.animate(frames,{duration:host.matchMedia('(prefers-reduced-motion: reduce)').matches?1:duration,easing:'ease-in-out',fill:'forwards'});
      animations.add(a);try{await a.finished;}catch(_){}finally{animations.delete(a);a.cancel();}
    }
    function cancel(){epoch++;cleanupPointer?.();active=false;busy=false;selected=null;ghost?.remove();ghost=null;for(const a of animations)a.cancel();animations.clear();sound.pause();ui.panel.classList.remove('dp-fullscreen');}
    function decorate(card,item){
      card.dataset.special=item.id;
      card.append(node('span','as-object-state',stateFrom(c.getProgress()).depressionPart2Completed?'支持訊息已揭露':'支持卡與紅藍透光卡'),button('查看日記本',()=>openObject(item.id),'as-inspect'));
      card.addEventListener('click',e=>{if(!e.target.closest('button'))openObject(item.id);});
    }
    function openObject(id){
      if(id!=='depression_diary'||!c.hasItem(id)||active||!ui.panel.open)return false;
      s=stateFrom(c.getProgress());active=true;
      if(!ui.shadow.querySelector('[data-depression-css]')){const link=node('link');link.rel='stylesheet';link.href=new URL('depression.css',base).href;link.dataset.depressionCss='';ui.shadow.append(link);}
      ui.panel.classList.add('dp-fullscreen');c.sync();render();return true;
    }
    function page(title){
      cleanupPointer?.();ghost?.remove();selected=null;ui.title.textContent=title;ui.content.replaceChildren();
      const p=node('section','dp-scene'),nav=node('nav','dp-nav');
      const mute=button(muted?'開啟音效':'靜音',()=>{muted=!muted;sound.muted=muted;mute.textContent=muted?'開啟音效':'靜音';});
      nav.append(button('返回收藏',()=>{cancel();c.render();c.sync();}),button('返回房間',()=>{cancel();c.close();c.sync();}),mute,button('提示',()=>say(s.depressionPart1Completed?'先把心理支持卡放到日記頁，再分別放上紅卡與藍卡。藍卡看第一位，紅卡看第二位。':'鑰匙拖到日記本鎖孔，順時針轉一小段。也可點選鑰匙、鎖孔，再用右側按鈕轉動。')));
      const status=node('p','dp-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');p.append(nav,status);ui.content.append(p);return p;
    }
    function bindDrag(tool,id,target,action){
      tool.onclick=()=>{selected=id;ui.content.querySelectorAll('.dp-tool').forEach(t=>t.classList.remove('dp-selected'));tool.classList.add('dp-selected');say('已選取'+tool.textContent+'，請點選對應放置區。');};
      target.addEventListener('click',()=>{if(selected===id&&!busy){selected=null;action();}});
      tool.addEventListener('pointerdown',e=>{
        if(e.button!==0||busy||tool.disabled)return;e.preventDefault();cleanupPointer?.();tool.setPointerCapture(e.pointerId);
        ghost=picture(id,'dp-ghost');ui.panel.append(ghost);
        const motion=ev=>{ghost.style.left=ev.clientX+'px';ghost.style.top=ev.clientY+'px';target.classList.toggle('dp-near',hit(ev.clientX,ev.clientY,target.getBoundingClientRect()));};
        const clean=()=>{tool.removeEventListener('pointermove',motion);tool.removeEventListener('pointerup',up);tool.removeEventListener('pointercancel',clean);tool.removeEventListener('lostpointercapture',clean);ghost?.remove();ghost=null;target.classList.remove('dp-near');cleanupPointer=null;};
        const up=ev=>{const valid=hit(ev.clientX,ev.clientY,target.getBoundingClientRect());clean();if(valid)action();else{selected=id;say('還沒放入，請再拖一次，或點選放置區。');}};
        cleanupPointer=clean;tool.addEventListener('pointermove',motion);tool.addEventListener('pointerup',up);tool.addEventListener('pointercancel',clean);tool.addEventListener('lostpointercapture',clean);motion(e);
      });
    }
    function tool(tray,id,target,action,done){
      const own=c.hasItem(id),name=c.data.items.find(i=>i.id===id).name;
      const b=button(name+(done?' · 已放入':own?' · 拖曳或點選':' · 尚未取得'),()=>{},'dp-tool');b.prepend(picture(id));b.disabled=!own||done;tray.append(b);if(own&&!done)bindDrag(b,id,target,action);
    }
    async function install(id,patch,target){
      if(busy||!active||!c.hasItem(id))return;busy=true;
      const run=epoch,part=picture(id,'dp-install');target.append(part);click();
      await animate(part,[{transform:'translateY(-20%) scale(.7)',opacity:.4},{transform:'translateY(0) scale(1)',opacity:1}]);
      if(!active||run!==epoch)return;save(patch);busy=false;render();
    }
    function render(){if(active){if(s.depressionPart1Completed)alignment();else box();}}
    function box(){
      const p=page('日記本 · 插入鑰匙'),layout=node('div','dp-box-layout'),stage=node('div','dp-box-stage'),side=node('aside','dp-controls'),tray=node('div','dp-tray');
      const cover=picture('depression_diary','dp-box-art');stage.append(cover);layout.append(stage,side);p.append(layout,tray);
      const lock=button('',()=>{},'dp-keyhole');lock.setAttribute('aria-label','日記本正面的鎖孔');stage.append(lock);
      tool(tray,'depression_diary_key',lock,()=>install('depression_diary_key',{keyInserted:true},lock),s.keyInserted);
      if(!s.keyInserted){side.append(node('h3','','鑰匙放進鎖孔'),node('p','','拖到日記本正面的圓形鎖孔，放開即可。'));say(c.hasItem('depression_diary_key')?'將小鑰匙拖到鎖孔。':'還需要小鑰匙，可以先返回房間探索。');return;}
      const pivot=node('div','dp-key-pivot');pivot.append(picture('depression_diary_key','dp-inserted-key'));stage.append(pivot);
      const ring=button('↻',()=>{},'dp-turn-ring');ring.setAttribute('aria-label','順時針沿圓弧拖動鑰匙；右方向鍵也可轉動');stage.append(ring);
      const progress=node('p','dp-turn-progress');side.append(node('h3','','順時針轉一小段'),progress);
      let turn=s.keyTurn;
      const paint=()=>{pivot.style.transform='rotate('+turn+'deg)';progress.textContent='開鎖 '+Math.round(turn/70*100)+'%';};
      async function finish(){
        if(busy||turn<70)return;busy=true;const run=epoch;save({keyTurn:70});click();
        await animate(lock,[{transform:'translate(-50%,-50%) rotate(0deg)'},{transform:'translate(-50%,-50%) rotate(70deg)'}],220);
        if(!active||run!==epoch)return;
        pivot.hidden=true;ring.hidden=true;lock.hidden=true;
        await animate(cover,[{transform:'perspective(900px) rotateY(0deg)'},{transform:'perspective(900px) rotateY(-65deg)',opacity:.5}],280);
        if(!active||run!==epoch)return;cover.src=asset('diary-open');
        await animate(cover,[{opacity:.35,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],500);
        if(!active||run!==epoch)return;save({depressionPart1Completed:true});busy=false;render();
      }
      const rotate=delta=>{if(busy)return;turn=clamp(turn+delta,0,70);paint();save({keyTurn:turn});if(turn>=70)finish();};
      side.append(button('順時針轉一小段',()=>rotate(35)),node('p','dp-note','只需轉動小段圓弧，不必繞整圈。'));
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
    function alignment(){
      const p=page('日記本 · 留一點空間給支持'),desk=node('div','dp-desk'),book=node('div','dp-open-stage'),tray=node('div','dp-tray');
      book.append(picture('diary-open','dp-open-art'));desk.append(book);p.append(desk,tray);
      const paper=node('div','dp-paper');book.append(paper);
      const lines=[
        ['dp-line-one','今天有一點低落，步調也慢了。'],
        ['dp-line-two dp-ink-blue','想說的話，可以慢慢說。'],
        ['dp-line-three dp-ink-red','我願意，讓人陪一會兒。'],
        ['dp-line-four dp-ink-blue','可以打電話，約個時間聊聊。'],
        ['dp-line-five dp-ink-red','需要時，也可以尋求支持。'],
        ['dp-line-six','今天先這樣，就已經很好。']
      ];
      for(const [cls,text] of lines)paper.append(node('p','dp-diary-line '+cls,text));
      const blue=node('div','dp-hidden-number dp-number-blue'),red=node('div','dp-hidden-number dp-number-red');
      blue.append(node('span','','第一位'),node('strong','',s.blueFilterUsed?'2':'· ·'));
      red.append(node('span','','第二位'),node('strong','',s.redFilterUsed?'7':'· ·'));paper.append(blue,red);
      const target=button('',()=>{},'dp-page-target');target.append(node('span','dp-placement-label',s.maskCardPlaced?'透光卡放到日記頁':'心理支持卡放到日記頁'));target.setAttribute('aria-label',s.maskCardPlaced?'支持卡上方透光卡放置區':'日記頁的心理支持卡定位區');book.append(target);
      const mask=picture('depression_support_mask_card','dp-mask');mask.hidden=!s.maskCardPlaced;paper.append(mask);
      const tint=node('div','dp-tint');tint.hidden=!s.activeFilter;paper.append(tint);
      paper.classList.toggle('dp-mask-placed',s.maskCardPlaced);
      if(s.activeFilter)paper.classList.add('dp-filter-'+s.activeFilter);
      blue.classList.toggle('dp-digit-known',s.digit2Revealed);red.classList.toggle('dp-digit-known',s.digit7Revealed);
      // Tool drops are routed to the same large page target; pointer listeners retain their own item identity.
      tool(tray,'depression_support_mask_card',target,()=>install('depression_support_mask_card',{maskCardPlaced:true},target),s.maskCardPlaced);
      const filter=async(color)=>{
        if(!s.maskCardPlaced){say('先把心理支持卡放到日記頁，讓窗口定位。');return;}
        const id=color==='red'?'depression_red_photo_filter':'depression_blue_note_filter';
        const patch=color==='red'?{redFilterUsed:true,digit7Revealed:true,activeFilter:'red'}:{blueFilterUsed:true,digit2Revealed:true,activeFilter:'blue'};
        await install(id,patch,target);
      };
      tool(tray,'depression_red_photo_filter',target,()=>filter('red'),s.redFilterUsed);
      tool(tray,'depression_blue_note_filter',target,()=>filter('blue'),s.blueFilterUsed);
      const controls=node('div','dp-filter-controls');
      for(const [color,label,used] of [['blue','查看藍卡',s.blueFilterUsed],['red','查看紅卡',s.redFilterUsed]]){
        const b=button(label,()=>{save({activeFilter:color});render();});b.disabled=!used;controls.append(b);
      }
      const digits=node('div','dp-digit-record');digits.setAttribute('aria-live','polite');
      digits.append(node('span','dp-record-blue','第一位 · 藍卡 '+(s.digit2Revealed?'2':'？')),node('span','dp-record-red','第二位 · 紅卡 '+(s.digit7Revealed?'7':'？')));p.append(controls,digits);
      if(s.depressionPart2Completed){result(p);return;}
      if(ready(s)&&ids.every(c.hasItem)){save({depressionPart2Completed:true});result(p);return;}
      say(!s.maskCardPlaced?'先拖入心理支持卡，讓四個窗口對準日記。':s.activeFilter==='red'?'紅卡讓紅字更突出：第二位是 7。再看看藍卡。':s.activeFilter==='blue'?'藍卡讓藍字更突出：第一位是 2。再看看紅卡。':'支持卡已定位，將紅卡、藍卡分別放到頁面上。');
    }
    function result(p){
      if(!c.reveal()){say('前面的區域之後再探索吧!先完成這房間的內容哦!');p.append(node('p','dp-note','兩張透光卡的發現已保存，完成房內其餘活動後再來查看。'));return;}
      if(!s.depressionPasswordRevealed)save({depressionPasswordRevealed:true});
      const result=node('div','dp-result');result.append(node('span','','憂鬱房密碼'),node('strong','','27'));p.append(result,button('記住密碼並返回房間',()=>{cancel();c.close();c.sync();}));
      say('第一位 2、第二位 7。記住 27，回房間親自輸入密碼。');
    }
    return {get active(){return active;},decorate,openObject,cancel};
  }

  // A day counts only after leaving its summary. No score, mood or response type is inspected.
  function reviewedThrough(game){
    if(!game||!Array.isArray(game.candles))return 0;
    const n=game.candles.length;
    if(n<0||n>15)return 0;
    if(n===15&&game.stage==='final')return 5;
    if(game.stage==='event')return Math.floor(n/3);
    if(['feedback','day-summary'].includes(game.stage))return Math.max(0,Math.floor((n-1)/3));
    return 0;
  }
  function eligibleRewards(roomState,shared={}){
    const completed=new Set([...(roomState?.completedItems||[]),...(shared.completedActivities||[])]);
    const days=completed.has('tablet')?5:reviewedThrough(roomState?.game),rewards=[];
    if(days>=1)rewards.push('depression_red_photo_filter');
    if(days>=3)rewards.push('depression_blue_note_filter');
    if(days>=5)rewards.push('depression_diary_key');
    if(roomState?.album?.completed||completed.has('album'))rewards.push('depression_diary');
    if(roomState?.medicine?.completed||completed.has('medicine'))rewards.push('depression_support_mask_card');
    return rewards;
  }
  function syncRewards(roomState){
    const system=root.AchievementSystem;
    const rewards=eligibleRewards(roomState,system.getRoomProgress('depression'));
    // Enqueue immediately so the shared pagehide handler can save accepted rewards even mid-animation.
    return Promise.all(rewards.filter(id=>!system.hasItem(id)).map(id=>system.obtainItem(id)));
  }
  root.DepressionPuzzle={create,syncRewards,logic:Object.freeze({ids,defaults,stateFrom,ready,angleDelta,hit,reviewedThrough,eligibleRewards})};
})(window);

