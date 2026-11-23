/* photo.js — 認知房「牆上的照片」(照片與倒影)。
   方格表模式:NPC 首次提示 + 「💡 操作提示」、顏色進度條(6 格)、對話框取代彈窗與文字回饋、選擇題下拉。
   題目、選項、正解(D)、回饋與衛教文字皆維持原文,只改呈現方式。 */
(function(root){'use strict';
const E=root.CognitionPhotoEngine,R=()=>root.R5,C=()=>root.StoryCopy.room5.photo;
let app,back,epoch=0,timers=[],state,photo='assets/photo/education-poster.jfif';
const q=s=>app.querySelector(s),on=(id,fn)=>q('#'+id).onclick=fn;
const alive=token=>token===epoch&&app&&app.isConnected;
function dispose(){epoch++;timers.forEach(clearTimeout);timers=[];R().setPauser(null);}
function later(fn,ms){const token=epoch;timers.push(setTimeout(()=>{if(token===epoch)fn();},ms));}
function exit(){dispose();back();}
const who=w=>w==='elder'?'player':w==='grandson'?'grandson':'npc';
/* 對話:player = 玩家扮演的阿公;npc = 片尾老人(孫子與旁白的話也由 NPC 念出) */
function talk(lines,opts){return R().talk(lines.map(l=>({who:l[0],text:l[1]})),opts);}
function screen(step,body,hint,filled,hintId){dispose();app.innerHTML=`<section class="cog-photo module-view" data-module="photo">${R().header({title:C().title})}${R().toolbar()}${step?`<h2 class="r5-step">${step}</h2>`:''}${body}</section>`;q('#returnRoom').onclick=exit;root.MemoryMazeCharacters?.renderWithin(app);root.scrollTo(0,0);const token=epoch;return R().init(hintId,hint,6,filled).then(()=>token);}
function scene({night=false,motion=false,targets=false,covered=false,curtains=false}={}){const objects=night?['window','lamp','chair','photo']:['mirror','photo','lamp','chair'];const names={mirror:'鏡子',window:'窗戶',lamp:'燈',chair:'椅子',photo:'照片'};return `<div id="pScene" class="p-scene ${night?'night':'day'} ${motion?'moving':''} ${covered?'mirror-covered':''} ${curtains?'curtains-closed':''}"><img class="p-background" src="assets/photo/${night?'window-night':'mirror-day'}.png" alt="${night?'夜間，室內燈亮著，窗戶兩側的窗簾打開':'日間走道一角，有照片、燈、椅子和鏡子'}"><div class="p-glass" aria-label="${night?'窗玻璃':'鏡子'}裡是阿公自己的倒影"><div class="p-reflection-motion"><div class="p-reflection" data-mm-character="player" data-mm-foot-anchor="true" data-mm-flip="true" aria-label="阿公的倒影，五官與衣著和本人相同"></div></div><div id="pCover" class="p-cover" aria-hidden="true"></div><div class="p-curtain p-curtain-left" aria-hidden="true"></div><div class="p-curtain p-curtain-right" aria-hidden="true"></div></div><div class="p-actor-motion"><div class="p-actor" data-mm-character="player" data-mm-foot-anchor="true" data-mm-view="back" aria-label="站在${night?'窗邊':'鏡前'}的阿公"></div></div><span class="p-state">${night?'夜間 · 室內照明保持開啟':'白天 · 熟悉的家'}</span>${targets?objects.map(id=>`<button class="p-target p-target-${id} sk-press" data-pobject="${id}" aria-label="查看${names[id]}"><span class="sk-label p-tag">${names[id]}</span></button>`).join(''):''}<section id="pMenu" class="p-menu" hidden aria-label="物件選單"></section><p class="p-image-error" hidden role="alert">場景圖無法載入，請完整解壓縮 ZIP 並保留 assets 資料夾。</p></div>`;}
function bindScene(){const img=q('.p-background');if(img)img.onerror=()=>q('.p-image-error').hidden=false;cropTargets();}
/* 第二修改計劃追加 B5-2(C1):物件不加框;按鈕底圖 = 從場景圖裁出的同一塊畫面,滑過放大發亮、按下下壓(與廚房相同) */
function cropTargets(){const sc=q('#pScene'),img=q('.p-background');if(!sc||!img)return;const W=sc.clientWidth,H=sc.clientHeight;if(!W||!H)return;
  sc.querySelectorAll('.p-target').forEach(b=>{const x=b.offsetLeft/W,y=b.offsetTop/H,w=b.offsetWidth/W,h=b.offsetHeight/H;if(w>=1||h>=1)return;
    let c=b.querySelector(':scope>.sk-crop');if(!c){c=document.createElement('i');c.className='sk-crop';c.setAttribute('aria-hidden','true');b.prepend(c);}/* 2026-11-18 柔邊:裁圖放進子圖層並加羽化遮罩 */c.style.backgroundImage=`url('${img.getAttribute('src')}')`;c.style.backgroundSize=`${(100/w).toFixed(2)}% ${(100/h).toFixed(2)}%`;c.style.backgroundPosition=`${(x/(1-w)*100).toFixed(2)}% ${(y/(1-h)*100).toFixed(2)}%`;});
  /* 名稱牌放在最上層的標籤圖層(物件在阿公後面,名稱在阿公前面) */
  let tags=sc.querySelector('.p-tags');if(!tags){tags=document.createElement('div');tags.className='p-tags';tags.setAttribute('aria-hidden','true');sc.appendChild(tags);}
  tags.innerHTML=[...sc.querySelectorAll('.p-target')].map(b=>{const big=/mirror|window/.test(b.dataset.pobject);const x=(b.offsetLeft+b.offsetWidth/2)/W*100,y=(big?b.offsetTop+b.offsetHeight*.04:b.offsetTop)/H*100;return `<span class="sk-label p-tag2${big?' is-in':''}" data-for="${b.dataset.pobject}" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%">${b.querySelector('.p-tag')?.textContent||''}</span>`;}).join('');}
function openMenu(object,title,choices){const box=q('#pMenu');box.hidden=false;box.setAttribute('class','p-menu near-'+object);box.innerHTML=`<h3>${title}</h3>${choices.map((choice,i)=>`<button data-pchoice="${i}">${choice.text}</button>`).join('')}<button id="pMenuClose" class="p-menu-close">收起選單</button>`;box.querySelectorAll('[data-pchoice]').forEach(b=>b.onclick=()=>{box.hidden=true;q(`[data-pobject="${object}"]`)?.focus();choices[Number(b.dataset.pchoice)].run();});on('pMenuClose',()=>{box.hidden=true;q(`[data-pobject="${object}"]`)?.focus();});box.querySelector('[data-pchoice]').focus();}
/* 答錯:NPC 對話提示(內容沿用原本的提示文字) */
const wrongSay=text=>R().say([text]);

async function intro(){
  const token=await screen('',`<div class="p-intro"><div class="p-family-photo" role="img" aria-label="放大走道上的家庭合照，人物臉部延續原圖留白"></div></div>`,C().hintIntro,0,'photo-intro');
  if(!alive(token))return;
  await R().talk(C().introLines,{position:'bottom',clear:true});
  if(alive(token))story(0);
}
const storyLines=[
{title:'經過一面鏡子',speaker:'narrator',text:'阿公走到鏡子前，稍微挪動身體。鏡子裡的人也跟著他一起動。',motion:true},
{title:'那個人是誰？',speaker:'elder',text:'那個人是誰？他怎麼一直看著我？'},
{title:'熟悉的家，卻覺得不安心',speaker:'elder',text:'他怎麼會在我們家裡？'},
{title:'看得見，卻未必能理解',speaker:'narrator',text:'鏡中是阿公自己的倒影，但這個情境中的阿公沒有認出來。接下來，想想可能的原因。'}
];
async function story(index){const s=storyLines[index];
  const token=await screen(s.title,scene({motion:s.motion}),C().hintStory,0,'photo-story');
  if(!alive(token))return;bindScene();if(index===2)q('#pScene').classList.add('step-back');
  if(s.motion){await new Promise(r=>later(r,3200));if(!alive(token))return;q('#pScene').classList.remove('moving');}
  await talk([[who(s.speaker),s.text]],{position:'bottom',clear:true});
  if(!alive(token))return;
  if(index<3)story(index+1);else{await R().star(q('#pScene'),1);if(alive(token))question();}
}
async function question(){
  const token=await screen('阿公可能遇到什麼困難？',`<div class="p-paper p-question" data-after-dialog><p>阿公看見鏡子裡的人，卻認為家裡有陌生人，可能代表什麼？</p><div id="pAnswers" class="p-answers">${E.answers.map((a,i)=>`<button class="p-answer" data-panswer="${i}">${String.fromCharCode(65+i)}. ${a}</button>`).join('')}</div></div>`,C().hintQuestion,1,'photo-question');
  if(!alive(token))return;
  app.querySelectorAll('[data-panswer]').forEach(b=>b.disabled=true);
  await R().quiz({list:q('#pAnswers'),ask:C().questionAsk,wonder:C().wonder,alive:()=>alive(token)});
  if(!alive(token))return;
  app.querySelectorAll('[data-panswer]').forEach(b=>b.disabled=false);
  app.querySelectorAll('[data-panswer]').forEach(b=>b.onclick=async()=>{const correct=E.isCorrect(b.dataset.panswer);root.AchievementSystem.learning.judgment('cognition','photo',correct);
    await R().say([correct?'答對了。看得到，不代表一定能正確理解影像。這可能涉及辨識、自我認知或記憶，不能只靠這個情境判定失智症。':'再想一想：鏡中是阿公的倒影。不是有陌生人，也不能直接說他故意或不認真；請思考理解影像的困難。']);
    if(correct&&alive(token)){await R().star(b,2);if(alive(token))learn();}});
}
/* 與朋友版 w10_1114 整合:衛教頁改成朋友版的四幕劇情短劇(cognition-story.js,內容與流程照朋友版);外觀由 room5-story-unify.css 套用本專案風格 */
function learn(){epoch++;timers.forEach(clearTimeout);timers=[];root.CognitionStory.show(app,'photo',()=>{state=E.initial();roundOne();},exit);}
async function roundOne(){
  const token=await screen('先怎麼回應？',`${scene()}<div class="p-paper p-response" id="pReplies" data-after-dialog><button data-preply="care">「您是不是有點不安心？我陪您，我們先到旁邊坐一下。」</button><button data-preply="argue">「那就是你啊！講幾次才懂？」</button><button data-preply="agree">「對，真的有陌生人跑進來了。」</button></div>`,C().hintRound1,3,'photo-r1');
  if(!alive(token))return;bindScene();
  await talk([['player','那個陌生人一直看我！']],{position:'bottom',clear:true});
  if(!alive(token))return;
  app.querySelectorAll('[data-preply]').forEach(b=>b.onclick=async()=>{if(state.reassured)return;
    if(b.dataset.preply==='care'){state=E.act(state,'reassure');app.querySelectorAll('[data-preply]').forEach(x=>x.disabled=true);q('#pScene').classList.add('reassured');
      await talk([['grandson','您是不是有點不安心？我陪您，我們先到旁邊坐一下。'],['npc','做得好。接住不安，不爭辯，也不附和真的有人闖入。這個情境中的阿公稍微放鬆了。']],{position:'bottom',clear:true});
      if(!alive(token))return;await R().star(b,4);if(!alive(token))return;state=E.act(state,'next');if(state.round===2)roundTwo();}
    else wrongSay(b.dataset.preply==='argue'?'反覆糾正或責備可能增加不安。先理解感受、陪伴他，不必強迫他承認那是自己。':'可以接住他的感受，但不要附和真的有人闖入。試著讓他知道你會陪著他。');});
}
async function roundTwo(){
  const token=await screen('找出讓他困擾的東西',scene({targets:true}),C().hintRound2,4,'photo-r2');
  if(!alive(token))return;bindScene();
  await talk([['player','那個人還在那裡……']],{position:'bottom',clear:true});
  if(!alive(token))return;
  app.querySelectorAll('[data-pobject]').forEach(b=>b.onclick=()=>{if(state.covered)return;chooseObject(b.dataset.pobject,false,token);});
}
function chooseObject(object,night,token){
  if(object==='mirror'){openMenu(object,'這面鏡子可以怎麼處理？',[{text:'把鏡子移近，要求阿公仔細看。',run:()=>wrongSay('把造成不安的倒影移近，可能增加困擾。先減少刺激，並陪伴他。')},{text:'一直叫阿公對鏡子揮手，直到承認那是自己。',run:()=>wrongSay('不必把互動變成辨識考試，也不要強迫承認。試著調整讓他困擾的環境。')},{text:'暫時遮住這面讓他不安的鏡子。',run:()=>cover(token)}]);}
  else if(object==='window'){openMenu(object,'窗邊可以怎麼調整？',[{text:'請阿公繼續盯著玻璃看。',run:()=>wrongSay('一直盯著讓他不安的影像，不一定有幫助。試著改變環境。')},{text:'把窗簾拉上。',run:()=>closeCurtains(token)},{text:'告訴他窗外真的有人。',run:()=>wrongSay('這個情境中的人影是室內的倒影。先理解不安，但不要附和真的有人。')}]);}
  else if(object==='lamp'){openMenu(object,'燈光',[{text:'關掉室內所有燈。',run:()=>wrongSay('把家裡變暗不是本關的合適做法。保留足夠照明，針對造成困擾的反射作調整。')},{text:'保留照明，再觀察其他物件。',run:()=>R().say(['保留照明，繼續找出讓阿公不安的影像來源。'])}]);}
  else if(object==='photo'){openMenu(object,'牆上的照片',[{text:'把照片轉向牆面。',run:()=>wrongSay('目前讓阿公不安的是會映出人影的地方，轉開這張照片沒有處理到這次的困擾。')},{text:'先保留照片，查看其他地方。',run:()=>R().say(['照片保留，繼續觀察阿公正在注意的位置。'])}]);}
  else if(object==='chair'){openMenu(object,'旁邊的椅子',[{text:'陪阿公到旁邊坐一下。',run:()=>talk([['grandson','我陪您坐一下，我們慢慢來。'],['npc','陪伴是好的開始。本回合還需要處理仍在造成不安的影像來源。']])},{text:'叫他自己坐著，先離開。',run:()=>wrongSay('阿公正在不安，先陪伴與觀察，不急著讓他獨自面對困擾。')}]);}}
async function cover(token){state=E.act(state,'cover');if(!state.covered)return;q('#pScene').classList.add('mirror-covered');q('.p-glass').setAttribute('aria-label','造成困擾的鏡面已暫時遮住');q('.p-reflection').setAttribute('aria-hidden','true');app.querySelectorAll('[data-pobject]').forEach(b=>b.disabled=true);
  await talk([['grandson','我陪著您，我們到旁邊休息一下。'],['npc','已暫時遮住這面造成困擾的鏡子。保持照明，繼續陪伴並觀察阿公是否舒服一些。']],{position:'bottom',clear:true});
  if(!alive(token))return;await R().star(q('#pScene'),5);if(!alive(token))return;state=E.act(state,'next');if(state.round===3)roundThree();}
async function roundThree(){
  const token=await screen('晚上的窗邊',`${scene({night:true,targets:true})}<button id="pAccompany" class="p-primary" data-after-dialog hidden>陪阿公到旁邊坐一下</button>`,C().hintRound3,5,'photo-r3');
  if(!alive(token))return;bindScene();
  await talk([['player','外面怎麼有人一直站著？']],{position:'bottom',clear:true});
  if(!alive(token))return;
  app.querySelectorAll('[data-pobject]').forEach(b=>b.onclick=()=>{if(state.curtains)return;chooseObject(b.dataset.pobject,true,token);});
  on('pAccompany',async()=>{state=E.act(state,'accompany');if(!state.accompanied)return;q('#pAccompany').hidden=true;
    await talk([['grandson','我陪您坐一下，看看這樣是不是比較舒服。'],['npc','完成了！你把白天學到的方法用在夜間：減少困擾的反射，保留照明，並持續陪伴。']],{position:'bottom',clear:true});
    if(!alive(token))return;await R().star(q('#pScene'),6);if(!alive(token))return;state=E.act(state,'finish');if(state.complete){root.AchievementSystem.learning.assessment('cognition','photo',true);complete();}});}
async function closeCurtains(token){state=E.act(state,'curtains');if(!state.curtains)return;q('#pScene').classList.add('curtains-closed');q('.p-glass').setAttribute('aria-label','窗簾已拉上，窗上的倒影不再可見');q('.p-reflection').setAttribute('aria-hidden','true');app.querySelectorAll('[data-pobject]').forEach(b=>b.disabled=true);
  await new Promise(r=>later(r,1050));if(!alive(token))return;   /* 先讓玩家看見窗簾逐格拉上,再由 NPC 說明 */
  await R().say(['窗簾已拉上，倒影被遮住，室內仍保持照明。接下來繼續陪伴阿公。']);
  if(alive(token)){q('#pAccompany').hidden=false;q('#pAccompany').focus();}}
async function complete(){
  const token=await screen('完成 · 看見感受，也看見環境',`<article class="p-paper p-complete"><p class="eyebrow">三回合完成</p><h2>先安撫，再找出造成困擾的影像</h2><ol><li>接住不安，不責備，也不附和真的有人闖入。</li><li>鏡面造成困擾時，可暫時遮住並觀察反應。</li><li>夜間窗戶出現困擾的倒影時，可拉上窗簾，保留照明並陪伴。</li></ol><p>每個人的情況不同。這是衛教情境，不是診斷或正式認知測驗；持續或突然出現的變化應尋求合適的醫療評估。</p><button id="pFinish" class="p-primary">完成學習</button></article>`,null,6,'photo-done');
  if(!alive(token))return;/* 第三修改計劃 B4:同一顆按鈕「完成學習」→ 寶物 →「返回廊道」 */root.StoryDialog.finishButton(q('#pFinish'),{backLabel:'返回房間',finish:async()=>{await R().talk(C().reward,{position:'center'});if(!alive(token))return;root.AchievementSystem.completeActivity("cognition","photo");await root.AchievementSystem?.obtainItem({id:'cognition_memory_box',name:'上鎖的記憶盒',room:'cognition'});},back:()=>exit()});}
root.CognitionPhoto={mount(target,onBack){dispose();app=target;back=onBack;state=E.initial();intro();},dispose};
})(window);
