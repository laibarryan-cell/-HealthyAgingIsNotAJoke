(() => {
'use strict';
const D=window.HearingData, KEY='icope.hearing.phase2.v2', app=document.querySelector('#app'), dialog=document.querySelector('#dialog');
const stages=['experience','judgment','learning','assessment','final','clue'];
const tvStages=['experience','judgment','learning','assessment','final','clue'];
const validClues=D.rounds.flatMap(r=>Object.keys(r.clues));
const freshTv=()=>({stage:'experience',completedCycles:0,volume:100,judgmentAnswer:'',assessmentRound:0,assessmentResults:[],completed:false,claimed:false});
const normalizeTv=t=>{const base=freshTv(),src=t&&typeof t==='object'?t:{};return {...base,stage:tvStages.includes(src.stage)?src.stage:'experience',completedCycles:Number.isInteger(src.completedCycles)?Math.max(0,Math.min(3,src.completedCycles)):0,volume:Number.isFinite(src.volume)?Math.max(0,Math.min(100,src.volume)):100,judgmentAnswer:typeof src.judgmentAnswer==='string'?src.judgmentAnswer:'',assessmentRound:Number.isInteger(src.assessmentRound)?Math.max(0,Math.min(2,src.assessmentRound)):0,assessmentResults:Array.isArray(src.assessmentResults)?src.assessmentResults.filter(x=>['pass','press-early','false-alarm','missed'].includes(x)).slice(0,3):[],completed:src.completed===true,claimed:src.claimed===true};};
const fresh=()=>({version:2,view:'room',module:'phone',stage:'experience',seen:[],sorted:[],round:0,line:-1,found:[],completed:false,claimed:false,position:{x:470,y:522},started:false,selectedLine:-1,tv:freshTv()});
let sortBusy=false,doneBusy=false,pausedPlay=false;
let state=fresh(),timer=null,playing=false,feedback='',selected=null,drag=null,storageOK=true,focusBefore=null,disposeView=null,recordLock=false;
let tvQueue=[],tvPaused=false,tvToken=0,audioCtx=null,audioMaster=null,audioLoopTimer=null,audioMode='tv',audioActive=false,vacuumNode=null,tvPrompted=false,tvRamping=false;
try{ /* integrated game: start Room 4 fresh; do not restore prior browser progress */ }
catch(e){state=fresh();document.querySelector('#storageNotice').textContent='儲存紀錄無法讀取，已安全開啟新的聽力房進度。';document.querySelector('#storageNotice').hidden=false;}
// Recover partial or malformed records without letting a saved stage bypass prerequisites.
if(state.seen.length<4 && stages.indexOf(state.stage)>0)state.stage='experience';
else if(state.sorted.length<4 && stages.indexOf(state.stage)>1)state.stage='judgment';
else if(state.found.length<6 && stages.indexOf(state.stage)>3)state.stage='assessment';
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){storageOK=false;document.querySelector('#storageNotice').hidden=false;}}
function stop(){clearTimeout(timer);timer=null;playing=false;}
function close(){if(dialog.open)dialog.close();dialog.classList.remove('zoom-dialog');if(focusBefore?.isConnected)focusBefore.focus();}
function modal(title,body,label='繼續探索',zoom=false){stop();close();focusBefore=document.activeElement;dialog.classList.toggle('zoom-dialog',zoom);document.querySelector('#dialogBody').innerHTML=`<h2 id="dialogTitle">${title}</h2>${body}`;document.querySelector('#closeDialog').textContent=label;dialog.showModal();}
document.querySelector('#closeDialog').addEventListener('click',close);
dialog.addEventListener('close',()=>{if(state.view==='mission'&&state.stage==='experience')document.querySelector('#exploreStage')?.focus({preventScroll:true});});
function cleanup(){if(disposeView){const dispose=disposeView;disposeView=null;dispose();}stopTvAudio();clearTvTimers();}
function go(stage){stop();close();state.view='mission';state.module='phone';state.stage=stage;feedback='';save();render();window.scrollTo(0,0);}
function goNoise(){stop();close();state.view='mission';state.module='noise';save();render();window.scrollTo(0,0);}
function goFamily(){stop();close();state.view='mission';state.module='family';save();render();window.scrollTo(0,0);}
function goTV(stage){stop();close();state.view='mission';state.module='tv';state.tv.stage=stage;feedback='';save();render();window.scrollTo(0,0);}
function room(){stop();close();cleanup();state.view='room';feedback='';save();render();}
function resetProgress(){
  const ok=window.confirm('確定要重設聽力房進度嗎？\n\n這會清除目前聽力房的第一至第四關的當次遊玩進度；收集系統已完成紀錄與物品會保留，並回到全新的聽力房。');
  if(!ok)return;
  stop();close();cleanup();
  try{
    // 清除目前版本，以及先前可能留下的聽力房 Phase 1 紀錄。
    Object.keys(localStorage).filter(k=>k.startsWith('icope.hearing.phase')).forEach(k=>localStorage.removeItem(k));
  }catch(e){storageOK=false;document.querySelector('#storageNotice').hidden=false;}
  window.HearingSocial.reset();window.HearingNoise.reset();R4.resetSeen();state=fresh();feedback='';selected=null;drag=null;recordLock=false;
  save();render();window.scrollTo(0,0);
}
function art(){return '<img class="room-art" src="../assets/art-final/rooms/room4-hearing-livingroom.png" alt="無人物的家庭客廳，有電視、沙發、茶几上的手機、餐桌與便利貼。" draggable="false">';}
const P=()=>window.StoryCopy.room4.phone;
function phoneFilled(){const s=state.stage;if(s==='experience')return 0;if(s==='judgment')return 1;if(s==='learning')return 2;if(s==='assessment')return 3+state.round+(roundDone()?1:0);return 6;}
/* 統一頁首:標題=遊戲名;進度條 6 格(探索、分類、衛教、三回合);hint 為 null 時隱藏操作提示 */
function shell(content,sub,hintId,hint,extra=''){app.innerHTML=R4.frame({cls:`r4-page r4-${state.stage}`,backId:'returnRoom',title:'怎麼又要我再說一次？',sub,content,extra});document.querySelector('#returnRoom').onclick=room;return R4.init(hintId,hint,6,phoneFilled());}
const action=(id,label,disabled=false)=>`<button class="primary" id="${id}" ${disabled?'disabled':''}>${label}</button>`;
function render(){stop();cleanup();R4.setPauser(null);recordLock=false;selected=null;try{if(window.parent!==window)window.parent.postMessage({type:'memoryMaze:room45Mode',room:4,mode:state.view==='room'?'overview':'activity'},'*');}catch(e){}if(state.view==='room'){const clueCount=Number(state.claimed)+Number(state.tv.claimed)+Number(window.HearingSocial.hasClue())+Number(window.HearingNoise.hasClue());app.innerHTML=`<section class="room"><div class="room-frame">${art()}<div class="room-heading"><h1>${window.StoryCopy.room4.roomTitle}</h1></div><button class="reset-progress" id="resetProgress" type="button" aria-label="重設聽力房進度">↻ 重設進度</button>${D.objects.map((o,i)=>{const done=AchievementSystem.getRoomProgress('hearing').completedActivities.includes(o.id);return `<button class="hotspot ${done?'done':''}" data-object="${o.id}" aria-label="${o.name}${done?'，已完成':''}" style="left:${o.x}%;top:${o.y}%;width:${o.w}%;height:${o.h}%"><span class="tag">${o.name}</span></button>`;}).join('')}</div></section>`;document.querySelector('#resetProgress').onclick=resetProgress;app.querySelectorAll('[data-object]').forEach(b=>b.onclick=()=>{if(b.dataset.object==='phone'){go(state.stage);return;}if(b.dataset.object==='tv'){unlockTvAudio();goTV(state.tv.stage);return;}if(b.dataset.object==='family'){goFamily();return;}if(b.dataset.object==='noise'){goNoise();return;}if(b.dataset.object==='medicine'){window.HearingMedical?.open();return;}const n=D.objects.findIndex(o=>o.id===b.dataset.object)+1;modal('功能製作中',`<p>第 ${n} 個聽力主題將於下一階段開放。</p>`,'返回房間');});return;}
if(state.module==='noise'){disposeView=window.HearingNoise.mount({app,onReturn:room});return;}if(state.module==='family'){disposeView=window.HearingSocial.mount({app,onReturn:room});return;}if(state.module==='tv'){tvRender();return;}if(state.stage==='experience')experience();else if(state.stage==='judgment')judgment();else if(state.stage==='learning')learning();else if(state.stage==='assessment')assessment();else if(state.stage==='final')final();else clue();}
function experience(){
  shell(`<div class="scene explore-scene" id="exploreStage" tabindex="0" aria-label="可自由行走的客廳，使用方向鍵或 WASD 移動，靠近物品後點擊查看。">${art()}${window.HearingExplore.objects.map(o=>`<button class="inspect-object ${state.seen.includes(o.id)?'seen':''}" data-inspect="${o.id}" style="left:${o.x}%;top:${o.y}%;width:${o.w}%;height:${o.h}%" aria-label="查看${o.name}" aria-disabled="true"><span>${o.name}</span></button>`).join('')}<div id="explorePlayer" class="explore-player" aria-label="玩家角色"><div id="playerThought" class="player-thought" role="status" hidden>!</div><div class="explore-avatar" aria-hidden="true"><canvas width="256" height="256"></canvas></div><div class="pixel-person" aria-hidden="true"><i class="pixel-shadow"></i><i class="pixel-hair"></i><i class="pixel-face"></i><i class="pixel-shirt"></i><i class="pixel-arm arm-l"></i><i class="pixel-arm arm-r"></i><i class="pixel-leg leg-l"></i><i class="pixel-leg leg-r"></i></div></div></div><div class="explore-controls"><p id="exploreStatus" class="sr-only" role="status"></p><div class="walk-pad" aria-label="方向控制"><button data-walk="arrowleft" aria-label="往左移動">←</button><button data-walk="arrowup" aria-label="往上移動">↑</button><button data-walk="arrowdown" aria-label="往下移動">↓</button><button data-walk="arrowright" aria-label="往右移動">→</button></div></div>`,'','phone-explore',P().explore.hint);
  {const keyOf={subtitle:'tv',talk:'family',message:'phone',note:'note'},stage=document.querySelector('#exploreStage');
  window.ArtUI?.installObjects?.({room:4,canvas:stage,hint:false,items:[...stage.querySelectorAll('[data-inspect]')].map(b=>({key:keyOf[b.dataset.inspect],el:b,label:(b.getAttribute('aria-label')||'').replace('查看','')}))});}
  let finishing=false;
  disposeView=window.HearingExplore.mount({position:state.position,onPosition:p=>{state.position=p;save();},onInspect:async id=>{
    const stageEl=document.querySelector('#exploreStage');
    if(!state.seen.includes(id)){state.seen.push(id);save();}
    app.querySelector(`[data-inspect="${id}"]`)?.classList.add('seen');
    if(id==='talk'||id==='subtitle'){const o=D.observations.find(o=>o.id===id);modal(o.title,o.body,'返回探索',true);await new Promise(res=>dialog.addEventListener('close',res,{once:true}));}
    else await R4.sleep(900);
    if(finishing||state.seen.length!==4||!stageEl?.isConnected||state.stage!=='experience')return;
    finishing=true;
    await R4.star(stageEl,1);await R4.say(P().explore.done);
    if(stageEl.isConnected&&state.stage==='experience')go('judgment');
  }});
}
function card(c,accepted=false){return `<button class="card ${accepted?'accepted':''}" data-card="${c.id}" ${accepted?'disabled':'draggable="true"'}>${c.text}</button>`;}
function judgment(){shell(`<div class="sorting"><div class="card-bank" aria-label="生活行為卡">${D.cards.filter(c=>!state.sorted.includes(c.id)).map(c=>card(c)).join('')}</div><div class="dropzone" id="dropzone" tabindex="0" role="button" aria-label="值得留意，放入選取的卡片"><h3>值得留意</h3>${D.cards.filter(c=>state.sorted.includes(c.id)).map(c=>card(c,true)).join('')}</div></div>`,'','phone-sort',P().sort.hint);const zone=document.querySelector('#dropzone');app.querySelectorAll('.card:not(:disabled)').forEach(b=>{b.onclick=()=>{selected=b.dataset.card;app.querySelectorAll('.card').forEach(x=>x.classList.toggle('selected',x===b));};b.ondragstart=e=>{selected=b.dataset.card;e.dataTransfer.setData('text/plain',selected);};b.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;selected=b.dataset.card;drag={id:selected,x:e.clientX,y:e.clientY};b.setPointerCapture(e.pointerId);});b.addEventListener('pointermove',e=>{if(!drag)return;if(!drag.ghost){drag.ghost=b.cloneNode(true);drag.ghost.className='card drag-ghost';document.body.append(drag.ghost);}drag.ghost.style.left=`${e.clientX-120}px`;drag.ghost.style.top=`${e.clientY-30}px`;});b.addEventListener('pointerup',e=>{if(!drag)return;const r=zone.getBoundingClientRect(),id=drag.id;drag.ghost?.remove();drag=null;if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)sortCard(id);});b.addEventListener('pointercancel',()=>{drag?.ghost?.remove();drag=null;});});zone.ondragover=e=>{e.preventDefault();zone.classList.add('over');};zone.ondragleave=()=>zone.classList.remove('over');zone.ondrop=e=>{e.preventDefault();sortCard(e.dataTransfer.getData('text/plain'));};zone.onclick=()=>sortCard(selected);zone.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();sortCard(selected);}};}
async function sortCard(id){const c=D.cards.find(x=>x.id===id);if(!c||state.sorted.includes(id)||sortBusy)return;AchievementSystem.learning.judgmentBatch('hearing','phone',id,c.correct===true,D.cards.filter(x=>x.correct).map(x=>x.id));sortBusy=true;
  try{
    if(c.correct){state.sorted.push(id);save();judgment();
      if(state.sorted.length===4){await R4.star(document.querySelector('#dropzone'),2);await R4.say(P().sort.done);if(state.stage==='judgment')go('learning');}}
    else{document.querySelector('#dropzone')?.classList.remove('over');const b=app.querySelector(`[data-card="${id}"]`);if(b){b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake');}await R4.say([P().sort.wrong]);}
  }finally{sortBusy=false;}}
function eduStepper(lines, finalId, finalLabel, onDone, onStep){let i=0,typer=null;const line=document.querySelector('#eduLine'),progress=document.querySelector('#eduProgress'),next=document.querySelector('#eduNext'),speak=document.querySelector('#eduSpeak');const render=()=>{clearInterval(typer);if(line.classList.contains('au-dlg-text')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const t=lines[i];let n=0;line.textContent='';typer=setInterval(()=>{n++;line.textContent=t.slice(0,n);if(n>=t.length)clearInterval(typer);},26);}else line.textContent=lines[i];progress.textContent=`${i+1} / ${lines.length}`;next.textContent=i===lines.length-1?finalLabel:'下一句 ▶';if(onStep)onStep(i);};speak.onclick=()=>{try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(lines[i]);u.lang='zh-TW';u.rate=.85;speechSynthesis.speak(u);}catch(e){}};next.onclick=()=>{if(i<lines.length-1){i++;render();}else onDone();};render();}
function learning(){
  const lines=['最近常請別人再說一次，可能是在提醒你聽力有變化。','常把部分詞語聽錯，或回答和問題接不上，也值得留意。','距離較遠時容易漏聽，靠近或看到說話者時可能比較容易理解。','偶爾一次很常見；如果這些情況反覆出現，就可以考慮接受聽力評估。'];
  const scenes=[
    {image:'story-phone-01.png',caption:'孫女：小鄭升職了！這週六大家要聚餐慶祝！阿公：什麼？小珍生子了？！',line:'最近常請別人再說一次，可能是在提醒你聽力有變化。'},
    {image:'story-phone-02.png',caption:'孫女準備「步步高升」紅包；阿公卻悄悄寫下「添丁之喜」。',line:'常把部分詞語聽錯，或回答和問題接不上，也值得留意。'},
    {image:'story-phone-03.png',caption:'阿公：小珍，恭喜妳生子！小珍：我還沒生啦！今天是慶祝小鄭升職！',line:'距離較遠時容易漏聽，靠近或看到說話者時可能比較容易理解。'},
    {image:'story-phone-04.png',caption:'阿公：原來是小鄭升職，不是小珍生子……看來我的耳朵真的要檢查一下了！孫女：我陪你一起去。',line:'偶爾一次很常見；如果這些情況反覆出現，就可以考慮接受聽力評估。'}
  ];
  /* 與朋友版 w10_1114 整合:左側海報改成四幕劇情插圖與圖下台詞,NPC 每說一句就換到對應的一幕 */
  /* 第三修改計劃 F4-1:刪除舊的「長輩」對話框(玩家頭像+聽這一句/下一句);4 句衛教文字不變,改由房間 NPC 用共用對話框逐句說,右側重點逐條亮起 */
  shell(`<div class="learning-layout r4-learn"><section class="poster-panel phone-story-media r4-story" aria-label="四幕衛教劇情"><div class="poster-space"><div id="imagePlaceholder" class="image-placeholder" hidden><span class="photo-outline" aria-hidden="true"></span><h3>聽力衛教圖片</h3></div><img id="learningImage" src="assets/hearing/story-phone-01.png" alt="紅包誤會衛教第1幕"></div><p id="phoneStoryCaption" class="phone-story-caption r4-story-caption"></p></section><aside class="r4-points" aria-label="已讀到的重點"><p class="eyebrow">日常觀察</p><h3>留意反覆出現的變化</h3><ol id="r4Points">${lines.map((_,k)=>`<li data-k="${k}"><b>${k+1}</b><span></span></li>`).join('')}</ol></aside></div><div class="actions r4-learn-actions"><button class="secondary r4-speak" id="phoneSpeak" type="button">🔊 聽這一句</button>${action('eduNext','下一句 ▶')}</div>`,'週末的慶祝聚會','phone-learn',null);
  const img=document.querySelector('#learningImage'),placeholder=document.querySelector('#imagePlaceholder');img.onload=()=>{img.hidden=false;placeholder.hidden=true;};img.onerror=()=>{img.hidden=true;placeholder.hidden=false;};if(img.complete&&img.naturalWidth){img.hidden=false;placeholder.hidden=true;}
  const scene=k=>{const s=scenes[Math.min(k,scenes.length-1)];if(!s)return;const src='assets/hearing/'+s.image;if(img.getAttribute('src')!==src)img.src=src;img.alt='紅包誤會衛教第'+(Math.min(k,scenes.length-1)+1)+'幕';document.querySelector('#phoneStoryCaption').textContent=s.caption;};
  scene(0);
  const mark=k=>{scene(k);document.querySelectorAll('#r4Points li').forEach((li,n)=>{li.classList.toggle('on',n<=k);li.classList.toggle('now',n===k);li.querySelector('span').textContent=n<=k?lines[n]:'';});};
  const btn=document.querySelector('#eduNext');
  /* 第三修改計劃新增 E1-1:NPC 對話框出現時故事也在繼續、兩者重疊 → 刪除這一步的 NPC 對話框。
     改由玩家按「下一句」逐句前進:右側重點逐條亮起、左側換到對應的一幕;讀完最後一句後按鈕變「開始聊天偵探」。4 句衛教文字不變。 */
  let k=0;mark(0);
  const speak=()=>{try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(lines[k]);u.lang='zh-TW';u.rate=.95;speechSynthesis.speak(u);}catch(e){}};
  document.querySelector('#phoneSpeak').onclick=speak;
  btn.onclick=async()=>{if(btn.disabled)return;
    if(k<lines.length-1){k++;mark(k);if(k===lines.length-1){btn.textContent='開始聊天偵探';btn.classList.add('sd-stage-back');}return;}
    try{speechSynthesis.cancel();}catch(e){}btn.disabled=true;await R4.star(btn,3);go('assessment');};
}
function roundDone(){return Object.keys(D.rounds[state.round].clues).every(id=>state.found.includes(id));}
function assessment(){
  recordLock=false;
  const r=D.rounds[state.round];
  R4.setPauser({pause(){pausedPlay=playing;clearTimeout(timer);},resume(){if(pausedPlay&&playing&&state.view==='mission'&&state.stage==='assessment')schedule();pausedPlay=false;}});
  shell(`<div class="detective detective-text r4-detective"><section class="r4-case" aria-label="對話紀錄"><div class="round-intro"><h3>${r.title}</h3><p>${r.description}</p></div><div class="dialogue-log" id="log"></div><div class="timeline" id="timeline" aria-label="選擇對話時段"></div></section><aside class="r4-notebook" aria-label="觀察筆記"><h3>觀察筆記</h3><ul class="r4-slots" id="r4Slots"></ul><p class="sr-only" id="playHint" role="status"></p><div class="play-controls">${action('record','記錄線索')}<button class="secondary" id="play">開始播放</button></div></aside></div>`,'','phone-detective',P().detective.hint,'<button class="secondary" id="replay" type="button">↺ 重播本回合</button>');
  document.querySelector('#record').onclick=record;
  document.querySelector('#play').onclick=()=>{if(playing){stop();updatePlayer();}else play();};
  document.querySelector('#replay').onclick=()=>{stop();state.line=-1;state.selectedLine=-1;recordLock=false;save();play();};
  updatePlayer();
  if(roundDone())showRoundDone();
}
function hideFeedback(){}
function selectLine(index){
  if(!state.started||recordLock||index<0||index>=D.rounds[state.round].lines.length)return;
  stop();state.selectedLine=index;save();hideFeedback();updatePlayer(true);
  if(roundDone())showRoundDone();
}
function updatePlayer(flash=false){
  const r=D.rounds[state.round],log=document.querySelector('#log');
  if(!log)return;
  const current=state.selectedLine>=0?state.selectedLine:state.line;
  log.innerHTML=!state.started?'<div class="play-intro"><span class="play-outline" aria-hidden="true"></span><h3>準備觀察這段對話</h3></div>':r.lines.map((l,i)=>{
    const count=(l.clues||[]).filter(id=>state.found.includes(id)).length;
    return `<button class="line side-${/旁白/.test(l.who)?'note':/長者/.test(l.who)?'me':'other'} ${i===current?'current':''} ${count?'recorded':''} ${flash&&i===current?'selection-flash':''}" data-select-line="${i}" aria-pressed="${i===current}" ${recordLock?'disabled':''}><span class="line-time">00:${String(i*2).padStart(2,'0')}</span><span class="line-body"><small>${l.who}</small>${l.text}${count?` <small>已記錄 ${count} 個線索</small>`:''}</span>${i===current?'<span class="selected-label">目前選取</span>':''}</button>`;
  }).join('');
  document.querySelector('#timeline').innerHTML=r.lines.map((l,i)=>`<button data-line="${i}" class="${i<=state.line?'visited':''} ${i===current?'current':''} ${flash&&i===current?'selection-flash':''}" ${!state.started||recordLock?'disabled':''} aria-pressed="${i===current}" aria-label="選取 00:${String(i*2).padStart(2,'0')} 的對話">00:${String(i*2).padStart(2,'0')}</button>`).join('');
  app.querySelectorAll('[data-line]').forEach(b=>b.onclick=()=>selectLine(Number(b.dataset.line)));
  app.querySelectorAll('[data-select-line]').forEach(b=>b.onclick=()=>selectLine(Number(b.dataset.selectLine)));
  const slots=document.querySelector('#r4Slots');if(slots)slots.innerHTML=Object.keys(r.clues).map(id=>{const got=state.found.includes(id);return `<li class="${got?'got':''}"><span class="r4-slot-mark">${got?'✓':'?'}</span><span>${got?r.clues[id]:'尚未記錄的線索'}</span></li>`;}).join('');
  const activeLine=log.querySelector('.current');
  if(activeLine)activeLine.scrollIntoView({block:'nearest',behavior:'auto'});
  document.querySelector('#play').textContent=playing?'暫停':!state.started?'開始播放':'繼續播放';
  document.querySelector('#play').disabled=recordLock||roundDone();
  document.querySelector('#replay').disabled=recordLock||roundDone();
  document.querySelector('#record').disabled=!state.started||current<0||roundDone()||recordLock;
  document.querySelector('#playHint').textContent=roundDone()?'本回合的 2 個線索都找到了。':playing?'播放中':state.started?`已暫停，目前選取 00:${String(Math.max(0,current)*2).padStart(2,'0')}`:'';
}
function play(){
  if(recordLock)return;
  if(roundDone()){showRoundDone();return;}
  hideFeedback();state.started=true;
  if(state.selectedLine>=0)state.line=state.selectedLine;
  else if(state.line<0||state.line>=D.rounds[state.round].lines.length-1)state.line=0;
  state.selectedLine=-1;playing=true;save();updatePlayer();schedule();
}
function schedule(){
  clearTimeout(timer);
  timer=setTimeout(()=>{
    if(!playing||state.view!=='mission'||state.stage!=='assessment')return;
    if(state.line<D.rounds[state.round].lines.length-1){state.line++;save();updatePlayer();schedule();}
    else{stop();updatePlayer();}
  },2000);
}
async function record(){
  const r=D.rounds[state.round],index=state.selectedLine>=0?state.selectedLine:state.line,l=r.lines[index];
  if(!state.started||!l||roundDone()||recordLock)return;
  const id=l.clues?.find(x=>!state.found.includes(x));
  const alive=()=>state.stage==='assessment'&&document.querySelector('#log');
  if(id){
    stop();recordLock=true;state.selectedLine=index;state.found.push(id);save();updatePlayer();
    const more=l.clues.some(x=>!state.found.includes(x)),lines=[P().detective.got(r.clues[id])];
    if(more)lines.push(P().detective.more);
    await R4.say(lines);
    recordLock=false;
    if(!alive())return;
    if(roundDone())showRoundDone();else updatePlayer();
  }else{
    recordLock=true;await R4.say([l.clues?.length?P().detective.again:P().detective.none]);recordLock=false;
  }
}
async function showRoundDone(){
  if(doneBusy)return;doneBusy=true;
  stop();recordLock=true;updatePlayer();
  const round=state.round,alive=()=>state.stage==='assessment'&&document.querySelector('#log');
  try{
    await R4.star(document.querySelector('#record'),3+round+1);
    await R4.say([D.rounds[round].feedback]);
  }finally{recordLock=false;doneBusy=false;}
  if(!alive())return;
  if(round<2){state.round++;state.line=-1;state.started=false;state.selectedLine=-1;save();assessment();}
  else if(state.found.length===6){AchievementSystem.learning.assessment('hearing','phone',true,{clues:state.found.slice()});go('final');}
}
function final(){const summaries=['容易把部分內容聽錯','回答可能和原本話題接不上','常常需要重新確認對話內容','會表示自己沒有聽清楚','距離較遠時比較容易漏聽','靠近或看到說話者時比較容易理解'];shell(`<div class="r4-finalwrap"><div class="final-list">${summaries.map((x,i)=>`<p style="animation-delay:${i*.12}s"><b>${i+1}</b><span>${x}</span></p>`).join('')}</div><div class="r4-final-side"><p class="core">有時候不是沒有在聽，<br>而是沒有完整聽清楚。</p><div class="reminder">如果這些狀況反覆出現在日常生活中，就值得進一步留意聽力狀況。</div><div class="actions">${action('claim',state.claimed?'完成回顧':'完成學習')}</div></div></div>`,'你找到的生活線索','phone-final',null);/* 第三修改計劃 B4:同一顆按鈕「完成學習」→ 寶物 →「返回聽力房」 */StoryDialog.finishButton(document.querySelector('#claim'),{label:state.claimed?'完成回顧':'完成學習',backLabel:'返回房間',finish:async()=>{if(state.found.length!==6)return;if(!state.claimed)await R4.say(P().reward.map(x=>x.text),{position:'center'});const first=!state.claimed;state.completed=true;state.claimed=true;save();AchievementSystem.completeActivity('hearing','phone');if(first)await AchievementSystem.obtainItem('hearing_recorder');},back:()=>room()});}
function clue(){final();}


/* ============================
   第二關：怎麼越開越大聲？
   ============================ */
const tvStageNames=['聲音體驗','簡單判斷','正式學習','警鈴評量','最終回饋','完成回顧'];
const tvAlertRounds=[
  {title:'Round 1', sequence:[20,30,40,50,60,50,40,50,60,50,40,50,60,50,40,30,40,50,60,50,40,50,60,50,40,30,20,30,40,50,60,50,40,30], shouldAlert:false},
  {title:'Round 2', sequence:[20,30,40,50,60,50,40,50,60,50,40,50,60,50,40,50,60,70,80,90,90,90,100,100,90,80,70,60,50,40,30,20,20,20], shouldAlert:true},
  {title:'Round 3', sequence:[20,30,40,50,40,50,60,50,40,50,60,50,40,50,60,70,60,50,60,70,80,90,100,90,100,90,80,70,60,50,40,30,20,20], shouldAlert:true}
];
function clearTvTimers(){tvQueue.forEach(it=>clearTimeout(it.id));tvQueue=[];tvPrompted=false;tvRamping=false;tvToken++;tvPaused=false;}
const TV=()=>window.StoryCopy.room4.tv;
/* 可暫停的計時:對話出現時 pauseTv() 凍結剩餘時間並靜音,結束後 resumeTv() 接續 */
function tvLater(fn,ms){const it={fn,due:performance.now()+ms,rem:ms,id:0};it.arm=d=>{it.id=setTimeout(()=>{tvQueue=tvQueue.filter(x=>x!==it);fn();},d);};tvQueue.push(it);if(!tvPaused)it.arm(ms);return it;}
function pauseTv(){if(tvPaused)return;tvPaused=true;const now=performance.now();tvQueue.forEach(it=>{clearTimeout(it.id);it.rem=Math.max(0,it.due-now);});clearTimeout(audioLoopTimer);audioLoopTimer=null;if(audioMaster&&audioCtx){try{audioMaster.gain.cancelScheduledValues(audioCtx.currentTime);audioMaster.gain.setTargetAtTime(.0001,audioCtx.currentTime,.02);}catch(e){}}}
function resumeTv(){if(!tvPaused)return;tvPaused=false;const now=performance.now();tvQueue.slice().forEach(it=>{it.due=now+it.rem;it.arm(it.rem);});if(audioActive){setTvAudioVolume(state.tv.volume);playPattern();}}
function unlockTvAudio(){
  try{
    if(!audioCtx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;audioCtx=new AC();audioMaster=audioCtx.createGain();audioMaster.gain.value=.09;audioMaster.connect(audioCtx.destination);}
    if(audioCtx.state==='suspended')audioCtx.resume();return true;
  }catch(e){return false;}
}
function volumeGain(v){const n=Math.max(0,Math.min(100,Number(v)||0));return .018+(n/100)*.10;}
function setTvAudioVolume(v){if(audioCtx&&audioMaster){const now=audioCtx.currentTime;audioMaster.gain.cancelScheduledValues(now);audioMaster.gain.setTargetAtTime(volumeGain(v),now,.04);}}
function clang(at=0,pitch=1){
  if(!audioCtx||!audioMaster)return;const t=audioCtx.currentTime+at;
  [[392,.11],[523,.09],[659,.06],[784,.04]].forEach(([f,gain],i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=i<2?'square':'triangle';o.frequency.setValueAtTime(f*pitch,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+.18);o.connect(g);g.connect(audioMaster);o.start(t);o.stop(t+.22);});
}
function startVacuum(){
  if(!audioCtx||!audioMaster||vacuumNode)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sawtooth';o.frequency.value=72;g.gain.value=.022;o.connect(g);g.connect(audioMaster);o.start();vacuumNode={o,g};
}
function stopVacuum(){if(!vacuumNode)return;try{vacuumNode.g.gain.setTargetAtTime(.0001,audioCtx.currentTime,.08);vacuumNode.o.stop(audioCtx.currentTime+.25);}catch(e){}vacuumNode=null;}
function playPattern(){if(!audioActive)return;clang(0,1);clang(.42,.94);clang(.84,1.06);clang(1.26,1);audioLoopTimer=setTimeout(playPattern,2100);}
function startTvAudio(mode='tv',volume=100,withVacuum=false){
  if(!unlockTvAudio())return false;stopTvAudio();audioMode=mode;audioActive=true;setTvAudioVolume(volume);if(withVacuum)startVacuum();playPattern();return true;
}
function stopTvAudio(){audioActive=false;clearTimeout(audioLoopTimer);audioLoopTimer=null;stopVacuum();if(audioMaster&&audioCtx){try{audioMaster.gain.setTargetAtTime(.0001,audioCtx.currentTime,.04);}catch(e){}}}
function tvFilled(){const st=state.tv.stage;if(st==='experience')return state.tv.completedCycles;if(st==='judgment')return 3;if(st==='learning')return 4;if(st==='assessment')return 4+state.tv.assessmentRound;return 7;}
/* 統一頁首:標題=遊戲名;進度條 7 格(體驗 3 次、判斷、警鈴 3 回合) */
function tvShell(content,sub,hintId,hint,extra=''){
  app.innerHTML=R4.frame({cls:'tv-mission',backId:'returnRoom',title:'怎麼越開越大聲？',sub,content,extra});
  document.querySelector('#returnRoom').onclick=room;
  window.MemoryMazeCharacters?.renderWithin(app);
  return R4.init(hintId,hint,7,tvFilled());
}
function tvRender(){
  R4.setPauser({pause:pauseTv,resume:resumeTv});
  const stage=state.tv.stage;
  if(stage==='experience')tvExperience();else if(stage==='judgment')tvJudgment();else if(stage==='learning')tvLearning();else if(stage==='assessment')tvAssessment();else if(stage==='final')tvFinal();else tvClue();
}
function tvSetVolume(v){
  state.tv.volume=Math.max(0,Math.min(100,Math.round(Number(v)||0)));setTvAudioVolume(state.tv.volume);save();
  const number=document.querySelector('#tvVolumeNumber'),fill=document.querySelector('#tvVolumeFill'),side=document.querySelector('#sideVolumeNumber');
  if(number)number.textContent=String(state.tv.volume);
  if(fill){
    if(fill.classList.contains('bell-fill')){
      const height=state.tv.volume*4;
      fill.setAttribute('height',String(height));
      fill.setAttribute('y',String(420-height));
    }else fill.style.width=`${state.tv.volume}%`;
  }
  const meter=document.querySelector('[data-volume-meter]')||document.querySelector('.tv-screen-osd');
  if(meter)meter.setAttribute('aria-valuenow',String(state.tv.volume));
  if(side)side.textContent=String(state.tv.volume);
}
function renderRemoteMarkup(){
  return `<div id="pickRemote" class="remote-shell" aria-label="電視遙控器" tabindex="0"><div class="remote-top"><button class="remote-power" type="button" disabled aria-label="電源"></button><span class="remote-brand">TV REMOTE</span></div><div class="remote-speaker"></div><div class="remote-keypad">${[1,2,3,4,5,6,7,8,9,'-',0,'↺'].map(k=>`<button type="button" class="dummy-key" tabindex="-1">${k}</button>`).join('')}</div><div class="volume-rocker ${tvPrompted&&!tvRamping?'active':''}" aria-label="音量長條按鈕"><button id="remoteVolUp" type="button" class="rocker-half up" ${(!tvPrompted||tvRamping)?'disabled':''} aria-label="音量增加 10">VOL ＋</button><button id="remoteVolDown" type="button" class="rocker-half down" ${(!tvPrompted||tvRamping)?'disabled':''} aria-label="音量減少 10">VOL －</button></div><div class="remote-bottom"><button type="button" class="dummy-round" tabindex="-1">CH</button><button type="button" class="dummy-round" tabindex="-1">OK</button><button type="button" class="dummy-round" tabindex="-1">MENU</button></div></div>`;
}
function bindRemoteControls(){
  const up=document.querySelector('#remoteVolUp'),down=document.querySelector('#remoteVolDown');
  if(up)up.onclick=()=>{if(tvPrompted&&!tvRamping)tvSetVolume(state.tv.volume+10);};
  if(down)down.onclick=()=>{if(tvPrompted&&!tvRamping){tvSetVolume(state.tv.volume-10);if(state.tv.volume===30)completeTvCycle();}};
}
async function tvExperience(){
  if(state.tv.completedCycles>=3){await showTvGrandpaScene();return;}
  const tk=tvToken;
  state.tv.volume=100;save();
  const hp=tvShell(`<div id="tvExperienceMain" class="tv-experience-wrap"><section class="tv-stage-card"><div class="tv-set realistic"><div class="tv-bezel"><div class="tv-music-screen" aria-label="電視正在播放原創鏘鏘配樂"><div class="music-glow"></div><div class="music-notes realistic" aria-hidden="true"><span>♪</span><span>♫</span><span>♪</span><span>♬</span></div><div class="tv-screen-osd" role="meter" aria-label="目前電視音量" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><div class="osd-heading"><span>音量</span><strong id="tvVolumeNumber">100</strong></div><div class="osd-track"><i id="tvVolumeFill" class="tv-level-fill" style="width:100%"></i></div><div class="osd-endpoints"><span>0</span><span>100</span></div></div></div></div><div class="tv-stand"></div></div><div id="familyBubble" class="family-bubble" role="status">電視正在播放音樂……</div></section><aside class="remote-panel"><div class="side-meter"><span>目標音量</span><strong>30</strong></div>${renderRemoteMarkup()}</aside></div>`,'','tv-exp',TV().exp.hint);
  bindRemoteControls();
  await hp;
  if(tk!==tvToken||!document.querySelector('#tvExperienceMain'))return;
  startTvAudio('tv',100,false);
  scheduleTvExperiencePrompt();
}
function updateRemoteEnabled(){
  const shell=document.querySelector('.volume-rocker'),up=document.querySelector('#remoteVolUp'),down=document.querySelector('#remoteVolDown');
  const active=tvPrompted&&!tvRamping;
  if(shell)shell.classList.toggle('active',active);
  if(up)up.disabled=!active;
  if(down)down.disabled=!active;
}
function scheduleTvExperiencePrompt(){
  const messages=['很吵！','怎麼又變大聲了？','奇怪，明明才剛調小……'];
  tvPrompted=false;tvRamping=false;const bubble=document.querySelector('#familyBubble');
  if(!bubble)return;bubble.textContent='電視正在播放音樂……';updateRemoteEnabled();
  tvLater(()=>{tvPrompted=true;bubble.textContent=messages[state.tv.completedCycles]||messages[2];updateRemoteEnabled();},3000);
}
function completeTvCycle(){
  if(tvRamping||!tvPrompted||state.tv.volume!==30)return;tvRamping=true;tvPrompted=false;updateRemoteEnabled();
  const bubble=document.querySelector('#familyBubble');
  bubble.textContent='這樣好多了。';
  R4.star(document.querySelector('#remoteVolDown'),state.tv.completedCycles+1);
  tvLater(()=>{const intervals=[180,320,480],stepDelay=intervals[state.tv.completedCycles]||320;bubble.textContent='……';
    const tick=()=>{if(state.view!=='mission'||state.module!=='tv'||state.tv.stage!=='experience')return;const next=Math.min(100,state.tv.volume+10);tvSetVolume(next);if(next<100)tvLater(tick,stepDelay);else{state.tv.completedCycles++;save();if(state.tv.completedCycles>=3){tvLater(showTvGrandpaScene,700);}else scheduleTvExperiencePrompt();}};tick();
  },2000);
}
/* 阿公的話改成玩家對話框(文字不變),接著進入判斷 */
async function showTvGrandpaScene(){
  clearTvTimers();state.tv.completedCycles=3;state.tv.volume=100;save();stopTvAudio();
  await R4.say([TV().grandpa],{who:'player',position:'center'});
  if(state.view==='mission'&&state.module==='tv'&&state.tv.stage==='experience')goTV('judgment');
}
function tvJudgment(){
  tvShell(`<section class="simple-question tv-question"><div class="question-avatar"><div class="question-avatar-actor" data-mm-character="player" aria-label="阿公站在畫面中央"></div></div><div><p class="question-kicker">阿公剛剛說：「阿你們為什麼一直開靜音？」</p><h3>阿公可能怎麼了？</h3><div class="choice-list four" id="tvChoices"><button data-tv-choice="a">A　他只是今天心情不好。</button><button data-tv-choice="b">B　他可能最近需要更大的音量，出現了聽力變化的生活線索。</button><button data-tv-choice="c">C　他只是覺得這首歌不好聽。</button><button data-tv-choice="d">D　他單純忘記遙控器怎麼按。</button></div></div></section>`,'','tv-judgment',{button:TV().judgmentHint});
  const list=document.querySelector('#tvChoices');let busy=true;
  app.querySelectorAll('[data-tv-choice]').forEach(btn=>btn.onclick=async()=>{
    if(busy)return;busy=true;const ok=btn.dataset.tvChoice==='b';AchievementSystem.learning.judgment('hearing','tv',ok);
    btn.classList.add(ok?'correct':'wrong');
    await R4.say(ok?['答對了！','阿公可能最近需要更大的音量，這是一種值得留意的日常聽力線索：音量明明被調小，卻又反覆被調回去。']:['再想想剛剛重複出現的情況：不是一次偶發，而是音量反覆被調回很大聲。']);
    if(!list.isConnected)return;
    if(ok){state.tv.judgmentAnswer='b';save();await R4.star(btn,4);if(list.isConnected)goTV('learning');}
    else{btn.classList.remove('wrong');busy=false;}
  });
  R4.quiz({list,ask:'阿公可能怎麼了？',wonder:TV().wonder,alive:()=>list.isConnected}).then(()=>{busy=false;});
}
function tvLearning(){
  const lines=['電視或手機最近常要調得比以前更大聲，可能是值得留意的變化。','重點不是偶爾一次開很大聲，而是音量是否經常被反覆調高。','如果自己覺得剛好，家人卻常覺得太大聲，也可以把這個變化記下來。'];
  const scenes=[
    {image:'story-tv-01.png',caption:'阿嬤：你是在看電視，還是在幫全社區辦露天電影院啊？！阿公：哪有很大聲？我覺得剛剛好啊！',line:'電視或手機最近常要調得比以前更大聲，可能是值得留意的變化。'},
    {image:'story-tv-02.png',caption:'孫子：阿公！我在樓上寫功課，也聽得一清二楚啦！阿公：原來你也覺得這齣戲精彩！你猜誰是小三？',line:'重點不是偶爾一次開很大聲，而是音量是否經常被反覆調高。'},
    {image:'story-tv-03.png',caption:'鄰居：我覺得兇手一定是那個穿紅衣服的！阿公：等等，連隔壁都聽得到？！難道真的是我的耳朵聽不清楚了？',line:'如果自己覺得剛好，家人卻常覺得太大聲，也可以把這個變化記下來。'}
  ];
  /* 與朋友版 w10_1114 整合:海報改成三幕劇情插圖與圖下台詞,隨逐句衛教同步換幕 */
  tvShell(`<div class="learning-layout"><section class="poster-panel phone-story-media r4-story" aria-label="三幕電視音量衛教劇情"><div class="poster-space"><div class="image-placeholder" id="volumePosterPlaceholder" hidden><span class="photo-outline" aria-hidden="true"></span><h3>音量變化衛教海報</h3></div><img id="volumePoster" src="assets/hearing/story-tv-01.png" alt="電視音量衛教第1幕"></div><p id="tvStoryCaption" class="phone-story-caption r4-story-caption"></p></section><section class="learning-copy edu-stepper"><p class="eyebrow">設備使用變化</p><h3>音量調節也是日常觀察線索</h3><p id="eduLine" class="edu-line"></p><div class="edu-controls"><button id="eduSpeak" class="secondary edu-speak">聽這一句</button><span id="eduProgress" class="edu-progress"></span><button id="eduNext" class="primary">下一句 ▶</button></div></section></div>`,'今晚的八點檔','tv-learn',null);
  const img=document.querySelector('#volumePoster'),ph=document.querySelector('#volumePosterPlaceholder');img.onload=()=>{img.hidden=false;ph.hidden=true};img.onerror=()=>{img.hidden=true;ph.hidden=false};if(img.complete&&img.naturalWidth){img.hidden=false;ph.hidden=true;}
  eduStepper(lines,'tvConsole','開始音量警鈴',()=>goTV('assessment'),k=>{const s=scenes[k];if(!s)return;const src='assets/hearing/'+s.image;if(img.getAttribute('src')!==src)img.src=src;img.alt='電視音量衛教第'+(k+1)+'幕';document.querySelector('#tvStoryCaption').textContent=s.caption;});
}

function renderBellMeter(){
  // One coordinate system: zero at y=420, 100 at y=20, threshold 80 at y=100.
  const ticks=[0,20,40,60,80,100].map(value=>{
    const y=420-value*4;
    return `<g class="meter-tick" data-value="${value}"><text x="42" y="${y}" text-anchor="end" dominant-baseline="middle">${value}</text><line x1="53" x2="166" y1="${y}" y2="${y}"/></g>`;
  }).join('');
  return `<svg class="calibrated-meter" viewBox="0 0 320 450" role="meter" data-volume-meter aria-label="評量音量，警戒線為 80" aria-valuemin="0" aria-valuemax="100" aria-valuenow="20"><defs><linearGradient id="bellLevelGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f7dc93"/><stop offset="100%" stop-color="#cc5d4d"/></linearGradient></defs><rect class="meter-track" x="62" y="20" width="96" height="400"/><rect id="tvVolumeFill" class="bell-fill" x="62" y="340" width="96" height="80" fill="url(#bellLevelGradient)"/>${ticks}<line class="meter-threshold" x1="55" x2="300" y1="100" y2="100"/><text class="threshold-caption" x="184" y="88">警戒線 80</text><text id="tvVolumeNumber" class="meter-number" x="232" y="367" text-anchor="middle">20</text><text class="meter-unit" x="232" y="400" text-anchor="middle">目前音量</text></svg>`;
}
function renderBellRound(round){
  return `<div class="bell-game"><section class="bell-device"><div class="bell-header"><strong>${round.title}</strong><span>音量觀察</span></div><div class="bell-lane-calibrated">${renderBellMeter()}</div></section><section class="bell-controls"><button id="alarmButton" class="alarm-button" type="button">按下警鈴</button><div id="bellStatus" class="target-status sr-only" role="status">等待本回合開始……</div></section></div>`;
}
async function tvAssessment(){
  const tk=tvToken,rd=state.tv.assessmentRound,round=tvAlertRounds[rd];
  state.tv.volume=20;save();
  const hp=tvShell(renderBellRound(round),'','tv-bell',TV().bell.hint);
  await hp;
  if(tk!==tvToken||!document.querySelector('#alarmButton'))return;
  const audioOK=startTvAudio('tv',20,false);
  const status=document.querySelector('#bellStatus'),alarmBtn=document.querySelector('#alarmButton');
  if(!audioOK)status.textContent='目前瀏覽器未啟動音效，但仍可依音量條完成判斷。';
  let step=0,aboveMs=0,canAlarm=false,pressed=false,pressedValid=false,ended=false;
  alarmBtn.disabled=false;
  status.textContent='觀察中';
  const updateStep=()=>{
    if(ended)return;
    const value=round.sequence[Math.min(step,round.sequence.length-1)];
    tvSetVolume(value);
    if(value>80)aboveMs+=300; else aboveMs=0;
    if(aboveMs>=1200)canAlarm=true;
    step++;
    if(step<round.sequence.length){tvLater(updateStep,300);}else{ended=true;alarmBtn.disabled=true;finishRound();}
  };
  alarmBtn.onclick=()=>{
    if(pressed||ended)return;
    pressed=true;
    if(canAlarm){pressedValid=true;status.textContent='已按下警鈴，等待本回合結束。';alarmBtn.classList.add('armed');}
    else {status.textContent='這一刻還不到需要警示的程度。';alarmBtn.classList.add('wrong');alarmBtn.disabled=true;}
  };
  async function finishRound(){
    let result,lines;
    if(round.shouldAlert){
      if(pressedValid){result='pass';lines=['判斷正確','這一回合音量偏大，而且持續超過一段時間，所以需要按下警鈴。'];}
      else if(pressed&&!pressedValid){result='press-early';lines=['再看一次規則','你按警鈴的時機太早了；要等到音量偏大且持續一段時間時再按。'];}
      else {result='missed';lines=['這次漏按了','這一回合音量已偏大，且持續超過 一段時間，屬於值得留意的情況。'];}
    }else{
      if(pressed){result='false-alarm';lines=['這次先不用按','這一回合音量雖然變大，但沒有高於 80 並持續超過一段時間，所以不需要按警鈴。'];}
      else {result='pass';lines=['判斷正確','這一回合音量沒有高於 80 並持續超過一段時間，所以觀察即可，不需要按警鈴。'];}
    }
    state.tv.assessmentResults[rd]=result;save();stopTvAudio();
    await R4.star(alarmBtn,4+rd+1);
    await R4.say(lines,{position:'center'});
    if(tk!==tvToken)return;
    if(rd<2){state.tv.assessmentRound++;save();tvAssessment();}else goTV('final');
  }
  updateStep();
}
function tvFinal(){
  const labels=state.tv.assessmentResults.map((r,i)=>{const title=`Round ${i+1}`;const text=r==='pass'?'判斷正確':r==='missed'?'漏按':r==='false-alarm'?'誤按': '按太早';return `<div><span>${title}</span><strong>${text}</strong><em>${i===0?'觀察即可，不要亂按': '音量偏大且持續一段時間，才需要警鈴'}</em></div>`;}).join('');
  tvShell(`<div class="volume-results">${labels}</div><p class="core">音量調節，本身就是一種觀察線索。<br>反覆偏大、而且維持一段時間，更值得留意。</p><div class="reminder">如果長者最近反覆把電視、手機或其他設備調得比以前更大聲，或被調小後又很快調回去，就可以多留意他的聽力狀況。</div><div class="actions">${action('tvClaim',state.tv.claimed?'完成回顧':'完成學習')}</div>`,'你完成了音量警鈴','tv-final',null);
  /* 第三修改計劃 B4:同一顆按鈕「完成學習」→ 寶物 →「返回聽力房」 */StoryDialog.finishButton(document.querySelector('#tvClaim'),{label:state.tv.claimed?'完成回顧':'完成學習',backLabel:'返回房間',finish:async()=>{if(state.tv.assessmentResults.length!==3)return;const first=!state.tv.claimed;if(first)await R4.say(TV().reward.map(x=>x.text),{position:'center'});state.tv.completed=true;state.tv.claimed=true;save();AchievementSystem.completeActivity('hearing','tv');if(first)await AchievementSystem.obtainItem('hearing_battery');},back:()=>room()});
}
function tvClue(){tvFinal();}

document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();stopTvAudio();clearTvTimers();if(state.view==='mission'&&state.module==='phone'&&state.stage==='assessment')updatePlayer();}});
window.addEventListener('pagehide',()=>{stop();cleanup();save();});
window.addEventListener('pageshow',event=>{if(event.persisted)render();});window.Hearing4={showRoom:room};save();render();
})();
