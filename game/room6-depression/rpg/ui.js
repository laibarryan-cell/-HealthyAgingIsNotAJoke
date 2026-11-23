(() => {
  'use strict';
  const {careEvents,periodLabels,dayTitles}=CareData,E=CareEngine;
  let host,state,callbacks,timers=[],mounted=false;
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const later=(fn,delay)=>{const id=setTimeout(()=>{if(mounted)fn();},delay);timers.push(id);};
  const save=()=>callbacks.onSave(state);
  const trend=c=>c.close>c.open?'up':c.close<c.open?'down':'flat';
  const symbol=c=>c.close>c.open?'▲':c.close<c.open?'▼':'―';
  const delta=c=>`${c.close-c.open>0?'+':''}${c.close-c.open}`;
  function chart(candles,total=15,animate=false){
    const w=1000,h=170,left=35,right=14,top=16,bottom=32,inner=h-top-bottom,step=(w-left-right)/total;
    const y=v=>top+(100-v)*inner/100;
    const grid=[0,25,50,75,100].map(n=>`<line x1="${left}" x2="${w-right}" y1="${y(n)}" y2="${y(n)}" class="grid-line"/><text x="${left-8}" y="${y(n)+4}" text-anchor="end" class="axis-label">${n}</text>`).join('');
    const slots=Array.from({length:total},(_,i)=>{const x=left+(i+.5)*step;return `<line x1="${x}" x2="${x}" y1="${top}" y2="${h-bottom}" class="slot-line"/>${total===3?`<text x="${x}" y="${h-8}" text-anchor="middle" class="axis-label">${['上午','下午','晚上'][i]}</text>`:i%3===1?`<text x="${x}" y="${h-8}" text-anchor="middle" class="axis-label">DAY ${Math.floor(i/3)+1}</text>`:''}`;}).join('');
    const bars=candles.map((c,i)=>{const x=left+(i+.5)*step,bw=Math.min(25,step*.38),bodyY=y(Math.max(c.open,c.close)),bh=Math.max(2,Math.abs(y(c.open)-y(c.close)));return `<g class="candle ${trend(c)} ${animate&&i===candles.length-1?'new-candle':''}" data-candle="${i}" style="transform-origin:${x}px ${y(c.open)}px"><title>Day ${c.day} ${periodLabels[c.period]}：Open ${c.open}，High ${c.high}，Low ${c.low}，Close ${c.close}，${symbol(c)} ${delta(c)}</title><line x1="${x}" x2="${x}" y1="${y(c.high)}" y2="${y(c.low)}"/><rect x="${x-bw/2}" y="${bodyY}" width="${bw}" height="${bh}" rx="2"/><text x="${x}" y="${Math.max(12,y(c.high)-7)}" text-anchor="middle">${symbol(c)}</text></g>`;}).join('');
    return `<svg class="mood-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="心情走勢，共 ${candles.length} 根 K 棒，範圍 0 到 100；詳細數值可在下方查看。">${grid}${slots}${bars}</svg>`;
  }
  function chartPanel(candles,total=15,animate=false){
    return `<section class="chart-panel" aria-labelledby="chartTitle"><div class="chart-heading"><h3 id="chartTitle">心情走勢 <small>${candles.length} / ${total} 段生活</small></h3><div class="legend"><span class="up">▲ 紅 K · 上升</span><span class="down">▼ 綠 K · 下降</span><span>― 持平</span></div></div>${chart(candles,total,animate)}<div class="chart-foot">${candles.length?`<label class="inspect-label">查看紀錄 <select id="candleSelect" aria-label="選擇 K 棒查看數值">${candles.map((c,i)=>`<option value="${i}" ${i===candles.length-1?'selected':''}>Day ${c.day} · ${periodLabels[c.period]}</option>`).join('')}</select></label><div id="candleDetails" class="ohlc"></div>`:'<p class="chart-empty">從 55 開始。每一段生活，留下一根心情 K 棒。</p>'}<span class="simulation-note">遊戲心情紀錄，非臨床評分</span></div></section>`;
  }
  function bindChart(candles){
    const select=host.querySelector('#candleSelect'),details=host.querySelector('#candleDetails');if(!select)return;
    const update=()=>{const c=candles[Number(select.value)];details.innerHTML=`<span>Open 開始 <b>${c.open}</b></span><span>High 高點 <b>${c.high}</b></span><span>Low 低點 <b>${c.low}</b></span><span>Close 結束 <b>${c.close}</b></span><strong class="${trend(c)}">${symbol(c)} ${delta(c)}</strong>`;};select.onchange=update;update();
  }
  function days(){return `<nav class="day-track" aria-label="五日進度">${dayTitles.map((t,i)=>`<div class="${i+1===state.currentDay?'current':''} ${state.candles.length>=(i+1)*3?'finished':''}"><b>${state.candles.length>=(i+1)*3?'✓':String(i+1).padStart(2,'0')}</b><span>DAY ${i+1}<small>${t}</small></span></div>`).join('')}</nav>`;}
  function portrait(expression='neutral'){return `<div class="elder-sprite ${expression}" role="img" aria-label="林伯伯${expression==='smile'?'抬頭微笑':expression==='sad'?'稍微低頭，安靜下來':'站在客廳，等待你的陪伴'}"></div>`;}
  function intro(){
    host.innerHTML='';R6.fill(0);R6.setHint(null);
    R6.talk(StoryCopy.room6.tablet.intro).then(()=>{if(!mounted)return;if(E.advance(state)){save();render();}});
  }
  function eventScreen(animate=false){
    const isFeedback=state.stage==='feedback',index=isFeedback?state.candles.length-1:state.candles.length,event=careEvents[index],last=state.candles.at(-1),choice=isFeedback?event.choices[last.choiceIndex]:null;
    const d=isFeedback?last.close-last.open:0,expression=isFeedback?(choice.type==='good'?'smile':choice.type==='bad'?'sad':'neutral'):'neutral';
    const openingSpeech=event.story.match(/「[^」]+」/)?.[0]||'「你來了啊，進來坐坐。」';
    host.innerHTML=`${days()}<section class="care-play"><div class="care-scene ${event.period}" data-expression="${expression}"><span class="scene-label">林伯伯 · ${periodLabels[event.period]}</span><div class="mood-badge"><span>此刻心情</span><strong>${state.mood}</strong><small> / 100</small></div>${portrait(expression)}<div class="character-speech" aria-live="polite">${isFeedback?escape(choice.reaction):escape(openingSpeech)}</div><div id="emojiLayer" class="emoji-layer" aria-hidden="true"></div></div><div class="event-panel"><div class="event-time"><span>${event.period==='morning'?'☀':event.period==='afternoon'?'◷':'☾'} ${periodLabels[event.period]}</span><span>DAY ${event.day} · ${dayTitles[event.day-1]}</span></div><h3 tabindex="-1">${event.title}</h3><p class="event-story">${event.story}</p>${!isFeedback?`<div class="choices sk-drop-list">${event.choices.map((c,i)=>`<button class="choice-button" data-choice="${i}"><span>${['A','B','C'][i]}</span><p>${c.text}</p><b>↗</b></button>`).join('')}</div>`:`<div class="chosen-response"><span>你選擇的陪伴</span><p>${escape(choice.text)}</p></div><div class="response-feedback ${animate?'pending':''}" role="status"><span class="feedback-kicker">${d>=8?'✧ 這一刻，多了一點連結':d<=-8?'☂ 試著靠近他的感受':'❧ 陪伴裡的小提醒'}</span><p>${escape(choice.feedback)}</p></div><div class="continue-row"><span class="animation-status">${state.isProcessing?'正在記下這段心情…':'這一段生活，已記在日誌裡。'}</span><button id="continueCare" class="primary-button" ${state.isProcessing?'hidden':''}>${state.candles.length%3===0?'回顧今天':'繼續'} →</button></div>`}</div></section>${chartPanel(state.candles,15,animate)}`;
    bindChart(state.candles);
    R6.fill(isFeedback?state.candles.length-1:state.candles.length);
    if(!isFeedback){
      const list=host.querySelector('.choices');StoryKit.dropHide(list);
      R6.enter('care-hint',StoryCopy.room6.tablet.hint).then(()=>{if(mounted&&list.isConnected)StoryKit.dropShow(list);});
      host.querySelectorAll('[data-choice]').forEach(button=>button.addEventListener('click',()=>{
        if(state.isProcessing||state.stage!=='event')return;
        host.querySelectorAll('[data-choice]').forEach(b=>b.disabled=true);
        const result=E.select(state,Number(button.dataset.choice));if(!result)return;save();eventScreen(true);playEffects(result);R6.star(host.querySelector('.mood-badge'),state.candles.length);
      }));
    }else host.querySelector('#continueCare').onclick=()=>{if(E.advance(state)){save();render();}};
    if(!animate)host.querySelector('h3').focus({preventScroll:true});
  }
  function playEffects({candle,choice}){
    const difference=candle.close-candle.open,kind=difference>=8?'burst':difference<=-8?'rain':'gentle';
    const layer=host.querySelector('#emojiLayer'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const icons=kind==='burst'?['🎉','✨','🌟','😊','💛','🎊']:kind==='rain'?['😢','😞','💧','😔']:['🙂','✨','💬'];
    const count=reduced?3:kind==='burst'?32:kind==='rain'?17:7;
    for(let i=0;i<count;i++){
      const el=document.createElement('span');el.className=`emoji ${reduced?'still':kind}`;el.textContent=icons[i%icons.length];
      el.style.cssText=`--x:${8+Math.random()*84}%;--drift:${(Math.random()-.5)*180}px;--turn:${(Math.random()-.5)*130}deg;--delay:${Math.random()*.2}s;--size:${22+Math.random()*18}px`;
      layer.appendChild(el);
    }
    host.querySelector('.elder-sprite').classList.add(choice.type==='good'?'nod-up':choice.type==='bad'?'nod-down':'breathe-person');
    later(()=>host.querySelector('.response-feedback')?.classList.remove('pending'),900);
    later(()=>{
      E.settle(state);save();layer.replaceChildren();host.querySelector('.animation-status').textContent='這一段生活，已記在日誌裡。';
      const A=StoryCopy.room6.tablet.after;
      R6.say([A[(state.candles.length-1)%A.length]]).then(()=>{
        if(!mounted)return;const next=host.querySelector('#continueCare');if(!next)return;next.hidden=false;next.focus({preventScroll:true});
      });
    },2300);
  }
  function summary(){
    R6.setHint(null);R6.fill(state.candles.length);
    const candles=state.candles.slice(-3),day=candles[0].day;
    host.innerHTML=`${days()}<section class="day-summary"><div class="summary-copy"><span class="eyebrow">DAY ${day} SUMMARY · 今日回顧</span><h3 tabindex="-1">把今天，輕輕收好。</h3><p>${dayTitles[day-1]}。<br>一起看看今天三個片刻，留下了什麼起伏。</p><div class="summary-numbers"><div><span>今日開始心情</span><strong>${candles[0].open}</strong></div><span>→</span><div><span>今日結束心情</span><strong>${candles[2].close}</strong></div></div></div><div class="daily-moments">${candles.map((c,i)=>`<article><span>${periodLabels[c.period]}</span><h4>${careEvents[(day-1)*3+i].title}</h4><strong class="${trend(c)}">${symbol(c)} ${delta(c)}</strong><small>${c.open} → ${c.close}</small></article>`).join('')}</div></section>${chartPanel(candles,3)}<div class="summary-actions"><p>心情會起伏。陪伴的重點，是理解每一次變化背後的需要。</p><button class="primary-button" id="nextDay">${day===5?'看看完整五日旅程':'迎接第 '+(day+1)+' 天'} →</button></div>`;
    bindChart(candles);host.querySelector('#nextDay').onclick=()=>{if(E.advance(state)){save();render();}};host.querySelector('h3').focus({preventScroll:true});
  }
  function final(){
    R6.setHint(null);R6.fill(15);
    host.innerHTML=`<section class="care-final"><div class="final-heading"><div><span class="eyebrow">FIVE DAYS TOGETHER · 五日陪伴完成</span><h3 tabindex="-1">一起走過的，都是生活。</h3></div><div class="final-mark">✓<small>15 段日常</small></div></div>${chartPanel(state.candles)}<div class="final-reflection"><div><p>這五天，你看到的不是一個固定的情緒，<br>而是生活事件與陪伴方式所造成的起伏。</p><p>好的陪伴不一定能立刻解決所有問題，<br>但理解、傾聽與適當支持，<br>能讓彼此更有機會一起面對生活。</p></div><aside class="clue-card"><span class="eyebrow">五日陪伴 · 學習回顧</span><h4>理解・傾聽・支持</h4><p>把這份陪伴，留在下一次日常裡。</p><small>正式物品可在房間的收集系統查看</small></aside></div><div class="actions"><button id="finishReturn" class="primary-button">完成學習</button><button id="replayCare" class="secondary-button">重新體驗五日陪伴</button></div><p class="final-note">心情數值是教學情境的模擬，不代表診斷或治療成效。</p></section>`;
    bindChart(state.candles);/* 第三修改計劃 B4:同一顆按鈕「完成學習」→ 寶物 → 返回 */window.StoryDialog.finishButton(host.querySelector('#finishReturn'),{backLabel:'返回房間',finish:async()=>{if(callbacks.onFinal)await callbacks.onFinal();},back:()=>callbacks.onReturn()});host.querySelector('#replayCare').onclick=callbacks.onReplay;host.querySelector('h3').focus({preventScroll:true});
  }
  function render(){if(!mounted)return;host.closest('#missionView').classList.add('care-rpg-active');if(state.stage==='intro')intro();else if(state.stage==='day-summary')summary();else if(state.stage==='final')final();else eventScreen();}
  function dispose(){timers.forEach(clearTimeout);timers=[];if(mounted){E.settle(state);save();host.closest('#missionView')?.classList.remove('care-rpg-active');}mounted=false;}
  window.CareRPG={mount(container,careGameState,options){dispose();host=container;state=careGameState;callbacks=options;mounted=true;render();},dispose};
})();
