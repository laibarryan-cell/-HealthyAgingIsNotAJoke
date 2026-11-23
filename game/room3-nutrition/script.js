(() => {
  "use strict";

  const STORAGE_KEY = "memoryMaze.room3.completed.v1";
  
  // 保留原活動完成紀錄，並同步至共用關卡進度。
  
  const roomView = document.querySelector("#roomView");
  const missionView = document.querySelector("#missionView");
  const missionContent = document.querySelector("#missionContent");
  const missionTitle = document.querySelector("#missionTitle");
  const missionEyebrow = document.querySelector("#missionEyebrow");
  const stepChip = document.querySelector("#stepChip");
  const returnRoom = document.querySelector("#returnRoom");
  const K = window.StoryKit, C3 = window.StoryCopy.room3;
  const flow = { total: 0, filled: 0 };
  const seenHint = new Set();
  let hintText = null;
  function setFlow(total, filled = 0) { flow.total = total; flow.filled = filled; K.makeBar(stepChip, total); K.setBar(stepChip, filled); }
  async function star(from) { flow.filled = Math.min(flow.total, flow.filled + 1); await K.awardStar(from || missionContent, stepChip, flow.filled); }
  /* 首次進入該畫面時由 NPC 給提示;之後可按「💡 操作提示」重看 */
  async function enterPhase(id, hint) {
    hintText = hint;
    if (seenHint.has(id)) return;
    seenHint.add(id);
    await K.showHint(hint.lines);
  }
  document.querySelector("#hintBtn").addEventListener("click", () => { if (hintText) K.showHint([hintText.button]); });
  const npcSay = (lines, opts) => K.say(lines, opts);
  let activeItem = null;
  let lockReturn = false;
  let timers = [];
  let roomHintsEnabled = true;
  let roomStartedAt = Date.now();
  let elapsedBase = Number(sessionStorage.getItem('gra.room3.elapsed')||'0')||0;
  let clockActive=false;
  let roomClock = null;

  function getElapsedSeconds(){ return elapsedBase+(clockActive?Math.max(0,Math.floor((Date.now()-roomStartedAt)/1000)):0); }
  function pauseClock(){if(clockActive){elapsedBase=getElapsedSeconds();clockActive=false;sessionStorage.setItem('gra.room3.elapsed',String(elapsedBase));}if(roomClock){clearInterval(roomClock);roomClock=null;}renderClock();}
  function formatTime(seconds){ const m=Math.floor(seconds/60), s=seconds%60; return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`; }
  function renderClock(){ const el=document.querySelector("#roomTimer"); if(el) el.textContent=`🕰️ ${formatTime(getElapsedSeconds())}`; }
  function startRoomClock(){if(AchievementSystem.getRoomProgress('nutrition').completed){pauseClock();return;}if(clockActive)return;roomStartedAt=Date.now();clockActive=true;renderClock();roomClock=setInterval(renderClock,1000);}
  function enableRoomHintsAfterDelay() {
    roomHintsEnabled = true;
    document.querySelectorAll(".hotspot:not(.done)").forEach((button) => button.classList.add("is-hinting"));
  }

  function getCompleted() {
    try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); }
    catch { return new Set(); }
  }

  function saveCompleted(set) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  }

  function markComplete(item) {
    AchievementSystem.completeActivity("nutrition",item);
    const completed = getCompleted();
    completed.add(item);
    const reward={seasoning:"nutrition_can_opener",food:"nutrition_can_b"}[item];
    const award = reward ? window.AchievementSystem.obtainItem(reward) : null;
    saveCompleted(completed);
    renderRoomProgress();
    return award;   /* B4:讓「完成學習」按鈕等寶物演出結束再變成「返回廚房」 */
  }

  function renderRoomProgress() {
    const completed = getCompleted();
    document.querySelector("#roomCount").textContent = String(completed.size);
    document.querySelectorAll(".hotspot").forEach((button) => {
      const isDone = completed.has(button.dataset.item);
      button.classList.toggle("done", isDone);
      button.classList.toggle("is-hinting", roomHintsEnabled && !isDone);
    });
  }

  function clearTimers() {
    timers.forEach((id) => { clearTimeout(id); clearInterval(id); });
    timers = [];
  }

  function showRoom() {
    window.CareRPG?.dispose();
    window.FoodLearning?.dispose();
    clearTimers();
    lockReturn = false;
    roomView.hidden = false;
    missionView.hidden = true;
    missionContent.replaceChildren();
    renderRoomProgress();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showMission(title, eyebrow) {
    window.ArtUI?.dialog?.close(true); // 房間進場對話框若還開著,不能一路蓋到任務畫面上(會擋住「下一句」等按鈕)
    roomView.hidden = true;
    missionView.hidden = false;
    missionTitle.textContent = title;
    missionEyebrow.textContent = eyebrow;
    missionContent.replaceChildren();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cloneTemplate(id) {
    const fragment = document.querySelector(id).content.cloneNode(true);
    missionContent.appendChild(fragment);
  }

  returnRoom.addEventListener("click", () => {
    if (lockReturn) {
      npcSay([C3.line.lockBack]);
      return;
    }
    showRoom();
  });

  window.addEventListener("message", (event) => {
    const data = event.data || {};
    if(data.type === "memoryMaze:room3Resume"){
      startRoomClock();
      showRoom();
    }
  });

  document.querySelector("#exitRoom").addEventListener("click", () => {
    pauseClock();window.parent.postMessage({type:"memoryMaze:room3Return", completed:AchievementSystem.getRoomProgress("nutrition").completed===true, elapsedSeconds:getElapsedSeconds()}, "*");
  });
  function openCodeDialog(){
    const completed = getCompleted();
    const overlay = document.querySelector("#codeOverlay");
    const summary = document.querySelector("#clueSummary");
    const input = document.querySelector("#codeInput");
    const feedback = document.querySelector("#codeFeedback");
    if(summary) summary.textContent="請輸入在收集系統中發現的本房密碼。";
    if(input) input.value = "";
    if(feedback){ feedback.hidden = true; feedback.className = "feedback-panel"; feedback.textContent = ""; }
    if(overlay) overlay.hidden = false;
    setTimeout(()=>input?.focus(), 0);
  }
  function submitRoom3Code(){
    const completed = getCompleted();
    const input = document.querySelector("#codeInput");
    const feedback = document.querySelector("#codeFeedback");
    if(!feedback) return;
    feedback.hidden = false;
    const result=AchievementSystem.submitPassword('nutrition',input?.value||'');
    if(!result.correct){feedback.className='feedback-panel';feedback.textContent=result.message;return;}
    if(roomClock){ clearInterval(roomClock); roomClock = null; }
    feedback.className = "feedback-panel correct";
    feedback.innerHTML = `🎉 密碼正確！房間 3「營養」完成。<br>本關時間：<b>${formatTime(getElapsedSeconds())}</b>`;
    pauseClock();setTimeout(()=>{ document.querySelector("#codeOverlay").hidden = true; window.parent.postMessage({type:"memoryMaze:room3Complete", elapsedSeconds:getElapsedSeconds()}, "*"); }, 700);
  }
  document.querySelector("#openCode").addEventListener("click", openCodeDialog);
  document.querySelector("#closeCode").addEventListener("click", () => { document.querySelector("#codeOverlay").hidden = true; });
  document.querySelector("#submitCode").addEventListener("click", submitRoom3Code);
  document.querySelector("#codeInput").addEventListener("keydown", (event) => { if(event.key === "Enter") submitRoom3Code(); });

  document.querySelectorAll(".hotspot").forEach((button) => {
    button.addEventListener("click", () => {
      activeItem = button.dataset.item;
      if (activeItem === "scale") startScaleScene();
      if (activeItem === "seasoning") startMealScene("seasoning");
      if (activeItem === "note") startMealScene("note");
      if (activeItem === "food") showFoodPlaceholder();
      if (activeItem === "supplement") startResourceModule();
    });
  });

  /* 體重計：情境 */
  function startScaleScene() {
    clearTimers();
    lockReturn = false;
    showMission("六個月的體重變化", "體重計線索｜情境");
    setFlow(7, 0);
    cloneTemplate("#scaleSceneTemplate");
    drawDial(70);
    enterPhase("scale", C3.scale.hint);
    const readings = [
      { month: "第 2 月", value: 67, next: "翻到第 4 月並測量" },
      { month: "第 4 月", value: 64, next: "翻到第 6 月並測量" },
      { month: "第 6 月", value: 60, next: "測量完成" }
    ];
    let index = 0;
    const button = document.querySelector("#weighButton");
    const device = document.querySelector(".scale-device");
    button.addEventListener("click", () => {
      if (index >= readings.length) return;
      button.disabled = true;
      device.classList.add("measuring");
      const reading = readings[index];
      document.querySelector("#calendarMonth").textContent = reading.month;
      document.querySelector("#calendarHint").textContent = "正在站上體重計……";
      drawDial(0);
      const timer = setTimeout(async () => {
        device.classList.remove("measuring");
        drawDial(reading.value);
        document.querySelector("#calendarHint").textContent = `本次紀錄：${reading.value} kg`;
        const historyItem = document.querySelectorAll("#weightHistory span")[index + 1];
        historyItem.classList.add("is-recorded");
        historyItem.querySelector("strong").textContent = `${reading.value} kg`;
        document.querySelector("#scaleLive").textContent = `${reading.month}體重為 ${reading.value} 公斤，紀錄完成。`;
        index += 1;
        await star(historyItem);
        if (!button.isConnected) return;
        if (index === readings.length) {
          button.hidden = true;
          await npcSay(C3.scale.measured);
          if (button.isConnected) showJudgment("scale");
        } else {
          button.disabled = false;
          button.textContent = readings[index - 1].next;
        }
      }, 650);
      timers.push(timer);
    });
  }

  const judgmentData = {
    scale: {
      title: "六個月從 70 公斤降到 60 公斤，最需要注意的是什麼？",
      options: [
        "只是數字改變，不需要進一步了解原因",
        "下降約 14.3%，若不是刻意減重，可能有營養不良風險",
        "只要還能走路，體重變化就一定正常",
        "只需要看最後一次體重，不必比較原本體重"
      ], correct: 1,
      right: "判斷正確！體重減少 10 公斤；10 ÷ 70 × 100% 約為 14.3%，已超過 5%。若是非刻意減重，應進一步留意營養與健康狀況。",
      wrong: "再比較月初與第六個月的體重，並想想下降幅度占原體重的百分比。",
      next: () => showEducation("scale")
    },
    seasoning: {
      title: "軟食吃完、硬食幾乎沒吃，而且調味料用了很多，可能代表什麼？",
      options: [
        "可能有咀嚼不便，也可能因味覺改變而偏好重口味",
        "一定只是故意挑食，與身體狀況無關",
        "代表所有軟食都比硬食更健康",
        "只要有吃完一樣食物，就不必留意營養"
      ], correct: 0,
      right: "判斷正確！硬食留下可能是牙口或咀嚼困難；調味料明顯增加也可能和味覺改變有關。這些狀況都可能影響進食量與營養。",
      wrong: "再想想：為什麼軟食能吃完，但硬食只咬一口？又為什麼需要更多調味？",
      next: () => showEducation("seasoning")
    },
    note: {
      title: "每樣餐點都只吃一點，搭配冰箱上的哭臉便利貼，最適合的判斷是什麼？",
      options: [
        "可能食慾下降，也值得關心近期情緒與生活狀況",
        "代表餐點種類太多，所以一定沒有問題",
        "只要桌上仍有食物，就能判斷營養充足",
        "應立刻強迫對方把所有食物吃完"
      ], correct: 0,
      right: "判斷正確！長期情緒低落可能伴隨食慾下降；若每餐都吃得很少，可以溫和關心、陪伴用餐，必要時尋求專業協助。",
      wrong: "不要只看桌上有多少食物，要觀察實際吃下多少，以及近期情緒與生活變化。",
      next: () => showEducation("note")
    }
  };

  async function showJudgment(type) {
    clearTimers();
    lockReturn = false;
    const data = judgmentData[type];
    const titles = { scale: "體重變化判斷", seasoning: "牙口與味覺判斷", note: "情緒與食慾判斷" };
    showMission(titles[type], "玩家判斷");
    cloneTemplate("#judgmentTemplate");
    const page = missionContent.firstElementChild;
    hintText = { button: C3.judgment.hint };
    document.querySelector("#judgmentQuestion").textContent = data.title;
    const list = document.querySelector("#judgmentOptions");
    list.classList.add("sk-drop-list");
    K.dropHide(list);
    data.options.forEach((option, index) => {
      const label = document.createElement("label");
      label.className = "choice-option";
      label.innerHTML = `<input type="radio" name="judgment" value="${index}"><span class="choice-letter">${String.fromCharCode(65 + index)}</span><span>${option}</span>`;
      list.appendChild(label);
    });
    const submit = document.querySelector("#submitJudgment");
    list.addEventListener("change", () => { submit.disabled = false; });
    submit.addEventListener("click", async () => {
      const selected = Number(document.querySelector('input[name="judgment"]:checked')?.value);
      const correct = selected === data.correct;
      AchievementSystem.learning.judgment("nutrition",type,correct);
      submit.disabled = true;
      await npcSay([correct ? data.right : data.wrong]);
      if (!page.isConnected) return;
      if (correct) {
        await star(submit);
        data.next();
      } else {
        list.querySelectorAll("input").forEach((input) => { input.checked = false; });
      }
    });
    // NPC 先念題目 → 選項 A–D 由上往下下拉 → 玩家疑惑
    await StoryDialog.ask({ npc: 1, position: "center", text: data.title });
    if (!page.isConnected) return;
    K.dropShow(list);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (!page.isConnected) return;
    await npcSay([C3.judgment.wonder], { who: "player", clear: true });
  }

  const educationData = {
    scale: {
      title: "用百分比判斷體重下降幅度",
      image: "體重變化",
      lines: ['沒有刻意減重，體重卻持續下降，就值得多留意。','半年內非刻意減輕超過原體重的 5%，可能是營養不良的警訊。','除了體重，也可以一起留意食慾、進食量和生活中的變化。','如果體重持續下降，建議尋求醫療或營養專業人員協助評估。'],
      button: "開始 LINE 體重評量", next: startLineAssessment
    },
    seasoning: {
      title: "牙口與味覺都可能改變進食",
      image: "牙口味覺",
      lines: ['牙口或咀嚼不方便時，可能會避開較硬的食物，讓吃進去的種類和份量變少。','味覺改變時，可能覺得食物沒味道，而加入更多鹽、醬油或調味料。','可以把食材切小、煮軟，並利用天然辛香料增加風味。','先了解吃不下的原因，不要只把它當成挑食。'],
      button: "開始三日照護評量", next: startSeasoningCareAssessment
    },
    note: {
      title: "情緒低落也可能讓食慾下降",
      image: "情緒食慾",
      lines: ['心情不好、孤單或壓力大，有時也會讓人變得比較吃不下。','如果最近常常沒胃口，也可以想想自己的心情是不是和平常不太一樣。','找家人朋友聊聊、一起吃飯，有時能讓用餐變得比較輕鬆。','如果低落和食慾不振持續一段時間，可以主動找專業人員聊聊。'],
      button: "開始三日照護評量", next: startCareAssessment
    }
  };

  // 四幕衛教：圖片與台詞跟著原有逐句衛教同步更新。
  const educationStories = {
    scale: [
      {image:'story-scale-01.png', caption:'阿嬤：你怎麼瘦這麼多？快教我減肥！阿公：可是我根本沒減肥啊！'},
      {image:'story-scale-02.png', caption:'阿嬤：半年瘦了這麼多……這樣真的正常嗎？'},
      {image:'story-scale-03.png', caption:'阿嬤：你連最愛的菜都吃不下了？阿公：最近就是沒胃口嘛……'},
      {image:'story-scale-04.png', caption:'阿嬤：不能只當作減肥成功，我陪你去找專業人員看看！'}
    ],
    seasoning: [
      {image:'story-seasoning-01.png', caption:'兒子：爸！照我的增肌菜單吃！阿公：這雞胸肉是要我練肌肉，還是練牙齒？'},
      {image:'story-seasoning-02.png', caption:'兒子：蛋白質明明很豐富，怎麼越吃越少？阿公：又硬又沒味道，我真的吃不下……'},
      {image:'story-seasoning-03.png', caption:'一段時間後，阿公：咦？這是雞胸肉？怎麼突然這麼好吃！'},
      {image:'story-seasoning-04.png', caption:'兒子：祕訣就是切小、煮軟，再用蔥薑蒜增香！阿公：這才是我吃得下的健身餐！'}
    ],
    note: [
      {image:'story-note-01.png', caption:'阿公：她不在的日子……連最愛的滷肉飯都沒有味道了。'},
      {image:'story-note-02.png', caption:'阿公：今天又是一個人吃飯……不知道她什麼時候才回來。'},
      {image:'story-note-03.png', caption:'阿公：哎呀！這飯怎麼突然變好吃了？孫女：因為有人陪你吃呀！'},
      {image:'story-note-04.png', caption:'阿嬤：我只是去女兒家住幾天，你就搞得像失戀一樣？！阿公：下次要記得告訴我回家的時間啦！'}
    ]
  };

  function speakEducation(text) { try { if (!("speechSynthesis" in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = "zh-TW"; u.rate = 0.85; const voices = speechSynthesis.getVoices?.() || []; const v = voices.find(x => /zh[-_](TW|Hant)/i.test(x.lang)) || voices.find(x => /^zh/i.test(x.lang)); if (v) u.voice = v; speechSynthesis.speak(u); } catch(e) {} }

  function showEducation(type) {
    const data = educationData[type];
    showMission(data.title, "學習重點");
    cloneTemplate("#educationTemplate");
    document.querySelector("#educationTitle").textContent = "";
    document.querySelector("#educationTitle").hidden = true;
    let educationIndex = 0;
    const body = document.querySelector("#educationBody");
    const next = document.querySelector("#educationNext");
    body.innerHTML = `<div class="edu-stepper"><p id="educationLine" class="edu-line" aria-live="polite"></p><div class="edu-controls"><button id="educationSpeak" class="secondary-button edu-speak" type="button">聽這一句</button><span id="educationProgress" class="edu-progress"></span></div></div>`;
    const renderLine = () => {
      document.querySelector("#educationLine").textContent = data.lines[educationIndex];
      document.querySelector("#educationProgress").textContent = `${educationIndex + 1} / ${data.lines.length}`;
      next.textContent = educationIndex === data.lines.length - 1 ? data.button : "下一句 ▶";
      const scene = educationStories[type]?.[educationIndex];
      if (scene) {
        const img = document.querySelector('#educationImage');
        const cap = document.querySelector('#educationStoryCaption');
        const src = `assets/${scene.image}`;
        if (img.getAttribute('src') !== src) img.src = src;
        img.alt = `${data.title}，第 ${educationIndex + 1} 幕`;
        if (cap) { cap.textContent = scene.caption; cap.hidden = false; }
      }
    };
    document.querySelector("#educationSpeak").addEventListener("click", () => speakEducation(data.lines[educationIndex]));
    next.addEventListener("click", () => { if (educationIndex < data.lines.length - 1) { educationIndex += 1; renderLine(); } else data.next(); });
    if (!educationStories[type]) loadEducationImage(data.image);
    else {
      document.querySelector('#educationFallback').hidden = true;
      document.querySelector('#educationImage').onload = () => { document.querySelector('#educationImage').hidden = false; };
      document.querySelector('#educationImage').onerror = () => { document.querySelector('#educationImage').hidden = true; document.querySelector('#educationFallback').hidden = false; };
    }
    renderLine();
  }

  function loadEducationImage(baseName) {
    const image = document.querySelector("#educationImage");
    const fallback = document.querySelector("#educationFallback");
    // 使用 ASCII 檔名避免 ZIP 解壓縮後非 ASCII 檔名編碼不一致而讀不到。
    const educationImageMap = {
      "體重變化": "assets/weight-change.jfif",
      "牙口味覺": "assets/oral-taste.jfif",
      "情緒食慾": "assets/mood-appetite.jfif"
    };
    const preferred = educationImageMap[baseName];
    const candidates = [preferred, ...["png", "PNG", "jfif", "JFIF"].map((ext) => `assets/${baseName}.${ext}`)].filter(Boolean);
    let index = 0;
    document.querySelector("#fallbackTitle").textContent = `${baseName}圖片預留區`;
    document.querySelector("#fallbackText").textContent = `請將「${baseName}.png」或「${baseName}.jfif」放入 assets 資料夾。`;
    image.onload = () => { image.hidden = false; fallback.hidden = true; };
    image.onerror = () => {
      index += 1;
      if (index < candidates.length) image.src = candidates[index];
      else { image.removeAttribute("src"); image.hidden = true; fallback.hidden = false; }
    };
    image.src = candidates[0];
  }

  function startCareAssessment() {
    clearTimers();
    lockReturn = false;
    showMission("阿福伯的三日餐桌", "哭臉便利貼｜照護養成評量", "三日照護");
    window.CareRPGHint = () => K.showHint([C3.care.hint.button]);
    enterPhase("care", C3.care.hint);
    window.CareRPG.mount(missionContent, "oralTaste", () => markComplete("note"), showRoom);
  }

  function startSeasoningCareAssessment() {
    clearTimers();
    lockReturn = false;
    showMission("牙口與味覺的三日餐桌", "桌上調味料｜照護養成評量", "三日照護");
    window.CareRPGHint = () => K.showHint([C3.care.hint.button]);
    enterPhase("care", C3.care.hint);
    window.CareRPG.mount(missionContent, "seasoning", () => markComplete("seasoning"), showRoom);
  }

  function finishSimpleModule(item) {
    showMission("本階段學習完成", "學習完成", "暫無評量與線索");
    missionContent.innerHTML = `<article class="panel clue-card"><p class="eyebrow">${item === "seasoning" ? "桌上調味料" : "哭臉便利貼"}</p><h3>目前內容已閱覽完成</h3><p>這次進度已保存，返回廚房後物件會變成綠框並停止閃爍。</p><button id="simpleReturn" class="primary-button" type="button">完成學習</button></article>`;
    StoryDialog.finishButton(document.querySelector("#simpleReturn"), { finish: async () => markComplete(item), back: showRoom, backLabel:"返回房間" });
  }

  /* 餐桌兩關 */
  function startMealScene(type) {
    clearTimers();
    lockReturn = false;
    const isSeasoning = type === "seasoning";
    showMission(isSeasoning ? "餐桌上的飲食線索" : "吃不下的那一餐", isSeasoning ? "桌上調味料｜情境" : "哭臉便利貼｜情境");
    setFlow(isSeasoning ? 3 : 2, 0);
    cloneTemplate("#mealSceneTemplate");
    renderMealSprites("before");
    const stage = document.querySelector("#mealStage");
    const title = document.querySelector("#mealTitle");
    if (!isSeasoning) title.textContent = "桌上的每樣餐點都準備好了";
    const start = document.querySelector("#startEating");
    const hint = isSeasoning ? C3.meal.hintSeasoning : C3.meal.hintNote;
    // 觀察時間照舊(約三秒),時間到才出現「開始進食」
    (async () => {
      await enterPhase("meal-" + type, hint);
      if (!start.isConnected) return;
      timers.push(setTimeout(() => { start.hidden = false; }, 3000));
    })();
    start.addEventListener("click", () => {
      start.hidden = true;
      stage.classList.add(isSeasoning ? "after-seasoning" : "after-note");
      renderMealSprites(isSeasoning ? "seasoning" : "note");
      const needed = isSeasoning ? new Set(["hard", "seasoning"]) : new Set(["food-pattern"]);
      const found = new Set();
      let busy = false;
      stage.querySelectorAll(".meal-object").forEach((object) => {
        object.addEventListener("click", async () => {
          if (busy) return;
          const kind = object.dataset.kind;
          if (isSeasoning && (kind === "hard" || kind === "seasoning")) {
            if (found.has(kind)) return;
            busy = true;
            found.add(kind);
            stage.querySelectorAll(`[data-kind="${kind}"]`).forEach((el) => el.classList.add("selected"));
            await star(object);
            await npcSay([kind === "hard" ? "找到了：硬食物幾乎沒吃，可能和牙口或咀嚼有關。" : "找到了：調味料用了很多，可能和味覺改變有關。"], { clear: true });
          } else if (!isSeasoning && ["soft", "hard"].includes(kind)) {
            if (found.has("food-pattern")) return;
            busy = true;
            found.add("food-pattern");
            stage.querySelectorAll(".soft-food,.hard-food").forEach((el) => el.classList.add("selected"));
            await star(object);
            await npcSay(["找到了：不分軟硬，每樣都只吃一點，顯示整體食慾可能下降。"], { clear: true });
          } else {
            busy = true;
            object.classList.add("wrong");
            setTimeout(() => object.classList.remove("wrong"), 380);
            await npcSay([kind === "decoy" ? "這是干擾線索。餐具或垃圾較凌亂，不足以說明進食量或營養風險。" : "再比較每一類食物實際吃掉的份量。"], { clear: true });
            busy = false;
            return;
          }
          if ([...needed].every((key) => found.has(key))) {
            await npcSay(C3.meal.toJudge);
            if (stage.isConnected) showJudgment(type);
          } else busy = false;
        });
      });
    });
  }

  /* LINE 評量 */
  const chatCases = [
    { name: "美玲阿姨", avatar: "🌼", color: "#f1b65f", old: 70, now: 60, percent: "14.3", abnormal: true, messages: ["最近整理衣櫃，發現以前的褲子都鬆了。", "我沒有特別減重，這半年從 70 公斤變成 60 公斤。", "我真的是天生苗條體型捏~"] },
    { name: "志明叔叔", avatar: "☕", color: "#76b7b2", old: 60, now: 57, percent: "5.0", abnormal: false, messages: ["早上去市場買了水果，天氣還不錯。", "順便量體重，半年從 60 公斤變成 57 公斤，沒有刻意減重。", "莫名瘦了3kg也太神奇"] },
    { name: "秀蘭奶奶", avatar: "🐈", color: "#c995c7", old: 65, now: 63, percent: "3.1", abnormal: false, messages: ["今天鄰居家的貓又跑來門口曬太陽。", "我翻到紀錄，半年前 65 公斤，現在是 63 公斤。", "什麼都沒做就少2kg...有夠怪的...怪怪的捏"] }
  ];

  function startLineAssessment() {
    showMission("LINE 體重變化評量", "學習評量");
    cloneTemplate("#lineTemplate");
    lockReturn = false;
    enterPhase("line", C3.line.hint);
    const solved = new Set();
    renderContacts();

    function renderContacts() {
      const list = document.querySelector("#contactList");
      list.innerHTML = "";
      chatCases.forEach((person, index) => {
        const available = index === 0 || solved.has(index - 1);
        const button = document.createElement("button");
        button.type = "button";
        button.className = `contact${solved.has(index) ? " done" : ""}`;
        button.disabled = !available || solved.has(index);
        button.innerHTML = `<span class="avatar" style="--avatar:${person.color}">${person.avatar}</span><span class="contact-copy"><strong>${person.name}</strong><small>${solved.has(index) ? "體重判斷已完成" : available ? "有一則新訊息，點擊查看" : "完成上一個對話後解鎖"}</small></span><span class="contact-state">${solved.has(index) ? "✓" : available ? "NEW" : "🔒"}</span>`;
        button.addEventListener("click", () => openChat(index));
        list.appendChild(button);
      });
    }

    function openChat(index) {
      const person = chatCases[index];
      document.querySelector("#lineInbox").hidden = true;
      document.querySelector("#chatRoom").hidden = false;
      document.querySelector("#chatName").textContent = person.name;
      const messages = document.querySelector("#messages");
      messages.innerHTML = "";
      person.messages.forEach((message, messageIndex) => {
        const bubble = document.createElement("div");
        bubble.className = "bubble";
        bubble.textContent = message;
        bubble.style.opacity = "0";
        messages.appendChild(bubble);
        const timer = setTimeout(() => { bubble.style.opacity = "1"; messages.scrollTop = messages.scrollHeight; }, 280 * (messageIndex + 1));
        timers.push(timer);
      });
      const choices = document.querySelector("#replyChoices");
      choices.innerHTML = '<button type="button" data-answer="normal">你的體重變化算正常</button><button type="button" data-answer="abnormal">你的體重變化可能不正常，可以多留意</button>';
      lockReturn = true;
      choices.hidden = true;
      buildScaffold(person, () => { choices.hidden = false; });
      choices.querySelectorAll("button").forEach((button) => button.addEventListener("click", async () => {
        const pickedAbnormal = button.dataset.answer === "abnormal";
        const correct = pickedAbnormal === person.abnormal;
        if (!correct) {
          await npcSay([`再算一次：（${person.old}－${person.now}）÷ ${person.old} × 100%。`]);
          return;
        }
        const boundaryText = person.percent === "5.0" ? "剛好 5.0%，沒有『超過』5%" : `下降約 ${person.percent}%`;
        choices.querySelectorAll("button").forEach((choice) => { choice.disabled = true; });
        solved.add(index);
        lockReturn = false;
        await star(button);
        await npcSay([`答對了！${boundaryText}，依本題條件判斷為${person.abnormal ? "不正常" : "正常"}。`]);
        if (!choices.isConnected) return;
        document.querySelector("#chatRoom").hidden = true;
        document.querySelector("#lineInbox").hidden = false;
        renderContacts();
        if (solved.size === chatCases.length) { AchievementSystem.learning.assessment("nutrition","scale",true,{cases:chatCases.length}); showScaleClue(); }
      }));
      document.querySelector("#chatBack").onclick = () => {
        if (!solved.has(index)) { npcSay([C3.line.lockBack]); return; }
        lockReturn = false;
        document.querySelector("#chatRoom").hidden = true;
        document.querySelector("#lineInbox").hidden = false;
        renderContacts();
      };
    }
  }

  function showScaleClue() {
    lockReturn = false;
    showMission("你找到了體重計線索", "關卡完成");
    missionContent.innerHTML = `<article class="panel clue-card"><p class="eyebrow">三個對話全部完成</p><h3>體重變化學習完成</h3><p>六個月內非刻意體重減輕超過 5%，是值得進一步留意的營養風險訊號。</p><button id="scaleReturn" class="primary-button" type="button">完成學習</button></article>`;
    /* 第三修改計劃 B4:同一顆按鈕「完成學習」→「返回廚房」 */
    StoryDialog.finishButton(document.querySelector("#scaleReturn"), { finish: async () => markComplete("scale"), back: showRoom, backLabel:"返回房間" });
  }

  function showFoodPlaceholder() {
    lockReturn = false;
    showMission("餐桌照護體驗", "營養食物");
    setFlow(3, 0);
    window.FoodLearning.mount(missionContent, () => markComplete("food"), showRoom, { star, hint: enterPhase });
  }

  /* 營養照護資源查詢與 5×5 旋轉路徑 */
  const resourceData = {
    "安南區": [
      { type:"家庭醫學科診所", name:"顏家庭醫學科診所", address:"臺南市安南區安和路五段88號", phone:"06-3565814" },
      { type:"內科診所", name:"榮銘內科診所", address:"臺南市安南區海佃路一段50號", phone:"06-2593107" },
      { type:"衛生所", name:"臺南市安南區衛生所", address:"臺南市安南區仁安路70號", phone:"06-2567406" },
      { type:"醫院", name:"臺南市立安南醫院", address:"臺南市安南區長和路二段66號", phone:"06-3553111" }
    ],
    "北區": [
      { type:"內科診所", name:"陳冠文內科診所", address:"臺南市北區小東路171號", phone:"06-2752887" },
      { type:"內科診所", name:"鄧正鎧內科診所", address:"臺南市北區小東路171號", phone:"06-2752887" },
      { type:"衛生所", name:"臺南市北區衛生所", address:"臺南市北區西華街50號", phone:"06-2252404" },
      { type:"醫院", name:"國立成功大學醫學院附設醫院", address:"臺南市北區勝利路138號", phone:"06-2353535" }
    ]
  };

  const missions = [
    { person:"王奶奶", story:"王奶奶最近食慾變差、體重也慢慢下降。她住在安南區，家人想先找到可執行 ICOPE 評估的家庭醫學科診所，並確認聯絡電話。", conditions:["安南區","家庭醫學科診所","電話"], path:[[2,0],[2,1],[2,2],[1,2],[0,2],[0,3],[0,4],[1,4],[2,4],[3,4],[4,4]], conditionIndexes:[1,5,7], unit:{type:"家庭醫學科診所",name:"顏家庭醫學科診所",district:"安南區",address:"臺南市安南區安和路五段88號",phone:"06-3565814"} },
    { person:"林阿公", story:"林阿公最近吃得少，又有慢性病需要一起評估。他住在安南區，家人希望找可執行 ICOPE 評估的內科診所，並先電話詢問服務內容。", conditions:["安南區","內科診所","電話"], path:[[4,0],[4,1],[3,1],[2,1],[2,2],[2,3],[1,3],[0,3],[0,2],[0,1],[0,0]], conditionIndexes:[2,6,8], unit:{type:"內科診所",name:"榮銘內科診所",district:"安南區",address:"臺南市安南區海佃路一段50號",phone:"06-2593107"} },
    { person:"陳伯伯", story:"陳伯伯近期食慾下降，家人也注意到體重減輕。他住在北區，希望先找可執行 ICOPE 評估的內科診所，確認是否需要進一步的營養或醫療評估。", conditions:["北區","內科診所","電話"], path:[[0,0],[0,1],[0,2],[1,2],[2,2],[2,3],[2,4],[3,4],[4,4],[4,3],[4,2],[4,1],[4,0]], conditionIndexes:[3,5,9], unit:{type:"內科診所",name:"陳冠文內科診所",district:"北區",address:"臺南市北區小東路171號",phone:"06-2752887"} }
  ];
  const DIR_DELTA = { N:[-1,0], E:[0,1], S:[1,0], W:[0,-1] };
  const OPPOSITE = { N:"S", E:"W", S:"N", W:"E" };
  const ROTATE = ["N","E","S","W"];
  let puzzleIndex = 0;
  let puzzleTiles = [];
  let puzzleSolved = false;

  function startResourceModule() {
    clearTimers();
    lockReturn = false;
    showMission("臺南營養照護資源站", "醫藥盒｜營養與醫療資源", "資源首頁");
    setFlow(3, 0);
    cloneTemplate("#resourceTemplate");
    bindResourceHome();
    enterPhase("res-home", C3.resource.hint);
  }

  function bindResourceHome() {
    document.querySelector("#openQuery").addEventListener("click", showResourceQuery);
    document.querySelector("#openPuzzle").addEventListener("click", () => startPuzzle(0));
    document.querySelectorAll(".resource-home-button").forEach((button) => button.addEventListener("click", showResourceHome));
    document.querySelector("#closeUnitDialog").addEventListener("click", () => { document.querySelector("#unitDialog").hidden = true; });
    document.querySelector("#unitDialog").addEventListener("click", (event) => { if (event.target.id === "unitDialog") event.currentTarget.hidden = true; });
  }

  function showResourceSection(id) {
    ["resourceHome","queryStep","puzzleStep","puzzleResult","resourceFinal"].forEach((sectionId) => {
      document.querySelector(`#${sectionId}`).hidden = sectionId !== id;
    });
  }

  function showResourceHome() {
    showResourceSection("resourceHome");
    hintText = C3.resource.hint;
  }

  function showResourceQuery() {
    showResourceSection("queryStep");
    hintText = C3.resource.hint;
    const districts = document.querySelector("#districts");
    districts.hidden = false;
    districts.innerHTML = "";
    document.querySelector("#unitArea").hidden = true;
    Object.entries(resourceData).forEach(([district, units]) => {
      const button = document.createElement("button");
      button.type = "button"; button.className = "district-card";
      button.innerHTML = `<span>◆</span><strong>${district}</strong><small>${units.length} 個示範單位</small>`;
      button.addEventListener("click", () => renderUnits(district));
      districts.appendChild(button);
    });
    document.querySelector("#changeDistrict").onclick = () => { document.querySelector("#unitArea").hidden = true; districts.hidden = false; };
  }

  function renderUnits(district) {
    document.querySelector("#districts").hidden = true;
    document.querySelector("#unitArea").hidden = false;
    document.querySelector("#districtName").textContent = district;
    const cards = document.querySelector("#unitCards");
    cards.innerHTML = "";
    resourceData[district].forEach((unit) => {
      const button = document.createElement("button");
      button.type = "button"; button.className = "unit-card";
      button.innerHTML = `<span class="unit-badge">${unit.type}</span><strong>${unit.name}</strong>`;
      button.addEventListener("click", () => showUnitDialog(district, unit));
      cards.appendChild(button);
    });
  }

  function showUnitDialog(district, unit) {
    document.querySelector("#unitDetail").innerHTML = `<span class="unit-badge">${unit.type}</span><h3>${unit.name}</h3><dl><div><dt>區域</dt><dd>${district}</dd></div><div><dt>地址</dt><dd>${unit.address}</dd></div><div><dt>電話</dt><dd>${unit.phone}</dd></div></dl><p>此單位列於 115 年臺南市 ICOPE 評估單位清單。本模組僅用於營養風險情境的資源查找練習，不代表該院所一定設有營養門診；實際服務、科別與時間仍應先向院所確認。</p>`;
    document.querySelector("#unitDialog").hidden = false;
  }

  function directionBetween(a, b) {
    const dr = b[0] - a[0], dc = b[1] - a[1];
    return dr === -1 ? "N" : dc === 1 ? "E" : dr === 1 ? "S" : "W";
  }

  function shapeForSides(sides) {
    if (sides.length === 1) return { shape:"cap", rot:ROTATE.indexOf(sides[0]) };
    const set = new Set(sides);
    if (set.has("N") && set.has("S")) return { shape:"straight", rot:0 };
    if (set.has("E") && set.has("W")) return { shape:"straight", rot:1 };
    const corners = [["N","E"],["E","S"],["S","W"],["W","N"]];
    return { shape:"corner", rot:corners.findIndex((pair) => pair.every((side) => set.has(side))) };
  }

  function buildMissionTiles(mission) {
    const tiles = [];
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        tiles.push({ row, col, shape:(row + col) % 3 === 0 ? "corner" : "straight", rot:(row * 2 + col + 1) % 4, role:"normal", label:"" });
      }
    }
    mission.path.forEach((coord, index) => {
      const sides = [];
      if (index > 0) sides.push(directionBetween(coord, mission.path[index - 1]));
      if (index < mission.path.length - 1) sides.push(directionBetween(coord, mission.path[index + 1]));
      const spec = shapeForSides(sides);
      const tile = tiles.find((candidate) => candidate.row === coord[0] && candidate.col === coord[1]);
      Object.assign(tile, spec);
      if (index === 0) tile.role = "start";
      else if (index === mission.path.length - 1) tile.role = "end";
      const conditionPosition = mission.conditionIndexes.indexOf(index);
      if (conditionPosition >= 0) { tile.role = "condition"; tile.label = mission.conditions[conditionPosition]; }
      if (tile.role !== "start" && tile.role !== "end") tile.rot = (tile.rot + (index % 2 ? 1 : 2)) % 4;
    });
    return tiles;
  }

  function sidesFor(tile) {
    const bases = tile.shape === "straight" ? ["N","S"] : tile.shape === "corner" ? ["N","E"] : ["N"];
    return bases.map((side) => ROTATE[(ROTATE.indexOf(side) + tile.rot) % 4]);
  }

  function startPuzzle(index) {
    puzzleIndex = index; puzzleSolved = false;
    const mission = missions[index];
    puzzleTiles = buildMissionTiles(mission);
    showResourceSection("puzzleStep");
    document.querySelector("#personName").textContent = mission.person;
    document.querySelector("#missionStory").textContent = mission.story;
    document.querySelector("#missionConditions").innerHTML = mission.conditions.map((condition) => `<div class="condition-chip"><span>◆</span><strong>${condition}</strong></div>`).join("");
    document.querySelector("#conditionStatus").innerHTML = mission.conditions.map((condition) => `<div class="condition-status" data-status="${condition}"><span>○</span>${condition}</div>`).join("");
    renderBoard();
    updateConnectivity();
    enterPhase("res-puzzle", C3.resource.puzzleHint);
  }

  function renderBoard() {
    const board = document.querySelector("#routeBoard");
    board.innerHTML = "";
    puzzleTiles.forEach((tile, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `route-tile ${tile.role}`;
      button.dataset.index = String(index);
      if (tile.role === "start" || tile.role === "end") { button.disabled = true; button.classList.add("fixed"); }
      button.innerHTML = '<span class="route-pipe"><i class="pipe-center"></i><i class="pipe-arm arm-n"></i><i class="pipe-arm arm-e"></i><i class="pipe-arm arm-s"></i><i class="pipe-arm arm-w"></i></span>' + (tile.label ? `<span class="tile-label">${tile.label}</span>` : tile.role !== "normal" ? `<span class="tile-label">${tile.role === "start" ? "需求" : "目標"}</span>` : "");
      paintTile(button, tile);
      button.addEventListener("click", () => {
        if (puzzleSolved) return;
        tile.rot = (tile.rot + 1) % 4;
        paintTile(button, tile);
        updateConnectivity();
      });
      board.appendChild(button);
    });
  }

  function paintTile(element, tile) {
    const pipe = element.querySelector(".route-pipe");
    pipe.className = "route-pipe";
    sidesFor(tile).forEach((side) => pipe.classList.add(`side-${side.toLowerCase()}`));
  }

  function updateConnectivity() {
    const mission = missions[puzzleIndex];
    const startCoord = mission.path[0];
    const start = puzzleTiles.find((tile) => tile.row === startCoord[0] && tile.col === startCoord[1]);
    const queue = [start];
    const visited = new Set([`${start.row}-${start.col}`]);
    while (queue.length) {
      const tile = queue.shift();
      sidesFor(tile).forEach((side) => {
        const [dr, dc] = DIR_DELTA[side];
        const next = puzzleTiles.find((candidate) => candidate.row === tile.row + dr && candidate.col === tile.col + dc);
        if (!next || !sidesFor(next).includes(OPPOSITE[side])) return;
        const key = `${next.row}-${next.col}`;
        if (!visited.has(key)) { visited.add(key); queue.push(next); }
      });
    }
    document.querySelectorAll(".route-tile").forEach((element, index) => {
      const tile = puzzleTiles[index];
      element.classList.toggle("connected", visited.has(`${tile.row}-${tile.col}`));
    });
    const reached = new Set(puzzleTiles.filter((tile) => tile.role === "condition" && visited.has(`${tile.row}-${tile.col}`)).map((tile) => tile.label));
    mission.conditions.forEach((condition) => {
      const row = document.querySelector(`[data-status="${condition}"]`);
      const yes = reached.has(condition);
      row.classList.toggle("reached", yes);
      row.querySelector("span").textContent = yes ? "✓" : "○";
    });
    const end = mission.path[mission.path.length - 1];
    const endReached = visited.has(`${end[0]}-${end[1]}`);
    document.querySelector("#puzzleHint").textContent = `已接通 ${reached.size}／3 個指定條件${endReached ? "，「目標」已接通" : ""}。`;
    if (endReached && mission.conditions.every((condition) => reached.has(condition))) finishPuzzle();
  }

  function finishPuzzle() {
    if (puzzleSolved) return;
    puzzleSolved = true;
    const mission = missions[puzzleIndex];
    document.querySelectorAll(".route-tile").forEach((button) => { button.disabled = true; });
    document.querySelector("#puzzleHint").textContent = "路徑完整接通！";
    const timer = setTimeout(async () => {
      await star(document.querySelector("#routeBoard"));
      await npcSay([C3.resource.solved(mission.person)]);
      if (!document.querySelector("#routeBoard")) return;
      showResourceSection("puzzleResult");
      const unit = mission.unit;
      document.querySelector("#resultCard").innerHTML = `<span class="unit-badge">${unit.type}</span><h4>${unit.name}</h4><dl><div><dt>區域</dt><dd>${unit.district}</dd></div><div><dt>地址</dt><dd>${unit.address}</dd></div><div><dt>電話</dt><dd>${unit.phone}</dd></div></dl>`;
      const next = document.querySelector("#nextPuzzle");
      next.textContent = puzzleIndex < 2 ? "下一個營養資源任務" : "完成營養照護資源任務";
      next.onclick = () => puzzleIndex < 2 ? startPuzzle(puzzleIndex + 1) : showResourceClue();
    }, 650);
    timers.push(timer);
  }

  function showResourceClue() {
    showResourceSection("resourceFinal");
    /* 第三修改計劃 B4:同一顆按鈕「完成學習」→「返回廚房」 */
    StoryDialog.finishButton(document.querySelector("#resourceReturn"), { finish: async () => markComplete("supplement"), back: showRoom, backLabel:"返回房間" });
    const timer = setTimeout(() => { document.querySelector("#resourceReturn").hidden = false; }, 2800);
    timers.push(timer);
  }


  function drawDial(weight) {
    const svg = document.querySelector("#scaleDial");
    if (!svg.querySelector("#dialNeedle")) {
      let marks = '<circle cx="100" cy="100" r="97" fill="#eee4ce"/>';
      for(let value=0;value<=120;value+=2){
        const angle=(-135+value/120*270)*Math.PI/180;
        const major=value%10===0, outer=88, inner=major?75:81;
        const x=r=>100+Math.sin(angle)*r,y=r=>100-Math.cos(angle)*r;
        marks+=`<line x1="${x(inner)}" y1="${y(inner)}" x2="${x(outer)}" y2="${y(outer)}" stroke="#34332e" stroke-width="${major?2:1}"/>`;
        if(major)marks+=`<text x="${x(63)}" y="${y(63)+4}" text-anchor="middle" font-size="11" fill="#242c29">${value}</text>`;
      }
      svg.innerHTML=marks+'<text x="100" y="147" text-anchor="middle" font-size="13" fill="#53452c">kg</text><g id="dialNeedle"><path d="M97 110 L100 24 L103 110 Z" fill="#bc392b"/></g><circle cx="100" cy="100" r="6" fill="#4b4034"/>';
    }
    svg.querySelector("#dialNeedle").style.transform=`rotate(${-135+weight/120*270}deg)`;
    svg.setAttribute("aria-label",`指針指向 ${weight} 公斤`);
    document.querySelector("#scaleDisplay").textContent=`${weight} 公斤`;
  }

  const foodAtlas=new Image();
  foodAtlas.src="assets/food-atlas.png";
  // 圖集左右烘了深藍邊:先找出實際內容範圍,再在範圍內切 4×3;新圖沒有邊時範圍就是整張圖,行為不變
  let foodAtlasBox=null;
  function atlasContentBox(img){
    const w=img.naturalWidth,h=img.naturalHeight,c=document.createElement("canvas");c.width=w;c.height=h;
    const x=c.getContext("2d",{willReadFrequently:true});x.drawImage(img,0,0);
    const d=x.getImageData(0,0,w,h).data;
    const bar=col=>{let n=0,t=0;for(let y=0;y<h;y+=8){const o=(y*w+col)*4;t++;if(d[o+3]<16||(d[o]<40&&d[o+1]<50&&d[o+2]<90))n++;}return n/t>.9;};
    let l=0,r=w-1;while(l<w/4&&bar(l))l++;while(r>w*3/4&&bar(r))r--;
    return {x:l,w:r-l+1};
  }
  function renderMealSprites(state) {
    const paint=()=>{
      document.querySelectorAll("[data-sprite]").forEach(button=>{
        const i=Number(button.dataset.sprite),canvas=button.querySelector("canvas"),ctx=canvas.getContext("2d");
        const w=canvas.width,h=canvas.height;
        ctx.clearRect(0,0,w,h);
        if(!foodAtlasBox)foodAtlasBox=atlasContentBox(foodAtlas);
        ctx.drawImage(foodAtlas,foodAtlasBox.x+(i%4)*foodAtlasBox.w/4,Math.floor(i/4)*foodAtlas.height/3,foodAtlasBox.w/4,foodAtlas.height/3,0,0,w,h);
        const kind=button.dataset.kind;
        let label="";
        if(state!=="before"&&i<8){
          const finished=state==="seasoning"&&kind==="soft";
          const fraction=finished?0.97:state==="note"?0.12:0.08;
          ctx.save();ctx.beginPath();ctx.ellipse(w*.5,h*.47,w*.32,h*.30,0,0,Math.PI*2);ctx.clip();
          ctx.beginPath();ctx.moveTo(w*.5,h*.47);ctx.arc(w*.5,h*.47,w,-Math.PI/2,-Math.PI/2+Math.PI*2*fraction);ctx.closePath();
          ctx.fillStyle="#ded8c7";ctx.fill();ctx.restore();
          label=finished?"已吃完":"只吃一點";
        }
        if(state==="seasoning"&&kind==="seasoning"){
          ctx.fillStyle="rgba(241,222,181,.78)";ctx.fillRect(w*.35,h*.26,w*.30,h*.28);
          label="已用掉約一半";
        }
        button.querySelector(".portion-note").textContent=label;
      });
    };
    if(foodAtlas.complete&&foodAtlas.naturalWidth)paint();else foodAtlas.onload=paint;
  }


  function buildScaffold(person,onComplete){
    const host=document.querySelector("#calculationScaffold");
    const steps=[
      {title:"① 找出體重紀錄",fields:[["old","半年前體重（公斤）"],["now","現在體重（公斤）"]],hint:"回到訊息找出兩次體重。",valid:v=>v.old===person.old&&v.now===person.now},
      {title:"② 算出減少幾公斤",fields:[["loss","減少重量（公斤）"]],hint:`${person.old} − ${person.now} = ？`,valid:v=>v.loss===person.old-person.now}
    ];
    let step=0;
    function calculator(){
      let expression="";
      host.innerHTML=`<h4>③ 用計算機算下降百分比</h4><p>（原體重 − 目前體重）÷ 原體重 × 100</p><output class="calc-display" aria-live="polite">0</output><div class="calc-keys">${["C","⌫","(",")","7","8","9","÷","4","5","6","×","1","2","3","−","0",".","=","+"].map(k=>`<button type="button" data-key="${k}">${k}</button>`).join("")}</div><p id="calcFeedback" role="status"></p>`;
      const display=host.querySelector("output"),feedback=host.querySelector("#calcFeedback");
      host.querySelectorAll("[data-key]").forEach(button=>button.onclick=()=>{
        const key=button.dataset.key;
        feedback.textContent="";
        if(key==="C")expression="";
        else if(key==="⌫")expression=expression.slice(0,-1);
        else if(key==="="){
          try{
            const result=NutritionCalculator.calculate(expression);
            display.textContent=String(Math.round(result*1000)/1000);
            if(Math.abs(result-Number(person.percent))<=0.051){
              host.innerHTML=`<p>計算結果：下降 <strong>${result.toFixed(1)}%</strong>。請選擇回覆。</p>`;
              onComplete();
            }else npcSay(["再看看原體重與公式，這個結果還不符合訊息中的變化。可以清除後重算。"]);
          }catch(error){feedback.textContent=error.message;}
          return;
        }else if(expression.length<70)expression+=key;
        display.textContent=expression||"0";
      });
    }
    const render=()=>{
      if(step===2){calculator();return;}
      const current=steps[step];
      host.innerHTML=`<h4>${current.title}</h4><p>${current.hint}</p><form><div>${current.fields.map(([id,label])=>`<label>${label}<input required type="number" step="any" min="0" name="${id}" inputmode="decimal"></label>`).join("")}</div><button class="primary-button" type="submit">檢查並繼續</button><p id="calcFeedback" role="status"></p></form>`;
      host.querySelector("form").onsubmit=e=>{
        e.preventDefault();
        const values=Object.fromEntries([...new FormData(e.target)].map(([key,value])=>[key,Number(value)]));
        if(current.valid(values)){step++;render();}
        else npcSay(["請依照訊息再算一次。"]);
      };
    };
    render();
  }

  for(const activity of getCompleted())AchievementSystem.completeActivity("nutrition",activity);
  renderRoomProgress();
  enableRoomHintsAfterDelay();
  startRoomClock();
})();
