/* 外殼通用 UI：全螢幕切換鈕（BUG-003 / ART-001）與直立手機「請轉橫向」提示（BUG-005 / ART-003）。
   按鈕放在 iframe 之外的最上層，首頁、角色建立、遊戲、片尾都可使用。 */
(()=>{
  const root=document.documentElement;
  const canFs=!!(root.requestFullscreen||root.webkitRequestFullscreen);
  const fsElement=()=>document.fullscreenElement||document.webkitFullscreenElement||null;

  if(canFs){
    const btn=document.createElement('button');
    btn.id='shell-fullscreen';btn.className='shell-fullscreen';btn.type='button';
    const img=document.createElement('img');img.alt='';img.draggable=false;btn.appendChild(img);
    const sync=()=>{
      const on=!!fsElement();
      img.src=`assets/ui-shell/icon-fullscreen-${on?'exit':'enter'}.png`;
      const label=on?'離開全螢幕':'進入全螢幕';
      btn.setAttribute('aria-label',label);btn.title=label;btn.setAttribute('aria-pressed',String(on));
    };
    btn.onclick=()=>{
      try{
        const p=fsElement()?(document.exitFullscreen||document.webkitExitFullscreen).call(document):(root.requestFullscreen||root.webkitRequestFullscreen).call(root);
        if(p&&p.catch)p.catch(()=>{});
      }catch(e){}
    };
    document.addEventListener('fullscreenchange',sync);document.addEventListener('webkitfullscreenchange',sync);
    sync();document.body.appendChild(btn);
  }

  /* 直立小螢幕提示：只提醒，可按「仍要繼續」關閉，本次開啟網頁期間不再出現 */
  const mq=window.matchMedia('(orientation:portrait) and (max-width:700px)');
  let dismissed=false;
  const hint=document.createElement('div');
  hint.id='rotate-hint';hint.className='rotate-hint';hint.hidden=true;hint.setAttribute('role','dialog');hint.setAttribute('aria-modal','true');hint.setAttribute('aria-label','請將裝置轉成橫向');
  hint.innerHTML='<div class="rotate-hint-card"><img src="assets/ui-shell/icon-rotate-device.png" alt="" draggable="false"><p>請將裝置轉成橫向</p><small>橫向畫面才能完整玩遊戲</small><button type="button" class="soft-button">仍要繼續</button></div>';
  document.body.appendChild(hint);
  const update=()=>{hint.hidden=dismissed||!mq.matches};
  hint.querySelector('button').onclick=()=>{dismissed=true;update()};
  (mq.addEventListener?mq.addEventListener('change',update):mq.addListener(update));
  update();
})();
