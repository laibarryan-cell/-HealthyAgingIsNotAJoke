/* Layered slim avatar: intact walking outfits + registered head/accessory layers. */
const SlimWardrobe=(()=>{
 const directions=['down','up','left','right'];
 const colors={hair:['#dad4c6','#8b6b4c','#4b3b31','#b8b1a6','#6f7275'],outfit:['#d96f61','#3c6f91','#4d9c87','#a783bf','#d7a642']};
 const base=document.currentScript.src.replace(/[^/]+$/,'')+'assets/';
 const outfits=[],heads=[],accessories=[],anchors=[],skin=[],frontSkin=[],cache=new Map(),tintedOutfits=new Map(),tintedHeads=new Map();let pending;
 const make=(w=256,h=256)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
 async function load(name){const i=new Image();i.src=base+name;await i.decode();return i;}
 function tile(image,col,row,cols,rows){const c=make(Math.round(image.width/cols),Math.round(image.height/rows)),x=c.getContext('2d',{willReadFrequently:true});x.drawImage(image,col*image.width/cols,row*image.height/rows,image.width/cols,image.height/rows,0,0,c.width,c.height);const d=x.getImageData(0,0,c.width,c.height);for(let j=3;j<d.data.length;j+=4)if(d.data[j]<32)d.data[j]=0;defringe(d);x.putImageData(d,0,0);return c;}
 /* 2026-11-18 沉穩長者去背補強:原圖外緣殘留淡灰白光暈與洋紅色邊(approved-casual、polo-v2),把貼著透明區的這類像素去掉(最多 2 圈) */
 function defringe(d){const p=d.data,W=d.width,H=d.height;for(let pass=0;pass<2;pass++){const kill=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;if(p[i+3]<32)continue;const edge=x===0||y===0||x===W-1||y===H-1||p[i-1]<32||p[i+7]<32||p[i-W*4+3]<32||p[i+W*4+3]<32;if(!edge)continue;const r=p[i],g=p[i+1],b=p[i+2],lo=Math.min(r,g,b),hi=Math.max(r,g,b);if((lo>=150&&hi-lo<=45)||(lo>=90&&hi-lo<=20)||(r>g+35&&b>g+25))kill.push(i+3);}if(!kill.length)break;for(const k of kill)p[k]=0;}}
 function bounds(c,limit=c.height){const p=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height).data;let l=c.width,t=c.height,r=-1,b=-1;for(let y=0;y<limit;y++)for(let x=0;x<c.width;x++)if(p[(y*c.width+x)*4+3]>32){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}return {x:l,y:t,w:r-l+1,h:b-t+1};}
 function crop(c){const b=bounds(c),o=make(b.w,b.h);o.getContext('2d',{willReadFrequently:true}).drawImage(c,b.x,b.y,b.w,b.h,0,0,b.w,b.h);return o;}
 function rgb(hex){return hex.match(/\w\w/g).map(v=>parseInt(v,16));}
 function tint(c,color,test,reference){if(!color)return c;const o=make(c.width,c.height),x=o.getContext('2d',{willReadFrequently:true});x.drawImage(c,0,0);const d=x.getImageData(0,0,o.width,o.height),p=d.data,target=rgb(color);for(let j=0;j<p.length;j+=4){if(!p[j+3])continue;const r=p[j],g=p[j+1],b=p[j+2],px=j/4%o.width,py=Math.floor(j/4/o.width);if(test(r,g,b,px,py)){const light=(r*.2126+g*.7152+b*.0722)/reference;for(let k=0;k<3;k++)p[j+k]=Math.min(255,target[k]*light)}}x.putImageData(d,0,0);return o;}
 const gray=(r,g,b)=>Math.max(r,g,b)>42&&Math.max(r,g,b)-Math.min(r,g,b)<38;
 // Face/neck exclusions are anatomical regions, independent of jacket pigment.
 // In particular tan fabric and the shaded jaw share many RGB values.
 function headOrNeck(dir,x,y){
   if(dir==='down')return y<99||(y<106&&x>103&&x<154)||(y<117&&x>116&&x<141);
   if(dir==='up')return y<84||(y<90&&x>103&&x<154);
   const u=dir==='right'?255-x:x;
   return y<82||(y<98&&u<124)||(y<90&&u<145);
 }
 function protectHands(c,dir,k){
   const p=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,256,256).data,mask=new Uint8Array(65536);
   // Reviewed cuff boundaries per pose. Skin is not inferred from a bounding box
   // around highlights: tan sleeve highlights have the same hue as skin.
   const cuffs=dir==='down'?[[150,151],[152,151],[145,155],[150,154],[152,147],[159,144]]:
     [[146,149],[149,149],[148,144],[150,149],[152,147],[148,146]];
   const handEdges=dir==='down'?[[96,163],[99,165],[97,163],[100,163],[98,158],[100,166]]:
     [[97,166],[99,165],[99,166],[99,163],[99,165],[100,165]];
   const front=[[94,123,101,140],[94,123,101,140],[85,119,97,139],[87,119,97,139],[91,118,98,135],[92,124,100,142]][k];
   const rear=[[166,140,181,133],[165,141,181,134],[163,138,177,131],[160,140,175,134],[166,140,181,133],[169,142,183,135]][k];
   for(let y=118;y<182;y++)for(let x=0;x<256;x++){
     const i=y*256+x,j=i*4;if(!p[j+3])continue;
     let inside;
     if(dir==='down'||dir==='up')inside=(x<handEdges[k][0]&&y>=cuffs[k][0])||(x>handEdges[k][1]&&y>=cuffs[k][1]);
     else{const u=dir==='right'?255-x:x;
       const edge=front[0]+(y-front[1])*(front[2]-front[0])/(front[3]-front[1]);
       const bottom=rear[1]+(u-rear[0])*(rear[3]-rear[1])/(rear[2]-rear[0]);
       inside=(u<108&&u<=edge)||(u>156&&y>=bottom);
     }
     if(inside&&p[j]>p[j+1]*1.16&&p[j+1]>p[j+2]*1.08)mask[i]=1;
   }return mask;
 }
 // Follow the actual face and neck in each pose. A rectangle also protected
 // the two jacket lapels beside the cheeks, leaving their original pigment.
 function protectFrontFace(c,outfit){
   const p=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,256,256).data;
   const mask=new Uint8Array(65536),queue=[];
   const warm=i=>p[i*4+3]>32&&p[i*4]>100&&p[i*4]>p[i*4+1]*1.20&&p[i*4+1]>p[i*4+2]*1.12;
   for(let y=75;y<=113;y++)for(let x=124;x<=131;x++){const i=y*256+x;if(warm(i)){mask[i]=1;queue.push(i);}}
   for(let j=0;j<queue.length;j++)for(const i of [queue[j]-1,queue[j]+1,queue[j]-256,queue[j]+256]){
     const x=i%256,y=Math.floor(i/256);
     if(x<96||x>158||y<70||y>118||mask[i]||!warm(i))continue;
     mask[i]=1;queue.push(i);
   }
   const edgeMask=mask.slice();
   const radius=outfit===2?2:1; // Formal atlas has a two-pixel shaded jaw contour.
   for(let y=82;y<118;y++)for(let x=96;x<=158;x++)if(edgeMask[y*256+x]){
     for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++)mask[(y+dy)*256+x+dx]=1;
   }
   // Include facial shadows and the jaw outline within each connected row.
   for(let y=82;y<=118;y++){
     let left=256,right=-1;for(let x=96;x<=158;x++)if(mask[y*256+x]){left=Math.min(left,x);right=Math.max(right,x);}
     if(right>=left)for(let x=left;x<=right;x++)mask[y*256+x]=1;
   }
   return mask;
 }
 function clothMask(outfit,dir,k){const protectedSkin=skin[outfit][directions.indexOf(dir)][k];return (r,g,b,x,y)=>{
   if(y<82||y>179||Math.max(r,g,b)<30)return false;
   const u=dir==='right'?255-x:x;
   const face=dir==='down'?(y<99||(y<106&&x>103&&x<154)):
     dir==='up'?y<84:(y<82||(y<98&&u<124));
   const warmHue=(g-b)/(Math.max(r,g,b)-Math.min(r,g,b)||1)/6;
   if(dir==='down'&&outfit!==1){
     if(y<90||frontSkin[outfit][k][y*256+x])return false;
   }else if(r>g&&g>b&&(face||(headOrNeck(dir,x,y)&&(outfit!==2||warmHue>.043))))return false;
   if(protectedSkin[y*256+x])return false;
   if(outfit===1)return b>r*1.06&&b>g*1.02&&y<159;
   if(outfit===2)return r>g*1.40&&r>b*1.3&&(g-b)/(r-Math.min(g,b))/6<.043;
   // Tan jacket pigment, excluding navy shirt, skin, belt buckle and leather shoes.
   const hi=Math.max(r,g,b),lo=Math.min(r,g,b),delta=hi-lo;
   if(delta<12||r!==hi)return false;
   if(y>(dir==='down'?173:dir==='up'?166:163))return false;
   const hue=(g-b)/delta/6;
   if(dir==='down'&&y>=146&&y<=165&&x>=112&&x<=143)return false;
   const beltY=[137,137,137,140,134,138][k];
   if(dir==='left'&&y>=beltY-4&&y<=beltY+7&&x>=109&&x<=120)return false;
   if(dir==='right'&&y>=beltY-4&&y<=beltY+7&&x>=135&&x<=146)return false;
   if(dir==='left'||dir==='right'){
     const u=dir==='right'?255-x:x;
     if(y>[150,149,150,152,148,150][k]||(y>beltY+6&&u<128))return false;
   }
   return hue>.045&&hue<.16&&g>b*1.10;
 };}
 // Generated repair is sampled only inside reviewed wrists. The original atlas,
 // silhouette, alpha, fingers and every pixel outside these regions remain intact.
 const wristRegions=[
   [[[73,145,23,11]],[[78,146,23,11]],[[75,140,23,11],[161,150,20,10]],[[77,144,24,12],[159,153,21,11]],[[157,140,23,12]],[[77,154,24,12],[165,140,22,12]]],
   [[[73,141,24,12]],[[73,143,24,12],[158,143,23,12]],[[74,143,25,13],[160,138,23,13]],[[73,142,26,13],[158,141,24,13]],[[73,142,25,14]],[[73,140,27,15],[158,137,24,14]]],
   [[[86,123,15,21],[160,130,24,15]],[[86,122,15,21],[164,132,23,15]],[[83,119,17,22],[164,128,20,17]],[[83,119,18,22],[163,128,21,17]],[[81,118,19,21],[162,132,23,16]],[[84,123,17,22],[164,131,22,16]]]
 ];
 function repairWrists(original,repair,r,k){
   const ctx=original.getContext('2d',{willReadFrequently:true}),data=ctx.getImageData(0,0,256,256),p=data.data;
   const q=repair.getContext('2d',{willReadFrequently:true}).getImageData(0,0,256,256).data;
   const warm=(v,i)=>v[i+3]>200&&v[i]>v[i+1]*1.20&&v[i+1]>v[i+2]*1.12;
   for(const [bx,by,w,h] of wristRegions[Math.min(r,2)][k]){
     const left=r===3?256-bx-w:bx;
     for(let y=by;y<by+h;y++)for(let u=left;u<left+w;u++){
       const i=(y*256+u)*4;if(!warm(p,i)||!warm(q,i))continue;
       if(![-2,2,-512,512].every(delta=>warm(p,i+delta*4)))continue;
       const weight=Math.min(1,(u-left)/2,(left+w-1-u)/2,(y-by)/2,(by+h-1-y)/2);
       for(let channel=0;channel<3;channel++)p[i+channel]=Math.round(p[i+channel]*(1-weight)+q[i+channel]*weight);
     }
   }ctx.putImageData(data,0,0);
 }
 async function init(){return pending??= (async()=>{
   const images=await Promise.all(['approved-casual.png','polo-v2.png','formal.png','heads.png','accessories.png','polo-wrist-repair.png'].map(load));
   for(let outfit=0;outfit<3;outfit++)outfits[outfit]=directions.map((d,r)=>Array.from({length:6},(_,k)=>tile(images[outfit],k,r,6,4)));
   for(let r=0;r<4;r++)for(let k=0;k<6;k++)repairWrists(outfits[1][r][k],tile(images[5],k,r,6,4),r,k);
   for(let outfit=0;outfit<3;outfit++)skin[outfit]=directions.map((d,r)=>outfits[outfit][r].map((c,k)=>protectHands(c,d,k)));
   for(let outfit=0;outfit<3;outfit++)frontSkin[outfit]=outfits[outfit][0].map(c=>protectFrontFace(c,outfit));
   for(let r=0;r<2;r++)heads[r]=directions.map((d,k)=>crop(tile(images[3],k,r,4,2)));
   for(let r=0;r<3;r++)accessories[r]=directions.map((d,k)=>crop(tile(images[4],k,r,4,3)));
   directions.forEach((d,r)=>{anchors[r]=[];for(let k=0;k<6;k++){const cut=[103,92,96,96][r],box=bounds(outfits[0][r][k],cut);anchors[r][k]={...box,cut};}});
 })();}
 function normalize(s={}){const o={};for(const [key,max] of [['hair',3],['outfit',3],['accessory',4],['hairColor',5],['outfitColor',5]]){const n=Number(s[key]??0);o[key]=Number.isInteger(n)&&n>=0&&n<max?n:0}return o;}
 function frame(direction,k,state){const s=normalize(state),r=directions.indexOf(direction);if(r<0||!Number.isInteger(k)||k<0||k>5)throw Error('Invalid animation frame');const key=[r,k,...Object.values(s)].join(':');if(cache.has(key))return cache.get(key);
   const c=make(),x=c.getContext('2d',{willReadFrequently:true});x.imageSmoothingEnabled=false;
   const outfitKey=[s.outfit,s.outfitColor,r,k].join(':');if(!tintedOutfits.has(outfitKey))tintedOutfits.set(outfitKey,tint(outfits[s.outfit][r][k],s.outfitColor?colors.outfit[s.outfitColor]:null,clothMask(s.outfit,direction,k),[145,75,90][s.outfit]));x.drawImage(tintedOutfits.get(outfitKey),0,0);
   // All outfits use the same approved neck anchor, preventing head/clothes seams.
   const a=anchors[r][k];
   let head,box={x:a.x,y:a.y,w:a.w,h:a.h};
   if(s.hair===0){head=make(a.w,a.h);head.getContext('2d',{willReadFrequently:true}).drawImage(outfits[s.outfit][r][k],a.x,a.y,a.w,a.h,0,0,a.w,a.h);}
   else{
     head=heads[s.hair-1][r];
     // Stable head dimensions: frame silhouettes must not rescale the new hair.
     box.w=r<2?85:78;box.x=Math.round(a.x+a.w/2-box.w/2);
     box.h=Math.min(Math.round(box.w*head.height/head.width),[87,77,78,78][r]);
     const neckY=[107,89,94,94][r]-(s.hair===2&&r===0?2:0)+(a.y-[22,18,19,19][r]);
     box.y=neckY-box.h;
     const outlines=[
       [[0,0],[256,0],[256,94],[153,94],[144,101],[136,106],[120,106],[110,101],[103,94],[0,94]],
       [[0,0],[256,0],[256,92],[149,92],[145,84],[139,80],[118,80],[112,84],[107,92],[0,92]],
       [[0,0],[256,0],[256,82],[145,82],[131,87],[117,95],[111,99],[89,99],[80,90],[0,90]]
     ];
     const outline=outlines[Math.min(r,2)];
     if(r!==0){x.save();x.beginPath();outline.forEach(([u,v],i)=>i?x.lineTo(r===3?256-u:u,v):x.moveTo(r===3?256-u:u,v));x.closePath();x.clip();x.clearRect(0,0,256,120);x.restore();}
   }
   const hairMask=(R,G,B,px,py)=>gray(R,G,B)&&(r===1||(r===0?(py<head.height*.43||((px<head.width*.19||px>head.width*.81)&&py<head.height*.73)):(py<head.height*.30||(r===2?px>head.width*.43:px<head.width*.57))));
   const headKey=[s.outfit,s.hair,s.hairColor,r,s.hair===0?k:0].join(':');if(!tintedHeads.has(headKey)){
     const colored=tint(head,s.hairColor?colors.hair[s.hairColor]:null,hairMask,155);
     if(s.hair===0&&s.hairColor){const hx=colored.getContext('2d',{willReadFrequently:true}),pixels=hx.getImageData(0,0,colored.width,colored.height),original=head.getContext('2d',{willReadFrequently:true}).getImageData(0,0,head.width,head.height).data;
       for(let i=0;i<original.length;i+=4){const px=i/4%head.width,py=Math.floor(i/4/head.width);if(!hairMask(original[i],original[i+1],original[i+2],px,py)||py+a.y>=a.cut-12)pixels.data[i+3]=0;}hx.putImageData(pixels,0,0);}
     tintedHeads.set(headKey,colored);
   }head=tintedHeads.get(headKey);
   if(s.hair&&r===0){
     // Replace the scalp only. Keep this pose's original lower face, jaw, neck
     // and collar, instead of cutting off the head at a fixed neck height.
     const layer=make(),lx=layer.getContext('2d',{willReadFrequently:true});lx.imageSmoothingEnabled=false;lx.drawImage(head,box.x,box.y,box.w,box.h);
     const donor=lx.getImageData(0,0,256,256).data,basePixels=x.getImageData(0,0,256,256),p=basePixels.data;
     const dy=a.y-22,dx=Math.round(a.x+a.w/2-128.5);
     for(let y=0;y<73+dy;y++)for(let u=70;u<185;u++){
       const i=(y*256+u)*4,localX=u-dx,localY=y-dy;
       const side=localX<105||localX>150;
       const edge=side?67:48;
       const weight=Math.max(0,Math.min(1,(edge+3-localY)/4));if(!weight)continue;
       for(let channel=0;channel<4;channel++)p[i+channel]=Math.round(donor[i+channel]*weight+p[i+channel]*(1-weight));
     }x.putImageData(basePixels,0,0);
     // Front accessories stay attached to the unchanged eyes and ears.
     box={x:a.x,y:a.y,w:a.w,h:a.h};
   }else if(s.hair!==0||s.hairColor)x.drawImage(head,box.x,box.y,box.w,box.h);
   if(s.accessory){const part=accessories[s.accessory-1][r];let w,h,px,py;
     if(s.accessory===1){w=box.w*(r<2?.75:.52);h=w*part.height/part.width;
       const eye=r===0?.61:r<2?[.61,.59,.60][s.hair]:[.57,.59,.60][s.hair];
       px=r<2?box.x+(box.w-w)/2:r===2?box.x+box.w*.12:box.x+box.w*.88-w;
       py=box.y+box.h*eye-h*.46;
       if(r===1){w=box.w*.91;px=box.x+(box.w-w)/2;py=box.y+box.h*(s.hair?.66:.59);h=box.h*.09;}
     }else if(s.accessory===2){w=box.w*1.10;h=w*part.height/part.width;px=box.x+(box.w-w)/2;py=Math.max(2,box.y+box.h*.43-h);}
     else{
       w=r===0?30:r===1?29:28;h=w*part.height/part.width;
       const center=a.x+a.w/2;
       px=center-w/2+(r===2?-4:r===3?4:0);
       // Follow the collar, not the hairstyle bounding box.
       py=(r===0?103:r===1?86:91)+(a.y-[22,18,19,19][r]);if(r===1)h=7;
     }
     // Hair under a cap cannot protrude through its crown.
     if(s.accessory===2)x.clearRect(0,0,256,Math.round(py+h*.65));
     x.drawImage(part,Math.round(px),Math.round(py),Math.round(w),Math.round(h));
     if(s.accessory===3&&r===1){
       // Only the hair above the nape occludes the band, never the entire head rectangle.
       x.save();x.beginPath();x.rect(0,0,256,py+1);x.clip();
       if(s.hair)x.drawImage(head,box.x,box.y,box.w,box.h);
       else{ x.drawImage(outfits[s.outfit][r][k],0,0);if(s.hairColor)x.drawImage(head,box.x,box.y,box.w,box.h); }
       x.restore();
     }
     if(s.accessory===3&&r>=2&&(k===2||k===3)){
       // Restore the approaching arm over the scarf tails, using the same colored frame.
       const contours=[
         [[[138,102],[151,116],[94,143],[75,135],[78,122],[119,108]],[[137,104],[150,118],[94,144],[75,136],[79,123],[119,109]]],
         [[[137,102],[150,116],[96,143],[75,135],[79,122],[119,108]],[[137,103],[150,117],[96,144],[76,136],[80,123],[120,109]]],
         [[[138,102],[151,116],[95,143],[75,135],[79,122],[120,108]],[[138,104],[151,118],[95,144],[76,136],[80,123],[120,109]]]
       ];
       const arm=contours[s.outfit][k-2];
       x.save();x.beginPath();arm.forEach(([px,py],i)=>i?x.lineTo(r===3?256-px:px,py):x.moveTo(r===3?256-px:px,py));x.closePath();x.clip();x.drawImage(tintedOutfits.get(outfitKey),0,0);x.restore();
       // Restore the upper shoulder sleeve where the scarf crosses the moving arm.
       if(r>=2){x.save();x.beginPath();const shoulder=[[132,96],[176,99],[195,122],[180,143],[151,124]];shoulder.forEach(([u,v],i)=>i?x.lineTo(r===3?256-u:u,v):x.moveTo(r===3?256-u:u,v));x.closePath();x.clip();x.drawImage(tintedOutfits.get(outfitKey),0,0);x.restore();}
     }
   }
   {const fx=c.getContext('2d',{willReadFrequently:true}),fd=fx.getImageData(0,0,c.width,c.height);defringe(fd);fx.putImageData(fd,0,0);}
   cache.set(key,c);if(cache.size>96)cache.delete(cache.keys().next().value);return c;
 }
 return {init,directions,colors,normalize,frame,draw(ctx,d,k,state){ctx.imageSmoothingEnabled=false;ctx.drawImage(frame(d,k,state),0,0)},combinationCount:900};
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
})(typeof SlimWardrobe!=='undefined'?SlimWardrobe:null);
