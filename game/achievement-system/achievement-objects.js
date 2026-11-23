(function(root){'use strict';
root.AchievementObjects={create(c){
 if(c.room==='vision')return root.VisionPuzzle.create(c);
 if(c.room==='hearing')return root.HearingPuzzle.create(c);
 if(c.room==='mobility')return root.MobilityPuzzle.create(c);
 if(c.room==='cognition')return root.CognitionPuzzle.create(c);
 if(c.room==='nutrition')return root.NutritionPuzzle.create(c);
 if(c.room==='depression')return root.DepressionPuzzle.create(c);
 const {data,ui,node,itemPicture,room,host}=c,flow=data.flows[room];
 let active=false,epoch=0,popover=null,animations=new Set();
 const definition=id=>data.items.find(x=>x.id===id);
 function button(text,action,cls='as-action'){const b=node('button',cls,text);b.type='button';b.onclick=action;return b;}
 function dismiss(){popover?.remove();popover=null;}
 ui.panel.addEventListener('click',e=>{if(popover&&!popover.contains(e.target)&&!e.target.closest('[data-special]'))dismiss();});
 function cancel(){epoch++;active=false;dismiss();for(const a of animations)a.cancel();animations.clear();ui.shadow.querySelectorAll('.as-opening-tool').forEach(e=>e.remove());}
 function status(){return c.getProgress().objectState;}
 function decorate(card,item){
   card.dataset.special=item.id;const state=status();card.dataset.state=state;
   card.addEventListener('click',e=>{if(!e.target.closest('button,.as-popover'))openObject(item.id);});
   card.append(node('span','as-object-state',state==='opened'?'已開啟':state==='ready'?'可以開啟':'等待開啟'));
   card.append(button(state==='opened'?'查看結果':'查看物件',()=>openObject(item.id),'as-inspect'));
 }
 function openObject(id){
   if(id!==flow.target||!c.hasItem(id)||active||!ui.panel.open)return false;
   dismiss();if(status()==='opened'){active=true;c.sync();showPassword();return true;}
   const card=ui.content.querySelector('[data-item-id="'+id+'"]');if(!card)return false;
   popover=node('aside','as-popover');popover.setAttribute('role','dialog');popover.setAttribute('aria-label',definition(id).name);
   const x=button('×',dismiss,'as-popover-close');x.setAttribute('aria-label','關閉物件說明');
   popover.append(x,node('strong','',definition(id).name));
   if(!c.hasItem(flow.tool)){popover.append(node('p','','這個物件目前還無法開啟。你還沒有找到可以開啟它的物品。'));}
   else{popover.append(node('p','','可以開啟。你已經找到'+definition(flow.tool).name+'。'),button('開啟',begin));}
   card.append(popover);x.focus();return true;
 }
 async function move(el,frames,duration){if(!el.animate)return;const a=el.animate(frames,{duration:host.matchMedia('(prefers-reduced-motion: reduce)').matches?80:duration,fill:'forwards',easing:'ease-in-out'});animations.add(a);try{await a.finished;}catch(_){}finally{animations.delete(a);a.cancel();}}
 async function begin(){
   if(active||!c.hasItem(flow.tool)||!c.hasItem(flow.target))return;
   const origin=ui.content.querySelector('[data-item-id="'+flow.tool+'"] .as-item-picture')?.getBoundingClientRect();
   dismiss();active=true;c.sync();const run=++epoch;
   ui.title.textContent='開啟'+definition(flow.target).name;ui.content.replaceChildren();
   const stage=node('div','as-opening');stage.dataset.kind=flow.animation;stage.setAttribute('role','status');
   const body=node('div','as-object-body'),lid=node('div','as-object-lid'),lock=node('span','as-lock','🔒'),face=node('div','as-object-face');
   face.textContent=flow.animation==='vision'?'按下卡榫，閱讀內容':flow.animation==='battery'?'▂ ▅ ▃ ▇ ▄ ▆':'✦';
   body.append(face,lid,lock,node('span','as-indicator'));for(let i=0;i<4;i++){const screw=node('span','as-screw','⊕');screw.dataset.corner=i;body.append(screw);}
   stage.append(body,node('p','as-opening-label','正在使用'+definition(flow.tool).name));ui.content.append(stage);
   const tool=itemPicture(definition(flow.tool),'as-opening-tool');ui.panel.append(tool);
   const target=body.getBoundingClientRect(),size=64;
   const dest={x:target.left+target.width*.65-size/2,y:target.top+target.height*.4-size/2};
   tool.style.left=dest.x+'px';tool.style.top=dest.y+'px';
   const dx=origin?origin.left+origin.width/2-dest.x-size/2:0,dy=origin?origin.top+origin.height/2-dest.y-size/2:0;
   await move(tool,[{transform:'translate('+dx+'px,'+dy+'px)'},{transform:'translate(0,0)'}],450);
   if(run!==epoch){tool.remove();return;}
   stage.dataset.phase='interact';
   if(flow.animation==='screws'){
     for(const screw of body.querySelectorAll('.as-screw')){const r=screw.getBoundingClientRect();const x=r.left+r.width/2-dest.x-size/2,y=r.top+r.height/2-dest.y-size/2;await move(tool,[{transform:'translate('+x+'px,'+y+'px) rotate(0deg)'},{transform:'translate('+x+'px,'+y+'px) rotate(180deg)'}],180);screw.classList.add('as-loose');if(run!==epoch)break;}
   }else if(flow.animation==='can')await move(tool,[{transform:'translate(-45%,-70%) rotate(0deg)'},{transform:'translate(30%,-40%) rotate(90deg)'},{transform:'translate(-45%,-10%) rotate(180deg)'},{transform:'translate(-120%,-40%) rotate(270deg)'},{transform:'translate(-45%,-70%) rotate(360deg)'}],800);
   else if(flow.animation==='battery')await move(tool,[{transform:'translateX(45%)',opacity:1},{transform:'translateX(-25%)',opacity:0}],750);
   else if(flow.animation==='vision')await move(face,[{filter:'blur(5px)'},{filter:'blur(0)'}],800);
   else await move(tool,[{transform:'translateX(25%) rotate(0)'},{transform:'translateX(0) rotate(90deg)'}],800);
   tool.remove();if(run!==epoch)return;
   stage.dataset.phase='opened';lock.textContent='🔓';
   await move(lid,[{transform:flow.animation==='battery'?'translateY(-20px)':'perspective(400px) rotateX(0deg)'},{transform:flow.animation==='battery'?'translateY(0)':flow.animation==='diary'?'rotateY(-150deg)':'perspective(400px) rotateX(110deg) translateY(-15px)'}],350);
   if(run!==epoch||!ui.panel.open)return;
   c.update({openingSeen:true});showChallenge();
 }
 function page(title){ui.title.textContent=title;ui.content.replaceChildren();const p=node('section','as-challenge');ui.content.append(p);return p;}
 function question(container,prompt,choices,correct,onSuccess){
   const box=node('div','as-question');box.append(node('h3','',prompt));const feedback=node('p','as-answer-feedback');feedback.setAttribute('role','status');
   choices.forEach((label,i)=>box.append(button(label,()=>{if(i===correct){box.querySelectorAll('button').forEach(b=>b.disabled=true);feedback.textContent='判斷正確。';onSuccess();}else feedback.textContent='再想一想剛才學到的照護方式，還可以再試一次。';},'as-choice')));box.append(feedback);container.append(box);
 }
 function finish(){c.update({objectOpened:true,finalChallengeCompleted:true});const p=page(data.rooms[room]+' · 解謎完成');p.append(node('p','','解謎已完成，進度已保留。'),button('查看結果',showPassword));}
 function showChallenge(){
   const p=page(data.rooms[room]+' · 最後互動');
   if(room==='cognition'){
     const cards=node('div','as-event-cards');['剛做過的事情反覆忘記','在熟悉的地方迷路','重複詢問相同事情'].forEach(t=>cards.append(node('article','',t)));p.append(cards);
     question(p,'這些變化反覆發生時，較適合怎麼做？',['只認為是故意不專心','記錄生活變化，陪伴並尋求專業評估','責備對方不要再忘記'],1,finish);
   }else if(room==='hearing'){
     p.append(node('div','as-wave','▂ ▆ ▃ █ ▄ ▇ ▂'),node('blockquote','','吵雜版本：「明天……沙沙……一起……吃飯……？」'));
     question(p,'怎樣讓家人比較容易聽清楚？',['開大電視並從遠處喊話','一直重複同樣的話，越說越快','關小背景聲、面對家人，清楚慢慢說'],2,()=>{p.append(node('blockquote','as-clear-dialogue','清楚版本：「明天中午，我們一起在家吃飯，好嗎？」'),button('我聽清楚了',finish));});
   }else if(room==='mobility'){
     p.append(node('p','','浴室配置圖：請修正兩處不安全的地方。'));const plan=node('div','as-bathroom');plan.append(node('div','as-bath-fixture','🚿 淋浴區'),node('div','as-bath-fixture','🚽 馬桶旁已裝扶手'));let fixed=0;
     const repair=(text,done)=>{const b=button(text,()=>{b.disabled=true;b.textContent=done;if(++fixed===2)p.append(button('安全配置完成',finish));},'as-hazard');plan.append(b);};
     repair('⚠ 地面濕滑，沒有防滑墊','✓ 清除積水並鋪妥防滑墊');repair('⚠ 起身後立即衝向門口','✓ 扶穩扶手，站穩後再走');p.append(plan);
   }else if(room==='depression'){
     p.append(node('blockquote','','週一：最近提不起勁。\n週三：聚會時，我不知道要說什麼。\n週五：如果有人願意聽我說就好了。'),node('p','','未寄出的文字：「我不是故意不理人，只是有點累。你可以陪我坐一下嗎？」'));
     question(p,'你會怎麼陪伴？',['尊重感受、傾聽陪伴，需要時一起尋求協助','逼他立刻參加所有活動','說「別想太多」，要求他振作'],0,finish);
   }else if(room==='nutrition'){
     const steps=[['牙口不方便，怎麼準備餐點？',['只喝清水','把食材切小、煮軟，搭配足夠營養'],1],['食慾比較差，怎麼安排？',['提供多樣、少量多餐，增加食物香氣','跳過正餐就好'],0],['味覺變淡，怎麼調整？',['一直加鹽讓味道越重越好','運用天然辛香料與不同食材，兼顧均衡'],1]];let n=0;
     const next=()=>{p.replaceChildren();p.append(node('p','', '餐點選擇 '+(n+1)+'／3 · 三好一巧'));const s=steps[n];question(p,s[0],s[1],s[2],()=>{p.append(button(n===2?'完成飲食判斷':'下一組餐點',()=>{n++;if(n===3)finish();else next();}));});};next();
   }else{
     p.append(node('p','','閱讀情境：戴上已取得的老花眼鏡，看看盒內小字。'));const text=node('blockquote','as-fineprint','老花眼常讓近距離小字難以看清；若中央視野持續扭曲或有暗影，應留意並尋求眼科評估。');p.append(text);
     p.append(button('使用老花眼鏡',e=>{text.classList.add('as-readable');e.currentTarget.disabled=true;question(p,'方格中央持續扭曲或出現暗影時，怎麼做？',['只調整閱讀距離就不再理會','用力揉眼睛','記錄異常並尋求眼科評估'],2,finish);}));
   }
 }
 function showPassword(){if(!c.reveal()){const p=page('探索提醒');const hint=node('p','as-exploration-reminder','前面的區域之後再探索吧!先完成這房間的內容哦!');hint.setAttribute('role','alert');p.append(hint,button('返回房間繼續探索',()=>{cancel();c.close();c.sync();}));return;}const p=page(data.rooms[room]+' · 完成結果');p.append(node('p','as-password-heading','本房密碼'),node('p','',data.rooms[room]+'密碼'),node('strong','as-password',flow.password),node('p','','請記住密碼，回到房間的密碼輸入區親自輸入。'),button('記住密碼並返回房間',()=>{cancel();c.close();c.sync();}));if(c.getProgress().completed)p.append(node('p','','✓ 此房已完成'));}
 return {get active(){return active;},decorate,openObject,cancel};
}};
})(window);
