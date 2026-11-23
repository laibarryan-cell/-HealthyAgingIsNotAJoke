(function(root){
'use strict';
// 房間5四個物件的獨立衛教短劇：不改動原本關卡機制與成就發放。
const stories={
 wallet:{
  title:'阿公的偵探任務',kicker:'找錢包｜四幕衛教短劇',
  scenes:[
   {caption:'阿公發現錢包不見，立刻化身偵探！阿公：「犯人一定就在這個家裡！」',
    line:'如果經常把物品放在不尋常的位置，之後又想不起來，值得留意是否出現記憶方面的變化。'},
   {caption:'阿公突然在毛巾堆裡發現了錢包。阿公：「可惡……來看看犯人是誰！」',
    line:'找不到東西時，長者可能感到焦慮，甚至懷疑別人拿走；家人應先理解他的不安，而不是嘲笑或責備。'},
   {caption:'兩人查看家裡先前拍下的影像，阿公：「等一下……這個人怎麼這麼眼熟？！」',
    line:'協助時可以一起回想最後一次使用物品的時間與地點，逐步尋找線索，也可以建立固定的收納位置。'},
   {caption:'阿公突然尷尬地摸摸頭：「啊……破案了！原來犯人是昨天把錢包收進衣櫃的我……」孫子笑著陪他把錢包放回固定位置。',
    line:'偶爾忘記物品放在哪裡不代表失智；若情況反覆發生、與以往明顯不同或影響生活，建議尋求專業評估。'}
  ]
 },
 kitchen:{
  title:'阿公的五星級地獄廚房',kicker:'廚房門｜四幕衛教短劇',
  scenes:[
   {caption:'阿公自信滿滿端出拿手炒飯：「五星級主廚上菜！」家人吃下一口，卻發現鹹得驚人，表情瞬間失控！',
    line:'如果開始經常忘記熟悉的料理步驟，或完成原本擅長的事情變得困難，值得留意是否出現認知功能的變化。'},
   {caption:'阿公在廚房手忙腳亂，差點把鹽當成糖，連炒飯的米都忘了放。門邊有個神祕黑影，正悄悄記下他遇到的困難……',
    line:'當多步驟的活動開始變得困難，可以把工作拆成簡單步驟，使用食譜、清單或提醒，減少混亂。'},
   {caption:'神祕黑影原來是阿嬤！她拿出料理食譜，溫柔地說：「看食譜也沒關係，你還是我心目中最厲害的大廚。」',
    line:'如果做熟悉的事情時經常遺漏重要步驟，家人可以一起找出困難、提供協助，也要注意烹調過程中的安全。'},
   {caption:'阿公照著食譜慢慢炒飯，阿嬤在一旁備料：「今天讓我當你的二廚！」阿公靦腆地笑了，兩人再次一起完成料理。',
    line:'透過適當的提示、環境調整與家人陪伴，可以幫助長者繼續參與熟悉的活動；若認知變化持續或影響生活，應尋求專業評估。'}
  ]
 },
 photo:{
  title:'誰是我老公？！',kicker:'牆上的照片｜四幕衛教短劇',
  scenes:[
   {caption:'阿嬤照完鏡子，轉身竟看到一位戴鯊魚帽的肌肉老頭！阿嬤：「你是誰？！怎麼在我家？後面還有一隻鯊魚？！」阿公：「老婆，是我啦！」',
    line:'如果長者反覆對熟悉的人物、影像或環境感到混淆，值得留意是否出現認知功能的變化。'},
   {caption:'阿嬤舉起掃把：「我老公明明是年輕帥哥！」阿公站遠遠地回答她的問題：「妳討厭香菜！第一次約會我還把咖啡灑在褲子上！」',
    line:'當長者出現人物誤認或混淆時，先確保安全、安撫情緒，不宜嘲笑、強迫辨認或激烈爭辯。'},
   {caption:'阿公摘下鯊魚帽，陪阿嬤看牆上的結婚照，輕聲說起兩人的婚禮誓言。阿嬤望著照片與眼前熟悉的笑容，慢慢放下戒心。',
    line:'熟悉的照片、人物、故事與溫和提示，有時能協助長者建立連結、減少不安；不應強迫對方一定要想起答案。'},
   {caption:'兩人坐在沙發上翻相簿。阿嬤笑著說：「你都變老頭子了，還這麼會哄人！」阿公：「因為妳還是我最喜歡的人呀。」',
    line:'耐心陪伴與熟悉的線索能提供支持，但不保證每次都能解除誤認；若情況反覆發生、影響生活或突然明顯混亂，應尋求醫療評估。'}
  ]
 },
 phone:{
  title:'阿公的神祕失蹤事件',kicker:'電話與約定｜四幕衛教短劇',
  scenes:[
   {caption:'阿公穿上亮晶晶的紫色表演服，拿著麥克風帥氣出門！阿嬤看見桌上紙條：「今天要登上重要舞台！」忍不住好奇他跑去哪裡。',
    line:'偶爾記錯日期不一定代表認知功能退化；但若經常搞混時間、日期或活動安排，就值得留意。'},
   {caption:'阿公衝進社區活動中心：「各位觀眾，準備好聽我的天籟美聲了嗎？！」現場卻是烘焙課，大家拿著打蛋器驚訝地看著他。',
    line:'發現日期或地點與預期不符時，可以先停下來，向工作人員確認活動資訊，不必因記錯而感到羞愧。'},
   {caption:'工作人員指著公告：星期五是烘焙課，星期六才是歌唱比賽！阿公尷尬地抓抓頭：「哎呀，原來我早到一天！」阿嬤也趕來了。',
    line:'當長者反覆記錯日期或活動安排，家人可以一起找出容易混淆的地方，利用清楚的日期標示和提醒工具。'},
   {caption:'回家後，兩人把烘焙課記在星期五、歌唱比賽記在星期六的日曆格子，設定手機提醒，再一起核對「日期、星期、時間、地點」。',
    line:'大字體月曆、手機提醒與出門前四確認，有助於管理行程；若時間或地點混淆反覆發生、加重或影響生活，應尋求專業評估。'}
  ]
 }
};
function show(app,key,onComplete,onBack){
 document.querySelectorAll('body > dialog.cs-zoom-floating').forEach(d=>d.remove());
 const story=stories[key];if(!story)throw new Error('找不到衛教短劇：'+key);
 let index=0;
 app.innerHTML=`<section class="cog-story module-view" data-module="${key}" aria-label="四幕衛教短劇">
  <header class="cs-header"><button class="cs-back" id="csBack" type="button">← 返回認知房走道</button><span>ICOPE · 認知房 · 衛教短劇</span><div class="cs-bars" id="csBars" aria-label="四幕進度"></div></header>
  <div class="cs-heading"><p id="csKicker"></p><h1 id="csTitle" tabindex="-1"></h1><p class="cs-subtitle">一幕故事，對應一個衛教重點</p></div>
  <div class="cs-layout"><section class="cs-visual" aria-label="劇情圖片與對白">
   <button type="button" id="csZoom" class="cs-image-button" aria-label="放大查看劇情圖片"><img id="csImage" alt="衛教劇情圖片"><span class="cs-zoom-label">點擊圖片可放大</span></button>
   <p id="csCaption" class="cs-caption"></p></section>
   <section class="cs-copy"><p class="cs-eyebrow">一次看一個衛教重點</p><p id="csLine" class="cs-line" aria-live="polite"></p>
   <div class="cs-actions"><button id="csSpeak" class="cs-secondary" type="button">🔊 聽這一句</button><span id="csCount" class="cs-count" aria-live="polite"></span></div>
   <div class="cs-nav"><button id="csPrev" class="cs-secondary" type="button">← 上一幕</button><button id="csNext" class="cs-primary" type="button">下一幕 →</button></div>
   <p class="cs-note">衛教情境不是診斷。若認知變化反覆出現或影響生活，請尋求專業評估。</p>
   </section></div>
   <dialog id="csDialog" class="cs-dialog" aria-label="放大劇情圖片"><button type="button" id="csClose" class="cs-dialog-close" aria-label="關閉放大圖片">✕ 關閉</button><img id="csLarge" alt=""></dialog>
  </section>`;
 const q=s=>app.querySelector(s),image=q('#csImage'),large=q('#csLarge'),line=q('#csLine');
 q('#csTitle').textContent=story.title;q('#csKicker').textContent=story.kicker;
 q('#csBars').innerHTML=story.scenes.map(()=>'<span></span>').join('');
 function render(){
  const scene=story.scenes[index],src=`assets/edu-stories/${key}-${String(index+1).padStart(2,'0')}.png`;
  image.src=src;large.src=src;
  image.alt=`${story.title}第${index+1}幕`;large.alt=image.alt;
  q('#csCaption').textContent=scene.caption;line.textContent=scene.line;
  q('#csCount').textContent=`${index+1} / ${story.scenes.length}`;
  q('#csPrev').disabled=index===0;
  q('#csNext').textContent=index===story.scenes.length-1?'完成衛教，繼續挑戰 ✓':'下一幕 →';
  q('#csBars').querySelectorAll('span').forEach((bar,i)=>{bar.classList.toggle('active',i<=index);});
  root.scrollTo(0,0);
 }
 q('#csBack').onclick=()=>{try{root.speechSynthesis?.cancel();}catch(e){}onBack();};
 q('#csPrev').onclick=()=>{if(index>0){index--;render();}};
 q('#csNext').onclick=()=>{try{root.speechSynthesis?.cancel();}catch(e){}if(index<story.scenes.length-1){index++;render();}else onComplete();};
 q('#csSpeak').onclick=()=>{try{root.speechSynthesis?.cancel();const u=new SpeechSynthesisUtterance(line.textContent);u.lang='zh-TW';u.rate=.85;root.speechSynthesis?.speak(u);}catch(e){}};
 /* 第三修改計劃新增 A2:頁面被 room5-fit 以 zoom 放大時,放大視窗會一起被放大、關閉鈕跑出畫面外而無法返回。
    改為移到 body 最上層(不受縮放),並可用「關閉」、點背景或 Esc 返回原本那一幕。 */
 const dialog=q('#csDialog'),closeBtn=q('#csClose');
 dialog.classList.add('cs-zoom-floating');document.body.appendChild(dialog);
 q('#csZoom').onclick=()=>{if(typeof dialog.showModal==='function'){dialog.showModal();closeBtn.focus();}};
 closeBtn.onclick=()=>dialog.close();
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 dialog.addEventListener('close',()=>{try{q('#csZoom')?.focus({preventScroll:true});}catch(e){}});
 /* 放大圖開著時,Esc 只關閉放大圖,不讓房間的「Esc 返回」把玩家帶離故事頁 */
 if(!root.__csEscGuard){root.__csEscGuard=true;root.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const d=document.querySelector('body > dialog.cs-zoom-floating[open]');if(!d)return;e.preventDefault();e.stopImmediatePropagation();d.close();},true);}
 image.onerror=()=>{q('#csZoom').classList.add('cs-missing');q('#csCaption').textContent=story.scenes[index].caption+'（圖片未載入，請確認 assets/edu-stories 資料夾已完整覆蓋。）';};
 image.onload=()=>q('#csZoom').classList.remove('cs-missing');
 render();q('#csTitle').focus({preventScroll:true});
}
root.CognitionStory={show};
})(window);
