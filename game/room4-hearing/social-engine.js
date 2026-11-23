(function(root){
  'use strict';
  const D=root.HearingSocialData,stages=['experience','judgment','learning','rpg','summary','clue','complete'];
  const freshRound=()=>({asked:false,resolved:false,pending:null,attempts:[],log:[]});
  const fresh=()=>({version:1,stage:'experience',scene:0,storyElapsed:0,answer:'',round:0,rounds:D.rounds.map(freshRound),completed:false,claimed:false,learningCompleted:false});
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  function normalize(raw){
    const s=fresh();if(!raw||raw.version!==1)return s;
    s.scene=Number.isInteger(raw.scene)?clamp(raw.scene,0,2):0;
    s.storyElapsed=Number.isFinite(raw.storyElapsed)?clamp(raw.storyElapsed,0,5000):0;
    s.answer=D.choices.some(c=>c.id===raw.answer)?raw.answer:'';
    s.round=Number.isInteger(raw.round)?clamp(raw.round,0,4):0;
    s.rounds=s.rounds.map((base,i)=>{const r=raw.rounds?.[i];if(!r||typeof r!=='object')return base;return {asked:r.asked===true,resolved:r.resolved===true,pending:['question','louder','slower'].includes(r.pending)?r.pending:null,attempts:Array.isArray(r.attempts)?r.attempts.filter(a=>a==='louder'||a==='slower').slice(-100):[],log:Array.isArray(r.log)?r.log.filter(l=>l&&['elder','player'].includes(l.speaker)&&typeof l.text==='string').slice(-100).map(l=>({speaker:l.speaker,text:l.text.slice(0,400),kind:l.kind==='smile'?'smile':'text'})):[]};});
    s.stage=stages.includes(raw.stage)?raw.stage:'experience';
    const finished=s.rounds.every(r=>r.resolved);
    s.claimed=raw.claimed===true&&finished;s.completed=s.claimed;
    if(s.stage!=='experience' && (s.scene<2||s.storyElapsed<5000))s.stage='experience';
    if(stages.indexOf(s.stage)>1&&s.answer!=='a')s.stage='judgment';
    if(['summary','clue'].includes(s.stage)&&!finished)s.stage='rpg';
    if(s.stage==='clue'&&!s.claimed)s.stage='summary';
    const firstUnfinished=s.rounds.findIndex(r=>!r.resolved);
    if(firstUnfinished>=0&&s.round>firstUnfinished)s.round=firstUnfinished;
    s.learningCompleted=raw.learningCompleted===true && s.scene===2 && s.storyElapsed===5000 && s.answer==='a';
    if(s.learningCompleted){s.completed=true;s.stage='complete';}
    else if(s.stage==='complete')s.stage='learning';
    return s;
  }
  function begin(s,action){
    if(s.stage!=='rpg')return false;
    const r=s.rounds[s.round],data=D.rounds[s.round];if(r.pending||r.resolved)return false;
    if(action==='question'){
      if(r.asked)return false;r.asked=true;r.pending='question';r.log.push({speaker:'player',text:data.question,kind:'text'});
    }else{
      if(!r.asked||!['louder','slower'].includes(action))return false;
      r.pending=action;r.attempts.push(action);
      const text=action==='louder'?`我把音量稍微提高，再說一次：${data.question}`:`我慢慢說：${data.slowQuestion||data.question}`;
      r.log.push({speaker:'player',text,kind:'text'});
    }
    return true;
  }
  function settle(s){
    const r=s.rounds[s.round],data=D.rounds[s.round];if(s.stage!=='rpg'||!r.pending||r.resolved)return false;
    const action=r.pending;r.pending=null;
    let text,kind='text';
    if(action==='question'){text=data.initial;kind=data.kind;r.resolved=data.strategy===null;}
    else if(action===data.strategy){text=data.answer;r.resolved=true;}
    else text='……';
    r.log.push({speaker:'elder',text,kind});return true;
  }
  function next(s){if(s.stage!=='rpg'||!s.rounds[s.round].resolved)return false;if(s.round<4)s.round++;else s.stage='summary';return true;}
  function claim(s){if(s.stage!=='summary'||!s.rounds.every(r=>r.resolved))return false;s.completed=true;s.claimed=true;s.stage='clue';return true;}
  function finishLearning(s){
    if(s.stage!=='learning'||s.scene!==2||s.storyElapsed<5000||s.answer!=='a')return false;
    s.learningCompleted=true;s.completed=true;s.stage='complete';return true;
  }
  root.HearingSocialEngine={fresh,normalize,begin,settle,next,claim,finishLearning};
})(typeof window==='undefined'?globalThis:window);
