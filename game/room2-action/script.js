(()=>{
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));

const activities={
  sink:{hotspot:'洗手台', mission:'浴室安全接接樂', lines:['不是放進浴室的每樣東西都安全。','專用防滑墊與有止滑紋的浴室拖鞋，能增加抓地力。','鞋底磨平的拖鞋止滑力不足，走在濕地面更容易滑倒。','鬆動、沒有止滑底的厚布地毯容易吸水、皺起或滑動，較不適合放在浴室。']},
  stand:{hotspot:'馬桶＋扶手', mission:'行動記憶翻翻樂', lines:['擔心跌倒時，很多人會越來越不敢動。','但完全不動，反而會讓肌力與平衡持續下降。','起身時可以扶穩扶手、放慢速度。','先站穩，再開始走動，能降低頭暈或重心不穩的風險。']},
  shower:{hotspot:'淋浴區', mission:'淋浴區安全配置', lines:['洗澡不是不能做，而是要把環境安排得更安全。','固定扶手要裝在方便抓握、又有牆面支撐的位置。','沐浴椅放在洗澡坐姿區，防滑墊放在容易踩到積水的濕區腳下。','乾濕分離能減少整個浴室都濕滑的機會。']},
  medkit:{hotspot:'醫藥箱', mission:'醫療資源道路拼接', lines:['反覆站不穩，不只是自己多小心就好。','若活動能力明顯下降，最好進一步接受評估。','醫療或復健等專業協助，可以幫忙找原因並安排改善方向。','及早尋求專業協助，往往比真的跌倒後才處理更好。']},
  shoes:{hotspot:'鞋櫃／浴室鞋', mission:'安全鞋擊退戰', lines:['不同情境，要選不同的鞋。','浴室濕滑地面應選擇有止滑設計、適合濕區的浴室拖鞋。','外出行走則應選擇能包覆腳部、固定性與支撐較好的鞋款，避免穿容易鬆脫的拖鞋。','鞋款選對還不夠：如果鞋底紋路已磨平、抓地力下降，也應提高警覺並適時更換。']}
};
const PROTO_STAND=new URLSearchParams(location.search).get('proto')==='stand';
if(PROTO_STAND){ const l=document.createElement('link'); l.rel='stylesheet'; l.href='proto-stand.css'; document.head.appendChild(l); const sc=document.createElement('script'); sc.src='proto-stand.js'; document.head.appendChild(sc); }
const state={current:null,completed:new Set(AchievementSystem.getRoomProgress("mobility").completedActivities),elapsed:0,timer:null,cleanup:null,lessonIndex:0,shoesPostDone:false};
const K=window.StoryKit, C2=window.StoryCopy.room2;
const barEl=()=>$('#activityProgress');
const seenPhase=new Set();
state.run=0; state.hintText=''; state.pausable=null;
const alive=run=>run===state.run && !$('#activityView').hidden;
/* 進入某一段:記下「操作提示」按鈕的內容;該段第一次進入時由 NPC 對話框提示(會等對話結束才 resolve) */
function enterPhase(id,hint){
  state.hintText=hint.button;
  if(seenPhase.has(id)) return Promise.resolve();
  seenPhase.add(id);
  return K.showHint(hint.lines);
}
function setExtra(el){ $('#hintExtra').replaceChildren(...(el?[el]:[])); }
const openBoardZoom = $('#openBoardZoom');
const boardZoomOverlay = $('#boardZoomOverlay');
const closeBoardZoom = $('#closeBoardZoom');
const closeBoardZoomTop = $('#closeBoardZoomTop');
const boardZoomStage = $('#boardZoomStage');
const boardZoomCanvas = $('#boardZoomCanvas');
const boardZoomImage = $('#boardZoomImage');
const boardZoomIn = $('#boardZoomIn');
const boardZoomOut = $('#boardZoomOut');
const boardZoomReset = $('#boardZoomReset');
const boardZoomLabel = $('#boardZoomLabel');


function formatTime(sec){const m=String(Math.floor(sec/60)).padStart(2,'0'); const s=String(sec%60).padStart(2,'0'); return `${m}:${s}`;}
function startTimer(){if(AchievementSystem.getRoomProgress("mobility").completed || state.timer)return; state.timer=setInterval(()=>{$('#timer').textContent=`🕰️ ${formatTime(++state.elapsed)}`;},1000);}
function stopTimer(){clearInterval(state.timer); state.timer=null;}
function cleanup(){ if(typeof state.cleanup==='function'){ state.cleanup(); state.cleanup=null; } state.pausable=null; }
function show(view){ cleanup(); closeBoardZoomOverlay(); ['room','activity','lesson','note','board'].forEach(v=>{const el=document.getElementById(v+'View'); if(el) el.hidden=v!==view;}); $('#codeOverlay').hidden=true; }
function speak(text){ try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang='zh-TW'; speechSynthesis.speak(u);}catch(e){} }
function updateRoom(){ $('#doneCount').textContent=state.completed.size; $$('.hotspot').forEach(btn=>btn.classList.toggle('done',state.completed.has(btn.dataset.key))); }
function setFeedback(type,msg){ const f=$('#activityFeedback'); f.hidden=false; f.className=`feedback ${type}`; f.innerHTML=msg; }
function clearFeedback(){ $('#activityFeedback').hidden=true; $('#activityFeedback').textContent=''; }
function hideContinue(){ const btn=$('#activityContinue'); btn.hidden=true; btn.onclick=null; }
function completeRoom(){ stopTimer(); if(window.parent!==window){ window.parent.postMessage({type:'memoryMaze:room2Complete',elapsedSeconds:state.elapsed},'*'); } else { history.back(); } }
function startActivity(key){
  if(key==='sink') renderCatchItemPreview();
  else if(key==='stand'){ if(PROTO_STAND&&window.Room2StandProto) startProto(); else renderMemoryGame(); }
  else if(key==='shower') renderShowerGame();
  else if(key==='medkit') startMedkit();
  else if(key==='shoes') renderShoeShelf();
}
function startProto(){
  window.Room2StandProto.start({clearFeedback,hideContinue,openLesson,K,C2,enterPhase,setExtra,bar:barEl,alive:()=>alive(state.run)});
}
function openActivity(key){
  state.current=key; state.run++;
  if(key==='shoes') state.shoesPostDone=false;
  clearFeedback(); hideContinue(); show('activity'); setExtra(null);
  $('#activityTitle').textContent=activities[key].mission;
  startActivity(key);
}
$('#hintBtn').onclick=()=>{ const p=state.pausable; if(p&&p.pause)p.pause(); K.showHint(state.hintText||'',{clear:!!p}).then(()=>{ if(p&&p.resume)p.resume(); }); };

/* sink */

function renderCatchItemPreview(){
  clearFeedback(); hideContinue(); K.makeBar(barEl(),5);
  const items=[
    {id:'bath-slippers',name:'排水拖鞋',img:'assets/shoe-bath-clean.png',note:'日常可作為洗澡或進出浴室時穿著的拖鞋，材質通常較容易清潔與乾燥。'},
    {id:'bath-mat',name:'防滑墊',img:'assets/catch-good-mat2.png',note:'可鋪設在地面，提供踩踏區域，常見於浴室或其他容易有水氣的空間。'},
    {id:'indoor-slippers',name:'室內拖鞋',img:'assets/shoe-indoor-clean.png',note:'主要用於居家室內行走，讓雙腳較舒適，也能減少直接踩踏冰冷或粗糙地面。'},
    {id:'thick-rug',name:'厚地墊',img:'assets/catch-bad-thick-rug2.png',note:'常用於居家空間增加柔軟度、保暖感與踩踏舒適度，也能作為空間佈置的一部分。'}
  ];
  const viewed=new Set();
  let selected=items[0];
  function render(){
    $('#activityBody').innerHTML=`<div class="catch-preview-wrap">
      <div class="catch-preview-grid">${items.map(i=>`<button class="catch-preview-card ${selected.id===i.id?'selected':''} ${viewed.has(i.id)?'viewed':''}" data-catch-preview="${i.id}" type="button"><img src="${i.img}" alt="${i.name}"><b>${i.name}</b>${viewed.has(i.id)?'<span class="viewed-badge">已查看</span>':''}</button>`).join('')}</div>
      <div class="catch-preview-detail">
        <div class="shoe-detail-head"><div><p class="eyebrow">這是什麼？</p><h3>${selected.name}</h3></div></div>
        <img class="catch-preview-photo" src="${selected.img}" alt="${selected.name}">
        <p class="catch-preview-message">${selected.note}</p>
        <div class="center"><button id="startCatchAfterPreview" class="primary" type="button" ${viewed.size===4?'':'hidden'}>開始任務 ▶</button></div>
      </div>
    </div>`;
    document.querySelectorAll('[data-catch-preview]').forEach(btn=>btn.onclick=()=>{
      selected=items.find(i=>i.id===btn.dataset.catchPreview) || items[0];
      const first=!viewed.has(selected.id); viewed.add(selected.id);
      if(first) K.awardStar(btn,barEl(),viewed.size);
      render();
    });
    const start=$('#startCatchAfterPreview');
    if(start) start.onclick=renderCatchGame;
  }
  render();
  enterPhase('sink-preview',C2.sink.previewHint);
}

function renderCatchGame(){
  clearFeedback(); hideContinue(); const run=state.run;
  const body=$('#activityBody');
  body.innerHTML=`<div class="catch-ui"><div class="catch-stage" id="catchStage"><div class="catch-backdrop"></div><div id="catchLane" class="catch-lane"></div><div id="basket" class="basket"><img class="asset-pixel" src="assets/catch-basket.png" alt="整理籃"></div></div><div class="catch-stats"><div class="stat-pill">接到安全物：<span id="goodCount">0</span></div><div class="stat-pill">誤接危險物：<span id="badCount">0</span></div><div class="stat-pill">剩餘時間：<span id="catchTime">20</span> 秒</div></div><div class="catch-controls"><button id="leftBtn" class="secondary catch-arrow" type="button">←</button><button id="rightBtn" class="secondary catch-arrow" type="button">→</button></div></div>`;
  const stage=$('#catchStage'), lane=$('#catchLane'), basket=$('#basket');
  const itemDefs=[
    {src:'assets/shoe-bath-clean.png',good:true},
    {src:'assets/catch-good-mat2.png',good:true},
    {src:'assets/shoe-indoor-clean.png',good:false},
    {src:'assets/catch-bad-thick-rug2.png',good:false}
  ];
  let goodCount=0,badCount=0,time=20,basketX=stage.clientWidth/2,spawnTimer=null,gameTimer=null,raf=null,ended=false; const items=[];
  function setBasket(){basket.style.left=`${basketX}px`;}
  function moveBy(dx){basketX=Math.max(84,Math.min(stage.clientWidth-84,basketX+dx)); setBasket();}
  function movePointer(clientX){const rect=stage.getBoundingClientRect(); basketX=Math.max(84,Math.min(rect.width-84,clientX-rect.left)); setBasket();}
  function spawn(){ if(ended)return; const def=itemDefs[Math.floor(Math.random()*itemDefs.length)]; const el=document.createElement('div'); el.className='falling'; el.innerHTML=`<img src="${def.src}" alt="">`; lane.appendChild(el); items.push({x:70+Math.random()*(stage.clientWidth-140),y:-90,s:2.4+Math.random()*1.3,good:def.good,el}); }
  function pop(txt,x,y,good){ const p=document.createElement('div'); p.className=`float-score ${good?'good':'bad'}`; p.textContent=txt; p.style.left=`${x}px`; p.style.top=`${y}px`; stage.appendChild(p); setTimeout(()=>p.remove(),850); }
  function loop(){
    for(let i=items.length-1;i>=0;i--){
      const o=items[i]; o.y+=o.s; o.el.style.left=`${o.x}px`; o.el.style.top=`${o.y}px`;
      if(o.y>stage.clientHeight-135 && Math.abs(o.x-basketX)<80){
        if(o.good){ goodCount++; $('#goodCount').textContent=goodCount; pop('+安全',o.x,o.y,true); }
        else { badCount++; $('#badCount').textContent=badCount; pop('+危險',o.x,o.y,false); }
        o.el.remove(); items.splice(i,1);
      } else if(o.y>stage.clientHeight+20){ o.el.remove(); items.splice(i,1); }
    }
    raf=requestAnimationFrame(loop);
  }
  function startTimers(){
    spawnTimer=setInterval(spawn,730);
    gameTimer=setInterval(()=>{time--; $('#catchTime').textContent=time; if(time<=0) endGame();},1000);
    raf=requestAnimationFrame(loop);
  }
  function stopTimers(){ clearInterval(spawnTimer); clearInterval(gameTimer); cancelAnimationFrame(raf); spawnTimer=gameTimer=raf=null; }
  async function endGame(){
    if(ended)return; ended=true; stopTimers(); window.removeEventListener('keydown',keyHandler); state.pausable=null;
    const success = goodCount>=5 && badCount<=2;
    AchievementSystem.learning.assessment('mobility','sink',success,{goodCount,badCount,retryTriggered:!success});
    if(success){
      await K.awardStar(stage,barEl(),5);
      await K.say(C2.sink.success);
      if(alive(run)) openLesson('sink');
    } else {
      await K.askButtons(C2.sink.fail(goodCount,badCount),[{label:C2.sink.retry,value:true}]);
      if(alive(run)) renderCatchGame();
    }
  }
  function keyHandler(e){ if(e.key==='ArrowLeft') moveBy(-45); if(e.key==='ArrowRight') moveBy(45); }
  setBasket(); stage.addEventListener('mousemove',e=>movePointer(e.clientX)); stage.addEventListener('touchmove',e=>movePointer(e.touches[0].clientX),{passive:true}); $('#leftBtn').onclick=()=>moveBy(-55); $('#rightBtn').onclick=()=>moveBy(55); window.addEventListener('keydown',keyHandler);
  state.cleanup=()=>{ended=true; stopTimers(); window.removeEventListener('keydown',keyHandler);};
  enterPhase('sink-catch',C2.sink.catchHint).then(()=>{
    if(ended||!alive(run))return;
    state.pausable={pause:stopTimers,resume:()=>{ if(!ended&&!spawnTimer) startTimers(); }};
    spawn(); startTimers();
  });
}

/* stand memory */
function renderMemoryGame(){
  clearFeedback(); hideContinue(); K.makeBar(barEl(),4); const run=state.run;
  const cards=[
    {pair:0,img:'assets/memory-card-1.png',type:'做法',text:'扶穩扶手'},
    {pair:0,img:'assets/memory-card-2.png',type:'提醒',text:'幫助站穩起身'},
    {pair:1,img:'assets/memory-card-3.png',type:'做法',text:'防滑鞋'},
    {pair:1,img:'assets/memory-card-4.png',type:'提醒',text:'走動更有抓地力'},
    {pair:2,img:'assets/memory-card-5.png',type:'做法',text:'站穩再走'},
    {pair:2,img:'assets/memory-card-6.png',type:'提醒',text:'起身後先停一下再前進'},
    {pair:3,img:'assets/memory-card-7.png',type:'做法',text:'適度活動'},
    {pair:3,img:'assets/memory-card-8.png',type:'提醒',text:'久坐不動會讓肌力下降'}
  ].sort(()=>Math.random()-.5);
  $('#activityBody').innerHTML=`<div class="memory-wrap"><div class="memory-grid">${cards.map(c=>`<button class="memory-card" data-pair="${c.pair}" type="button"><div class="memory-inner"><div class="memory-face memory-front"><div class="memory-icon">🃏</div><small>翻開看看</small></div><div class="memory-face memory-back image-card"><img src="${c.img}" alt="${c.type}：${c.text}"></div></div></button>`).join('')}</div></div>`;
  enterPhase('flip',C2.stand.flip.hint);
  let first=null, lock=false, matched=0, misses=0;
  $$('.memory-card').forEach(btn=>btn.onclick=()=>{
    if(lock||btn.classList.contains('done')||btn===first) return;
    btn.classList.add('open');
    if(!first){ first=btn; return; }
    lock=true;
    if(first.dataset.pair===btn.dataset.pair){
      first.classList.add('done'); btn.classList.add('done'); matched++;
      const star=K.awardStar(btn,barEl(),matched);
      setTimeout(async()=>{
        first=null;
        if(matched===4){ AchievementSystem.learning.assessment('mobility','stand',true,{matched,retryTriggered:false}); await star; await K.say(C2.stand.flip.done); lock=false; if(alive(run)) openLesson('stand'); }
        else lock=false;
      },360);
    } else {
      misses++; const a=first,b=btn;
      setTimeout(async()=>{
        a.classList.remove('open'); b.classList.remove('open'); first=null;
        /* 翻錯第 1、4、7… 次才由 NPC 提醒,避免太常打斷 */
        if((misses-1)%3===0){ const m=C2.stand.flip.miss; await K.say(m[Math.floor((misses-1)/3)%m.length]); }
        lock=false;
      },820);
    }
  });
}

/* shower */
function renderShowerGame(){
  clearFeedback(); hideContinue(); K.makeBar(barEl(),4); const run=state.run;
  const items=[
    {id:'bar',name:'固定扶手',img:'assets/shower-grabbar.png',target:'wall'},
    {id:'chair',name:'沐浴椅',img:'assets/shower-chair.png',target:'seat'},
    {id:'mat',name:'防滑墊',img:'assets/shower-mat.png',target:'floor'},
    {id:'rug',name:'鬆動厚布地毯',img:'assets/shower-rug.png',target:'remove'}
  ];
  $('#activityBody').innerHTML=`<div class="shower-layout refined"><div class="items-column"><h3>選擇物件</h3>${items.map(i=>`<button class="item-chip" data-id="${i.id}" data-target="${i.target}" type="button"><img class="asset-pixel" src="${i.img}" alt="${i.name}"><div><b>${i.name}</b></div></button>`).join('')}</div><div class="shower-illustration refined"><img class="shower-bg" src="assets/shower-dry-wet-empty.png" alt="乾濕分離浴室"><div class="zone-label z-wall">牆邊扶手</div><div class="zone-label z-seat">洗澡坐姿區</div><div class="zone-label z-floor">濕區腳下</div><div class="zone-label z-remove">移出浴室</div><button class="drop-spot remove-spot" data-zone="remove" aria-label="移出浴室" type="button"></button><button class="drop-spot wall-spot" data-zone="wall" aria-label="牆邊扶手區" type="button"></button><button class="drop-spot seat-spot" data-zone="seat" aria-label="洗澡坐姿區" type="button"></button><button class="drop-spot floor-spot" data-zone="floor" aria-label="濕區腳下" type="button"></button></div></div>`;
  enterPhase('shower',C2.shower.hint);
  let selected=null; const placed=new Set();
  $$('.item-chip').forEach(btn=>btn.onclick=()=>{ if(btn.classList.contains('disabled')) return; $$('.item-chip').forEach(x=>x.classList.remove('selected')); btn.classList.add('selected'); selected=btn; clearFeedback(); });
  $$('.drop-spot').forEach(spot=>spot.onclick=async()=>{
    if(spot.classList.contains('filled')) return;
    if(!selected){ await K.say(C2.shower.needSelect); return; }
    if(selected.dataset.target!==spot.dataset.zone){ await K.say(C2.shower.wrong); return; }
    placed.add(selected.dataset.id); selected.classList.add('disabled'); selected.classList.remove('selected');
    spot.classList.add('filled'); spot.innerHTML=`<img class="asset-pixel" src="${selected.querySelector('img').src}" alt="${selected.querySelector('b').textContent}">`;
    selected=null; clearFeedback();
    await K.awardStar(spot,barEl(),placed.size);
    if(placed.size===4){ await K.say(C2.shower.done); if(alive(run)) openLesson('shower'); }
  });
}

/* medkit */
const resourceData={
  '北區':[
    {name:'國立成功大學醫學院附設醫院',address:'台南市北區勝利路138號',phone:'06-2353535'},
    {name:'翔安臺灣物理治療所',address:'台南市北區北成路31號',phone:'0919-636-697'},
    {name:'飛翔居家物理治療所',address:'臺南市北區東豐路305巷46號1樓',phone:'0966-105-953'},
    {name:'太和居家職能治療所',address:'台南市北區北成路402巷61弄15號',phone:'0933-916-853'}
  ],
  '永康區':[
    {name:'高雄榮民總醫院台南分院',address:'台南市永康區復興路427號',phone:'06-3125101'},
    {name:'奇美醫療財團法人奇美醫院',address:'台南市永康區中華路901號',phone:'06-2812811'},
    {name:'心物語物理治療所',address:'台南市永康區東橋一路396號',phone:'06-3025797'}
  ],
  '南區':[
    {name:'臺南市南區衛生所',address:'台南市南區南和路6號',phone:'06-2618578'},
    {name:'佑誠居家職能治療所',address:'臺南市南區灣裡路67號；台南市北區臨安路二段249巷18號',phone:'0938-826-516'}
  ]
};
const DIRS=['N','E','S','W']; const OPP={N:'S',E:'W',S:'N',W:'E'}; const DELTA={N:[-1,0],E:[0,1],S:[1,0],W:[0,-1]}; const SHAPE_SIDES={straight:['N','S'],corner:['N','E'],tee:['N','E','W']};
function makeDecoyTiles(overrides={}){const base=[];const shapes=['corner','straight','corner','tee','straight'];for(let r=0;r<5;r++)for(let c=0;c<5;c++){const key=`${r}-${c}`;base.push({row:r,col:c,shape:shapes[(r*2+c)%shapes.length],rot:((r*3+c*2+1)%4),role:'normal',label:''});if(overrides[key])Object.assign(base[base.length-1],overrides[key]);}return base;}
const emergencyMissions=[
  {person:'爺爺',story:'住在北區的爺爺最近走路比較不穩。請幫他找到物理治療相關資源，並先確認聯絡電話。',conditions:['北區','物理治療所','電話'],unit:{name:'翔安臺灣物理治療所',district:'北區',address:'台南市北區北成路31號',phone:'0919-636-697'},start:[2,0,'E'],end:[4,4,'N'],tiles:makeDecoyTiles({'2-0':{role:'start',label:'需求'},'2-1':{shape:'straight',rot:1,role:'condition',label:'北區'},'2-2':{shape:'corner',rot:3},'1-2':{shape:'straight',rot:0},'0-2':{shape:'corner',rot:1},'0-3':{shape:'straight',rot:1,role:'condition',label:'物理治療所'},'0-4':{shape:'corner',rot:2},'1-4':{shape:'straight',rot:0,role:'condition',label:'電話'},'2-4':{shape:'straight',rot:0},'3-4':{shape:'straight',rot:0},'4-4':{role:'end',label:'目標'}}),scramble:{'2-1':0,'2-2':0,'1-2':1,'0-2':0,'0-3':0,'0-4':1,'1-4':1,'2-4':1,'3-4':1}},
  {person:'王大爺',story:'王大爺住在南區，最近在家活動時常覺得動作不順。家人想找職能治療相關資源並確認電話。',conditions:['南區','職能治療所','電話'],unit:{name:'佑誠居家職能治療所',district:'南區',address:'臺南市南區灣裡路67號；台南市北區臨安路二段249巷18號',phone:'0938-826-516'},start:[4,0,'E'],end:[0,0,'E'],tiles:makeDecoyTiles({'4-0':{role:'start',label:'需求'},'4-1':{shape:'corner',rot:3},'3-1':{shape:'straight',rot:0,role:'condition',label:'南區'},'2-1':{shape:'corner',rot:1},'2-2':{shape:'straight',rot:1},'2-3':{shape:'corner',rot:3},'1-3':{shape:'straight',rot:0,role:'condition',label:'職能治療所'},'0-3':{shape:'corner',rot:2},'0-2':{shape:'straight',rot:1,role:'condition',label:'電話'},'0-1':{shape:'straight',rot:1},'0-0':{role:'end',label:'目標'}}),scramble:{'4-1':1,'3-1':1,'2-1':0,'2-2':0,'2-3':1,'1-3':1,'0-3':0,'0-2':0,'0-1':0}},
  {person:'陳奶奶',story:'陳奶奶人在永康區，最近反覆站不穩。家人想先找到醫院並確認聯絡電話，方便詢問後續評估與就醫資訊。',conditions:['永康區','醫院','電話'],unit:{name:'奇美醫療財團法人奇美醫院',district:'永康區',address:'台南市永康區中華路901號',phone:'06-2812811'},start:[0,0,'E'],end:[4,0,'E'],tiles:makeDecoyTiles({'0-0':{role:'start',label:'需求'},'0-1':{shape:'straight',rot:1},'0-2':{shape:'corner',rot:2},'1-2':{shape:'straight',rot:0,role:'condition',label:'永康區'},'2-2':{shape:'corner',rot:0},'2-3':{shape:'straight',rot:1,role:'condition',label:'醫院'},'2-4':{shape:'corner',rot:2},'3-4':{shape:'straight',rot:0},'4-4':{shape:'corner',rot:3},'4-3':{shape:'straight',rot:1,role:'condition',label:'電話'},'4-2':{shape:'straight',rot:1},'4-1':{shape:'straight',rot:1},'4-0':{role:'end',label:'目標'}}),scramble:{'0-1':0,'0-2':0,'1-2':1,'2-2':1,'2-3':0,'2-4':0,'3-4':1,'4-4':1,'4-3':0,'4-2':0,'4-1':0}}
];
let currentEmergencyMission=0,completedEmergencyMissions=0,currentPuzzleTiles=[],missionSolved=false;
function startMedkit(){
  completedEmergencyMissions=0; K.makeBar(barEl(),3);
  startEmergencyMission(0);
  enterPhase('medkit',C2.medkit.hint);
}
function rotateSides(sides,rot){return sides.map(side=>DIRS[(DIRS.indexOf(side)+rot)%4]);}
function tileSides(tile){const m=emergencyMissions[currentEmergencyMission]; if(tile.role==='start') return [m.start[2]]; if(tile.role==='end') return [m.end[2]]; return rotateSides(SHAPE_SIDES[tile.shape]||[],tile.rot%4);}
function getTileAt(row,col){return currentPuzzleTiles.find(t=>t.row===row&&t.col===col)||null;}
function startEmergencyMission(index){
  currentEmergencyMission=index; missionSolved=false; const mission=emergencyMissions[index];
  currentPuzzleTiles=mission.tiles.map(tile=>{const c={...tile};const key=`${c.row}-${c.col}`;if(mission.scramble[key]!==undefined&&c.role!=='start'&&c.role!=='end')c.rot=mission.scramble[key];return c;});
  $('#activityBody').innerHTML=`<div class="emergency-layout"><aside class="emergency-paper"><p class="eyebrow">緊急任務</p><div class="mission-note"><p class="eyebrow">任務對象</p><h3>${mission.person}</h3><p>${mission.story}</p><hr><h4>指定條件</h4><div class="mission-condition-list">${mission.conditions.map(c=>`<div><span>●</span><b>${c}</b></div>`).join('')}</div></div></aside><section class="emergency-board-wrap"><div class="route-topbar"><b class="mb-label-removed" aria-hidden="true" style="visibility:hidden"></b><b id="missionProgressText"></b><b class="mb-label-removed" aria-hidden="true" style="visibility:hidden"></b></div><div id="routeBoard" class="route-board route-board-large"></div><div id="missionConditionStatus" class="condition-status">${mission.conditions.map(c=>`<span data-condition-status="${c}">○ ${c}</span>`).join('')}</div><p id="puzzleLiveHint" class="small center route-brief"></p></section></div>`;
  renderRoutePuzzle(); updatePuzzleConnectivity();
}
function renderRoutePuzzle(){const board=$('#routeBoard');board.innerHTML='';currentPuzzleTiles.forEach((tile,index)=>{const cell=document.createElement('button');cell.type='button';cell.className=`route-tile role-${tile.role||'normal'}`;cell.dataset.index=index;if(tile.role==='start'||tile.role==='end'){cell.disabled=true;cell.classList.add('is-fixed');}cell.innerHTML=`<span class="route-pipe"><i class="pipe-center"></i><i class="pipe-arm arm-n"></i><i class="pipe-arm arm-e"></i><i class="pipe-arm arm-s"></i><i class="pipe-arm arm-w"></i></span>${tile.label?`<span class="route-tile-label">${tile.label}</span>`:''}`;cell.onclick=()=>rotatePuzzleTile(index);board.appendChild(cell);paintTile(cell,tile);});}
function paintTile(cell,tile){const pipe=cell.querySelector('.route-pipe');pipe.className='route-pipe';tileSides(tile).forEach(side=>pipe.classList.add(`side-${side.toLowerCase()}`));}
function rotatePuzzleTile(index){if(missionSolved)return;const tile=currentPuzzleTiles[index];if(!tile||tile.role==='start'||tile.role==='end')return;tile.rot=(tile.rot+1)%4;paintTile($('#routeBoard').querySelector(`[data-index="${index}"]`),tile);updatePuzzleConnectivity();}
function updatePuzzleConnectivity(){
  const mission=emergencyMissions[currentEmergencyMission], start=getTileAt(mission.start[0],mission.start[1]); if(!start)return;
  const visited=new Set([`${start.row}-${start.col}`]),queue=[start];
  while(queue.length){const tile=queue.shift();for(const side of tileSides(tile)){const [dr,dc]=DELTA[side],next=getTileAt(tile.row+dr,tile.col+dc);if(!next||!tileSides(next).includes(OPP[side]))continue;const key=`${next.row}-${next.col}`;if(!visited.has(key)){visited.add(key);queue.push(next);}}}
  $$('#routeBoard .route-tile').forEach((cell,i)=>{const t=currentPuzzleTiles[i];cell.classList.toggle('is-connected',visited.has(`${t.row}-${t.col}`));});
  const reached=new Set(); currentPuzzleTiles.forEach(t=>{if(t.role==='condition'&&visited.has(`${t.row}-${t.col}`)) reached.add(t.label);});
  mission.conditions.forEach(c=>{const el=$(`[data-condition-status="${c}"]`); if(el){const ok=reached.has(c); el.classList.toggle('is-reached',ok); el.textContent=`${ok?'✓':'○'} ${c}`;}});
  const success=visited.has(`${mission.end[0]}-${mission.end[1]}`)&&mission.conditions.every(c=>reached.has(c));
  $('#puzzleLiveHint').textContent=`已接通 ${reached.size}／${mission.conditions.length} 個條件${visited.has(`${mission.end[0]}-${mission.end[1]}`)?'，目標已接通':''}。`;
  if(success) completeEmergencyMission();
}
function completeEmergencyMission(){
  if(missionSolved) return; missionSolved=true; completedEmergencyMissions=Math.max(completedEmergencyMissions,currentEmergencyMission+1); $$('#routeBoard button').forEach(b=>b.disabled=true); const m=emergencyMissions[currentEmergencyMission]; const run=state.run; const idx=currentEmergencyMission;
  setTimeout(async()=>{
    await K.awardStar($('#routeBoard')||barEl(),barEl(),completedEmergencyMissions);
    await K.say(C2.medkit.solved(m.person));
    if(!alive(run)) return;
    $('#activityBody').innerHTML=`<div class="result-panel success"><h3>任務 ${idx+1} 完成！</h3><div class="resource-result-card"><b>${m.unit.name}</b><span>${m.unit.district}</span><small>${m.unit.address}<br>${m.unit.phone}</small></div><button id="nextEmergency" class="primary" type="button">${idx<emergencyMissions.length-1?'下一個任務':'前往資源查找'} ▶</button></div>`;
    $('#nextEmergency').onclick=async()=>{
      if(idx<emergencyMissions.length-1){ startEmergencyMission(idx+1); return; }
      seenPhase.add('medkit-query');
      await K.showHint([...C2.medkit.toQuery,...C2.medkit.queryHint.lines]);
      if(alive(run)) renderResourceQueryAfterMission();
    };
  },450);
}
function renderResourceQueryAfterMission(){
  K.makeBar(barEl(),3); state.hintText=C2.medkit.queryHint.button;
  $('#activityBody').innerHTML=`<div class="resource-query"><div class="district-row">${Object.keys(resourceData).map(d=>`<button class="district-btn" data-d="${d}" type="button">${d}</button>`).join('')}</div><div id="unitArea" class="unit-area"></div><div class="center"><button id="finishResourceQuery" class="primary" type="button" hidden>完成查找 ▶</button></div></div>`;
  const visited=new Set();
  $$('.district-btn').forEach(btn=>btn.onclick=()=>{ $$('.district-btn').forEach(x=>x.classList.remove('selected')); btn.classList.add('selected'); const d=btn.dataset.d; const first=!visited.has(d); visited.add(d); $('#unitArea').innerHTML=`<h3>${d}的醫療資源</h3><div class="unit-grid">${resourceData[d].map(u=>`<div class="unit-card2"><b>${u.name}</b><small>${u.address}<br>${u.phone}</small></div>`).join('')}</div>`; if(first) K.awardStar(btn,barEl(),visited.size); if(visited.size===Object.keys(resourceData).length) $('#finishResourceQuery').hidden=false; });
  $('#finishResourceQuery').onclick=()=>openLesson('medkit');
}

/* shoes */
const SHOE_LIBRARY=[
  {id:'bath', name:'浴室拖鞋', img:'assets/shoe-bath-clean.png', note:'適合浴室濕區使用；重點是鞋底要有止滑設計，並留意磨損。', soleOkay:'assets/sole-bath-medium-clean.png', soleBad:'assets/sole-bath-severe-clean.png'},
  {id:'outdoor', name:'外出布鞋', img:'assets/shoe-outdoor-elder.png', note:'外出行走時選擇包覆腳部、固定性與支撐較好的鞋款。', soleOkay:'assets/sole-outdoor-light-clean.png', soleBad:'assets/sole-outdoor-severe-clean.png'}
];
function renderShoeShelf(){
  clearFeedback(); hideContinue(); K.makeBar(barEl(),4);
  const viewed=new Set(['bath']); K.setBar(barEl(),1);
  function render(selectedId='bath'){
    const selected=SHOE_LIBRARY.find(s=>s.id===selectedId) || SHOE_LIBRARY[0];
    $('#activityBody').innerHTML=`<div class="shoe-hub simplified"><div class="shoe-cabinet two-shoes">${SHOE_LIBRARY.map(s=>`<button class="shoe-kind-card ${selected.id===s.id?'selected':''} ${viewed.has(s.id)?'viewed':''}" data-shoe-id="${s.id}" type="button"><img src="${s.img}" alt="${s.name}"><b>${s.name}</b>${viewed.has(s.id)?'<span class="viewed-badge">已查看</span>':''}</button>`).join('')}</div><div class="shoe-detail-panel"><div class="shoe-detail-head"><div><h3>${selected.name}</h3></div></div><img class="shoe-detail-photo" src="${selected.img}" alt="${selected.name}"><p class="shoe-key-message">${selected.note}</p><div class="sole-wear-guide"><h4>再看鞋底磨損程度</h4><div class="sole-wear-grid"><div class="sole-wear-card okay"><span class="sole-status">✓ 還可以</span><img src="${selected.soleOkay}" alt="${selected.name}鞋底，仍可辨識止滑紋路"><p>鞋底紋路仍看得清楚，持續留意磨損情況。</p></div><div class="sole-wear-card bad"><span class="sole-status">✕ 不可以</span><img src="${selected.soleBad}" alt="${selected.name}鞋底過度磨損"><p>紋路已明顯磨平，抓地力下降，應立即更換。</p></div></div><p class="sole-discard-warning">⚠ 鞋底過度磨損一定要丟掉、更換新鞋，不要因為捨不得而繼續穿！</p></div><div class="center"><button id="startScenarioChallenge" class="primary" type="button" ${viewed.size===2?'':'hidden'}>開始情境挑戰 ▶</button></div></div></div>`;
    $$('.shoe-kind-card').forEach(btn=>btn.onclick=()=>{ const id=btn.dataset.shoeId; const first=!viewed.has(id); viewed.add(id); if(first) K.awardStar(btn,barEl(),viewed.size); render(id); });
    const startBtn=$('#startScenarioChallenge'); if(startBtn) startBtn.onclick=renderShoesPostTest;
  }
  render('bath');
  enterPhase('shoes-shelf',C2.shoes.shelfHint);
}
function renderShoesPostTest(){
  show('activity'); clearFeedback(); hideContinue(); setExtra(null);
  const run=state.run;
  const rounds=[
    {name:'第一關｜濕滑浴室', q:'浴室地面濕滑，哪些鞋不該留在這裡？', scene:'assets/scenario-bath.png', safe:'bath', safeName:'浴室拖鞋', bad:[{name:'外出布鞋',img:'assets/shoe-outdoor-elder.png'},{name:'室內布拖鞋',img:'assets/shoe-indoor-clean.png'},{name:'涼鞋',img:'assets/shoe-sandal-transparent.png'}], safeImg:'assets/shoe-bath-clean.png', hint:'浴室濕區要保留有止滑設計、適合濕區的浴室拖鞋。'},
    {name:'第二關｜戶外行走', q:'爺爺要出門走路，哪些鞋不適合穿出去？', scene:'assets/scenario-outdoor.png', safe:'outdoor', safeName:'外出布鞋', bad:[{name:'浴室拖鞋',img:'assets/shoe-bath-clean.png'},{name:'室內布拖鞋',img:'assets/shoe-indoor-clean.png'},{name:'涼鞋',img:'assets/shoe-sandal-transparent.png'}], safeImg:'assets/shoe-outdoor-elder.png', hint:'戶外行走要保留包覆腳部、較能固定腳的外出鞋款。'}
  ];
  let roundIndex=0;
  async function playRound(r,intro){
    let score=0,lives=3,timeLeft=30,ended=false,paused=false,spawnTimer=null,countdownTimer=null,raf=null,last=0; const movers=[];
    $('#activityBody').innerHTML=`<div class="shoot-game"><div class="shoot-hud"><span class="hud-round">${r.name}</span><span>🎯 擊退：<b id="shootScore">0</b>／6</span><span>❤️ 機會：<b id="shootLives">3</b></span><span class="time-pill">⏱ 剩餘時間：<b id="shootTime">30</b> 秒</span></div><div id="shootStage" class="shoot-stage" style="--scene:url('${r.scene}')"><div id="shootTargets"></div></div></div>`;
    const stage=$('#shootStage'), targetLayer=$('#shootTargets');
    /* 第三修改計劃新增 C2:背景圖上原有藍色「浴室濕區」、綠色「一般室外」標題,用本專案金框名牌完全蓋住。
       背景以 cover 裁切顯示,依實際比例換算標題位置(原圖像素座標,外擴 14px 確保完全蓋住) */
    (function coverSceneTitle(){
      const T={'assets/scenario-bath.png':{w:1610,h:1208,x0:428,y0:25,x1:1178,y1:185},'assets/scenario-outdoor.png':{w:1448,h:1086,x0:422,y0:19,x1:1026,y1:154}}[r.scene];
      if(!T)return;
      const plate=document.createElement('div');plate.className='shoot-title-cover';plate.setAttribute('aria-hidden','true');plate.textContent=r.name;stage.appendChild(plate);
      const place=()=>{if(!plate.isConnected){removeEventListener('resize',place);return;}const sw=stage.clientWidth,sh=stage.clientHeight;if(!sw||!sh)return;
        const k=Math.max(sw/T.w,sh/T.h),ox=(sw-T.w*k)/2,oy=(sh-T.h*k)/2,pad=14;
        plate.style.left=(ox+(T.x0-pad)*k)+'px';plate.style.top=Math.max(0,oy+(T.y0-pad)*k)+'px';plate.style.width=((T.x1-T.x0+2*pad)*k)+'px';plate.style.height=((T.y1-T.y0+2*pad)*k-(oy+(T.y0-pad)*k<0?-(oy+(T.y0-pad)*k):0))+'px';
        plate.style.fontSize=Math.max(14,Math.min(30,(T.y1-T.y0)*k*.42))+'px';};
      place();requestAnimationFrame(place);addEventListener('resize',place);
    })();
    state.hintText=C2.shoes.battleButton;
    function removeMover(obj){const i=movers.indexOf(obj); if(i>=0)movers.splice(i,1); obj.el.remove();}
    function spawn(){
      if(ended||paused||movers.length>=6)return;
      const safe=Math.random()<.34; const def=safe?{name:r.safeName,img:r.safeImg}:r.bad[Math.floor(Math.random()*r.bad.length)];
      const el=document.createElement('button'); el.type='button'; el.className='shoot-target'; el.setAttribute('aria-label',def.name); el.innerHTML=`<img src="${def.img}" alt="鞋子目標">`; targetLayer.appendChild(el);
      const lane=Math.floor(Math.random()*3); const obj={el,safe,x:Math.random()*Math.max(80,stage.clientWidth-180),dir:Math.random()<.5?-1:1,speed:1.1+Math.random()*1.3,lane}; movers.push(obj); el.style.top=`${92+lane*125}px`;
      el.onclick=async(ev)=>{
        ev.stopPropagation(); if(ended||paused)return; el.classList.add('hit');
        if(safe){
          lives--; $('#shootLives').textContent=lives; removeMover(obj);
          pause(); await K.say(C2.shoes.wrongShot(r.safeName),{clear:true});
          if(lives<=0){ finish(false); return; }
          resume(); setTimeout(spawn,220); return;
        }
        score++; $('#shootScore').textContent=score; removeMover(obj);
        if(score>=6){finish(true);return;}
        setTimeout(spawn,220);
      };
    }
    function loop(now){const dt=Math.min(2,(now-last)/16.67);last=now; movers.forEach(o=>{const max=Math.max(30,stage.clientWidth-165);o.x+=o.speed*o.dir*dt;if(o.x<=12){o.x=12;o.dir=1}if(o.x>=max){o.x=max;o.dir=-1}o.el.style.transform=`translateX(${o.x}px)`;}); if(!ended&&!paused)raf=requestAnimationFrame(loop);}
    function startTimers(){
      paused=false; last=performance.now();
      spawnTimer=setInterval(spawn,900);
      countdownTimer=setInterval(()=>{if(ended)return; timeLeft--; const t=$('#shootTime'); if(t)t.textContent=timeLeft; if(timeLeft<=0)finish(false);},1000);
      raf=requestAnimationFrame(loop);
    }
    function pause(){ paused=true; clearInterval(spawnTimer); clearInterval(countdownTimer); cancelAnimationFrame(raf); spawnTimer=countdownTimer=raf=null; }
    function resume(){ if(!ended&&paused) startTimers(); }
    async function finish(win){
      if(ended)return;
      ended=true; pause(); state.pausable=null; movers.splice(0).forEach(o=>o.el.remove());
      if(!win){
        AchievementSystem.learning.assessment('mobility','shoes',false,{round:roundIndex+1,retryTriggered:true});
        await K.showHint([C2.shoes.failTitle,`記住：${r.hint}`],{label:C2.shoes.retry});
        if(alive(run)) playRound(r,false);
        return;
      }
      const lastRound=roundIndex===rounds.length-1;
      if(lastRound)AchievementSystem.learning.assessment('mobility','shoes',true,{rounds:rounds.length,retryTriggered:false});
      await K.awardStar(stage,barEl(),2+roundIndex+1);
      await K.say([lastRound?'兩個情境都判斷完成！':'浴室安全鞋款判斷成功！',r.hint]);
      if(!alive(run)) return;
      if(lastRound){state.shoesPostDone=true;openLesson('shoes');}
      else{roundIndex++;playRound(rounds[roundIndex],true);}
    }
    state.cleanup=()=>{ended=true;clearInterval(spawnTimer);clearInterval(countdownTimer);cancelAnimationFrame(raf);};
    if(intro){
      /* G1-7:開頭由 NPC 念題目(第一關再加一句操作) */
      const lines=[r.q]; if(roundIndex===0) lines.push(C2.shoes.battleOp);
      seenPhase.add('shoes-battle');
      await K.say(lines,{clear:true});
      if(ended||!alive(run)) return;
    }
    state.pausable={pause,resume};
    for(let i=0;i<5;i++)setTimeout(spawn,i*260); startTimers();
  }
  playRound(rounds[0],true);
}

/* 洗手台／浴室安全接接樂：婆媳大戰四幕故事 */
const sinkStoryScenes = [
  {image:'sink-story-01.png',dialogue:'婆婆：我把妳當一家人，妳竟然連我的地毯都要偷？！'},
  {image:'sink-story-02.png',dialogue:'媳婦：媽，我不是偷啦！妳試試看，這種止滑拖鞋比較安全！婆婆：是嗎？'},
  {image:'sink-story-03.png',dialogue:'媳婦：媽！不是我害妳，是妳的布拖鞋出賣妳啦'},
  {image:'sink-story-04.png',dialogue:'婆婆：原來最危險的……居然是我自己買的地毯？！'}
];

/* 行動記憶翻翻樂「退休皇帝」四幕故事，不影響其他活動海報 */
const standStoryScenes = [
  {image:'stand-story-01.png',dialogue:'阿公：朕退休了！從今天起，連一步都不用自己走！'},
  {image:'stand-story-02.png',dialogue:'阿公：什麼？！家人不在，我竟然連自己站起來都這麼吃力？'},
  {image:'stand-story-03.png',dialogue:'孫女：阿公，握穩扶手、慢慢起身！阿公：原來這才是真正的龍椅！'},
  {image:'stand-story-04.png',dialogue:'阿公：朕重新站穩了！以後每天都要適度活動！'}
];

/* 淋浴區安全配置：浴室改造家庭革命四幕故事 */
const showerStoryScenes = [
  {image:'shower-story-01.png',dialogue:'阿公：我洗澡洗了六十年，還需要妳們教嗎？！孫女：阿公，我們只是想讓妳洗澡更安全啦！'},
  {image:'shower-story-02.png',dialogue:'女兒：扶手要裝在牆上伸手就抓得到的地方，不只是好看的裝飾品哦！'},
  {image:'shower-story-03.png',dialogue:'阿公：好像蠻有道理的，止滑墊也要放在會踩到水的地方啊！'},
  {image:'shower-story-04.png',dialogue:'孫女：自從改造後，阿公已經愛上去浴室，都不想出來了啦！'}
];

/* 鞋櫃／安全鞋擊退戰：阿嬤的愛鞋風波，四幕獨立插圖 */
const shoesStoryScenes = [
  {image:'shoes-story-01.png',dialogue:'阿嬤：這雙花朵拖鞋又漂亮又舒服，穿去浴室也沒問題吧？'},
  {image:'shoes-story-02.png',dialogue:'阿嬤：哎呀！怎麼這麼滑！孫女：阿嬤，浴室要換有止滑設計的拖鞋啦！'},
  {image:'shoes-story-03.png',dialogue:'阿嬤：這雙舊鞋我穿好多年了！孫女：出門走路，還是穿包覆、支撐比較好的布鞋吧！'},
  {image:'shoes-story-04.png',dialogue:'孫女：阿嬤，妳看，舊鞋底都磨平了！阿嬤：原來不只要合腳，還得看鞋底呀！'}
];

/* lesson + note */
function lessonVisual(key){
  if(key==='sink') return `<div class="stand-story-media"><img id="sinkStoryImage" src="assets/${sinkStoryScenes[0].image}" alt="浴室安全接接樂故事第1幕"><div id="sinkStoryCaption" class="stand-story-caption" aria-live="polite"></div></div>`;
  if(key==='stand') return `<div class="stand-story-media"><img id="standStoryImage" src="assets/${standStoryScenes[0].image}" alt="退休皇帝故事第1幕"><div id="standStoryCaption" class="stand-story-caption" aria-live="polite"></div></div>`;
  if(key==='shower') return `<div class="stand-story-media"><img id="showerStoryImage" src="assets/${showerStoryScenes[0].image}" alt="浴室改造故事第1幕"><div id="showerStoryCaption" class="stand-story-caption" aria-live="polite"></div></div>`;
  if(key==='shoes') return `<div class="stand-story-media"><img id="shoesStoryImage" src="assets/${shoesStoryScenes[0].image}" alt="阿嬤的愛鞋風波第1幕"><div id="shoesStoryCaption" class="stand-story-caption" aria-live="polite"></div></div>`;
  const posters={sink:'poster-sink.png',stand:'poster-stand.png',shower:'poster-shower.png',medkit:'poster-medkit.png',shoes:'poster-shoes.png'};
  return `<img class="lesson-poster" src="assets/${posters[key]}" alt="${activities[key].mission} 衛教海報">`;
}
function openLesson(forceKey){ if(forceKey) state.current=forceKey; const a=activities[state.current]; show('lesson'); $('#lessonTitle').textContent=a.mission; $('#lessonVisual').innerHTML=lessonVisual(state.current); state.lessonIndex=0; renderLessonLine(); }
/* 第三修改計劃 B4:最後一句時同一顆按鈕「完成學習」→ 寶物 →「返回浴室」 */
function renderLessonLine(){ const a=activities[state.current]; const line=a.lines[state.lessonIndex]; $('#lessonLine').textContent=line; state.lessonStage=null; $('#nextLine').classList.remove('sd-stage-back'); $('#nextLine').textContent=state.lessonIndex===a.lines.length-1?'完成學習':'下一句 ▶';
  /* 與朋友版 w10_1114 整合:四個活動的衛教改成逐句同步的劇情插圖與台詞 */
  if(state.current==='sink'){
    const scene=sinkStoryScenes[state.lessonIndex];
    const image=$('#sinkStoryImage'), caption=$('#sinkStoryCaption');
    if(scene && image){const src=`assets/${scene.image}`;if(image.getAttribute('src')!==src)image.src=src;image.alt=`浴室安全接接樂衛教劇情，第 ${state.lessonIndex+1} 幕`;}
    if(caption)caption.textContent=scene?.dialogue||'';
  }
  if(state.current==='shower'){
    const scene=showerStoryScenes[state.lessonIndex];
    const image=$('#showerStoryImage'), caption=$('#showerStoryCaption');
    if(scene && image){const src=`assets/${scene.image}`;if(image.getAttribute('src')!==src)image.src=src;image.alt=`浴室改造衛教劇情，第 ${state.lessonIndex+1} 幕`;}
    if(caption)caption.textContent=scene?.dialogue||'';
  }
  if(state.current==='shoes'){
    const scene=shoesStoryScenes[state.lessonIndex];
    const image=$('#shoesStoryImage'), caption=$('#shoesStoryCaption');
    if(scene && image){const src=`assets/${scene.image}`;if(image.getAttribute('src')!==src)image.src=src;image.alt=`阿嬤的愛鞋風波，第 ${state.lessonIndex+1} 幕`;}
    if(caption)caption.textContent=scene?.dialogue||'';
  }
  if(state.current==='stand'){
    const scene=standStoryScenes[state.lessonIndex];
    const image=$('#standStoryImage'); const caption=$('#standStoryCaption');
    if(scene && image){const src=`assets/${scene.image}`;if(image.getAttribute('src')!==src)image.src=src;image.alt=`退休皇帝衛教劇情，第 ${state.lessonIndex+1} 幕`;}
    if(caption)caption.textContent=scene?.dialogue||'';
  }
}
function nextLesson(){ const a=activities[state.current]; if(state.lessonStage==='busy') return; if(state.lessonStage==='back'){ state.lessonStage=null; show('room'); return; } if(state.lessonIndex<a.lines.length-1){ state.lessonIndex++; renderLessonLine(); } else { finishLearning(); } }
async function finishLearning(){
  const key=state.current;AchievementSystem.completeActivity("mobility",key);state.completed.add(key);updateRoom();$('#nextLine').disabled=true;
  const item={sink:'mobility_screwdriver',stand:'mobility_safety_box',shower:'mobility_anti_slip_pad',shoes:'mobility_shoe_grip',medkit:'mobility_level_gauge'}[key];
  state.lessonStage='busy';
  if(item)await AchievementSystem.obtainItem(item);
  const b=$('#nextLine'); b.disabled=false; state.lessonStage='back'; b.textContent='返回房間'; b.classList.remove('sd-stage-back'); void b.offsetWidth; b.classList.add('sd-stage-back');
}

/* board zoom */
let boardZoomScale = 1;
function applyBoardZoom(){
  if(boardZoomImage && boardZoomCanvas && boardZoomStage){
    boardZoomCanvas.style.width = `${boardZoomScale * 100}%`;
    boardZoomImage.style.width = `${100 / boardZoomScale}%`;
    boardZoomImage.style.transform = `scale(${boardZoomScale})`;
    boardZoomImage.style.transformOrigin = 'top left';
    requestAnimationFrame(()=>{
      const baseHeight = boardZoomImage.offsetHeight || 1;
      boardZoomCanvas.style.height = `${baseHeight * boardZoomScale}px`;
    });
  }
  if(boardZoomLabel) boardZoomLabel.textContent = `${Math.round(boardZoomScale * 100)}%`;
  if(boardZoomOut) boardZoomOut.disabled = boardZoomScale <= 1;
  if(boardZoomIn) boardZoomIn.disabled = boardZoomScale >= 2.6;
}
function setBoardZoom(nextScale){
  boardZoomScale = Math.max(1, Math.min(2.6, Math.round(nextScale * 10) / 10));
  applyBoardZoom();
}
function openBoardZoomOverlay(){
  if(boardZoomOverlay){
    boardZoomOverlay.hidden = false;
    setBoardZoom(1);
    closeBoardZoom?.focus();
  }
}
function closeBoardZoomOverlay(){
  if(boardZoomOverlay) boardZoomOverlay.hidden = true;
}

/* board and code */
function openBoard(){ show('board'); }
function openCode(){ $('#clueSummary').textContent='請輸入在收集系統中發現的本房密碼。';$('#codeFeedback').hidden=true;$('#codeInput').value='';$('#codeOverlay').hidden=false; }
function submitCode(){ const f=$('#codeFeedback'); f.hidden=false; const result=AchievementSystem.submitPassword('mobility',$('#codeInput').value);if(!result.correct){f.className='feedback bad';f.textContent=result.message;return;} stopTimer(); f.className='feedback good'; f.innerHTML=`🎉 密碼正確！房間 2「行動」完成。<br>本關時間：<b>${formatTime(state.elapsed)}</b>`; /* 第三修改計劃 B3:密碼正確後自動回配置圖 */ setTimeout(()=>{ $('#codeOverlay').hidden=true; completeRoom(); },700); }
function returnMap(){ stopTimer(); if(window.parent!==window) window.parent.postMessage({type:'memoryMaze:room2Return',completed:AchievementSystem.getRoomProgress('mobility').completed===true,elapsedSeconds:state.elapsed},'*'); else history.back(); }

/* bind */
$$('.hotspot').forEach(btn=>btn.onclick=()=>openActivity(btn.dataset.key));
$$('.back-room').forEach(btn=>btn.onclick=()=>show('room'));
$('#nextLine').onclick=nextLesson; $('#speakLine').onclick=()=>speak($('#lessonLine').textContent); $('#openCode').onclick=openCode; $('#closeCode').onclick=()=>$('#codeOverlay').hidden=true; $('#submitCode').onclick=submitCode; $('#returnMap').onclick=returnMap;
openBoardZoom?.addEventListener('click', openBoardZoomOverlay);
closeBoardZoom?.addEventListener('click', closeBoardZoomOverlay);
closeBoardZoomTop?.addEventListener('click', closeBoardZoomOverlay);
boardZoomIn?.addEventListener('click', ()=>setBoardZoom(boardZoomScale + 0.2));
boardZoomOut?.addEventListener('click', ()=>setBoardZoom(boardZoomScale - 0.2));
boardZoomReset?.addEventListener('click', ()=>setBoardZoom(1));
window.addEventListener('resize', ()=>{ if(boardZoomOverlay && !boardZoomOverlay.hidden) applyBoardZoom(); });
boardZoomOverlay?.addEventListener('click', (event)=>{ if(event.target === boardZoomOverlay) closeBoardZoomOverlay(); });
window.addEventListener('message',e=>{ if((e.data||{}).type==='memoryMaze:room2Resume'){ if(!AchievementSystem.getRoomProgress('mobility').completed) startTimer(); else stopTimer(); show('room'); }});

// Reminder-board interface intentionally removed.
updateRoom(); show('room'); startTimer();
})();
