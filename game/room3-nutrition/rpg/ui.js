(function(){
"use strict";
const names={nutrition:"營養",appetite:"食慾",mood:"心情",energy:"體力"};
const statIcons={nutrition:"🥗",appetite:"🍚",mood:"😊",energy:"⚡"};
const actionNames={observe:"觀察",meal:"準備餐點",adjust:"調整料理",company:"陪伴",strategy:"照護策略",consult:"安排牙科檢查"};
function actionMeta(){return [
  ["observe","👀","觀察","找今天的用餐線索"],
  ["meal","🍱","選餐","從 3 份餐點中選擇"],
  ["adjust","🍳","料理","從 3 種方式調整"],
  ["company","👥","陪伴",game?.topic?.id==="seasoning"?"只小幅提升食慾，不處理牙口／味覺":"陪阿福伯聊聊"],
  ["strategy","🩺","照護","解鎖長期策略"]
];}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let game,host,finish,leave,delay,session,missionView,typeTimer,countTimer;
// 照護對象改用裝扮台做出的玩家角色(舊的固定老人圖不再使用);「心情低落」以 is-sad 樣式表現
/* 第三修改計劃 E3-1:依玩家選擇讓阿福伯有開心／難過的反應(只影響畫面,不影響數值) */
let elderMood="";
const moodFx=()=>elderMood==="happy"?'<i class="care-mood care-mood-happy" aria-hidden="true"><b>♥</b><b>♪</b><b>♥</b></i>':elderMood==="sad"?'<i class="care-mood care-mood-sad" aria-hidden="true"><b></b><b></b></i>':"";
const elderHTML=(label)=>`<div class="care-elder${game?.elderSad?" is-sad":""}${elderMood?" mood-"+elderMood:""}" data-mm-character="player" role="img" aria-label="${label}"></div>${moodFx()}`;
function moodOf(changes,bad){if(bad)return "sad";const v=(changes?.mood||0)+(changes?.appetite||0);return v>0?"happy":v<0?"sad":"";}
function restReminder(){
  const C=window.StoryCopy&&StoryCopy.room3Care;if(!window.StoryDialog||!C)return;
  StoryDialog.play({mode:"player",playerName:C.speaker,position:"bottom",clear:true,className:"care-rest",lines:C.restLines.map(t=>({who:"player",text:t}))}).then(()=>host?.querySelector("#careEat")?.focus()).catch(()=>{});
}
const paintElder=()=>window.MemoryMazeCharacters?.renderWithin(host);
function persist(){try{localStorage.setItem("nutritionRPG.lastSession",JSON.stringify(game.export()));}catch{}}
function sprite(index){return `<div class="care-food" style="background-position:${index%4*100/3}% ${Math.floor(index/4)*50}%;--c:${index%4};--r:${Math.floor(index/4)}"></div>`;}
function dayTrack(){return Array.from({length:game.topic.rules.days},(_,i)=>{const day=i+1;const cls=day<game.day?"done":day===game.day?"now":"";return `<div class="care-day-node ${cls}"><i>${day<game.day?"✓":day}</i><span>DAY ${day}</span></div>`;}).join("");}
function apTokens(){return `<div class="care-token-row" aria-label="今日剩餘 ${game.ap} 點行動力">${[0,1].map(i=>`<span class="care-token ${i<game.ap?"on":"off"}" aria-hidden="true">◆</span>`).join("")}</div>`;}
function bars(){return Object.entries(game.stats).map(([k,v])=>`<div class="care-stat"><div class="care-stat-head"><span><b>${statIcons[k]}</b>${names[k]}</span><strong>${v}</strong><small id="delta-${k}"></small></div><progress aria-label="${names[k]}" value="${v}" max="100"></progress></div>`).join("");}
function floatChanges(delta){Object.entries(delta||{}).forEach(([key,n])=>{const el=host.querySelector("#delta-"+key);if(el&&n){el.textContent=`${n>0?"+":""}${n} ${n>0?"↑":"↓"}`;el.className=n>0?"up":"down";}});}
function setRpgMode(on){if(!missionView)missionView=host?.closest("#missionView");missionView?.classList.toggle("care-rpg-active",!!on);}

// 漫畫對話框:整句先以隱形字撐出氣泡大小,再逐字打出;點一下氣泡可直接顯示全文
function bubbleHTML(text,cls=""){return `<div class="care-speech ${cls}" role="status" aria-label="${escape(text)}"><span class="care-speech-ghost" aria-hidden="true">${escape(text)}</span><span class="care-speech-type" aria-hidden="true"></span></div>`;}
function typeBubble(root){
  clearInterval(typeTimer);const bubble=root.querySelector(".care-speech"),out=bubble?.querySelector(".care-speech-type");if(!out)return;
  const full=bubble.querySelector(".care-speech-ghost").textContent;let n=0;
  if(matchMedia("(prefers-reduced-motion: reduce)").matches){out.textContent=full;return;}
  typeTimer=setInterval(()=>{n++;out.textContent=full.slice(0,n);if(n>=full.length)clearInterval(typeTimer);},24);
  bubble.onclick=()=>{clearInterval(typeTimer);out.textContent=full;};
}
function countUp(el,to,ms){
  cancelAnimationFrame(countTimer);const t0=performance.now();
  const step=t=>{const k=Math.min(1,(t-t0)/ms);el.textContent=Math.round(to*k)+"%";if(k<1)countTimer=requestAnimationFrame(step);};
  countTimer=requestAnimationFrame(step);
}
window.CareRPG={
mount(container,topicId,onFinish,onLeave){
  clearTimeout(delay);clearInterval(typeTimer);cancelAnimationFrame(countTimer);session=Symbol();host=container;finish=onFinish;leave=onLeave;missionView=host.closest("#missionView");setRpgMode(true);game=new CareGame(CareData.topics[topicId]);intro();
},
dispose(){clearTimeout(delay);clearInterval(typeTimer);cancelAnimationFrame(countTimer);session=Symbol();if(game)persist();setRpgMode(false);}
};
function intro(){
setRpgMode(true);
host.innerHTML=`<section class="care-intro"><div class="care-cover"><img class="care-background" src="assets/nutrition-rpg-background.png" alt="溫暖的居家用餐與廚房場景">${elderHTML("阿福伯")}<div class="care-cover-badge">${game.topic.rules.days} DAYS · ${game.topic.rules.days*game.topic.rules.ap} ACTIONS</div></div><div class="care-intro-copy care-card"><p class="eyebrow">三天照護任務</p><h3>${game.topic.title}</h3><p><strong>${game.topic.person.name}</strong>，${game.topic.person.age} 歲。${escape(game.topic.intro||"你只有三天、每天兩次行動，觀察事件並安排照護策略。")}</p><p class="care-note">數值是遊戲模擬指標，不是臨床量表；結果不代表真實三天的健康預測。</p><button id="careStart" class="primary-button care-start">開始三日照護 ▶</button></div></section>`;
paintElder();
host.querySelector("#careStart").onclick=()=>{game.startDay();render();persist();};
}
function render(changes){
setRpgMode(true);
const adjustments=game.adjustments.map(id=>game.topic.adjustments.find(a=>a.id===id)?.name).filter(Boolean);
const strategies=game.strategies.map(id=>game.topic.unlocks.find(s=>s.id===id)?.name).filter(Boolean);
const actionsText=game.actions.length?game.actions.map(a=>actionNames[a.type]).join(" → "):"尚未行動";
host.innerHTML=`<section class="care-game">
<header class="care-hud">
  <button id="careLeaveTop" class="care-room-back" type="button">← 廚房</button>
  <div class="care-titleplate"><div class="care-day-title"><span>DAY ${game.day}</span><strong>三日照護任務</strong></div><div class="care-day-track" aria-label="目前第 ${game.day} 天">${dayTrack()}</div></div>
  <div class="care-hud-tools">
    ${window.CareRPGHint?'<button id="careHint" class="care-journal-button" type="button" aria-label="操作提示"><span>💡</span><b>操作提示</b></button>':""}<button id="careRecords" class="care-journal-button" type="button" aria-label="開啟照護日誌"><span>📓</span><b>日誌</b><em>${game.clues.length}</em></button>
  </div>
</header>

<div class="care-layout">
  <div class="care-stage-col">
    <div class="care-scene${changes?" is-acted":""}">
      <img class="care-background" src="assets/nutrition-rpg-background.png" alt="溫暖的居家用餐與廚房場景">
      ${elderHTML("76 歲阿福伯")}
      <span class="care-name">${escape(game.topic.person.name)} · ${game.topic.person.age} 歲</span>
      <div class="care-event-tag"><small>今日事件</small><strong>${escape(game.event.title)}</strong><span>${escape(game.event.detail)}</span></div>
      ${bubbleHTML("「"+game.reaction+"」")}
      <div class="care-meal"><div class="care-placemat"><i class="care-steam s1"></i><i class="care-steam s2"></i><i class="care-steam s3"></i><div class="care-plate">${sprite(game.meal.sprite)}</div></div><div class="care-meal-chip"><small>今日餐點</small><strong>${escape(game.meal.name)}</strong><span>${adjustments.length?"強化："+escape(adjustments.join("、")):"尚未調整料理"}</span></div></div>
    </div>
  </div>

  <aside class="care-aside">
    <section class="care-panel care-status-panel"><div class="care-panel-title"><span>角色狀態</span><small>0–100</small></div><div class="care-stats">${bars()}</div></section>
    <section class="care-panel care-strategy-panel"><div class="care-panel-title"><span>持續照護</span><small>${strategies.length} 項</small></div><div class="care-active">${strategies.length?strategies.map(s=>`<span>✓ ${escape(s)}</span>`).join(""):`<span class="muted">尚未解鎖持續策略</span>`}${game.consultUsed?`<span>✓ 已安排牙科檢查</span>`:""}</div></section>
    <section class="care-panel care-turn-panel"><div class="care-panel-title"><span>今天做過</span><small>${2-game.ap}/2</small></div><p>${escape(actionsText)}</p><button id="careEat" class="care-end-turn" type="button" ${game.ap?"disabled":""}>${game.ap?`還有 ${game.ap} 點行動力`:`完成今天 ▶`}</button><p id="careStatus" role="status" class="care-status-text">${game.ap?"選擇下方技能安排今天的照護。":"行動完成，可以查看今天吃了多少。"}</p></section>
  </aside>
</div>

<nav class="care-actions" aria-label="照護技能列">${actionMeta().map(([id,icon,label,desc])=>`<button data-care-action="${id}" type="button" ${!game.ap?"disabled":""}><span class="care-action-icon">${icon}</span><span class="care-action-copy"><strong>${label}</strong><small>${desc}</small></span><b>◆ 1</b></button>`).join("")}</nav>
<div id="careChoice" class="care-choice" hidden></div>
</section>`;
paintElder();typeBubble(host);
host.querySelector("#careLeaveTop").onclick=leave;host.querySelector("#careHint")?.addEventListener("click",()=>window.CareRPGHint());
host.querySelector("#careRecords").onclick=journal;
host.querySelectorAll("[data-care-action]").forEach(b=>b.onclick=()=>openAction(b.dataset.careAction));
host.querySelector("#careEat").onclick=settle;
floatChanges(changes);
}
function execute(type,value){
try{const result=game.act(type,value);
const selected=type==="adjust"?game.topic.adjustments.find(a=>a.id===value):null;
 game.elderSad=!!selected?.bad;
 elderMood=moodOf(result.changes,!!selected?.bad);
 render(result.changes);elderMood="";persist();
 if(game.ap===0)restReminder();}
catch(e){const status=host.querySelector("#careStatus");if(status)status.textContent=e.message;}
}
function openAction(type){
if(type==="observe"||type==="company"){execute(type);return;}
const box=host.querySelector("#careChoice");box.hidden=false;box.dataset.kind=type;
let html="";
if(type==="meal")html=`<div class="care-choice-head"><div><small>🍱 選餐</small><h4>今天要準備哪一份？</h4></div><button id="careClose" class="care-x" aria-label="關閉">×</button></div><p>每天刷新 3 種餐點。按下「選這份」才消耗 1 點行動力。</p><div class="care-meals">${game.dailyMealOptions.map(m=>`<article>${sprite(m.sprite)}<h5>${m.name}</h5><p>${m.description}</p><div class="care-card-stats"><span>🥗 ${m.nutrition}</span><span>🦷 ${m.hardness}</span><span>😋 ${m.flavor}</span><span>🌈 ${m.appearance}</span></div><button data-value="${m.id}">選這份 · ◆1</button></article>`).join("")}</div>`;
if(type==="adjust")html=`<div class="care-choice-head"><div><small>🍳 料理</small><h4>調整「${escape(game.meal.name)}」</h4></div><button id="careClose" class="care-x" aria-label="關閉">×</button></div><p>每天刷新 3 種料理方式；系統會確保至少有一種能直接回應今天的用餐需求。</p><div class="care-options">${game.dailyAdjustmentOptions.map(a=>`<button data-value="${a.id}" ${game.adjustments.includes(a.id)?"disabled":""}><strong>${a.name}</strong><span>${a.description}</span><small>${game.adjustments.includes(a.id)?"今天已用過":"使用 · ◆1"}</small></button>`).join("")}</div>`;
if(type==="strategy")html=`<div class="care-choice-head"><div><small>🩺 照護</small><h4>持續照護策略</h4></div><button id="careClose" class="care-x" aria-label="關閉">×</button></div><div class="care-options">${game.topic.unlocks.map(s=>{const count=game.topic.clues.filter(c=>c.group===s.group&&game.clues.includes(c.id)).length,active=game.strategies.includes(s.id),available=game.available(s.id);return `<button data-value="${s.id}" ${active||!available?"disabled":""}><strong>${available?s.name:"🔒 尚待觀察"}</strong><span>${available?s.description:`相關線索 ${count}／${s.required}，再觀察用餐反應。`}</span><small>${active?"已啟用":available?"啟用 · ◆1":"鎖定"}</small></button>`;}).join("")}<button id="careConsult" ${game.consultUsed?"disabled":""}><strong>🦷 ${escape(game.topic.rules.consultLabel||"安排牙科檢查")}</strong><span>${escape(game.topic.rules.consultDescription||"若懷疑牙口不適，也可以安排一次牙科檢查；在本關中它只是輔助排除因素。")}</span><small>${game.consultUsed?"本局已安排":"本局限一次 · ◆1"}</small></button></div>`;
box.innerHTML=html;
box.querySelectorAll("[data-value]").forEach(b=>b.onclick=()=>execute(type,b.dataset.value));
if(box.querySelector("#careConsult"))box.querySelector("#careConsult").onclick=()=>execute("consult");
box.querySelector("#careClose").onclick=()=>{box.hidden=true;};
}
function journal(){
const groups=[...new Set(game.topic.clues.map(c=>c.group))];
const groupNames={mood:"情緒／陪伴",dining:"用餐方式",oral:"牙口／咀嚼",taste:"味覺／風味"};
const clueHtml=groups.map(group=>{const list=game.topic.clues.filter(c=>c.group===group);return `<section class="journal-group"><h4>${groupNames[group]||group}</h4>${list.map(c=>`<div class="journal-clue ${game.clues.includes(c.id)?"found":"locked"}"><span>${game.clues.includes(c.id)?"✓":"?"}</span><p>${game.clues.includes(c.id)?escape(c.text):"尚未發現"}</p></div>`).join("")}</section>`;}).join("");
const logHtml=game.log.length?game.log.map(d=>`<article class="journal-day"><b>DAY ${d.turn}</b><div><strong>${escape(d.event.title)}</strong><span>${escape(d.meal.name)} · 進食 ${Math.round(d.intakeRate*100)}%</span></div></article>`).join(""):`<p class="journal-empty">第一天尚未結算，完成今天後會留下日誌。</p>`;
host.innerHTML=`<section class="care-journal"><header><div><p class="eyebrow">CARE LOG</p><h3>${escape(game.topic.person.name)}照護日誌</h3></div><button id="journalBack" class="primary-button" type="button">← 返回房間</button></header><div class="journal-grid"><div class="journal-book"><div class="journal-title"><span>🔎</span><div><strong>觀察線索</strong><small>${game.clues.length} 則已發現</small></div></div><div class="journal-groups">${clueHtml}</div></div><div class="journal-book"><div class="journal-title"><span>📅</span><div><strong>三日紀錄</strong><small>目前 DAY ${game.day}</small></div></div><div class="journal-days">${logHtml}</div><div class="journal-strategies"><strong>已啟用照護</strong><p>${game.strategies.length?game.strategies.map(id=>game.topic.unlocks.find(s=>s.id===id)?.name).filter(Boolean).join("、"):"尚未啟用"}${game.consultUsed?"、牙科檢查":""}</p></div></div></div></section>`;
host.querySelector("#journalBack").onclick=()=>render();
}
function settle(){
const row=game.settle();persist();
if(game.log.length===game.topic.rules.days){
  const rates=game.log.map(d=>d.intakeRate);
  const average=rates.reduce((sum,rate)=>sum+rate,0)/rates.length;
  const activity=game.topic.id==='seasoning'?'seasoning':'note';
  AchievementSystem.learning.assessment('nutrition',activity,average>0.60,{dailyIntakeRates:rates,averageIntakeRate:average});
}
const rate=Math.round(row.intakeRate*100);
elderMood=row.intakeRate>=.7?"happy":row.intakeRate<.45?"sad":"";
host.innerHTML=`<section class="care-summary"><header class="care-sum-title"><span>DAY ${game.day} COMPLETE</span><strong>今天，阿福伯吃了多少？</strong></header>
<div class="care-sum-main">
  <div class="care-sum-talk">${bubbleHTML("「"+row.reaction+"」","care-speech-sum")}${elderHTML("阿福伯")}</div>
  <div class="care-sum-plate care-card"><div class="care-leftovers">${sprite(row.meal.sprite)}<div class="care-cover-food"></div></div><div class="care-sum-rate"><strong id="careRate">0%</strong><p>今日進食率</p><small>${escape(row.meal.name)}</small></div></div>
  <div class="care-sum-stats care-card"><div class="care-panel-title"><span>角色狀態</span><small>變化</small></div><div class="care-stats">${bars()}</div></div>
</div>
<p class="care-summary-line care-card">基礎營養 ${row.baseNutrition} × 進食率 ${rate}% ≈ 實際攝取 <b>${row.actualNutrition}</b>；今日營養淨變化 <b>${row.nutritionChange>0?"+":""}${row.nutritionChange}</b></p>
<p class="care-summary-clue care-card">🔎 ${escape(row.cluesAdded.map(id=>game.topic.clues.find(c=>c.id===id).text).join(" ")||"把今天的進食量與前幾天比較，觀察策略效果。")}</p>
<button id="careNext" class="primary-button" disabled>${game.day===game.topic.rules.days?"查看三日照護結果":"進入下一天"}（請先觀察結算）</button></section>`;
paintElder();typeBubble(host);elderMood="";
floatChanges(row.changes);
requestAnimationFrame(()=>{const cover=host.querySelector(".care-cover-food");if(cover)cover.style.width=(row.intakeRate*100)+"%";});
countUp(host.querySelector("#careRate"),rate,1800);
const token=session;
delay=setTimeout(()=>{if(token!==session)return;const next=host.querySelector("#careNext");if(next){next.disabled=false;next.textContent=game.day===game.topic.rules.days?"查看三日照護結果":"進入下一天 ▶";}},2200);
host.querySelector("#careNext").onclick=()=>{if(game.day===game.topic.rules.days)finale();else{game.startDay();render(game.dayDelta);persist();}};
}
function chart(key,color){
const values=game.history.map(s=>s[key]),xs=values.map((_,i)=>46+i*70),y=v=>150-v*1.2;
return `<figure class="care-card"><figcaption>${names[key]}變化（0–100）</figcaption><svg viewBox="0 0 440 190" role="img" aria-label="${names[key]}從起始至第三天：${values.join("、")}">${[0,50,100].map(v=>`<line x1="38" y1="${y(v)}" x2="420" y2="${y(v)}" stroke="#cdb27a" stroke-dasharray="${v?"4 4":"0"}"/><text x="4" y="${y(v)+4}">${v}</text>`).join("")}<polyline class="care-line" pathLength="1" points="${values.map((v,i)=>xs[i]+","+y(v)).join(" ")}" fill="none" stroke="${color}" stroke-width="4" stroke-linejoin="round"/>${values.map((v,i)=>`<circle cx="${xs[i]}" cy="${y(v)}" r="5" fill="${color}" stroke="#fff6dc" stroke-width="2"/><text x="${xs[i]}" y="${y(v)-10}" text-anchor="middle">${v}</text><text x="${xs[i]}" y="182" text-anchor="middle">${i?"日"+i:"起始"}</text>`).join("")}</svg></figure>`;
}
function finale(){
const result=game.ending();persist();
try{const sessions=JSON.parse(localStorage.getItem("nutritionRPG.completedSessions")||"[]");if(!sessions.some(s=>s.sessionId===game.id)){sessions.push(game.export());localStorage.setItem("nutritionRPG.completedSessions",JSON.stringify(sessions));}}catch{}
/* 第三修改計劃 B4:寶物改在按「完成學習」時才給(同一顆按鈕之後變「返回廚房」) */
const finalDetail=game.topic.id==="seasoning"?`你蒐集了 ${game.clues.length} 則紀錄，啟用 ${game.strategies.length} 項持續策略。${result.oralSupport?"牙口照護已有明確處理。":"牙口處理還可以更完整。"}${result.tasteSupport?"健康調味與風味策略也有被運用。":"味覺／風味策略還可以再加強。"}${game.strategies.includes("psych")?"心理支持在本關只提供小幅食慾幫助，沒有直接增加營養。":""}`:`你蒐集了 ${game.clues.length} 則紀錄，啟用 ${game.strategies.length} 項持續策略。${result.companyActions>=2?"這三天有多次安排陪伴，阿福伯的心情與食慾得到支持。":"陪伴仍可以更積極一些。"}${result.mealSupport?"餐點也有往小份、多樣的方向調整。":"餐點可以再減少份量壓力、增加變化。"}${game.strategies.includes("psych")?"並已安排心理專業協助，持續關注情緒與食慾。":""}`;
host.innerHTML=`<section class="care-final"><header class="care-sum-title"><span>3 日照護結果</span><strong>${result.title}</strong></header>
<div class="care-final-main">
  <div class="care-final-left care-card"><div class="care-stats">${bars()}</div><h4>回頭看這三天</h4><p>阿福伯遇到的是：<b>${game.topic.hiddenProblems.join("、")}</b>。</p><p>${game.topic.endingFeedback}</p><p>${finalDetail}</p></div>
  <div class="care-final-right">${chart("nutrition","#287357")}${chart("appetite","#b0651c")}</div>
</div>
<div class="care-final-bar"><h4>完成照護！</h4><div class="actions"><button id="careLog" class="secondary-button" type="button">展開三天照護日誌</button><button id="careReplay" class="primary-button">重新挑戰</button><button id="careLeave" class="primary-button">完成學習</button></div></div>
<p class="care-note">紀錄保留在這個瀏覽器，不會自動傳送。遊戲數值為教學模擬，未經臨床或評量效度驗證。</p>
<div class="care-log-pop" hidden><div class="care-log-card care-card"><header><strong>三天照護日誌</strong><button id="careLogClose" class="care-x" type="button" aria-label="關閉">×</button></header><div class="care-log">${game.log.map(d=>`<article><h5>第 ${d.turn} 天 · ${escape(d.event.title)}</h5><p>${d.actions.map(a=>actionNames[a.type]+(a.value?"（"+a.value+"）":"")).join(" → ")}</p><p>${escape(d.meal.name)}：進食 ${Math.round(d.intakeRate*100)}%，營養變化 ${d.nutritionChange}</p></article>`).join("")}</div></div></div></section>`;
const pop=host.querySelector(".care-log-pop");
host.querySelector("#careLog").onclick=()=>{pop.hidden=false;};
host.querySelector("#careLogClose").onclick=()=>{pop.hidden=true;};
host.querySelector("#careReplay").onclick=()=>{const topic=game.topic;game=new CareGame(topic);intro();};
const cl=host.querySelector("#careLeave");if(window.StoryDialog&&StoryDialog.finishButton)StoryDialog.finishButton(cl,{finish:async()=>{await finish();},back:()=>leave(),backLabel:"返回房間"});else cl.onclick=()=>{finish();leave();};
}
})();
