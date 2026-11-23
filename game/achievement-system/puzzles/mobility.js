(function(root){'use strict';
 const base=new URL('.',document.currentScript.src),asset=id=>new URL('assets/mobility/'+id+'.png',base).href;
 const ids=['mobility_screwdriver','mobility_safety_box','mobility_anti_slip_pad','mobility_shoe_grip','mobility_level_gauge'];
 const defaults={mobilityPuzzleVersion:2,driverAttached:false,screwTurn:0,mobilityPart1Completed:false,padInstalled:false,gripInstalled:false,levelInstalled:false,platformAngle:8,platformBalanced:false,mobilityPart2Completed:false,mobilityPasswordRevealed:false};
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const stateFrom=p=>p.mobilityPuzzleVersion===2?{...defaults,...p,platformAngle:clamp(Number(p.platformAngle??8)||0,-12,12),screwTurn:clamp(Number(p.screwTurn)||0,0,240)}:{...defaults};
 const installed=s=>s.padInstalled&&s.gripInstalled&&s.levelInstalled;
 const ready=s=>s.mobilityPart1Completed&&installed(s)&&s.platformBalanced;
 const angleDelta=(a,b)=>(a-b+540)%360-180;
 const positions=angle=>({angle:clamp(angle,-12,12),block:50+clamp(angle,-12,12)*2.3,bubble:50-clamp(angle,-12,12)*2.6});
 const hit=(x,y,r)=>x>=r.left-32&&x<=r.right+32&&y>=r.top-32&&y<=r.bottom+32;
 const pending=new Map();
 function drop(id,anchor,kind){
   if(root.AchievementSystem.hasItem(id))return Promise.resolve();if(pending.has(id))return pending.get(id);
   const leave=()=>root.AchievementSystem.obtainItem(id);root.addEventListener('pagehide',leave,{capture:true,once:true});
   const task=(async()=>{const doc=root.document,el=doc.createElement('div'),r=anchor?.getBoundingClientRect();el.style.cssText='position:fixed;z-index:2147482998;width:180px;height:130px;pointer-events:none;';el.style.left=clamp((r?.left||root.innerWidth/2)+(r?.width||0)/2-90,8,Math.max(8,root.innerWidth-188))+'px';el.style.top=clamp((r?.top||root.innerHeight/2),8,Math.max(8,root.innerHeight-140))+'px';
     const shadow=el.attachShadow({mode:'open'}),img=doc.createElement('img');img.src=asset(id);img.alt=root.AchievementSystem.getItemDefinition(id).name;img.style.cssText='width:100%;height:100%;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 8px 12px #0007)';
     if(kind!=='tool'){const context=doc.createElement('img');context.src=asset(kind==='shoe'?'safe-shoe':'bath-mat');context.alt=kind==='shoe'?'安全鞋':'防滑墊';context.style.cssText='position:absolute;right:120px;top:30px;width:100px;height:90px;object-fit:contain;image-rendering:pixelated';shadow.append(context);}
     shadow.append(img);doc.body.append(el);try{const animation=img.animate?.([{opacity:0,transform:'translateY(28px) scale(.65)'},{opacity:1,transform:'translateY(-16px) scale(1)'}],{duration:root.matchMedia('(prefers-reduced-motion: reduce)').matches?1:650,fill:'forwards'});await animation?.finished.catch(()=>{});el.remove();await root.AchievementSystem.obtainItem(id);}finally{el.remove();pending.delete(id);root.removeEventListener('pagehide',leave,true);}
   })();pending.set(id,task);return task;
 }
 function create(c){
   const {node,ui,host}=c;let active=false,epoch=0,busy=false,selected=null,cleanupPointer=null,ghost=null,muted=false;
   let s=stateFrom(c.getProgress()),animations=new Set();const sound=new root.Audio(new URL('assets/mobility/mechanical-click.wav',base).href);sound.volume=.18;
   const picture=(id,cls='')=>{const e=node('img',cls);e.src=asset(id);e.alt='';e.draggable=false;return e;};
   const button=(label,fn,cls='mp-button')=>{const b=node('button',cls,label);b.type='button';b.onclick=fn;return b;};
   const say=text=>{const e=ui.content.querySelector('.mp-status');if(e)e.textContent=text;};
   const save=patch=>{s={...s,...patch,mobilityPuzzleVersion:2};c.update({...s,finalChallengeCompleted:!!s.mobilityPart2Completed,objectOpened:!!s.mobilityPart2Completed});};
   function click(){if(muted)return;sound.currentTime=0;try{sound.play()?.catch(()=>{});}catch(_){}}
   function cancel(){epoch++;cleanupPointer?.();active=false;busy=false;selected=null;ghost?.remove();for(const a of animations)a.cancel();animations.clear();sound.pause();sound.currentTime=0;ui.panel.classList.remove('mp-fullscreen');}
   async function move(el,frames,duration=450){if(!el?.animate)return;const a=el.animate(frames,{duration:host.matchMedia('(prefers-reduced-motion: reduce)').matches?1:duration,easing:'ease-in-out',fill:'forwards'});animations.add(a);try{await a.finished;}catch(_){}finally{animations.delete(a);a.cancel();}}
   function decorate(card,item){card.dataset.special=item.id;card.append(node('span','as-object-state',stateFrom(c.getProgress()).mobilityPart2Completed?'平衡機關已解鎖':'防跌平衡機關盒'),button('查看安全盒',()=>openObject(item.id),'as-inspect'));card.addEventListener('click',e=>{if(!e.target.closest('button'))openObject(item.id);});}
   function openObject(id){if(id!=='mobility_safety_box'||!c.hasItem(id)||active||!ui.panel.open)return false;active=true;s=stateFrom(c.getProgress());if(!ui.shadow.querySelector('[data-mobility-css]')){const link=node('link');link.rel='stylesheet';link.href=new URL('mobility.css',base).href;link.dataset.mobilityCss='';ui.shadow.append(link);}ui.panel.classList.add('mp-fullscreen');c.sync();render();return true;}
   function page(title){cleanupPointer?.();ghost?.remove();selected=null;ui.title.textContent=title;ui.content.replaceChildren();const p=node('section','mp-scene'),nav=node('nav','mp-nav');const mute=button(muted?'開啟音效':'靜音',()=>{muted=!muted;sound.muted=muted;mute.textContent=muted?'開啟音效':'靜音';});nav.append(button('返回收藏',()=>{cancel();c.render();c.sync();}),button('返回房間',()=>{cancel();c.close();c.sync();}),mute,button('提示',()=>say(!s.mobilityPart1Completed?'把螺絲起子放到中央螺絲，沿圓環逆時針拖動。也可使用右側分段轉動按鈕。':'橡膠墊放底座、鞋底片放移動塊下方、水平儀放上方插槽。收齊安裝後，拖動右側把手，使氣泡與金屬塊都進入中央。')));const status=node('p','mp-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');p.append(nav,status);ui.content.append(p);return p;}
   function dragTool(tool,id,target,action){tool.onclick=()=>{selected=id;tool.classList.add('mp-selected');say('已選取'+tool.textContent+'，請點選放置區。');};target.addEventListener('click',()=>{if(selected===id&&!busy){selected=null;action();}});tool.addEventListener('pointerdown',e=>{if(e.button!==0||busy||tool.disabled)return;e.preventDefault();cleanupPointer?.();tool.setPointerCapture(e.pointerId);ghost=picture(id,'mp-ghost');ui.panel.append(ghost);
     const motion=ev=>{ghost.style.left=ev.clientX+'px';ghost.style.top=ev.clientY+'px';target.classList.toggle('mp-near',hit(ev.clientX,ev.clientY,target.getBoundingClientRect()));};
     const clean=()=>{tool.removeEventListener('pointermove',motion);tool.removeEventListener('pointerup',up);tool.removeEventListener('pointercancel',clean);tool.removeEventListener('lostpointercapture',clean);ghost?.remove();ghost=null;target.classList.remove('mp-near');cleanupPointer=null;};
     const up=ev=>{const valid=hit(ev.clientX,ev.clientY,target.getBoundingClientRect());clean();if(valid)action();else{selected=id;say('未放入，請再拖一次，或點選放置區。');}};cleanupPointer=clean;tool.addEventListener('pointermove',motion);tool.addEventListener('pointerup',up);tool.addEventListener('pointercancel',clean);tool.addEventListener('lostpointercapture',clean);motion(e);
   });}
   function tool(tray,id,target,action,done){const own=c.hasItem(id),name=c.data.items.find(i=>i.id===id).name;const b=button(name+(done?' · 已安裝':own?' · 拖曳或點選':' · 尚未取得'),()=>{},'mp-tool');b.prepend(picture(id));b.disabled=!own||done;tray.append(b);if(own&&!done)dragTool(b,id,target,action);}
   async function install(id,patch,target){if(busy||!c.hasItem(id))return;busy=true;const run=epoch,part=picture(id,'mp-install');target.append(part);click();await move(part,[{transform:'translateY(-25%) scale(.7)',opacity:.3},{transform:'translateY(0) scale(1)',opacity:1}]);if(!active||run!==epoch)return;save(patch);busy=false;render();}
   function render(){if(!active)return;if(s.mobilityPart1Completed)platform();else box();}
   function box(){const p=page('安全盒 · 拆卸固定螺絲'),layout=node('div','mp-layout'),stage=node('div','mp-box'),side=node('aside','mp-controls'),tray=node('div','mp-tray');const cover=picture('mobility_safety_box','mp-box-art');stage.append(cover);layout.append(stage,side);p.append(layout,tray);
     const screw=button('',()=>{},'mp-main-screw');screw.setAttribute('aria-label','安全盒正中央的固定螺絲');stage.append(screw);
     tool(tray,'mobility_screwdriver',screw,()=>install('mobility_screwdriver',{driverAttached:true},screw),s.driverAttached);
     if(!s.driverAttached){say(c.hasItem('mobility_screwdriver')?'把螺絲起子拖到安全盒中央螺絲。':'還需要螺絲起子，可以先返回房間探索。');return;}
     const pivot=node('div','mp-driver-pivot');pivot.append(picture('mobility_screwdriver','mp-driver'));stage.append(pivot);
     const ring=button('↶',()=>{},'mp-rotation-ring');ring.setAttribute('aria-label','沿圓環逆時針拖曳卸螺絲；方向左鍵也可分段轉動');stage.append(ring);
     const progress=node('p','mp-turn-progress');side.append(node('h3','','卸下固定螺絲'),progress);
     let turn=s.screwTurn;
     const paint=()=>{pivot.style.transform='rotate('+(-turn)+'deg)';progress.textContent='卸螺絲 '+Math.round(turn/240*100)+'%';ring.style.setProperty('--turn',turn+'deg');};
     async function finish(){if(busy||turn<240)return;busy=true;save({screwTurn:240});const run=epoch;click();await move(stage,[{transform:'translateX(0)'},{transform:'translateX(-2px)'},{transform:'translateX(2px)'},{transform:'translateX(0)'}],200);if(!active||run!==epoch)return;pivot.hidden=true;ring.hidden=true;screw.hidden=true;cover.src=asset('safety-box-open');await move(cover,[{opacity:.35},{opacity:1}],500);if(!active||run!==epoch)return;save({mobilityPart1Completed:true});busy=false;render();}
     const rotate=amount=>{if(busy)return;turn=clamp(turn+amount,0,240);paint();if(turn>=240)finish();};
     side.append(button('逆時針轉一小段',()=>{rotate(40);save({screwTurn:turn});}),node('p','mp-note','可重複分段轉動，不必一次轉完。'));
     ring.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();rotate(e.key==='ArrowLeft'?30:-30);save({screwTurn:turn});}});
     ring.addEventListener('pointerdown',e=>{if(e.button!==0||busy)return;e.preventDefault();ring.setPointerCapture(e.pointerId);const r=ring.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let previous=Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI;
       const motion=ev=>{if(Math.hypot(ev.clientX-cx,ev.clientY-cy)<12)return;const next=Math.atan2(ev.clientY-cy,ev.clientX-cx)*180/Math.PI;rotate(-angleDelta(next,previous));previous=next;};
       const end=()=>{ring.removeEventListener('pointermove',motion);ring.removeEventListener('pointerup',end);ring.removeEventListener('pointercancel',end);ring.removeEventListener('lostpointercapture',end);cleanupPointer=null;save({screwTurn:turn});};cleanupPointer=end;ring.addEventListener('pointermove',motion);ring.addEventListener('pointerup',end);ring.addEventListener('pointercancel',end);ring.addEventListener('lostpointercapture',end);
     });paint();say('沿金色圓弧逆時針拖曳，讓螺絲逐漸鬆開。');if(turn>=240)finish();
   }
   function platform(){const p=page('安全盒 · 防跌平衡平台'),layout=node('div','mp-layout'),stage=node('div','mp-machine'),side=node('aside','mp-controls'),tray=node('div','mp-tray');stage.append(picture('safety-box-open','mp-box-art'));layout.append(stage,side);p.append(layout,tray);
     const inner=node('div','mp-inner');if(!s.padInstalled)inner.classList.add('mp-unstable');stage.append(inner);
     const board=node('div','mp-board');board.append(picture('platform','mp-plank'));const block=node('div','mp-weight');const blockImage=picture('block','mp-block-art');if(!s.gripInstalled)blockImage.classList.add('mp-slippery');block.append(blockImage);board.append(block);inner.append(board);
     const pad=button(s.padInstalled?'底座已止滑':'底座止滑區',()=>{},'mp-pad-slot');if(s.padInstalled)pad.prepend(picture('mobility_anti_slip_pad'));inner.append(pad);
     const grip=button(s.gripInstalled?'鞋底片已卡入':'移動塊抓地接口',()=>{},'mp-grip-slot');if(s.gripInstalled)grip.prepend(picture('mobility_shoe_grip'));block.append(grip);
     const level=button(s.levelInstalled?'':'水平儀插槽',()=>{},'mp-level-slot');level.setAttribute('aria-label','水平儀插槽');let bubble=null;
     if(s.levelInstalled){level.append(picture('mobility_level_gauge'));const target=node('span','mp-bubble-target');bubble=node('span','mp-bubble');level.append(target,bubble);}stage.append(level);
     const bolts=node('div','mp-bolts');[s.padInstalled,s.gripInstalled,s.platformBalanced].forEach((done,i)=>bolts.append(node('span','mp-bolt'+(done?' mp-unlocked':''),String(i+1))));side.append(bolts);
     tool(tray,'mobility_anti_slip_pad',pad,()=>install('mobility_anti_slip_pad',{padInstalled:true},pad),s.padInstalled);
     tool(tray,'mobility_shoe_grip',grip,()=>install('mobility_shoe_grip',{gripInstalled:true},grip),s.gripInstalled);
     tool(tray,'mobility_level_gauge',level,()=>install('mobility_level_gauge',{levelInstalled:true},level),s.levelInstalled);
     let angle=s.platformBalanced?0:s.platformAngle;
     const handleTrack=node('div','mp-handle-track'),handle=button('',()=>{},'mp-handle');handle.append(picture('handle'));handle.setAttribute('role','slider');handle.setAttribute('aria-label','上下拖曳調整平台角度');handle.setAttribute('aria-valuemin','-12');handle.setAttribute('aria-valuemax','12');handle.disabled=!installed(s)||s.platformBalanced;handleTrack.append(handle);side.append(node('h3','','調平把手'),handleTrack);
     const readout=node('p','mp-readout');side.append(readout);
     function paint(){const pos=positions(angle);board.style.transform='rotate('+pos.angle+'deg)';block.style.left=pos.block+'%';if(bubble)bubble.style.left=pos.bubble+'%';handle.style.top=(50-angle/12*38)+'%';handle.setAttribute('aria-valuenow',String(Math.round(angle*10)/10));readout.textContent=s.levelInstalled?'平台角度 '+angle.toFixed(1)+'°':'請先裝上水平儀';}
     async function settle(){if(!installed(s)||busy||s.platformBalanced)return;save({platformAngle:angle});if(Math.abs(angle)>1.3){say('再微調，讓氣泡和移動塊靠近中央。');return;}angle=0;paint();save({platformAngle:0,platformBalanced:true});await finish(bolts,stage);}
     function adjust(v){if(!installed(s)||s.platformBalanced||busy)return;angle=clamp(v,-12,12);paint();}
     handle.addEventListener('pointerdown',e=>{if(e.button!==0||handle.disabled||busy)return;e.preventDefault();handle.setPointerCapture(e.pointerId);const r=handleTrack.getBoundingClientRect();const startAngle=angle,startY=e.clientY;
       const motion=ev=>adjust(startAngle-(ev.clientY-startY)/Math.max(1,r.height*.76)*24);
       const clean=()=>{handle.removeEventListener('pointermove',motion);handle.removeEventListener('pointerup',up);handle.removeEventListener('pointercancel',abort);handle.removeEventListener('lostpointercapture',abort);cleanupPointer=null;save({platformAngle:angle});};const up=()=>{clean();settle();};const abort=()=>clean();cleanupPointer=clean;handle.addEventListener('pointermove',motion);handle.addEventListener('pointerup',up);handle.addEventListener('pointercancel',abort);handle.addEventListener('lostpointercapture',abort);
     });handle.addEventListener('keydown',e=>{if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();adjust(angle+(['ArrowUp','ArrowRight'].includes(e.key)?.5:-.5));settle();});
     const adjustButtons=node('div','mp-adjust-buttons');for(const [label,delta] of [['向左微調',-.5],['向右微調',.5]]){const b=button(label,()=>{adjust(angle+delta);settle();});b.disabled=handle.disabled;adjustButtons.append(b);}side.append(adjustButtons);
     stage.append(node('span','mp-balance-zone'));p.append(node('p','mp-note','這是象徵安全支撐與止滑的機械解謎，不是真實平衡能力測驗。'));paint();
     if(s.mobilityPart2Completed){result(stage,p);return;}if(ready(s)){finish(bolts,stage);return;}
     say(!installed(s)?'將三件物品放入對應位置。已完成的安裝會保留，可以隨時返回房間。':'上下拖動右側把手，讓氣泡與金屬塊一起回到中央。');
   }
   async function finish(bolts,stage){if(busy||!ready(s)||!ids.every(c.hasItem))return;busy=true;const run=epoch;for(const bolt of bolts.children){click();await move(bolt,[{transform:'translateX(0)'},{transform:'translateX(16px)',filter:'brightness(1.8)'}],260);if(!active||run!==epoch)return;bolt.classList.add('mp-unlocked');}await move(stage,[{transform:'translateY(0)'},{transform:'translateY(-2px)'},{transform:'translateY(0)'}],200);if(!active||run!==epoch)return;save({mobilityPart2Completed:true});busy=false;render();}
   function result(stage,p){if(!c.reveal()){say('前面的區域之後再探索吧!先完成這房間的內容哦!');p.append(node('p','','平衡機關已完成，進度已保存。完成房內其餘活動後，再回來查看密碼。'));return;}
     if(!s.mobilityPasswordRevealed)save({mobilityPasswordRevealed:true});const drawer=node('div','mp-drawer');drawer.append(node('span','','行動房密碼'),node('strong','','58'));stage.append(drawer);move(drawer,[{transform:'translateY(-25%) scaleY(.25)',opacity:0},{transform:'translateY(0) scaleY(1)',opacity:1}],550);p.append(button('記住密碼並返回房間',()=>{cancel();c.close();c.sync();}));say('機關已穩定。請記住 58，回房間親自輸入密碼。');
   }
   return {get active(){return active;},decorate,openObject,cancel};
 }
 root.MobilityPuzzle={create,drop,logic:Object.freeze({ids,defaults,stateFrom,installed,ready,positions,angleDelta,hit})};
})(window);
