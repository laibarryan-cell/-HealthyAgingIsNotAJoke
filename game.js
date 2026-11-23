const screens=["home","character","map","level","finish"];
const roomData=[
  {name:"臥室",icon:"🛏️",bg:"#e8d9f1"},{name:"浴室",icon:"🛁",bg:"#cce9ef"},
  {name:"客廳",icon:"🛋️",bg:"#f5d7bc"},{name:"廚房",icon:"🍳",bg:"#f3d6d0"},
  {name:"餐廳",icon:"🍽️",bg:"#f5e0ad"},{name:"書房",icon:"📚",bg:"#d4e2c1"},
  {name:"陽台",icon:"🌿",bg:"#cae6d0"},{name:"走廊",icon:"🕯️",bg:"#d8d2c7"}
];
const catalogs={
  hair:[{name:"俐落短髮"},{name:"側分髮"},{name:"整齊後梳髮"}],
  outfit:[{name:"休閒外套"},{name:"日常 Polo"},{name:"正式外套"}],
  accessory:[{name:"不配戴",src:"acc-none.png"},{name:"圓框眼鏡",src:"acc-glasses.png"},{name:"輕便帽子",src:"acc-hat.png"},{name:"領巾",src:"acc-none.png"}]
};
const COLOR_NAMES={hair:["銀白","暖棕","深棕","淺灰","灰黑"],outfit:["珊瑚紅","藍色","青綠","紫色","金黃"]};
const palettes={hair:["#dad4c6","#8b6b4c","#4b3b31","#b8b1a6","#6f7275"],outfit:["#d96f61","#3c6f91","#4d9c87","#a783bf","#d7a642"]};
const state={base:0,hair:0,outfit:0,accessory:0,hairColor:0,outfitColor:0,tab:"hair",name:"",completed:[],activeRoom:null,zoom:1,confirmed:false,previewMode:"doll"};
/* ===== character data persistence: survives going home, entering rooms and page refresh; wiped by a new game ===== */
const AVATAR_KEY="memoryMazeAvatar",AVATAR_LIMITS={base:3,hair:3,outfit:3,accessory:4,hairColor:5,outfitColor:5};
let previewWalker=null;
function saveAvatar(){try{localStorage.setItem(AVATAR_KEY,JSON.stringify({v:1,name:state.name,base:state.base,hair:state.hair,outfit:state.outfit,accessory:state.accessory,hairColor:state.hairColor,outfitColor:state.outfitColor,confirmed:state.confirmed}))}catch(e){}}
function loadAvatar(){try{const d=JSON.parse(localStorage.getItem(AVATAR_KEY)||"null");if(!d||d.v!==1)return;for(const k in AVATAR_LIMITS){const n=Number(d[k]);if(Number.isInteger(n)&&n>=0&&n<AVATAR_LIMITS[k])state[k]=n}state.name=String(d.name||"").trim().slice(0,10);state.confirmed=!!d.confirmed&&!!state.name;$("#player-name").value=state.name;$("#name-count").textContent=`${state.name.length}／10`}catch(e){}}
const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
function showScreen(name){screens.forEach(id=>$("#screen-"+id).classList.toggle("active",id===name)); MapWalker.setActive(name==="map"); if(typeof previewWalker!=="undefined"&&previewWalker){name==="character"&&state.previewMode==="walk"?previewWalker.start():previewWalker.stop()}}
function tintFilter(hex){const map={"#dad4c6":"none","#8b6b4c":"sepia(.55) saturate(1.5) hue-rotate(345deg) brightness(.75)","#4b3b31":"brightness(.48) sepia(.4)","#b8b1a6":"grayscale(.75) brightness(1.05)","#6f7275":"grayscale(1) brightness(.72)","#d96f61":"none","#3c6f91":"hue-rotate(145deg) saturate(.9)","#4d9c87":"hue-rotate(75deg) saturate(.8)","#a783bf":"hue-rotate(220deg) saturate(.75)","#d7a642":"hue-rotate(330deg) saturate(1.1)"};return map[hex]||"none"}
function characterAsset(){return `assets/elder-${state.base+1}-look-${((state.hair+state.outfit)%3)+1}.png`}
function renderBases(){const names=["沉穩長者","和善長者","活力長者"];$("#base-characters").innerHTML=names.map((n,i)=>`<button class="base-character ${i===state.base?'active':''}" data-base="${i}"><canvas class="base-avatar" width="364" height="362" aria-hidden="true"></canvas><span>${n}<small style="display:block;font-weight:500">${["高瘦體型","圓潤體型","健壯體型"][i]}</small></span></button>`).join("");$$('[data-base]').forEach((b,i)=>CharacterRenderer.render(b.querySelector('canvas'),{body:['slim','round','strong'][i],hair:1,outfit:0,acc:'none'}));$$('[data-base]').forEach(b=>b.onclick=()=>{state.base=+b.dataset.base;state.hair=0;state.outfit=0;state.accessory=0;state.confirmed=false;renderAll();const f=$(`[data-base="${b.dataset.base}"]`);if(f)f.focus()})}
function renderAll(){renderBases();const doll=$("#character-preview");doll.dataset.base=state.base;const acc=catalogs.accessory[state.accessory];CharacterRenderer.render($("#preview-character"),{body:['slim','round','strong'][state.base],hair:state.hair+1,outfit:state.outfit,acc:['none','glasses','hat','scarf'][state.accessory],hairTint:state.hairColor?palettes.hair[state.hairColor]:null,outfitTint:state.outfitColor?palettes.outfit[state.outfitColor]:null});$("#preview-name").textContent=state.name||"未命名的冒險家";const current=catalogs[state.tab][state[state.tab]];$("#item-name").textContent=current.name;$("#item-index").textContent=`${state[state.tab]+1}／${catalogs[state.tab].length}`;const colors=state.tab!=="accessory";$("#color-section").classList.toggle("hidden",!colors);$("#no-color-hint").classList.toggle("hidden",colors);if(colors){const pal=palettes[state.tab];$("#color-label").textContent=state.tab==="hair"?"選擇頭髮顏色":"選擇衣服顏色";$("#color-swatches").innerHTML=pal.map((c,i)=>`<button class="swatch ${i===state[state.tab+'Color']?'active':''}" style="background:${c}" data-color="${i}" aria-label="${COLOR_NAMES[state.tab][i]}" aria-pressed="${i===state[state.tab+'Color']}" title="${COLOR_NAMES[state.tab][i]}"></button>`).join("");$$('[data-color]').forEach(b=>b.onclick=()=>{state[state.tab+'Color']=+b.dataset.color;state.confirmed=false;renderAll();const f=$(`[data-color="${b.dataset.color}"]`);if(f)f.focus()})}$("#confirm-character").classList.toggle("hidden",state.confirmed);$("#go-adventure").classList.toggle("hidden",!state.confirmed);['hair','outfit','accessory'].forEach(k=>$("#summary-"+k).textContent=catalogs[k][state[k]].name);$("#body-description").textContent=['高瘦的身形，沉穩的笑容。選好喜歡的造型，為這趟旅程取個名字。','圓潤的身形，親切的笑容。換上合身的衣服，準備探索新的故事。','寬厚的肩膀，充滿活力的神情。搭配喜歡的裝扮，開啟今天的冒險。'][state.base];if(previewWalker)previewWalker.setLook(state.base,state);saveAvatar()}
function renderMap(){const done=state.completed.length;$("#progress-text").textContent=`已完成 ${done}／8`;$("#progress-fill").style.width=`${done/8*100}%`;$("#map-player-name").textContent=state.name||"冒險家";$("#room-map").style.transform=`scale(${state.zoom})`;$("#zoom-value").textContent=Math.round(state.zoom*100)+"%";$("#room-map").innerHTML=roomData.map((r,i)=>{const completed=state.completed.includes(i),active=state.activeRoom===i;const unlocked=(i===0&&done===0)||(done>0&&state.activeRoom===null)||active;const locked=!completed&&!unlocked;let status=completed?'<span class="room-status complete-star">完成</span>':locked?'<span class="room-status room-lock">🔒</span>':active?'<span class="room-status">進行中</span>':i===0&&done===0?'<span class="room-status">起點</span>':'';return `<button class="room ${locked?'locked':''} ${completed?'completed':''} ${active?'selected':''}" data-room="${i}" style="--room-bg:${r.bg}" ${locked||completed?'aria-disabled="true"':''}><span class="room-number">第 ${i+1} 關</span><h3>${r.name}</h3><span class="room-emoji">${r.icon}</span>${status}${!locked&&!completed?'<span class="room-enter">進入</span>':''}</button>`}).join("");$$('[data-room]').forEach(b=>b.onclick=()=>{const i=+b.dataset.room;if(b.classList.contains('completed'))return;if(b.classList.contains('locked')){openDialog(`<h2>房間尚未開放</h2><p>${state.activeRoom!==null?'請先完成目前進行中的房間。':'請先從第 1 關起點開始。'}</p>`);return}state.activeRoom=i;openLevel(i)})}
function syncCursor(){MapWalker.select(state.base,state)}
function openLevel(i){$("#level-icon").textContent=roomData[i].icon;$("#level-title").textContent=`第 ${i+1} 關・${roomData[i].name}`;$("#level-intro").textContent=`這裡將串接組員製作的「${roomData[i].name}」正式關卡內容。`;showScreen('level')}
function openDialog(html){$("#dialog-content").innerHTML=html;$("#app-dialog").showModal()}
let homeOpening=false;
$("#door").onclick=()=>{
  if(homeOpening)return;
  homeOpening=true;
  const home=$("#screen-home");
  home.classList.add("opening");
  const nav=home.querySelector(".home-nav");if(nav)nav.inert=true;   // 轉場中不可點（滑鼠與鍵盤都擋），避免對話框殘留到下一個畫面
  setTimeout(()=>{
    if(nav)nav.inert=false;
    showScreen('character');
    home.classList.remove("opening");
    homeOpening=false;
  },2000);
};
/* BUG-008(c): typing a name only refreshes the name-related bits (no full re-render of the three base-character canvases) */
$("#player-name").oninput=e=>{state.name=e.target.value.trim();state.confirmed=false;$("#name-count").textContent=`${e.target.value.length}／10`;$("#preview-name").textContent=state.name||"未命名的冒險家";$("#confirm-character").classList.remove("hidden");$("#go-adventure").classList.add("hidden");saveAvatar()};
/* BUG-007(a): Enter in the name field = 確認角色 */
$("#player-name").onkeydown=e=>{if(e.key==="Enter"&&!e.isComposing){e.preventDefault();if(!state.confirmed)$("#confirm-character").click()}};
function selectTab(t){state.tab=t.dataset.tab;$$('.tab').forEach(x=>{const on=x===t;x.classList.toggle('active',on);x.setAttribute('aria-selected',String(on));x.tabIndex=on?0:-1});renderAll()}
$$('.tab').forEach(t=>{t.onclick=()=>selectTab(t);t.setAttribute('aria-selected',String(t.classList.contains('active')));t.tabIndex=t.classList.contains('active')?0:-1});
/* BUG-007(b): arrow keys / Home / End move between the 髮型/服裝/配件 tabs */
$(".tabs").addEventListener('keydown',e=>{const tabs=$$('.tab'),i=tabs.indexOf(document.activeElement);if(i<0)return;let n=-1;
  if(e.key==='ArrowRight')n=(i+1)%tabs.length;else if(e.key==='ArrowLeft')n=(i-1+tabs.length)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;
  if(n<0)return;e.preventDefault();selectTab(tabs[n]);tabs[n].focus()});
function stepItem(d){const n=catalogs[state.tab].length;state[state.tab]=(state[state.tab]+d+n)%n;state.confirmed=false;renderAll()}
$("#item-prev").onclick=()=>stepItem(-1);$("#item-next").onclick=()=>stepItem(1);
/* BUG-007(c): Left/Right arrow while focus is on the item picker changes the item */
$(".item-picker").addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();stepItem(-1)}else if(e.key==='ArrowRight'){e.preventDefault();stepItem(1)}});
$("#randomize").onclick=()=>{state.base=Math.floor(Math.random()*3);state.hair=Math.floor(Math.random()*3);state.outfit=Math.floor(Math.random()*3);state.accessory=Math.floor(Math.random()*catalogs.accessory.length);state.hairColor=Math.floor(Math.random()*5);state.outfitColor=Math.floor(Math.random()*5);state.confirmed=false;renderAll()};
$("#reset-look").onclick=()=>{state.hair=state.outfit=state.accessory=state.hairColor=state.outfitColor=0;state.confirmed=false;renderAll()};
$("#confirm-character").onclick=()=>{if(!state.name){openDialog('<h2>請先輸入角色名字</h2><p>角色名字最多可以輸入 10 個字。</p>');$("#player-name").focus();return}state.confirmed=true;renderAll();$("#go-adventure").focus()};
$("#go-adventure").onclick=()=>{syncCursor();renderMap();showScreen('map')};
$("#zoom-in").onclick=()=>{state.zoom=Math.min(1.25,state.zoom+.1);renderMap()};$("#zoom-out").onclick=()=>{state.zoom=Math.max(.75,state.zoom-.1);renderMap()};
$("#fullscreen").onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
$("#hint-button").onclick=()=>openDialog(`<h2>💡 小提示</h2><p>${state.activeRoom!==null?`你正在進行「${roomData[state.activeRoom].name}」。請再次進入這個房間繼續。`:state.completed.length===0?'請先從標有「起點」的第 1 關開始。':'把滑鼠移到未完成的房間上，再按「進入」。'}</p>`);
$("#simulate-incomplete").onclick=()=>{renderMap();showScreen('map')};
/* ===== 片尾動畫 01～08 =====
   時間軸只負責在 #ending-sequence 上加 class，實際動畫都寫在 ending.css。
   背景固定不動；03～04 的人物只做 scale，不改變位置。 */
const ENDING_BANNER_TEXT="\u93D8\u93D8\u93D8\u93D8"; // 橫批文字「鏘鏘鏘鏘」（U+93D8，用跳脫碼避免被存成別的字），四個字各對應一聲音效
const ENDING_SFX=true;               // 「鏘」音效開關
const ENDING_ASSETS=["ending-interior-base.png","ending-door-leaf-left-v3.png","ending-door-leaf-right-v3.png","ending-door-side-left-v2.png","ending-door-side-right-v2.png","ending-couplet-scroll-left.png","ending-couplet-scroll-right.png","ending-elder-back-clean.png","ending-mansion-scene05-08.png","ending-elder03-front-walk-8f.png","ending-elder-left-clean.png","ending-elder-center-clean.png","ending-elder-right-clean.png"].map(f=>"assets/ending/"+f);
const ENDING_STATES=["shot-interior","door-open","flash","shot-mansion","walker-on","walker-zoom","elders-1","elders-2","elders-3","couplet-on","couplet-l","couplet-r","banner-on","beat-1","beat-2","beat-3","beat-4","done"];
// 節奏：鏘↗ 鏘↗ 鏘➡ 鏘↘（音高跟著方向走）
const ENDING_BEAT_PITCH=[880,1175,1175,740];
let endingRun=0,endingTimers=[],endingAudio=null,endingWalkAnim=null;
/* 03～04 邊走邊放大：用透視公式模擬等速走向鏡頭。
   鏡頭高度在人物臉部（舞台 y≈500），距離 d 等速縮短 → 縮放 = 1/d，
   所以腳會沿地面往畫面下方前進、頭往上，背景完全不動。步伐速度固定 = 行走速度固定。 */
const ENDING_WALK={ms:5400,from:.5,to:10,lift:-34};
function startEndingWalk(){
  const el=$(".ending-walker-sprite");if(!el||!el.animate)return;
  const {ms,from,to,lift}=ENDING_WALK,frames=[],N=48;
  for(let i=0;i<=N;i++){const t=i/N,sc=Math.sqrt(from/(1-(1-from/to)*t)*from*Math.pow(to/from,t)); /* 透視(1/d)與等比放大取幾何平均：前段看得出在變大，後段不會瞬間爆衝 */frames.push({offset:t,transform:`translateY(${(lift*t).toFixed(2)}px) scale(${sc.toFixed(4)})`})}
  endingWalkAnim=el.animate(frames,{duration:ms,easing:'linear',fill:'forwards'});
}
function fitEndingStage(){const box=$("#ending-sequence"),stage=$("#ending-stage");if(!box||!stage||!box.clientWidth)return;const s=Math.min(box.clientWidth/1672,box.clientHeight/941);stage.style.transform=`translate(-50%,-50%) scale(${s})`}
window.addEventListener('resize',fitEndingStage);
function endingClang(freq){
  if(!ENDING_SFX)return;
  try{
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    endingAudio=endingAudio||new AC();const ac=endingAudio;if(ac.state==='suspended')ac.resume();
    const t=ac.currentTime,out=ac.createGain();out.gain.setValueAtTime(.0001,t);out.gain.exponentialRampToValueAtTime(.16,t+.01);out.gain.exponentialRampToValueAtTime(.0001,t+.55);out.connect(ac.destination);
    [1,1.5,2.76].forEach(m=>{const o=ac.createOscillator();o.type='square';o.frequency.value=freq*m;const g=ac.createGain();g.gain.value=.3/m;o.connect(g);g.connect(out);o.start(t);o.stop(t+.6)});
    const len=Math.floor(ac.sampleRate*.25),buf=ac.createBuffer(1,len,ac.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
    const n=ac.createBufferSource();n.buffer=buf;const hp=ac.createBiquadFilter();hp.type='highpass';hp.frequency.value=4500;n.connect(hp);hp.connect(out);n.start(t);
  }catch(e){}
}
function clearEnding(){
  endingRun++;endingTimers.splice(0).forEach(clearTimeout);if(endingWalkAnim){endingWalkAnim.cancel();endingWalkAnim=null}
  const seq=$("#ending-sequence");if(!seq)return;
  seq.classList.add('ending-instant');seq.classList.remove(...ENDING_STATES);
}
function preloadEndingAssets(){return Promise.all(ENDING_ASSETS.map(src=>new Promise(res=>{const im=new Image();im.onload=res;im.onerror=()=>{console.error('片尾素材載入失敗：'+src);res()};im.src=src})))}
async function startEndingSequence(){
  clearEnding();const run=endingRun,seq=$("#ending-sequence");
  $("#finish-name").textContent=state.name||"冒險家";
  $("#ending-banner").innerHTML=[...ENDING_BANNER_TEXT].map(ch=>`<span>${ch}</span>`).join("");
  showScreen('finish');fitEndingStage();
  await preloadEndingAssets();if(run!==endingRun)return;
  seq.classList.add('shot-interior');            // 01：室內，大門關閉，背面老人站在門前
  void seq.offsetWidth;seq.classList.remove('ending-instant');
  const on=(...c)=>seq.classList.add(...c),off=(...c)=>seq.classList.remove(...c);
  const at=(ms,fn)=>endingTimers.push(setTimeout(()=>{if(run===endingRun)fn()},ms));
  at(1800,()=>on('door-open'));                  // 02：左右門扇旋轉打開，金光增強（3.4 秒）
  at(6300,()=>on('flash'));                      // 轉場金光
  at(6900,()=>{off('shot-interior');on('shot-mansion','walker-on','walker-zoom');off('flash');startEndingWalk()}); // 03～04：從大門走向鏡頭，邊走邊放大（5.4 秒）
  at(11900,()=>on('flash'));                     // 人物超出畫面
  at(12400,()=>{off('walker-on','walker-zoom','flash');on('elders-1')}); // 05：左
  at(13600,()=>on('elders-2'));                  // 05：中
  at(14800,()=>on('elders-3'));                  // 05：右
  /* 06：三人並排停留 */
  at(18200,()=>on('couplet-on','couplet-l'));    // 07：左聯
  at(19000,()=>on('couplet-r'));                 // 07：右聯
  at(23000,()=>off('couplet-on','couplet-l','couplet-r')); // 08：對聯淡出，長者恢復清楚
  at(23500,()=>on('banner-on'));                 // 08：橫批牌匾
  [24500,25100,25700,26300].forEach((ms,i)=>at(ms,()=>{on('beat-'+(i+1));endingClang(ENDING_BEAT_PITCH[i])}));
  at(27600,()=>on('done'));                      // 重新開始／返回首頁
}
function skipEnding(){
  const seq=$("#ending-sequence");if(!seq||seq.classList.contains('done')||!$("#screen-finish").classList.contains('active'))return;
  clearEnding();            // 取消所有排程與走路動畫（已加上 ending-instant）
  seq.classList.add('shot-mansion','elders-1','elders-2','elders-3','banner-on','beat-1','beat-2','beat-3','beat-4','done');
  void seq.offsetWidth;seq.classList.remove('ending-instant');
  $("#restart-game").focus();
}
$("#ending-skip").onclick=skipEnding;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$("#app-dialog").open)skipEnding()});
$("#simulate-complete").onclick=()=>{if(!state.completed.includes(state.activeRoom))state.completed.push(state.activeRoom);state.activeRoom=null;if(state.completed.length===8)startEndingSequence();else{renderMap();showScreen('map')}};
function resetAvatarState(){state.completed=[];state.activeRoom=null;state.name="";state.base=state.hair=state.outfit=state.accessory=state.hairColor=state.outfitColor=0;state.confirmed=false;$("#player-name").value="";$("#name-count").textContent="0／10";try{localStorage.removeItem(AVATAR_KEY)}catch(e){}renderAll()}
function resetProgress(){clearEnding();resetAvatarState();showScreen('character')}
$("#restart-game").onclick=resetProgress;
$$('[data-action="home"]').forEach(b=>b.onclick=()=>{clearEnding();showScreen('home')});$$('[data-action="home-confirm"]').forEach(b=>b.onclick=()=>openDialog('<h2>返回首頁？</h2><p>第一版尚未提供存檔。返回首頁後，本次進度仍會保留到重新整理網頁為止。</p><button class="primary-button" id="confirm-home">確定返回</button>'));
$("#dialog-content").addEventListener('click',e=>{if(e.target.id==='confirm-home'){clearEnding();$("#app-dialog").close();showScreen('home')}});$("#dialog-close").onclick=()=>$("#app-dialog").close();
$$('[data-modal]').forEach(b=>b.onclick=()=>{if(b.dataset.modal==='instructions')openDialog('<h2>操作說明</h2><ol><li>將滑鼠移到大門並點擊，開始遊戲。</li><li>選擇角色、輸入名字，再用左右箭頭更換造型。</li><li>在地圖上將滑鼠移到房間，按下「進入」。</li><li>如果卡住，可按右下角的燈泡查看提示。</li></ol>');else openDialog('<h2>製作團隊</h2><p>指導教授:林豪鏹</p><p>組員:賴柏安、湯子萱、陳芝穎</p>')});
previewWalker=MapWalker.createPreview($("#preview-walker"),{onFrame:i=>{$("#walk-label").textContent=`${i.label}・第 ${i.frame+1} / 6 格`}});
$("#preview-mode").onclick=()=>{state.previewMode=state.previewMode==="walk"?"doll":"walk";$(".preview-stage").dataset.mode=state.previewMode;$("#preview-mode").setAttribute("aria-pressed",String(state.previewMode==="walk"));$("#preview-mode").textContent=state.previewMode==="walk"?"◇ 裝扮特寫":"▶ 行走預覽";if(state.previewMode==="walk")previewWalker.start();else previewWalker.stop()};
loadAvatar();
renderAll();
if(new URLSearchParams(location.search).get('ending')==='1')startEndingSequence(); // 測試用：網址加上 &ending=1 直接播放片尾

