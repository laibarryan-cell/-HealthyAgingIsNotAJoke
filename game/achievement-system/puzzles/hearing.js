(function(root){'use strict';
 const base=new URL('.',document.currentScript.src),asset=id=>new URL('assets/hearing/'+id+'.png',base).href;
 const ids=['hearing_recorder','hearing_battery','hearing_family_tape','hearing_park_map','hearing_hearing_aid'];
 const defaults={hearingPuzzleVersion:2,batteryInstalled:false,hearingPart1Completed:false,tapeInstalled:false,mapPlaced:false,parkLocation:'home',quietLocationFound:false,aidInstalled:false,hearingAidActivated:false,assisted:false,hearingPart2Completed:false,hearingPasswordRevealed:false};
 const stateFrom=p=>p.hearingPuzzleVersion===2?{...defaults,...p}:{...defaults};
 const ready=s=>s.hearingPart1Completed&&s.batteryInstalled&&s.tapeInstalled&&s.quietLocationFound&&s.hearingAidActivated;
 const places=[{id:'road',name:'馬路旁',x:12,y:44},{id:'playground',name:'遊樂場',x:82,y:25},{id:'plaza',name:'廣場',x:58,y:52},{id:'shade',name:'樹蔭長椅區',x:88,y:74}];
 const nearest=(x,y)=>places.reduce((a,b)=>Math.hypot(a.x-x,a.y-y)<Math.hypot(b.x-x,b.y-y)?a:b);
 const hit=(x,y,r)=>x>=r.left-30&&x<=r.right+30&&y>=r.top-30&&y<=r.bottom+30;
 const drops=new Map();
 function drop(id,anchor,kind){
   if(root.AchievementSystem.hasItem(id))return Promise.resolve();if(drops.has(id))return drops.get(id);
   const onLeave=()=>root.AchievementSystem.obtainItem(id);root.addEventListener('pagehide',onLeave,{once:true,capture:true});
   const task=(async()=>{const doc=root.document,portal=doc.createElement('div'),shadow=portal.attachShadow({mode:'open'}),r=anchor?.getBoundingClientRect();
     portal.style.cssText='position:fixed;z-index:2147482998;pointer-events:none;width:180px;height:145px;';portal.style.left=Math.max(8,Math.min(root.innerWidth-188,(r?.right||root.innerWidth/2)-180))+'px';portal.style.top=Math.max(8,Math.min(root.innerHeight-153,(r?.top||root.innerHeight/2)))+'px';
     const style=doc.createElement('style');style.textContent='.drawer{position:absolute;inset:35px 0 0;background:linear-gradient(#92623c,#473424);border:5px ridge #aa8053;box-shadow:0 10px 20px #0005}.drawer:after{content:"";position:absolute;left:38%;right:38%;bottom:8px;height:7px;background:#b69b5d}.item{position:absolute;inset:0;width:100%;height:110px;object-fit:contain;image-rendering:pixelated}.tag{position:absolute;top:-22px;left:0;font:16px sans-serif;background:#fff0ca;color:#403324;padding:4px 9px;border-radius:5px}';
     const drawer=doc.createElement('div');drawer.className='drawer';const picture=doc.createElement('img');picture.className='item';picture.src=asset(id);picture.alt=root.AchievementSystem.getItemDefinition(id).name;const tag=doc.createElement('span');tag.className='tag';tag.textContent=kind==='family'?'家庭照片旁的抽屜':kind==='medicine'?'醫藥盒展示抽屜':'摺疊公園地圖';shadow.append(style,drawer,picture,tag);if(kind==='family'){const photo=doc.createElement('img');photo.src=asset('family-photo');photo.alt='家庭照片';photo.style.cssText='position:absolute;width:85px;height:60px;object-fit:cover;right:150px;top:0;border:5px ridge #bca272';shadow.append(photo);}doc.body.append(portal);
     try{const duration=root.matchMedia('(prefers-reduced-motion: reduce)').matches?1:650;await Promise.all([drawer.animate?.([{transform:'translateY(-12px)'},{transform:'translateY(12px)'}],{duration,fill:'forwards'}).finished.catch(()=>{}),picture.animate?.([{opacity:0,transform:'translateY(45px) scale(.75)'},{opacity:1,transform:'translateY(-12px) scale(1)'}],{duration,fill:'forwards'}).finished.catch(()=>{})]);portal.remove();await root.AchievementSystem.obtainItem(id);}finally{portal.remove();root.removeEventListener('pagehide',onLeave,true);drops.delete(id);}
   })();drops.set(id,task);return task;
 }
 function create(c){
   const {ui,node,host}=c;let active=false,epoch=0,busy=false,selected=null,dragCleanup=null,ghost=null,audio=null,playState='stopped',animations=new Set();let s=stateFrom(c.getProgress());
   const img=(id,cls='')=>{const e=node('img',cls);e.src=asset(id);e.alt='';e.draggable=false;return e;};
   const button=(text,fn,cls='hp-button')=>{const b=node('button',cls,text);b.type='button';b.onclick=fn;return b;};
   const say=t=>{const p=ui.content.querySelector('.hp-status');if(p)p.textContent=t;};
   const save=patch=>{s={...s,...patch,hearingPuzzleVersion:2};c.update({...s,finalChallengeCompleted:!!s.hearingPart2Completed,objectOpened:!!s.hearingPart2Completed});};
   function audioState(state){playState=state;ui.content.querySelector('.hp-device')?.classList.toggle('hp-playing',state==='mix'||state==='password');}
   function cancel(){epoch++;active=false;busy=false;selected=null;dragCleanup?.();ghost?.remove();for(const a of animations)a.cancel();animations.clear();audio?.destroy();audio=null;ui.panel.classList.remove('hp-fullscreen');}
   async function motion(el,frames,duration=500){if(!el?.animate)return;const a=el.animate(frames,{duration:host.matchMedia('(prefers-reduced-motion: reduce)').matches?1:duration,fill:'forwards',easing:'ease-in-out'});animations.add(a);try{await a.finished;}catch(_){}finally{animations.delete(a);a.cancel();}}
   function decorate(card,item){card.dataset.special=item.id;card.append(node('span','as-object-state',stateFrom(c.getProgress()).hearingPart2Completed?'可播放密碼':'聲音情境還原'),button('查看錄音機',()=>openObject(item.id),'as-inspect'));card.addEventListener('click',e=>{if(!e.target.closest('button'))openObject(item.id);});}
   function openObject(id){if(id!=='hearing_recorder'||!c.hasItem(id)||active||!ui.panel.open)return false;active=true;s=stateFrom(c.getProgress());
     if(!ui.shadow.querySelector('[data-hearing-css]')){const link=node('link');link.rel='stylesheet';link.href=new URL('hearing.css',base).href;link.dataset.hearingCss='';ui.shadow.append(link);}
     audio=root.HearingPuzzleAudio.create({onStatus:audioState,onError:say});audio.environment(s.parkLocation);audio.assistance(s.assisted);ui.panel.classList.add('hp-fullscreen');c.sync();render();return true;
   }
   function drag(tool,id,target,action){
     tool.onclick=()=>{selected=id;say('已選取'+tool.textContent+'，請點選對應插槽。');tool.classList.add('hp-selected');};target.addEventListener('click',()=>{if(selected===id&&!busy){selected=null;action();}});
     tool.addEventListener('pointerdown',e=>{if(e.button!==0||busy||tool.disabled)return;e.preventDefault();dragCleanup?.();tool.setPointerCapture(e.pointerId);ghost=img(id,'hp-ghost');ui.panel.append(ghost);
       const move=ev=>{ghost.style.left=ev.clientX+'px';ghost.style.top=ev.clientY+'px';target.classList.toggle('hp-near',hit(ev.clientX,ev.clientY,target.getBoundingClientRect()));};
       const clean=()=>{tool.removeEventListener('pointermove',move);tool.removeEventListener('pointerup',up);tool.removeEventListener('pointercancel',clean);tool.removeEventListener('lostpointercapture',clean);target.classList.remove('hp-near');ghost?.remove();ghost=null;dragCleanup=null;};
       const up=ev=>{const ok=hit(ev.clientX,ev.clientY,target.getBoundingClientRect());clean();if(ok)action();else{selected=id;say('可以再拖一次，或點選插槽。');}};
       dragCleanup=clean;tool.addEventListener('pointermove',move);tool.addEventListener('pointerup',up);tool.addEventListener('pointercancel',clean);tool.addEventListener('lostpointercapture',clean);move(e);
     });
   }
   function tool(tray,id,target,action,used){const own=c.hasItem(id),name=c.data.items.find(i=>i.id===id).name;const b=button(name+(used?' · 已放置':own?' · 拖曳或點選':' · 尚未取得'),()=>{},'hp-tool');b.prepend(img(id));b.disabled=!own||used;tray.append(b);if(own&&!used)drag(b,id,target,action);}
   function page(){dragCleanup?.();ghost?.remove();selected=null;ui.title.textContent=s.hearingPart1Completed?'聽力房 · 聲音情境還原':'聽力房 · 啟動錄音機';ui.content.replaceChildren();const p=node('section','hp-scene'),nav=node('nav','hp-nav');
     const mute=button(audio.muted?'取消靜音':'靜音',()=>{audio.setMuted(!audio.muted);mute.textContent=audio.muted?'取消靜音':'靜音';});
     nav.append(button('返回收藏',()=>{cancel();c.render();c.sync();}),button('返回房間',()=>{cancel();c.close();c.sync();}),mute,button('提示',()=>say(!s.hearingPart1Completed?'把電池放入錄音機左下方的電池槽。':'把錄音帶放入中央插槽；地圖放在桌面並找樹蔭長椅；助聽器放在右側耳朵，開啟輔助模式。')));
     const status=node('p','hp-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');p.append(nav,status);ui.content.append(p);return p;
   }
   async function install(id,patch,target){if(busy||!c.hasItem(id))return;busy=true;const run=epoch;audio.mechanical();
     if(id==='hearing_family_tape')audio.startMix();
     const part=img(id,'hp-install');target.append(part);await motion(part,[{opacity:.3,transform:'translateY(-35%) scale(.8)'},{opacity:1,transform:'translateY(0) scale(1)'}],500);
     if(id==='hearing_battery'||id==='hearing_family_tape'){
       const cover=node('span','hp-compartment-cover');target.append(cover);
       await motion(cover,[{transform:'translateY(-105%)'},{transform:'translateY(0)'}],300);
     }
     await motion(target,[{boxShadow:'0 0 28px #ffe9a0'},{boxShadow:'0 0 4px #ffe9a0'}],250);
     if(!active||run!==epoch)return;save(patch);busy=false;render();
   }
   function render(){if(!active)return;const p=page(),layout=node('div','hp-layout'),desk=node('aside','hp-desk'),device=node('div','hp-device'),side=node('aside','hp-side');
     device.classList.toggle('hp-playing',playState==='mix'||playState==='password');device.append(img('hearing_recorder','hp-recorder'));layout.append(desk,device,side);p.append(layout);
     const display=node('div','hp-display');display.classList.toggle('hp-powered',s.hearingPart1Completed);for(let i=0;i<12;i++){const bar=node('i');bar.style.animationDelay=(i*.08)+'s';bar.style.height=(20+(i*37)%70)+'%';display.append(bar);}display.setAttribute('aria-label',s.hearingPart1Completed?'錄音機已啟動':'錄音機尚未啟動');device.append(display);
     const battery=button(s.batteryInstalled?'電池已安裝':'電池槽',()=>{},'hp-battery-slot');battery.classList.toggle('hp-battery-closed',s.batteryInstalled);device.append(battery);
     const tape=button(s.tapeInstalled?'錄音帶已安裝':s.hearingPart1Completed?'放入家庭錄音帶':'錄音帶槽',()=>{},'hp-tape-slot');device.append(tape);
     if(s.tapeInstalled){tape.prepend(img('hearing_family_tape','hp-loaded-tape'));for(let i=0;i<2;i++)tape.append(node('span','hp-reel hp-reel-'+i));}
     else if(s.hearingPart1Completed)tape.classList.add('hp-slot-open');
     const play=button('播放密碼',()=>reveal(false),'hp-play');play.disabled=!s.hearingPart2Completed;play.setAttribute('aria-label','播放最終密碼語音');device.append(play);
     const rings=node('div','hp-rings');[s.tapeInstalled,s.quietLocationFound,s.hearingAidActivated].forEach((done,i)=>{const r=node('span','hp-ring'+(done?' hp-lit':''),String(i+1));r.setAttribute('aria-label',['錄音帶','安靜位置','輔助聆聽'][i]+(done?'完成':'未完成'));rings.append(r);});side.append(rings);
     const ear=button('助聽器放置區',()=>{},'hp-ear');const earShape=node('span','hp-ear-shape');earShape.setAttribute('aria-hidden','true');ear.append(earShape);if(s.aidInstalled){ear.append(img('hearing_hearing_aid','hp-installed-aid'));const lamp=node('span','hp-aid-light');lamp.setAttribute('aria-label','助聽器已安裝，指示燈亮起');ear.append(lamp);}side.append(ear);
     const mapTarget=button('將公園地圖放在桌面',()=>{},'hp-map-target');desk.append(mapTarget);
     const tray=node('div','hp-tray');p.append(tray);
     if(!s.hearingPart1Completed){tool(tray,'hearing_battery',battery,()=>install('hearing_battery',{batteryInstalled:true,hearingPart1Completed:true},battery),s.batteryInstalled);say(c.hasItem('hearing_battery')?'將電池拖入左下方電池槽，或點選電池後點插槽。':'錄音機尚未有電。可以返回房間繼續收集電池。');return;}
     tool(tray,'hearing_family_tape',tape,()=>install('hearing_family_tape',{tapeInstalled:true},tape),s.tapeInstalled);
     tool(tray,'hearing_park_map',mapTarget,()=>install('hearing_park_map',{mapPlaced:true},mapTarget),s.mapPlaced);
     tool(tray,'hearing_hearing_aid',ear,()=>install('hearing_hearing_aid',{aidInstalled:true},ear),s.aidInstalled);
     if(s.mapPlaced){mapTarget.hidden=true;map(desk);}
     if(s.aidInstalled){const toggle=button(s.assisted?'模擬助聽器輔助：開啟':'一般聆聽 · 點此切換輔助',()=>{if(busy)return;audio.assistance(!s.assisted);save({assisted:!s.assisted,hearingAidActivated:true});if(s.tapeInstalled)audio.startMix();render();},'hp-assist');toggle.setAttribute('aria-pressed',String(s.assisted));side.append(toggle);}
     const controls=node('div','hp-audio-controls');const replay=button('重播情境',()=>{audio.stop();audio.environment(s.parkLocation);audio.assistance(s.assisted);audio.startMix();});replay.disabled=!s.tapeInstalled;controls.append(replay,button('停止聲音',()=>audio.stop()));
     const caption=node('p','hp-dialogue-caption','今天下午天氣很好，我們一起到公園走走，好嗎？到了樹蔭下，再坐下來慢慢聊天。我會面對你，一句一句說清楚。');caption.hidden=true;controls.append(button('情境字幕',()=>{caption.hidden=!caption.hidden;}));p.append(controls,caption);
     p.append(node('p','hp-note','聲音情境概念體驗，並非聽力檢查或真實助聽器醫療模擬。切換環境代表改變現場聆聽條件，不是消除原有錄音雜音。'));
     if(s.hearingPart2Completed){play.classList.add('hp-ready');const final=node('div','hp-final');final.append(button('重新聆聽密碼',()=>reveal(false)),button('顯示文字',()=>reveal(true)),button('記住密碼並返回房間',()=>{cancel();c.close();c.sync();}));const text=node('p','hp-password-text');text.hidden=true;text.setAttribute('role','status');p.append(final,text);say('三個機關已解除。請親手按播放鍵，聆聽最後一段錄音。');}
     else if(ready(s)&&ids.every(c.hasItem)){unlock(rings,play);}
     else say('放入錄音帶、找到安靜的位置，再試試輔助聆聽。操作順序不限，進度會保留。');
   }
   function map(parent){const map=node('div','hp-map');map.append(img('hearing_park_map'));parent.append(map);motion(map,[{transform:'perspective(700px) rotateY(-60deg) scaleX(.5)',opacity:.4},{transform:'rotateY(0) scaleX(1)',opacity:1}],400);
     const current=places.find(p=>p.id===s.parkLocation)||places[2];const marker=button('●',()=>{},'hp-marker');marker.setAttribute('aria-label','拖曳位置標記，也可直接點選四個地點');marker.style.left=current.x+'%';marker.style.top=current.y+'%';map.append(marker);
     const choose=id=>{const place=places.find(p=>p.id===id);if(!place)return;audio.environment(id);if(s.tapeInstalled&&!audio.running)audio.startMix();save({parkLocation:id,quietLocationFound:s.quietLocationFound||id==='shade'});audio.mechanical();render();say(id==='shade'?'位置已吸附到樹蔭長椅，環境干擾減少。':place.name+'：切換到此處的背景音。');};
     for(const place of places){const b=button(place.name,()=>choose(place.id),'hp-place');b.style.left=place.x+'%';b.style.top=place.y+'%';b.setAttribute('aria-pressed',String(s.parkLocation===place.id));map.append(b);}
     marker.addEventListener('pointerdown',e=>{if(e.button!==0||busy)return;e.preventDefault();marker.setPointerCapture(e.pointerId);let candidate=current.id;const move=ev=>{const r=map.getBoundingClientRect(),x=Math.max(0,Math.min(100,(ev.clientX-r.left)/r.width*100)),y=Math.max(0,Math.min(100,(ev.clientY-r.top)/r.height*100));marker.style.left=x+'%';marker.style.top=y+'%';const n=nearest(x,y);if(candidate!==n.id){candidate=n.id;audio.environment(candidate);}};const clean=()=>{marker.removeEventListener('pointermove',move);marker.removeEventListener('pointerup',up);marker.removeEventListener('pointercancel',clean);marker.removeEventListener('lostpointercapture',clean);dragCleanup=null;};const up=()=>{clean();choose(candidate);};dragCleanup=clean;marker.addEventListener('pointermove',move);marker.addEventListener('pointerup',up);marker.addEventListener('pointercancel',clean);marker.addEventListener('lostpointercapture',clean);});
     marker.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const index=places.findIndex(p=>p.id===s.parkLocation);choose(places[(Math.max(index,0)+(e.key==='ArrowLeft'||e.key==='ArrowUp'?3:1))%4].id);});
   }
   async function unlock(rings,play){if(busy)return;busy=true;const run=epoch;for(const r of rings.children){await motion(r,[{filter:'brightness(1)'},{filter:'brightness(2.2)'},{filter:'brightness(1)'}],220);if(!active||run!==epoch)return;}audio.mechanical();await motion(play,[{transform:'translateY(-4px)'},{transform:'translateY(0)',boxShadow:'0 0 25px #ffdd87'}],300);if(!active||run!==epoch)return;save({hearingPart2Completed:true});busy=false;render();}
   async function reveal(textOnly){if(!s.hearingPart2Completed||busy)return;if(!c.getProgress().allActivitiesCompleted){say('前面的區域之後再探索吧!先完成這房間的內容哦!');return;}
     if(textOnly){if(!c.reveal())return;save({hearingPasswordRevealed:true});const text=ui.content.querySelector('.hp-password-text');text.textContent='第一個數字，四。第二個數字，二。聽力房密碼：42。';text.hidden=false;return;}
     const run=epoch;say('先播放提示音，再播放密碼。可隨時靜音，或按「顯示文字」。');const ok=await audio.playPassword();if(!active||run!==epoch)return;if(ok&&c.reveal()){save({hearingPasswordRevealed:true});say('錄音播放完畢。可以重新聆聽，或顯示文字。');}
   }
   return {get active(){return active;},decorate,openObject,cancel};
 }
 root.HearingPuzzle={create,drop,logic:Object.freeze({ids,defaults,stateFrom,ready,places,nearest,hit})};
})(window);
