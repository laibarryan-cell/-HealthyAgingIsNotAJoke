/* Shared renderer: each body keeps its own atlas, silhouette and anchors. */
window.CharacterRenderer=(()=>{
 const config={
  slim:{folder:'body01-slim',outfit:{x:112,y:166,w:140,h:170},hair:{x:121,y:48,w:122,h:91},hairY:{3:34},glasses:{x:140,y:106,w:84,h:36},hat:{x:118,y:27,w:128,h:67},scarf:{x:150,y:177,w:64,h:55}},
  round:{folder:'body02-round',outfit:{x:92,y:178,w:180,h:158},head:[[104,60],[260,60],[260,160],[242,176],[228,186],[212,195],[200,198],[200,207],[165,207],[165,199],[150,196],[133,186],[118,174],[104,160]],headY:-17,hair:{x:108,y:25,w:148,h:91},hairY:{1:37},glasses:{x:128,y:103,w:108,h:36},hat:{x:104,y:11,w:156,h:69},scarf:{x:145,y:194,w:74,h:48}},
  strong:{folder:'body03-strong',outfit:{x:72,y:169,w:220,h:167},head:[[112,45],[250,45],[255,133],[237,143],[233,154],[220,164],[206,174],[198,178],[198,185],[167,185],[167,179],[156,174],[144,164],[135,155],[132,143],[110,134]],headY:5,hair:{x:106,y:42,w:152,h:94},glasses:{x:126,y:101,w:112,h:37},hat:{x:104,y:18,w:156,h:70},scarf:{x:144,y:184,w:76,h:48},arms:[[[84,205],[127,205],[125,251],[117,275],[98,275],[85,253]],[[238,205],[280,205],[281,251],[266,275],[247,275],[239,244]]]}
 };
 const cache=new Map();
 function load(body){if(!cache.has(body))cache.set(body,new Promise((resolve,reject)=>{const image=new Image();image.dataset.body=body;image.onload=()=>resolve(image);image.onerror=()=>{cache.delete(body);reject(new Error('人物素材載入失敗'));};image.src=`/assets/art-production/characters/${config[body].folder}/atlas/paper-doll-atlas-v2.png`;}));return cache.get(body);}
 const tiles=new WeakMap();const heads=new WeakMap();function cleanHead(base,body){if(heads.has(base.c))return heads.get(base.c);const c=document.createElement('canvas');c.width=base.c.width;c.height=base.c.height;const x=c.getContext('2d');x.drawImage(base.c,0,0);const d=x.getImageData(0,0,c.width,c.height),p=d.data;for(let y=body==='round'?175:150;y<c.height;y++)for(let px=0;px<c.width;px++){const i=(y*c.width+px)*4;if(p[i+2]>p[i]&&p[i+1]>p[i])p[i+3]=0;}x.putImageData(d,0,0);const result={...base,c};heads.set(base.c,result);return result;}
 function extract(image,col,row){let entries=tiles.get(image);if(!entries){entries=new Map();tiles.set(image,entries);}const key=col+','+row;if(entries.has(key))return entries.get(key);const c=document.createElement('canvas');c.width=Math.round(image.naturalWidth/4);c.height=Math.round(image.naturalHeight/3);const ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;ctx.drawImage(image,col*image.naturalWidth/4,row*image.naturalHeight/3,image.naturalWidth/4,image.naturalHeight/3,0,0,c.width,c.height);const d=ctx.getImageData(0,0,c.width,c.height),p=d.data;let l=c.width,t=c.height,r=-1,b=-1;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4,R=p[i],G=p[i+1],B=p[i+2];if((G>35&&G-R>12&&G-B>12)||((x<3||x>c.width-4||y<3||y>c.height-4)&&R>210&&G>210&&B>210))p[i+3]=0;if(p[i+3]>8){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}}if(image.dataset.body==='slim'){/* 2026-11-18 沉穩長者:綠幕去背後外緣殘留暗綠邊,貼著透明區的偏綠像素去掉(2 圈) */const W=c.width,H=c.height;for(let pass=0;pass<2;pass++){const kill=[];for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=(y*W+x)*4;if(p[i+3]<9)continue;if(!(p[i-1]<9||p[i+7]<9||p[i-W*4+3]<9||p[i+W*4+3]<9))continue;const R=p[i],G=p[i+1],B=p[i+2];if(G>R+4&&G>B+4)kill.push(i+3);}if(!kill.length)break;for(const k of kill)p[k]=0;}}ctx.putImageData(d,0,0);const result={c,l,t,w:r-l+1,h:b-t+1,row,col,body:image.dataset.body};entries.set(key,result);return result;}

 // Tint the fabric by its original pigment, including cuffs, pockets and hems.
 // The shirt, vest, skin, belt, trousers, shoes and ink outlines keep their colors.
 function fabricPixel(t,r,g,b,x,y){
  const hi=Math.max(r,g,b),lo=Math.min(r,g,b),delta=hi-lo;
  if(hi<44||delta<8)return false;
  let hue=hi===r?((g-b)/delta)%6:hi===g?(b-r)/delta+2:(r-g)/delta+4;
  hue=(hue/6+1)%1;const saturation=delta/hi;
  if(t.col===0){
   if(y>=214)return false;
   if(t.body==='slim'&&x>=165&&x<=200&&y>=162&&y<=183)return false;
   if(t.body==='strong'&&x>=157&&x<=208&&y>=170&&y<=190)return false;
   if(t.body==='round'){
    const innerWidth=y<100?25:Math.max(0,(140-y)*.55);
    if(y<140&&Math.abs(x-180)<innerWidth)return false;
   }
   if(t.body==='round'&&(y>213||(y>=190&&(x<112||x>244))))return false;
   return hue>=.035&&hue<=.16&&saturation>.14;
  }
  if(t.col===1){
   const waist={slim:174,round:191,strong:179}[t.body];
   return y<waist&&hue>=.49&&hue<=.79&&saturation>.09;
  }
  return y<223&&(hue<.045||hue>.94)&&saturation>.22;
 }
 function part(ctx,t,fit,color){
  let src=t.c;
  if(color){
   src=document.createElement('canvas');src.width=t.c.width;src.height=t.c.height;
   const paint=src.getContext('2d');paint.drawImage(t.c,0,0);
   const data=paint.getImageData(0,0,src.width,src.height),p=data.data;
   const rgb=color.match(/\w\w/g).map(v=>parseInt(v,16));
   for(let i=0;i<p.length;i+=4){
    const r=p[i],g=p[i+1],b=p[i+2],x=(i/4)%src.width,y=Math.floor(i/4/src.width);
    const mask=t.row===0?Math.max(r,g,b)>48:fabricPixel(t,r,g,b,x,y);
    if(p[i+3]&&mask){const shade=(r+g+b)/3/(t.row===0?170:t.col===0?150:t.col===1?75:100);for(let c=0;c<3;c++)p[i+c]=Math.min(255,rgb[c]*shade);}
   }
   paint.putImageData(data,0,0);
  }
  if(fit)ctx.drawImage(src,t.l,t.t,t.w,t.h,fit.x,fit.y,fit.w,fit.h);else ctx.drawImage(src,0,0);
 }
 // Real neck pixels from the same body's atlas bridge the open collar beneath it.
 // Draw underneath clothes and the jaw: neither the collar nor the face is erased.
 function drawNeck(ctx,base,body,outfit){
  const necks={
   round:[{x:148,y:171,w:68,h:45},{x:148,y:171,w:68,h:48},{x:148,y:171,w:68,h:47}],
   strong:[{x:148,y:165,w:68,h:44},{x:148,y:165,w:68,h:47},{x:148,y:165,w:68,h:46}]
  };
  const fit=necks[body]?.[outfit];if(!fit)return;
  const sample=body==='round'?{x:172,y:201,w:18,h:3}:{x:174,y:171,w:17,h:3};
  ctx.drawImage(base.c,sample.x,sample.y,sample.w,sample.h,fit.x,fit.y,fit.w,fit.h);
 }
 function polygon(ctx,points,draw){ctx.save();ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();draw();ctx.restore();}
 async function render(canvas,state){const body=state.body||'slim',a=config[body],ticket=(canvas._renderTicket||0)+1;canvas._renderTicket=ticket;const image=await load(body);if(canvas._renderTicket!==ticket)return;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;const base=extract(image,0,0);if(state.outfit===undefined||body==='slim')part(ctx,base);if(state.outfit!==undefined){if(body==='slim'){ctx.clearRect(0,169,152,27);ctx.clearRect(213,169,151,27);}drawNeck(ctx,base,body,state.outfit);if(a.arms)for(const arm of a.arms){ctx.save();ctx.translate(0,8);polygon(ctx,arm,()=>part(ctx,base));ctx.restore();}part(ctx,extract(image,state.outfit,1),a.outfit,state.outfitTint);if(a.head){ctx.save();ctx.translate(0,a.headY);polygon(ctx,a.head,()=>part(ctx,cleanHead(base,body)));ctx.restore();}}part(ctx,extract(image,state.hair??1,0),{...a.hair,y:(a.hairY?.[state.hair??1]??a.hair.y)+(state.outfit===undefined?(body==='round'?17:body==='strong'?-5:0):0)},state.hairTint);if(state.acc&&state.acc!=='none')part(ctx,extract(image,{glasses:0,hat:1,scarf:2}[state.acc],2),a[state.acc]);}
 return {render,config};
})();
