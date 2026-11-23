(function(root){
  'use strict';
  const D=root.HearingSocialData,E=root.HearingSocialEngine,KEY='icope.hearing.social.v1';
  let state=E.fresh(),storageFailed=false;
  /* integrated game: fresh state on load; no prior-browser restore */
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){storageFailed=true;}}
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function mount({app,onReturn}){
    let alive=true,timers=new Set(),generation=0,posterDispose=null,storyStart=null,lastSavedElapsed=state.storyElapsed;
    const q=selector=>app.querySelector(selector);
    function rememberStory(){if(storyStart!==null){state.storyElapsed=Math.min(5000,state.storyElapsed+Math.max(0,performance.now()-storyStart));storyStart=null;save();}}
    function stopJobs(){rememberStory();timers.forEach(id=>clearTimeout(id));timers.clear();}
    function later(fn,ms){const token=generation;const id=setTimeout(()=>{timers.delete(id);if(alive&&token===generation)fn();},ms);timers.add(id);return id;}
    function change(stage){state.stage=stage;save();render();window.scrollTo(0,0);}
    const R=root.R4,F=()=>root.StoryCopy.room4.family;
    let pausedStory=false,busy=false;
    const filledOf=()=>state.stage==='experience'?state.scene:state.stage==='judgment'?3:state.stage==='learning'?4:5;
    /* 統一頁首:標題=遊戲名;進度條 5 格(三張情境圖、判斷、衛教) */
    function header(body,sub,hintId,hint){
      app.innerHTML=R.frame({cls:'social-mission',backId:'socialReturn',title:'把對話接回來',sub,content:`${body}<p class="social-storage" role="status" ${storageFailed?'':'hidden'}>目前無法保存第三關紀錄；仍可繼續遊玩，請保持此頁開啟。</p>`});
      document.querySelector('#socialReturn').onclick=onReturn;
      return R.init(hintId,hint,5,filledOf());
    }
    /* 對話出現時暫停第三張的 5 秒計時 */
    R.setPauser({pause(){pausedStory=storyStart!==null;if(pausedStory)stopJobs();},resume(){if(pausedStory&&alive&&state.stage==='experience'&&state.scene===2&&state.storyElapsed<5000)runStory();pausedStory=false;}});
    function render(){
      stopJobs();generation++;posterDispose?.();posterDispose=null;busy=false;
      if(state.stage==='experience')experience();else if(state.stage==='judgment')judgment();else if(state.stage==='learning')learning();else if(state.completed)completed();else{state.stage='learning';learning();}
    }
    function experience(){
      const scene=D.scenes[state.scene];
      header(`<div class="social-story-wrap"><div class="social-story" id="socialStory"><img id="socialStoryImage" src="${scene.image}" alt="${scene.alt}" draggable="false">${scene.bubbles.map(b=>`<div class="story-bubble ${b.side} ${state.scene===2?'ellipsis':''}" style="--bx:${b.x}%;--by:${b.y}%">${b.text}</div>`).join('')}</div></div><div class="story-navigation"><p id="socialStoryStatus" class="sr-only" role="status">正在載入聚會畫面…</p><button class="primary" id="socialNextScene" ${state.scene===2?'hidden':''} disabled>下一張 →</button><button class="secondary" id="socialRetryImage" hidden>重新載入圖片</button></div>`,'','family-scene',F().scene.hint);
      document.querySelector('#socialNextScene').onclick=async()=>{if(state.scene>=2||busy)return;busy=true;const btn=document.querySelector('#socialNextScene'),tk=generation;await R.star(btn,state.scene+1);if(!alive||generation!==tk)return;state.scene++;state.storyElapsed=0;save();render();};
      const image=document.querySelector('#socialStoryImage'),status=document.querySelector('#socialStoryStatus'),token=generation;
      let ready=false;
      function loaded(){if(ready||!alive||generation!==token)return;ready=true;document.querySelector('#socialRetryImage').hidden=true;
        if(state.scene<2){status.textContent='';document.querySelector('#socialNextScene').disabled=false;}
        else if(!document.hidden)runStory();
      }
      image.onload=loaded;
      image.onerror=()=>{if(generation!==token)return;status.textContent='圖片尚未載入。請確認 ZIP 已完整解壓縮，再重新載入。';status.classList.remove('sr-only');document.querySelector('#socialRetryImage').hidden=false;};
      document.querySelector('#socialRetryImage').onclick=()=>{image.src=scene.image;};
      if(image.complete&&image.naturalWidth)loaded();
    }
    function runStory(){
      if(storyStart!==null||document.hidden)return;storyStart=performance.now();lastSavedElapsed=state.storyElapsed;
      function tick(){
        const elapsed=Math.min(5000,state.storyElapsed+Math.max(0,performance.now()-storyStart));
        const story=document.querySelector('#socialStory'),status=document.querySelector('#socialStoryStatus');
        if(!story)return;
        story.classList.toggle('is-overwhelmed',elapsed>=3000&&elapsed<5000);
        status.textContent=elapsed<3000?'大家似乎都在說話……':elapsed<5000?'話題交錯，越來越難跟上……':'想一想：跟不上對話，可能是什麼感受？';
        if(elapsed>=5000){state.storyElapsed=5000;storyStart=null;save();endStory(story);return;}
        if(elapsed-lastSavedElapsed>=1000){const delta=performance.now()-storyStart;state.storyElapsed=Math.min(5000,state.storyElapsed+delta);storyStart=performance.now();lastSavedElapsed=state.storyElapsed;save();}
        later(tick,50);
      }
      tick();
    }
    /* 第三張播完:玩家的心聲改成玩家對話框(文字不變),接著進入判斷 */
    async function endStory(story){
      const token=generation;
      await R.say([F().thought],{who:'player',position:'center'});
      if(!alive||generation!==token)return;
      await R.star(story,3);
      if(alive&&generation===token)change('judgment');
    }
    function judgment(){
      header(`<section class="social-question"><div class="social-question-reminder">「他們到底在說什麼！我以後不來了！」</div><h3>剛才這位長者為什麼可能不想再參加聚會？</h3><div class="social-choices" id="socialChoices">${D.choices.map(c=>`<button data-social-choice="${c.id}"><span>${c.id.toUpperCase()}</span>${c.text}</button>`).join('')}</div></section>`,'','family-judgment',{button:F().judgmentHint});
      const list=document.querySelector('#socialChoices'),token=generation;
      app.querySelectorAll('[data-social-choice]').forEach(button=>button.onclick=async()=>{
        if(busy)return;busy=true;
        const c=D.choices.find(x=>x.id===button.dataset.socialChoice);
        await R.say([c.feedback]);
        if(!alive||generation!==token)return;
        if(c.id==='a'){state.answer='a';save();await R.star(button,4);if(alive&&generation===token)change('learning');}
        else busy=false;
      });
      busy=true;
      R.quiz({list,ask:'剛才這位長者為什麼可能不想再參加聚會？',wonder:F().wonder,alive:()=>alive&&generation===token&&list.isConnected}).then(()=>{if(generation===token)busy=false;});
    }
    function learning(){
      /* 與朋友版 w10_1114 整合:海報改成四幕劇情插圖與圖下台詞,隨逐句衛教同步換幕 */const scenes=[
        {image:'story-social-01.png',caption:'全家聊得開心，阿公卻聽不清楚，只能勉強陪笑。他心想：「大家在笑什麼……怎麼只有我聽不懂？」',line:'跟不上多人對話時，長者可能因為聽得很吃力，而慢慢減少參與。'},
        {image:'story-social-02.png',caption:'孫女拿起湯匙當麥克風，向大家宣布：「我們輪流說話，也要先讓阿公注意到我們喔！」',line:'說話前先讓對方注意到你，再面對面、放慢速度，把長句分短。'},
        {image:'story-social-03.png',caption:'阿嬤：「老！公！你！要！不！要！喝！茶！」阿公：「我是聽不清楚，不是要妳拿擴音器轟炸我啦！」',line:'聽不清楚時可以適度提高音量，但不需要對著對方大喊。'},
        {image:'story-social-04.png',caption:'這次全家輪流說話，還會邀請阿公加入。阿公開心提議：「下次我們吃火鍋！」大家終於真正笑在一起。',line:'微笑或點頭不一定代表聽懂了，可以再溫和確認一次。'}
      ];let stage='read';const lines=['跟不上多人對話時，長者可能因為聽得很吃力，而慢慢減少參與。','說話前先讓對方注意到你，再面對面、放慢速度，把長句分短。','聽不清楚時可以適度提高音量，但不需要對著對方大喊。','微笑或點頭不一定代表聽懂了，可以再溫和確認一次。'];let i=0;
      header(`<div class="learning-layout"><section class="poster-panel phone-story-media r4-story" aria-label="四幕家庭聚會衛教劇情"><div class="poster-space"><div class="image-placeholder" id="imagePlaceholder" hidden><span class="photo-outline"></span><h3>溝通與社交衛教圖片</h3></div><img id="learningImage" src="assets/hearing/story-social-01.png" alt="家庭聚會衛教第1幕"></div><p id="socialEduCaption" class="phone-story-caption r4-story-caption"></p></section><section class="learning-copy edu-stepper"><p class="eyebrow">讓對話更容易繼續</p><h3>把人留在對話裡</h3><p id="socialEduLine" class="edu-line"></p><div class="edu-controls"><button id="socialSpeak" class="secondary edu-speak">聽這一句</button><span id="socialProgress" class="edu-progress"></span><button id="socialNext" class="primary">下一句 ▶</button></div></section></div>`,'全家都在笑，只有我聽不懂……','family-learn',null);
      const render=()=>{q('#socialEduLine').textContent=lines[i];{const s=scenes[i],im=q('#learningImage');if(s&&im){const src='assets/hearing/'+s.image;if(im.getAttribute('src')!==src)im.src=src;im.alt='家庭聚會衛教第'+(i+1)+'幕';q('#socialEduCaption').textContent=s.caption;}}q('#socialProgress').textContent=`${i+1} / ${lines.length}`;if(stage==='read')q('#socialNext').textContent=i===lines.length-1?'完成學習':'下一句 ▶';};q('#socialSpeak').onclick=()=>{try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(lines[i]);u.lang='zh-TW';u.rate=.85;speechSynthesis.speak(u);}catch(e){}};
      /* 第三修改計劃 B4:同一顆按鈕「完成學習」→ 寶物 →「返回聽力房」 */q('#socialNext').onclick=async()=>{if(stage==='back'){onReturn();return;}if(i<lines.length-1){i++;render();return;}if(busy)return;busy=true;const btn=q('#socialNext');btn.disabled=true;await R.star(btn,5);await R.say(F().reward.map(x=>x.text),{position:'center'});if(E.finishLearning(state)){save();root.AchievementSystem.completeActivity('hearing','family');}busy=false;if(!alive)return;stage='back';btn.disabled=false;btn.textContent='返回房間';btn.classList.remove('sd-stage-back');void btn.offsetWidth;btn.classList.add('sd-stage-back');};
      const img=q('#learningImage'),ph=q('#imagePlaceholder');img.onload=()=>{img.hidden=false;ph.hidden=true};img.onerror=()=>{img.hidden=true;ph.hidden=false};if(img.complete&&img.naturalWidth){img.hidden=false;ph.hidden=true}render();
    }
    function completed(){
      header('<section class="social-question"><h3>已完成學習</h3><p>面對面、放慢速度，把長句分短，並溫和確認對方是否理解。</p><div class="actions"><button class="primary" id="socialFinishReturn">返回房間</button></div></section>','把話說清楚，把人留在對話裡','family-done',null);
      q('#socialFinishReturn').onclick=onReturn;
    }
    function visibility(){if(document.hidden){stopJobs();save();}else if(alive)render();}
    document.addEventListener('visibilitychange',visibility);
    save();render();
    return ()=>{alive=false;generation++;stopJobs();posterDispose?.();document.removeEventListener('visibilitychange',visibility);save();};
  }
  root.HearingSocial={mount,getState:()=>state,isComplete:()=>state.completed,hasClue:()=>state.claimed,reset:()=>{state=E.fresh();save();}};
})(window);
