(function(root){'use strict';
const D=root.HearingNoiseData,E=root.HearingNoiseEngine,KEY='icope.hearing.noise.v1';let state=E.fresh(),storageFailed=false;
/* integrated game: fresh state on load; no prior-browser restore */
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){storageFailed=true;}}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mount({app,onReturn}){
let alive=true,generation=0,timers=new Set(),selected='',busy=false,speaker='grandson',posterDispose=null,position=[50,88],helpOpen=false,lastHint=null,parkIntro=false,wasBusy=false,parkGreeted=false;
const R=root.R4,N=()=>root.StoryCopy.room4.noise;
const audio=root.HearingNoiseAudio.create();audio.start();
function later(fn,ms){const token=generation;const id=setTimeout(()=>{timers.delete(id);if(alive&&token===generation)fn();},ms);timers.add(id);return id;}
function clear(){generation++;timers.forEach(clearTimeout);timers.clear();audio.stopVoice();posterDispose?.();posterDispose=null;busy=false;}
/* NPC 對話出現時:停下遊戲音訊、語音與計時;結束後若有進行中的步驟就重新開始,否則只恢復環境音 */
R.setPauser({pause(){wasBusy=timers.size>0;clear();audio.pause();},resume(){if(!alive)return;if(wasBusy)render();else audio.update(state);wasBusy=false;}});
/* 第三修改計劃 F4-4:阿公與孫子的對話改用共用對話框(阿公=玩家角色在左,孫子站在 NPC 的位置);語音照常播放,按一下繼續 */
const GRANDSON=new URL('assets/noise/grandson.png',location.href).href;
function talk(lines){return root.StoryDialog.play({mode:'both',partner:'grandson',grandsonSrc:GRANDSON,playerName:'阿公',position:'bottom',clear:true,className:'r4-noise-talk',lines:lines.map(l=>({who:l.who==='elder'?'player':'grandson',text:l.text}))});}
function say(text,who,done){speaker=who;setSpeaker();const token=generation;let finished=false;audio.speak(text,()=>{});talk([{who,text}]).then(()=>{audio.stopVoice();if(finished||!alive||token!==generation)return;finished=true;done?.();});}
function setSpeaker(){app.querySelectorAll('[data-noise-actor]').forEach(el=>{el.classList.toggle('speaking',el.dataset.noiseActor===speaker);el.setAttribute('aria-label',el.dataset.noiseActor==='elder'?`阿公，${speaker==='elder'?'說話中':'聆聽中'}`:`孫子，${speaker==='grandson'?'說話中':'聆聽中'}`);});}
function actor(who){return `<aside class="noise-actor ${who}" data-noise-actor="${who}"><div class="noise-person" ${who==='elder'?'data-mm-character="player" data-mm-foot-anchor="true"':'data-mm-foot-grandson="true"'} role="img" aria-label="${who==='elder'?'阿公':'孫子'}"></div><span>${who==='elder'?'阿公':'孫子'}</span></aside>`;}
/* 進度條 4 格:廚房、劇情衛教、公園、完成 */
/* 與朋友版 w10_1114 整合:流程改為 廚房降噪 → 四幕劇情衛教 → 公園選位 → 完成(朋友版遊戲設計) */
const filledOf=()=>({kitchen:0,learning:1,park:2,clue:4})[state.stage]||0;
/* 統一頁首:標題=遊戲名;衛教/結算頁保留原標題當小標;靜音鈕放在操作提示下方 */
function header(title,body,hintId,hint,extra=''){
app.innerHTML=R.frame({cls:'noise-mission',backId:'noiseReturn',title:'讓對話，有被聽見的空間',sub:['learning','final','clue'].includes(state.stage)?title:'',content:`${body}<p class="noise-storage" role="status" ${storageFailed?'':'hidden'}>目前無法保存進度；仍可遊玩，請保持頁面開啟。</p>`,extra,barExtra:`<button id="noiseMute" class="secondary" aria-pressed="${audio.isMuted()}">${audio.isMuted()?'開啟聲音':'靜音'}</button>`});
document.querySelector('#noiseReturn').onclick=onReturn;
document.querySelector('#noiseMute').onclick=()=>{audio.setMuted(!audio.isMuted());audio.update(state);const b=document.querySelector('#noiseMute');b.textContent=audio.isMuted()?'開啟聲音':'靜音';b.setAttribute('aria-pressed',audio.isMuted());};setSpeaker();root.MemoryMazeCharacters?.renderWithin(app);
lastHint=R.init(hintId,hint,4,filledOf());}
function render(){clear();audio.update(state);lastHint=null;if(state.stage==='kitchen')kitchen();else if(state.stage==='question')question();else if(state.stage==='feedback')question();else if(state.stage==='learning')learning();else if(state.stage==='park')park();else if(state.stage==='final')final();else clue();
const stage=state.stage,hp=Promise.resolve(lastHint);
if(stage==='kitchen')hp.then(()=>{if(alive&&state.stage==='kitchen'&&!busy)runKitchenBeat();});
else if(stage==='park')hp.then(()=>{if(alive&&state.stage==='park'&&state.parkPlace&&!state.parkHeard&&!busy)playPark();else if(alive&&state.stage==='park'&&!state.parkPlace&&!parkGreeted){parkGreeted=true;say('先選一個位置，我們走過去再聊。','grandson');}});}
function go(stage){if(E.go(state,stage)){save();render();root.scrollTo(0,0);}}
const status=id=>id==='hood'?'持續通風':id==='pan'?(state.pan==='off'?'已關火':'煎炒中'):state[id]==='off'?(id==='tablet'?'已暫停':'已關閉'):state[id]==='low'?'已調低':'發出聲音';

function kitchenLine(){const beat=state.kitchenBeat;if(beat==='leaveReply'||beat==='done')return {who:'elder',text:'原來你明天要去游泳，好啊，我跟你一起去！'};if(beat==='reply'){const changed=Number(state.tap==='off')+Number(state.tablet!=='on')+Number(state.tv!=='on');return {who:'elder',text:changed>=2?'比較清楚了，但還有一些沒聽到，你可以再說一遍嗎？':'你剛剛說什麼？這裡好多聲音，我還是聽不清楚。'};}return {who:'grandson',text:E.kitchenText(state)};}
function kitchen(){
const line=kitchenLine();speaker=line.who;
const scene=state.away?`<div class="noise-quiet-scene"><img src="../assets/art-final/rooms/room4-hearing-livingroom.png" alt="離開廚房，來到較安靜的客廳座位"><div class="quiet-caption">烹調已告一段落 · 已離開主要噪音源</div></div>`:`<div class="noise-map kitchen-map" id="noiseMap"><img src="assets/noise/kitchen.png" alt="半開放廚房：水龍頭、平板、客廳電視、抽油煙機及平底鍋"><div class="noise-effects" aria-hidden="true">${state.tablet==='off'?'<i class="tablet-paused"></i>':''}${state.tv==='off'?'<i class="tv-off"></i>':''}${state.tap==='on'?'<i class="water-flow"></i>':''}${state.pan==='on'?'<i class="pan-heat"></i>':''}</div>${D.objects.map(o=>`<button class="noise-hotspot ${state[o.id]==='off'||state[o.id]==='low'?'reduced':''} ${selected===o.id?'selected':''}" data-noise-object="${o.id}" style="left:${o.x}%;top:${o.y}%;width:${o.w}%;height:${o.h}%" aria-label="${o.name}，${status(o.id)}" aria-expanded="${selected===o.id}" aria-controls="noiseObjectMenu"><span>${o.name}<small>${status(o.id)}</small></span>${o.id==='hood'||state[o.id]==='on'?'<i class="sound-rings" aria-hidden="true"></i>':''}</button>`).join('')}</div>`;
header('不是不想聊，是環境太吵了',`<div class="noise-theater kitchen-theater r4-wide"><div class="noise-center">${scene}</div><p class="sr-only" id="noiseSentence" role="status" aria-live="polite">${line.who==='elder'?'阿公':'孫子'}：${esc(line.text)}</p></div>${selected&&!state.away?objectMenu():''}<div class="noise-turn-status sr-only" id="noiseTurnStatus" role="status"></div>${state.away?'<div class="actions"><button class="primary" id="noiseKitchenDone" disabled>想想剛才的改變</button></div>':'<div class="noise-kitchen-footer"><div class="noise-leave-action"><button class="primary" id="noiseLeave" disabled>與阿公移到安靜處 →</button></div></div>'}`,'noise-kitchen',N().kitchen.hint);
if(state.away){document.querySelector('#noiseKitchenDone').onclick=async()=>{if(busy||helpOpen||state.kitchenBeat!=='done')return;busy=true;await R.star(document.querySelector('#noiseKitchenDone'),1);busy=false;if(alive)go('learning');};return;}
app.querySelectorAll('[data-noise-object]').forEach(b=>b.onclick=()=>{if(busy||helpOpen||state.kitchenBeat!=='ready')return;selected=selected===b.dataset.noiseObject?'':b.dataset.noiseObject;render();if(selected){positionMenu();document.querySelector('#noiseMenuClose').focus();}});
if(selected){positionMenu();document.querySelector('#noiseMenuClose').onclick=closeMenu;
app.querySelectorAll('[data-noise-action]').forEach(b=>b.onclick=async()=>{if(busy||helpOpen)return;const id=selected,value=b.dataset.noiseAction;
document.querySelector('#noiseObjectMenu')?.remove();selected='';
if(id==='hood'){state.kitchenBeat='reply';save();await hoodWarning();if(alive)render();return;}
let note=null;
if(E.act(state,id,value)){if(E.ready(state))note=N().kitchen.ready;else if(id==='pan')note=N().kitchen.panOff;}
state.kitchenBeat='reply';save();
if(note)await R.say([note]);
if(alive)render();});}
document.querySelector('#noiseLeave').onclick=()=>{if(!busy&&!helpOpen&&E.leave(state)){selected='';save();render();}};
}
/* 抽油煙機的安全提醒:文字原樣,改用 NPC 對話框呈現 */
async function hoodWarning(){const m=document.querySelector('.noise-mission');m?.classList.add('hood-warning-shake');await R.say(N().hood(state.pan==='on'),{position:'center'});m?.classList.remove('hood-warning-shake');}
function objectMenu(){const name=D.objects.find(o=>o.id===selected).name;
const btn=(v,label)=>`<button class="secondary" data-noise-action="${v}" ${selected!=='hood'&&state[selected]===v?'disabled':''}>${label}</button>`;
const actions=selected==='tap'?btn('off','關閉水龍頭'):selected==='hood'?btn('off','嘗試關閉抽油煙機'):selected==='pan'?btn('off','烹調告一段落，關火'):btn('low','降低音量')+btn('off',selected==='tablet'?'暫停播放':'關閉電視');
return `<section class="noise-object-popover" id="noiseObjectMenu" aria-labelledby="noiseMenuTitle"><button id="noiseMenuClose" class="noise-close" aria-label="關閉物件選單">×</button><p class="eyebrow">${status(selected)}</p><h3 id="noiseMenuTitle">${name}</h3>${selected==='pan'?'<p>先等烹調告一段落，再關火。</p>':''}<div class="noise-menu-actions">${actions}</div></section>`;}
function positionMenu(){root.Room4Fit?.refit();const menu=document.querySelector('#noiseObjectMenu'),anchor=document.querySelector(`[data-noise-object="${selected}"]`);if(!menu||!anchor)return;menu.style.left='0px';menu.style.top='0px';const r=anchor.getBoundingClientRect(),m=menu.getBoundingClientRect(),w=m.width||290,h=m.height||210,vw=root.innerWidth||1280,vh=root.innerHeight||800;const left=Math.max(12,Math.min(vw-w-12,r.left+(r.width||80)/2-w/2));let top=r.bottom+10;if(top+h>vh-12)top=r.top-h-10;top=Math.max(12,Math.min(vh-h-12,top));placeFixed(menu,left,top);}
/* 頁面被 room4-fit 以 zoom 縮放時,fixed 元素的 left/top 會被一起縮放;量出實際比例再校正到想要的螢幕座標 */
function placeFixed(el,left,top){el.style.left=left+'px';el.style.top=top+'px';const a=el.getBoundingClientRect();el.style.left=(left+10)+'px';el.style.top=(top+10)+'px';const b=el.getBoundingClientRect();const kx=(b.left-a.left)/10||1,ky=(b.top-a.top)/10||1;el.style.left=(left+10+(left-b.left)/kx)+'px';el.style.top=(top+10+(top-b.top)/ky)+'px';}
function closeMenu(){const id=selected;selected='';render();document.querySelector(`[data-noise-object="${id}"]`)?.focus();}
function lockKitchen(locked){app.querySelectorAll('[data-noise-object]').forEach(b=>b.disabled=locked);const leave=document.querySelector('#noiseLeave');if(leave)leave.disabled=locked||!E.ready(state);const done=document.querySelector('#noiseKitchenDone');if(done)done.disabled=locked||state.kitchenBeat!=='done';}
function runKitchenBeat(){const beat=state.kitchenBeat,line=kitchenLine();busy=!['ready','done'].includes(beat);lockKitchen(busy);const st=document.querySelector('#noiseTurnStatus');if(st)st.textContent=busy?'對話中':state.away?'可以繼續':'輪到你了';if(!busy)return;
say(line.text,line.who,()=>{state.kitchenBeat={intro:'ready',reply:'repeat',repeat:'ready',leaveInvite:'leaveReply',leaveReply:'done'}[beat]||'ready';save();render();});}
function keydown(event){if(event.key==='Escape'&&selected&&!helpOpen&&!document.querySelector('.sd-overlay')){event.preventDefault();closeMenu();}}

/* 第一題(廚房):NPC 念題 → 選項下拉 → 玩家疑惑;答對答錯皆 NPC 對話(內容為原本的回饋文字) */
function question(){
const retry=!!state.kitchenAnswer;
header('什麼做法，能讓對話比較輕鬆？',`<section class="noise-card"><h3>什麼做法，能讓對話比較輕鬆？</h3><div class="noise-choices" id="kChoices">${D.kitchenChoices.map((c,i)=>`<button data-kitchen-answer="${c.id}"><span>${'ABCD'[i]}</span>${c.text}</button>`).join('')}</div></section>`,'noise-question',{button:N().questionHint});
const list=document.querySelector('#kChoices');
app.querySelectorAll('[data-kitchen-answer]').forEach(b=>b.onclick=async()=>{if(busy)return;const id=b.dataset.kitchenAnswer;
state.stage='question';if(!E.answerKitchen(state,id))return;save();busy=true;
const c=D.kitchenChoices.find(x=>x.id===id),ok=id==='safe';
await R.say([N().kitchenLesson,c.feedback,N().kitchenNote]);
if(!alive)return;busy=false;
if(ok){await R.star(b,2);if(alive)go('learning');}else go('question');});
busy=true;
if(retry){list.classList.add('sk-drop-list');root.StoryKit.dropHide(list);requestAnimationFrame(()=>{root.StoryKit.dropShow(list);busy=false;});}
else R.quiz({list,ask:'什麼做法，能讓對話比較輕鬆？',wonder:N().wonder,alive:()=>alive&&list.isConnected}).then(()=>{busy=false;});
}
function learning(){/* 與朋友版 w10_1114 整合:四幕劇情衛教(朋友版內容與文字),版面與按鈕沿用本專案 */
const scenes=[
 {image:'story-noise-01.png',caption:'阿公：今天有句很重要的話想對妳說…… 阿嬤：什麼？飛機太吵了，我聽不到啦！',line:'背景聲音太多時，說話聲會更容易被蓋住。'},
 {image:'story-noise-02.png',caption:'阿公：其實妳一直都是我心中最…… 阿嬤：蛤？你說我核心最強？',line:'在健身房等吵雜場所交談時，器材聲可能讓人更難聽清楚。'},
 {image:'story-noise-03.png',caption:'阿公：這麼多年了，我還是最喜歡妳！ 阿嬤：什麼？你說牛排太油了？！',line:'抽油煙機等必要設備應以安全為先，不要為了聊天隨意關閉。'},
 {image:'story-noise-04.png',caption:'阿公：今天是我們的結婚紀念日，我一直都最喜歡妳。 阿嬤：……這次我聽清楚了。',line:'如果環境聲音無法控制，可以換到比較安靜的位置再繼續聊天。'}
];let i=0;
header('今天有句話想對妳說',`<div class="learning-layout"><section class="poster-panel phone-story-media r4-story" aria-label="四幕結婚紀念日衛教劇情"><div class="poster-space"><img id="noiseStoryImage" src="assets/hearing/story-noise-01.png" alt="結婚紀念日告白第1幕"></div><p id="noiseStoryCaption" class="phone-story-caption r4-story-caption"></p></section><section class="learning-copy edu-stepper"><p class="eyebrow">一次看一個衛教重點</p><p id="noiseEduLine" class="edu-line" aria-live="polite"></p><div class="edu-controls"><button id="noiseSpeak" class="secondary edu-speak">聽這一句</button><span id="noiseProgress" class="edu-progress"></span><button id="noiseEduNext" class="primary">下一句 ▶</button></div></section></div>`,'noise-learn',null);
const img=document.querySelector('#noiseStoryImage'),caption=document.querySelector('#noiseStoryCaption'),line=document.querySelector('#noiseEduLine'),progress=document.querySelector('#noiseProgress'),next=document.querySelector('#noiseEduNext');
const update=()=>{const s=scenes[i];const src='assets/hearing/'+s.image;if(img.getAttribute('src')!==src)img.src=src;img.alt=`結婚紀念日告白第${i+1}幕`;caption.textContent=s.caption;line.textContent=s.line;progress.textContent=`${i+1} / ${scenes.length}`;next.textContent=i===scenes.length-1?'前往公園 →':'下一句 ▶';};
document.querySelector('#noiseSpeak').onclick=()=>{try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(scenes[i].line);u.lang='zh-TW';u.rate=.85;speechSynthesis.speak(u);}catch(e){}};
next.onclick=()=>{if(i<scenes.length-1){i++;update();}else{state.learningDone=true;save();go('park');}};
update();}
/* 與朋友版 w10_1114 整合:公園答對即完成(朋友版沒有結算頁);完成按鈕沿用 B4「完成學習」→ 寶物 →「返回房間」 */
function parkDone(){const box=document.querySelector('#parkQuestion');if(!box)return;box.hidden=false;box.innerHTML='<div class="actions"><button class="primary" id="noiseClaim">完成學習</button></div>';root.StoryDialog.finishButton(document.querySelector('#noiseClaim'),{backLabel:'返回房間',finish:async()=>{if(busy||!state.parkPassed)return;busy=true;await R.star(document.querySelector('#noiseClaim'),4);await R.say(N().reward.map(x=>x.text),{position:'center'});if(alive&&E.claim(state)){save();root.AchievementSystem.completeActivity('hearing','noise');}busy=false;},back:()=>onReturn()});try{document.querySelector('#noiseClaim').focus({preventScroll:true});}catch(e){}}
function park(){speaker=state.parkHeard?'elder':'grandson';const place=D.places.find(p=>p.id===state.parkPlace);position=place?place.to:[50,88];
header('替這段重要的對話，找個位置',`<div class="noise-theater park-theater r4-wide"><div class="noise-center"><div class="noise-map park-map"><img src="assets/noise/park.png" alt="公園裡有籃球場、遊戲區、馬路旁長椅、活動廣場及樹蔭步道"><div class="park-party" id="parkParty" style="left:${position[0]}%;top:${position[1]}%" aria-label="阿公和孫子目前的位置"><i class="mini-elder" data-mm-character="player" data-mm-foot-anchor="true"></i><i class="mini-grandson" data-mm-foot-grandson="true"></i><span>我們在這裡</span></div>${D.places.map(p=>`<button class="park-place ${p.id===state.parkPlace?'selected':''}" data-park-place="${p.id}" style="left:${p.x}%;top:${p.y}%" aria-pressed="${p.id===state.parkPlace}" aria-label="${p.name}"><i class="pp-pin" aria-hidden="true"></i><span class="pp-label">${p.name}</span></button>`).join('')}</div></div></div><section class="noise-dialogue park-dialogue"><div class="noise-line"><span>孫子</span><p id="parkSentence" aria-live="polite">${state.parkHeard?place.heard:'先選一個位置，我們走過去再聊。'}</p></div><p id="parkMoveStatus" class="noise-park-status" role="status">${state.parkHeard?place.detail:''}</p></section><section class="noise-card park-question" id="parkQuestion" ${state.parkHeard?'':'hidden'}><p class="eyebrow">替阿公確認內容</p><h3>孫子剛才問了什麼？</h3><div class="noise-choices" id="parkChoices">${D.parkChoices.map((c,i)=>`<button data-park-answer="${c.id}" class="${state.parkAnswer===c.id?'chosen':''}"><span>${'ABCD'[i]}</span>${c.text}</button>`).join('')}</div></section>`,'noise-park',N().park.hint,`<button class="secondary" id="parkReplay" ${place?'':'disabled'}>再聽一次</button>`);
app.querySelectorAll('[data-park-place]').forEach(b=>b.onclick=()=>move(b.dataset.parkPlace));
document.querySelector('#parkReplay').onclick=()=>{if(!busy&&!helpOpen&&state.parkPlace){clear();state.parkHeard=false;state.parkAnswer='';state.parkFeedback='';state.parkPassed=false;save();playPark();}};
app.querySelectorAll('[data-park-answer]').forEach(b=>b.onclick=async()=>{if(busy||helpOpen||!E.answerPark(state,b.dataset.parkAnswer))return;root.AchievementSystem.learning.assessment('hearing','noise',state.parkPassed,{place:state.parkPlace,answer:state.parkAnswer});save();busy=true;
await R.say([parkFeedback()]);if(!alive)return;busy=false;
if(state.parkPassed){await R.star(b,3);if(alive)parkDone();}
else{state.parkAnswer='';state.parkFeedback='';save();render();}});
if(state.parkHeard){const list=document.querySelector('#parkChoices');busy=true;
if(parkIntro){list.classList.add('sk-drop-list');root.StoryKit.dropHide(list);requestAnimationFrame(()=>{root.StoryKit.dropShow(list);busy=false;});}
else{parkIntro=true;R.quiz({list,ask:'孫子剛才問了什麼？',wonder:N().park.wonder,alive:()=>alive&&list.isConnected}).then(()=>{busy=false;});}}}
function parkFeedback(){if(state.parkFeedback==='success')return '對，孫子問下星期能不能陪阿公去醫院檢查耳朵。這裡遠離主要噪音源，阿公比較容易聽清楚問題。';if(state.parkFeedback==='guess')return '你選到了可能的內容，但剛才仍有片段被聲音蓋住。先換個位置，再替阿公完整確認孫子的問題。';if(state.parkPlace==='shade')return '這裡已經比較安靜了。可以再聽一次，確認孫子問的時間與檢查項目。';return '周圍的聲音讓對話比較難聽清楚，要不要換個地方再試一次？';}
function lockPark(locked){app.querySelectorAll('[data-park-place]').forEach(b=>b.disabled=locked);document.querySelector('#parkReplay').disabled=locked;}
function move(id){if(busy||helpOpen)return;clear();if(!E.visit(state,id))return;save();busy=true;lockPark(true);document.querySelector('#parkQuestion').hidden=true;document.querySelector('#parkSentence').textContent='我們一起走過去。';document.querySelector('#parkMoveStatus').textContent='移動中…';speaker='grandson';setSpeaker();audio.pause();const party=document.querySelector('#parkParty'),p=D.places.find(x=>x.id===id);app.querySelectorAll('[data-park-place]').forEach(b=>{b.classList.toggle('selected',b.dataset.parkPlace===id);b.setAttribute('aria-pressed',b.dataset.parkPlace===id);});party.classList.add('walking');party.style.left='50%';party.style.top='63%';later(()=>{party.style.left=p.to[0]+'%';party.style.top=p.to[1]+'%';},600);later(()=>{position=p.to;party.classList.remove('walking');playPark();},1250);}
function playPark(){busy=true;lockPark(true);document.querySelector('#parkQuestion').hidden=true;const p=D.places.find(x=>x.id===state.parkPlace);document.querySelector('#parkSentence').textContent=p.heard;document.querySelector('#parkMoveStatus').textContent='';audio.update(state);say(p.heard,'grandson',()=>{busy=false;E.heard(state);save();render();});}
function final(){header('換個位置，讓對話接得起來',`<section class="noise-card noise-feedback"><p class="eyebrow">情境轉移完成</p><h3>不是要大家安靜，而是找到適合聊天的位置。</h3><div class="noise-takeaways"><article><span>01</span><h4>廚房：減少不必要的聲音</h4><p>調整流水與影音，保留必要通風，烹調結束關火後才離開。</p></article><article><span>02</span><h4>公園：遠離主要聲源</h4><p>球場、遊戲區、車流與活動音樂仍在；你改變了聊天的位置。</p></article><article><span>03</span><h4>對話：再確認理解</h4><p>你替阿公確認了孫子的問題：「下星期陪您去醫院檢查耳朵，好嗎？」</p></article></div><div class="reminder">聽得吃力，不代表不想社交。<br>少一點干擾，多一點理解，讓長者有機會繼續參與。</div><div class="actions"><button class="primary" id="noiseClaim">完成學習</button></div></section>`,'noise-final',null);/* 第三修改計劃 B4:同一顆按鈕「完成學習」→ 寶物 →「返回聽力房」 */root.StoryDialog.finishButton(document.querySelector('#noiseClaim'),{backLabel:'返回房間',finish:async()=>{if(busy||!state.parkPassed)return;busy=true;await R.star(document.querySelector('#noiseClaim'),4);await R.say(N().reward.map(x=>x.text),{position:'center'});if(alive&&E.claim(state)){save();root.AchievementSystem.completeActivity('hearing','noise');}busy=false;},back:()=>onReturn()});}
function clue(){header('替對話留一個安靜的位置',`<article class="clue-card"><div class="clue-symbol">04</div><p class="eyebrow">安靜環境回顧</p><h2>學習完成</h2><div class="clue-word">「減少干擾，換個地方聊」</div><p>必要設備不任意關閉；無法控制噪音時，選擇更適合交談的位置。</p><p class="round-hint">可以返回房間繼續探索。</p><div class="actions"><button class="primary" id="noiseClueReturn">返回房間</button></div></article>`,'noise-clue',null);document.querySelector('#noiseClueReturn').onclick=onReturn;}
function visibility(){if(document.hidden){clear();audio.pause();}else if(alive)render();}
document.addEventListener('visibilitychange',visibility);document.addEventListener('keydown',keydown);root.addEventListener('resize',positionMenu);root.addEventListener('scroll',positionMenu,true);save();render();return ()=>{alive=false;clear();audio.dispose();document.removeEventListener('visibilitychange',visibility);document.removeEventListener('keydown',keydown);root.removeEventListener('resize',positionMenu);root.removeEventListener('scroll',positionMenu,true);save();};
}
root.HearingNoise={mount,getState:()=>state,isComplete:()=>state.claimed,hasClue:()=>state.claimed,reset:()=>{state=E.fresh();save();}};
})(window);
