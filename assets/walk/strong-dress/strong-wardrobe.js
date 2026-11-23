/* Strong-only baseline. Never substitute another body or an unfinished outfit. */
const StrongWardrobe=(()=>{
 const directions=['down','up','left','right'];
 const base=new URL('assets/',document.currentScript.src).href;
 const limits={hair:3,hairColor:5,outfit:3,outfitColor:5,accessory:4};
 let pending,manifest;const frames=new Map();const images=new Map(),tiles=new Map(),parts=[],backTemples=[];
 const make=(w=256,h=256)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
 const hairColors=['','#8b6b4c','#4b3b31','#b8b1a6','#6f7275'],outfitColors=['','#3c6f91','#4d9c87','#a783bf','#d7a642'];
 // Neck anchors are measured on each outfit/pose, independently of hair bounds.
 const scarfFrontY=[[109,107,106,106,107,106],[110,108,108,109,109,109],[108,107,107,107,107,107]];
 const scarfSideY=[[101,100,101,99,98,100],[103,101,102,101,99,101],[100,100,100,99,98,98]];
 function normalize(s={}){return Object.fromEntries(Object.entries(limits).map(([key,n])=>{const v=Number(s[key]??0);return [key,Number.isInteger(v)&&v>=0&&v<n?v:0]}));}
 async function init(){
  if(!pending)pending=(async()=>{
   const response=await fetch(new URL('manifest.json',base));
   if(!response.ok)throw Error('素材清單 HTTP '+response.status);
   const data=await response.json();
   if(data.body!=='strong'||data.version!==1)throw Error('不是健壯型素材清單');
   await Promise.all(data.files.map(async name=>{
    const image=new Image();image.src=new URL(name,base).href;await image.decode();
    if(name!=='accessories.png'&&(image.width!==1536||image.height!==1024))throw Error(name+' 必須是 1536×1024 四向六格');
    images.set(name,image);
   }));
   if(data.accessories){const im=images.get('accessories.png');for(let a=0;a<3;a++){parts[a]=[];for(let r=0;r<3;r++){
    const c=make(im.width/4,im.height/3),x=c.getContext('2d');x.drawImage(im,r*im.width/4,a*im.height/3,im.width/4,im.height/3,0,0,c.width,c.height);
    const d=x.getImageData(0,0,c.width,c.height);let l=c.width,t=c.height,right=0,b=0;
    for(let y=0;y<c.height;y++)for(let u=0;u<c.width;u++){const i=(y*c.width+u)*4;if(d.data[i+3]<128)d.data.fill(0,i,i+4);else{d.data[i+3]=255;l=Math.min(l,u);right=Math.max(right,u);t=Math.min(t,y);b=Math.max(b,y)}}x.putImageData(d,0,0);
    const cut=make(right-l+1,b-t+1);cut.getContext('2d').drawImage(c,l,t,cut.width,cut.height,0,0,cut.width,cut.height);parts[a][r]=cut;
   }}
   const src=parts[0][1];for(let side=0;side<2;side++){
    const half=make(Math.floor(src.width/2),src.height),hx=half.getContext('2d');hx.drawImage(src,side*Math.floor(src.width/2),0,half.width,half.height,0,0,half.width,half.height);
    const p=hx.getImageData(0,0,half.width,half.height).data;let l=half.width,t=half.height,r=0,b=0;for(let y=0;y<half.height;y++)for(let u=0;u<half.width;u++)if(p[(y*half.width+u)*4+3]){l=Math.min(l,u);r=Math.max(r,u);t=Math.min(t,y);b=Math.max(b,y)}
    const cut=make(r-l+1,b-t+1);cut.getContext('2d').drawImage(half,l,t,cut.width,cut.height,0,0,cut.width,cut.height);backTemples[side]=cut;
   }}manifest=data;
  })().catch(e=>{pending=null;throw e});
  return pending;
 }
 function reasons(state){
  if(!manifest)return ['素材尚未載入'];
  const s=normalize(state),result=[];
  if(!manifest.baseLooks[s.outfit]?.[s.hair])result.push('此服裝／髮型基礎素材尚未完成');
  if((s.hairColor||s.outfitColor)&&!manifest.colorMasks)result.push('換色遮罩尚未完成');
  if(s.accessory&&!manifest.accessories)result.push('配件定位與遮擋尚未完成');
  return result;
 }
 function compose(direction,k,state={}){
  const row=directions.indexOf(direction);
  if(row<0||!Number.isInteger(k)||k<0||k>5)throw RangeError('無效方向或圖格');
  const s=normalize(state),missing=reasons(s);
  if(missing.length)throw Error(missing.join('；'));
  if(row===3&&s.accessory){const left=frame('left',k,s),c=make(),x=c.getContext('2d');x.save();x.translate(256,0);x.scale(-1,1);x.drawImage(left,0,0);x.restore();return c;}
  if(s.accessory===2)s.hair=0;
  const image=images.get(manifest.baseLooks[s.outfit][s.hair]);
  const c=Object.assign(document.createElement('canvas'),{width:256,height:256}),ctx=c.getContext('2d');
  ctx.imageSmoothingEnabled=false;ctx.drawImage(image,k*256,row*256,256,256,0,0,256,256);
  if(s.hairColor||s.outfitColor){
   const d=ctx.getImageData(0,0,256,256),p=d.data;
   for(const type of ['hair','outfit']){const index=s[type+'Color'];if(!index)continue;
    const name=manifest.colorMasks[s.outfit][s.hair][type],key=name+':'+row+':'+k;
    if(!tiles.has(key)){const m=Object.assign(document.createElement('canvas'),{width:256,height:256}),mx=m.getContext('2d');mx.drawImage(images.get(name),k*256,row*256,256,256,0,0,256,256);const a=mx.getImageData(0,0,256,256).data,indices=[];for(let i=0;i<a.length;i+=4)if(a[i+3])indices.push(i);tiles.set(key,indices);}
    const rgb=(type==='hair'?hairColors:outfitColors)[index].slice(1).match(/../g).map(v=>parseInt(v,16)),reference=type==='hair'?150:[150,45,65][s.outfit];
    for(const i of tiles.get(key)){const light=(p[i]*.2126+p[i+1]*.7152+p[i+2]*.0722)/reference;for(let ch=0;ch<3;ch++)p[i+ch]=Math.min(255,Math.round(rgb[ch]*light));}
   }ctx.putImageData(d,0,0);
  }
  if(s.accessory){
   const before=make();before.getContext('2d').drawImage(c,0,0);
   const anchor=make(),ax=anchor.getContext('2d');ax.drawImage(images.get(manifest.baseLooks[s.outfit][0]),k*256,row*256,256,256,0,0,256,256);const p=ax.getImageData(0,0,256,256).data;let top=0;outer:for(let y=0;y<100;y++)for(let u=60;u<200;u++)if(p[(y*256+u)*4+3]>128){top=y;break outer}const dy=top-[16,20,25][row];
   if(s.accessory===1){
    if(row!==1){const v=row===0?[88,57,80,29]:[94,65,54,24];ctx.drawImage(parts[0][row],v[0],v[1]+dy,v[2],v[3]);}
    else {
     const earBase=make(),ex=earBase.getContext('2d');ex.drawImage(image,k*256,row*256,256,256,0,0,256,256);const skin=ex.getImageData(0,0,256,256).data;
     const warm=i=>skin[i+3]>128&&skin[i]>150&&skin[i]>skin[i+1]*1.3&&skin[i+1]>skin[i+2]*1.15;
     const layer=make(),lx=layer.getContext('2d');lx.imageSmoothingEnabled=false;
     for(let side=0;side<2;side++){
      let top=100,left=256,right=0;for(let y=65;y<91;y++)for(let u=side?153:78;u<(side?179:103);u++)if(warm((y*256+u)*4)){top=Math.min(top,y);left=Math.min(left,u);right=Math.max(right,u)}
      if(top<100)lx.drawImage(backTemples[side],side?right-4:left+1,top,4,8);
     }
     // Hair is foreground. Only the temple resting on the visible upper ear is exposed.
     const ld=lx.getImageData(0,0,256,256);for(let i=0;i<ld.data.length;i+=4)if(!warm(i))ld.data[i+3]=0;lx.putImageData(ld,0,0);ctx.drawImage(layer,0,0);
    }
   }
   if(s.accessory===2){
    const d=ctx.getImageData(0,0,256,256);for(let y=0;y<58+dy;y++)for(let u=55;u<201;u++){const i=(y*256+u)*4;d.data.fill(0,i,i+4)}ctx.putImageData(d,0,0);
    const v=[[73,5,110,62],[74,6,108,72],[77,9,103,65]][row];const hatY=Math.max(2,v[1]+dy);ctx.drawImage(parts[1][row],v[0],hatY,v[2],v[3]+v[1]+dy-hatY);
   }
   if(s.accessory===3){
    const oy=row===0?scarfFrontY[s.outfit][k]-scarfFrontY[0][k]+4:row===2?scarfSideY[s.outfit][k]-scarfSideY[0][k]+1:dy+2;
    const scarf=make(),sc=scarf.getContext('2d');sc.imageSmoothingEnabled=false;sc.drawImage(images.get('scarf-tailored.png'),k*256,row*256,256,256,0,oy,256,256);
    ctx.drawImage(scarf,0,0);
    if(row===2){
     // Actual foreground sleeve/forearm mask for this outfit and pose; restore existing arm pixels, never erase the scarf or draw a second hand.
     const mask=images.get('scarf-foreground-'+s.outfit+'.png');
     if(mask){const arm=make(),ac=arm.getContext('2d');ac.drawImage(before,0,0);ac.globalCompositeOperation='destination-in';ac.drawImage(mask,k*256,row*256,256,256,0,0,256,256);ac.globalCompositeOperation='source-over';ctx.drawImage(arm,0,0);}
     // Restore the shoulder sleeve edge as well as the moving forearm.
     const shoulder=make(),sh=shoulder.getContext('2d');sh.drawImage(before,0,0);sh.globalCompositeOperation='destination-in';sh.beginPath();sh.moveTo(132,96);sh.lineTo(176,99);sh.lineTo(195,122);sh.lineTo(180,143);sh.lineTo(151,124);sh.closePath();sh.fill();sh.globalCompositeOperation='source-over';ctx.drawImage(shoulder,0,0);
    }
   }
  }return c;
 }
 function frame(direction,k,state={}){const s=normalize(state),key=[direction,k,...Object.values(s)].join(':');if(frames.has(key))return frames.get(key);const c=compose(direction,k,s);frames.set(key,c);if(frames.size>96)frames.delete(frames.keys().next().value);return c;}
 return {init,normalize,directions,reasons,frame,draw:(ctx,d,k,s)=>ctx.drawImage(frame(d,k,s),0,0)};
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
})(typeof StrongWardrobe!=='undefined'?StrongWardrobe:null);
