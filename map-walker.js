/* Keep the approved full-frame art intact; only map movement chooses a frame. */
const MapWalker=(()=>{
  let look=SlimWardrobe.normalize();
  const players=[{init:()=>SlimWardrobe.init(),draw:(ctx,d,k)=>SlimWardrobe.draw(ctx,d,k,look)},{init:()=>RoundWardrobe.init(),draw:(ctx,d,k)=>RoundWardrobe.draw(ctx,d,k,look)},{init:()=>StrongWardrobe.init(),draw:(ctx,d,k)=>StrongWardrobe.draw(ctx,d,k,look)}];
  const ready=players.map(p=>p.init().then(()=>true).catch(error=>{console.error('Walk animation could not load',error);return false}));
  const host=document.getElementById('cursor-character'),canvas=document.getElementById('map-walker'),ctx=canvas.getContext('2d');
  const screen=document.getElementById('screen-map');
  let body=0,active=false,loaded=false,x=0,y=0,tx=0,ty=0,dir='down',frame=0,phase=0,last=0,raf=0;
  function paint(){
    if(!loaded)return;
    ctx.clearRect(0,0,256,256);
    try{players[body].draw(ctx,dir,frame)}catch(error){console.error('Walk frame draw failed',error);return;}
    host.dataset.body=['slim','round','strong'][body];host.dataset.direction=dir;host.dataset.frame=frame;
  }
  /* F8(2026-11-18 晚)腳步落地時揚起一點塵土(留在原地慢慢散開);減少動態時不顯示 */
  function dust(){
    if(document.documentElement.classList.contains('mm-reduce')||!host.offsetParent)return;
    const r=host.getBoundingClientRect(),p=host.offsetParent.getBoundingClientRect();if(!r.width)return;
    const d=document.createElement('i');d.className='mw-dust';d.style.left=(r.left-p.left+r.width*(.42+Math.random()*.16))+'px';d.style.top=(r.bottom-p.top-r.height*.07)+'px';
    host.offsetParent.appendChild(d);setTimeout(()=>d.remove(),650);
  }
  function place(){host.style.left=x+'px';host.style.top=y+'px';}
  function stop(){cancelAnimationFrame(raf);raf=0;last=0;phase=0;if(host.dataset.walking==='true'){host.classList.remove('settle');void host.offsetWidth;host.classList.add('settle')}host.dataset.walking='false';place();}
  function tick(time){raf=0;if(!active||!loaded||document.hidden)return;
    const dt=last?Math.min((time-last)/1000,.05):0;last=time;
    const dx=tx-x,dy=ty-y,dist=Math.hypot(dx,dy);
    if(dist>.5){const next=Math.abs(dx)>=Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
      if(dir!==next){dir=next;frame=0;phase=0;host.classList.remove('turn');void host.offsetWidth;host.classList.add('turn')}
      const step=Math.min(dist,260*dt);x+=dx/dist*step;y+=dy/dist*step;
      phase+=step/15;while(phase>=1){frame=(frame+1)%6;phase--;if(frame===0||frame===3)dust();}
      host.dataset.walking='true';place();paint();raf=requestAnimationFrame(tick);
    }else{ x=tx;y=ty;place();stop(); }
  }
  function wake(){if(active&&loaded&&!raf&&!document.hidden)raf=requestAnimationFrame(tick);}
  function target(clientX,clientY){const r=screen.getBoundingClientRect();tx=Math.max(r.left+64,Math.min(r.right-64,clientX));ty=Math.max(r.top+130,Math.min(r.bottom-8,clientY));wake();}
  /* BUG-004: window resize / fullscreen toggle -> keep the walker and its target inside the new screen (scaled by the same proportion) */
  let lw=0,lh=0;
  function remember(){const r=screen.getBoundingClientRect();lw=r.width;lh=r.height}
  function refit(){if(!active)return;const r=screen.getBoundingClientRect();if(!r.width||!r.height)return;
    if(lw&&lh){const fx=r.width/lw,fy=r.height/lh;[x,tx]=[x,tx].map(v=>r.left+(v-r.left)*fx);[y,ty]=[y,ty].map(v=>r.top+(v-r.top)*fy)}
    x=Math.max(r.left+64,Math.min(r.right-64,x));tx=Math.max(r.left+64,Math.min(r.right-64,tx));
    y=Math.max(r.top+130,Math.min(r.bottom-8,y));ty=Math.max(r.top+130,Math.min(r.bottom-8,ty));
    lw=r.width;lh=r.height;place();wake()}
  window.addEventListener('resize',refit);
  screen.addEventListener('pointermove',e=>target(e.clientX,e.clientY));
  screen.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')target(e.clientX,e.clientY);if(active){host.classList.remove('hop');void host.offsetWidth;host.classList.add('hop')}});
  document.addEventListener('visibilitychange',()=>document.hidden?stop():wake());
  /* ---- character-creation preview: plays the full walk cycle (4 directions x 6 frames) with the chosen look ---- */
  const wardrobes=[SlimWardrobe,RoundWardrobe,StrongWardrobe],DIRS=['down','left','up','right'],DIR_LABEL={down:'正面',left:'向左',up:'背面',right:'向右'};
  function createPreview(cv,{frameMs=90,loopsPerDirection=2,onFrame}={}){
    const c=cv.getContext('2d');let b=0,lk=look,di=0,fr=0,loop=0,timer=0,running=false,seq=0,ok=false;
    function paint(){if(!ok)return;c.clearRect(0,0,256,256);try{wardrobes[b].draw(c,DIRS[di],fr,lk)}catch(e){console.error('preview frame failed',e)}
      cv.dataset.body=['slim','round','strong'][b];cv.dataset.direction=DIRS[di];cv.dataset.frame=fr;if(onFrame)onFrame({body:b,direction:DIRS[di],label:DIR_LABEL[DIRS[di]],frame:fr,total:6})}
    function step(){timer=0;if(!running)return;if(document.hidden){timer=setTimeout(step,250);return}fr=(fr+1)%6;if(fr===0){loop++;if(loop>=loopsPerDirection){loop=0;di=(di+1)%DIRS.length}}paint();timer=setTimeout(step,frameMs)}
    return {
      async setLook(index,appearance={}){const mine=++seq;b=index;lk=SlimWardrobe.normalize(appearance);ok=false;ok=await ready[index];if(mine!==seq)return;paint();if(running&&!timer)timer=setTimeout(step,frameMs)},
      start(){if(running)return;running=true;if(ok&&!timer)timer=setTimeout(step,frameMs)},
      stop(){running=false;clearTimeout(timer);timer=0},
      isRunning:()=>running,
      pose:()=>({body:b,direction:DIRS[di],frame:fr})
    };
  }
  /* self-check used by the QA page / console: every body x direction x frame must draw something and keep the feet inside the 256 canvas */
  async function verifyFrames(){
    const results=[],c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d',{willReadFrequently:true});
    for(let bi=0;bi<3;bi++){await ready[bi];for(const d of DIRS)for(let k=0;k<6;k++){x.clearRect(0,0,256,256);let err=null;try{wardrobes[bi].draw(x,d,k,look)}catch(e){err=String(e)}
      const p=x.getImageData(0,0,256,256).data;let minY=256,maxY=-1,minX=256,maxX=-1,n=0;for(let i=3;i<p.length;i+=4)if(p[i]>16){n++;const q=(i-3)/4,yy=q>>8,xx=q&255;if(yy<minY)minY=yy;if(yy>maxY)maxY=yy;if(xx<minX)minX=xx;if(xx>maxX)maxX=xx}
      results.push({body:['slim','round','strong'][bi],direction:d,frame:k,pixels:n,bounds:[minX,minY,maxX,maxY],error:err})}}
    const empty=results.filter(r=>r.error||r.pixels<500),clipped=results.filter(r=>r.bounds[0]<0||r.bounds[2]>255||r.bounds[3]>=255||r.bounds[1]<=0);
    return {total:results.length,expected:72,empty:empty.length,clipped:clipped.length,feetY:[Math.min(...results.map(r=>r.bounds[3])),Math.max(...results.map(r=>r.bounds[3]))],results};
  }
  return {
    createPreview,verifyFrames,
    /* 2026-11-18 片尾用:畫指定體型、造型、方向、第幾格的行走圖(不影響地圖上的角色) */
    async drawPose(cv,index,appearance,dir,k){const ok=await ready[index];if(!ok)return false;const c=cv.getContext('2d');c.clearRect(0,0,256,256);wardrobes[index].draw(c,dir,k,SlimWardrobe.normalize(appearance||{}));return true},
    async select(index,appearance={}){look=SlimWardrobe.normalize(appearance);host.dataset.look=JSON.stringify(look);body=index;loaded=false;stop();dir='down';frame=0;ctx.clearRect(0,0,256,256);const selected=index;const ok=await ready[index];if(body!==selected)return;loaded=ok;if(loaded)paint();if(active){host.classList.toggle('visible',loaded);host.style.display=loaded?'block':'none';wake();}},
    setActive(value){active=value;stop();host.classList.toggle('visible',active&&loaded);host.style.display=active&&loaded?'block':'none';if(active){const r=screen.getBoundingClientRect();x=tx=r.left+r.width/2;y=ty=r.bottom-35;dir='down';frame=0;place();remember();if(loaded)paint();wake();}}
  };
})();

