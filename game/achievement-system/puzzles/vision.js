(function(root){'use strict';
 const base=new URL('.',document.currentScript.src), asset=name=>new URL('assets/'+name+'.png',base).href;
 const ids=['vision_brass_key','vision_reading_box','vision_glasses','vision_focus_slider','vision_fixation_card'];
 const defaults={visionPuzzleVersion:2,part1Completed:false,keyInserted:false,glassesUsed:false,alignmentCompleted:false,sliderInstalled:false,focusCompleted:false,part2Completed:false};
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const focusBlur=value=>Math.abs(Number(value)-62)*.18;
 const stateFrom=p=>p.visionPuzzleVersion===2?{...defaults,...p}:{...defaults};
 const ready=s=>s.part1Completed&&s.glassesUsed&&s.alignmentCompleted&&s.sliderInstalled&&s.focusCompleted;
 const inTarget=(x,y,r,pad=35)=>x>=r.left-pad&&x<=r.right+pad&&y>=r.top-pad&&y<=r.bottom+pad;
 const drops=new Set();
 async function revealDrop(id,anchor,kind,after=()=>{}){
   if(root.AchievementSystem.hasItem(id)||drops.has(id)){after();return;}
   drops.add(id);
   // Queue an already-earned reward before the shared pagehide flush if navigation interrupts the reveal.
   const onLeave=()=>root.AchievementSystem.obtainItem(id);
   root.addEventListener('pagehide',onLeave,{capture:true,once:true});
   const doc=root.document,card=doc.createElement('img'),r=anchor?.getBoundingClientRect();
   card.src=asset(id);card.alt=id==='vision_fixation_card'?'固視定位卡':'對焦滑片';
   card.style.cssText='position:fixed;width:100px;height:80px;object-fit:contain;pointer-events:none;z-index:2147482999;image-rendering:pixelated';
   card.style.left=clamp((r?.left||0)+(r?.width||200)/2-50,8,Math.max(8,root.innerWidth-108))+'px';
   card.style.top=clamp((r?.top||0)+(r?.height||160)/2-40,8,Math.max(8,root.innerHeight-88))+'px';
   let folder=null;
   if(kind==='folder'){folder=doc.createElement('img');folder.src=asset('folder');folder.alt='資料夾';folder.style.cssText=card.style.cssText;doc.body.append(folder);}
   doc.body.append(card);
   try{
     const reduced=root.matchMedia('(prefers-reduced-motion: reduce)').matches;
     const a=kind==='rug'&&anchor?.animate?anchor.animate([{transform:'rotate(0)'},{transform:'rotate(-4deg) translateY(-10px)'},{transform:'rotate(0)'}],{duration:reduced?1:650}):null;
     const b=card.animate?.([{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'translateY(-25px)'}],{duration:reduced?1:700,fill:'forwards'});
     await Promise.all([a?.finished.catch(()=>{}),b?.finished.catch(()=>{})]);
     after();card.remove();folder?.remove();
     await root.AchievementSystem.obtainItem(id);
   }finally{root.removeEventListener('pagehide',onLeave,true);card.remove();folder?.remove();drops.delete(id);}
 }
 function create(c){
   const {ui,node,host}=c;let active=false,epoch=0,animations=new Set(),selected=null,ghost=null,cleanupDrag=null;
   let s=stateFrom(c.getProgress());
   const image=(name,cls='')=>{const x=node('img',cls);x.src=asset(name);x.alt='';x.draggable=false;return x;};
   const btn=(label,fn,cls='vp-button')=>{const x=node('button',cls,label);x.type='button';x.onclick=fn;return x;};
   const say=text=>{const el=ui.content.querySelector('.vp-status');if(el)el.textContent=text;};
   const save=patch=>{s={...s,...patch,visionPuzzleVersion:2};c.update({...s,finalChallengeCompleted:!!s.part2Completed,objectOpened:!!s.part2Completed});};
   function cancel(){epoch++;active=false;selected=null;cleanupDrag?.();ghost?.remove();for(const a of animations)a.cancel();animations.clear();ui.panel.classList.remove('vp-fullscreen');}
   async function motion(el,frames,duration){if(!el?.animate)return;const a=el.animate(frames,{duration:host.matchMedia('(prefers-reduced-motion: reduce)').matches?1:duration,fill:'forwards',easing:'ease-in-out'});animations.add(a);try{await a.finished;}catch(_){}finally{animations.delete(a);a.cancel();}}
   function decorate(card,item){
     card.dataset.special=item.id;
     card.append(node('span','as-object-state',stateFrom(c.getProgress()).part2Completed?'已解鎖':'光學閱讀盒'),btn('查看物件',()=>openObject(item.id),'as-inspect'));
     card.addEventListener('click',e=>{if(!e.target.closest('button'))openObject(item.id);});
   }
   function openObject(id){
     if(id!=='vision_reading_box'||!c.hasItem(id)||active||!ui.panel.open)return false;
     active=true;s=stateFrom(c.getProgress());
     if(!ids.every(c.hasItem)&&s.part2Completed)s={...defaults};
     if(!ui.shadow.querySelector('[data-vision-css]')){const link=node('link');link.rel='stylesheet';link.href=new URL('vision.css',base).href;link.dataset.visionCss='';ui.shadow.append(link);}
     ui.panel.classList.add('vp-fullscreen');c.sync();render();return true;
   }
   function page(title){
     cleanupDrag?.();ghost?.remove();selected=null;
     ui.title.textContent=title;ui.content.replaceChildren();
     const p=node('section','vp-scene');
     const nav=node('nav','vp-nav');nav.append(btn('返回收藏',()=>{cancel();c.render();c.sync();}),btn('返回房間',()=>{cancel();c.close();c.sync();}),btn('提示',()=>say(!s.part1Completed?'將鑰匙拖到鎖孔，再轉向右側。也可點選鑰匙後點鎖孔，使用方向鍵轉動。':'眼鏡放在近處細字；定位卡蓋在圓窗，移動熱氣球到準星；滑片裝入右側軌道，再調整清晰度。')));
     const status=node('p','vp-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
     p.append(nav,status);ui.content.append(p);return p;
   }
   // Pointer capture keeps mouse/touch drags reliable inside the Shadow DOM.
   function dragTool(tool,id,target,success){
     tool.style.touchAction='none';
     tool.onclick=()=>{selected=id;ui.content.querySelectorAll('.vp-tool').forEach(x=>x.classList.remove('vp-selected'));tool.classList.add('vp-selected');say('已選取'+tool.textContent+'，點選放置區即可。');};
     target.addEventListener('click',()=>{if(selected===id){selected=null;success();}});
     tool.addEventListener('pointerdown',e=>{
       if(e.button!==0||tool.disabled)return;e.preventDefault();
       cleanupDrag?.();const pid=e.pointerId;tool.setPointerCapture(pid);
       ghost=image(id,'vp-drag-ghost');ui.panel.append(ghost);
       const move=ev=>{ghost.style.left=ev.clientX+'px';ghost.style.top=ev.clientY+'px';target.classList.toggle('vp-near',inTarget(ev.clientX,ev.clientY,target.getBoundingClientRect()));};
       const cleanup=()=>{tool.removeEventListener('pointermove',move);tool.removeEventListener('pointerup',up);tool.removeEventListener('pointercancel',abort);tool.removeEventListener('lostpointercapture',abort);target.classList.remove('vp-near');ghost?.remove();ghost=null;cleanupDrag=null;};
       const abort=()=>cleanup();
       const up=ev=>{const hit=inTarget(ev.clientX,ev.clientY,target.getBoundingClientRect());cleanup();if(hit)success();else{selected=id;tool.classList.add('vp-selected');say('可再拖一次，或點選放置區。');}};
       cleanupDrag=cleanup;tool.addEventListener('pointermove',move);tool.addEventListener('pointerup',up);tool.addEventListener('pointercancel',abort);tool.addEventListener('lostpointercapture',abort);move(e);
     });
   }
   function tool(id,target,success,tray,used=false){
     const owned=c.hasItem(id),name=c.data.items.find(i=>i.id===id).name;
     const b=btn(name+(used?' · 已放置':owned?' · 拖曳或點選':' · 尚未取得'),()=>{},'vp-tool');b.prepend(image(id));b.disabled=!owned||used;tray.append(b);
     if(owned&&!used)dragTool(b,id,target,success);return b;
   }
   function range(label,min,max,value,oninput,onchange){const wrap=node('label','vp-control',label),input=node('input');input.type='range';input.min=min;input.max=max;input.value=value;input.setAttribute('aria-label',label);input.oninput=()=>oninput(Number(input.value));input.onchange=()=>onchange?.(Number(input.value));wrap.append(input);return {wrap,input};}
   function render(){if(!active)return;if(s.part2Completed)return result();if(s.part1Completed)return optics();return box();}
   function box(){
     const p=page('細字閱讀盒 · 開啟外蓋');
     const stage=node('div','vp-box');stage.append(image('vision_reading_box','vp-box-image'));
     const hole=btn('',()=>{},'vp-lock');hole.setAttribute('aria-label','閱讀盒上的鑰匙孔');stage.append(hole);
     const layout=node('div','vp-workbench vp-box-workbench'),side=node('aside','vp-side vp-right');side.setAttribute('aria-label','鑰匙轉動控制');layout.append(stage,side);p.append(layout);
     const tray=node('div','vp-tray');p.append(tray);
     const insert=async()=>{if(s.keyInserted||!c.hasItem('vision_brass_key'))return;save({keyInserted:true});const run=epoch;const k=image('vision_brass_key','vp-insert-key');stage.append(k);await motion(k,[{opacity:0},{opacity:1}],450);if(active&&run===epoch)render();};
     tool('vision_brass_key',hole,insert,tray,s.keyInserted);
     if(!s.keyInserted){say(c.hasItem('vision_brass_key')?'把黃銅小鑰匙拖曳到鎖孔。':'尚缺黃銅小鑰匙。可以返回房間繼續探索。');return;}
     const key=image('vision_brass_key','vp-insert-key');stage.append(key);
     let opening=false;
     const turn=async value=>{if(value<65||opening)return;opening=true;control.input.disabled=true;const run=epoch;say('喀！卡扣鬆開，外蓋正在打開。');
       const cover=stage.querySelector('.vp-box-image');cover.src=asset('reading-box-open');key.hidden=true;hole.hidden=true;
       await motion(cover,[{opacity:.4},{opacity:1}],350);
       if(!active||run!==epoch)return;save({part1Completed:true});render();
     };
     const control=range('轉動鑰匙 →',0,90,0,turn);side.append(control.wrap);say('鑰匙已插入鎖孔。使用右側控制完成開鎖，也可用方向鍵操作。');
   }
   function optics(){
     const p=page('閱讀盒 · 光學觀景裝置');
     const layout=node('div','vp-workbench'),left=node('aside','vp-side vp-left'),right=node('aside','vp-side vp-right');
     left.setAttribute('aria-label','熱氣球方向控制');right.setAttribute('aria-label','對焦控制');
     const machine=node('div','vp-machine');machine.append(image('device-frame','vp-frame'));
     layout.append(left,machine,right);p.append(layout);
     const scope=btn('',()=>{},'vp-scope');scope.setAttribute('aria-label','定位卡放置區：圓形觀景窗');
     const landscape=image('balloon-landscape','vp-landscape'),balloon=image('balloon','vp-balloon');scope.append(landscape,balloon);
     if(s.alignmentCompleted)balloon.style.transform='translate(-50%,-50%)';
     else balloon.style.transform='translate(calc(-50% + 45px),calc(-50% - 35px))';
     const cross=node('span','vp-cross');cross.hidden=!s.cardPlaced&&!s.alignmentCompleted;scope.append(cross);machine.append(scope);
     const fine=btn('',()=>{},'vp-fine');fine.setAttribute('aria-label','近距離細字觀察區');fine.append(node('span','vp-smallprint','定位 → 安裝 → 對焦'));machine.append(fine);
     if(s.glassesUsed){fine.classList.add('vp-readable');fine.append(image('vision_glasses','vp-lens'));}
     const rail=btn(s.sliderInstalled?'滑片已安裝':'滑片軌道',()=>{},'vp-rail');if(s.sliderInstalled)rail.prepend(image('vision_focus_slider'));machine.append(rail);
     const rings=node('div','vp-rings');[s.glassesUsed,s.alignmentCompleted,s.focusCompleted].forEach((ok,i)=>{const r=node('span','vp-ring'+(ok?' vp-lit':''),String(i+1));r.setAttribute('aria-label',['細字閱讀','固視定位','對焦'][i]+(ok?'完成':'未完成'));rings.append(r);});machine.append(rings);
     const tray=node('div','vp-tray');p.append(tray);
     let placing=false;
     async function place(flag,target,frames){if(placing||s[flag])return;placing=true;const run=epoch;await motion(target,frames,450);if(!active||run!==epoch)return;save({[flag]:true});render();}
     tool('vision_glasses',fine,()=>place('glassesUsed',fine,[{filter:'blur(3px)'},{filter:'blur(0)'}]),tray,s.glassesUsed);
     tool('vision_fixation_card',scope,()=>{cross.hidden=false;return place('cardPlaced',cross,[{opacity:0,transform:'translateY(-20px)'},{opacity:1,transform:'translateY(0)'}]);},tray,s.cardPlaced||s.alignmentCompleted);
     tool('vision_focus_slider',rail,()=>place('sliderInstalled',rail,[{transform:'translateX(25px)'},{transform:'translateX(0)'}]),tray,s.sliderInstalled);
     let x=s.alignmentCompleted?0:45,y=s.alignmentCompleted?0:-35,aligning=false;
     const paint=()=>{balloon.style.transform=`translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`;};
     async function align(){if(s.alignmentCompleted||aligning||Math.hypot(x,y)>24)return;aligning=true;x=y=0;paint();const run=epoch;say('喀！定位環已固定。');await motion(rings.children[1],[{transform:'rotate(-90deg)'},{transform:'rotate(0deg)',boxShadow:'0 0 25px #ffd278'}],400);if(!active||run!==epoch)return;save({alignmentCompleted:true});render();}
     if((s.cardPlaced||s.alignmentCompleted)&&!s.alignmentCompleted){
       scope.style.touchAction='none';
       scope.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();const pid=e.pointerId,start={x:e.clientX,y:e.clientY,bx:x,by:y};scope.setPointerCapture(pid);
         const move=ev=>{x=clamp(start.bx+ev.clientX-start.x,-scope.clientWidth*.35,scope.clientWidth*.35);y=clamp(start.by+ev.clientY-start.y,-scope.clientHeight*.35,scope.clientHeight*.35);paint();};
         const end=()=>{clean();align();};const clean=()=>{scope.removeEventListener('pointermove',move);scope.removeEventListener('pointerup',end);scope.removeEventListener('pointercancel',clean);scope.removeEventListener('lostpointercapture',clean);cleanupDrag=null;};cleanupDrag=clean;scope.addEventListener('pointermove',move);scope.addEventListener('pointerup',end);scope.addEventListener('pointercancel',clean);scope.addEventListener('lostpointercapture',clean);
       });
       scope.addEventListener('keydown',e=>{const d={ArrowLeft:[-8,0],ArrowRight:[8,0],ArrowUp:[0,-8],ArrowDown:[0,8]}[e.key];if(d){e.preventDefault();x=clamp(x+d[0],-90,90);y=clamp(y+d[1],-90,90);paint();align();}});
       const controls=node('div','vp-alignment');controls.append(node('span','','把熱氣球移到準星中央'));[['左',-8,0],['右',8,0],['上',0,-8],['下',0,8]].forEach(([label,dx,dy])=>controls.append(btn(label,()=>{x=clamp(x+dx,-90,90);y=clamp(y+dy,-90,90);paint();align();})));left.append(controls);
     }
     const value=s.focusCompleted?62:Number(s.focusValue??12);balloon.style.filter='blur('+focusBlur(value)+'px)';
     if(s.sliderInstalled){let finishing=false;
       const focus=range('拖動對焦控制桿，找出最清晰的位置',0,100,value,v=>{balloon.style.filter='blur('+focusBlur(v)+'px)';},async v=>{if(finishing)return;if(Math.abs(v-62)<=9){finishing=true;focus.input.value=62;balloon.style.filter='blur(0)';const run=epoch;await motion(rail,[{boxShadow:'0 0 0 #ffe091'},{boxShadow:'0 0 28px #ffe091'}],300);if(!active||run!==epoch)return;save({focusCompleted:true,focusValue:62});render();}else save({focusValue:v});});focus.input.disabled=s.focusCompleted;right.append(focus.wrap);
     }
     p.append(node('p','vp-caption','遊戲機關示意：熱氣球移動用於光學校準解謎，不代表真實驗光操作。'));
     if(ready(s)){finish(machine,rings);return;}
     say(!ids.every(c.hasItem)?'可先查看裝置，返回房間收集剩餘物品；已完成操作會保留。':!s.glassesUsed?'把眼鏡放在近處細字區，閱讀操作提示。':!s.alignmentCompleted?'將定位卡放上圓窗，再拖動熱氣球對齊準星。':!s.sliderInstalled?'將金屬滑片拖入右側軌道。':'調整滑桿，讓熱氣球變清楚，再放開控制桿。');
   }
   async function finish(machine,rings){
     if(!ids.every(c.hasItem)||!ready(s))return;const run=epoch;
     say('三個固定環已解鎖。');
     for(const ring of rings.children){await motion(ring,[{filter:'brightness(1)'},{filter:'brightness(2.5)'},{filter:'brightness(1)'}],250);if(!active||run!==epoch)return;}
     const bolt=node('div','vp-bolt');machine.append(bolt);await motion(bolt,[{transform:'translateX(0)'},{transform:'translateX(130%)',opacity:0}],400);
     await motion(machine,[{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'translateX(0)'}],220);
     const lid=image('reading-box-open','vp-final-lid');machine.append(lid);await motion(lid,[{transform:'perspective(900px) rotateX(-65deg)',opacity:0},{transform:'rotateX(0)',opacity:1}],650);
     if(!active||run!==epoch)return;save({part2Completed:true});result();
   }
   function result(){
     const p=page('閱讀盒 · 熱氣球密碼');
     if(!c.reveal()){say('前面的區域之後再探索吧!先完成這房間的內容哦!');p.append(node('p','','光學解鎖已完成並保存。完成房間其餘活動後，再回來查看熱氣球上的密碼。'));return;}
     const view=node('div','vp-result-view');view.append(image('balloon-landscape','vp-result-landscape'));
     const balloon=node('div','vp-result-balloon');balloon.append(image('balloon'),node('strong','vp-balloon-password','36'));
     balloon.setAttribute('role','img');balloon.setAttribute('aria-label','熱氣球上的視力房密碼 36');view.append(balloon);p.append(view);
     motion(balloon,[{opacity:0},{opacity:1}],400);
     p.append(btn('記住密碼並返回房間',()=>{cancel();c.close();c.sync();}));say('請回到房間親自輸入密碼。');
   }
   return {get active(){return active;},decorate,openObject,cancel};
 }
 root.VisionPuzzle={create,revealDrop,logic:Object.freeze({stateFrom,ready,focusBlur,inTarget,ids})};
})(window);
