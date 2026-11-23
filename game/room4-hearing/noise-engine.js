(function(root){'use strict';
const D=root.HearingNoiseData,stages=['kitchen','park','learning','clue'];
const fresh=()=>({version:1,stage:'kitchen',tap:'on',tablet:'on',tv:'on',pan:'on',away:false,kitchenBeat:'intro',helpSeen:{kitchen:false,park:false},kitchenAnswer:'',parkPlace:'',parkHeard:false,parkAnswer:'',parkFeedback:'',parkPassed:false,learningDone:false,visits:[],claimed:false});
const ready=s=>s.tap==='off'&&s.tablet!=='on'&&s.tv!=='on'&&s.pan==='off';
function normalize(raw){const s=fresh();if(!raw||raw.version!==1)return s;
for(const k of ['tap','pan'])s[k]=raw[k]==='off'?'off':'on';
for(const k of ['tv','tablet'])s[k]=['low','off'].includes(raw[k])?raw[k]:'on';
s.away=raw.away===true&&ready(s);s.kitchenAnswer=D.kitchenChoices.some(c=>c.id===raw.kitchenAnswer)?raw.kitchenAnswer:'';
s.helpSeen={kitchen:raw.helpSeen?.kitchen===true,park:raw.helpSeen?.park===true};
const beats=s.away?['leaveInvite','leaveReply','done']:['intro','ready','reply','repeat'];s.kitchenBeat=beats.includes(raw.kitchenBeat)?raw.kitchenBeat:s.away?'leaveInvite':'intro';
s.parkPlace=D.places.some(p=>p.id===raw.parkPlace)?raw.parkPlace:'';s.parkHeard=!!s.parkPlace&&raw.parkHeard===true;
s.parkAnswer=D.parkChoices.some(c=>c.id===raw.parkAnswer)?raw.parkAnswer:'';
s.parkFeedback=['retry','guess','success'].includes(raw.parkFeedback)?raw.parkFeedback:'';
s.visits=Array.isArray(raw.visits)?[...new Set(raw.visits.filter(id=>D.places.some(p=>p.id===id)))]:[];
s.parkPassed=raw.parkPassed===true&&s.parkPlace==='shade'&&s.parkHeard&&s.parkAnswer==='ear';
s.claimed=raw.claimed===true&&s.parkPassed&&s.away;
s.stage=stages.includes(raw.stage)?raw.stage:'kitchen';
if(!s.away)s.stage='kitchen';
if(s.stage==='park'&&s.kitchenBeat!=='done')s.kitchenBeat='done';
if(s.stage==='learning'&&!s.parkPassed)s.stage='park';
if(s.stage==='clue'&&!s.claimed)s.stage=s.parkPassed?'learning':'park';
return s;}
function act(s,id,value){if(s.stage!=='kitchen'||s.away)return false;
if(id==='hood')return false;
if(['tap','pan'].includes(id)&&value==='off'){s[id]='off';return true;}
if(['tv','tablet'].includes(id)&&['low','off'].includes(value)){s[id]=value;return true;}return false;}
function leave(s){if(s.stage!=='kitchen'||!ready(s))return false;s.away=true;s.kitchenBeat='leaveInvite';return true;}
function kitchenText(s){if(s.away)return D.kitchenLine;const n=Number(s.tap==='off')+Number(s.tablet!=='on')+Number(s.tv!=='on');return n===0?'＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊':n===1?'我明天＊＊＊＊＊＊，＊＊＊＊＊＊＊＊？':n===2?'我明天要去＊＊＊＊，您要不要＊＊＊＊？':'我明天要去＊＊＊游泳，您要不要＊＊＊？';}
function answerKitchen(s,id){if(s.stage!=='question'||!D.kitchenChoices.some(c=>c.id===id))return false;s.kitchenAnswer=id;s.stage='feedback';return true;}
function go(s,stage){
  if(
    stage==='learning' &&
    s.stage==='kitchen' &&
    s.away &&
    s.kitchenBeat==='done'
  ){
    s.stage='learning';
    return true;
  }

  if(
    stage==='park' &&
    s.stage==='learning' &&
    s.learningDone===true
  ){
    s.stage='park';
    return true;
  }

  return false;
}
function visit(s,id){if(s.stage!=='park'||!D.places.some(p=>p.id===id))return false;s.parkPlace=id;s.parkHeard=false;s.parkAnswer='';s.parkFeedback='';s.parkPassed=false;return true;}
function heard(s){if(s.stage!=='park'||!s.parkPlace)return false;s.parkHeard=true;if(!s.visits.includes(s.parkPlace))s.visits.push(s.parkPlace);return true;}
function answerPark(s,id){if(s.stage!=='park'||!s.parkHeard||!D.parkChoices.some(c=>c.id===id))return false;s.parkAnswer=id;s.parkPassed=s.parkPlace==='shade'&&id==='ear';s.parkFeedback=s.parkPassed?'success':id==='ear'?'guess':'retry';return true;}
function claim(s){
  if(
    s.stage!=='park' ||
    !s.learningDone ||
    !s.parkPassed ||
    s.claimed
  )return false;

  s.claimed=true;
  s.stage='clue';
  return true;
}
root.HearingNoiseEngine={fresh,normalize,ready,act,leave,kitchenText,answerKitchen,go,visit,heard,answerPark,claim};
})(window);
