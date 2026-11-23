(() => {
  'use strict';
  const D=FactorsData,E=FactorsEngine;
  let host,state,callbacks,controller,timers=[],mounted=false,selected=null,drag=null,notice='',suppressClick=false;
  let activeUtterance=null,activeSpeechKey='';
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const later=(fn,ms)=>timers.push(setTimeout(()=>{if(mounted)fn();},ms));
  const save=()=>callbacks.onSave(state);
  function heading(eyebrow,title,subtitle=''){return `<header class="f-heading"><div>${eyebrow?`<span class="eyebrow">${eyebrow}</span>`:''}<h3 tabindex="-1">${title}</h3>${subtitle?`<p>${subtitle}</p>`:''}</div><span class="f-bookmark" aria-hidden="true">✧</span></header>`;}
  function steps(){const rank={experience:0,judgment:1,'first-feedback':2,learning:3,poster:3,assessment:4,final:5}[state.stage];return `<ol class="f-steps" aria-label="學習進度">${['體驗','玩家判斷','回饋','正式學習','遊戲化評量','最終回饋'].map((t,i)=>`<li ${i===rank?'aria-current="step"':''} class="${i<rank?'is-past':''}"><b>${i<rank?'✓':String(i+1).padStart(2,'0')}</b>${t}</li>`).join('')}</ol>`;}
  const fillOf=()=>state.stage==='final'?D.stages.length:D.stages.indexOf(state.stage);
  function enterHint(){const A=StoryCopy.room6.album,h={experience:['alb-exp',A.hintExperience],judgment:['alb-judge',A.hintJudgment],assessment:['alb-assess',A.hintAssessment]}[state.stage];if(h)R6.enter(h[0],h[1]);else R6.setHint(null);}
  let wrongN=0;
  function next(label,visible=true){return `<div class="f-next-row"><button id="factorNext" class="primary-button" ${visible?'':'hidden'}>${label} →</button></div>`;}
  function card(item,placed=false){return `<button type="button" class="f-card ${placed?'is-placed':''} ${selected===item.id?'is-selected':''}" data-card="${item.id}" ${placed||state.isProcessing?'disabled':''} aria-pressed="${selected===item.id}" aria-label="${esc(item.title)}${placed?'，已分類':'，可拖曳或點選分類'}"><span aria-hidden="true">${item.icon||'▤'}</span><span><b>${item.title}</b>${item.story?`<small>${esc(item.story)}</small>`:''}</span><i aria-hidden="true">${placed?'✓':'⠿'}</i></button>`;}
  function bin(category,items,scale=false){const c=D.categories[category];return `<section class="f-bin ${category} ${scale?'f-pan':''}" data-drop="${category}" style="--load:${items.length*7}px" aria-label="${c.label}放置區"><button class="f-bin-heading" data-place="${category}" ${state.isProcessing?'disabled':''} aria-label="將選取卡片放入${c.label}"><span aria-hidden="true">${c.icon}</span><span>${scale?c.label:c.heading}${scale?'':`<small>${c.label}</small>`}</span><b aria-hidden="true">＋</b></button><div class="f-bin-cards">${items.map(item=>scale?`<div class="f-weight" data-weight="${item.id}"><span>✓</span>${item.title}</div>`:card({...item,story:''},true)).join('')}${!items.length?`<span class="f-drop-hint">將${scale?'事件':'線索'}卡放在這裡</span>`:''}</div></section>`;}
  /* 與朋友版 w10_1114 整合:相簿改放朋友版的照片(f-photo-frame);延伸閱讀改為朋友版四幕衛教故事(poster);心裡話對話框沿用本專案 */
  function experience(){const c=D.clues[state.page];return `${heading('','最近發生了什麼？')}<div class="f-album"><div class="f-photo-page"><div class="f-photo-frame"><img class="f-photo-image" src="${esc(c.image)}" alt="${esc(c.object)}"></div><p class="f-photo-caption">${c.caption}</p></div><div class="f-story-page"><span class="f-page-number">生活片刻 ${String(state.page+1).padStart(2,'0')}</span><h4>${c.caption}</h4><p class="sr-only">${esc(c.story).replace(/\n/g,'<br>')}</p><button type="button" class="f-thought-btn" id="albumThought">${esc(StoryCopy.room6.album.thoughtButton)}</button><div class="f-page-turn"><button class="secondary-button" id="albumPrevious" ${state.page===0?'disabled':''}>← 上一頁</button><span>${state.page+1} / 6</span><button class="secondary-button" id="albumNextPage" ${state.page===5?'disabled':''}>下一頁 →</button></div></div></div><div class="f-album-foot"><nav class="f-page-tabs" aria-label="相簿頁面">${D.clues.map((c,i)=>`<button data-page="${i}" ${i===state.page?'aria-current="page"':''} aria-label="翻到第 ${i+1} 頁：${c.caption}">${i+1}<span aria-hidden="true">${state.seen.includes(i)?'•':''}</span></button>`).join('')}</nav><span>已翻閱 ${state.seen.length} / 6 段生活</span></div>${next('整理剛剛看到的線索',state.seen.length===6)}`;}
  function judgment(){const by=cat=>D.clues.filter(c=>c.category===cat&&state.classified.includes(c.id));return `${heading('','這些改變，主要來自哪裡？')}<div class="f-card-bank">${[0,3,1,4,2,5].map(i=>D.clues[i]).filter(c=>!state.classified.includes(c.id)).map(c=>card({...c,story:''})).join('')||'<p class="f-bank-done">✧ 六段生活，都找到放置的位置了。</p>'}</div><div class="f-sort-grid">${bin('body',by('body'))}${bin('life',by('life'))}</div><p class="f-message" role="status" aria-live="polite">${esc(notice)}</p>${next('看看這些線索的關聯',state.classified.length===6&&!state.isProcessing)}`;}
  function diagram(final=false){return `<div class="f-diagram"><section class="f-factor-side body"><span class="f-diagram-icon" aria-hidden="true">🫀</span><h4>生理因素</h4>${(final?['疾病','疼痛','功能下降']:['膝蓋疼痛','疾病','身體功能退化']).map(t=>`<span class="f-factor-tag">${t}</span>`).join('')}</section><span class="f-toward f-toward-left" aria-label="生理因素也可能影響長者">→</span><div class="f-person"><div class="f-person-image" role="img" aria-label="生活中的林伯伯"></div><span>生活中的長者</span></div><span class="f-toward f-toward-right" aria-label="心理與生活因素也可能影響長者">←</span><section class="f-factor-side life"><span class="f-diagram-icon" aria-hidden="true">🧠</span><h4>心理／生活因素</h4>${(final?['退休','伴侶生病','生活改變']:['伴侶生病','家庭改變','退休']).map(t=>`<span class="f-factor-tag">${t}</span>`).join('')}</section></div>`;}
  function firstFeedback(){return `${heading('回頭看看剛才的生活','把線索放回同一個人身上。')}${diagram()}<p class="f-key-message">原來最近的改變，<br>不一定只有一個原因。</p>${next('認識兩種影響因素')}`;}
  function learning(){return `${heading('把觀察整理成知識','老年人的情緒變化，可能受到哪些因素影響？')}<div class="f-learning-columns"><section class="body"><span class="f-learning-icon" aria-hidden="true">🫀</span><h4>生理因素</h4><p>從身體狀況與功能的改變看起。</p><ul>${['生病','慢性疼痛或不適','身體功能退化','行動能力下降'].map(t=>`<li>${t}</li>`).join('')}</ul></section><section class="life"><span class="f-learning-icon" aria-hidden="true">🧠</span><h4>心理／生活因素</h4><p>也看見關係、角色與日常的變動。</p><ul>${['退休或生活角色改變','家庭與生活改變','重要生活事件','伴侶生病所帶來的壓力'].map(t=>`<li>${t}</li>`).join('')}</ul></section></div><p class="f-key-message f-highlight">這些因素可能同時存在，<br>也可能彼此影響。</p>${next('翻到衛教海報區')}`;}
  function poster(){
    const total=D.posterStories.length;
    const index=Math.min(Math.max(state.posterPage||0,0),total-1);
    const s=D.posterStories[index];
    return `${heading('延伸閱讀','短篇衛教故事','跟著阿公一起整理最近的改變，看看快樂和支持如何慢慢回來。')}<section class="f-story-lesson"><div class="f-story-left"><figure class="f-story-figure"><img src="${esc(s.image)}" alt="${esc(s.imageAlt||s.title)}"></figure><div class="f-story-copy"><span class="f-story-kicker">${s.title}</span>${s.storyLines.map(line=>`<p>「${esc(line)}」</p>`).join('')}</div></div><aside class="f-lesson-panel"><div class="f-lesson-card"><span class="f-lesson-kicker">衛教重點</span><h4>${s.educationTitle}</h4><p>${esc(s.educationBody)}</p><button type="button" class="secondary-button f-voice-button" data-speak-key="poster-${index}" data-speak-text="${esc(s.speechText||(`${s.educationTitle}。${s.educationBody}`))}">🔊 語音朗讀</button></div></aside></section><div class="f-story-controls"><button class="secondary-button" id="posterPrev" ${index===0?'disabled':''}>← 上一幕</button><span class="f-story-count">第 ${index+1} / ${total} 幕</span><button class="secondary-button" id="posterNextStory" ${index===total-1?'disabled':''}>下一幕 →</button></div>${next('進入原因天平',index===total-1)}`;
  }
  function assessment(){const feedback=state.quizPhase==='feedback',current=D.assessments[feedback?state.assessment.length-1:state.assessment.length],by=cat=>D.assessments.filter(c=>c.category===cat&&state.assessment.includes(c.id));return `${heading('','原因天平')}<div class="f-assessment-top"><div class="f-assessment-count"><b>${state.assessment.length}</b><span> / 8 段生活<br>已整理</span></div><div class="f-current-event">${feedback?`<div class="f-event-placed"><span>✓ 這段生活已放入盤中</span><strong>${current.story}</strong></div>`:card(current)}</div></div><div class="f-scale-stage"><svg class="f-balance" viewBox="0 0 1000 350" preserveAspectRatio="none" aria-hidden="true"><path class="f-scale-shadow" d="M360 332h280"/><path class="f-scale-base" d="M455 320L500 235 545 320Z"/><path class="f-scale-metal" d="M500 280V50M235 68H765"/><circle cx="500" cy="68" r="17"/><path class="f-scale-rope" d="M235 68V135M765 68V135"/><path class="f-pan-line" d="M60 277Q235 335 410 277M590 277Q765 335 940 277"/></svg>${bin('body',by('body'),true)}${bin('life',by('life'),true)}</div><p class="f-scale-note">天平呈現不同負擔的累積，不是在比較哪一種因素更重要。</p><div class="f-assessment-feedback" role="status" aria-live="polite">${feedback?`<span>✧ 看見這段生活的起點</span><p>${current.feedback}</p>`:`<p>${esc(notice)}</p>`}</div>${next(state.assessment.length===8?'把所有因素放回生活裡':'下一段生活',feedback&&!state.isProcessing)}`;}
  function final(){return `${heading('最終回饋 · 最近發生了什麼？','理解一個人，也理解他的生活。')}${diagram(true)}<div class="f-final-copy"><p>老年人的情緒變化，<br>可能來自身體狀況，<br>也可能來自生活與心理壓力。</p><strong>而且這些因素，<br>經常不是單獨發生。</strong></div><div class="f-completed-note">✓ 家庭相簿已完成</div><div class="f-next-row"><button class="primary-button" id="factorsReturn">完成學習</button></div>`;}
  function bindPosterControls(){
    if(state.stage!=='poster')return;
    const total=D.posterStories.length;
    const turn=delta=>{
      const nextPage=Math.min(Math.max((state.posterPage||0)+delta,0),total-1);
      if(nextPage===state.posterPage)return;
      stopSpeech();
      state.posterPage=nextPage;save();render(false);
      host.querySelector('.f-story-copy')?.classList.add('f-turning');
    };
    host.querySelector('#posterPrev')?.addEventListener('click',()=>turn(-1));
    host.querySelector('#posterNextStory')?.addEventListener('click',()=>turn(1));
    host.querySelectorAll('[data-speak-key]').forEach(button=>button.addEventListener('click',()=>toggleSpeech(button.dataset.speakKey,button.dataset.speakText||'')));
    updateSpeechButtons();
  }
  function render(focus=true){
    if(!mounted)return;
    stopSpeech(false);
    const views={experience,judgment,'first-feedback':firstFeedback,learning,poster,assessment,final};
    host.innerHTML=`<section class="factors-module" data-stage="${state.stage}">${views[state.stage]()}</section>`;
    R6.fill(fillOf());
    enterHint();
    const nextButton=host.querySelector('#factorNext');if(nextButton)nextButton.onclick=()=>{if(E.advance(state)){selected=null;notice='';save();nextButton.disabled=true;const f=fillOf();R6.star(nextButton,f).then(()=>{if(mounted)render();});}};
    /* 第三修改計劃 B4:同一顆按鈕「完成學習」→ 寶物 → 返回 */if(host.querySelector('#factorsReturn'))window.StoryDialog.finishButton(host.querySelector('#factorsReturn'),{backLabel:'返回房間',finish:async()=>{if(callbacks.onFinal)await callbacks.onFinal();},back:()=>callbacks.onReturn()});
    if(state.stage==='experience'){
      const turn=i=>{if(E.visit(state,i)){save();render(false);host.querySelector('.f-story-page').classList.add('f-turning');}};
      host.querySelector('#albumPrevious').onclick=()=>turn(state.page-1);host.querySelector('#albumNextPage').onclick=()=>turn(state.page+1);
      host.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>turn(Number(b.dataset.page)));
      /* 第三修改計劃 H6-1:翻到新的一頁時,長者在共用對話框說出這頁的心裡話;按鈕可再聽一次 */
      host.querySelector('#albumThought').onclick=()=>thought(true);
      if(thoughtPage!==state.page){thoughtPage=state.page;thought(false);}
    }
    if(state.stage==='poster') bindPosterControls();
    host.querySelectorAll('[data-card]:not(:disabled)').forEach(button=>button.onclick=()=>{
      if(suppressClick||state.isProcessing)return;selected=selected===button.dataset.card?null:button.dataset.card;
      host.querySelectorAll('[data-card]').forEach(b=>{const on=b.dataset.card===selected;b.classList.toggle('is-selected',on);b.setAttribute('aria-pressed',String(on));});
      announce(selected?'已選取「'+(D.clues.find(c=>c.id===selected)||D.assessments.find(c=>c.id===selected)).title+'」。請拖到分類區，或點選分類標題。':'已取消選取，可以重新選一張卡片。');
    });
    host.querySelectorAll('[data-place]').forEach(button=>button.onclick=()=>{if(!selected){announce('先選一張卡片，再點選要放入的分類。');return;}placeCard(selected,button.dataset.place);});
    /* ISS-032:選好卡片後,點整個分類框也能放入(原本只有小「＋」按鈕) */
    host.querySelectorAll('[data-drop]').forEach(zone=>zone.addEventListener('click',e=>{if(e.target.closest('[data-place],[data-card]'))return;if(selected&&!state.isProcessing)placeCard(selected,zone.dataset.drop);}));
    if(focus)host.querySelector('h3')?.focus({preventScroll:true});
  }
  let thoughtPage=-1;
  function thought(force){const c=D.clues[state.page],lines=(StoryCopy.room6.album.thoughts||{})[c.id];if(!lines)return;const page=state.page;
    const photo=host.querySelector('.f-photo-frame');photo?.classList.remove('f-remember');void photo?.offsetWidth;photo?.classList.add('f-remember');
    window.StoryDialog.play({mode:'player',position:'bottom',clear:true,className:'r6-thought',lines:lines.map(text=>({who:'player',text}))}).then(()=>{if(mounted&&state.stage==='experience'&&state.page===page)host.querySelector('.f-photo-frame')?.classList.remove('f-remember');});}
  function updateSpeechButtons(){
    host?.querySelectorAll('[data-speak-key]').forEach(button=>{
      const active=button.dataset.speakKey===activeSpeechKey&&!!activeUtterance;
      button.textContent=active?'⏹ 停止朗讀':'🔊 語音朗讀';
      button.classList.toggle('is-speaking',active);
      button.setAttribute('aria-pressed',String(active));
    });
  }
  function stopSpeech(reset=true){
    if(typeof speechSynthesis!=='undefined') speechSynthesis.cancel();
    activeUtterance=null;
    if(reset) activeSpeechKey='';
    updateSpeechButtons();
  }
  function toggleSpeech(key,text){
    if(!text)return;
    if(typeof speechSynthesis==='undefined'||typeof SpeechSynthesisUtterance==='undefined'){
      announce('目前瀏覽器不支援語音朗讀功能。');return;
    }
    if(activeUtterance&&activeSpeechKey===key){stopSpeech();return;}
    stopSpeech();
    const utter=new SpeechSynthesisUtterance(text);
    activeUtterance=utter;activeSpeechKey=key;
    utter.lang='zh-TW'; utter.rate=0.95; utter.pitch=1; utter.volume=1;
    utter.onend=()=>{activeUtterance=null;activeSpeechKey='';updateSpeechButtons();};
    utter.onerror=()=>{activeUtterance=null;activeSpeechKey='';updateSpeechButtons();};
    updateSpeechButtons();
    speechSynthesis.speak(utter);
  }
  function announce(text){notice=text;const el=host.querySelector('.f-message')||host.querySelector('.f-assessment-feedback');if(el&&!(state.stage==='assessment'&&state.quizPhase==='feedback'))el.textContent=text;}
  function spark(category){const zone=host.querySelector(`[data-drop="${category}"]`);if(!zone)return;zone.classList.add('f-landed');for(let i=0;i<5;i++){const el=document.createElement('span');el.className='f-spark';el.textContent=i%2?'✧':'✨';el.style.setProperty('--i',i);zone.appendChild(el);}later(()=>zone.querySelectorAll('.f-spark').forEach(el=>el.remove()),700);}
  function placeCard(id,category){
    const result=E.place(state,id,category);if(result.reason==='blocked')return;
    if(state.stage==='judgment')AchievementSystem.learning.judgmentBatch('depression','album',id,result.ok,D.clues.map(c=>c.id));
    if(state.stage==='assessment'&&result.ok&&state.assessment.length===D.assessments.length)AchievementSystem.learning.assessment('depression','album',true,{classified:state.assessment.slice()});
    selected=null;
    if(result.ok){notice='✧ 線索已放好。';save();render(false);spark(category);}
    else{
      const card=host.querySelector(`[data-card="${id}"]`);card?.classList.add('f-bounce');
      host.querySelectorAll('[data-card],[data-place]').forEach(b=>b.disabled=true);save();
      const W=StoryCopy.room6.album.wrong;
      R6.say([W[wrongN++%W.length],result.hint]).then(()=>{if(!mounted)return;E.settle(state);save();render(false);host.querySelector('[data-card]:not(:disabled)')?.focus({preventScroll:true});});
      return;
    }
    later(()=>{E.settle(state);save();render(false);const target=host.querySelector('#factorNext:not([hidden])')||host.querySelector('[data-card]:not(:disabled)');target?.focus({preventScroll:true});},760);
  }
  function bindDrag(){
    const signal=controller.signal;
    host.addEventListener('pointerdown',e=>{
      const button=e.target.closest('[data-card]');if(!button||button.disabled||state.isProcessing||e.button!==0||e.isPrimary===false)return;
      drag={id:button.dataset.card,button,pointerId:e.pointerId,x:e.clientX,y:e.clientY,ghost:null,rect:button.getBoundingClientRect()};button.setPointerCapture(e.pointerId);
    },{signal});
    host.addEventListener('pointermove',e=>{
      if(!drag||e.pointerId!==drag.pointerId)return;
      if(!drag.ghost&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<7)return;
      if(!drag.ghost){const ghost=drag.button.cloneNode(true);ghost.removeAttribute('id');ghost.removeAttribute('data-card');ghost.className='f-card f-drag-ghost';ghost.style.width=drag.rect.width+'px';ghost.setAttribute('aria-hidden','true');ghost.tabIndex=-1;document.body.appendChild(ghost);drag.ghost=ghost;drag.button.classList.add('f-drag-origin');}
      e.preventDefault();drag.ghost.style.left=(e.clientX-Math.min(drag.rect.width/2,160))+'px';drag.ghost.style.top=(e.clientY-35)+'px';
      const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-drop]');host.querySelectorAll('[data-drop]').forEach(z=>z.classList.toggle('is-over',z===target));
    },{signal,passive:false});
    const end=(e,cancel=false)=>{
      if(!drag||e.pointerId!==drag.pointerId)return;const info=drag;drag=null;info.button.classList.remove('f-drag-origin');
      if(info.button.hasPointerCapture(e.pointerId))info.button.releasePointerCapture(e.pointerId);
      host.querySelectorAll('[data-drop]').forEach(z=>z.classList.remove('is-over'));
      if(!info.ghost)return;
      suppressClick=true;later(()=>{suppressClick=false;},0);
      const target=cancel?null:document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-drop]');
      const item=(state.stage==='judgment'?D.clues:D.assessments).find(c=>c.id===info.id);
      if(!target||target.dataset.drop!==item.category){
        const ghost=info.ghost;ghost.style.transition='left .23s ease,top .23s ease,opacity .23s';ghost.style.left=info.rect.left+'px';ghost.style.top=info.rect.top+'px';ghost.style.opacity='.15';later(()=>ghost.remove(),250);
      }else info.ghost.remove();
      if(target)placeCard(info.id,target.dataset.drop);
    };
    host.addEventListener('pointerup',e=>end(e),{signal});host.addEventListener('pointercancel',e=>end(e,true),{signal});
    host.addEventListener('keydown',e=>{if(e.key==='Escape'){drag?.ghost?.remove();drag?.button.classList.remove('f-drag-origin');drag=null;selected=null;host.querySelectorAll('.is-selected').forEach(b=>{b.classList.remove('is-selected');b.setAttribute('aria-pressed','false');});host.querySelectorAll('.is-over').forEach(b=>b.classList.remove('is-over'));}},{signal});
  }
  function dispose(){
    stopSpeech();
    timers.forEach(clearTimeout);timers=[];controller?.abort();drag?.ghost?.remove();drag=null;document.querySelectorAll('.f-drag-ghost').forEach(el=>el.remove());
    if(mounted){E.settle(state);save();host.closest('#missionView')?.classList.remove('factors-active');}mounted=false;selected=null;notice='';suppressClick=false;
  }
  window.FactorsLearning={mount(container,albumState,options){dispose();thoughtPage=-1;host=container;state=albumState;callbacks=options;mounted=true;controller=new AbortController();host.closest('#missionView').classList.add('factors-active');if(state.stage==='experience'){E.visit(state,state.page);save();}render();bindDrag();},dispose};
})();
