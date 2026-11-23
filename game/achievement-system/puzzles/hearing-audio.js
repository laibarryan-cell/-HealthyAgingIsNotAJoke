(function(root){'use strict';
 const base=new URL('assets/hearing/',document.currentScript.src);
 const tracks={road:'background-road',playground:'background-playground',plaza:'background-plaza',shade:'background-shade',home:'background-tv'};
 // Separate local media elements also work on file:// without WebAudio CORS tainting.
 function create({onStatus=()=>{},onError=()=>{}}={}){
   let muted=false,assisted=false,place='home',running=false,epoch=0,disposed=false;
   const all=new Set(),ramps=new Map(),waiters=new Set();
   const make=(name,loop=false)=>{const a=new root.Audio(new URL(name+'.wav',base).href);a.preload='auto';a.loop=loop;a.volume=0;all.add(a);return a;};
   const voice=make('family-dialogue',true),backs=Object.fromEntries(Object.entries(tracks).map(([id,name])=>[id,make(name,true)]));
   const click=make('mechanical-click'),cue=make('unlock-cue'),password=make('password-42');
   function ramp(a,target){clearInterval(ramps.get(a));const from=a.volume;let n=0;const timer=setInterval(()=>{a.volume=muted?0:Math.max(0,Math.min(1,from+(target-from)*Math.min(++n/10,1)));if(n>=10){clearInterval(timer);ramps.delete(a);if(target===0&&a!==voice)a.pause();}},30);ramps.set(a,timer);}
   async function play(a){try{await a.play();return !disposed;}catch(e){onError('音檔未能播放。請按「重播情境」重試，或使用字幕。');return false;}}
   function levels(){ramp(voice,running?(assisted?.43:.38):0);for(const [id,a] of Object.entries(backs))ramp(a,running&&id===place?(id==='shade'?.045:assisted?.065:.18):0);}
   function startMix(){if(disposed)return Promise.resolve(false);running=true;const jobs=[play(voice),play(backs[place])];levels();onStatus('mix');return Promise.all(jobs).then(xs=>xs.every(Boolean));}
   function environment(id){if(!tracks[id])return;place=id;if(running){play(backs[id]);levels();}}
   function assistance(value){assisted=!!value;if(running)levels();}
   function setMuted(value){muted=!!value;for(const a of all)a.muted=muted;levels();}
   function stop(){epoch++;running=false;for(const t of ramps.values())clearInterval(t);ramps.clear();for(const a of all){a.pause();a.currentTime=0;a.volume=0;}for(const end of [...waiters])end(false);onStatus('stopped');}
   function once(a,volume){return new Promise(resolve=>{let done=false;let timeout;const end=value=>{if(done)return;done=true;clearTimeout(timeout);waiters.delete(end);a.removeEventListener('ended',ended);a.removeEventListener('error',failed);resolve(value);};const ended=()=>end(true),failed=()=>{onError('語音音檔未能載入，請使用「顯示文字」。');end(false);};waiters.add(end);a.addEventListener('ended',ended);a.addEventListener('error',failed);a.currentTime=0;a.muted=muted;timeout=setTimeout(failed,25000);play(a).then(ok=>{if(!ok)end(false);});ramp(a,volume);});}
   async function playPassword(){stop();const run=epoch;onStatus('password');if(!await once(cue,.2)||disposed||run!==epoch)return false;const success=await once(password,.48);if(success&&run===epoch)onStatus('ended');return success&&run===epoch;}
   function mechanical(){if(disposed||muted)return;click.currentTime=0;click.volume=.12;play(click);}
   function destroy(){stop();disposed=true;for(const a of all){a.removeAttribute('src');a.load();}all.clear();}
   return {startMix,environment,assistance,setMuted,stop,playPassword,mechanical,destroy,get muted(){return muted;},get running(){return running;}};
 }
 root.HearingPuzzleAudio={create,tracks};
})(window);
