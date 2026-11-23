/* Whole-frame canvas compositor. No anatomical masks, replacement limbs or rotations. */
const RoundWalker = (() => {
  const directions = ['down', 'up', 'left', 'right'];
  const frames = {}, records = [];
  const canvas = () => Object.assign(document.createElement('canvas'), {width:256,height:256});
  function extract(img, col, row, side=true, frame=col) {
    const c=canvas(),ctx=c.getContext('2d',{willReadFrequently:true});
    const sw=img.width/6,sh=img.height/3,dw=256*sw/sh;
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(img,col*sw,row*sh,sw,sh,(256-dw)/2,0,dw,256);
    const data=ctx.getImageData(0,0,256,256),p=data.data;
    // Chroma key also clears the enclosed gap between the crossing shoes.
    if(side)for(let j=0;j<p.length;j+=4)if(Math.min(p[j],p[j+2])>p[j+1]*1.5+18)p[j+3]=0;
    // Remove only pale neutral background reachable from the cell border.
    // Dark outlines protect enclosed hair highlights, eyes, fabric and skin.
    const seen=new Uint8Array(65536),queue=new Int32Array(65536);let tail=0,head=0;
    function visit(i){if(i<0||i>=65536||seen[i])return;const j=i*4;
      const lo=Math.min(p[j],p[j+1],p[j+2]),hi=Math.max(p[j],p[j+1],p[j+2]);
      if(p[j+3]===0||(!side&&lo>=178&&hi-lo<=32)||(side&&p[j]>150&&p[j+2]>130&&p[j+1]<120)){seen[i]=1;queue[tail++]=i;}}
    for(let i=0;i<256;i++){visit(i);visit(65280+i);visit(i*256);visit(i*256+255);}
    while(head<tail){const i=queue[head++];if(i%256)visit(i-1);if(i%256<255)visit(i+1);visit(i-256);visit(i+256);}
    for(let i=0;i<65536;i++)if(seen[i])p[i*4+3]=0;
    // Ignore detached background specks when finding the ground and head anchor.
    const labels=new Int32Array(65536);let label=0,biggest=0,biggestSize=0;
    for(let start=0;start<65536;start++)if(p[start*4+3]&&!labels[start]){
      label++;let a=0,b=1;queue[0]=start;labels[start]=label;
      while(a<b){const i=queue[a++];const ns=[];if(i%256)ns.push(i-1);if(i%256<255)ns.push(i+1);if(i>=256)ns.push(i-256);if(i<65280)ns.push(i+256);
        for(const n of ns)if(p[n*4+3]&&!labels[n]){labels[n]=label;queue[b++]=n;}}
      if(b>biggestSize){biggestSize=b;biggest=label;}
    }
    for(let i=0;i<65536;i++)if(labels[i]!==biggest)p[i*4+3]=0;
    let minX=256,maxX=0,minY=256,maxY=0,hMin=256,hMax=0;
    for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(p[(y*256+x)*4+3]){
      minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      if(y<90){hMin=Math.min(hMin,x);hMax=Math.max(hMax,x);}
    }
    // Homepage round default: warm tan casual cardigan, pale shirt.
    // Palette-only rendering: retain every frame's geometry, alpha and timing.
    for(let j=0;j<p.length;j+=4){
      const r=p[j],g=p[j+1],b=p[j+2];
      if(p[j+3]&&g>r*1.03&&g>b*1.2&&g-r>=3){
        const light=.2126*r+.7152*g+.0722*b;
        p[j]=Math.min(255,Math.round(light*2.15));
        p[j+1]=Math.min(255,Math.round(light*1.49));
        p[j+2]=Math.min(255,Math.round(light*.80));
      }
    }
    ctx.putImageData(data,0,0);
    const scale=.92,offsetX=Math.round(128-(hMin+hMax)/2*scale),offsetY=Math.round(240-(maxY+1)*scale);
    const out=canvas(),o=out.getContext('2d');o.imageSmoothingEnabled=false;
    o.drawImage(c,offsetX,offsetY,256*scale,256*scale);
    const bounds=[offsetX+minX*scale,offsetY+minY*scale,offsetX+(maxX+1)*scale,240];
    records.push({direction:directions[row],frame,source:[col*sw,row*sh,sw,sh],asset:'round-walk.png',scale,offset:[offsetX,offsetY],bounds,withinCanvas:bounds[0]>=0&&bounds[1]>=0&&bounds[2]<=256,backgroundPixelsRemoved:tail});
    return out;
  }
  return {directions,anchor:[128,240],version:1,
    async init(){const img=new Image();img.src='assets/walk/round/round-walk.png';await img.decode();
      directions.slice(0,3).forEach((d,r)=>frames[d]=Array.from({length:6},(_,k)=>extract(img,k,r)));
      const fix=new Image();fix.src='assets/walk/round/round-passing-fix.png';await fix.decode();
      records.splice(records.findIndex(r=>r.direction==='left'&&r.frame===4),1);
      frames.left[4]=extract(fix,4,2);
      records[records.length-1].asset='round-passing-fix.png';
      const overlap=new Image();overlap.src='assets/walk/round/round-overlap-fix.png';await overlap.decode();
      records.splice(records.findIndex(r=>r.direction==='left'&&r.frame===2),1);
      frames.left[2]=extract(overlap,2,2);
      records[records.length-1].asset='round-overlap-fix.png';
      frames.right=frames.left.map((f,k)=>{const c=canvas(),x=c.getContext('2d');x.translate(256,0);x.scale(-1,1);x.drawImage(f,0,0);const r=records.find(r=>r.direction==='left'&&r.frame===k);records.push({...r,direction:'right',mirror:true,bounds:[256-r.bounds[2],r.bounds[1],256-r.bounds[0],240]});return c;});
    },
    draw(ctx,d,k,glasses=false,guides=false){ctx.imageSmoothingEnabled=false;ctx.drawImage(frames[d][k],0,0);
      if(guides){ctx.save();ctx.strokeStyle='#977c48';ctx.setLineDash([3,3]);ctx.strokeRect(.5,.5,255,255);ctx.beginPath();ctx.moveTo(0,240);ctx.lineTo(256,240);ctx.stroke();ctx.restore();}},
    pose(d,k){return records.find(r=>r.direction===d&&r.frame===k);},
    move(d){return {down:[0,3.84],up:[0,-3.84],left:[-12,0],right:[12,0]}[d];}
  };
})();

