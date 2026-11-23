(function(root){
  'use strict';
  const base=new URL('.',document.currentScript.src),errors=new Map();
  let host=root;try{while(host.parent!==host&&host.parent.document)host=host.parent;}catch(_){}
  const doc=host.document;let active=null;
  function node(tag,text){const el=doc.createElement(tag);if(text!==undefined)el.textContent=text;return el;}
  function show(options){
    if(active)return false;
    const count=options.correct?0:(errors.get(options.key)||0)+1;
    if(options.correct)errors.delete(options.key);else errors.set(options.key,count);
    const videoMode=!options.correct&&count>=2;
    const portal=node('div'),shadow=portal.attachShadow({mode:'open'}),style=node('style');
    style.textContent=`
      dialog{box-sizing:border-box;position:fixed;inset:0;width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:24px;border:0;background:transparent;color:white;font-family:system-ui,'Microsoft JhengHei',sans-serif;overflow:auto}
      dialog::backdrop{background:#0009}button{font:inherit;min-height:48px;cursor:pointer}button:focus-visible{outline:4px solid #8ff7ff;outline-offset:3px}
      .talk{box-sizing:border-box;position:absolute;bottom:6%;left:7%;width:86%;max-height:78vh;border:4px solid #f5f5ef;background:#10151d;padding:22px 29% 22px 24px;box-shadow:0 10px 30px #0008}
      .elder{position:absolute;right:-2%;bottom:-4px;width:30%;max-height:420px;object-fit:contain;object-position:bottom;pointer-events:none}
      h2{color:#f5d47a;font-size:clamp(18px,2vw,26px);margin:0 0 12px}.message{background:#030405;padding:16px;font-size:clamp(18px,2vw,25px);font-weight:700;line-height:1.6;white-space:pre-wrap;overflow:auto;max-height:38vh;margin:0 0 14px}
      .continue{width:100%;background:#f2cd60;color:#191d20;border:2px solid #fff0bb;font-weight:700}.note{font-size:14px;margin:10px 0 0;color:#dadfe5}
      .video-wrap{min-height:calc(100dvh - 48px);display:flex;flex-direction:column;justify-content:center;align-items:center;gap:14px;text-align:center}
      video{display:block;max-width:min(92vw,1100px);max-height:72vh;width:auto;height:auto;background:black;box-shadow:0 8px 30px #0008}.recovery{padding:10px 24px;background:#f2cd60;color:#111;border:2px solid #fff0bb}
      [hidden]{display:none!important}
      @media(max-width:600px){dialog{padding:12px}.talk{left:3%;width:94%;padding:14px 25% 14px 12px;bottom:5%}.elder{width:26%}.message{font-size:16px;padding:10px;max-height:42vh}.note{font-size:12px}}
    `;
    const dialog=node('dialog');dialog.setAttribute('aria-label',videoMode?'觀看影片後重新作答':'作答回饋');dialog.setAttribute('aria-modal','true');
    let timer=null,video=null,closed=false;const oldFocus=doc.activeElement;
    function finish(callback){if(closed)return;closed=true;if(timer!==null)root.clearTimeout(timer);video?.pause();dialog.close();portal.remove();active=null;callback?.();if(oldFocus?.isConnected&&!oldFocus.disabled)oldFocus.focus();}
    active={cancel:()=>finish()};
    dialog.addEventListener('cancel',e=>e.preventDefault());
    dialog.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')e.preventDefault();});
    dialog.addEventListener('keyup',e=>e.stopPropagation());
    dialog.addEventListener('contextmenu',e=>e.preventDefault());
    if(videoMode){
      const wrap=node('section');wrap.className='video-wrap';const label=node('p','請看完影片，接著重新作答。');label.setAttribute('role','status');
      video=node('video');video.src=new URL('assets/quiz-retry.mp4',base).href;video.controls=false;video.playsInline=true;video.preload='auto';video.volume=.7;video.disablePictureInPicture=true;video.disableRemotePlayback=true;video.setAttribute('controlsList','nodownload nofullscreen noremoteplayback');video.tabIndex=-1;
      const retry=node('button','播放影片');retry.className='recovery';retry.hidden=true;retry.type='button';
      const errorReplay=node('button','影片無法播放，重新作答');errorReplay.className='recovery';errorReplay.type='button';errorReplay.hidden=true;
      errorReplay.onclick=()=>finish(options.onReplay);
      const play=()=>{retry.hidden=true;errorReplay.hidden=true;label.textContent='請看完影片，接著重新作答。';try{const p=video.play();p?.catch(()=>{if(closed)return;retry.hidden=false;label.textContent='請按「播放影片」開始，播放結束後重新作答。';retry.focus();});}catch(_){retry.hidden=false;retry.focus();}};
      retry.onclick=play;
      video.addEventListener('ended',()=>finish(options.onReplay));
      video.addEventListener('error',()=>{if(closed)return;label.textContent='影片載入失敗，請確認已完整解壓縮遊戲。';retry.hidden=false;retry.textContent='重試播放影片';errorReplay.hidden=false;retry.focus();});
      wrap.append(label,video,retry,errorReplay);dialog.append(wrap);
      shadow.append(style,dialog);doc.body.append(portal);dialog.showModal();dialog.tabIndex=-1;dialog.focus();play();
    }else{
      const talk=node('section');talk.className='talk';const title=node('h2',options.title),message=node('p',options.text),elder=node('img');
      message.className='message';message.setAttribute('role','status');elder.className='elder';elder.src=new URL('assets/cane-dialog-elder.png',base).href;elder.alt='長者提醒';
      const next=node('button','繼續');next.type='button';next.className='continue';next.onclick=()=>finish(options.onContinue);
      const note=node('p','可按繼續，或等待 5 秒自動關閉。');note.className='note';talk.append(title,message,next,note,elder);dialog.append(talk);shadow.append(style,dialog);doc.body.append(portal);dialog.showModal();next.focus();
      timer=root.setTimeout(()=>finish(options.onContinue),5000);
    }
    return true;
  }
  root.addEventListener('pagehide',()=>active?.cancel());
  root.VisionQuizFeedback=Object.freeze({show});
})(window);
