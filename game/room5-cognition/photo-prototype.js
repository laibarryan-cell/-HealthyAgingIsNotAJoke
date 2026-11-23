/* 階段 1 代表性原型：認知房「牆上的照片」前半段。
   教育文字、題目、選項、正確答案(D)、回饋文字皆與 photo.js / photo-engine.js 原版逐字相同；
   只重做呈現與互動：原版「按繼續觀察×4 → 選答案 → 按下一句×4」改為
   「操作阿公與鏡子 → 看見倒影同步 → 作答(可重試) → 動手示範陪伴與遮鏡 → 理由出現在場景旁」。
   尚未接入房間獎勵：完成時只回呼 onComplete，不呼叫 AchievementSystem。 */
(function(root){'use strict';
const ANSWERS=['鏡子裡真的有另一個人。','阿公一定是故意開玩笑。','只要責備他不認真看，就能改善。','阿公可能難以辨識或理解眼前的影像。'];
const CORRECT=3;
const FB_RIGHT='答對了。看得到，不代表一定能正確理解影像。這可能涉及辨識、自我認知或記憶，不能只靠這個情境判定失智症。';
const FB_WRONG='再想一想：鏡中是阿公的倒影。不是有陌生人，也不能直接說他故意或不認真；請思考理解影像的困難。';
const EDU=[
 '有些認知變化可能讓人看見影像，卻無法正確理解眼前看到的是什麼。',
 '如果倒影讓長者不安，先陪伴和安撫，不要責備、爭辯或強迫他承認。',
 '可以遮住讓他困擾的鏡面，夜晚的窗戶有倒影時也可以拉上窗簾並保持照明。',
 '如果這類情況反覆發生、影響生活，或突然出現明顯混亂，應尋求專業評估。'
];
const INTRO=['孫子','阿公，這是我們上次一起出去玩的照片。'];
const ACTS=[
 {id:'walk',label:'① 陪阿公走向鏡子',dx:'26%',who:'narrator',title:'經過一面鏡子',text:'阿公走到鏡子前，稍微挪動身體。鏡子裡的人也跟著他一起動。'},
 {id:'wave',label:'② 請阿公揮揮手',wave:true,who:'elder',title:'那個人是誰？',text:'那個人是誰？他怎麼一直看著我？'},
 {id:'back',label:'③ 請阿公往後退一步',dx:'8%',who:'elder',title:'熟悉的家，卻覺得不安心',text:'他怎麼會在我們家裡？'}
];
const END_NARR={title:'看得見，卻未必能理解',text:'鏡中是阿公自己的倒影，但這個情境中的阿公沒有認出來。接下來，想想可能的原因。'};
let app,back,onComplete,epoch=0,timers=[],S;
const $=s=>app.querySelector(s);
function later(fn,ms){const t=epoch;timers.push(setTimeout(()=>{if(t===epoch)fn();},ms));}
function dispose(){epoch++;timers.forEach(clearTimeout);timers=[];}
function who(w){return w==='elder'?'阿公':w==='grandson'?'孫子':'旁白';}
function sceneHTML(){
 const names={mirror:'鏡子',photo:'照片',lamp:'燈',chair:'椅子'};
 return `<div id="ppScene" class="p-scene day"><img class="p-background" src="assets/photo/mirror-day.png" alt="日間走道一角，有照片、燈、椅子和鏡子">
 <div class="p-glass" aria-label="鏡子裡是阿公自己的倒影"><div class="p-reflection-motion"><div class="p-reflection" data-mm-character="player" data-mm-foot-anchor="true" data-mm-flip="true" aria-label="阿公的倒影，五官與衣著和本人相同"></div></div><div class="p-cover" aria-hidden="true"></div></div>
 <div class="p-actor-motion"><div class="p-actor" data-mm-character="player" data-mm-foot-anchor="true" data-mm-view="back" aria-label="站在鏡前的阿公"></div></div>
 <span class="p-state">白天 · 熟悉的家</span>
 ${['mirror','chair'].map(id=>`<button class="p-target p-target-${id}" data-ppobj="${id}" hidden aria-label="${names[id]}"><span>${names[id]}</span></button>`).join('')}
 </div>`;
}
function shell(){
 app.innerHTML=`<section class="pp-root cog-photo" data-module="photo-proto"><header class="pp-bar"><button class="pp-back" id="ppBack">← 返回房間</button><span class="pp-badge">原型</span><h1 class="pp-title" id="ppTitle" tabindex="-1">照片裡的回憶（互動原型）</h1><button class="pp-restart" id="ppRestart">重新開始</button></header>
 <div class="pp-main"><div class="pp-stage">${sceneHTML()}</div><aside class="pp-panel" id="ppPanel" aria-live="polite"></aside></div></section>`;
 root.MemoryMazeCharacters?.renderWithin?.(app);
 $('#ppBack').onclick=()=>{dispose();back&&back();};
 $('#ppRestart').onclick=()=>start();
 app.querySelectorAll('[data-ppobj]').forEach(b=>b.onclick=()=>objClick(b.dataset.ppobj));
}
function setScene(dx,wave){const sc=$('#ppScene');
 if(dx!=null){for(const el of [$('.p-actor-motion'),$('.p-reflection-motion')])el.style.setProperty('--dx',dx);}
 if(wave){sc.classList.add('pp-wave');later(()=>sc.classList.remove('pp-wave'),2200);}}
function say(w,text){S.lines.push([w,text]);const el=$('#ppSay');if(el)el.innerHTML=`<strong>${who(w)}</strong><p></p>`,el.querySelector('p').textContent=text;}
function logHTML(){return `<ul class="pp-log" aria-label="目前為止看到的紀錄">${S.log.map(l=>`<li class="${l.edu?'pp-edu':''}">${l.t}</li>`).join('')}</ul>`;}
function esc(t){return t.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function start(){dispose();S={phase:'intro',done:new Set(),log:[],lines:[],eduIdx:0,chair:false,cover:false};shell();setScene('0%');$('#ppScene').classList.remove('mirror-covered');
 const t=$('#ppTitle');t.textContent='照片裡的回憶（互動原型）';
 $('#ppPanel').innerHTML=`<p class="pp-step">開場</p><div class="pp-say" id="ppSay"><strong>${INTRO[0]}</strong><p>「${INTRO[1]}」</p></div><p class="pp-note">阿公看了一會兒，往旁邊走，經過走道上的鏡子……</p><p class="pp-note">這是衛教示意，不是認知測驗。你可以直接操作阿公，看看會發生什麼事。</p><button class="pp-primary" id="ppBegin">開始觀察</button>`;
 $('#ppBegin').onclick=acts;$('#ppBegin').focus();}
function acts(){S.phase='act';$('#ppTitle').textContent='先看看發生什麼事';renderActs();}
function nextAct(){return ACTS.find(a=>!S.done.has(a.id));}
function renderActs(){const n=nextAct();
 $('#ppPanel').innerHTML=`<p class="pp-step">觀察 ${S.done.size} / ${ACTS.length}</p><div class="pp-say" id="ppSay"><strong>旁白</strong><p>${n?'按下面亮起的按鈕，看阿公與鏡子裡的人怎麼動。':''}</p></div>
 <div class="pp-actions">${ACTS.map(a=>`<button data-act="${a.id}" class="${S.done.has(a.id)?'done':''}" ${(S.done.has(a.id)||a!==n)?'disabled':''}>${a.label}</button>`).join('')}</div>${S.log.length?logHTML():''}
 ${n?`<p class="pp-hint">下一步：${n.label.slice(2)}</p>`:''}`;
 const lastLog=S.lines[S.lines.length-1];if(lastLog&&S.done.size){const el=$('#ppSay');el.innerHTML=`<strong>${who(lastLog[0])}</strong><p></p>`;el.querySelector('p').textContent=lastLog[1];}
 const b=n&&$(`[data-act="${n.id}"]`);if(b){b.classList.add('pp-glow');b.focus();b.onclick=()=>doAct(n);}}
function doAct(a){if(S.done.has(a.id)||a!==nextAct())return;S.done.add(a.id);setScene(a.dx,a.wave);S.log.push({t:`${who(a.who)}：${esc(a.text)}`});say(a.who,a.text);
 $('#ppPanel').querySelectorAll('button').forEach(b=>b.disabled=true);
 later(()=>{if(S.done.size===ACTS.length){endObserve();}else renderActs();},1500);}
function endObserve(){S.log.push({t:`旁白：${esc(END_NARR.text)}`});say('narrator',END_NARR.text);$('#ppTitle').textContent=END_NARR.title;
 $('#ppPanel').innerHTML=`<p class="pp-step">觀察完成</p><div class="pp-say" id="ppSay"><strong>旁白</strong><p></p></div>${logHTML()}<button class="pp-primary" id="ppAsk">想一想：可能發生什麼事？</button>`;$('#ppSay p').textContent=END_NARR.text;$('#ppAsk').onclick=question;$('#ppAsk').focus();}
function question(){S.phase='question';$('#ppTitle').textContent='阿公可能遇到什麼困難？';
 $('#ppPanel').innerHTML=`<p class="pp-step">想一想</p><p class="pp-say" style="font-size:21px;font-weight:700;margin:0">阿公看見鏡子裡的人，卻認為家裡有陌生人，可能代表什麼？</p><div class="pp-answers">${ANSWERS.map((a,i)=>`<button data-ans="${i}">${String.fromCharCode(65+i)}. ${a}</button>`).join('')}</div><p class="pp-feedback" id="ppFb" role="status"></p><button class="pp-primary" id="ppLearn" hidden>了解影像辨識與陪伴方式</button>`;
 app.querySelectorAll('[data-ans]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.ans),ok=i===CORRECT;$('#ppFb').textContent=ok?FB_RIGHT:FB_WRONG;b.classList.add(ok?'right':'wrong');
  if(ok){app.querySelectorAll('[data-ans]').forEach(x=>x.disabled=true);$('#ppLearn').hidden=false;$('#ppLearn').focus();}});
 $('#ppLearn').onclick=edu;app.querySelector('[data-ans]').focus();}
function eduLine(i){S.log.push({t:EDU[i],edu:true});}
function edu(){S.phase='edu';S.eduIdx=0;S.log=[];$('#ppTitle').textContent='眼睛看見了，大腦仍需要理解';
 app.querySelectorAll('[data-ppobj]').forEach(b=>b.hidden=false);eduLine(0);renderEdu();}
function renderEdu(){const n=S.eduIdx;let hint='';
 if(n===0){hint='點場景裡的「椅子」，陪阿公坐一下。';}else if(n===1){hint='點場景裡的「鏡子」，暫時遮住讓他不安的鏡面。';}
 $('#ppPanel').innerHTML=`<p class="pp-step">先理解感受，再調整環境　${Math.min(S.log.length,4)} / 4</p>${logHTML()}${hint?`<p class="pp-hint">${hint}</p>`:''}<p class="pp-feedback" id="ppFb" role="status"></p>${n>=3?'<button class="pp-primary" id="ppFinish">完成衛教</button>':''}`;
 app.querySelectorAll('[data-ppobj]').forEach(b=>{b.classList.toggle('pp-glow',(n===0&&b.dataset.ppobj==='chair')||(n===1&&b.dataset.ppobj==='mirror'));});
 if(n>=3){$('#ppFinish').onclick=complete;$('#ppFinish').focus();app.querySelectorAll('[data-ppobj]').forEach(b=>{b.hidden=true;});}}
function objClick(id){if(S.phase!=='edu')return;const n=S.eduIdx;
 if(id==='chair'){if(n===0){S.eduIdx=1;setScene('-6%');eduLine(1);renderEdu();$('#ppFb').textContent='孫子：我陪您坐一下，我們慢慢來。陪伴是好的開始。';}else if(n>=1){$('#ppFb').textContent='已經陪伴阿公了。接著處理讓他不安的鏡子。';}return;}
 if(id==='mirror'){if(n===0){$('#ppFb').textContent='先陪伴和安撫阿公：點「椅子」，陪他坐一下。';return;}
  if(n===1){S.eduIdx=2;$('#ppScene').classList.add('mirror-covered');eduLine(2);S.eduIdx=3;eduLine(3);renderEdu();$('#ppFb').textContent='已暫時遮住這面造成困擾的鏡子。保持照明，繼續陪伴並觀察阿公是否舒服一些。';}}}
function complete(){S.phase='done';$('#ppTitle').textContent='完成 · 看見感受，也看見環境';
 $('#ppPanel').innerHTML=`<p class="pp-step">原型前半段完成</p>${logHTML()}<p class="pp-note">原版接下來是三回合的「陪伴評量」，本原型尚未重做；完成後也未接入房間獎勵。</p><button class="pp-primary" id="ppAgain">重新體驗</button>`;
 $('#ppAgain').onclick=start;$('#ppAgain').focus();
 try{onComplete&&onComplete();}catch(e){}}
root.CognitionPhotoPrototype={mount(target,onBack,done){dispose();app=target;back=onBack;onComplete=done;start();},dispose,_state:()=>S};
})(window);
