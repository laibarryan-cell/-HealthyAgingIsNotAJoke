(function(root){'use strict';
const E=root.WalletEngine,R=()=>root.R5,C=()=>root.StoryCopy.room5.wallet;let app,back,s,running=false,effectTimer=null,burstLeft=0,burstStart=0,burstPaused=false,failing=false,reader=null,photo='assets/wallet/education-poster.jfif',eduIndex=0,discoveryPlayed=false;const q=x=>app.querySelector(x);
function burstEnd(){effectTimer=null;if(!running)return;s={...s,burst:false};render();}
const PAUSER={pause(){if(effectTimer&&!burstPaused){clearTimeout(effectTimer);burstLeft-=Date.now()-burstStart;burstPaused=true;}},resume(){if(burstPaused&&running){burstPaused=false;burstStart=Date.now();effectTimer=setTimeout(burstEnd,Math.max(0,burstLeft));}}};
function dispose(){running=false;R().setPauser(null);clearTimeout(effectTimer);effectTimer=null;if(reader&&reader.readyState===1)reader.abort();reader=null;}
function exit(){dispose();back();}
function dispatch(action,value){if(!running)return;const prev=s.searched.length;const btn=action==='search'?q(`[data-search="${value}"]`):null;const rect=btn?btn.getBoundingClientRect():null;s=E.act(s,action,value);render(prev);if(rect&&s.searched.length>prev){const bar=R().bar();if(bar)root.StoryKit.awardStar({getBoundingClientRect:()=>rect},bar,s.searched.length);}}
function header(){const mood=E.mood(s.stress);return `<header class="w-top r5-wtop"><button id="returnRoom" class="back">← 返回房間</button><h1 id="moduleTitle" class="r5-title" tabindex="-1">${C().title}</h1><div class="w-emotion" aria-label="遊戲情境情緒：${mood}"><div class="w-segments">${['平靜','不安','煩躁','生氣'].map(label=>`<span class="${mood===label?'is-current':''}" ${mood===label?'aria-current="true"':''}>${label}</span>`).join('')}</div></div><div id="r5Bar" class="progress-chip color-progress" aria-label="搜尋進度"></div></header>`;}
function grandpa(angry=false){return `<div class="w-grandpa ${angry?'is-angry':''}"><div class="w-grandpa-actor" data-mm-character="player" aria-label="${angry?'生氣的阿公（遊戲示意）':'阿公'}"></div>${angry?'<span class="w-angry-mark" aria-hidden="true">💢</span>':''}</div>`;}
function learning(){const lines=[`如果常把東西放在不尋常的位置，之後又完全想不起來，就值得留意。`, `找不到東西後懷疑別人拿走，或比以前更容易焦躁，也可能是生活中的變化。`, `這時先別責怪或爭辯，可以陪他一起找，慢慢回想剛才做過的事。`, `單次遺失不能代表失智；如果反覆發生並影響生活，可以尋求專業評估。`];return `<section class="w-learning" aria-labelledby="wLearnTitle"><div class="w-photo-area"><div class="w-photo-frame">${photo?`<img id="wLocalPhoto" class="education-poster" tabindex="0" role="button" src="${photo}" alt="學習照片">`:'<span>預留學習照片</span>'}</div></div><article><p class="w-kicker">找到錢包了 · 原來在衣櫃的毛巾堆裡</p><h1 id="wLearnTitle">值得留意的變化</h1><div class="edu-stepper"><p id="wEduLine" class="edu-line">${lines[0]}</p><div class="edu-controls"><button type="button" id="wSpeak" class="edu-speak">聽這一句</button><span id="wEduProgress" class="edu-progress">1 / 4</span><button type="button" id="wEduNext">下一句 ▶</button></div></div><button id="wFinish" class="w-primary" hidden>完成學習</button></article></section>`;}
function render(barFilled){clearTimeout(effectTimer);effectTimer=null;burstLeft=0;
 /* 與朋友版 w10_1114 整合:找到錢包後改播朋友版四幕劇情短劇;最後一幕的按鈕沿用 B4「完成學習」→ 寶物 →「返回房間」 */
 if(s.found){
  R().setPauser(null);
  if(!discoveryPlayed){
   discoveryPlayed=true;
   const foundState=s;
   app.querySelector('.w-response-overlay')?.remove();
   app.querySelector('.w-irritated')?.remove();
   app.querySelector('.w-emoji-rain')?.remove();
   app.querySelectorAll('button').forEach(b=>b.disabled=true);
   root.StoryDialog.play({mode:'player',position:'bottom',lines:C().found}).then(()=>{
    if(running&&s===foundState)render();
   });
   return;
  }
  root.CognitionStory.show(app,'wallet',()=>{
   const btn=app.querySelector('#csNext'),prev=app.querySelector('#csPrev');if(!btn)return;if(prev)prev.disabled=true;
   root.StoryDialog.finishButton(btn,{backLabel:'返回房間',finish:async()=>{if(!s.found||!running)return;await R().talk(C().reward,{position:'center'});if(!running)return;s=E.act(s,'finish');if(!s.done)return;root.AchievementSystem.completeActivity('cognition','bedroom');await root.AchievementSystem?.obtainItem({id:'cognition_key',name:'小鑰匙',room:'cognition'});},back:()=>{if(running)exit();}});
   setTimeout(()=>btn.click(),0);
  },exit);
  return;
 }
 app.innerHTML=`<section id="wShell" class="wallet-module ${s.found?'w-learning-page':''} ${s.failed?'w-failed':''}" data-module="bedroom" data-mood="${E.mood(s.stress)}">${header()}${R().toolbar()}${s.found?learning():`<main class="w-scene" aria-label="點選房間物件搜尋錢包"><div class="w-canvas"><img class="w-room" src="assets/wallet/bedroom.png" alt="房間搜尋場景">${E.objects.map(o=>`<button id="w-${o.id}" class="w-hotspot w-${o.id} ${s.searched.includes(o.id)?'searched':''}" data-search="${o.id}" ${s.pending!==null||s.failed||s.burst||s.searched.includes(o.id)?'disabled':''} aria-label="搜尋${o.name}${s.searched.includes(o.id)?'，已查看':''}"><span>${o.name}</span></button>`).join('')}</div><p id="wImageError" hidden>圖片未載入，請完整解壓縮 ZIP。</p></main>${s.pending!==null?`<section class="w-response-overlay" role="dialog" aria-modal="true" aria-labelledby="wSpeech">${grandpa()}<div class="w-response-card"><p class="w-search-result">${s.searching==='wardrobe'?'正在查看衣櫃，先陪阿公慢慢找。':'這裡沒有找到錢包。'}</p><h2 id="wSpeech">${E.prompts[s.pending].line}</h2><div class="w-choices">${E.prompts[s.pending].choices.map((c,i)=>`<button id="wReply${i}" data-reply="${i}">${String.fromCharCode(65+i)}. ${c[0]}</button>`).join('')}</div></div></section>`:''}${s.burst?`<div class="w-irritated" role="status">${grandpa(true)}<p>阿公更煩躁了</p></div><div class="w-emoji-rain" aria-hidden="true">${Array.from({length:18},(_,i)=>`<span class="w-drop w-drop-${i%6}">${i%2?'💢':'😠'}</span>`).join('')}</div>`:''}`}</section>`;
 root.MemoryMazeCharacters?.renderWithin(app);
q('#returnRoom').onclick=exit;
 app.querySelectorAll('[data-search]').forEach(b=>b.onclick=()=>dispatch('search',b.dataset.search));
 /* 第三修改計劃新增 F1:可點物品比照各房間進場時的物品效果 —— 物品本身(從房間圖裁出)滑過時發亮放大、金色光暈、上方深藍金框名牌;
    按下有壓下回饋、點擊彈跳;未查看的物品每兩秒輪流微亮提示。只改外觀與手感,不改找錢包規則 */
 (function decorateHotspots(){const cv=q('.w-canvas'),img=q('.w-room');if(!cv||!img)return;
  const src=img.getAttribute('src');const hs=[...app.querySelectorAll('.w-hotspot')];
  const place=()=>{const W=cv.clientWidth,H=cv.clientHeight;if(!W||!H)return;hs.forEach(b=>{const i=b.querySelector('.w-hot-img');if(!i)return;const l=b.offsetLeft,t=b.offsetTop,w=b.offsetWidth,h=b.offsetHeight;if(!w||!h)return;
   i.style.backgroundSize=(W/w*100)+'% '+(H/h*100)+'%';i.style.backgroundPosition=(W-w?l/(W-w)*100:0)+'% '+(H-h?t/(H-h)*100:0)+'%';
   /* 名牌:物品上緣被頁首蓋住或太貼頂時,改放在物品內、頁首下方 */
   const sp=b.querySelector('span'),top=q('.w-top');if(sp&&top){const hb=top.getBoundingClientRect().bottom,br=b.getBoundingClientRect();const z=br.height/(h||1)||1;const need=br.top<hb+44;sp.classList.toggle('w-label-in',need);if(need)sp.style.setProperty('top',Math.max(0,(hb-br.top)/z+8)+'px','important');else sp.style.removeProperty('top');}});};
  hs.forEach((b,n)=>{if(!b.querySelector('.w-hot-img')){const i=document.createElement('i');i.className='w-hot-img';i.setAttribute('aria-hidden','true');i.style.backgroundImage=`url('${src}')`;i.style.setProperty('--w-hint-delay',(n%4)*2+'s');b.prepend(i);}
   b.addEventListener('pointerdown',()=>b.classList.add('w-press'));['pointerup','pointerleave'].forEach(t=>b.addEventListener(t,()=>b.classList.remove('w-press')));
   b.addEventListener('click',()=>{b.classList.remove('w-bounce');void b.offsetWidth;b.classList.add('w-bounce');setTimeout(()=>b.classList.remove('w-bounce'),380);});});
  place();requestAnimationFrame(place);const ro=new ResizeObserver(place);ro.observe(cv);
 })();
 app.querySelectorAll('[data-reply]').forEach(b=>b.onclick=()=>dispatch('reply',Number(b.dataset.reply)));
 if(q('.w-room'))q('.w-room').onerror=()=>q('#wImageError').hidden=false;
 if(q('#wEduLine')){const lines=['如果常把東西放在不尋常的位置，之後又完全想不起來，就值得留意。','找不到東西後懷疑別人拿走，或比以前更容易焦躁，也可能是生活中的變化。','這時先別責怪或爭辯，可以陪他一起找，慢慢回想剛才做過的事。','單次遺失不能代表失智；如果反覆發生並影響生活，可以尋求專業評估。'];const update=()=>{q('#wEduLine').textContent=lines[eduIndex];q('#wEduProgress').textContent=`${eduIndex+1} / ${lines.length}`;q('#wEduNext').textContent=eduIndex===lines.length-1?'完成閱讀':'下一句 ▶';};q('#wSpeak').onclick=()=>{try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(lines[eduIndex]);u.lang='zh-TW';u.rate=.85;speechSynthesis.speak(u);}catch(e){}};q('#wEduNext').onclick=()=>{if(eduIndex<lines.length-1){eduIndex++;update();}else{q('#wEduNext').hidden=true;q('#wFinish').hidden=false;}};update();}
 /* 第三修改計劃 B4:同一顆按鈕「完成學習」→ 寶物 → 返回 */if(q('#wFinish'))root.StoryDialog.finishButton(q('#wFinish'),{backLabel:'返回房間',finish:async()=>{if(!s.found||!running)return;await R().talk(C().reward,{position:'center'});if(!running)return;s=E.act(s,'finish');if(!s.done)return;root.AchievementSystem.completeActivity('cognition','bedroom');await root.AchievementSystem?.obtainItem({id:'cognition_key',name:'小鑰匙',room:'cognition'});},back:()=>{if(q('#wFinish')?.isConnected)exit();}});
 
 if(s.found)q('#wLearnTitle').focus();else if(s.pending!==null)q('#wReply0').focus();else if(!s.burst)Array.from(app.querySelectorAll('[data-search]')).find(b=>!b.disabled)?.focus({preventScroll:true});
 if(s.burst){burstLeft=2200;burstStart=Date.now();burstPaused=false;effectTimer=setTimeout(burstEnd,burstLeft);}
 q('#wShell').onkeydown=e=>{if(e.key!=='Tab'||s.pending===null)return;const buttons=[q('#returnRoom'),...Array.from(app.querySelectorAll('[data-reply]'))];const i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();};
 R().init('w-hint',C().hint,8,barFilled!==undefined?barFilled:s.searched.length);
 if(s.failed&&!failing){failing=true;(async()=>{await R().paused(()=>root.StoryKit.askButtons(C().fail,[{label:C().retry,value:true}],{position:'center'}));failing=false;if(!running)return;s=E.initial();render(0);q('#w-sofa')?.focus();})();}
}
function upload(){const file=q('#wPhotoInput').files[0];if(!file)return;if(!/\.(jfif|jpe?g)$/i.test(file.name)||file.size>12*1024*1024){q('#wPhotoError').textContent='請選擇 12 MB 以下的 JFIF／JPEG 照片。';return;}if(reader&&reader.readyState===1)reader.abort();reader=new FileReader();reader.onload=()=>{if(!running||!s.found)return;const candidate=reader.result,img=new Image();img.onload=()=>{if(!running||!s.found)return;photo=candidate;render();q('#wPhotoInput').focus();};img.onerror=()=>{if(running&&q('#wPhotoError'))q('#wPhotoError').textContent='照片無法讀取，請換一張 JFIF／JPEG 圖片。';};img.src=candidate;};reader.onerror=()=>{if(running&&q('#wPhotoError'))q('#wPhotoError').textContent='讀取失敗，請重新選擇。';};reader.readAsDataURL(file);}
root.CognitionWallet={mount(target,onBack){dispose();app=target;back=onBack;s=E.initial();discoveryPlayed=false;running=true;failing=false;R().setPauser(PAUSER);render(0);root.scrollTo(0,0);},dispose};
})(window);
