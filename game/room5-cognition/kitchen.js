/* kitchen.js — 認知房「廚房門」(廚房晚餐)。
   第二修改計劃(C5-1):阿公一開始就在廚房裡;物品改成按鈕按下的回饋(不加框);阿公離開用走路動畫;
   鹽罐與「要怎麼提醒阿公」先播 NPC 與阿公的對話,對話結束才出題;鍋子步驟改成左圖右互動、拖曳字卡、「全部重來」。
   情境觀察、題目、選項、正解、回饋與衛教文字皆維持原文,只改呈現方式;最後一關(關火再離開)遊玩邏輯不變。 */
(function(root){'use strict';
/* ===== 鹽罐圖檔路徑集中設定:ChatGPT 正式圖到了,把 SALT_TEMP 改成 "" 並放入同資料夾即可(不改其他程式) ===== */
const SALT_TEMP='';
const SALT_ART={normal:`assets/kitchen/salt-shaker${SALT_TEMP}.png`,lifted:`assets/kitchen/salt-shaker-lifted${SALT_TEMP}.png`};
/* 場景物件位置(廚房圖的比例座標 x,y,w,h) */
const BOX={pan:[.50,.385,.155,.095],stove:[.48,.455,.19,.085],exit:[.765,.03,.175,.74],salt:[.272,.33,.05,.15]};
const ELDER={x:42,y:98},ELDER3={x:32,y:99};
/* 第二修改計劃追加 B5-1:阿公只走地板;腳越靠畫面下方(越近)越大,走進客廳門口時變小(遠近) */
const depthH=y=>Math.max(28,Math.min(70,30+(y-68)/(99-68)*40))+'%';
/* 前景家具(餐桌、椅背、花瓶)的輪廓,比例座標 %;阿公走到這後面時會被擋住 */
const FRONT='polygon(80.5% 75.5%,85% 75.5%,85% 66%,86.5% 64.5%,95.5% 64.5%,95.5% 55%,93% 50%,100% 48%,100% 100%,80.5% 100%)';
const LABELS={pan:'鍋子',stove:'爐台',exit:'客廳出口',salt:'鹽罐'};

const E=root.CognitionKitchenEngine;let app,back,pending=[],epoch=0,state,photo='assets/kitchen/education-poster.jfif';
const R=()=>root.R5,C=()=>root.StoryCopy.room5.kitchen,K=()=>root.StoryKit;
const q=s=>app.querySelector(s),on=(id,fn)=>{q('#'+id).onclick=fn;};
const alive=token=>token===epoch&&app&&app.isConnected;
/* 可暫停的計時器:NPC 對話出現時暫停,結束後接續剩餘時間 */
function arm(t){t.start=Date.now();t.id=setTimeout(()=>{t.done=true;if(t.token===epoch)t.fn();},t.ms);}
function later(fn,ms){const t={fn,ms,token:epoch,done:false};arm(t);pending.push(t);return t;}
const PAUSER={pause(){pending.forEach(t=>{if(!t.done&&!t.paused){clearTimeout(t.id);t.ms-=Date.now()-t.start;t.paused=true;}});},resume(){pending.forEach(t=>{if(!t.done&&t.paused){t.paused=false;arm(t);}});}};
function cancel(){epoch++;pending.forEach(t=>clearTimeout(t.id));pending=[];}
function dispose(){cancel();R().setPauser(null);}
function exit(){dispose();back();}
const wait=ms=>new Promise(r=>later(r,ms));
const who=w=>w==='elder'?'player':w==='grandson'?'grandson':'npc';
function talk(lines,opts){return R().talk(lines.map(l=>({who:l[0],text:l[1]})),opts);}
function screen(step,body,hint,filled,hintId,cls=''){cancel();R().setPauser(PAUSER);app.innerHTML=`<section class="cog-kitchen module-view ${cls}" data-module="kitchen">${R().header({title:C().title})}${hint?R().toolbar():''}${step?`<h2 class="r5-step">${step}</h2>`:''}${body}</section>`;on('returnRoom',exit);root.MemoryMazeCharacters?.renderWithin(app);root.scrollTo(0,0);placeElder();const token=epoch;return R().init(hintId,hint,5,filled).then(()=>token);}
const pct=v=>(v*100).toFixed(2)+'%';
/* 場景物件 = 從廚房圖裁出的同一塊畫面,按下時下壓、放大、變亮(C1) */
function obj(key,label){const [x,y,w,h]=BOX[key];
  const bg=`background-image:url('assets/kitchen/kitchen.png');background-size:${(100/w).toFixed(2)}% ${(100/h).toFixed(2)}%;background-position:${(x/(1-w)*100).toFixed(2)}% ${(y/(1-h)*100).toFixed(2)}%`;
  return `<button type="button" class="k-obj sk-press k-obj-${key}" data-kobject="${key}" style="left:${pct(x)};top:${pct(y)};width:${pct(w)};height:${pct(h)}" aria-label="${label}"><i class="sk-crop" aria-hidden="true" style="${bg}"></i><span class="sk-press-name">${label}</span></button>`;}
function saltObj(){const [x,y,w,h]=BOX.salt;return `<button type="button" class="k-obj sk-press k-obj-salt" data-kobject="salt" style="left:${pct(x)};top:${pct(y)};width:${pct(w)};height:${pct(h)}" aria-label="鹽罐"><img src="${SALT_ART.normal}" alt=""><span class="sk-press-name">鹽罐</span></button>`;}
function scene({fire=true,salt=false,targets=[]}={}){
  const labels={pan:'鍋子',stove:'爐台',exit:'客廳出口'};
  /* 圖層(由下而上):背景 → 物件 → 阿公 → 前景家具 → 文字標籤 → 警示條 → 選單;文字永遠在最上層(C3) */
  const tags=targets.map(t=>{const [x,y,w]=BOX[t];const inside=y<.1;return `<span class="sk-label k-tag${inside?' k-tag-in':''}" data-tag="${t}" style="left:${pct(x+w/2)};top:${pct(inside?y+.03:y)}">${LABELS[t]}</span>`;}).join('');
  return `<div class="k-stage k-stage-solo"><div id="kScene" class="k-scene ${fire?'fire-on':'fire-off'} ${salt?'seasoning':''}"><img class="k-background" src="assets/kitchen/kitchen.png" alt="家中的半開放式廚房，左側有水槽，中間是爐台，右側通往客廳"><div class="k-heat" aria-hidden="true"><i></i><i></i><i></i></div><img class="k-salt-lift" src="${SALT_ART.lifted}" alt="" aria-hidden="true">${targets.includes('salt')?saltObj():''}${targets.filter(t=>t!=='salt').map(t=>obj(t,labels[t])).join('')}<img class="k-front" src="assets/kitchen/kitchen.png" alt="" aria-hidden="true" style="clip-path:${FRONT};-webkit-clip-path:${FRONT}"><div class="k-tags" aria-hidden="true">${tags}<span class="k-stove-state sk-label">${fire?'爐火：開啟':'爐火：已關閉'}</span></div><div class="k-danger-banner" hidden>先停下！爐火還沒關</div><section id="kMenu" class="k-object-menu" hidden aria-label="物件操作選單"></section></div></div>`;}
/* 阿公(玩家角色)從一開始就站在廚房裡,用走路圖集繪製 */
function placeElder(at=ELDER){const sc=q('#kScene');if(!sc)return;K().walker(sc,at,{height:depthH(at.y)}).classList.add('k-elder');}
const elderEl=()=>{const sc=q('#kScene');return sc&&sc.querySelector('.k-elder');};
/* 走路一律沿地板的路線點,邊走邊依遠近改大小(仍用 MemoryMazeCharacters.prepareWalk 的走路圖集) */
function walkPath(points,speed,endFacing){const sc=q('#kScene'),w=elderEl();if(!w)return Promise.resolve();
  return K().walk(sc,points,{el:w,speed,endFacing,onMove:(x,y)=>{w.style.height=depthH(y);tagClear();}}).then(r=>{tagClear();return r;});}
/* 追加二 C1:阿公與文字互不遮蓋 → 阿公經過時,與他重疊的標籤暫時淡出,走開後再顯示(標籤仍在最上層) */
function tagClear(){const w=elderEl();const tags=app.querySelectorAll('.k-tags .sk-label');if(!w||!w.isConnected||w.classList.contains('k-gone')){tags.forEach(t=>t.classList.remove('k-tag-dim'));return;}
  const r=w.getBoundingClientRect(),a={l:r.left+r.width*.05,r:r.right-r.width*.05,t:r.top+r.height*.04,b:r.bottom};
  tags.forEach(t=>{const b=t.getBoundingClientRect();t.classList.toggle('k-tag-dim',b.right>a.l&&b.left<a.r&&b.bottom>a.t&&b.top<a.b);});}
/* 客廳出口路線:前景地板 → 吧台轉角 → 門口 → 客廳(會走到餐桌椅背後面) */
const EXIT_PATH=[{x:60,y:97},{x:75,y:90},{x:80.5,y:80},{x:84,y:71},{x:87,y:66}];
async function walkOut(){const w=elderEl();if(!w)return;w.classList.add('k-leaving');await walkPath(EXIT_PATH,16);if(w.isConnected)w.classList.add('k-gone');tagClear();await wait(450);}
async function walkToward(){await walkPath([{x:60,y:97},{x:73,y:91}],16);}
async function walkBack(){await walkPath([{x:60,y:97},{x:ELDER3.x,y:ELDER3.y}],20,'down');}
function bindTargets(fn){app.querySelectorAll('[data-kobject]').forEach(b=>b.onclick=()=>fn(b.dataset.kobject));}
/* 物件旁的選單(最後一關):放大、高對比 */
function menu(object,title,choices){const el=q('#kMenu');el.hidden=false;el.setAttribute('class','k-object-menu k-choice near-'+object);el.innerHTML=`<h3>${title}</h3>${choices.map((c,i)=>`<button data-kchoice="${i}">${c.text}</button>`).join('')}<button id="kCloseMenu" class="k-menu-back">收起選單</button>`;el.querySelectorAll('[data-kchoice]').forEach(b=>b.onclick=()=>{el.hidden=true;choices[Number(b.dataset.kchoice)].run();});on('kCloseMenu',()=>{el.hidden=true;q(`[data-kobject="${object}"]`)?.focus();});el.querySelector('[data-kchoice]').focus();}
/* 危險警示:震動與警示條保留,說明文字改由 NPC 對話念出 */
async function danger(extra=[]){const stage=q('#kScene');stage.classList.remove('danger-active','k-impact');void stage.offsetWidth;stage.classList.add('danger-active','k-impact');q('.k-danger-banner').hidden=false;later(()=>stage.classList.remove('k-impact'),650);
  await R().say([...extra,'先確認爐火！','爐火還開著，現在不能把鍋子留著就離開。請陪阿公回到爐台，確認關火後，再一起去客廳。']);}
const wrongSay=text=>R().say([text]);
const stories=[
{speaker:'narrator',text:'阿公以前常替家人煮晚餐，這道炒青菜已經做了很多年。但最近幾週，家人發現一些和平常不同的情況。',note:'請觀察：是否反覆發生？和以前有什麼不同？'},
{speaker:'elder',text:'加一點鹽，這樣就可以了。',salt:true,note:'阿公已經在鍋裡加過鹽。'},
{speaker:'elder',text:'這個是不是還沒調味？再加一點好了。',salt:true,note:'阿公又拿起鹽罐，準備重複調味。'},
{speaker:'grandson',text:'阿公，我剛剛有看到您加過鹽，我們先不要再加了。',note:'不是爭辯誰記錯，而是先溫和提醒。'},
{speaker:'elder',text:'我剛剛有加過嗎？我不記得了。',note:'家人發現，類似「忘記剛做過的事」的情況，最近已反覆出現。'},
{speaker:'elder',text:'接下來要先做什麼？以前明明一下就做好了……',note:'最近做這道熟悉的菜，阿公經常需要家人逐步提醒。'},
{speaker:'elder',text:'我去客廳看一下電視，鍋子放著就好。',leaving:true,note:'留意爐台：火還開著。'},
{speaker:'grandson',text:'阿公，火還開著，我陪您先關好，再一起過去。',fire:false,note:'家人陪同確認關火；不是責備，也不是讓鍋子繼續無人看顧。'}
];
async function story(index=0){const s=stories[index];
  const token=await screen('',scene(s),C().hintStory,0,'k-story');
  if(!alive(token))return;
  if(s.leaving){const walking=walkToward();await talk([[who(s.speaker),s.text]],{position:'bottom',clear:true});await walking;if(!alive(token))return;await danger();if(!alive(token))return;await walkBack();if(!alive(token))return;await talk([['npc',s.note]],{position:'bottom',clear:true});}
  else await talk([[who(s.speaker),s.text],['npc',s.note]],{position:'bottom',clear:true});
  if(!alive(token))return;
  if(index<stories.length-1)story(index+1);else{await R().star(q('#kScene'),1);if(alive(token))question();}}
async function question(){const answers=['偶爾口味不同，就一定是失智症。','最近反覆忘記做過的事，熟悉的料理需要逐步提醒，還出現與以前不同的安全判斷。','只要阿公還認得家人，就不需要留意。','阿公只是故意不認真，責備他就會改善。'];
  const token=await screen('',`<div class="k-paper k-question k-choice" data-after-dialog><h3 class="k-q-title">哪些變化值得進一步關心？</h3><div id="kAnswers" class="p-answers">${answers.map((a,i)=>`<button data-kanswer="${i}" class="k-answer">${String.fromCharCode(65+i)}. ${a}</button>`).join('')}</div></div>`,C().hintQuestion,1,'k-question','k-mode-quiz');
  if(!alive(token))return;app.querySelectorAll('[data-kanswer]').forEach(b=>b.disabled=true);
  await R().quiz({list:q('#kAnswers'),ask:C().questionAsk,wonder:C().wonder,alive:()=>alive(token)});
  if(!alive(token))return;app.querySelectorAll('[data-kanswer]').forEach(b=>b.disabled=false);
  app.querySelectorAll('[data-kanswer]').forEach(b=>b.onclick=async()=>{const correct=b.dataset.kanswer==='1';root.AchievementSystem.learning.judgment('cognition','kitchen',correct);
    await R().say([correct?'答對了。重點是和以前相比，反覆發生且影響生活與安全的變化；不能只靠這個情境就診斷失智症。':'再想一想：不是單次煮錯菜，也不能把困難認定為故意。請留意最近反覆發生、與以前不同的情況。']);
    if(correct&&alive(token)){await R().star(b,2);if(alive(token))learn();}});}
/* 與朋友版 w10_1114 整合:衛教頁改成朋友版的四幕劇情短劇(cognition-story.js,內容與流程照朋友版);外觀由 room5-story-unify.css 套用本專案風格 */
function learn(){cancel();root.CognitionStory.show(app,'kitchen',()=>{state=E.initial();roundOne();},exit);}
/* 第一回合:阿公又拿起鹽罐 → 點旁邊的鹽罐 → NPC 與阿公對話 → 選擇題(放大、清楚) */
async function roundOne(){
  const token=await screen('這件事做過了嗎？',`<div class="k-split k-split-wide k-collapsed">${scene({salt:true,targets:['salt']})}<section id="kSaltQuiz" class="k-paper k-choice k-side" data-after-dialog hidden><h3 class="k-q-title">阿公又拿起鹽罐</h3><div id="kSaltChoices" class="p-answers"></div><p id="kRecord" class="k-step-card done" hidden>✓ 調味：已完成</p></section></div>`,C().hintRound1,2,'k-r1','k-mode-split');
  if(!alive(token))return;const salt=q('[data-kobject="salt"]');salt.disabled=true;
  await talk([['player','加一點鹽，味道就好了。']],{position:'bottom',clear:true});
  if(!alive(token))return;
  await wait(2200);if(!alive(token))return;
  state=E.act(state,'observe');q('#kScene').classList.remove('seasoning');
  await talk([['player','這個是不是還沒調味？']],{position:'bottom',clear:true});
  if(!alive(token))return;salt.disabled=false;salt.classList.add('k-hot');
  const choices=[{text:'再加一次。',run:()=>wrongSay('剛才已經加過鹽。先確認做過的事，避免重複調味。')},{text:'溫和提醒已經加過，並在步驟卡上標記完成。',run:async(btn)=>{state=E.act(state,'record');if(!state.recorded)return;q('#kRecord').hidden=false;app.querySelectorAll('[data-ksalt]').forEach(x=>x.disabled=true);salt.disabled=true;q('#kScene').classList.remove('seasoning');
    await R().say(['做得好！用看得見的記錄協助，避免重複操作。阿公放下鹽罐。']);if(!alive(token))return;await closeSplit();
    if(!alive(token))return;await R().star(q('#kRecord'),3);if(!alive(token))return;state=E.act(state,'next');if(state.round===2)roundTwo();}},{text:'責備：「你怎麼又忘了？」',run:()=>wrongSay('責備不能幫助阿公想起來。試著溫和提醒，並留下容易查看的紀錄。')}];
  bindTargets(async()=>{if(!q('#kSaltQuiz').hidden)return;salt.classList.remove('k-hot');q('#kScene').classList.add('seasoning');
    await talk(C().saltTalk.map(l=>[l.who,l.text]),{position:'bottom'});
    if(!alive(token))return;
    const list=q('#kSaltChoices');list.innerHTML=choices.map((c,i)=>`<button data-ksalt="${i}" class="k-answer">${String.fromCharCode(65+i)}. ${c.text}</button>`).join('');
    list.classList.add('sk-drop-list');K().dropHide(list);q('#kSaltQuiz').hidden=false;await openSplit();if(!alive(token))return;K().dropShow(list);
    list.querySelectorAll('[data-ksalt]').forEach(b=>b.onclick=()=>choices[Number(b.dataset.ksalt)].run(b));
    list.querySelector('button')?.focus();});}
/* 第二回合:左圖右互動;拖曳三張步驟字卡到順序格,「全部重來」清空;排對後先對話,再選提醒方式 */
async function roundTwo(){
  const token=await screen('下一步是什麼？',`<div class="k-split k-collapsed">${scene({targets:['pan'],fire:false})}<section id="kSorting" class="k-paper k-side k-sorting2"><p id="kPanTip" class="k-tip">點左邊的鍋子，開始排步驟。</p><div id="kSortBody" hidden><h3 class="k-q-title">把步驟卡拖到順序格</h3><div id="kCards" class="k-cards2" aria-label="步驟字卡"></div><ol id="kOrder" class="k-order2"></ol><div class="k-sort-actions"><button id="kReset" type="button">全部重來</button><button id="kCheckOrder" type="button">確認順序</button></div></div><div id="kSupport" class="k-choice" data-after-dialog hidden><h3 class="k-q-title">要怎麼提醒阿公？</h3><div id="kSupportList" class="p-answers"><button data-ksupport="fast" class="k-answer">A. 一次把所有步驟快速說完。</button><button data-ksupport="one" class="k-answer">B. 一次提醒一個步驟，完成後再提示下一步。</button><button data-ksupport="blame" class="k-answer">C. 責備他連這個都不會。</button></div></div></section></div>`,C().hintRound2,3,'k-r2','k-mode-split');
  if(!alive(token))return;{const old=elderEl();if(old){old.remove();placeElder(ELDER3);}}
  await talk([['player','接下來要先做什麼？'],['npc','菜已洗好、切好，但還沒下鍋。']],{position:'bottom',clear:true});
  if(!alive(token))return;q('[data-kobject="pan"]').classList.add('k-hot');
  bindTargets(async()=>{if(!q('#kSortBody').hidden)return;q('[data-kobject="pan"]').classList.remove('k-hot');q('#kPanTip').hidden=true;q('#kSortBody').hidden=false;renderOrder();await openSplit();});
  on('kReset',()=>{if(state.ordered)return;state.order=[];renderOrder();});
  on('kCheckOrder',async()=>{state=E.act(state,'check-order');if(state.ordered){renderOrder();await R().say(['順序正確！接下來想一想，怎麼提醒才容易跟上？']);if(!alive(token))return;
      await talk(C().supportTalk.map(l=>[l.who,l.text]),{position:'bottom'});if(!alive(token))return;
      const list=q('#kSupportList');list.classList.add('sk-drop-list');K().dropHide(list);q('#kSortBody').hidden=true;q('#kSupport').hidden=false;K().dropShow(list);list.querySelector('button')?.focus();}
    else wrongSay('依照本回合的狀態，先把菜放入鍋中，炒熟後關火，再盛盤。按「全部重來」調整看看。');});
  app.querySelectorAll('[data-ksupport]').forEach(b=>b.onclick=async()=>{if(!state.ordered||state.oneAtATime)return;
    if(b.dataset.ksupport==='one'){state=E.act(state,'one-step');app.querySelectorAll('[data-ksupport]').forEach(x=>x.disabled=true);
      await R().say(['做得好！一次一個步驟，完成後再接下一步，比催促或一次講完更容易跟上。']);
      if(!alive(token))return;await closeSplit();if(!alive(token))return;await R().star(b,4);if(!alive(token))return;state=E.act(state,'next');if(state.round===3)roundThree();}
    else wrongSay('太快、太多的指令或責備，可能讓阿公更難跟上。試著把工作拆小，一次提醒一個步驟。');});}
/* 第二修改計劃追加 B5-1:平常是完整大畫面;出現選項(要作答)時才平順地分成左圖右互動,答完再回到完整畫面 */
/* 追加二 C2:分欄切換只改 class,房五的自動縮放(room5-fit)不會重算 → 曾停在 0.5 倍(步驟四整個縮小)。切換完成後一定重算一次 */
const refit=()=>{try{root.Room5Fit&&root.Room5Fit.refit();}catch(e){}};
const holdFit=()=>{try{root.Room5Fit&&root.Room5Fit.hold&&root.Room5Fit.hold(470);}catch(e){}};
function openSplit(){const s=q('.k-split');if(!s||!s.classList.contains('k-collapsed'))return Promise.resolve();holdFit();s.classList.remove('k-collapsed');return wait(480).then(refit);}
function closeSplit(){const s=q('.k-split');if(!s||s.classList.contains('k-collapsed'))return Promise.resolve();holdFit();s.classList.add('k-collapsed');return wait(480).then(refit);}
/* state.order[格位] = 步驟編號;三格都放好才可確認(引擎比對 0,1,2) */
function place(card,slot){if(state.ordered)return;const order=state.order;const from=order.indexOf(card);if(from>=0)order[from]=undefined;
  if(slot==null){slot=[0,1,2].find(i=>order[i]===undefined);if(slot==null)return;}
  const prev=order[slot];order[slot]=card;if(prev!==undefined&&from>=0)order[from]=prev;
  state.order=[0,1,2].map(i=>order[i]);if(state.order.every(v=>v===undefined))state.order=[];renderOrder();}
function renderOrder(){const filled=[0,1,2].filter(i=>state.order[i]!==undefined).length;
  q('#kCards').innerHTML=[2,0,1].map(i=>state.order.includes(i)?'<span class="k-card-gap" aria-hidden="true"></span>':`<button type="button" class="k-card" data-kstep="${i}" ${state.ordered?'disabled':''}>${E.steps[i]}</button>`).join('');
  q('#kOrder').innerHTML=[0,1,2].map(i=>{const v=state.order[i];return `<li class="k-slot ${v!==undefined?'filled':''}" data-kslot="${i}"><b>${i+1}</b>${v===undefined?'<span class="k-slot-empty">拖到這裡</span>':`<button type="button" class="k-card in-slot" data-kstep="${v}" ${state.ordered?'disabled':''}>${E.steps[v]}</button>`}</li>`;}).join('');
  q('#kReset').disabled=!filled||state.ordered;q('#kCheckOrder').disabled=filled!==3||state.ordered;
  app.querySelectorAll('.k-card[data-kstep]').forEach(c=>dragCard(c));}
/* 拖曳字卡(滑鼠/觸控);只點一下則放進第一個空格(鍵盤也可用) */
function dragCard(card){const id=Number(card.dataset.kstep);
  card.onclick=e=>{if(card._dragged){card._dragged=false;return;}if(!card.classList.contains('in-slot'))place(id,null);};
  card.onpointerdown=e=>{if(state.ordered||e.button>0)return;const r=card.getBoundingClientRect(),sx=e.clientX,sy=e.clientY;let ghost=null;
    const move=ev=>{const dx=ev.clientX-sx,dy=ev.clientY-sy;if(!ghost&&Math.hypot(dx,dy)<6)return;
      if(!ghost){ghost=card.cloneNode(true);ghost.classList.add('k-ghost');Object.assign(ghost.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px'});document.body.appendChild(ghost);card.classList.add('k-dragging');}
      ghost.style.transform=`translate(${dx}px,${dy}px) rotate(-2deg)`;
      app.querySelectorAll('.k-slot').forEach(s=>{const b=s.getBoundingClientRect();s.classList.toggle('k-over',ev.clientX>=b.left&&ev.clientX<=b.right&&ev.clientY>=b.top&&ev.clientY<=b.bottom);});};
    const up=ev=>{removeEventListener('pointermove',move);removeEventListener('pointerup',up);if(!ghost)return;card._dragged=true;ghost.remove();card.classList.remove('k-dragging');
      const hit=[...app.querySelectorAll('.k-slot')].find(s=>{const b=s.getBoundingClientRect();return ev.clientX>=b.left&&ev.clientX<=b.right&&ev.clientY>=b.top&&ev.clientY<=b.bottom;});
      app.querySelectorAll('.k-slot').forEach(s=>s.classList.remove('k-over'));
      if(hit)place(id,Number(hit.dataset.kslot));else if(card.classList.contains('in-slot')){const o=state.order.slice();o[o.indexOf(id)]=undefined;state.order=o.every(v=>v===undefined)?[]:o;renderOrder();}};
    addEventListener('pointermove',move);addEventListener('pointerup',up);};}
/* 第三回合(最後一關):遊玩邏輯不變;物件改按鈕回饋,阿公用走路動畫離開廚房 */
async function roundThree(){
  const token=await screen('現在可以離開了嗎？',scene({fire:state.stoveOn,targets:['stove','exit']}),C().hintRound3,4,'k-r3');
  if(!alive(token))return;const old=elderEl();if(old){old.remove();placeElder(ELDER3);}
  await talk([['player','菜炒好了，我們去客廳吧。'],['npc','菜已炒好，阿公準備去客廳。']],{position:'bottom',clear:true});
  if(!alive(token))return;app.querySelectorAll('[data-kobject]').forEach(b=>b.classList.add('k-hot'));
  const unsafeLeave=async()=>{if(state.confirmed)return;q('#kScene').classList.add('attempt-leave');await walkToward();if(!alive(token))return;await danger(['先停下，還有安全狀態沒有確認。']);if(!alive(token))return;await walkBack();if(alive(token))q('[data-kobject="stove"]')?.focus();};
  const confirmOff=async()=>{state=E.act(state,'confirm-off');if(!state.confirmed)return;const el=q('#kScene');el.classList.remove('fire-on','danger-active','attempt-leave');el.classList.add('fire-off');q('.k-danger-banner').hidden=true;q('.k-stove-state').textContent='爐火：已關閉';q('[data-kobject="stove"]').disabled=true;q('[data-kobject="stove"]').classList.remove('k-hot');q('[data-kobject="exit"]').classList.add('safe-exit','k-hot');q('[data-tag="exit"]')?.classList.add('is-safe');
    await R().say(['已陪同確認關火。比起只口頭提醒，實際確認能降低風險。現在可以點客廳出口，一起離開。']);if(alive(token))q('[data-kobject="exit"]')?.focus();};
  bindTargets(async object=>{if(object==='exit'&&state.confirmed){state=E.act(state,'leave');if(state.complete){root.AchievementSystem.learning.assessment('cognition','kitchen',true);app.querySelectorAll('[data-kobject]').forEach(b=>b.disabled=true);await walkOut();if(!alive(token))return;await R().star(q('#kScene'),5);if(alive(token))complete();}return;}
    menu(object,object==='stove'?'現在該怎麼做？':'準備陪阿公離開？',[{text:'直接陪阿公去客廳。',run:unsafeLeave},{text:'提醒一下，自己先走。',run:unsafeLeave},{text:'陪同確認爐火已關閉，再一起離開。',run:confirmOff}]);});}
async function complete(){
  const token=await screen('三回合完成 · 一起把日常照顧好',`<div class="k-paper k-complete"><p class="eyebrow">理解，不責備</p><h2>你協助阿公完成了三件事</h2><ol><li>用紀錄避免重複操作。</li><li>把熟悉的工作拆成一步一步。</li><li>陪同確認爐火關閉，再一起離開。</li></ol><p>若近期反覆出現與以前不同的變化，並影響生活或安全，請陪同尋求專業評估。這個遊戲不是失智症診斷。</p><button id="kFinish" class="k-primary">完成學習</button></div>`,null,5,'k-done');
  if(!alive(token))return;/* 第三修改計劃 B4:同一顆按鈕「完成學習」→ 寶物 →「返回廊道」 */
  root.StoryDialog.finishButton(q('#kFinish'),{backLabel:'返回房間',finish:async()=>{await R().talk(C().reward,{position:'center'});if(!alive(token))return;root.AchievementSystem.completeActivity("cognition","kitchen");},back:()=>exit()});}
root.CognitionKitchen={mount(target,onBack){dispose();app=target;back=onBack;state=E.initial();story();},dispose,SALT_ART};
})(window);
