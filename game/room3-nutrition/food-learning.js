/* Offline, dependency-free experiential nutrition module. All positions use normalized units. */
(function(global){
'use strict';
const times=['06:00','09:00','12:00','15:00','18:00','20:00'];
const names=['早餐','上午點心','午餐','下午點心','晚餐','晚間補充'];
const capacities=[4,2,4,2,4,2];
const inventory=[['milk1','牛奶','milk',6],['milk2','牛奶','milk',6],['fruit1','蘋果','fruit',7],['fruit2','蘋果','fruit',7],['grain1','軟飯','grain',0],['grain2','地瓜','grain',9],['grain3','粥','grain',8],['veg1','青菜','veg',3],['veg2','高麗菜','veg',15],['veg3','菠菜','veg',3],['veg4','煮軟蔬菜','veg',15],['fish','蒸魚','protein',10],['tofu','豆腐','protein',2],['egg','雞蛋','protein',11],['nuts','堅果種子','nuts',12]].map(([id,name,type,sprite])=>({id,name,type,sprite}));
const scheduleLabels=['06:00 與 18:00 各有一份乳品','水果至少 2 份','蔬菜份數大於水果份數','全穀雜糧與蔬菜相差不超過 1 份','12:00 與 18:00 各有豆魚蛋肉','堅果種子至少 1 份','使用至少 4 個時段，且各時段未超量','全部 15 份食物安排完畢'];
const tasks={
 color:{title:'讓餐點多一點色彩',speech:'我覺得顏色都很淡，看了不太想吃……請保留原來的食物，再加至少兩種不同顏色的菜，讓盤中至少有三種顏色。',rules:['保留原有食物，並全部放在盤內','加入至少 2 種不同顏色的食物，盤中共至少 3 色'],recall:'剛才為白色餐點搭配不同顏色'},
 spread:{title:'把混在一起的餐點整理好',speech:'我覺得混在一起很像廚餘，沒胃口……請把所有食物留在盤內，分開擺，不要明顯疊在一起。',rules:['保留全部食物，並全部放在盤內','把食物分開，不要明顯重疊'],recall:'剛才把混在一起的食物分開擺放'},
 plates:{title:'用分盤，整理餐桌',speech:'我覺得這樣不夠精緻……可以幫我分裝嗎？請把全部食物分到至少兩個盤子，食物要在盤內。可以换大小，最多三個盤子。',rules:['保留全部食物，並全部放在盤內','使用至少 2 個盤子盛放食物（最多 3 盤）'],recall:'剛才增加餐盤，把食物分盤盛放'}
};
function scheduleCheck(schedule){
 const at=t=>inventory.filter(f=>schedule[f.id]===t), count=k=>inventory.filter(f=>times.includes(schedule[f.id])&&f.type===k).length;
 return {milkOK:at('06:00').some(f=>f.type==='milk')&&at('18:00').some(f=>f.type==='milk'),fruitOK:count('fruit')>=2,vegetableOK:count('veg')>count('fruit'),grainOK:count('grain')>0&&count('veg')>0&&Math.abs(count('grain')-count('veg'))<=1,proteinOK:['12:00','18:00'].every(t=>at(t).some(f=>f.type==='protein')),nutsOK:count('nuts')>=1,smallMealsOK:times.filter(t=>at(t).length).length>=4&&times.every((t,i)=>at(t).length<=capacities[i]),allAllocated:inventory.every(f=>times.includes(schedule[f.id]))};
}
function cutCheck(points,x){
 if(points.length<2)return false;
 const a=points[0],b=points[points.length-1];
 const ends=(Math.abs(a.y-55)<32&&Math.abs(b.y-245)<32)||(Math.abs(b.y-55)<32&&Math.abs(a.y-245)<32);
 return ends&&Math.abs(a.x-x)<28&&Math.abs(b.x-x)<28&&points.every(p=>Math.abs(p.x-x)<42);
}
const radius={large:23,medium:19,small:16};
function plateCheck(items,plates,variant){
 const food=items.filter(i=>i.on), owners=food.map(i=>plates.find(p=>Math.hypot(i.x-p.x,i.y-p.y)+i.r<=p.r+0.5));
 const contained=food.length>=3&&owners.every(Boolean), colors=new Set(food.map(i=>i.color)).size;
 const spread=food.every((a,i)=>food.slice(i+1).every(b=>Math.hypot(a.x-b.x,a.y-b.y)>=(a.r+b.r)*.9));
 const used=new Set(owners.filter(Boolean).map(p=>p.id)).size;
 const requirement=variant==='color'?colors>=3:variant==='spread'?spread:used>=2;
 return {contained,colorVariety:colors,spreadOK:spread,usedPlates:used,requirement,passed:contained&&requirement};
}
let cleanup=()=>{};
const C=(global.StoryCopy&&global.StoryCopy.room3&&global.StoryCopy.room3.food)||{};
function mount(root,onComplete,onReturn,hooks){
 cleanup();
 hooks=hooks||{};
 const SK=global.StoryKit,extra=()=>document.querySelector('#hintExtra');
 let controller,drag=null,phase=1,cutMode=false,cuts=[],done=false,introTimer=null,disposed=false;
 let variant=null,items=[],plates=[],selectedPlate='p1',talkTimer=null;
 let schedule=Object.fromEntries(inventory.map(f=>[f.id,'stock']));
 const log={version:'5.2',startedAt:new Date().toISOString(),scenario1:{cutAttempts:0,successfulCuts:0},scenario2:{schedule:{...schedule},moves:[],attempts:[]},scenario3:{variant:null,layout:[],plates:[],moves:[],attempts:[]}};
 global.learningLog=log;
 function save(){try{localStorage.setItem('nutrition.food.learningLog',JSON.stringify(log));}catch{}}
 function resetEvents(){clearInterval(talkTimer);clearTimeout(introTimer);introTimer=null;controller?.abort();drag?.ghost?.remove();drag=null;controller=new AbortController();}
 function dispose(){disposed=true;extra()?.replaceChildren();clearInterval(talkTimer);clearTimeout(introTimer);controller?.abort();drag?.ghost?.remove();drag=null;root.replaceChildren();save();}
 cleanup=dispose;
 const q=s=>root.querySelector(s),qa=s=>[...root.querySelectorAll(s)];
 function listen(el,type,fn){el.addEventListener(type,fn,{signal:controller.signal});}
 // 長輩的話與提示一律用共用的 NPC 對話(StoryDialog),按一下繼續
 async function talk(lines,opts){if(disposed)return;await SK.say(lines,Object.assign({clear:true},opts));}
 const say=talk,warn=s=>talk(s);
 function button(id,label){return `<button type="button" id="${id}" class="primary-button">${label}</button>`;}
 function sprite(n){return `<span class="fl-sprite" style="--sx:${(n%4)*100/3}%;--sy:${Math.floor(n/4)*100/3}%;--c:${n%4};--r:${Math.floor(n/4)}"></span>`;}
// 食物圖集 food-realistic-pixel.png 烘了深藍邊;room3-layout.js 會量出實際內容範圍(R3FoodBox,0~1 比例),新圖沒有邊時就是整張
const foodBox=()=>global.R3FoodBox||{x:0,y:0,w:1,h:1};
 function plateImg(){return `<img class="fl-plate-image" src="assets/plate-realistic.svg" alt="" aria-hidden="true">`;}
 function shell(title,speech,task,body,actions=''){
 resetEvents();extra()?.replaceChildren();
 root.innerHTML=`<section class="fl"><header class="fl-header"><div><h2>${title}</h2></div></header><div class="fl-stage">${body}</div><div class="fl-actions">${actions}</div></section>`;
 }
 function first(){
 shell('讓這一口，更容易入口','','',cutMode?`<div class="fl-cut"><svg viewBox="0 0 500 300" aria-label="切肉操作區"><defs><linearGradient id="meatBrown" x2="0" y2="1"><stop stop-color="#99613e"/><stop offset="1" stop-color="#5c3324"/></linearGradient></defs><rect x="5" y="5" width="490" height="290" rx="22" fill="#c39a6b"/><svg x="55" y="30" width="390" height="240" viewBox="${(foodBox().x+foodBox().w/4)*1024} ${foodBox().y*1024} ${foodBox().w*256} ${foodBox().h*256}" preserveAspectRatio="none"><image href="assets/food-realistic-pixel.png" width="1024" height="1024"/></svg>${[135,210,285,360].map((x,i)=>`<line x1="${x}" y1="55" x2="${x}" y2="245" stroke="${cuts.includes(i)?'#e9d6b4':'#eedfcb'}" stroke-width="${cuts.includes(i)?9:3}" stroke-dasharray="${cuts.includes(i)?'0':'9 8'}"/>`).join('')}<polyline class="fl-stroke" fill="none" stroke="#fff" stroke-width="4"/></svg></div>`:`<div class="fl-table"><div class="fl-simple-plate"><div>${sprite(0)}<small>飯</small></div><div>${sprite(3)}<small>菜</small></div><div class="${cuts.length===4?'fl-cut-pieces':''}">${cuts.length===4?Array.from({length:5},()=>sprite(1)).join(''):sprite(1)}<small>${cuts.length===4?'小肉塊':'大塊肉'}</small></div></div>${cuts.length<4?button('fl-knife',sprite(14)+'<span>拿起小刀</span>'):''}</div>`,'');
 if(cuts.length===4){(async()=>{await hooks.star?.(q('.fl-stage'));await talk(['這樣比較好入口，我吃得下了。','當長者咀嚼能力較弱時，可以利用切小、煮軟或改變料理方式，讓食物更容易入口。']);if(disposed)return;phase=2;begin();})();return;}
 hooks.hint?.('s1',C.s1);
 if(!cutMode){listen(q('#fl-knife'),'click',()=>{cutMode=true;first();});return;}
 const svg=q('svg');let points=null,pid=null;
 const point=e=>{const r=svg.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*500,y:(e.clientY-r.top)/r.height*300};};
 listen(svg,'pointerdown',e=>{if(e.button!==0||points)return;e.preventDefault();pid=e.pointerId;points=[point(e)];svg.setPointerCapture?.(pid);});
 listen(svg,'pointermove',e=>{if(!points||e.pointerId!==pid)return;points.push(point(e));q('.fl-stroke').setAttribute('points',points.map(p=>`${p.x},${p.y}`).join(' '));});
 listen(svg,'pointerup',e=>{if(!points||e.pointerId!==pid)return;points.push(point(e));log.scenario1.cutAttempts++;const hit=[135,210,285,360].findIndex((x,i)=>!cuts.includes(i)&&cutCheck(points,x));points=null;svg.releasePointerCapture?.(pid);if(hit>=0){cuts.push(hit);log.scenario1.successfulCuts=cuts.length;if(cuts.length===4)cutMode=false;save();first();}else{q('.fl-stroke').setAttribute('points','');warn('再沿著虛線試一次看看。');save();}});
 listen(svg,'pointercancel',()=>{points=null;q('.fl-stroke').setAttribute('points','');});
 }
 // One shared Pointer Events gesture handler per render; never clones game state.
 function wireDrag(selector,onDrop,onTap=()=>{}){
 qa(selector).forEach(el=>listen(el,'pointerdown',e=>{
 if(e.button!==0||drag)return;e.preventDefault();
 const ghost=el.cloneNode(true);ghost.removeAttribute('id');ghost.classList.add('fl-ghost');document.body.append(ghost);
 drag={id:el.dataset.drag,el,ghost,pid:e.pointerId,x:e.clientX,y:e.clientY,moved:false};el.classList.add('fl-dragging');el.setPointerCapture?.(e.pointerId);ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';
 }));
 listen(document,'pointermove',e=>{if(!drag||e.pointerId!==drag.pid)return;drag.moved ||= Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>4;drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';const hot=drag.moved?document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-board],[data-zone],[data-tray]'):null;qa('.fl-hot').forEach(n=>n!==hot&&n.classList.remove('fl-hot'));hot?.classList.add('fl-hot');});
 listen(document,'pointerup',e=>{if(!drag||e.pointerId!==drag.pid)return;const d=drag;drag=null;d.ghost.remove();d.el.classList.remove('fl-dragging');qa('.fl-hot').forEach(n=>n.classList.remove('fl-hot'));d.el.releasePointerCapture?.(d.pid);if(d.moved)onDrop(d.id,e);else onTap(d.id);});
 listen(document,'pointercancel',()=>{drag?.ghost.remove();drag?.el.classList.remove('fl-dragging');qa('.fl-hot').forEach(n=>n.classList.remove('fl-hot'));drag=null;});
 }
 function checklist(values,labels){return labels.map((label,i)=>`<div class="fl-rule ${values[i]?'fl-ok':''}"><span aria-label="${values[i]?'已達成':'未達成'}">${values[i]?'✓':'○'}</span><p>${label}</p></div>`).join('');}
 function second(){
 const checks=scheduleCheck(schedule),all=Object.values(checks).every(Boolean);
 Object.assign(log.scenario2,checks,{schedule:{...schedule}});save();
 const count=type=>inventory.filter(f=>f.type===type&&schedule[f.id]!=='stock').length;
 shell('把一天的食物，分開安排','','',`<div class="fl-stock fl-food-strip" data-zone="stock"><h3>今日食品選擇 <small>剩 ${inventory.filter(f=>schedule[f.id]==='stock').length} / 15 份</small></h3><div class="fl-cards">${cards('stock')}</div></div><div class="fl-planner"><aside class="fl-conditions"><h3>今天的安排條件</h3><small>早晚乳品是本關的任務規則。</small><div aria-live="polite">${checklist(Object.values(checks),scheduleLabels)}</div><p class="fl-counts">已安排：水果 ${count('fruit')} · 蔬菜 ${count('veg')} · 全穀雜糧 ${count('grain')}</p></aside><div class="fl-schedule">${times.map((t,i)=>`<section data-zone="${t}"><h3>${t} ${names[i]} <small>${inventory.filter(f=>schedule[f.id]===t).length} / ${capacities[i]}</small></h3><div class="fl-cards">${cards(t)}</div></section>`).join('')}</div></div>`,button('fl-submit','完成安排'));
 q('#fl-submit').disabled=!all;
 hooks.hint?.('s2',C.s2);
 wireDrag('[data-drag]',(id,e)=>{
 const zone=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-zone]')?.dataset.zone;
 if(!zone){warn('請放到時間格或上方食品列內。');return;}
 const i=times.indexOf(zone);
 if(i>=0&&schedule[id]!==zone&&inventory.filter(f=>schedule[f.id]===zone).length>=capacities[i]){warn('這個時段已放滿，請分到其他時間。');return;}
 const from=schedule[id];schedule[id]=zone;log.scenario2.moves.push({id,from,to:zone,at:Date.now()});second();
 });
 listen(q('#fl-submit'),'click',async()=>{
 if(!Object.values(scheduleCheck(schedule)).every(Boolean))return;
 log.scenario2.attempts.push({schedule:{...schedule},checks:{...checks}});save();resetEvents();
 await hooks.star?.(q('.fl-stage'));
 await talk(['這樣分開吃，好像比較沒壓力，也比較吃得完。','如果一餐吃不下很多時，可以把一天需要的食物分散到不同時段；同時仍要注意一天整體的食物種類與份量。']);
 if(disposed)return;phase=3;setupThird();begin();
 });
 }
 function cards(zone){return inventory.filter(f=>schedule[f.id]===zone).map(f=>`<div class="fl-card" data-drag="${f.id}" aria-label="拖曳${f.name}">${sprite(f.sprite)}<span class="fl-food-name">${f.name}</span></div>`).join('')||'<span class="fl-empty">拖曳食物到這裡</span>';}
 function setupThird(){
 variant=['color','spread','plates'][Math.floor(Math.random()*3)];
 plates=[{id:'p1',x:50,y:50,r:42,size:'large'}];
 items=[{id:'rice',name:'白飯',color:'white',sprite:0,r:9,x:34,y:42,on:true,base:true},{id:'tofu',name:'豆腐',color:'white',sprite:2,r:9,x:64,y:42,on:true,base:true},{id:'fish',name:'蒸魚',color:'white',sprite:10,r:9,x:50,y:65,on:true,base:true}];
 if(variant==='color')items.push(...[{id:'green',name:'綠色蔬菜',color:'green',sprite:3},{id:'pumpkin',name:'橙色南瓜',color:'orange',sprite:4},{id:'red',name:'紅色番茄',color:'red',sprite:5}].map(i=>({...i,r:8,x:50,y:50,on:false,base:false})));
 if(variant==='spread'){items[1].sprite=1;items[1].name='肉';items[1].color='brown';items[2].sprite=3;items[2].name='青菜';items[2].color='green';items.forEach((i,n)=>{i.x=48+n*2;i.y=49+n;});}
 if(variant==='plates'){items[1].sprite=1;items[1].name='肉';items[1].color='brown';items[2].sprite=3;items[2].name='青菜';items[2].color='green';}
 log.scenario3.variant=variant;
 }
 function boardHTML(preview=false){return `<div class="fl-board" ${preview?'':'data-board'}>${plates.map((p,i)=>`<div class="fl-dish ${!preview&&p.id===selectedPlate?'selected':''}" style="left:${p.x}%;top:${p.y}%;width:${p.r*2}%;height:${p.r*2}%">${plateImg()}${!preview&&variant==='plates'?`<span>盤 ${i+1}</span>`:''}</div>`).join('')}${items.filter(i=>i.on).map(i=>`<div class="fl-piece" ${preview?'':`data-drag="${i.id}"`} style="left:${i.x}%;top:${i.y}%;width:${i.r*2}%;height:${i.r*2}%">${sprite(i.sprite)}<small>${i.name}</small></div>`).join('')}</div>`;}
 function relayoutPlates(){
 const layouts={1:[[50,50]],2:[[26,50],[74,50]],3:[[26,26],[74,26],[50,74]]};
 plates.forEach((p,i)=>{[p.x,p.y]=layouts[plates.length][i];p.r=plates.length===1?({large:42,medium:35,small:29}[p.size]):radius[p.size];});
 }
 function third(){
 const check=plateCheck(items,plates,variant);Object.assign(log.scenario3,check,{layout:items.map(i=>({...i})),plates:plates.map(p=>({...p}))});save();
 const toolsTitle=variant==='color'?'可加入的色彩食材':variant==='plates'?'餐盤工具':'操作說明';
 const toolsBody=variant==='color'?`<div class="fl-cards">${items.filter(i=>!i.on).map(i=>`<div class="fl-card" data-drag="${i.id}">${sprite(i.sprite)}${i.name}</div>`).join('')||'<span class="fl-empty">食材都已加入</span>'}</div>`:variant==='plates'?`<label>選擇餐盤 <select id="fl-plate">${plates.map((p,i)=>`<option value="${p.id}">盤 ${i+1}</option>`).join('')}</select></label><label>尺寸 <select id="fl-size"><option value="large">大盤</option><option value="medium">中盤</option><option value="small">小盤</option></select></label><div class="fl-actions">${button('fl-add','新增餐盤')}${button('fl-remove','移除選中空盤')}</div>`:'';
 shell(tasks[variant].title,'','',`<div class="fl-plating"><aside class="fl-tools"${variant==='color'?' data-tray':''}${variant==='spread'?' style="visibility:hidden" aria-hidden="true"':''}><h3>${toolsTitle}</h3>${toolsBody}</aside>${boardHTML()}<aside class="fl-conditions"><h3>本次通關條件</h3>${checklist([check.contained,check.requirement],tasks[variant].rules)}${variant==='color'?`<p class="fl-counts">盤中色彩：${check.colorVariety} 種</p><div class="fl-swatches" aria-hidden="true">${[...new Set(items.filter(i=>i.on).map(i=>i.color))].map(c=>`<i style="background:${({white:'#f4f1e8',green:'#3d8f4d',orange:'#e8872b',red:'#d6402f',brown:'#8a5a38'})[c]||'#ccc'}"></i>`).join('')}</div>`:variant==='plates'?`<p class="fl-counts">已有 ${check.usedPlates} 個盤子盛放食物</p>`:''}</aside></div>`,button('fl-serve','端給長輩'));
 if(variant==='plates'){
 q('#fl-plate').value=selectedPlate;q('#fl-size').value=plates.find(p=>p.id===selectedPlate).size;q('#fl-add').disabled=plates.length>=3;
 listen(q('#fl-plate'),'change',e=>{selectedPlate=e.target.value;third();});
 listen(q('#fl-size'),'change',e=>{plates.find(p=>p.id===selectedPlate).size=e.target.value;relayoutPlates();log.scenario3.moves.push({action:'resize',plate:selectedPlate,size:e.target.value});third();});
 listen(q('#fl-add'),'click',()=>{if(plates.length>=3)return;const id=['p1','p2','p3'].find(id=>!plates.some(p=>p.id===id));plates.push({id,size:'large'});selectedPlate=id;relayoutPlates();log.scenario3.moves.push({action:'addPlate',id});third();});
 listen(q('#fl-remove'),'click',()=>{const p=plates.find(p=>p.id===selectedPlate);if(plates.length===1){warn('請保留至少一個餐盤。');return;}if(items.some(i=>i.on&&Math.hypot(i.x-p.x,i.y-p.y)<p.r+i.r)){warn('這個盤子還有食物，先把食物移走再移除。');return;}plates=plates.filter(p=>p.id!==selectedPlate);selectedPlate=plates[0].id;relayoutPlates();log.scenario3.moves.push({action:'removePlate',id:p.id});third();});
 }
 wireDrag('[data-drag]',(id,e)=>{
 const target=document.elementFromPoint(e.clientX,e.clientY),board=target?.closest('[data-board]'),item=items.find(i=>i.id===id);
 if(board){const r=board.getBoundingClientRect();Object.assign(item,{on:true,x:Math.max(item.r,Math.min(100-item.r,(e.clientX-r.left)/r.width*100)),y:Math.max(item.r,Math.min(100-item.r,(e.clientY-r.top)/r.height*100))});}
 else if(target?.closest('[data-tray]')&&!item.base)item.on=false;
 else{warn('請放到餐桌操作區；新增的色彩食物也可以拖回食材區。');return;}
 log.scenario3.moves.push({action:'moveFood',id,x:item.x,y:item.y,on:item.on});third();
 });
 listen(q('#fl-serve'),'click',async()=>{
 const result=plateCheck(items,plates,variant);log.scenario3.attempts.push({...result,layout:items.map(i=>({...i})),plates:plates.map(p=>({...p}))});save();
 if(!result.contained)say('有些食物還在盤外，請幫我放進盤子裡。');
 else if(!result.requirement)say(variant==='color'?'顏色還是有點淡，再加入不同顏色的菜吧。':variant==='spread'?'還有食物擠在一起，可以再分開一點嗎？':'請再分到另一個盤子，至少用兩盤盛放。');
 else{done=true;resetEvents();await hooks.star?.(q('.fl-stage'));await talk(['這樣看起來滿不錯的，我想吃看看。','份量、色彩與擺盤都可能影響進食意願；這次你運用了'+({color:'顏色搭配',spread:'分開擺盤',plates:'分盤盛放'}[variant])+'。']);if(!disposed)summary();}
 });
 }
 function previewPlate(food){return `<div class="fl-table fl-preview-table"><div class="fl-preview-plate">${plateImg()}<div class="fl-preview-foods">${food.map(n=>sprite(n)).join('')}</div></div></div>`;}
 function begin(){
 const speech=phase===1?'這塊肉太大了，我有點咬不動……':phase===2?'這麼多要我一次吃完，我真的吃不下啦……請幫我分開安排，等一下左側會列出今天的條件。':tasks[variant].speech;
 const scene=phase===1?previewPlate([0,3,1]):phase===2?`<div class="fl-table fl-feast">${inventory.map(f=>`<div>${sprite(f.sprite)}</div>`).join('')}</div>`:boardHTML(true);
 shell('先看看今天的餐桌','','',`<div class="fl-intro-scene">${scene}</div>`);
 const start=()=>{phase===1?first():phase===2?second():third();};
 introTimer=setTimeout(async()=>{if(disposed)return;await talk(speech);if(!disposed)start();},3000);
 }
 function summary(){
 if(!done)return;phase=4;save();
 const content=[['吃得下','剛才把大塊肉切小','依長者的咀嚼與進食能力，切小、煮軟、調整質地。'],['吃得夠','剛才把一天食物分開安排','一餐吃不下很多時，可以利用少量、多次的方式，讓一天累積的攝取量足夠。'],['吃得對','剛才兼顧各類食物','一天的食物仍要兼顧不同類別與適當份量，不能因為牙口不好，就只剩粥或少數食物。'],['吃得巧',tasks[variant].recall,'利用份量、色彩、香氣、料理方式、餐點變化與擺盤，提高長者的進食意願。']];
 const lines=['咀嚼比較吃力時，可以把食物切小、煮軟或調整質地，讓食物更容易入口。','一餐吃不下很多時，可以少量多餐，讓一天累積的攝取量足夠。','一天仍要吃到不同類別的食物，不能因為牙口不好，就只剩粥或少數食物。','利用色彩、香氣、料理方式與擺盤，也能提高長者的進食意願。'];
 const scenes=[
  {image:'story-food-01.png',caption:'阿公：零分！這不是牛排，是石頭吧？！阿嬤：哎呀，我再調整料理方法！'},
  {image:'story-food-02.png',caption:'阿公：這麼多？！妳要把我養成豬嗎？！阿嬤：我們可以分成好幾餐慢慢吃呀！'},
  {image:'story-food-03.png',caption:'阿公：這碗白粥軟軟的，我以後三餐都吃粥！阿嬤：營養不均衡，零分！'},
  {image:'story-food-04.png',caption:'阿公：十分！這才是我的米其林餐廳！阿嬤：食物多樣、好入口，我也給十分！'}
 ];
 let i=0;
 /* 與朋友版 w10_1114 整合:衛教改成四幕劇情插圖(左圖右文、圖下台詞);按鈕流程沿用本專案(B4 同一顆按鈕) */
 shell('餐桌照護體驗｜劇情衛教','','',`<div class="fl-story-layout"><figure class="fl-story-media"><img id="flStoryImage" alt="餐桌照護衛教劇情"><div id="flStoryMissing" class="fl-story-missing" hidden>第4幕劇情：阿公與阿嬤都給營養料理十分！<small>此幕正式圖片尚待匯入</small></div><figcaption id="flStoryCaption" class="fl-story-caption"></figcaption></figure><div class="fl-story-copy"><div class="edu-stepper"><p class="fl-story-eyebrow">一次看一個衛教重點</p><p id="flEduLine" class="edu-line" aria-live="polite"></p><div class="edu-controls"><button id="flSpeak" class="edu-speak">聽這一句</button><span id="flEduProgress" class="edu-progress"></span></div></div></div></div>`,button('fl-next-edu','下一句 ▶'));
 const img=q('#flStoryImage'),missing=q('#flStoryMissing');
 img.addEventListener('load',()=>{img.hidden=false;missing.hidden=true;},{signal:controller.signal});
 img.addEventListener('error',()=>{img.hidden=true;missing.hidden=false;},{signal:controller.signal});
 const rp=document.createElement('button');rp.type='button';rp.id='fl-replay';rp.className='secondary-button';rp.textContent='↺ 重新體驗';extra()?.replaceChildren(rp);
 talk(['謝謝你幫我把吃飯這件事，變得輕鬆一些。']);
 /* 第三修改計劃 B4:最後一句時同一顆按鈕「完成學習」→ 寶物 →「返回廚房」(寶物改在按下完成學習時給) */
 let stage='read';
 const render=()=>{q('#flEduLine').textContent=lines[i];q('#flEduProgress').textContent=`${i+1} / ${lines.length}`;if(stage==='read')q('#fl-next-edu').textContent=i===lines.length-1?'完成學習':'下一句 ▶';q('#flStoryCaption').textContent=scenes[i].caption;const src='assets/'+scenes[i].image;if(img.getAttribute('src')!==src){img.hidden=true;missing.hidden=true;img.src=src;}img.alt=`餐桌照護劇情，第 ${i+1} 幕`;};
 listen(q('#flSpeak'),'click',()=>{try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(lines[i]);u.lang='zh-TW';u.rate=.85;speechSynthesis.speak(u);}catch(e){}});
 listen(q('#fl-next-edu'),'click',async()=>{const b=q('#fl-next-edu');if(stage==='busy')return;if(stage==='back'){onReturn?.();return;}if(i<lines.length-1){i++;render();return;}stage='busy';b.disabled=true;log.completedAt=new Date().toISOString();save();try{await onComplete?.();}finally{if(!disposed){stage='back';b.disabled=false;b.textContent='返回房間';b.classList.remove('sd-stage-back');void b.offsetWidth;b.classList.add('sd-stage-back');}}});render();
 listen(rp,'click',()=>mount(root,onComplete,onReturn,hooks));
 }

 begin();
}
const api={mount,dispose:()=>{cleanup();cleanup=()=>{};},scheduleCheck,cutCheck,plateCheck,inventory,times,tasks};
global.FoodLearning=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
