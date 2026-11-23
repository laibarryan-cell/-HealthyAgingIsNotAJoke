(function (root) {
  'use strict';
  if (root.AchievementSystem) return;
  const scriptURL = document.currentScript.src;
  const data = root.AchievementData;
  let room = null, mode = 'game', ui = null, temporary = false;
  function hostWindow() {
    let host = root;
    try { while (host.parent !== host && host.parent.document) host = host.parent; } catch (_) { /* standalone/cross-origin fallback */ }
    return host;
  }
  const host = hostWindow();
  const doc = host.document;
  const STORAGE_KEY = 'icopeAchievementSystem';
  const runtimeKey = Symbol.for('icope.achievement.runtime.v1');
  const runtime = host[runtimeKey] || (host[runtimeKey] = {items:new Map(),pending:new Map(),queue:Promise.resolve(),storageWarning:''});
  const items = runtime.items;
  runtime.rooms ||= {};
  let objects = null;
  const canonical = id => data.aliases?.[id] || id;
  function getRoomProgress(id=room){
    const saved=readSaved();if(saved)for(const item of saved.items)if(!items.has(item.id))items.set(item.id,item);const p={...(saved?.rooms?.[id]||{}),...(runtime.rooms[id]||{})};
    const f=data.flows[id];if(!f)return {};
    if(id==='vision'){
      const valid=p.visionPuzzleVersion===2 && p.part2Completed===true && p.part1Completed===true && p.glassesUsed===true && p.alignmentCompleted===true && p.sliderInstalled===true && p.focusCompleted===true && data.items.filter(i=>i.room==='vision').every(i=>items.has(i.id));
      p.finalChallengeCompleted=valid;p.objectOpened=valid;
      if(!valid)p.passwordDiscovered=false;
    }
    if(id==='hearing'){
      const valid=p.hearingPuzzleVersion===2 && p.hearingPart1Completed===true && p.batteryInstalled===true && p.tapeInstalled===true && p.quietLocationFound===true && p.hearingAidActivated===true && p.hearingPart2Completed===true && data.items.filter(i=>i.room==='hearing').every(i=>items.has(i.id));
      p.finalChallengeCompleted=valid;p.objectOpened=valid;
      if(!valid)p.passwordDiscovered=false;
    }
    if(id==='mobility'){
      const valid=p.mobilityPuzzleVersion===2 && p.mobilityPart1Completed===true && p.padInstalled===true && p.gripInstalled===true && p.levelInstalled===true && p.platformBalanced===true && p.mobilityPart2Completed===true && data.items.filter(i=>i.room==='mobility').every(i=>items.has(i.id));
      p.finalChallengeCompleted=valid;p.objectOpened=valid;
      if(!valid)p.passwordDiscovered=false;
    }
    if(id==='cognition') {
      const valid=p.cognitionPuzzleVersion===3 && p.photoASolved===true && p.photoBSolved===true && p.cognitionPart1Completed===true && p.card8Placed===true && p.card3Placed===true && p.frameInstalled===true && p.alignmentCompleted===true && p.cognitionPart2Completed===true && data.items.filter(i=>i.room==='cognition').every(i=>items.has(i.id));
      p.finalChallengeCompleted=valid; p.objectOpened=valid;
      if(!valid)p.passwordDiscovered=false;
    }
    if(id==='nutrition'){
      const valid=p.nutritionPuzzleVersion===2 && p.guideViewed===true && p.correctCanChosen===true && p.nutritionPart1Completed===true && p.canOpened===true && p.coinUsed===true && p.scratchCompleted===true && p.nutritionPart2Completed===true && data.items.filter(i=>i.room==='nutrition').every(i=>items.has(i.id));
      p.finalChallengeCompleted=valid;p.objectOpened=valid;
      if(!valid)p.passwordDiscovered=false;
    }
    if(id==='depression'){
      const valid=p.depressionPuzzleVersion===2 && p.depressionPart1Completed===true && p.maskCardPlaced===true && p.redFilterUsed===true && p.blueFilterUsed===true && p.digit2Revealed===true && p.digit7Revealed===true && p.depressionPart2Completed===true && data.items.filter(i=>i.room==='depression').every(i=>items.has(i.id));
      p.finalChallengeCompleted=valid;p.objectOpened=valid;
      p.day1RewardGranted=items.has('depression_red_photo_filter');p.day3RewardGranted=items.has('depression_blue_note_filter');p.day5RewardGranted=items.has('depression_diary_key');
      if(!valid)p.passwordDiscovered=false;
    }
    const required=Object.keys(data.requiredActivities[id]||{});
    const completedActivities=[...new Set([...(saved?.rooms?.[id]?.completedActivities||[]),...(runtime.rooms[id]?.completedActivities||[])])].filter(key=>required.includes(key));
    const missingActivities=required.filter(key=>!completedActivities.includes(key));
    return {objectOpened:false,finalChallengeCompleted:false,passwordDiscovered:false,completed:false,...p,completedActivities,missingActivities,allActivitiesCompleted:required.length>0&&missingActivities.length===0,items:Array.from(items.values()).filter(i=>i.room===id).map(i=>i.id),objectState:p.finalChallengeCompleted?'opened':items.has(f.tool)&&items.has(f.target)?'ready':'locked'};
  }

  // Learning results share the existing achievement save and stable activity IDs.
  const learningRooms = {
    cognition:{label:'認知',activities:[
      {id:'kitchen',label:'第2關・廚房生活協助',J:true,A:true},
      {id:'photo',label:'第3關・照片與倒影',J:true,A:true},
      {id:'phone',label:'第4關・約定路線',J:true,A:true}]},
    vision:{label:'視力',activities:[
      {id:'grid',label:'第1關・黃斑部方格表',J:true,A:true},
      {id:'glasses',label:'第2關・老花眼閱讀距離',J:true,A:true},
      {id:'drops',label:'第3關・白內障評量',J:true,A:true}]},
    hearing:{label:'聽力',activities:[
      {id:'phone',label:'第1關・家庭對話觀察',J:true,A:true},
      {id:'tv',label:'第2關・電視音量警鈴',J:true,A:false},
      {id:'noise',label:'第4關・環境噪音溝通',J:false,A:true}]},
    mobility:{label:'行動',activities:[
      {id:'sink',label:'第1關・浴室安全接接樂',J:false,A:true},
      {id:'stand',label:'第2關・扶手記憶翻牌',J:false,A:true},
      {id:'shoes',label:'第4關・安全鞋擊退戰',J:false,A:true}]},
    nutrition:{label:'營養',activities:[
      {id:'scale',label:'第1關・體重變化判斷',J:true,A:true},
      {id:'seasoning',label:'第2關・桌上調味料',J:true,A:true},
      {id:'note',label:'第3關・哭臉便利貼',J:true,A:true}]},
    depression:{label:'憂鬱',activities:[
      {id:'album',label:'第2關・家庭相簿',J:true,A:true}]}
  };
  function learningData(){
    if(!runtime.learning){
      const saved=readSaved()?.extensions?.learning;
      runtime.learning=saved?.version===1?saved:{version:1,rooms:{}};
    }
    runtime.learning.rooms ||= {};
    return runtime.learning;
  }
  function learningActivity(id,activity){
    return learningRooms[id]?.activities.find(a=>a.id===activity);
  }
  function learningEntry(id,activity){
    const records=learningData().rooms;
    records[id] ||= {};
    return records[id][activity] ||= {};
  }
  function recordLearning(id,activity,part,passed,evidence){
    const def=learningActivity(id,activity);
    if(!def || !['J','A'].includes(part) || !def[part] || typeof passed!=='boolean')return false;
    const entry=learningEntry(id,activity),old=entry[part];
    // Judgments and mobility assessments retain the first settled outcome.
    if(old && (part==='J'||id==='mobility'||old.value===1))return true;
    entry[part]={value:passed?1:0,at:new Date().toISOString(),...(evidence===undefined?{}:{evidence})};
    return saveSnapshot();
  }
  function recordLearningBatch(id,activity,key,correct,requiredKeys){
    const def=learningActivity(id,activity);
    if(!def?.J || typeof correct!=='boolean')return false;
    const entry=learningEntry(id,activity);
    if(entry.J)return true;
    entry.firstAnswers ||= {};
    if(!Object.hasOwn(entry.firstAnswers,key))entry.firstAnswers[key]=correct;
    if(Object.values(entry.firstAnswers).includes(false))entry.J={value:0,at:new Date().toISOString()};
    else if(requiredKeys.length && requiredKeys.every(k=>entry.firstAnswers[k]===true))entry.J={value:1,at:new Date().toISOString()};
    return saveSnapshot();
  }
  function learningSummary(id){
    const def=learningRooms[id],records=learningData().rooms[id]||{};
    const result={id,label:def?.label||'',score:0,max:0,J:0,JMax:0,A:0,AMax:0,missing:0,rows:[]};
    for(const a of def?.activities||[]){
      const record=records[a.id]||{},row={label:a.label,score:0,max:0,missing:0};
      for(const part of ['J','A'])if(a[part]){
        const value=record[part]?.value===1?1:0;
        row.max++;row.score+=value;result[part]+=value;result[part+'Max']++;
        if(!record[part]){row.missing++;result.missing++;}
      }
      result.score+=row.score;result.max+=row.max;result.rows.push(row);
    }
    return result;
  }
  function learningTotal(){
    const rooms=Object.keys(learningRooms).map(learningSummary);
    return rooms.reduce((sum,r)=>{
      for(const k of ['score','max','J','JMax','A','AMax','missing'])sum[k]+=r[k];
      return sum;
    },{rooms,score:0,max:0,J:0,JMax:0,A:0,AMax:0,missing:0});
  }
  const learningEscape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const learningRate=(score,max)=>max?(score/max*100).toFixed(1).replace(/\.0$/,'')+'%':'無對應項目';
  function learningHTML(id){
    const all=id===undefined,s=all?learningTotal():learningSummary(id);
    const title=all?'六房學習成果':'學習成果';
    if(!s.max)return '<section class="learning-results"><h3>'+title+'</h3><p>本房間無計分項目</p></section>';
    const rows=all?s.rooms:s.rows;
    const table=rows.map(r=>'<tr><th scope="row">'+learningEscape(r.label)+'</th><td>'+(r.max?r.score+'／'+r.max:'無計分項目')+'</td></tr>').join('');
    const prefix=all?'整體':'';
    return '<section class="learning-results" aria-label="'+title+'"><h3>'+title+'</h3><table><thead><tr><th scope="col">'+(all?'房間':'關卡')+'</th><th scope="col">得分</th></tr></thead><tbody>'+table+'</tbody><tfoot><tr><th scope="row">'+(all?'總成績':'房間合計')+'</th><td>'+s.score+'／'+s.max+'</td></tr></tfoot></table><p>'+prefix+'判斷題答對題數：'+s.J+'／'+s.JMax+' 題</p><p>'+prefix+'有列入評分的題目答對數：'+s.score+'／'+s.max+' 題</p>'+(s.missing?'<p class="learning-pending">尚有 '+s.missing+' 項未記錄；未以通關或道具紀錄推算分數。</p>':'')+'</section>';
  }
  function seedTestLearning(){
    runtime.learning={version:1,simulated:true,rooms:{}};
    let index=0;
    for(const [id,room] of Object.entries(learningRooms)){
      for(const activity of room.activities){
        const entry=learningEntry(id,activity.id);
        for(const part of ['J','A'])if(activity[part]){
          entry[part]={value:(index++%4===0?0:1),at:new Date().toISOString(),evidence:{simulated:true}};
        }
      }
    }
    return saveSnapshot();
  }
  const learning=Object.freeze({
    seedTest:seedTestLearning,
    judgment:(id,activity,correct)=>recordLearning(id,activity,'J',correct),
    assessment:(id,activity,passed,evidence)=>recordLearning(id,activity,'A',passed,evidence),
    judgmentBatch:recordLearningBatch,summary:learningSummary,total:learningTotal,html:learningHTML
  });

  const progressHooks=[];   /* 第三修改計劃 B1:物品版面共用層(puzzle-ui.js)用來偵測「這一步成功了」 */
  function updateProgress(id,patch){runtime.rooms[id]={...getRoomProgress(id),...patch};const ok=saveSnapshot();progressHooks.forEach(f=>{try{f(id,patch);}catch(_){}});return ok;}
  // Single authoritative table: completed W5 activities -> formal edition collectible IDs.
  // Do not place psychological day rewards here; those are issued after each reviewed day.
  const activityRewards = Object.freeze({
    vision:{grid:'vision_brass_key',glasses:'vision_glasses',drops:'vision_focus_slider',cane:'vision_fixation_card',pills:'vision_reading_box'},
    mobility:{sink:'mobility_screwdriver',stand:'mobility_safety_box',shower:'mobility_anti_slip_pad',shoes:'mobility_shoe_grip',medkit:'mobility_level_gauge'},
    nutrition:{scale:'nutrition_guide_card',seasoning:'nutrition_can_opener',food:'nutrition_can_b',note:'nutrition_can_a',supplement:'nutrition_coin'},
    hearing:{phone:'hearing_recorder',tv:'hearing_battery',family:'hearing_family_tape',noise:'hearing_park_map',medicine:'hearing_hearing_aid'},
    cognition:{bedroom:'cognition_key',kitchen:'cognition_alignment_frame',photo:'cognition_memory_box',phone:'cognition_number_card_8',medicine:'cognition_number_card_3'},
    depression:{album:'depression_diary',medicine:'depression_support_mask_card',tablet:'depression_diary_key'}
  });
  function awardCompletedActivity(id,activity){
    const itemId=activityRewards[id]?.[activity];
    if(!itemId)return;
    // obtainItem deduplicates persisted, queued and currently pending awards.
    void obtainItem(itemId).catch(error=>root.console.warn('Activity reward:',id,activity,error));
  }
  function restoreCompletedRewards(id){
    const progress=getRoomProgress(id);
    for(const activity of progress.completedActivities||[])awardCompletedActivity(id,activity);
  }
  function completeActivity(id,activity){
    if(!Object.hasOwn(data.requiredActivities[id]||{},activity))return false;
    const p=getRoomProgress(id);
    if(p.completedActivities.includes(activity)){awardCompletedActivity(id,activity);return true;}
    const persisted=updateProgress(id,{completedActivities:[...p.completedActivities,activity]});
    awardCompletedActivity(id,activity);
    return persisted;
  }
  function canRevealPassword(id=room){
    const p=getRoomProgress(id),f=data.flows[id];
    return !!(f && p.allActivitiesCompleted && p.finalChallengeCompleted && items.has(f.tool) && items.has(f.target));
  }
  function revealPassword(id=room){
    if(!canRevealPassword(id))return false;
    const p=getRoomProgress(id);
    if(!p.passwordDiscovered)updateProgress(id,{passwordDiscovered:true,discoveredAt:new Date().toISOString()});
    return true;
  }
  function submitPassword(id,value){
    refreshItems();const p=getRoomProgress(id);
    if(!data.flows[id] || (!data.allowManualPasswordBypass && !canRevealPassword(id)) || String(value).trim()!==data.flows[id].password)return {correct:false,message:'密碼不正確，再看看你在收集系統中找到的內容。'};
    const persisted=updateProgress(id,{completed:true,completedAt:p.completedAt||new Date().toISOString()});
    return {correct:true,persisted,message:'密碼正確！房間已完成。'+(persisted?'':runtime.storageWarning)};
  }
  function readSaved() {
    try {
      const raw=root.localStorage.getItem(STORAGE_KEY);
      if(!raw)return {version:1,items:[],extensions:{}};
      const saved=JSON.parse(raw);
      if(saved.version!==1 || !Array.isArray(saved.items))throw new Error('不相容的物品存檔');
      const unique=new Map();
      for(const entry of saved.items){
        const item=normalizeItem(entry);
        unique.set(item.id,{...item,obtainedAt:typeof entry.obtainedAt==='string'?entry.obtainedAt:new Date().toISOString()});
      }
      return {...saved,items:Array.from(unique.values())};
    }catch(_){runtime.storageWarning='物品紀錄目前無法讀取；本次取得仍會保留於此頁，原存檔不會被覆寫。';return null;}
  }
  function refreshItems() {
    const saved=readSaved();
    if(saved)for(const item of saved.items)if(!items.has(item.id))items.set(item.id,item);
  }
  function saveSnapshot() {
    const saved=readSaved();
    if(!saved)return false;
    for(const item of saved.items)if(!items.has(item.id))items.set(item.id,item);
    try{
      root.localStorage.setItem(STORAGE_KEY,JSON.stringify({...saved,extensions:{...saved.extensions,learning:runtime.learning||saved.extensions?.learning},version:1,items:Array.from(items.values()),rooms:Object.fromEntries(Object.keys(data.rooms).map(id=>{const p={objectOpened:false,finalChallengeCompleted:false,passwordDiscovered:false,completed:false,...(saved.rooms?.[id]||{}),...(runtime.rooms[id]||{})};const f=data.flows[id];const completedActivities=[...new Set([...(saved.rooms?.[id]?.completedActivities||[]),...(runtime.rooms[id]?.completedActivities||[])])].filter(key=>Object.hasOwn(data.requiredActivities[id]||{},key));return [id,{...p,completedActivities,missingActivities:Object.keys(data.requiredActivities[id]||{}).filter(key=>!completedActivities.includes(key)),allActivitiesCompleted:Object.keys(data.requiredActivities[id]||{}).every(key=>completedActivities.includes(key)),items:Array.from(items.values()).filter(i=>i.room===id).map(i=>i.id),objectState:p.finalChallengeCompleted?'opened':items.has(f.tool)&&items.has(f.target)?'ready':'locked'}]}))}));
      runtime.storageWarning='';
      host.dispatchEvent(new host.CustomEvent('icope:items-updated'));
      return true;
    }catch(_){runtime.storageWarning='目前無法儲存物品；本次取得仍可查看，關閉頁面後可能遺失。';return false;}
  }
  async function persistItems() {
    if(root.navigator.locks?.request){try{return await root.navigator.locks.request(STORAGE_KEY,saveSnapshot);}catch(_){/* file URLs / blocked locks */}}
    return saveSnapshot();
  }
  function onStorage(event){if(event.key===STORAGE_KEY){refreshItems();if(ui?.panel.open && !objects?.active)renderPanel();}}
  function onItemsUpdated(){if(ui?.panel.open && !objects?.active)renderPanel();}
  root.addEventListener('storage',onStorage);
  host.addEventListener('icope:items-updated',onItemsUpdated);
  function node(tag, className, text) {
    const element = doc.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function visible(element) {
    if (!element || !element.isConnected) return false;
    for (let current = element; current; current = current.parentElement) {
      const style = current.ownerDocument.defaultView.getComputedStyle(current);
      if (current.hidden || style.display === 'none' || style.visibility === 'hidden') return false;
    }
    return true;
  }
  function activeFrame() {
    let current = root;
    try {
      while (current !== host) {
        if (!visible(current.frameElement)) return false;
        current = current.parent;
        if (Array.from(current.document.querySelectorAll('dialog[open], [role="dialog"][aria-modal="true"]')).some(visible)) return false;
      }
    } catch (_) { return false; }
    return true;
  }
  function syncUI() {
    if (!ui) return;
    if (!activeFrame()) activeAward?.cancel();
    const show = activeFrame() && ((!objects?.active && mode === 'room') || temporary);
    if (ui.button.hidden !== !show) ui.button.hidden = !show;
    ui.button.disabled = mode !== 'room' || temporary;
    ui.button.setAttribute('aria-hidden', String(!show));
    if (!activeFrame() || mode !== 'room') close();
  }
  function mount() {
    if (ui) return;
    const portal = node('div');
    portal.dataset.achievementHost = room;
    portal.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none;';
    doc.body.append(portal);
    const shadow = portal.attachShadow({mode:'open'});
    const link = node('link'); link.rel = 'stylesheet'; link.href = new URL('achievement.css?v=20261118', scriptURL).href;
    const button = node('button', 'as-button');
    button.type = 'button'; button.setAttribute('aria-label', '開啟'+data.rooms[room]+'物品');
    button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-expanded', 'false');
    const bag=node('img','as-bag');bag.src=new URL('assets/inventory.svg',scriptURL).href;bag.alt='';button.append(bag,node('span','as-button-label','物品'));
    const panel = node('dialog', 'as-panel'); panel.setAttribute('aria-labelledby', 'as-title');
    const header = node('header', 'as-header');
    const title = node('h2', '', '目前物品'); title.id = 'as-title';
    const closeButton = node('button', 'as-close', '×');closeButton.type='button';closeButton.setAttribute('aria-label','關閉物品面板');
    header.append(title, closeButton);
    const content = node('div', 'as-content');
    panel.append(header,content);
    const live = node('p','as-sr');live.setAttribute('role','status');live.setAttribute('aria-live','polite');
    shadow.append(link,button,panel,live);
    ui={portal,shadow,button,panel,content,title,live};
    objects=root.AchievementObjects.create({data,ui,node,itemPicture,room,host,hasItem:id=>items.has(canonical(id)),getProgress:()=>getRoomProgress(room),reveal:()=>revealPassword(room),update:patch=>updateProgress(room,patch),sync:syncUI,render:renderPanel,close});
    button.addEventListener('click',open); closeButton.addEventListener('click',close);
    /* A11(2026-11-18 晚,只加提示不改物品邏輯):拿到新物品 → 物品鈕跳一下並顯示紅點數字;打開面板後清掉 */
    const newDot=node('span','as-newdot');newDot.hidden=true;button.append(newDot);let seenItems=items.size;
    host.addEventListener('icope:items-updated',()=>{const n=items.size-seenItems;if(n>0){newDot.textContent=String(n);newDot.hidden=false;button.classList.remove('as-bump');void button.offsetWidth;button.classList.add('as-bump');}else if(n<0)seenItems=items.size;});
    button.addEventListener('click',()=>{seenItems=items.size;newDot.hidden=true;});
    /* 第三修改計劃 B1:物品謎題統一成房間一小遊戲的版面 + 動畫(共用一份,不改各房玩法) */
    const attachUI=()=>{try{root.AchievementPuzzleUI.attach({ui,room,data,node,getProgress:()=>getRoomProgress(room),onProgress:f=>progressHooks.push(f),cssURL:new URL('puzzle-skin.css',scriptURL).href});}catch(e){root.console.warn('puzzle-ui',e);}};
    if(root.AchievementPuzzleUI)attachUI();else{const sc=root.document.createElement('script');sc.src=new URL('puzzle-ui.js',scriptURL).href;sc.onload=attachUI;root.document.head.append(sc);}
    panel.addEventListener('close',()=>{objects?.cancel();button.setAttribute('aria-expanded','false');syncUI();});
    panel.addEventListener('click',event=>{if(event.target===panel){const r=panel.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}});
    // Parent documents may hide a room iframe without unloading it.
    let current=root;
    while(current!==host){current=current.parent;const observer=new current.MutationObserver(syncUI);observer.observe(current.document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','style','open']});observers.push(observer);}
  }
  const observers=[];
  const sectionRenderers = new Map([['items',renderItems]]);
  let activeSection='items';
  function renderItems(container) {
    const owned=Array.from(items.values()).filter(item=>item.room===room);
    const catalog=data.items.filter(item=>item.room===room);
    const known=new Set(owned.map(item=>item.id));
    const locked=catalog.filter(item=>!known.has(item.id));
    const summary=node('p','as-summary','已取得 '+owned.length+' 件物品');container.append(summary);
    const progress=getRoomProgress(room);container.append(node('p','as-summary','已完成關卡 '+progress.completedActivities.length+'／'+Object.keys(data.requiredActivities[room]).length));
    if(!owned.length)container.append(node('p','as-empty','尚未取得任何物品'));
    const grid=node('ul','as-grid');
    for(const saved of owned){
      const item={...saved,...data.items.find(entry=>entry.id===saved.id)};
      const card=node('li','as-item');card.dataset.itemId=item.id;
      card.append(itemPicture(item,'as-item-picture'),node('strong','',item.name),node('span','as-owned','✓ 已取得'));
      if(item.special)objects.decorate(card,item);
      grid.append(card);
    }
    for(const item of locked){
      const card=node('li','as-item as-locked');card.dataset.itemId=item.id;
      card.append(node('span','as-item-picture','🔒'),node('strong','','未取得物品'),node('span','as-owned','尚未收藏'));
      grid.append(card);
    }
    container.append(grid);
  }
  function renderPanel() {
    refreshItems();
    ui.title.textContent=data.rooms[room]+' · 物品';
    ui.content.replaceChildren();
    const sections=data.sections.filter(section=>sectionRenderers.has(section.id));
    if(!sections.some(section=>section.id===activeSection))activeSection='items';
    if(sections.length>1){
      const nav=node('nav','as-sections');nav.setAttribute('aria-label','收藏分類');
      for(const section of sections){const button=node('button','as-section',section.label);button.type='button';button.setAttribute('aria-pressed',String(section.id===activeSection));button.onclick=()=>{activeSection=section.id;renderPanel();};nav.append(button);}
      ui.content.append(nav);
    }
    const content=node('section','as-section-content');content.setAttribute('aria-label',sections.find(s=>s.id===activeSection)?.label||'物品');
    sectionRenderers.get(activeSection)(content,{room,items:Array.from(items.values(),item=>({...item}))});ui.content.append(content);
    if(runtime.storageWarning)ui.content.append(node('p','as-storage-warning',runtime.storageWarning));
  }
  function open() {
    if (!ui || mode !== 'room' || temporary || !activeFrame()) return false;
    renderPanel(); if(!ui.panel.open) ui.panel.showModal();ui.button.setAttribute('aria-expanded','true');return true;
  }
  function close() { objects?.cancel();if(ui?.panel.open)ui.panel.close(); }
  function initRoom(id, options = {}) {
    if (!Object.hasOwn(data.rooms,id)) throw new Error('Unknown room: '+id);
    if (room && room!==id) throw new Error('One room per document');
    room=id;mode='room';root.document.body.dataset.achievementRoom=id;refreshItems();mount();
    if (options.roomSelector) watchRoom(options);
    syncUI();restoreCompletedRewards(id);return api;
  }
  function watchRoom(options) {
    const refresh = () => {
      const overview = root.document.querySelector(options.roomSelector);
      const blockers = options.activitySelector ? Array.from(root.document.querySelectorAll(options.activitySelector)) : [];
      mode = visible(overview) && !blockers.some(visible) ? 'room' : 'game';
      syncUI();
    };
    const observer = new root.MutationObserver(records => {
      if (records.some(record => !record.target.closest?.('[data-achievement-host]'))) refresh();
    });
    observer.observe(root.document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class','style','open']});
    observers.push(observer);refresh();
  }
  const pending = runtime.pending;
  const accepted = new Map();
  let activeAward = null;
  function normalizeItem(input) {
    let value = typeof input === 'string' ? {id:input} : input;
    if(value && canonical(value.id)!==value.id)value={...value,...data.items.find(i=>i.id===canonical(value.id)),id:canonical(value.id)};
    if (!value || typeof value.id !== 'string' || !/^[a-z][a-z0-9_]{1,79}$/.test(value.id)) throw new TypeError('Invalid item id');
    const catalog = data.items.find(item=>item.id===value.id);
    const item = {...catalog,...value,room:value.room || catalog?.room || room};
    if (!Object.hasOwn(data.rooms,item.room) || typeof item.name !== 'string' || !item.name.trim()) throw new TypeError('Item needs a room and name');
    if(catalog && ['cognition_number_card_8','cognition_number_card_3'].includes(item.id)){item.name=catalog.name;item.image=catalog.image;}
    item.name=item.name.trim().slice(0,100);
    if(item.image){const url=new URL(item.image,root.document.baseURI);if(!['http:','https:','file:'].includes(url.protocol))throw new TypeError('Invalid item image URL');item.image=url.href;}
    return {id:item.id,room:item.room,name:item.name,image:item.image||'',icon:item.icon||'▣'};
  }
  function itemPicture(item,className) {
    const wrap=node('span',className);
    if(item.image){const img=node('img');img.src=item.image;img.alt='';img.addEventListener('error',()=>{wrap.replaceChildren(node('span','',item.icon));},{once:true});wrap.append(img);}
    else wrap.textContent=item.icon;
    return wrap;
  }
  function motion(element,frames,options,job) {
    if(!element.animate || job.cancelled)return Promise.resolve();
    const animation=element.animate(frames,{fill:'forwards',...options});job.animations.add(animation);
    return animation.finished.catch(()=>{}).finally(()=>{job.animations.delete(animation);animation.cancel();});
  }
  async function animateItem(item) {
    if(!activeFrame() || root.document.hidden)return;
    close();
    const reduced=host.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const layer=node('div','as-award-stage');layer.setAttribute('role','status');layer.setAttribute('aria-live','polite');layer.dataset.phase='reveal';
    const badge=node('div','as-award');
    const orb=node('div','as-orb');
    for(let i=0;i<3;i++){const ring=node('span','as-ring');ring.style.setProperty('--ring-delay',i*0.22+'s');orb.append(ring);}
    const picture=itemPicture(item,'as-award-picture');orb.append(picture);
    const label=node('div','as-award-label');label.append(node('span','','獲得物品'),node('strong','',item.name));badge.append(orb,label);layer.append(badge);ui.shadow.append(layer);
    const job={cancelled:false,animations:new Set(),layer,cancel(){this.cancelled=true;for(const a of this.animations)a.cancel();this.onCancel?.();}};activeAward=job;
    const onResize=()=>{if(layer.dataset.phase==='flight')job.cancel();};
    host.addEventListener('resize',onResize);
    try {
      await motion(picture,reduced?[{opacity:0},{opacity:1}]:[{transform:'translateY(0)'},{transform:'translateY(-9px)',offset:.5},{transform:'translateY(0)'}],{duration:reduced?900:1100,easing:'ease-in-out'},job);
      if(job.cancelled||!activeFrame())return;
      // B9:寶物放大 + 閃閃發亮 + 「拿取」按鈕,按下後才以星星軌跡飛入背包
      layer.dataset.phase='grab';
      for(let i=0;i<10;i++){const sp=node('span','as-sparkle','✦');const ang=(i/10)*Math.PI*2,rad=(120+(i%3)*22)*Math.min(1,host.innerHeight*.3/240);sp.style.cssText='--sx:'+Math.cos(ang)*rad+'px;--sy:'+Math.sin(ang)*rad+'px;--sd:'+(i*0.17)+'s';orb.append(sp);}
      const grab=node('button','as-grab','拿取');grab.type='button';label.append(grab);
      await new Promise(resolve=>{const done=()=>{grab.disabled=true;resolve();};grab.addEventListener('click',done,{once:true});job.onCancel=resolve;setTimeout(()=>grab.focus(),30);});
      orb.querySelectorAll('.as-sparkle').forEach(x=>x.remove());grab.remove();
      if(job.cancelled||!activeFrame())return;
      temporary=true;syncUI();
      await motion(ui.button,[{opacity:0,transform:'scale(.82)'},{opacity:1,transform:'scale(1)'}],{duration:180},job);
      layer.dataset.phase='flight';
      const from=picture.getBoundingClientRect(),to=ui.button.getBoundingClientRect();
      const dx=(to.left+to.width/2)-(from.left+from.width/2);
      const dy=(to.top+to.height/2)-(from.top+from.height/2);
      const endScale=Math.min(to.width/from.width,to.height/from.height)*.32;
      label.style.visibility='hidden';orb.querySelectorAll('.as-ring').forEach(r=>r.hidden=true);
      const fly=reduced?[{opacity:1},{opacity:0}]:[
        {transform:'translate(0,0) scale(1)',opacity:1},
        {transform:'translate('+dx*.46+'px,'+(dy*.24-Math.abs(dx)*.08)+'px) scale(.7)',offset:.48,opacity:1},
        {transform:'translate('+dx+'px,'+dy+'px) scale('+endScale+')',opacity:.1}
      ];
      const trail=reduced?null:setInterval(()=>{const r=picture.getBoundingClientRect();const t=node('span','as-trail','★');t.style.left=(r.left+r.width/2-8)+'px';t.style.top=(r.top+r.height/2-8)+'px';layer.append(t);t.animate([{opacity:.95,transform:'scale(1)'},{opacity:0,transform:'scale(.2) rotate(120deg)'}],{duration:520}).onfinish=()=>t.remove();},32);
      try{await motion(picture,fly,{duration:reduced?160:900,easing:'cubic-bezier(.38,.02,.58,1)'},job);}finally{if(trail)clearInterval(trail);}
      picture.hidden=true;
      if(!job.cancelled){layer.dataset.phase='received';await motion(ui.button,reduced?[{filter:'brightness(1.6)'},{filter:'brightness(1)'}]:[{transform:'scale(1)'},{transform:'scale(1.2)',filter:'brightness(1.6)',offset:.45},{transform:'scale(1)',filter:'brightness(1)'}],{duration:300,easing:'ease-out'},job);}
    } finally {
      host.removeEventListener('resize',onResize);job.cancel();layer.remove();activeAward=null;
    }
  }
  async function finishTemporary() {
    if(temporary&&mode==='game'&&activeFrame()){
      const job={cancelled:false,animations:new Set()};await motion(ui.button,[{opacity:1},{opacity:0}],{duration:200},job);
    }
    temporary=false;syncUI();
  }
  let storyLoading=null;
  function loadStoryDialog(){
    if(root.StoryDialog&&root.StoryCopy)return Promise.resolve(true);
    if(storyLoading)return storyLoading;
    const load=name=>new Promise((res,rej)=>{const sc=root.document.createElement('script');sc.src=new URL('../shared/'+name,scriptURL).href;sc.onload=res;sc.onerror=rej;root.document.head.appendChild(sc);});
    storyLoading=load('story-copy.js').then(()=>load('story-art-config.js')).then(()=>load('story-dialog.js')).then(()=>true).catch(()=>{storyLoading=null;return false;});
    return storyLoading;
  }
  function obtainItem(input) {
    let item;try{if(!room)throw new Error('Call initRoom first');item=normalizeItem(input);}catch(error){return Promise.resolve({status:'invalid',error:error.message});}
    refreshItems();
    if(items.has(item.id))return Promise.resolve({status:'already-owned',item:{...items.get(item.id)}});
    if(pending.has(item.id))return pending.get(item.id);
    accepted.set(item.id,item);
    const task=runtime.queue.then(async()=>{
      refreshItems();
      if(items.has(item.id))return {status:'already-owned',item:{...items.get(item.id)}};
      try{await animateItem(item);}catch(error){root.console.warn('Achievement animation fallback:',error);}
      items.set(item.id,{...item,obtainedAt:new Date().toISOString()});
      const persisted=await persistItems();
      ui.live.textContent='已取得'+item.name+(runtime.storageWarning?'。'+runtime.storageWarning:'');
      if(ui.panel.open)renderPanel();
      // Announce the next step only when all required activities AND all five collectibles exist.
      const collected=data.items.filter(entry=>entry.room===item.room).every(entry=>items.has(entry.id));
      const completed=getRoomProgress(item.room).allActivitiesCompleted;
      runtime.instructionsShown ||= new Set();
      if(collected && completed && !runtime.instructionsShown.has(item.room) && !getRoomProgress(item.room).completed){
        runtime.instructionsShown.add(item.room);
        setTimeout(()=>{
          // B11:改用「立繪 + 對話框」提示接下來要做什麼(載入失敗才退回舊對話框)
          loadStoryDialog().then(ok=>{if(!ok)return legacyNotice();
            const c=root.StoryCopy.allCollected;
            return root.StoryDialog.play({npc:c.npc,position:'center',lines:c.lines});
          }).catch(()=>legacyNotice());
        },50);
        function legacyNotice(){
          const d=host.document,notice=d.createElement('dialog');
          notice.setAttribute('aria-label','活動完成後的下一步');
          notice.style.cssText='border:3px solid #b6a476;border-radius:18px;padding:28px;max-width:min(460px,90vw);background:#fff9eb;color:#27443a;box-shadow:0 24px 75px #0008;font:19px/1.75 sans-serif;z-index:2147483647';
          notice.innerHTML='<h2 style="margin:0 0 10px;font-size:25px">✨ 五件成就物品已集滿！</h2><p>你已完成這個房間的所有活動。<strong>還需要取得本房數字密碼，才算正式破關。</strong></p><p>請點擊畫面左下角的「物品／成就系統」，利用已收集的物品完成解謎，取得密碼後，再點選「輸入密碼」。</p><button type="button" style="display:block;margin:15px auto 0;padding:10px 32px;border:0;border-radius:10px;background:#325c49;color:white;font-weight:700;font-size:18px">我知道了</button>';
          d.body.append(notice);notice.querySelector('button').onclick=()=>{notice.close();notice.remove();};
          try{notice.showModal();}catch(e){notice.setAttribute('open','');}
        }
      }
      await finishTemporary();
      return {status:'obtained',persisted,item:{...items.get(item.id)}};
    }).finally(()=>{pending.delete(item.id);accepted.delete(item.id);});
    pending.set(item.id,task);runtime.queue=task.catch(()=>{});return task;
  }
  function copy(value){return JSON.parse(JSON.stringify(value));}
  function relationCheck(id, context = {}) {
    const relation=data.relations.find(entry=>entry.id===id);
    if(!relation)return {id,status:'unknown',ready:false,missing:{items:[],questions:[],achievements:[]}};
    refreshItems();
    const required=relation.requires || {};
    const questionSet=new Set(context.questions || []),achievementSet=new Set(context.achievements || []);
    const missing={
      items:(required.items || []).filter(item=>!items.has(item)),
      questions:(required.questions || []).filter(question=>!questionSet.has(question)),
      achievements:(required.achievements || []).filter(achievement=>!achievementSet.has(achievement))
    };
    const satisfied=Object.values(missing).every(list=>list.length===0);
    return {id,status:!relation.enabled?'disabled':satisfied?'available':'locked',ready:!!relation.enabled&&satisfied,missing};
  }
  const api = Object.freeze({
    initRoom,
    enterRoomMode(){mode='room';syncUI();},
    enterGameMode(){mode='game';syncUI();},
    hasItem(id){refreshItems();return items.has(canonical(id));},
    getRoomProgress,completeActivity,canRevealPassword,submitPassword,learning,
    openObject(id){return objects?.openObject(canonical(id))||false;},
    obtainItem,
    open,close,
    getItemDefinition(id){const item=data.items.find(entry=>entry.id===canonical(id));return item?copy(item):null;},
    getRelationsFor(id){return copy(data.relations.filter(entry=>(entry.requires?.items || []).includes(canonical(id))));},
    checkRelation:relationCheck,
    registerPanelSection(definition,renderer){
      if(!definition || !/^[a-z][a-z0-9_-]*$/.test(definition.id) || typeof renderer!=='function')throw new TypeError('Invalid panel section');
      if(sectionRenderers.has(definition.id))throw new Error('Section already registered');
      data.sections.push({id:definition.id,label:String(definition.label||definition.id)});sectionRenderers.set(definition.id,renderer);
      if(ui?.panel.open)renderPanel();
    },
    getState(){refreshItems();return {room,mode,items:Array.from(items.values(),item=>({...item})),storageWarning:runtime.storageWarning};}
  });
  root.AchievementSystem=api;
  root.addEventListener('pagehide',()=>{
    activeAward?.cancel();
    // A granted reward must survive navigation even if its visual delivery is interrupted.
    for(const item of accepted.values())if(!items.has(item.id))items.set(item.id,{...item,obtainedAt:new Date().toISOString()});
    if(accepted.size)saveSnapshot();
    close();ui?.portal.remove();observers.forEach(o=>o.disconnect());
    root.removeEventListener('storage',onStorage);host.removeEventListener('icope:items-updated',onItemsUpdated);
  });
  root.addEventListener('pageshow',event=>{if(event.persisted)root.location.reload();});
})(window);
