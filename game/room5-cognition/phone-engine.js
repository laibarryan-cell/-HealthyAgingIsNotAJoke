(function(root){'use strict';
const W=7,H=5,delta=[-7,1,7,-1];
const levels=[
{width:7,height:5,appointment:'阿公，明天下午兩點，我們在圖書館見，一起借書。',target:['下午兩點','圖書館','借書'],times:['上午九點','下午兩點','晚上七點'],places:['菜市場','圖書館','電影院'],activities:['買水果','借書','看電影']},
{width:5,height:7,appointment:'阿公，星期六上午十點，我們在社區中心見，一起上畫畫課。',target:['上午十點','社區中心','畫畫課'],times:['下午四點','上午十點','晚上八點'],places:['超級市場','社區中心','公園'],activities:['買日用品','畫畫課','散步']},
{width:5,height:7,appointment:'阿公，星期日下午三點，我們在植物園見，一起看花展。',target:['下午三點','植物園','看花展'],times:['上午八點','下午三點','中午十二點'],places:['早餐店','植物園','餐廳'],activities:['吃早餐','看花展','吃午餐']}
];
function create(level=0){const tiles=Array.from({length:35},()=>({shape:[],rot:0,label:'',kind:'wall'}));
const put=(r,c,shape,label='',kind='road')=>{tiles[r*W+c]={shape,rot:0,label,kind};};
put(2,0,[0,1,2],'阿公出發','start');put(1,0,[0,2]);put(3,0,[0,2]);put(0,0,[1,2]);put(4,0,[0,1]);
for(const r of [0,4]){for(let c=1;c<6;c++)put(r,c,[1,3]);put(r,6,[3],r===0?'買水果':'看電影','end');}
put(0,1,[1,3],'上午九點','time');put(0,3,[1,3],'菜市場','place');put(4,1,[1,3],'晚上七點','time');put(4,3,[1,3],'電影院','place');
put(2,1,[1,3],'下午兩點','time');put(2,2,[2,3]);put(3,2,[0,1]);put(3,3,[1,3],'圖書館','place');put(3,4,[0,3]);put(2,4,[1,2]);put(2,5,[1,3]);put(2,6,[3],'借書','end');
// A real three-way junction immediately to the right of the cinema.
put(4,4,[0,1,3]);
const info=levels[level];
for(const [kind,labels] of [['time',info.times],['place',info.places],['end',info.activities]]){const indices=kind==='time'?[1,15,29]:kind==='place'?[3,24,31]:[6,20,34];indices.forEach((i,n)=>tiles[i].label=labels[n]);}
const output=Array(35);tiles.forEach((t,i)=>{let r=Math.floor(i/7),c=i%7;if(level===1){output[c*5+(4-r)]={...t,shape:t.shape.map(d=>(d+1)%4)};}else if(level===2){output[(6-c)*5+r]={...t,shape:t.shape.map(d=>(d+3)%4)};}else output[i]=t;});
output.forEach((t,i)=>{if(!['wall','start','end'].includes(t.kind))t.rot=((i+level)%3)+1;});return output;}
const ports=t=>t.shape.map(d=>(d+t.rot)%4);
function neighbor(i,d,level=0){const {width:w,height:h}=levels[level],r=Math.floor(i/w),c=i%w,nr=r+[-1,0,1,0][d],nc=c+[0,1,0,-1][d];return nr<0||nr>=h||nc<0||nc>=w?-1:nr*w+nc;}
function trace(tiles,level=0){const paths=[];function walk(i,path){if(path.includes(i))return;const next=path.concat(i);if(tiles[i].kind==='end'){paths.push(next);return;}for(const d of ports(tiles[i])){const j=neighbor(i,d,level);if(j>=0&&!next.includes(j)&&ports(tiles[j]).includes((d+2)%4))walk(j,next);}}walk(tiles.findIndex(t=>t.kind==='start'),[]);const correct=paths.find(path=>path.filter(i=>['time','place','end'].includes(tiles[i].kind)).map(i=>tiles[i].label).join('|')===levels[level].target.join('|'));return {paths,correct:correct||null};}
root.PhoneRoute={create,ports,trace,neighbor,levels};
})(window);
