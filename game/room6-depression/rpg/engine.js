(function(root){
  'use strict';
  const data=typeof module!=='undefined'&&module.exports?require('./data.js'):root.CareData;
  const clamp=n=>Math.max(0,Math.min(100,n));
  function createState(){return {version:1,currentDay:1,currentPeriod:'morning',mood:55,candles:[],completed:false,isProcessing:false,stage:'intro'};}
  function calculate(open,event,choice,choiceIndex){
    const eventMood=clamp(open+event.baseImpact);
    const close=clamp(eventMood+choice.effect);
    const peak=clamp(eventMood+Math.max(0,choice.effect)+ (choice.type==='good'?2:0));
    return {day:event.day,period:event.period,open,high:Math.max(open,peak,close),low:Math.min(open,eventMood,close),close,choiceIndex};
  }
  function select(state,choiceIndex){
    if(state.isProcessing||state.stage!=='event'||state.completed||state.candles.length>=15)return null;
    const event=data.careEvents[state.candles.length],choice=event.choices[choiceIndex];
    if(!choice||!Number.isInteger(choiceIndex))return null;
    state.isProcessing=true;
    const candle=calculate(state.mood,event,choice,choiceIndex);
    state.candles.push(candle);state.mood=candle.close;state.stage='feedback';
    return {event,choice,candle};
  }
  function settle(state){if(state.stage==='feedback')state.isProcessing=false;}
  function advance(state){
    if(state.isProcessing)return false;
    if(state.stage==='intro')state.stage='event';
    else if(state.stage==='feedback')state.stage=state.candles.length%3===0?'day-summary':'event';
    else if(state.stage==='day-summary'){
      if(state.candles.length===15){state.stage='final';state.completed=true;}
      else state.stage='event';
    }else return false;
    if(state.stage==='event'){
      const next=data.careEvents[state.candles.length];state.currentDay=next.day;state.currentPeriod=next.period;
    }
    return true;
  }
  function restore(raw){
    if(!raw||raw.version!==1||!Array.isArray(raw.candles)||raw.candles.length>15)throw Error('Invalid game save');
    const s=createState();let open=55;
    for(let i=0;i<raw.candles.length;i++){
      const c=raw.candles[i],event=data.careEvents[i];
      if(!Number.isInteger(c.choiceIndex)||!event.choices[c.choiceIndex])throw Error('Invalid choice');
      const expected=calculate(open,event,event.choices[c.choiceIndex],c.choiceIndex);
      for(const key of Object.keys(expected))if(c[key]!==expected[key])throw Error('Invalid candle');
      s.candles.push(expected);open=expected.close;
    }
    const n=s.candles.length,stage=raw.stage;
    const valid=(stage==='intro'&&n===0)||(stage==='event'&&n<15)||(stage==='feedback'&&n>0)||(stage==='day-summary'&&n>0&&n%3===0)||(stage==='final'&&n===15);
    if(!valid)throw Error('Invalid stage');
    s.stage=stage;s.mood=open;s.completed=stage==='final';s.isProcessing=false;
    const event=data.careEvents[Math.min(stage==='event'?n:Math.max(0,n-1),14)];
    s.currentDay=event.day;s.currentPeriod=event.period;
    return s;
  }
  const api={clamp,createState,calculate,select,settle,advance,restore};
  root.CareEngine=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
