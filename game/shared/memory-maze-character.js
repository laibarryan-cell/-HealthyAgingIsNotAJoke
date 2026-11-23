(function(root){'use strict';
const BODY=['slim','round','strong'];
const HAIR=['#dad4c6','#8b6b4c','#4b3b31','#b8b1a6','#6f7275'];
const OUTFIT=['#d96f61','#3c6f91','#4d9c87','#a783bf','#d7a642'];
const ACC=['none','glasses','hat','scarf'];
const cache={};
// 路徑一律相對於本腳本自己的位置(而非載入它的頁面):外殼(game/index.html)、房間頁(game/roomN/)與動態載入都能找到同層的檔案。
const SELF_SRC=(document.currentScript&&document.currentScript.src)||'';
function siblingUrl(rel,fallback){try{return SELF_SRC?new URL(rel,SELF_SRC).href:fallback;}catch(e){return fallback;}}
const WALK_FILES=['slim-dress/slim-wardrobe.js','round-dress/round-wardrobe.js','strong-dress/strong-wardrobe.js'].map(f=>siblingUrl('../../assets/walk/'+f,'../../assets/walk/'+f));
const WALK_NAMES=['SlimWardrobe','RoundWardrobe','StrongWardrobe'];
function getWardrobe(index){return index===0?(typeof SlimWardrobe!=='undefined'?SlimWardrobe:null):index===1?(typeof RoundWardrobe!=='undefined'?RoundWardrobe:null):(typeof StrongWardrobe!=='undefined'?StrongWardrobe:null);}
function loadWalkScript(index){
  const existing=getWardrobe(index);if(existing)return Promise.resolve(existing);
  cache.walkScripts??={};
  if(!cache.walkScripts[index])cache.walkScripts[index]=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=WALK_FILES[index];script.onload=()=>{const wardrobe=getWardrobe(index);wardrobe?resolve(wardrobe):reject(new Error('背面角色模組未初始化'));};script.onerror=()=>reject(new Error('背面角色腳本載入失敗 '+WALK_FILES[index]));document.head.appendChild(script);
  }).catch(e=>{delete cache.walkScripts[index];throw e;});
  return cache.walkScripts[index];
}
async function renderBack(canvas){
  const p=normalizedPlayer(),wardrobe=await loadWalkScript(p.base);
  await wardrobe.init();
  if(!canvas.isConnected)return;
  const ctx=canvas.getContext('2d');canvas.width=256;canvas.height=256;
  ctx.clearRect(0,0,256,256);ctx.imageSmoothingEnabled=false;
  wardrobe.draw(ctx,'up',0,p);
}
// Resolves to a synchronous drawer (canvas,dir,frame) using the player's wardrobe walk atlas (dir: down/up/left/right, frame 0-5).
async function prepareWalk(){
  const p=normalizedPlayer(),wardrobe=await loadWalkScript(p.base);
  await wardrobe.init();
  return (canvas,dir,frame)=>{
    if(!canvas||!canvas.isConnected)return;
    if(canvas.width!==256||canvas.height!==256){canvas.width=256;canvas.height=256;}
    const ctx=canvas.getContext('2d');ctx.clearRect(0,0,256,256);ctx.imageSmoothingEnabled=false;
    wardrobe.draw(ctx,dir,frame,p);
  };
}
function loadJSON(key,fallback){
  try{const raw=root.localStorage?.getItem(key);if(!raw)return fallback;const data=JSON.parse(raw);return data&&typeof data==='object'?data:fallback;}catch(e){return fallback;}
}
function normalizedPlayer(){
  const raw=loadJSON('memoryMazePlayer',{});
  const pick=(v,max)=>Number.isFinite(Number(v))?Math.max(0,Math.min(max,Math.floor(Number(v)))):0;
  return {name:typeof raw.name==='string'&&raw.name.trim()?raw.name.trim():'冒險家',base:pick(raw.base,2),hair:pick(raw.hair,2),outfit:pick(raw.outfit,2),accessory:pick(raw.accessory,3),hairColor:pick(raw.hairColor,4),outfitColor:pick(raw.outfitColor,4)};
}
function playerRenderState(){
  const p=normalizedPlayer();
  return {body:BODY[p.base],hair:p.hair+1,outfit:p.outfit,acc:ACC[p.accessory],hairTint:p.hairColor?HAIR[p.hairColor]:null,outfitTint:p.outfitColor?OUTFIT[p.outfitColor]:null};
}
function grandsonRenderState(){return {body:'slim',hair:2,outfit:1,acc:'none',hairTint:'#4b3b31',outfitTint:'#3c6f91'};}
function ensureCharacterRenderer(){
  if(root.CharacterRenderer)return Promise.resolve(root.CharacterRenderer);
  if(cache.loading)return cache.loading;
  const assets=[siblingUrl('room-character-renderer.js','../shared/room-character-renderer.js')];
  cache.loading=new Promise((resolve,reject)=>{
    let idx=0;
    const loadNext=()=>{
      if(root.CharacterRenderer)return resolve(root.CharacterRenderer);
      if(idx>=assets.length)return root.CharacterRenderer?resolve(root.CharacterRenderer):reject(new Error('CharacterRenderer unavailable'));
      const script=document.createElement('script');
      script.src=assets[idx++];script.async=false;script.onload=loadNext;script.onerror=()=>reject(new Error('load failed'));document.head.appendChild(script);
    };
    loadNext();
  });
  cache.loading=cache.loading.catch(err=>{cache.loading=null;throw err;});
  return cache.loading;
}
function ensureCanvas(host){
  let canvas=host.querySelector('canvas.mm-character-canvas');
  if(!canvas){canvas=document.createElement('canvas');canvas.className='mm-character-canvas';canvas.width=364;canvas.height=362;host.innerHTML='';host.appendChild(canvas);} 
  const label=host.getAttribute('aria-label')||host.dataset.mmAlt||'';if(label)canvas.setAttribute('aria-label',label);
  return canvas;
}
function stateFor(kind){return kind==='grandson'?grandsonRenderState():playerRenderState();}
async function renderHost(host){
  try{
    const rear=host.dataset.mmView==='back';
    const renderer=rear?null:await ensureCharacterRenderer();
    if(!host.isConnected)return;
    const canvas=ensureCanvas(host);
    if(rear)await renderBack(canvas);
    else {canvas.width=364;canvas.height=362;await renderer.render(canvas,stateFor(host.dataset.mmCharacter||'player'));}
    canvas.style.transform=host.dataset.mmFlip==='true'?'scaleX(-1)':'';
    if(host.dataset.mmFootAnchor==='true')await applyFootAnchor(host,canvas);
    if(host.classList.contains('p-reflection'))bottomPack(canvas);
    host.dataset.mmReady='true';
    host.removeAttribute('data-mm-error');
  }catch(error){
    // fallback:主渲染器載入失敗時,改用玩家的走路圖集(正面第 0 格),至少讓玩家出現
    if(host.dataset.mmView!=='back'&&host.dataset.mmCharacter!=='grandson'){
      try{const draw=await prepareWalk();if(host.isConnected){const cv=ensureCanvas(host);draw(cv,'down',0);host.querySelector('.mm-render-error')?.remove();host.dataset.mmReady='true';host.dataset.mmFallback='walk';host.removeAttribute('data-mm-error');console.warn('[MemoryMaze] 主角色渲染器失敗,已改用走路圖集:',error);return;}}catch(e2){}
    }
    const message=String(error?.message||error);
    console.error('[MemoryMaze character rendering failed]',location.pathname,host.className,message,error);
    host.dataset.mmError=message;
    host.dataset.mmReady='false';
    // Visible diagnostic; never silently show legacy photographic character.
    if(!host.querySelector('.mm-render-error')){
      const indicator=document.createElement('span');indicator.className='mm-render-error';
      indicator.textContent='角色載入失敗';indicator.title=message;host.appendChild(indicator);
    }
  }
}
// Crop transparent margins and paint the actual shoes at an explicit shared baseline.
function alphaBox(canvas){
  const {width:w,height:h}=canvas;const {data}=canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h);
  let l=w,t=h,r=-1,b=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>16){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}
  return r<0?null:{x:l,y:t,w:r-l+1,h:b-t+1};
}
function bottomPack(canvas){
  const rect=alphaBox(canvas);if(!rect)return;
  const temp=document.createElement('canvas');temp.width=canvas.width;temp.height=canvas.height;
  temp.getContext('2d').drawImage(canvas,0,0);
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;
  ctx.drawImage(temp,rect.x,rect.y,rect.w,rect.h,(canvas.width-rect.w)/2,canvas.height-rect.h,rect.w,rect.h);
}
/* 第三修改計劃新增 A5:對話框(data-mm-ref-scale)裡所有老人都用「沉穩長者」的縮放比例(沉穩長者身高 289px → 440px),
   較寬的體型改成加寬畫布,不再為了塞進固定寬度而把人縮小。 */
const REF_SCALE=440/289;
function drawFeetRef(canvas,source,rect,host){
  const dw=Math.round(rect.w*REF_SCALE),dh=Math.round(rect.h*REF_SCALE),destHeight=Math.max(520,dh+8),destWidth=Math.max(260,dw+8);
  const tmp=document.createElement('canvas');tmp.width=destWidth;tmp.height=destHeight;
  const ctx=tmp.getContext('2d');ctx.imageSmoothingEnabled=false;
  ctx.drawImage(source,rect.x,rect.y,rect.w,rect.h,Math.round((destWidth-dw)/2),destHeight-dh,dw,dh);
  canvas.width=destWidth;canvas.height=destHeight;
  const final=canvas.getContext('2d');final.imageSmoothingEnabled=false;final.clearRect(0,0,destWidth,destHeight);final.drawImage(tmp,0,0);
  if(host){host.style.aspectRatio=destWidth+' / '+destHeight;host.style.setProperty('--mm-ref-h',(destHeight/520).toFixed(4));}
}
function drawFeet(canvas,source,rect){
  if(!rect)return;
  const destWidth=260,destHeight=520,visibleHeight=440;
  const tmp=document.createElement('canvas');tmp.width=destWidth;tmp.height=destHeight;
  const ctx=tmp.getContext('2d');ctx.imageSmoothingEnabled=false;
  const ratio=Math.min(visibleHeight/rect.h,235/rect.w);
  const dw=rect.w*ratio,dh=rect.h*ratio;
  ctx.drawImage(source,rect.x,rect.y,rect.w,rect.h,(destWidth-dw)/2,destHeight-dh,dw,dh);
  canvas.width=destWidth;canvas.height=destHeight;
  const final=canvas.getContext('2d');final.imageSmoothingEnabled=false;final.clearRect(0,0,destWidth,destHeight);final.drawImage(tmp,0,0);
}
async function applyFootAnchor(host,canvas){
  const copy=document.createElement('canvas');copy.width=canvas.width;copy.height=canvas.height;copy.getContext('2d').drawImage(canvas,0,0);
  const box=alphaBox(copy);if(host.dataset.mmRefScale==='true'&&box)drawFeetRef(canvas,copy,box,host);else drawFeet(canvas,copy,box);host.classList.add('mm-feet-aligned');canvas.style.transform='none';
}
let grandsonImagePromise;
async function renderGrandsonAnchor(host){
  if(!grandsonImagePromise)grandsonImagePromise=new Promise((resolve,reject)=>{
    const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('grandson image missing'));im.src=location.pathname.includes('/room4-hearing/')?'assets/noise/grandson.png':'assets/phone/grandson.png';
  });
  try{const image=await grandsonImagePromise;if(!host.isConnected)return;
    const source=document.createElement('canvas');source.width=image.naturalWidth;source.height=image.naturalHeight;
    source.getContext('2d').drawImage(image,0,0);
    let canvas=host.querySelector('.mm-character-canvas');if(!canvas){canvas=document.createElement('canvas');canvas.className='mm-character-canvas';host.appendChild(canvas);}
    drawFeet(canvas,source,alphaBox(source));host.classList.add('mm-feet-aligned');
  }catch(e){console.error('grandson anchor:',e);}
}
function renderWithin(scope){const rootScope=scope&&scope.querySelectorAll?scope:document;const tasks=Array.from(rootScope.querySelectorAll('[data-mm-character]')).map(renderHost);const grandson=rootScope.querySelectorAll('[data-mm-foot-grandson]');grandson.forEach(el=>tasks.push(renderGrandsonAnchor(el)));return Promise.all(tasks);}
(function injectStyles(){if(document.getElementById('mm-character-runtime-style'))return;const style=document.createElement('style');style.id='mm-character-runtime-style';style.textContent='[data-mm-character]{display:block;position:relative}[data-mm-character]>.mm-character-canvas{display:block;width:100%;height:100%;object-fit:contain;image-rendering:pixelated}.mm-render-error{font-size:12px;color:#a22222;background:#fff9e6;padding:3px}';document.head.appendChild(style);})();
root.MemoryMazeCharacters={getPlayer:normalizedPlayer,prepareWalk,renderWithin,renderHost,playerRenderState,grandsonRenderState,ensureCharacterRenderer};
})(window);