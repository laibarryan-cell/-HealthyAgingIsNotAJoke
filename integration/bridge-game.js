/* 整合橋接（組員遊戲端）
   只在被外殼 iframe 載入、且帶有新版角色資料（version>=2）時啟用；
   單獨開啟 game/index.html 時完全維持組員原本的行為。
   不改動組員的關卡、解鎖、進度、抽牌邏輯，只做三件事：
   1) 把配置圖上的滑鼠位置傳給外殼，由外殼畫新版走路角色
   2) 隱藏組員原本的靜態滑鼠角色
   3) 房間 7 抽完記憶卡按「離開記憶房間」後，直接通知外殼播放片尾 */
(()=>{
  if(window.parent===window)return;
  let player=null;
  try{player=JSON.parse(localStorage.getItem('memoryMazePlayer')||'null')}catch(e){}
  if(!player||!(player.version>=2))return;

  const post=m=>window.parent.postMessage(m,'*');

  const style=document.createElement('style');
  style.textContent='#mapPlayerCursor{display:none!important}';
  document.head.appendChild(style);

  // 1) 配置圖是否顯示 + 滑鼠位置（iframe 填滿外殼視窗，座標可直接使用）
  const mapScreen=document.getElementById('mapScreen');
  const mapStage=document.getElementById('mapStage');
  let lastActive=null;
  // the walking character is hidden while any dialog / modal / clue card is open on the map
  const overlayOpen=()=>!!document.querySelector('.au-overlay,.au-dialog,#modalOverlay.show,.au-mission.au-open,.sd-overlay,.rc-overlay');   // 2026-11-18:通關畫面播放時也隱藏地圖小人  // 第二修改計劃追加:任務面板、NPC 對話開著時也隱藏
  const reportActive=()=>{
    const active=mapScreen.classList.contains('active')&&!overlayOpen();
    if(active!==lastActive){lastActive=active;post({type:'memoryMaze:mapActive',active});}
  };
  new MutationObserver(reportActive).observe(mapScreen,{attributes:true,attributeFilter:['class']});
  new MutationObserver(reportActive).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  const modalOv=document.getElementById('modalOverlay');
  if(modalOv)new MutationObserver(reportActive).observe(modalOv,{attributes:true,attributeFilter:['class']});
  reportActive();
  // 玩家是否在房間裡（不在配置圖）：外殼的全螢幕鈕要避開房間左下角的成就「物品」圓鈕
  let lastInRoom=null;
  const reportInRoom=()=>{
    const inRoom=!mapScreen.classList.contains('active');
    if(inRoom!==lastInRoom){lastInRoom=inRoom;post({type:'memoryMaze:inRoom',inRoom});}
  };
  new MutationObserver(reportInRoom).observe(mapScreen,{attributes:true,attributeFilter:['class']});
  reportInRoom();
  ['pointermove','pointerdown'].forEach(kind=>{
    mapStage.addEventListener(kind,e=>post({type:'memoryMaze:pointer',kind,x:e.clientX,y:e.clientY,pointerType:e.pointerType}),{passive:true});
  });

  // 外殼切到首頁／角色建立／片尾時，遊戲畫面被隱藏：暫停所有音訊，回到遊戲再恢復
  // （只恢復「因隱藏而被暫停」的那幾個；玩家自己關掉的音樂不會被打開）
  let pausedByShell=[];
  window.addEventListener('message',e=>{
    if(e.source!==window.parent||!e.data||e.data.type!=='memoryMaze:shellVisible')return;
    if(e.data.visible){
      pausedByShell.forEach(a=>{a.play().catch(()=>{})});pausedByShell=[];
    }else{
      document.querySelectorAll('audio').forEach(a=>{if(!a.paused&&!a.ended){pausedByShell.push(a);a.pause()}});
    }
  });

  // 「返回遊戲首頁」先問過外殼（顯示確認框），確認後才真的返回，避免誤觸丟失目前進行中的內容
  const logoutBtn=document.getElementById('logoutBtn');
  let homeAllowed=false;
  if(logoutBtn){
    logoutBtn.addEventListener('click',e=>{
      if(homeAllowed){homeAllowed=false;return}
      e.stopImmediatePropagation();e.preventDefault();
      post({type:'memoryMaze:confirmHome'});
    },true);
    window.addEventListener('message',e=>{
      if(e.source!==window.parent||!e.data||e.data.type!=='memoryMaze:homeConfirmed')return;
      homeAllowed=true;logoutBtn.click();
    });
  }

  // 3) 房間 7 抽記憶卡完成後，按「離開記憶房間」就直接通知外殼播放片尾（朋友版通關流程，跳過舊的最後一頁）。
  //    保留抽籤與抽到的記憶卡本身的所有既有程式；只攔截離開鈕的點擊。
  let endingRequested=false;
  document.addEventListener('click',e=>{
    const exitBtn=e.target.closest('#room7ExitBtn');
    if(!exitBtn||exitBtn.disabled||endingRequested)return;
    endingRequested=true;
    e.preventDefault();e.stopImmediatePropagation();
    post({type:'memoryMaze:startEnding'});
  },true);

  // 後備：若玩家還是走到最後一頁，「再玩一次」→「恭喜通關」，按下後同樣交給外殼播放片尾
  const btn=document.getElementById('playAgainBtn');
  if(btn){
    btn.textContent='恭喜通關';
    document.addEventListener('click',e=>{
      if(!e.target.closest('#playAgainBtn'))return;
      e.stopPropagation();e.preventDefault();
      post({type:'memoryMaze:startEnding'});
    },true);
  }
})();
