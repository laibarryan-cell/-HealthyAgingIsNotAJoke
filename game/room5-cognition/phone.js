/* phone.js — 認知房「電話」(電話與約定)。
   方格表模式:NPC 首次提示 + 「💡 操作提示」、顏色進度條(5 格:情境問答、衛教、三關)、答錯與回饋改 NPC 對話、
   選擇題下拉。通話自動推進、路線圖等待、「再看一次」冷卻皆可在對話出現時暫停。
   題目、選項、正解(B)、約定句子、衛教文字與路線題目皆維持原文,只改呈現方式。 */
(function(root){'use strict';
let app,back,pending=[],epoch=0,photo='assets/phone/education-poster.jfif',tiles,cooldown=0,won=false,level=0;const E=root.PhoneRoute;
const R=()=>root.R5,C=()=>root.StoryCopy.room5.phone;
const appointment=()=>E.levels[level].appointment;
const alive=token=>token===epoch&&app&&app.isConnected;
/* 可暫停的計時器:NPC 對話出現時暫停,結束後接續剩餘時間 */
function arm(t){t.start=Date.now();t.id=setTimeout(()=>{t.done=true;if(t.token===epoch)t.fn();},t.ms);}
function later(fn,ms){const t={fn,ms,token:epoch,done:false};arm(t);pending.push(t);return t;}
const PAUSER={pause(){pending.forEach(t=>{if(!t.done&&!t.paused){clearTimeout(t.id);t.ms-=Date.now()-t.start;t.paused=true;}});},resume(){pending.forEach(t=>{if(!t.done&&t.paused){t.paused=false;arm(t);}});}};
function clear(){epoch++;pending.forEach(t=>clearTimeout(t.id));pending=[];}
function dispose(){clear();R().setPauser(null);}
function exit(){dispose();back();}
function button(id,fn){app.querySelector('#'+id).onclick=fn;}
const q=s=>app.querySelector(s);
function screen(step,body,hint,filled,hintId,extra=''){clear();R().setPauser(PAUSER);app.innerHTML=`<section class="phone-module module-view" data-module="phone">${R().header({title:C().title})}${(hint||extra)?R().toolbar(extra):''}${step?`<h2 class="r5-step">${step}</h2>`:''}${body}</section>`;button('returnRoom',exit);root.MemoryMazeCharacters?.renderWithin(app);root.scrollTo(0,0);const token=epoch;return R().init(hintId,hint,5,filled).then(()=>token);}
// Match visible character pixels, not CSS box heights; keep both shoe baselines aligned.
function alignPhoneGrandson(){
 const elder=app.querySelector('#elder'),portrait=app.querySelector('#grandsonPortrait'),img=portrait?.querySelector('.grandson-single');
 if(!elder||!portrait||!img)return;
 let imageVisible=null;
 function pngBounds(){
  if(imageVisible)return imageVisible;
  if(!img.complete||!img.naturalWidth)return null;
  try{const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
   const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
   const d=ctx.getImageData(0,0,c.width,c.height).data;let top=c.height,bottom=-1;
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>16){top=Math.min(top,y);bottom=Math.max(bottom,y);}
   imageVisible=bottom<top?null:{top,bottom,height:bottom-top+1};return imageVisible;
  }catch(e){console.warn('Grandson alpha measurement failed',e);return null;}
 }
 function update(){
  if(!portrait.isConnected||!img.naturalHeight)return;
  const canvas=elder.querySelector('canvas.mm-character-canvas');
  if(!canvas||elder.dataset.mmReady!=='true')return;
  let top=canvas.height,bottom=-1;
  try{const {data}=canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,canvas.width,canvas.height);
   for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(data[(y*canvas.width+x)*4+3]>16){top=Math.min(top,y);bottom=Math.max(bottom,y);}
  }catch(e){return;}
  if(bottom<top)return;
  const natural=pngBounds();if(!natural)return;
  // object-fit: contain on the elder canvas; use the actual rendered canvas content height.
  const er=canvas.getBoundingClientRect(),ratio=Math.min(er.width/canvas.width,er.height/canvas.height);
  const visibleElder=(bottom-top+1)*ratio;
  const imgHeight=visibleElder*img.naturalHeight/natural.height;
  const bottomGap=(img.naturalHeight-1-natural.bottom)*imgHeight/img.naturalHeight;
  portrait.style.setProperty('--grandson-img-height',imgHeight+'px');
  portrait.style.setProperty('--grandson-img-bottom',-bottomGap+'px');
 }
 const observer=new MutationObserver(()=>{if(!portrait.isConnected){observer.disconnect();resize?.disconnect();return;}update();});
 observer.observe(elder,{attributes:true,attributeFilter:['data-mm-ready'],childList:true});
 const resize=typeof ResizeObserver==='function'?new ResizeObserver(update):null;
 resize?.observe(elder);resize?.observe(portrait);
 if(img.complete)update();else img.addEventListener('load',update,{once:true});
 requestAnimationFrame(update);
}
async function incoming(){const token=await screen('一通電話',`<div class="handset incoming"><div class="phone-notch"></div><p>行動電話 · 來電</p><div class="caller">孫子</div><p>邀請你一起出門</p><button id="answer" class="answer" aria-label="綠色接聽鍵：接聽孫子的來電">接聽</button></div>`,C().hintIncoming,0,'ph-incoming');if(!alive(token))return;button('answer',call);}
async function call(){const lines=[['grandson','阿公，今天下午三點，我們在社區活動中心門口見，一起上書法課。'],['elder','好啊，我知道了。'],['grandson','是今天下午三點，社區活動中心門口，我們一起上書法課喔。'],['elder','好，等一下見。']];
/* 第二修改計劃 C5-2-1:孫子不再以大圖卡在畫面中,只在對話框裡與 NPC 同站位對換出現,對話結束就移除 */
const token=await screen('通話中',`<div class="call-layout call-solo"><div class="handset conversation"><div class="phone-notch"></div><p class="call-status">與孫子通話中</p><div id="messages" aria-live="polite"></div><button id="endCall" class="primary" hidden>通話結束，看看接下來</button></div></div>`,C().hintCall,0,'ph-call');
if(!alive(token))return;
await R().talk(lines.map(([who,text])=>({who:who==='elder'?'player':'grandson',text})),{position:'bottom'});
if(!alive(token))return;
q('#messages').innerHTML=lines.map(([who,text])=>`<p class="message ${who}"><small>${who==='elder'?'阿公':'孫子'}</small>${text}</p>`).join('');
q('.call-status').textContent='通話已結束';q('#endCall').hidden=false;button('endCall',story);q('#endCall').focus();}
async function story(){
const captions=['掛掉電話後，阿公拿起魚飼料，準備出門。','他沒有去約好的書法課，反而來到公園餵魚。','準備回家時，他在熟悉的路口停下來：家在哪個方向呢？'];
let step=0;
const token=await screen('掛掉電話以後',`<figure class="story"><div class="story-visual"><img id="storyImage" src="assets/phone/story-bg-1.png" alt="${captions[0]}"><div id="storyActor" class="story-actor story-actor-1" data-mm-character="player" data-mm-foot-anchor="true" aria-label="阿公準備出門"></div><span id="storyQuestion" class="story-question" hidden aria-hidden="true">?</span></div><figcaption id="storyCaption" aria-live="polite">${captions[0]}</figcaption></figure><button id="storyNext" class="primary">下一張故事 →</button>`,C().hintStory,0,'ph-story');
if(!alive(token))return;
button('storyNext',()=>{
 if(step===2){map();return;}
 step++;
 const image=q('#storyImage'),actor=q('#storyActor');
 image.src=`assets/phone/story-bg-${step+1}.png`;
 image.alt=captions[step];
 actor.className=`story-actor story-actor-${step+1}`;
 q('#storyCaption').textContent=captions[step];
 q('#storyQuestion').hidden=step!==2;
 q('#storyNext').textContent=step===2?'看看回家的路 →':'下一張故事 →';
 root.MemoryMazeCharacters?.renderWithin(app);
});
}
/* 路線圖上的路口(svg 座標 900×420):阿公在公園附近來回走,一直走不到住家 */
const LOST_LOOP=[[90,320],[220,320],[220,170],[430,170],[430,320],[220,320],[90,320]];
async function map(){const token=await screen('熟悉的路，怎麼走不回家？',`<div class="route-map"><svg viewBox="0 0 900 420" role="img" aria-label="公園到住家的路線圖"><rect width="900" height="420" fill="#dce4d2"/><path d="M90 320H700V80H430V320M220 320V170H700M90 80H820" fill="none" stroke="#fff8e7" stroke-width="38"/><path d="M90 320H700V80H430V320M220 320V170H700M90 80H820" fill="none" stroke="#a8afa2" stroke-width="2" stroke-dasharray="8 8"/><rect x="740" y="30" width="130" height="90" rx="10" fill="#b58261"/></svg><span class="sk-label ph-map-tag" style="left:89.4%;top:17.8%">住家</span><span class="sk-label ph-map-tag" style="left:9%;top:91%">公園</span></div><p id="mapText" class="center" aria-live="polite">阿公在路口來回走，卻一直沒有走到住家。</p><button id="mapNext" class="primary" hidden>想一想：阿公可能怎麼了？</button>`,null,0,'ph-map');
if(!alive(token))return;
const box=q('.route-map'),pts=LOST_LOOP.map(([x,y])=>({x:x/9,y:y/4.2}));
const w=root.StoryKit.walker(box,pts[0],{height:'34%'});w.classList.add('ph-lost');w.insertAdjacentHTML('beforeend','<span class="sk-label ph-here">目前位置</span>');
(async()=>{while(alive(token)&&w.isConnected){await root.StoryKit.walk(box,pts.slice(1),{el:w,speed:11});}})();
later(()=>{q('#mapText').textContent='「怎麼還沒走到家……」';q('#mapNext').hidden=false;},5000);button('mapNext',question);}
async function question(){const answers=['只是想晚一點赴約，沒有任何需要關心的變化。','可能忘記或弄錯事件發生的時間、地點，或是在熟悉的地方迷路。','他一定是不喜歡孫子，所以故意不赴約。','只要提醒他走快一點，就能解決所有問題。'];
const token=await screen('阿公可能怎麼了？',`<div class="paper question" data-after-dialog><p>想想剛才的約定，以及阿公後來的行動。</p><div id="phAnswers" class="p-answers">${answers.map((a,i)=>`<button class="choice" data-answer="${i}">${String.fromCharCode(65+i)}. ${a}</button>`).join('')}</div></div>`,C().hintQuestion,0,'ph-question');
if(!alive(token))return;app.querySelectorAll('[data-answer]').forEach(b=>b.disabled=true);
await R().quiz({list:q('#phAnswers'),ask:'阿公可能怎麼了？想想剛才的約定，以及阿公後來的行動。',wonder:C().wonder,alive:()=>alive(token)});
if(!alive(token))return;app.querySelectorAll('[data-answer]').forEach(b=>b.disabled=false);
app.querySelectorAll('[data-answer]').forEach(b=>b.onclick=async()=>{const ok=b.dataset.answer==='1';root.AchievementSystem.learning.judgment('cognition','phone',ok);
 await R().say([ok?'答對了。約定內容和熟悉路線的混淆值得關心，但不能只靠一次情境就下診斷。':'再想一想：阿公的行動和約定不一致，還在熟悉的路口迷路，不能直接認為他是故意的。']);
 if(ok&&alive(token)){await R().star(b,1);if(alive(token))learn();}});}
/* 與朋友版 w10_1114 整合:衛教頁改成朋友版的四幕劇情短劇(cognition-story.js,內容與流程照朋友版);外觀由 room5-story-unify.css 套用本專案風格 */
function learn(){clear();root.CognitionStory.show(app,'phone',()=>{brief();},exit);}
/* 孫子說出約定(文字不變)→ 玩家按「記好了,開始」後約定隱藏 */
async function brief(){const token=await screen('記住新約定',``,C().hintBrief,2+level,'ph-brief');
if(!alive(token))return;
await R().talk([{who:'grandson',text:appointment(),buttons:[{label:'記好了，開始',value:true}]}],{position:'center'});
if(alive(token))puzzle();}
function puzzle(){tiles=E.create(level);won=false;cooldown=0;
/* 第二修改計劃 C5-2-4/5:左側任務卡 = 標題、約定關卡、「檢查路線」與正下方的「再看一次約定」;右側路線板。阿公站在出發點,接通後沿路線走到終點 */
screen('',`<div class="puzzle-layout ph-puzzle2"><aside class="paper ph-side"><h2 class="ph-side-title">把約定連成一條路</h2><p class="ph-level">第 ${level+1}／3 個約定</p><div id="recallText" class="recall" hidden>${appointment()}</div><div class="ph-actions"><button id="check" class="primary">檢查路線</button><button id="recall" type="button">再看一次約定</button></div><button id="finish" class="primary" hidden>完成學習</button></aside><div class="board-wrap"><div id="board" class="board ${level?'vertical-board':''}" style="grid-template-columns:repeat(${E.levels[level].width},minmax(0,1fr))" aria-label="旋轉路線方塊"></div></div></div>`,C().hintPuzzle,2+level,'ph-puzzle').then(token=>{
if(!alive(token))return;
renderBoard();placeWalker();
button('recall',()=>{if(cooldown||won)return;cooldown=10;q('#recallText').hidden=false;updateRecall();later(()=>{const r=q('#recallText');if(r)r.hidden=true;},5000);function tick(){cooldown--;updateRecall();if(cooldown>0)later(tick,1000);}later(tick,1000);});
button('check',async()=>{const result=E.trace(tiles,level);
 if(result.correct){won=true;q('#check').disabled=true;q('#recall').disabled=true;q('#recallText').hidden=true;renderBoard(result.correct);
  await walkRoute(result.correct);if(!alive(token))return;
  const last=level===2;if(last)root.AchievementSystem.learning.assessment('cognition','phone',true,{levels:3});
  await R().say([`完成第 ${level+1} 關！${E.levels[level].target.join(' → ')}。${level<2?'準備好了就進入下一個約定。':'三關都完成了！記住時間、地點與活動，能幫助確認重要資訊。'}`]);
  if(!alive(token))return;await R().star(q('#board'),3+level);if(!alive(token))return;
  if(!last){level++;brief();return;}
  /* 第三修改計劃 B4:同一顆按鈕「完成學習」→ 寶物 →「返回廊道」 */const f=q('#finish');root.StoryDialog.finishButton(f,{backLabel:'返回房間',finish:async()=>{await R().talk(C().reward,{position:'center'});if(!alive(token))return;root.AchievementSystem.completeActivity("cognition","phone");},back:()=>exit()});f.hidden=false;f.focus();
 }else{const message=result.paths.length?'路線接到了終點，但時間、地點或活動不符合約定。保留目前排列，再調整看看。':'路線還沒接通。看看相鄰方塊的開口是否相接，再試一次。';
  const page=q('.phone-module');page.classList.remove('route-shake');void page.offsetWidth;page.classList.add('route-shake');later(()=>page.classList.remove('route-shake'),600);R().say([message]);}});
});}
/* 阿公(走路圖集)站在出發格;board 重繪時保留 */
function tileCenter(i){const b=q('#board'),t=q(`#board [data-tile="${i}"]`);if(!b||!t)return null;const br=b.getBoundingClientRect(),tr=t.getBoundingClientRect();return {x:(tr.left+tr.width/2-br.left)/br.width*100,y:(tr.top+tr.height*.78-br.top)/br.height*100};}
function placeWalker(){const b=q('#board');if(!b)return;const start=tiles.findIndex(t=>t.kind==='start');const at=tileCenter(start);if(!at)return;
  const t=q(`#board [data-tile="${start}"]`);const h=Math.round(t.getBoundingClientRect().height/((root.Room5Fit&&root.Room5Fit.zoom())||1)*1.35);
  const w=root.StoryKit.walker(b,at,{height:h});w.classList.add('ph-walker');}
async function walkRoute(path){const b=q('#board'),w=b&&b.querySelector('.ph-walker');if(!w)return;const pts=path.map(tileCenter).filter(Boolean);await root.StoryKit.walk(b,pts,{el:w,speed:16,endFacing:'down'});await new Promise(r=>later(r,350));}
function updateRecall(){const b=q('#recall');if(!b)return;b.disabled=won||cooldown>0;b.textContent=cooldown?`再看一次（${cooldown} 秒）`:'再看一次約定';}
function renderBoard(path=[]){const keep=q('#board .ph-walker');q('#board').innerHTML=tiles.map((t,i)=>t.kind==='wall'?'<div class="tile wall" aria-hidden="true"></div>':`<button class="tile ${t.kind} ${path.includes(i)?'connected':''}" data-tile="${i}" ${won||['start','end'].includes(t.kind)?'disabled':''} aria-label="第 ${Math.floor(i/E.levels[level].width)+1} 列第 ${i%E.levels[level].width+1} 格，${t.label||'道路'}，開口${E.ports(t).map(d=>['上','右','下','左'][d]).join('、')}"><span class="pipe">${E.ports(t).map(d=>`<i class="arm d${d}"></i>`).join('')}<i class="hub"></i></span><span class="tile-label ${t.kind==='start'?'sk-label is-start':t.kind==='end'?'sk-label is-end':''}">${t.label}</span></button>`).join('');if(keep)q('#board').appendChild(keep);app.querySelectorAll('[data-tile]').forEach(b=>b.onclick=()=>{if(won)return;const i=Number(b.dataset.tile);tiles[i].rot=(tiles[i].rot+1)%4;renderBoard();const current=q(`[data-tile="${i}"]`);current.classList.add('turned');current.focus();});}
root.CognitionPhone={mount(target,onBack){dispose();app=target;back=onBack;level=0;incoming();},dispose};
})(window);
