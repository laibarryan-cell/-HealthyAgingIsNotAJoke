(function(root){'use strict';
let app=null,back=null,timers=[];
const q=s=>app?.querySelector(s);
const M5=()=>root.StoryCopy.room5.medicine;
const setHint=h=>root.R5.setHint(h),enterPhase=(id,h)=>root.R5.enter(id,h);
function later(fn,ms){const id=setTimeout(fn,ms);timers.push(id);return id;}
function dispose(){timers.forEach(clearTimeout);timers=[];}
function exit(){dispose();back?.();}

const resourceData={
  '東區':[{type:'醫院',name:'台灣基督長老教會新樓醫療財團法人台南新樓醫院',address:'台南市東區東門路一段57號',phone:'06-2748316',service:'認知／失智相關門診與照護資源，請先電話詢問。'}],
  '北區':[{type:'醫院',name:'國立成功大學醫學院附設醫院',address:'台南市北區勝利路138號',phone:'06-2353535',service:'設有失智症中心，可詢問認知評估與就醫安排。'}],
  '佳里區':[{type:'醫院',name:'奇美醫療財團法人佳里奇美醫院',address:'台南市佳里區佳里興佳興里 606號',phone:'06-7263333',service:'提供失智相關照護資源，請先詢問認知評估與轉介安排。'}]
};
// PDF 第 1、5 頁提供院區聯絡資料；認知服務篩選依據見 MEDICAL_SOURCES.md。
const missionUnit=district=>({...resourceData[district][0],district});
const DIRS=['N','E','S','W'];
const OPP={N:'S',E:'W',S:'N',W:'E'};
const DELTA={N:[-1,0],E:[0,1],S:[1,0],W:[0,-1]};
const SHAPE_SIDES={straight:['N','S'],corner:['N','E'],tee:['N','E','W']};
function makeDecoyTiles(overrides={}){
  const base=[],shapes=['corner','straight','corner','tee','straight'];
  for(let r=0;r<5;r++)for(let c=0;c<5;c++){
    const key=`${r}-${c}`;
    const tile={row:r,col:c,shape:shapes[(r*2+c)%shapes.length],rot:(r*3+c*2+1)%4,role:'normal',label:''};
    if(overrides[key])Object.assign(tile,overrides[key]);
    base.push(tile);
  }
  return base;
}
const emergencyMissions=[
  {
    person:'王奶奶',story:'王奶奶住在佳里區，最近反覆忘記事情。家人想找有認知相關資源的醫院，先電話詢問。',conditions:['佳里區','醫院','電話'],
    unit:missionUnit('佳里區'),start:[2,0,'E'],end:[4,4,'N'],
    tiles:makeDecoyTiles({'2-1':{shape:'straight',rot:1,role:'condition',label:'佳里區'},'2-2':{shape:'corner',rot:3},'1-2':{shape:'straight',rot:0},'0-2':{shape:'corner',rot:1},'0-3':{shape:'straight',rot:1,role:'condition',label:'醫院'},'0-4':{shape:'corner',rot:2},'1-4':{shape:'straight',rot:0,role:'condition',label:'電話'},'2-4':{shape:'straight',rot:0},'3-4':{shape:'straight',rot:0},'2-0':{role:'start',label:'需求'},'4-4':{role:'end',label:'目標'}}),
    scramble:{'2-1':0,'2-2':0,'1-2':1,'0-2':0,'0-3':0,'0-4':1,'1-4':1,'2-4':1,'3-4':1}
  },
  {
    person:'林阿公',story:'林阿公住在東區，最近常在熟悉的地方迷路。家人想找有認知相關資源的醫院，先電話詢問。',conditions:['東區','醫院','電話'],
    unit:missionUnit('東區'),start:[4,0,'E'],end:[0,0,'E'],
    tiles:makeDecoyTiles({'4-1':{shape:'corner',rot:3},'3-1':{shape:'straight',rot:0,role:'condition',label:'東區'},'2-1':{shape:'corner',rot:1},'2-2':{shape:'straight',rot:1},'2-3':{shape:'corner',rot:3},'1-3':{shape:'straight',rot:0,role:'condition',label:'醫院'},'0-3':{shape:'corner',rot:2},'0-2':{shape:'straight',rot:1,role:'condition',label:'電話'},'0-1':{shape:'straight',rot:1},'4-0':{role:'start',label:'需求'},'0-0':{role:'end',label:'目標'}}),
    scramble:{'4-1':1,'3-1':1,'2-1':0,'2-2':0,'2-3':1,'1-3':1,'0-3':0,'0-2':0,'0-1':0}
  },
  {
    person:'陳伯伯',story:'陳伯伯住在北區，記憶變化已影響生活。家人想找有認知相關資源的醫院，先電話詢問。',conditions:['北區','醫院','電話'],
    unit:missionUnit('北區'),start:[0,0,'E'],end:[4,0,'E'],
    tiles:makeDecoyTiles({'0-1':{shape:'straight',rot:1},'0-2':{shape:'corner',rot:2},'1-2':{shape:'straight',rot:0,role:'condition',label:'北區'},'2-2':{shape:'corner',rot:0},'2-3':{shape:'straight',rot:1,role:'condition',label:'醫院'},'2-4':{shape:'corner',rot:2},'3-4':{shape:'straight',rot:0},'4-4':{shape:'corner',rot:3},'4-3':{shape:'straight',rot:1,role:'condition',label:'電話'},'4-2':{shape:'straight',rot:1},'4-1':{shape:'straight',rot:1},'0-0':{role:'start',label:'需求'},'4-0':{role:'end',label:'目標'}}),
    scramble:{'0-1':0,'0-2':0,'1-2':1,'2-2':1,'2-3':0,'2-4':0,'3-4':1,'4-4':1,'4-3':0,'4-2':0,'4-1':0}
  }
];
let selectedDistrict=null,currentMission=0,completed=0,currentTiles=[],solved=false;

function markup(){return `<section class="cog-medicine resource-view module-view" data-module="medicine" aria-labelledby="resourceTitle">
<header class="medicine-mission-bar r5-bar"><button id="medicineReturnRoom" class="medicine-back back" type="button">← 返回房間</button><div class="mission-heading"><h1 id="resourceTitle" class="r5-title" tabindex="-1">臺南認知醫療資源服務站</h1></div><div id="r5Bar" class="progress-chip color-progress" aria-label="進度"></div></header>
<div class="act-toolbar r5-toolbar"><button id="r5Hint" class="secondary hint-btn" type="button">💡 操作提示</button></div>
<div class="resource-shell">
<section id="resourceHomeStep" class="resource-panel resource-home-step"><div class="resource-home-hero"><div class="pixel-sign" aria-hidden="true">ICOPE</div><div><h3>需要醫療資源時，你知道怎麼找嗎？</h3></div></div><div class="resource-home-actions"><button id="openResourceQuery" class="resource-mode-card" type="button"><span class="resource-mode-icon" aria-hidden="true">⌕</span><strong>查詢醫療資源</strong><small>依區域查看單位名稱、地址與電話</small></button><button id="startEmergencyMission" class="resource-mode-card is-mission" type="button"><span class="resource-mode-icon" aria-hidden="true">!</span><strong>開始緊急任務</strong><small>完成 3 題旋轉方塊路徑</small></button></div><p class="resource-source-note">院名、院區地址與電話：1150602 ICOPE 單位 PDF。認知服務另依官方資訊篩選；非全市完整名單。ICOPE 初篩不等於失智診斷，請先電話確認科別、服務地點與時間。</p></section>
<section id="resourceQueryStep" class="resource-panel" hidden><div class="resource-step-head"><div><h3>先選擇區域</h3></div><button id="queryBackHome" class="resource-secondary" type="button">回資源首頁</button></div><div id="districtChoices" class="district-grid" aria-label="可選擇的臺南區域"></div><div id="queryUnitArea" class="query-unit-area" hidden><div class="resource-step-head compact"><div><h3><span id="selectedDistrictName"></span>的單位</h3></div><button id="changeDistrict" class="resource-secondary" type="button">換一個區域</button></div><div id="unitCards" class="unit-card-grid"></div></div></section>
<section id="resourceMissionStep" class="resource-panel resource-mission-panel" hidden><div class="resource-puzzle-topbar"><div><h3 id="missionPuzzleTitle" class="sr-only">任務 1／3</h3></div><button id="missionBackHome" class="resource-secondary" type="button">回資源首頁</button></div><div class="resource-puzzle-layout"><aside class="mission-paper" aria-labelledby="missionPersonName"><div class="mission-paper-tape" aria-hidden="true"></div><p class="mission-kicker">緊急任務</p><h4 id="missionPersonName"></h4><p id="missionStory" class="mission-story"></p><div class="mission-condition-title">指定條件</div><div id="missionConditions" class="mission-condition-list"></div><div class="mission-route-status"><strong>目前接通</strong><div id="missionConditionStatus"></div></div></aside><div class="puzzle-board-wrap"><div class="puzzle-board-head"><span class="mb-label-removed" aria-hidden="true" style="visibility:hidden"></span><span id="missionProgressText" class="sr-only">任務完成 0／3</span><span class="mb-label-removed" aria-hidden="true" style="visibility:hidden"></span></div><div id="routePuzzleBoard" class="route-puzzle-board" role="grid" aria-label="五乘五旋轉路徑拼圖"></div><p class="puzzle-live-hint" id="puzzleLiveHint" aria-live="polite"></p></div></div></section>
<section id="resourceMissionResult" class="resource-panel mission-result-panel" hidden aria-live="polite"><h3>找到符合條件的單位！</h3><div class="mission-result-card"><span id="missionResultType" class="unit-type-badge"></span><h4 id="missionResultName"></h4><dl><div><dt>區域</dt><dd id="missionResultDistrict"></dd></div><div><dt>地址</dt><dd id="missionResultAddress"></dd></div><div><dt>電話</dt><dd id="missionResultPhone"></dd></div></dl></div><p class="resource-detail-note">找到的是有認知相關資源的醫院，不代表已完成診斷。以上是 PDF 所列院區資訊，請先致電確認認知評估科別、服務地點與時間。</p><button id="nextEmergencyMission" class="primary-button" type="button">下一個緊急任務</button></section>
<section id="resourceFinalStep" class="resource-panel resource-final-panel" hidden aria-live="polite"><h3>醫療資源任務完成！</h3><p>你已經完成三次「看條件 → 拼路徑 → 找到資源」的任務。</p><button id="resourceFinalReturn" class="primary-button" type="button" hidden>完成學習</button></section>
</div>
<div id="unitDetailDialog" class="resource-detail-backdrop" hidden><div class="resource-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="unitDetailName"><button id="closeUnitDetail" class="resource-close" type="button" aria-label="關閉">×</button><span id="unitDetailType" class="unit-type-badge"></span><h3 id="unitDetailName"></h3><dl><div><dt>區域</dt><dd id="unitDetailDistrict"></dd></div><div><dt>地址</dt><dd id="unitDetailAddress"></dd></div><div><dt>電話</dt><dd id="unitDetailPhone"></dd></div></dl><p id="unitDetailService" class="resource-detail-note"></p><p class="resource-detail-note">地址與電話為 PDF 所列院區資訊，非共照據點或專科直撥資料。請先詢問科別、實際服務地點與時間；初篩不等於確診。</p></div></div>
</section>`;}

function showStep(step){['#resourceHomeStep','#resourceQueryStep','#resourceMissionStep','#resourceMissionResult','#resourceFinalStep'].forEach(s=>{const el=q(s);if(el)el.hidden=el!==step;});}
function home(){q('#unitDetailDialog').hidden=true;showStep(q('#resourceHomeStep'));setHint(M5().home);q('#openResourceQuery')?.focus();}
function renderDistricts(){const box=q('#districtChoices');box.innerHTML='';Object.keys(resourceData).forEach(d=>{const b=document.createElement('button');b.type='button';b.className='district-choice';b.innerHTML=`<span class="district-pin" aria-hidden="true">◆</span><strong>${d}</strong><small>${resourceData[d].length} 個認知相關院所</small>`;b.onclick=()=>selectDistrict(d);box.appendChild(b);});}
function selectDistrict(d){selectedDistrict=d;q('#selectedDistrictName').textContent=d;q('#queryUnitArea').hidden=false;renderUnits();q('#unitCards button')?.focus();}
function renderUnits(){const box=q('#unitCards');box.innerHTML='';resourceData[selectedDistrict].forEach((u,i)=>{const b=document.createElement('button');b.type='button';b.className='unit-card';b.innerHTML=`<span class="unit-card-index">${String(i+1).padStart(2,'0')}</span><span class="unit-type-badge">${u.type}</span><strong>${u.name}</strong><small>點擊查看地址與電話</small>`;b.onclick=()=>openUnit(u);box.appendChild(b);});}
function openUnit(u){q('#unitDetailType').textContent=u.type;q('#unitDetailName').textContent=u.name;q('#unitDetailDistrict').textContent=selectedDistrict;q('#unitDetailAddress').textContent=u.address;q('#unitDetailPhone').textContent=u.phone;q('#unitDetailService').textContent=u.service;q('#unitDetailDialog').hidden=false;q('#closeUnitDetail').focus();}
function closeUnit(){q('#unitDetailDialog').hidden=true;}
function rotateSides(sides,rot){return sides.map(side=>DIRS[(DIRS.indexOf(side)+rot)%4]);}
function tileSides(tile){const m=emergencyMissions[currentMission];if(tile.role==='start')return[m.start[2]];if(tile.role==='end')return[m.end[2]];return rotateSides(SHAPE_SIDES[tile.shape]||[],tile.rot%4);}
function getTile(r,c){return currentTiles.find(t=>t.row===r&&t.col===c)||null;}
function paint(cell,tile){const pipe=cell.querySelector('.route-pipe');pipe.className='route-pipe';tileSides(tile).forEach(side=>pipe.classList.add(`side-${side.toLowerCase()}`));}
function renderPuzzle(){const board=q('#routePuzzleBoard');board.innerHTML='';currentTiles.forEach((tile,index)=>{const cell=document.createElement('button');cell.type='button';cell.className=`route-tile role-${tile.role||'normal'}`;cell.dataset.index=String(index);cell.setAttribute('role','gridcell');cell.setAttribute('aria-label',tile.label?`${tile.label} 方格`:'可旋轉路徑方格');if(tile.role==='start'||tile.role==='end'){cell.disabled=true;cell.classList.add('is-fixed');}const pipe=document.createElement('span');pipe.className='route-pipe';pipe.setAttribute('aria-hidden','true');pipe.innerHTML='<i class="pipe-center"></i><i class="pipe-arm arm-n"></i><i class="pipe-arm arm-e"></i><i class="pipe-arm arm-s"></i><i class="pipe-arm arm-w"></i>';cell.appendChild(pipe);if(tile.label){const label=document.createElement('span');label.className='route-tile-label';label.textContent=tile.label;cell.appendChild(label);}cell.onclick=()=>rotateTile(index);board.appendChild(cell);paint(cell,tile);});}
function rotateTile(index){if(solved)return;const tile=currentTiles[index];if(!tile||tile.role==='start'||tile.role==='end')return;tile.rot=(tile.rot+1)%4;const cell=q(`#routePuzzleBoard [data-index="${index}"]`);cell?.classList.add('is-rotating');if(cell)paint(cell,tile);later(()=>cell?.classList.remove('is-rotating'),190);updateConnectivity();}
function startMission(index){currentMission=index;solved=false;const m=emergencyMissions[index];currentTiles=m.tiles.map(t=>{const c={...t},key=`${c.row}-${c.col}`;if(m.scramble[key]!==undefined&&c.role!=='start'&&c.role!=='end')c.rot=m.scramble[key];return c;});showStep(q('#resourceMissionStep'));setHint(M5().puzzle);enterPhase('med-puzzle',M5().puzzle);q('#missionPuzzleTitle').textContent=`任務 ${index+1}／${emergencyMissions.length}`;q('#missionPersonName').textContent=m.person;q('#missionStory').textContent=m.story;q('#missionProgressText').textContent=`任務完成 ${completed}／${emergencyMissions.length}`;q('#missionConditions').innerHTML=m.conditions.map(c=>`<div class="mission-condition-chip"><span>●</span><strong>${c}</strong></div>`).join('');q('#missionConditionStatus').innerHTML=m.conditions.map(c=>`<div data-condition-status="${c}"><span>○</span>${c}</div>`).join('');q('#puzzleLiveHint').textContent='';renderPuzzle();updateConnectivity();q('#routePuzzleBoard button:not(:disabled)')?.focus();}
function updateConnectivity(){const m=emergencyMissions[currentMission],start=getTile(m.start[0],m.start[1]);if(!start)return;const visited=new Set([`${start.row}-${start.col}`]),queue=[start];while(queue.length){const t=queue.shift();for(const side of tileSides(t)){const [dr,dc]=DELTA[side],next=getTile(t.row+dr,t.col+dc);if(!next||!tileSides(next).includes(OPP[side]))continue;const key=`${next.row}-${next.col}`;if(!visited.has(key)){visited.add(key);queue.push(next);}}}q('#routePuzzleBoard').querySelectorAll('.route-tile').forEach((cell,i)=>{const t=currentTiles[i];cell.classList.toggle('is-connected',visited.has(`${t.row}-${t.col}`));});const reached=new Set();currentTiles.forEach(t=>{if(t.role==='condition'&&visited.has(`${t.row}-${t.col}`))reached.add(t.label);});m.conditions.forEach(c=>{const row=q(`#missionConditionStatus [data-condition-status="${c}"]`);if(!row)return;const ok=reached.has(c);row.classList.toggle('is-reached',ok);row.querySelector('span').textContent=ok?'✓':'○';});const endKey=`${m.end[0]}-${m.end[1]}`,atEnd=visited.has(endKey);q('#puzzleLiveHint').textContent=`已接通 ${reached.size}／${m.conditions.length} 個條件${atEnd?'，終點已接通':''}。`;if(atEnd&&m.conditions.every(c=>reached.has(c)))completeMission();}
function completeMission(){if(solved)return;solved=true;completed=Math.max(completed,currentMission+1);q('#routePuzzleBoard').querySelectorAll('button').forEach(b=>b.disabled=true);q('#puzzleLiveHint').textContent='路徑完整接通！';const solvedIndex=currentMission;later(async()=>{const m=emergencyMissions[solvedIndex];await root.R5.star(q('#routePuzzleBoard'),completed);await root.R5.say([M5().solved(m.person)]);if(!app||!app.isConnected||currentMission!==solvedIndex)return;q('#missionResultType').textContent=m.unit.type;q('#missionResultName').textContent=m.unit.name;q('#missionResultDistrict').textContent=m.unit.district;q('#missionResultAddress').textContent=m.unit.address;q('#missionResultPhone').textContent=m.unit.phone;q('#nextEmergencyMission').textContent=currentMission<emergencyMissions.length-1?'下一個緊急任務':'完成醫療資源任務';showStep(q('#resourceMissionResult'));q('#nextEmergencyMission').focus();},650);}
function bind(){
  q('#medicineReturnRoom').onclick=exit;
  q('#openResourceQuery').onclick=()=>{showStep(q('#resourceQueryStep'));setHint(M5().query);enterPhase('med-query',M5().query);selectedDistrict=null;q('#queryUnitArea').hidden=true;renderDistricts();q('#districtChoices button')?.focus();};
  q('#startEmergencyMission').onclick=()=>{currentMission=0;completed=0;startMission(0);};
  q('#queryBackHome').onclick=home;q('#missionBackHome').onclick=home;
  q('#changeDistrict').onclick=()=>{selectedDistrict=null;q('#queryUnitArea').hidden=true;renderDistricts();q('#districtChoices button')?.focus();};
  q('#closeUnitDetail').onclick=closeUnit;q('#unitDetailDialog').onclick=e=>{if(e.target===q('#unitDetailDialog'))closeUnit();};
  q('#nextEmergencyMission').onclick=()=>{if(currentMission<emergencyMissions.length-1){startMission(currentMission+1);return;}showStep(q('#resourceFinalStep'));q('#resourceFinalReturn').hidden=true;(async()=>{await root.R5.say(M5().finish.map(x=>x.text),{position:'center'});if(!app||!app.isConnected)return;/* 第三修改計劃 B4:同一顆按鈕「完成學習」→ 寶物 →「返回廊道」 */root.StoryDialog.finishButton(q('#resourceFinalReturn'),{backLabel:'返回房間',finish:async()=>{root.AchievementSystem.completeActivity("cognition","medicine");},back:()=>exit()});later(()=>{const b=q('#resourceFinalReturn');if(b){b.hidden=false;b.focus();}},2800);})();};
}
function mount(target,onBack){dispose();app=target;back=onBack;selectedDistrict=null;currentMission=0;completed=0;currentTiles=[];solved=false;app.innerHTML=markup();bind();root.R5.init('med-home',M5().home,3,0);q('#resourceTitle').focus({preventScroll:true});root.scrollTo(0,0);}
root.CognitionMedicine={mount,dispose};
})(window);
