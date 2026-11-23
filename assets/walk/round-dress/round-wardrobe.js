/* Round elder: independent atlas, pose-specific scalp layers and fabric masks. */
const RoundWardrobe=(()=>{
 const directions=['down','up','left','right'];
 const colors={hair:['#dad4c6','#8b6b4c','#4b3b31','#b8b1a6','#6f7275'],outfit:['#d96f61','#3c6f91','#4d9c87','#a783bf','#d7a642']};
 const base=document.currentScript.src.replace(/[^/]+$/,'')+'assets/';
 const outfits=[],hairstyles=[],fabric=[],parts=[],anchors=[],cache=new Map(),bodyCache=new Map(),headCache=new Map();let pending;
 const make=(w=256,h=256)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
 async function load(name){const i=new Image();i.src=base+name;await i.decode();return i;}
 const pixels=c=>c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height);
 function tile(image,col,row,cols,rows,clean=false){
   const c=make(),x=c.getContext('2d');x.imageSmoothingEnabled=false;
   x.drawImage(image,col*image.width/cols,row*image.height/rows,image.width/cols,image.height/rows,0,0,256,256);
   if(clean){const d=pixels(c),p=d.data;for(let i=3;i<p.length;i+=4)p[i]=p[i]<128?0:255;
     // Keep the character component only, excluding detached generation specks.
     const seen=new Uint8Array(65536);let largest=[];
     for(let i=0;i<65536;i++)if(p[i*4+3]&&!seen[i]){const q=[i];seen[i]=1;for(let j=0;j<q.length;j++){
       const n=q[j];for(const t of [n%256?n-1:-1,n%256<255?n+1:-1,n-256,n+256])if(t>=0&&t<65536&&!seen[t]&&p[t*4+3]){seen[t]=1;q.push(t);}
     }if(q.length>largest.length)largest=q;}
     const keep=new Uint8Array(65536);for(const i of largest)keep[i]=1;for(let i=0;i<65536;i++)if(!keep[i])p[i*4+3]=0;x.putImageData(d,0,0);
   }return c;
 }
 function mirror(c){const o=make(),x=o.getContext('2d');x.save();x.translate(256,0);x.scale(-1,1);x.drawImage(c,0,0);x.restore();return o;}
 function atlas(image,rows,clean){const a=directions.slice(0,rows).map((d,r)=>Array.from({length:6},(_,k)=>tile(image,k,r,6,rows,clean)));if(rows===3)a.push(a[2].map(mirror));return a;}
 function bounds(c,limit=256){const p=pixels(c).data;let l=256,t=256,r=-1,b=-1;for(let y=0;y<limit;y++)for(let x=0;x<256;x++)if(p[(y*256+x)*4+3]>32){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}return {x:l,y:t,w:r-l+1,h:b-t+1};}
 function accessory(image,col,row){const c=make(),x=c.getContext('2d');const sw=image.width/4,sh=image.height/3,scale=256/Math.max(sw,sh);x.imageSmoothingEnabled=false;x.drawImage(image,col*sw,row*sh,sw,sh,0,0,sw*scale,sh*scale);const data=pixels(c);for(let j=3;j<data.data.length;j+=4)if(data.data[j]<128)data.data[j]=0;x.putImageData(data,0,0);const b=bounds(c),o=make(b.w,b.h);o.getContext('2d').drawImage(c,b.x,b.y,b.w,b.h,0,0,b.w,b.h);return o;}
 const gray=(r,g,b)=>Math.max(r,g,b)>42&&Math.max(r,g,b)-Math.min(r,g,b)<40;
 function hairRegion(r,x,y,dy){y-=dy;const u=r===3?255-x:x;
   if(r===0)return y<78||((x<105||x>150)&&y<96);
   if(r===1)return y<113;
   return y<75||(u>=130&&y<96)||(u>=151&&y<118);
 }
 function scalpWeight(r,x,y,dy){y-=dy;const u=r===3?255-x:x;
   const edge=r===0?(x<98||x>157?93:74):r===1?112:u>=151?116:u>=130?94:73;
   return Math.max(0,Math.min(1,(edge+2-y)/3));
 }
 function garmentMask(c,o,r,k,source){
   if(o===0)return Uint8Array.from(pixels(source).data.filter((_,i)=>i%4===3),(v,i)=>v&&i>=110*256&&i<181*256?1:0);
   const p=pixels(c).data,m=new Uint8Array(65536),face=new Uint8Array(65536);
   if(o===2&&r!==1){const queue=[];const warm=i=>p[i*4+3]>128&&p[i*4]>100&&p[i*4]>p[i*4+1]*1.2&&p[i*4+1]>p[i*4+2]*1.15;
     for(let y=80;y<129;y++)for(let u=r===0?120:99;u<(r===0?135:120);u++){const x=r===3?255-u:u,i=y*256+x;if(warm(i)){face[i]=1;queue.push(i);}}
     for(let j=0;j<queue.length;j++)for(const i of [queue[j]-1,queue[j]+1,queue[j]-256,queue[j]+256]){const x=i%256,y=Math.floor(i/256);if(x<80||x>176||y<75||y>134||face[i]||!warm(i))continue;face[i]=1;queue.push(i);}
     const core=face.slice();for(let y=76;y<135;y++)for(let x=82;x<174;x++)if(core[y*256+x])for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)face[(y+dy)*256+x+dx]=1;
   }
   for(let y=113;y<181;y++)for(let x=65;x<192;x++){
     const i=y*256+x,j=i*4,R=p[j],G=p[j+1],B=p[j+2],hi=Math.max(R,G,B),lo=Math.min(R,G,B),h=(G-B)/(hi-lo||1)/6;
     if(!p[j+3]||hi<32)continue;
     if(o===1){if(B>R*1.05&&B>G*1.02)m[i]=1;}
     else if(R>G*1.35&&R>B*1.2&&h<.04){
       // Below the jaw; the white shirt, brown vest and skin are separate pigments.
       const u=r===3?255-x:x;
       if(face[i])continue;
       if(r===1&&y<118)continue;
       if(r>=2&&y<118)continue;
       m[i]=1;
     }
   }return m;
 }
 function tint(c,color,mask,reference){if(!color)return c;const out=make(),x=out.getContext('2d');x.drawImage(c,0,0);const d=pixels(out),p=d.data,target=color.match(/\w\w/g).map(s=>parseInt(s,16));
   for(let i=0;i<65536;i++)if(mask[i]&&p[i*4+3]){const j=i*4,light=(p[j]*.2126+p[j+1]*.7152+p[j+2]*.0722)/reference;for(let n=0;n<3;n++)p[j+n]=Math.min(255,Math.round(target[n]*light));}x.putImageData(d,0,0);return out;
 }
 function repairWristSkin(c,repair){
   const x=c.getContext('2d'),data=pixels(c),p=data.data,q=pixels(repair).data,original=p.slice();
   const warm=(v,i)=>v[i+3]>128&&v[i]>v[i+1]*1.2&&v[i+1]>v[i+2]*1.12;
   for(let y=140;y<186;y++)for(let u=70;u<190;u++){
     const i=(y*256+u)*4;if(!warm(original,i)||!warm(q,i))continue;
     if(![-1,1,-256,256].every(n=>warm(original,i+n*4)))continue;
     const weight=[-2,2,-512,512].every(n=>warm(original,i+n*4))?1:.5;
     for(let ch=0;ch<3;ch++)p[i+ch]=Math.round(original[i+ch]*(1-weight)+q[i+ch]*weight);
   }x.putImageData(data,0,0);
 }
 async function init(){return pending??=(async()=>{
   const im=await Promise.all(['approved-casual.png','polo-candidate.png','formal-candidate.png','hair-side-part.png','hair-swept-back.png','casual-fabric-mask.png','accessories.png','polo-wrist-repair.png'].map(load));
   outfits.push(atlas(im[0],4,false),atlas(im[1],3,true),atlas(im[2],3,true));
   const repaired=atlas(im[7],3,true);for(let r=0;r<3;r++)for(let k=0;k<6;k++)repairWristSkin(outfits[1][r][k],repaired[r][k]);outfits[1][3]=outfits[1][2].map(mirror);
   hairstyles.push(atlas(im[3],3,true),atlas(im[4],3,true));const maskAtlas=atlas(im[5],4,false);
   // Registered using face/ear landmarks, not the new hairstyle's outer bounds.
   // Only the scalp is subsequently sampled; face and neck stay with their pose.
   const shifts=[
     [[[-1,0],[0,0],[-1,0],[-1,0],[0,0],[-1,0]],[[0,2],[0,4],[-1,2],[1,2],[2,1],[1,2]],[[0,6],[-1,6],[0,7],[-1,6],[0,6],[0,6]]],
     [[[-1,1],[-1,1],[-1,0],[-1,0],[-1,0],[-1,1]],[[-1,8],[-1,9],[0,8],[1,7],[0,7],[0,8]],[[0,13],[-1,13],[0,13],[0,13],[0,12],[0,13]]]
   ];
   for(let h=0;h<2;h++){for(let r=0;r<3;r++)for(let k=0;k<6;k++){const c=make(),[dx,dy]=shifts[h][r][k];c.getContext('2d').drawImage(hairstyles[h][r][k],dx,dy);hairstyles[h][r][k]=c;}hairstyles[h][3]=hairstyles[h][2].map(mirror);}
   for(let o=0;o<3;o++){
     anchors[o]=directions.map((d,r)=>outfits[o][r].map(c=>bounds(c,110)));
     fabric[o]=directions.map((d,r)=>outfits[o][r].map((c,k)=>garmentMask(c,o,r,k,maskAtlas[r][k])));
   }
   for(let a=0;a<3;a++)parts[a]=directions.map((d,r)=>accessory(im[6],r,a));
 })();}
 function normalize(s={}){const o={};for(const [key,n] of [['hair',3],['outfit',3],['accessory',4],['hairColor',5],['outfitColor',5]]){const v=Number(s[key]??0);o[key]=Number.isInteger(v)&&v>=0&&v<n?v:0;}return o;}
 function frame(direction,k,state){const s=normalize(state),r=directions.indexOf(direction);if(r<0||!Number.isInteger(k)||k<0||k>5)throw Error('Invalid animation frame');const key=[r,k,...Object.values(s)].join(':');if(cache.has(key))return cache.get(key);
   // A fitted cap compresses the covered hairstyle; use the approved under-cap hair.
   if(s.accessory===2)s.hair=0;
   const original=outfits[s.outfit][r][k],a=anchors[s.outfit][r][k],dy=a.y-[42,46,42,42][r];
   const bk=[s.outfit,s.outfitColor,r,k].join(':');if(!bodyCache.has(bk))bodyCache.set(bk,tint(original,s.outfitColor?colors.outfit[s.outfitColor]:null,fabric[s.outfit][r][k],[148,55,65][s.outfit]));
   const c=make(),x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(bodyCache.get(bk),0,0);
   const hk=[s.outfit,s.hair,s.hairColor,r,k].join(':');
   if(s.hair||s.hairColor){if(!headCache.has(hk)){
     const result=make(),hx=result.getContext('2d');hx.drawImage(original,0,0);const d=pixels(result),p=d.data;
     if(s.hair){const q=pixels(hairstyles[s.hair-1][r][k]).data;
       for(let y=0;y<122;y++)for(let u=65;u<192;u++){const w=scalpWeight(r,u,y,dy);if(!w)continue;const i=(y*256+u)*4;for(let ch=0;ch<4;ch++)p[i+ch]=Math.round(p[i+ch]*(1-w)+q[i+ch]*w);}
     }
     const mask=new Uint8Array(65536);for(let y=0;y<122;y++)for(let u=65;u<192;u++){const i=y*256+u,j=i*4;if(hairRegion(r,u,y,dy)&&gray(p[j],p[j+1],p[j+2]))mask[i]=1;}
     // Hair highlights and sideburns form connected regions; isolated eyebrows do not.
     if(r===0){const seen=new Uint8Array(65536),q=[];for(let y=0;y<78+dy;y++)for(let u=65;u<192;u++){const i=y*256+u;if(mask[i]){seen[i]=1;q.push(i);}}
       for(let j=0;j<q.length;j++)for(const i of [q[j]-1,q[j]+1,q[j]-256,q[j]+256])if(i>=0&&i<65536&&mask[i]&&!seen[i]){seen[i]=1;q.push(i);}mask.set(seen);
     }
     hx.putImageData(d,0,0);const colored=tint(result,s.hairColor?colors.hair[s.hairColor]:null,mask,155),data=pixels(colored);
     // Keep only scalp replacement/tint pixels; never reintroduce an old jacket.
     for(let y=0;y<256;y++)for(let u=0;u<256;u++)if(!(s.hair?scalpWeight(r,u,y,dy)>0:mask[y*256+u]))data.data[(y*256+u)*4+3]=0;
     colored.getContext('2d').putImageData(data,0,0);headCache.set(hk,colored);
   }
   if(s.hair){const data=pixels(c),p=data.data,q=pixels(headCache.get(hk)).data;for(let y=0;y<122;y++)for(let u=65;u<192;u++)if(scalpWeight(r,u,y,dy)>0){const i=(y*256+u)*4;for(let ch=0;ch<4;ch++)p[i+ch]=q[i+ch];}x.putImageData(data,0,0);}else x.drawImage(headCache.get(hk),0,0);
   }
   if(s.accessory){const part=parts[s.accessory-1][r];let w,h,px,py;
     const center=a.x+a.w/2;
     if(s.accessory===1){if(r===0){w=59;h=w*part.height/part.width;px=center-w/2;py=96+dy-h*.45;}
       else if(r===1){w=68;h=4;px=center-w/2;py=92+dy;}
       else{w=35;h=w*part.height/part.width;px=r===2?98:256-98-w;py=98+dy-h*.45;}  /* 2026-11-17 新增內容3-4:側面眼鏡對準眼睛(原 94/106 落在臉頰外) */
     }else if(s.accessory===2){w=r<2?89:85;h=w*part.height/part.width;px=center-w/2;py=78+dy-h;
       x.clearRect(0,0,256,Math.round(py+h*.68));
     }else{w=r===0?33:r===1?37:29;h=r===1?7:w*part.height/part.width;
       px=r<2?center-w/2:r===2?104:256-104-w;py=(r===0?126:r===1?113:127)+dy;
     }
     if(s.accessory===1&&r>=2){
       // Extend only the temple arm to the upper ear, without enlarging the lens.
       const split=part.width*.5,lens=18,temple=24;
       if(r===2){x.drawImage(part,0,0,split,part.height,Math.round(px),Math.round(py),lens,Math.round(h));x.drawImage(part,split,0,part.width-split,part.height,Math.round(px)+lens,Math.round(py),temple,Math.round(h));}
       else{const left=256-98-lens-temple;x.drawImage(part,0,0,split,part.height,left,Math.round(py),temple,Math.round(h));x.drawImage(part,split,0,part.width-split,part.height,left+temple,Math.round(py),lens,Math.round(h));}
     }else x.drawImage(part,Math.round(px),Math.round(py),Math.round(w),Math.round(h));
     if(s.accessory===3&&r>=2&&(k===2||k===3)){
       // Entire approaching forearm covers scarf tails, including its connected hand.
       const arm=[[140,139],[151,151],[120,174],[84,174],[80,156],[108,148]];
       x.save();x.beginPath();arm.forEach(([u,v],i)=>i?x.lineTo(r===3?256-u:u,v):x.moveTo(r===3?256-u:u,v));x.closePath();x.clip();x.drawImage(bodyCache.get(bk),0,0);x.restore();
       // Restore the upper shoulder sleeve where the scarf crosses the moving arm.
       if(r>=2){x.save();x.beginPath();const shoulder=[[132,96],[176,99],[195,122],[180,143],[151,124]];shoulder.forEach(([u,v],i)=>i?x.lineTo(r===3?256-u:u,v):x.moveTo(r===3?256-u:u,v));x.closePath();x.clip();x.drawImage(bodyCache.get(bk),0,0);x.restore();}
     }
   }
   cache.set(key,c);if(cache.size>120)cache.delete(cache.keys().next().value);return c;
 }
 return {init,normalize,directions,colors,combinationCount:900,frame,draw(ctx,d,k,s){ctx.imageSmoothingEnabled=false;ctx.drawImage(frame(d,k,s),0,0)}};
})();


/* 2026-11-17 第三修改計劃新增內容3-6:換衣服顏色時,原遮罩邊緣漏掉的同色布料(門襟、領口、肩線)補上色。
   做法:比對「換色前/後」找出已換色的布料,算出布料原本的色相,往外最多長 4 像素,只補色相相同、亮度不超過布料的像素(皮膚、頭髮、皮帶不會被染到)。 */
(function(W){if(!W||W.__tintFill)return;W.__tintFill=true;const raw=W.frame,cache=new Map();
 const hsl=(r,g,b)=>{const hi=Math.max(r,g,b),lo=Math.min(r,g,b),d=hi-lo;let h=0;if(d){h=hi===r?((g-b)/d)%6:hi===g?(b-r)/d+2:(r-g)/d+4;h=(h/6+1)%1;}return [h,hi?d/hi:0,r*.2126+g*.7152+b*.0722];};
 W.frame=function(d,k,s){s=s||{};const tinted=raw(d,k,s);if(!s.outfitColor)return tinted;const key=d+'|'+k+'|'+JSON.stringify(s);if(cache.has(key))return cache.get(key);
  const w=tinted.width,h=tinted.height,n=w*h,base=raw(d,k,Object.assign({},s,{outfitColor:0}));
  const t1=document.createElement('canvas');t1.width=w;t1.height=h;const tx=t1.getContext('2d',{willReadFrequently:true});tx.drawImage(base,0,0);const a=tx.getImageData(0,0,w,h).data;
  const out=document.createElement('canvas');out.width=w;out.height=h;const ox=out.getContext('2d',{willReadFrequently:true});ox.drawImage(tinted,0,0);const od=ox.getImageData(0,0,w,h),b=od.data;
  const m=new Uint8Array(n),lums=[],kc=[0,0,0];let sx=0,sy=0,ss=0,cnt=0;
  for(let i=0;i<n;i++){const j=i*4;if(a[j+3]<200)continue;if(Math.abs(a[j]-b[j])+Math.abs(a[j+1]-b[j+1])+Math.abs(a[j+2]-b[j+2])>6){const [hh,sat,l]=hsl(a[j],a[j+1],a[j+2]);m[i]=1;cnt++;sx+=Math.cos(hh*6.2832);sy+=Math.sin(hh*6.2832);ss+=sat;lums.push(l);for(let c=0;c<3;c++)kc[c]+=b[j+c]/Math.max(l,1);}}
  if(cnt<60){cache.set(key,tinted);return tinted;}
  const hem=new Int16Array(w).fill(-1);for(let i=0;i<n;i++)if(m[i])hem[i%w]=Math.max(hem[i%w],Math.floor(i/w));
  const mh=(Math.atan2(sy,sx)/6.2832+1)%1,ms=ss/cnt;lums.sort((p,q)=>p-q);const lmax=lums[Math.floor(cnt*.9)];for(let c=0;c<3;c++)kc[c]/=cnt;
  for(let pass=0;pass<12;pass++){const add=[];
   for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x,j=i*4;if(m[i]||a[j+3]<200||y>Math.max(hem[x-1],hem[x],hem[x+1])-2)continue;if(!(m[i-1]||m[i+1]||m[i-w]||m[i+w]))continue;
    const [hh,sat,l]=hsl(a[j],a[j+1],a[j+2]);let dh=Math.abs(hh-mh);dh=Math.min(dh,1-dh);const warm=mh>.03&&mh<.16;if(dh<(warm?.012:.03)&&sat>ms*.6&&l<=lmax&&l>20&&!(a[j]>=225&&hh<.072))add.push(i);}
   if(!add.length)break;for(const i of add){m[i]=1;const j=i*4,l=hsl(a[j],a[j+1],a[j+2])[2];for(let c=0;c<3;c++)b[j+c]=Math.min(255,Math.round(kc[c]*l));}}
  /* 金色皮帶扣、鈕扣等非布料的亮黃色,換色後還原 */
  for(let i=0;i<n;i++){if(!m[i])continue;const j=i*4,[hh,sat,l]=hsl(a[j],a[j+1],a[j+2]);let dh=Math.abs(hh-mh);dh=Math.min(dh,1-dh);if(hh>.105&&hh<.19&&sat>.45&&l>80&&dh>.025){b[j]=a[j];b[j+1]=a[j+1];b[j+2]=a[j+2];}}
  ox.putImageData(od,0,0);cache.set(key,out);if(cache.size>160)cache.delete(cache.keys().next().value);return out;};
 W.draw=function(ctx,d,k,s){ctx.imageSmoothingEnabled=false;ctx.drawImage(W.frame(d,k,s),0,0);};
})(typeof RoundWardrobe!=='undefined'?RoundWardrobe:null);
