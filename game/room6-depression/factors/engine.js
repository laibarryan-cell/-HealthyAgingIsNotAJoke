(function(root){
  'use strict';
  const D=typeof module!=='undefined'&&module.exports?require('./data.js'):root.FactorsData;
  const createState=()=>({version:1,stage:'experience',page:0,seen:[],classified:[],posterPage:0,assessment:[],quizPhase:'choice',completed:false,isProcessing:false});
  function visit(s,index){
    if(s.stage!=='experience'||!Number.isInteger(index)||index<0||index>=D.clues.length)return false;
    s.page=index;if(!s.seen.includes(index))s.seen.push(index);return true;
  }
  function place(s,id,category){
    if(s.isProcessing||!Object.hasOwn(D.categories,category))return {ok:false,reason:'blocked'};
    let item;
    if(s.stage==='judgment'){
      item=D.clues.find(c=>c.id===id);if(!item||s.classified.includes(id))return {ok:false,reason:'blocked'};
    }else if(s.stage==='assessment'&&s.quizPhase==='choice'){
      item=D.assessments[s.assessment.length];if(!item||item.id!==id)return {ok:false,reason:'blocked'};
    }else return {ok:false,reason:'blocked'};
    s.isProcessing=true;
    if(item.category!==category)return {ok:false,reason:'wrong',hint:s.stage==='judgment'?'想想這件事情主要來自身體狀況，還是生活中的改變？':item.hint};
    if(s.stage==='judgment')s.classified.push(id);
    else{s.assessment.push(id);s.quizPhase='feedback';}
    return {ok:true,item,category};
  }
  function settle(s){s.isProcessing=false;}
  function advance(s){
    if(s.isProcessing||s.completed)return false;
    switch(s.stage){
      case 'experience':if(s.seen.length!==6)return false;s.stage='judgment';break;
      case 'judgment':if(s.classified.length!==6)return false;s.stage='first-feedback';break;
      case 'first-feedback':s.stage='learning';break;
      case 'learning':s.stage='poster';s.posterPage=0;break;
      case 'poster':if(s.posterPage!==D.posterStories.length-1)return false;s.stage='assessment';break;
      case 'assessment':
        if(s.quizPhase!=='feedback')return false;
        if(s.assessment.length===D.assessments.length){s.stage='final';s.completed=true;}
        else s.quizPhase='choice';
        break;
      default:return false;
    }
    return true;
  }
  function restore(raw){
    if(!raw||raw.version!==1||!D.stages.includes(raw.stage))throw Error('Invalid album save');
    const s=createState();
    if(!Number.isInteger(raw.page)||raw.page<0||raw.page>5)throw Error('Invalid album page');
    if(!Array.isArray(raw.seen)||raw.seen.some(i=>!Number.isInteger(i)||i<0||i>5)||new Set(raw.seen).size!==raw.seen.length)throw Error('Invalid seen pages');
    if(!Array.isArray(raw.classified)||raw.classified.some(id=>!D.clues.some(c=>c.id===id))||new Set(raw.classified).size!==raw.classified.length)throw Error('Invalid sorted clues');
    if(!Array.isArray(raw.assessment)||raw.assessment.length>8||raw.assessment.some((id,i)=>D.assessments[i].id!==id))throw Error('Invalid assessment order');
    const rank=D.stages.indexOf(raw.stage),n=raw.assessment.length;
    if(rank>0&&raw.seen.length!==6||rank>1&&raw.classified.length!==6||rank<1&&raw.classified.length||rank<5&&n)throw Error('Skipped learning stage');
    if(!['choice','feedback'].includes(raw.quizPhase))throw Error('Invalid assessment phase');
    if(raw.stage==='assessment'&&((raw.quizPhase==='feedback'&&n===0)||(raw.quizPhase==='choice'&&n===8)))throw Error('Invalid assessment progress');
    if(raw.stage==='final'&&(n!==8||raw.quizPhase!=='feedback'))throw Error('Incomplete final');
    const posterMax=D.posterStories.length-1;
    const posterPage=Number.isInteger(raw.posterPage)&&raw.posterPage>=0&&raw.posterPage<=posterMax?raw.posterPage:0;
    Object.assign(s,{stage:raw.stage,page:raw.page,seen:[...raw.seen],classified:[...raw.classified],posterPage,assessment:[...raw.assessment],quizPhase:raw.quizPhase,completed:raw.stage==='final'});
    return s;
  }
  const api={createState,visit,place,settle,advance,restore};root.FactorsEngine=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
