/* 整合橋接（外殼端）
   外殼 = 新版首頁／角色建立／片尾；組員正式遊戲 = game/index.html，用 iframe 載入。
   本檔在 game.js 之後載入，只覆寫「前往冒險」，並接收組員遊戲傳來的訊息。 */
(()=>{
  const frame=document.getElementById('integrated-game-frame');
  const mapSection=document.getElementById('screen-map');
  const PLAYER_KEY='memoryMazePlayer';
  let loadedKey=null;     // 目前 iframe 載入的角色內容；相同就直接回到遊戲，不重新載入
  let mapActive=false;    // 組員遊戲目前是否停在配置圖

  /* 進度規則（使用者決定）：
     - 「返回首頁」只是回首頁，不清進度（iframe 保持載入，回來還是原本的進度）。
     - 「重新開始」與重新整理網頁才清空進度。
     「進度」＝各房間存檔、成就物品、計時、線索收集等所有遊戲存檔；
     只保留：角色造型（memoryMazeAvatar）、玩家資料（memoryMazePlayer）、音效偏好（memoryMazeSfx）。 */
  /* 2026-11-18:回憶館收藏(memoryMazeGallery,使用者決定跨重新整理保留)、音樂與音量偏好、設定選單(memoryMazeSettings)不屬於「進度」,一併保留 */
  /* 2026-11-18 晚:音樂開關與音量改回原本行為(重新整理就恢復預設,避免曾經關掉的聲音一直留著) */
  /* 2026-11-18 晚(使用者改決定):回憶館收藏(memoryMazeGallery)與「已通關」(memoryMazeCleared,首頁三位老人與新年裝飾)
     在「重新開始 / 重新整理 / 開始新的一輪」時清空;但片尾「返回首頁」只是這一輪結束,它們要留著(keepEnded),
     讓玩家回到首頁還看得到,直到真的重新遊玩(確認角色出發)或按重新開始才清掉。 */
  const KEEP_KEYS=['memoryMazeAvatar','memoryMazePlayer','memoryMazeSfx','memoryMazeSettings','memoryMazeStats'];
  const ENDED_KEYS=['memoryMazeGallery','memoryMazeCleared'];
  function wipeProgress(keepEnded,preserveLearning=false){
    let learning;
    if(preserveLearning){try{learning=JSON.parse(localStorage.getItem("icopeAchievementSystem")||"null")?.extensions?.learning;}catch(e){}}
    try{
      Object.keys(localStorage).forEach(k=>{if(KEEP_KEYS.includes(k))return;if(keepEnded===true&&ENDED_KEYS.includes(k))return;localStorage.removeItem(k)});
    }catch(e){}
    if(learning){try{localStorage.setItem("icopeAchievementSystem",JSON.stringify({version:1,items:[],extensions:{learning}}));}catch(e){}}
    try{sessionStorage.clear()}catch(e){}
    // 成就系統把「本次遊戲」的物品與進度放在最上層視窗（這個外殼）的記憶體裡，換遊戲頁面不會清掉，要在這裡一併清除
    try{delete window[Symbol.for('icope.achievement.runtime.v1')]}catch(e){}
  }
  wipeProgress(false,true); // 重新整理保留學習成果；重新開始仍清除成果
  let endingStarted=false;

  const ACC_FILES=['acc-none.png','acc-glasses.png','acc-hat.png','acc-none.png'];
  // snapshot of the dress-up stage figure (the one chosen on the 裝扮台) — used for every avatar in the game instead of the old art
  function makePortrait(){
    try{
      const src=document.getElementById('preview-character');
      const w=src.width,h=src.height,d=src.getContext('2d').getImageData(0,0,w,h).data;
      let x0=w,y0=h,x1=-1,y1=-1;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>24){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
      if(x1<0)return '';
      const c=document.createElement('canvas');c.width=x1-x0+1;c.height=y1-y0+1;c.getContext('2d').drawImage(src,x0,y0,c.width,c.height,0,0,c.width,c.height);
      return c.toDataURL('image/png');
    }catch(e){return ''}
  }
  function buildPlayer(){
    return {
      portrait:makePortrait(),
      version:2,
      name:state.name||'冒險家',
      base:state.base,hair:state.hair,outfit:state.outfit,accessory:state.accessory,
      hairColor:state.hairColor,outfitColor:state.outfitColor,
      // 以下兩個欄位是組員遊戲原本讀取的格式（頭像用）
      characterAsset:`elder-${state.base+1}-look-${((state.hair+state.outfit)%3)+1}.png`,
      accessoryAsset:ACC_FILES[state.accessory]||'acc-none.png'
    };
  }

  function clearAdventure(keepEnded){
    loadedKey=null;mapActive=false;endingStarted=false;
    frame.src='about:blank';
    wipeProgress(keepEnded===true);
    try{localStorage.removeItem(PLAYER_KEY)}catch(e){}
  }

  // 組員遊戲在配置圖時才顯示走路角色；其他畫面（房間、片尾、首頁）一律隱藏
  const baseShowScreen=showScreen;
  showScreen=function(name){
    baseShowScreen(name);
    if(name!=='map')document.body.dataset.inRoom='0';
    if(name==='map')MapWalker.setActive(mapActive);
    // 通知遊戲：地圖畫面之外（首頁、角色建立、片尾）遊戲看不到，要暫停背景音樂
    try{if(frame.contentWindow)frame.contentWindow.postMessage({type:'memoryMaze:shellVisible',visible:name==='map'},'*')}catch(e){}
  };

  function startAdventure(){
    window.AwakeningStory.play(startAdventureNow);
  }
  function startAdventureNow(){
    endingStarted=false;
    if(loadedKey===null){try{ENDED_KEYS.forEach(k=>localStorage.removeItem(k))}catch(e){}}   // 開始新的一輪:清掉上一輪的回憶館與通關彩蛋
    const player=buildPlayer(),key=JSON.stringify(player);
    try{localStorage.setItem(PLAYER_KEY,JSON.stringify(player))}catch(e){}
    MapWalker.select(state.base,state);
    if(key!==loadedKey){loadedKey=key;mapActive=false;frame.src='game/index.html?b=quickclear1'}
    showScreen('map');
  }
  $('#go-adventure').onclick=()=>{
    // 已經玩過、又改了角色：遊戲會重新載入而從頭開始，先讓玩家確認（BUG-009b）
    if(loadedKey!==null&&JSON.stringify(buildPlayer())!==loadedKey){
      openDialog('<h2>更換角色？</h2><p>你已經開始過遊戲。更換造型或名字後，遊戲畫面會重新載入：已完成的房間與取得的物品會保留，進行到一半的內容可能要重新開始。</p><div class="dialog-actions"><button class="primary-button" id="confirm-new-look">確定更換</button> <button class="soft-button" id="cancel-dialog">取消</button></div>');
      return;
    }
    startAdventure();
  };

  // 對話框按鈕（外殼的 #dialog-content 共用）
  $('#dialog-content').addEventListener('click',e=>{
    const id=e.target.id,dlg=$('#app-dialog');
    if(id==='cancel-dialog')dlg.close();
    else if(id==='confirm-new-look'){dlg.close();startAdventure()}
    else if(id==='confirm-game-home'){dlg.close();try{frame.contentWindow.postMessage({type:'memoryMaze:homeConfirmed'},'*')}catch(err){}}
  });

  window.addEventListener('message',e=>{
    if(e.source!==frame.contentWindow)return;
    const d=e.data||{};
    switch(d.type){
      case 'memoryMaze:mapActive':
        mapActive=!!d.active;
        if(mapSection.classList.contains('active'))MapWalker.setActive(mapActive);
        break;
      case 'memoryMaze:inRoom':          // 玩家在房間裡：全螢幕鈕上移，避開左下角的成就「物品」鈕
        document.body.dataset.inRoom=d.inRoom?'1':'0';
        break;
      case 'memoryMaze:pointer':
        if(mapActive&&mapSection.classList.contains('active'))
          mapSection.dispatchEvent(new PointerEvent(d.kind||'pointermove',{clientX:d.x,clientY:d.y,pointerType:d.pointerType||'mouse'}));
        break;
      case 'memoryMaze:confirmHome':     // 組員遊戲「返回遊戲首頁」被按下：先確認
        openDialog('<h2>返回首頁？</h2><p>返回首頁後，目前的遊戲進度會保留到重新整理網頁為止。若回到角色建立後更換角色，遊戲才會重新開始。</p><div class="dialog-actions"><button class="primary-button" id="confirm-game-home">確定返回</button> <button class="soft-button" id="cancel-dialog">取消</button></div>');
        break;
      case 'memoryMaze:returnHome':      // 組員遊戲右上角「返回遊戲首頁」：回新版首頁，保留進度
        if(d.reset)clearAdventure(true);
        MapWalker.setActive(false);
        showScreen('home');
        break;
      case 'memoryMaze:startEnding':     // 房間 7 按下「恭喜通關」：播放新版片尾（只觸發一次）
        if(endingStarted)break;
        endingStarted=true;
        mapActive=false;
        MapWalker.setActive(false);
        startEndingSequence();
        break;
    }
  });

  /* 2026-11-18 設定選單用:不論在首頁或遊戲頁框裡,都能回首頁(保留進度)或重新開始(清空進度) */
  window.MemoryMazeShell={
    home(){mapActive=false;MapWalker.setActive(false);showScreen('home')},
    restart(){clearAdventure();if(typeof resetAvatarState==='function')resetAvatarState();MapWalker.setActive(false);showScreen('home')}
  };

  // 片尾結束後「重新開始」「返回首頁」：清掉組員遊戲進度
  $('#restart-game').addEventListener('click',()=>clearAdventure());
  // 片尾「返回首頁」＝這一輪結束：下次重新建立角色
  $$('#screen-finish [data-action="home"]').forEach(b=>b.addEventListener('click',()=>{clearAdventure(true);if(typeof resetAvatarState==='function')resetAvatarState()}));
})();
