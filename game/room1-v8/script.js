(() => {
  "use strict";

  const roomView = document.querySelector("#roomView");
  const visionView = document.querySelector("#visionView");
  const judgmentView = document.querySelector("#judgmentView");
  const educationView = document.querySelector("#educationView");
  const assessmentView = document.querySelector("#assessmentView");
  const presbyopiaView = document.querySelector("#presbyopiaView");
  const presbyopiaJudgmentView = document.querySelector("#presbyopiaJudgmentView");
  const presbyopiaEducationView = document.querySelector("#presbyopiaEducationView");
  const presbyopiaAssessmentView = document.querySelector("#presbyopiaAssessmentView");
  const cataractView = document.querySelector("#cataractView");
  const cataractJudgmentView = document.querySelector("#cataractJudgmentView");
  const cataractEducationView = document.querySelector("#cataractEducationView");
  const cataractAssessmentView = document.querySelector("#cataractAssessmentView");
  const impactRunnerView = document.querySelector("#impactRunnerView");
  const resourceView = document.querySelector("#resourceView");
  const hotspots = [...document.querySelectorAll(".hotspot")];
  const foundCount = document.querySelector("#foundCount");
  const itemOverlay = document.querySelector("#itemOverlay");
  const healthNotebookOverlay = document.querySelector("#healthNotebookOverlay");
  const closeHealthNotebook = document.querySelector("#closeHealthNotebook");
  const closeHealthNotebookTop = document.querySelector("#closeHealthNotebookTop");
  const openNotebookZoom = document.querySelector("#openNotebookZoom");
  const notebookZoomOverlay = document.querySelector("#notebookZoomOverlay");
  const closeNotebookZoom = document.querySelector("#closeNotebookZoom");
  const closeNotebookZoomTop = document.querySelector("#closeNotebookZoomTop");
  const notebookZoomStage = document.querySelector("#notebookZoomStage");
  const notebookZoomCanvas = document.querySelector("#notebookZoomCanvas");
  const notebookZoomImage = document.querySelector("#notebookZoomImage");
  const notebookZoomIn = document.querySelector("#notebookZoomIn");
  const notebookZoomOut = document.querySelector("#notebookZoomOut");
  const notebookZoomReset = document.querySelector("#notebookZoomReset");
  const notebookZoomLabel = document.querySelector("#notebookZoomLabel");
  const dialogOverlay = document.querySelector("#dialogOverlay");
  const closeItem = document.querySelector("#closeItem");
  const backToRoom = document.querySelector("#backToRoom");
  const roomReturnButtons = [...document.querySelectorAll(".room-return")];

  const itemDetails = {
    glasses: {
      icon: "👓",
      title: "老花眼鏡",
      description: "鏡架旁留下了閱讀時看近、看小字的線索。",
      focus: "後續關卡方向：體驗近距離閱讀困難與合適的閱讀距離。"
    },
    drops: {
      icon: "💧",
      title: "眼藥水",
      description: "床頭的眼藥水提醒我們留意眼睛不適與用藥方式。",
      focus: "後續關卡方向：辨認正確點眼藥水步驟與用藥安全。"
    },
    cane: {
      icon: "🦯",
      title: "拐杖",
      description: "椅子旁的拐杖，可能和移動時的平衡與安全有關。",
      focus: "後續關卡方向：觀察居家動線、障礙物與防跌做法。"
    },
    pills: {
      icon: "▦",
      title: "藥盒",
      description: "分類整齊的藥盒，藏著每日服藥順序的線索。",
      focus: "後續關卡方向：練習核對時段、藥袋資訊與避免重複服藥。"
    }
  };

  const foundItems = new Set();
  // B1:勾勾只代表真正通關;重新進房時依成就系統的完成紀錄還原
  window.addEventListener("load", () => {
    try { (AchievementSystem.getRoomProgress("vision").completedActivities || []).forEach((k) => markFound(k)); } catch (e) { /* ignore */ }
  });
  let lastOpenedItem = "grid";
  let glowOn = false;
  window.setInterval(() => {
    glowOn = !glowOn;
    hotspots.forEach((hotspot) => hotspot.classList.toggle("is-bright", glowOn));
  }, 2000);

  function markFound(item) {
    foundItems.add(item);
    document.querySelector(`[data-item="${item}"]`)?.classList.add("is-found");
    foundCount.textContent = String(foundItems.size);
  }


  let notebookZoomScale = 1;

  function applyNotebookZoom() {
    if (notebookZoomImage && notebookZoomCanvas && notebookZoomStage) {
      const stageWidth = notebookZoomStage.clientWidth || 1;
      notebookZoomCanvas.style.width = `${notebookZoomScale * 100}%`;
      notebookZoomImage.style.width = `${100 / notebookZoomScale}%`;
      notebookZoomImage.style.transform = `scale(${notebookZoomScale})`;
      notebookZoomImage.style.transformOrigin = "top left";
      window.requestAnimationFrame(() => {
        const baseHeight = notebookZoomImage.offsetHeight || 1;
        notebookZoomCanvas.style.height = `${baseHeight * notebookZoomScale}px`;
      });
    }
    if (notebookZoomLabel) notebookZoomLabel.textContent = `${Math.round(notebookZoomScale * 100)}%`;
    if (notebookZoomOut) notebookZoomOut.disabled = notebookZoomScale <= 1;
    if (notebookZoomIn) notebookZoomIn.disabled = notebookZoomScale >= 2.6;
  }

  function setNotebookZoom(nextScale) {
    notebookZoomScale = Math.max(1, Math.min(2.6, Math.round(nextScale * 10) / 10));
    applyNotebookZoom();
  }

  function openNotebookZoomOverlay() {
    notebookZoomOverlay.hidden = false;
    setNotebookZoom(1);
    closeNotebookZoom?.focus();
  }

  function closeNotebookZoomOverlay() {
    notebookZoomOverlay.hidden = true;
  }

  function showView(view) {
    [
      roomView,
      visionView,
      judgmentView,
      educationView,
      assessmentView,
      presbyopiaView,
      presbyopiaJudgmentView,
      presbyopiaEducationView,
      presbyopiaAssessmentView,
      cataractView,
      cataractJudgmentView,
      cataractEducationView,
      cataractAssessmentView,
      impactRunnerView,
      resourceView
    ].forEach((candidate) => {
      const active = candidate === view;
      candidate.hidden = !active;
      candidate.classList.toggle("is-active", active);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  hotspots.forEach((hotspot) => {
    hotspot.addEventListener("click", () => {
      const item = hotspot.dataset.item;
      lastOpenedItem = item;
      if (item === "grid") {
        startVisionMission();
        return;
      }
      if (item === "glasses") {
        startPresbyopiaMission();
        return;
      }
      if (item === "drops") {
        startCataractMission();
        return;
      }
      if (item === "cane") {
        startImpactMission();
        return;
      }
      if (item === "pills") {
        startResourceMission();
        return;
      }
      const details = itemDetails[item];
      document.querySelector("#itemIcon").textContent = details.icon;
      document.querySelector("#itemTitle").textContent = details.title;
      document.querySelector("#itemDescription").textContent = details.description;
      document.querySelector("#itemFocus").textContent = details.focus;
      itemOverlay.hidden = false;
      closeItem.focus();
    });
  });

  closeHealthNotebook?.addEventListener("click", closeHealthNotebookOverlay);
  closeHealthNotebookTop?.addEventListener("click", closeHealthNotebookOverlay);
  openNotebookZoom?.addEventListener("click", openNotebookZoomOverlay);
  closeNotebookZoom?.addEventListener("click", closeNotebookZoomOverlay);
  closeNotebookZoomTop?.addEventListener("click", closeNotebookZoomOverlay);
  notebookZoomIn?.addEventListener("click", () => setNotebookZoom(notebookZoomScale + 0.2));
  notebookZoomOut?.addEventListener("click", () => setNotebookZoom(notebookZoomScale - 0.2));
  notebookZoomReset?.addEventListener("click", () => setNotebookZoom(1));

  window.addEventListener("resize", () => {
    if (notebookZoomOverlay && !notebookZoomOverlay.hidden) applyNotebookZoom();
  });
  healthNotebookOverlay?.addEventListener("click", (event) => {
    if (event.target === healthNotebookOverlay) closeHealthNotebookOverlay();
  });
  notebookZoomOverlay?.addEventListener("click", (event) => {
    if (event.target === notebookZoomOverlay) closeNotebookZoomOverlay();
  });

  closeItem.addEventListener("click", () => {
    itemOverlay.hidden = true;
  });

  itemOverlay.addEventListener("click", (event) => {
    if (event.target === itemOverlay) closeItem.click();
  });

  function returnToRoom() {
    cancelHoldTimer();
    cancelPresbyopiaHoldTimer();
    cancelReadingAssessmentTimer();
    cancelReadingReturnTimer();
    cancelCataractDialogueTimer();
    cancelCataractAssessmentTimer();
    stopRunnerGame();
    dialogOverlay.hidden = true;
    showView(roomView);
    document.querySelector(`[data-item="${lastOpenedItem}"]`)?.focus();
  }

  backToRoom.addEventListener("click", returnToRoom);
  roomReturnButtons.forEach((button) => button.addEventListener("click", returnToRoom));

  const scenes = [
    {
      src: "assets/scene-dining.png",
      alt: "餐桌中央有茶壺、橘子與花瓶。",
      title: "餐桌上的茶壺",
      dialogue: ["咦？茶壺的邊緣好像歪掉了……", "我的眼睛好像哪裡怪怪的…"]
    },
    {
      src: "assets/scene-park.png",
      alt: "公園步道中央停著一輛紅色腳踏車。",
      title: "公園裡的腳踏車",
      dialogue: ["腳踏車中央怎麼出現一團暗影？", "我的眼睛好像哪裡怪怪的…"]
    },
    {
      src: "assets/scene-kitchen.png",
      alt: "廚房流理臺中央放著紅色水壺，旁邊有杯子與毛巾。",
      title: "廚房裡的水壺",
      dialogue: ["水壺看起來扭曲，中央也看不清楚。", "我的眼睛好像哪裡怪怪的…"]
    }
  ];

  const visionStage = document.querySelector("#visionStage");
  const gazeDot = document.querySelector("#gazeDot");
  const sceneImage = document.querySelector("#sceneImage");
  const distortionPatch = document.querySelector("#distortionPatch");
  const holdStatus = document.querySelector("#holdStatus");
  const dialogText = document.querySelector("#dialogText");
  const dialogNext = document.querySelector("#dialogNext");
  const resetGaze = document.querySelector("#resetGaze");
  let sceneIndex = 0;
  let gaze = { x: 16, y: 78 };
  let dragging = false;
  let completedCurrentScene = false;
  let holdTimer = null;
  let holdStartedAt = 0;
  let statusTimer = null;
  let dialogueIndex = 0;

  function startVisionMission() {
    sceneIndex = 0;
    renderScene();
    showView(visionView);
    window.setTimeout(() => gazeDot.focus(), 80);
  }

  function renderScene() {
    const scene = scenes[sceneIndex];
    completedCurrentScene = false;
    dialogueIndex = 0;
    cancelHoldTimer();
    sceneImage.src = scene.src;
    sceneImage.alt = scene.alt;
    distortionPatch.style.setProperty("--scene-image", `url("${scene.src}")`);
    setColorProgress(sceneIndex);
    document.querySelector("#panelNumber").textContent = String(sceneIndex + 1).padStart(2, "0");
    document.querySelector("#panelTitle").textContent = scene.title;
    resetGazePosition();
    if (!gridHintSeen.has(sceneIndex)) {
      gridHintSeen.add(sceneIndex);
      const idx = sceneIndex;
      window.setTimeout(() => { if (sceneIndex === idx && !visionView.hidden) showGridHint(idx); }, 350);
    }
  }

  /* ----- C1 顏色進度條 / C2 操作提示(共用對話元件) ----- */
  const gridCopy = window.StoryCopy.room1;
  const gridHintSeen = new Set();
  const colorBar = document.querySelector("#sceneProgress");
  function setColorProgress(filled) {
    [...colorBar.children].forEach((seg, i) => seg.classList.toggle("is-filled", i < filled));
    colorBar.classList.toggle("is-full", filled >= scenes.length);
    colorBar.setAttribute("aria-valuenow", String(filled));
  }
  function showGridHint(idx) {
    return StoryDialog.ask({ npc: 1, position: "bottom", text: gridCopy.gridScenes[idx].hintDialog, buttons: [{ label: "知道了", value: true }] }).then(() => gazeDot.focus());
  }
  document.querySelector("#gridHintButton").addEventListener("click", () => {
    StoryDialog.ask({ npc: 1, position: "bottom", text: gridCopy.gridScenes[sceneIndex].hintButton, buttons: [{ label: "知道了", value: true }] });
  });

  function resetGazePosition() {    gaze = { x: 16, y: 78 };
    updateGaze();
    visionStage.classList.remove("effect-active");
    holdStatus.classList.remove("is-active");
    holdStatus.textContent = "找找中央的物體";
    cancelHoldTimer();
  }

  function updateGaze() {
    visionStage.style.setProperty("--gaze-x", `${gaze.x}%`);
    visionStage.style.setProperty("--gaze-y", `${gaze.y}%`);
    checkCentralTarget();
  }

  function positionFromPointer(event) {
    const rect = visionStage.getBoundingClientRect();
    gaze.x = Math.max(3, Math.min(97, ((event.clientX - rect.left) / rect.width) * 100));
    gaze.y = Math.max(5, Math.min(95, ((event.clientY - rect.top) / rect.height) * 100));
    updateGaze();
  }

  function checkCentralTarget() {
    const isCentral = gaze.x >= 39 && gaze.x <= 61 && gaze.y >= 34 && gaze.y <= 66;
    visionStage.classList.toggle("effect-active", isCentral || completedCurrentScene);
    if (completedCurrentScene) return;
    if (isCentral && !holdTimer) beginHoldTimer();
    if (!isCentral && holdTimer) cancelHoldTimer();
  }

  function beginHoldTimer() {
    holdStartedAt = Date.now();
    holdStatus.classList.add("is-active");
    holdStatus.textContent = "保持視線 3 秒";
    statusTimer = window.setInterval(() => {
      const remaining = Math.max(0, 3 - Math.floor((Date.now() - holdStartedAt) / 1000));
      holdStatus.textContent = remaining > 0 ? `保持視線 ${remaining} 秒` : "觀察完成";
    }, 180);
    holdTimer = window.setTimeout(completeObservation, 3000);
  }

  function cancelHoldTimer() {
    if (holdTimer) window.clearTimeout(holdTimer);
    if (statusTimer) window.clearInterval(statusTimer);
    holdTimer = null;
    statusTimer = null;
    if (!completedCurrentScene) {
      holdStatus?.classList.remove("is-active");
      if (holdStatus) holdStatus.textContent = "找找中央的物體";
    }
  }

  async function completeObservation() {
    const idx = sceneIndex;
    completedCurrentScene = true;
    cancelHoldTimer();
    visionStage.classList.add("effect-active");
    holdStatus.classList.add("is-active");
    holdStatus.textContent = "觀察完成";
    // C1:星星閃光飄向進度條,多填一格顏色
    await StoryDialog.flyStar(gazeDot, colorBar);
    setColorProgress(idx + 1);
    // C3:對話框放在畫面正中間,旁邊有玩家半身形象
    await StoryDialog.play({
      npc: 1, position: "bottom",
      lines: scenes[idx].dialogue.map((text) => ({ who: "player", text }))
    });
    if (idx < scenes.length - 1) {
      sceneIndex = idx + 1;
      renderScene();
      gazeDot.focus();
    } else {
      resetJudgment();
      showView(judgmentView);
      playJudgmentIntro();
    }
  }

  gazeDot.addEventListener("pointerdown", (event) => {
    dragging = true;
    gazeDot.setPointerCapture(event.pointerId);
    positionFromPointer(event);
  });
  gazeDot.addEventListener("pointermove", (event) => {
    if (dragging) positionFromPointer(event);
  });
  gazeDot.addEventListener("pointerup", (event) => {
    dragging = false;
    if (gazeDot.hasPointerCapture(event.pointerId)) gazeDot.releasePointerCapture(event.pointerId);
  });
  visionStage.addEventListener("pointerdown", (event) => {
    if (event.target !== gazeDot) positionFromPointer(event);
  });

  gazeDot.addEventListener("keydown", (event) => {
    const steps = { ArrowLeft: [-3, 0], ArrowRight: [3, 0], ArrowUp: [0, -3], ArrowDown: [0, 3] };
    if (!steps[event.key]) return;
    event.preventDefault();
    gaze.x = Math.max(3, Math.min(97, gaze.x + steps[event.key][0]));
    gaze.y = Math.max(5, Math.min(95, gaze.y + steps[event.key][1]));
    updateGaze();
  });

  resetGaze.addEventListener("click", resetGazePosition);

  /* ===== 方格表模式共用輔助(顏色進度條、提示、選項下拉、星星)===== */
  const copy1 = window.StoryCopy.room1;
  function setBar(bar, filled) {
    [...bar.children].forEach((seg, i) => seg.classList.toggle("is-filled", i < filled));
    bar.classList.toggle("is-full", filled >= bar.children.length);
    bar.setAttribute("aria-valuenow", String(filled));
  }
  async function awardStar(fromEl, bar, filled) {
    await StoryDialog.flyStar(fromEl, bar);
    setBar(bar, filled);
  }
  function showHint(text) {
    return StoryDialog.ask({ npc: 1, position: "bottom", text, buttons: [{ label: "知道了", value: true }] });
  }
  /* 判斷題:NPC 先問 → 選項 A–D 下拉展開 → 玩家疑惑 */
  async function playChoiceIntro(list, c) {
    list.classList.remove("choice-stagger");
    list.classList.add("choice-hidden");
    await StoryDialog.ask({ npc: c.npc, position: "center", text: c.ask });
    list.classList.remove("choice-hidden");
    list.classList.add("choice-stagger");
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
    await StoryDialog.play({ npc: c.npc, position: "bottom", clear: true, lines: [{ who: "player", text: c.playerWonder }] });
  }
  function playChoiceResult(c, correct, explain) {
    return StoryDialog.play({
      npc: c.npc, position: "bottom",
      lines: [{ who: "npc", text: correct ? c.praise : c.retry }, { who: "npc", text: explain }]
    });
  }
  const nextFrame = () => new Promise((resolve) => window.requestAnimationFrame(resolve));

  const presbyopiaScenes = [
    {
      src: "assets/scene-dining.png",
      alt: "餐桌中央有茶壺、橘子與花瓶。",
      title: "餐桌上的茶壺",
      copy: "把照片往上推，看看何時變清楚。",
      dialogue: ["靠得太近時，茶壺的輪廓怎麼看不清楚？", "拿遠一些之後，好像清楚多了。"]
    },
    {
      src: "assets/scene-park.png",
      alt: "公園步道中央停著一輛紅色腳踏車。",
      title: "公園裡的腳踏車",
      copy: "再把照片拉遠，看看是否更清楚。",
      dialogue: ["靠近看還是有點模糊。", "拉遠之後，腳踏車的細節比較容易看清楚。"]
    },
    {
      src: "assets/scene-kitchen.png",
      alt: "廚房流理臺中央放著紅色水壺，旁邊有杯子與毛巾。",
      title: "廚房裡的水壺",
      copy: "最後再試一次，找出共同變化。",
      dialogue: ["最近看東西，好像都要拿遠一點才清楚……", "我的眼睛好像哪裡怪怪的……"]
    }
  ];

  const presbyopiaStage = document.querySelector("#presbyopiaStage");
  const presbyopiaSceneImage = document.querySelector("#presbyopiaSceneImage");
  const distanceBadgeValue = document.querySelector("#distanceBadgeValue");
  const presbyopiaHoldStatus = document.querySelector("#presbyopiaHoldStatus");
  const presbyopiaBar = document.querySelector("#presbyopiaProgress");
  const presbyopiaHintSeen = new Set();
  let presbyopiaSceneIndex = 0;
  let presbyopiaDialogueIndex = 0;
  let completedPresbyopiaScene = false;
  let presbyopiaHoldTimer = null;
  let presbyopiaStatusTimer = null;
  let presbyopiaHoldStartedAt = 0;
  let presbyopiaDistance = 8;
  let presbyopiaDragStartY = 0;
  let presbyopiaDragStartDistance = 8;
  let presbyopiaPointerId = null;
  let presbyopiaDragging = false;

  const PRESBYOPIA_SUITABLE_MIN = 30;
  const PRESBYOPIA_SUITABLE_MAX = 65;

  function startPresbyopiaMission() {
    presbyopiaSceneIndex = 0;
    renderPresbyopiaScene();
    showView(presbyopiaView);
    window.setTimeout(() => presbyopiaStage.focus(), 80);
  }

  function renderPresbyopiaScene() {
    const scene = presbyopiaScenes[presbyopiaSceneIndex];
    completedPresbyopiaScene = false;
    presbyopiaDialogueIndex = 0;
    cancelPresbyopiaHoldTimer();
    presbyopiaSceneImage.src = scene.src;
    presbyopiaSceneImage.alt = scene.alt;
    setBar(presbyopiaBar, presbyopiaSceneIndex);
    document.querySelector("#presbyopiaPanelNumber").textContent = String(presbyopiaSceneIndex + 1).padStart(2, "0");
    document.querySelector("#presbyopiaPanelTitle").textContent = scene.title;
    resetPresbyopiaDrag();
    if (!presbyopiaHintSeen.has(presbyopiaSceneIndex)) {
      presbyopiaHintSeen.add(presbyopiaSceneIndex);
      const idx = presbyopiaSceneIndex;
      window.setTimeout(() => { if (presbyopiaSceneIndex === idx && !presbyopiaView.hidden) showHint(copy1.presbyopia.hints[idx].dialog).then(() => presbyopiaStage.focus()); }, 350);
    }
  }
  document.querySelector("#presbyopiaHintButton").addEventListener("click", () => showHint(copy1.presbyopia.hints[presbyopiaSceneIndex].button));

  function resetPresbyopiaDrag() {
    completedPresbyopiaScene = false;
    presbyopiaDistance = 8;
    presbyopiaPointerId = null;
    presbyopiaDragging = false;
    presbyopiaStage.classList.remove("is-dragging");
    cancelPresbyopiaHoldTimer();
    updatePresbyopiaDistance();
  }

  function updatePresbyopiaDistance() {
    const distance = presbyopiaDistance;
    let blur;
    if (distance < PRESBYOPIA_SUITABLE_MIN) {
      // 太近：由 7px 逐漸降到 0px。
      blur = ((PRESBYOPIA_SUITABLE_MIN - distance) / PRESBYOPIA_SUITABLE_MIN) * 7;
    } else if (distance <= PRESBYOPIA_SUITABLE_MAX) {
      // 適中：最清楚。
      blur = 0;
    } else {
      // 太遠：重新出現較輕微的模糊，最遠約 2px。
      blur = ((distance - PRESBYOPIA_SUITABLE_MAX) / (100 - PRESBYOPIA_SUITABLE_MAX)) * 2;
    }
    const scale = 1.18 - distance * 0.0034;
    const verticalPosition = 72 - distance * 1.18;

    presbyopiaSceneImage.style.setProperty("--presbyopia-blur", `${blur.toFixed(2)}px`);
    presbyopiaSceneImage.style.setProperty("--presbyopia-scale", scale.toFixed(3));
    presbyopiaSceneImage.style.setProperty("--presbyopia-y", `${verticalPosition.toFixed(1)}px`);

    const isSuitable = distance >= PRESBYOPIA_SUITABLE_MIN && distance <= PRESBYOPIA_SUITABLE_MAX;

    if (distance < PRESBYOPIA_SUITABLE_MIN) {
      distanceBadgeValue.textContent = "近";
    } else if (isSuitable) {
      distanceBadgeValue.textContent = "適當";
    } else {
      distanceBadgeValue.textContent = "遠";
    }

    if (completedPresbyopiaScene) return;

    if (presbyopiaDragging) {
      cancelPresbyopiaHoldTimer();
      presbyopiaHoldStatus.classList.remove("is-active");
      presbyopiaHoldStatus.textContent = isSuitable ? "放開照片並停留" : (distance > PRESBYOPIA_SUITABLE_MAX ? "稍微拉近一點" : "繼續往上推");
      return;
    }

    if (isSuitable) {
      if (!presbyopiaHoldTimer) beginPresbyopiaHoldTimer();
    } else {
      cancelPresbyopiaHoldTimer();
      presbyopiaHoldStatus.classList.remove("is-active");
      presbyopiaHoldStatus.textContent = distance > PRESBYOPIA_SUITABLE_MAX ? "距離太遠，稍微拉近" : "目前靠得太近";
    }
  }

  function beginPresbyopiaHoldTimer() {
    presbyopiaHoldStartedAt = Date.now();
    presbyopiaHoldStatus.classList.add("is-active");
    presbyopiaHoldStatus.textContent = "保持適當距離 1 秒";
    presbyopiaStatusTimer = window.setInterval(() => {
      const elapsed = Date.now() - presbyopiaHoldStartedAt;
      presbyopiaHoldStatus.textContent = elapsed < 1000 ? "保持適當距離 1 秒" : "觀察完成";
    }, 120);
    presbyopiaHoldTimer = window.setTimeout(completePresbyopiaObservation, 1000);
  }

  function cancelPresbyopiaHoldTimer() {
    if (presbyopiaHoldTimer) window.clearTimeout(presbyopiaHoldTimer);
    if (presbyopiaStatusTimer) window.clearInterval(presbyopiaStatusTimer);
    presbyopiaHoldTimer = null;
    presbyopiaStatusTimer = null;
  }

  async function completePresbyopiaObservation() {
    const idx = presbyopiaSceneIndex;
    completedPresbyopiaScene = true;
    cancelPresbyopiaHoldTimer();
    presbyopiaHoldStatus.classList.add("is-active");
    presbyopiaHoldStatus.textContent = "觀察完成";
    await awardStar(distanceBadgeValue, presbyopiaBar, idx + 1);
    await StoryDialog.play({ npc: 1, position: "bottom", lines: presbyopiaScenes[idx].dialogue.map((text) => ({ who: "player", text })) });
    if (idx < presbyopiaScenes.length - 1) {
      presbyopiaSceneIndex = idx + 1;
      renderPresbyopiaScene();
      presbyopiaStage.focus();
    } else {
      resetPresbyopiaJudgment();
      showView(presbyopiaJudgmentView);
      playChoiceIntro(presbyopiaJudgmentList, copy1.presbyopia.judgment);
    }
  }

  presbyopiaSceneImage.addEventListener("pointerdown", (event) => {
    if (completedPresbyopiaScene) return;
    event.preventDefault();
    presbyopiaPointerId = event.pointerId;
    presbyopiaDragStartY = event.clientY;
    presbyopiaDragStartDistance = presbyopiaDistance;
    presbyopiaDragging = true;
    cancelPresbyopiaHoldTimer();
    presbyopiaStage.classList.add("is-dragging");
    presbyopiaSceneImage.setPointerCapture(event.pointerId);
  });

  presbyopiaSceneImage.addEventListener("pointermove", (event) => {
    if (!presbyopiaDragging || event.pointerId !== presbyopiaPointerId || completedPresbyopiaScene) return;
    const dragRange = Math.max(180, presbyopiaStage.clientHeight * 0.62);
    const distanceChange = ((presbyopiaDragStartY - event.clientY) / dragRange) * 100;
    presbyopiaDistance = Math.max(0, Math.min(100, presbyopiaDragStartDistance + distanceChange));
    updatePresbyopiaDistance();
  });

  function finishPresbyopiaDrag(event) {
    if (!presbyopiaDragging || event.pointerId !== presbyopiaPointerId) return;
    presbyopiaDragging = false;
    presbyopiaPointerId = null;
    presbyopiaStage.classList.remove("is-dragging");
    if (presbyopiaSceneImage.hasPointerCapture(event.pointerId)) {
      presbyopiaSceneImage.releasePointerCapture(event.pointerId);
    }
    updatePresbyopiaDistance();
  }

  presbyopiaSceneImage.addEventListener("pointerup", finishPresbyopiaDrag);
  presbyopiaSceneImage.addEventListener("pointercancel", finishPresbyopiaDrag);
  presbyopiaSceneImage.addEventListener("dragstart", (event) => event.preventDefault());

  presbyopiaStage.addEventListener("keydown", (event) => {
    if (completedPresbyopiaScene || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    cancelPresbyopiaHoldTimer();
    presbyopiaDistance += event.key === "ArrowUp" ? 5 : -5;
    presbyopiaDistance = Math.max(0, Math.min(100, presbyopiaDistance));
    updatePresbyopiaDistance();
  });

  const presbyopiaJudgmentInputs = [...document.querySelectorAll('input[name="presbyopiaJudgment"]')];
  const submitPresbyopiaJudgment = document.querySelector("#submitPresbyopiaJudgment");
  const presbyopiaJudgmentNext = document.querySelector("#presbyopiaJudgmentNext");
  const presbyopiaJudgmentFeedback = document.querySelector("#presbyopiaJudgmentFeedback");
  const presbyopiaJudgmentFeedbackTitle = document.querySelector("#presbyopiaJudgmentFeedbackTitle");
  const presbyopiaJudgmentFeedbackText = document.querySelector("#presbyopiaJudgmentFeedbackText");

  presbyopiaJudgmentInputs.forEach((input) => {
    input.addEventListener("change", () => {
      submitPresbyopiaJudgment.disabled = false;
      presbyopiaJudgmentFeedback.hidden = true;
      presbyopiaJudgmentNext.hidden = true;
    });
  });

  const presbyopiaJudgmentList = document.querySelector("#presbyopiaJudgmentOptions");
  submitPresbyopiaJudgment.addEventListener("click", async () => {
    const selected = document.querySelector('input[name="presbyopiaJudgment"]:checked');
    if (!selected) return;
    const correct = selected.value === "far-clear";
    AchievementSystem.learning.judgment("vision","glasses",correct);
    submitPresbyopiaJudgment.disabled = true;
    const feedbackByValue = {
      "near-clear": "剛才靠近時較模糊，拿遠後比較清楚。",
      "central-curve": "這次的重點是近距離模糊，不是線條彎曲。",
      "no-color": "照片的顏色沒有消失；真正改變的是不同觀看距離下的清晰度。"
    };
    await playChoiceResult(copy1.presbyopia.judgment, correct,
      correct ? "答對了：近距離較模糊，拿遠後比較清楚。" : feedbackByValue[selected.value]);
    await Room1RetryVideo.gate("presbyopia", correct);
    if (correct) {
      loadLocalPresbyopiaImage();
      showView(presbyopiaEducationView);
    } else {
      resetPresbyopiaJudgment();
    }
  });

  function resetPresbyopiaJudgment() {
    presbyopiaJudgmentInputs.forEach((input) => {
      input.checked = false;
      input.disabled = false;
    });
    presbyopiaJudgmentFeedback.hidden = true;
    presbyopiaJudgmentFeedback.classList.remove("is-correct");
    submitPresbyopiaJudgment.hidden = false;
    submitPresbyopiaJudgment.disabled = true;
    presbyopiaJudgmentNext.hidden = true;
    presbyopiaJudgmentNext.dataset.correct = "false";
  }

  const startPresbyopiaAssessment = document.querySelector("#startPresbyopiaAssessment");
  const readingBook = document.querySelector("#readingBook");
  const presbyopiaClueText = document.querySelector("#presbyopiaClueText");
  const readingAssessmentStatus = document.querySelector("#readingAssessmentStatus");
  const returnFromPresbyopiaClue = document.querySelector("#returnFromPresbyopiaClue");
  let readingDistance = 10;
  let readingStartY = 0;
  let readingStartDistance = 10;
  let readingPointerId = null;
  let readingDragging = false;
  let readingAssessmentComplete = false;
  let readingAssessmentTimer = null;
  let readingReturnTimer = null;

  startPresbyopiaAssessment.addEventListener("click", () => {
    resetReadingAssessment();
    showView(presbyopiaAssessmentView);
    StoryDialog.ask({ npc: 1, position: "center", text: copy1.presbyopia.assessment.ask }).then(() => readingBook.focus());
  });

  function resetReadingAssessment() {
    cancelReadingAssessmentTimer();
    cancelReadingReturnTimer();
    readingDistance = 10;
    readingPointerId = null;
    readingDragging = false;
    readingAssessmentComplete = false;
    readingBook.classList.remove("is-dragging", "is-complete");
    presbyopiaClueText.hidden = true;
    returnFromPresbyopiaClue.hidden = true;
    updateReadingBook();
  }

  function updateReadingBook() {
    const scale = 1.18 - readingDistance * 0.0048;
    const verticalPosition = 100 - readingDistance * 2;
    let blur;
    if (readingDistance < 30) {
      // 太近：最模糊，從約 7px 逐漸降到 0px。
      blur = ((30 - readingDistance) / 30) * 7;
    } else if (readingDistance <= 65) {
      // 適中：文字最清楚。
      blur = 0;
    } else {
      // 太遠：保留較輕微的模糊，最遠約 2px。
      blur = ((readingDistance - 65) / 35) * 2;
    }
    readingBook.style.setProperty("--book-scale", scale.toFixed(3));
    readingBook.style.setProperty("--book-y", `${verticalPosition.toFixed(1)}px`);
    readingBook.style.setProperty("--book-blur", `${blur.toFixed(2)}px`);

    if (readingAssessmentComplete) return;
    if (readingDistance < 30) {
      readingAssessmentStatus.textContent = "書本距離太近，文字模糊。";
    } else if (readingDistance <= 65) {
      readingAssessmentStatus.textContent = "書本位於適當閱讀距離。";
    } else {
      readingAssessmentStatus.textContent = "書本距離太遠，文字會再次出現較輕微的模糊。";
    }

    const isSuitable = readingDistance >= 30 && readingDistance <= 65;
    if (isSuitable && !readingDragging && !readingAssessmentTimer) {
      readingAssessmentTimer = window.setTimeout(completeReadingAssessment, 1000);
    } else if ((!isSuitable || readingDragging) && readingAssessmentTimer) {
      cancelReadingAssessmentTimer();
    }
  }

  function cancelReadingAssessmentTimer() {
    if (readingAssessmentTimer) window.clearTimeout(readingAssessmentTimer);
    readingAssessmentTimer = null;
  }

  function cancelReadingReturnTimer() {
    if (readingReturnTimer) window.clearTimeout(readingReturnTimer);
    readingReturnTimer = null;
  }

  async function completeReadingAssessment() {
    readingAssessmentTimer = null;
    readingAssessmentComplete = true;
    AchievementSystem.learning.assessment("vision","glasses",true,{distance:readingDistance});
    readingBook.classList.remove("is-dragging");
    readingBook.classList.add("is-complete");
    presbyopiaClueText.hidden = true;
    readingAssessmentStatus.textContent = "完成評量，已找到舒適的閱讀距離。";
    cancelReadingReturnTimer();
    const a = copy1.presbyopia.assessment;
    await StoryDialog.play({
      npc: a.npc, position: "center",
      lines: [{ who: "npc", text: a.cheer, pose: "talk" }, { who: "npc", text: a.reward, pose: "remind" }]
    });
    /* 第三修改計劃 B4:同一顆按鈕「完成學習」→ 寶物 →「返回房間」 */
    StoryDialog.finishButton(returnFromPresbyopiaClue, { finish: async () => { AchievementSystem.completeActivity("vision", "glasses"); markFound("glasses"); await AchievementSystem.obtainItem("vision_glasses"); }, back: returnToRoom });
    returnFromPresbyopiaClue.hidden = false;
    returnFromPresbyopiaClue.focus();
  }

  readingBook.addEventListener("pointerdown", (event) => {
    if (readingAssessmentComplete) return;
    readingPointerId = event.pointerId;
    readingStartY = event.clientY;
    readingStartDistance = readingDistance;
    readingDragging = true;
    cancelReadingAssessmentTimer();
    readingBook.classList.add("is-dragging");
    readingBook.setPointerCapture(event.pointerId);
  });

  readingBook.addEventListener("pointermove", (event) => {
    if (!readingDragging || event.pointerId !== readingPointerId || readingAssessmentComplete) return;
    const stageHeight = Math.max(320, document.querySelector("#readingStage").clientHeight);
    const dragRange = Math.max(220, stageHeight * 0.48);
    const distanceChange = ((readingStartY - event.clientY) / dragRange) * 100;
    readingDistance = Math.max(0, Math.min(100, readingStartDistance + distanceChange));
    updateReadingBook();
  });

  function finishReadingDrag(event) {
    if (!readingDragging || event.pointerId !== readingPointerId) return;
    readingDragging = false;
    readingPointerId = null;
    readingBook.classList.remove("is-dragging");
    if (readingBook.hasPointerCapture(event.pointerId)) readingBook.releasePointerCapture(event.pointerId);
    updateReadingBook();
  }

  readingBook.addEventListener("pointerup", finishReadingDrag);
  readingBook.addEventListener("pointercancel", finishReadingDrag);
  readingBook.addEventListener("dragstart", (event) => event.preventDefault());

  readingBook.addEventListener("keydown", (event) => {
    if (readingAssessmentComplete || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    cancelReadingAssessmentTimer();
    readingDistance += event.key === "ArrowUp" ? 5 : -5;
    readingDistance = Math.max(0, Math.min(100, readingDistance));
    updateReadingBook();
  });

  document.querySelector("#readingHintButton").addEventListener("click", () => showHint(copy1.presbyopia.assessment.hint).then(() => readingBook.focus()));

  // ------------------------------
  // 白內障：情境 → 玩家判斷 → 回饋 → 學習重點
  // ------------------------------
  const cataractScenes = [
    {
      src: "assets/scene-dining.png",
      alt: "餐桌中央有茶壺、橘子與花瓶。",
      effect: "scene-fog",
      title: "餐桌前的霧",
      copy: "先把眼前的玻璃擦一擦，看看霧感是不是只是表面髒了。",
      dialogue: ["奇怪，玻璃明明擦乾淨了，怎麼整個畫面還是霧霧的？", "看來不是玻璃髒了……"]
    },
    {
      src: "assets/scene-park.png",
      alt: "公園步道中央停著一輛紅色腳踏車。",
      effect: "scene-contrast",
      title: "公園裡也灰灰的",
      copy: "換到另一個場景再擦一次，留意顏色和明暗對比有沒有恢復。",
      dialogue: ["到公園還是覺得灰灰霧霧的，顏色也不像以前那麼清楚。", "原來換個地方，這層霧感還是在。"]
    },
    {
      src: "assets/scene-kitchen.png",
      alt: "廚房流理臺中央放著紅色水壺，旁邊有杯子與毛巾。",
      effect: "scene-glare",
      title: "亮光旁的光暈",
      copy: "最後再擦一次，除了霧感，也觀察畫面亮處周圍有沒有不一樣。",
      dialogue: ["亮一點的地方周圍好像多了一圈光暈，還有點刺眼。", "眼前一直霧霧的，我是不是該多注意了？"]
    }
  ];

  const cataractStage = document.querySelector("#cataractStage");
  const cataractSceneImage = document.querySelector("#cataractSceneImage");
  const cataractWipeCanvas = document.querySelector("#cataractWipeCanvas");
  const cataractStatus = document.querySelector("#cataractStatus");
  const resetCataractWipe = document.querySelector("#resetCataractWipe");
  const cataractBar = document.querySelector("#cataractProgress");
  const cataractHintSeen = new Set();
  let cataractSceneIndex = 0;
  let cataractDialogueIndex = 0;
  let cataractSceneComplete = false;
  let cataractPointerId = null;
  let cataractWiping = false;
  let cataractLastPoint = null;
  let cataractCanvasContext = null;
  let cataractCanvasCssWidth = 0;
  let cataractCanvasCssHeight = 0;
  let cataractDialogueTimer = null;
  const cataractCoverage = new Set();
  const CATARACT_GRID_COLS = 12;
  const CATARACT_GRID_ROWS = 7;
  const CATARACT_WIPE_TARGET = 0.30;
  const CATARACT_WIPE_MIN_MS = 3000;
  let cataractWipeAccumulatedMs = 0;
  let cataractWipeSegmentStartedAt = 0;
  let cataractWipeStatusTimer = null;

  function startCataractMission() {
    cataractSceneIndex = 0;
    showView(cataractView);
    renderCataractScene();
    window.setTimeout(() => cataractStage.focus(), 80);
  }

  function renderCataractScene() {
    const scene = cataractScenes[cataractSceneIndex];
    cataractSceneComplete = false;
    cataractDialogueIndex = 0;
    cataractPointerId = null;
    cataractWiping = false;
    cataractLastPoint = null;
    cataractWipeAccumulatedMs = 0;
    cataractWipeSegmentStartedAt = 0;
    if (cataractWipeStatusTimer) window.clearInterval(cataractWipeStatusTimer);
    cataractWipeStatusTimer = null;
    cancelCataractDialogueTimer();

    cataractSceneImage.src = scene.src;
    cataractSceneImage.alt = scene.alt;
    cataractStage.classList.remove("scene-fog", "scene-contrast", "scene-glare", "is-clean");
    cataractStage.classList.add(scene.effect);

    setBar(cataractBar, cataractSceneIndex);
    document.querySelector("#cataractPanelNumber").textContent = String(cataractSceneIndex + 1).padStart(2, "0");
    document.querySelector("#cataractPanelTitle").textContent = scene.title;

    cataractStatus.classList.remove("is-active");
    cataractStatus.textContent = "試著把玻璃擦乾淨";
    window.requestAnimationFrame(resetCataractCanvas);
    if (!cataractHintSeen.has(cataractSceneIndex)) {
      cataractHintSeen.add(cataractSceneIndex);
      const idx = cataractSceneIndex;
      window.setTimeout(() => { if (cataractSceneIndex === idx && !cataractView.hidden) showHint(copy1.cataract.hints[idx].dialog).then(() => cataractStage.focus()); }, 350);
    }
  }
  document.querySelector("#cataractHintButton").addEventListener("click", () => showHint(copy1.cataract.hints[cataractSceneIndex].button).then(() => cataractStage.focus()));

  function resetCataractCanvas() {
    if (cataractSceneComplete) return;
    const rect = cataractStage.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      window.setTimeout(resetCataractCanvas, 50);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cataractCanvasCssWidth = rect.width;
    cataractCanvasCssHeight = rect.height;
    cataractWipeCanvas.width = Math.round(rect.width * dpr);
    cataractWipeCanvas.height = Math.round(rect.height * dpr);
    cataractCanvasContext = cataractWipeCanvas.getContext("2d");
    cataractCanvasContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    cataractCanvasContext.globalCompositeOperation = "source-over";

    const fog = cataractCanvasContext.createLinearGradient(0, 0, rect.width, rect.height);
    fog.addColorStop(0, "rgba(238, 242, 236, .63)");
    fog.addColorStop(.48, "rgba(214, 223, 220, .48)");
    fog.addColorStop(1, "rgba(245, 242, 228, .58)");
    cataractCanvasContext.fillStyle = fog;
    cataractCanvasContext.fillRect(0, 0, rect.width, rect.height);

    // 固定的淡淡擦痕，讓「玻璃表面」與底下仍存在的白內障霧感有層次差。
    cataractCanvasContext.fillStyle = "rgba(255, 255, 255, .12)";
    [
      [rect.width * .18, rect.height * .25, rect.width * .16, rect.height * .08],
      [rect.width * .62, rect.height * .42, rect.width * .19, rect.height * .07],
      [rect.width * .42, rect.height * .72, rect.width * .22, rect.height * .08]
    ].forEach(([x, y, rx, ry]) => {
      cataractCanvasContext.beginPath();
      cataractCanvasContext.ellipse(x, y, rx, ry, -.22, 0, Math.PI * 2);
      cataractCanvasContext.fill();
    });

    cataractCoverage.clear();
    cataractWipeCanvas.classList.remove("is-clean");
    cataractStatus.classList.remove("is-active");
    cataractStatus.textContent = "試著把玻璃擦乾淨";
  }

  function cataractPointFromPointer(event) {
    const rect = cataractWipeCanvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, event.clientY - rect.top))
    };
  }

  function markCataractCoverage(point) {
    const cellWidth = cataractCanvasCssWidth / CATARACT_GRID_COLS;
    const cellHeight = cataractCanvasCssHeight / CATARACT_GRID_ROWS;
    const col = Math.max(0, Math.min(CATARACT_GRID_COLS - 1, Math.floor(point.x / cellWidth)));
    const row = Math.max(0, Math.min(CATARACT_GRID_ROWS - 1, Math.floor(point.y / cellHeight)));

    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
        const c = col + colOffset;
        const r = row + rowOffset;
        if (c >= 0 && c < CATARACT_GRID_COLS && r >= 0 && r < CATARACT_GRID_ROWS) {
          cataractCoverage.add(`${c}:${r}`);
        }
      }
    }

    const ratio = cataractCoverage.size / (CATARACT_GRID_COLS * CATARACT_GRID_ROWS);
    const coveragePercent = Math.min(100, Math.round((ratio / CATARACT_WIPE_TARGET) * 100));
    const activeMs = cataractWipeAccumulatedMs + (cataractWiping && cataractWipeSegmentStartedAt ? Date.now() - cataractWipeSegmentStartedAt : 0);
    const secondsLeft = Math.max(0, Math.ceil((CATARACT_WIPE_MIN_MS - activeMs) / 1000));
    cataractStatus.textContent = secondsLeft > 0
      ? `繼續擦拭 ${secondsLeft} 秒（${coveragePercent}%）`
      : `擦拭玻璃 ${coveragePercent}%`;

    if (ratio >= CATARACT_WIPE_TARGET && activeMs >= CATARACT_WIPE_MIN_MS) completeCataractWipe();
  }

  function eraseCataractTo(point) {
    if (!cataractCanvasContext || cataractSceneComplete) return;
    const brushSize = Math.max(44, cataractCanvasCssWidth * .065);
    cataractCanvasContext.save();
    cataractCanvasContext.globalCompositeOperation = "destination-out";
    cataractCanvasContext.lineCap = "round";
    cataractCanvasContext.lineJoin = "round";
    cataractCanvasContext.lineWidth = brushSize;
    cataractCanvasContext.beginPath();
    if (cataractLastPoint) {
      cataractCanvasContext.moveTo(cataractLastPoint.x, cataractLastPoint.y);
      cataractCanvasContext.lineTo(point.x, point.y);
    } else {
      cataractCanvasContext.moveTo(point.x, point.y);
      cataractCanvasContext.lineTo(point.x + .01, point.y + .01);
    }
    cataractCanvasContext.stroke();
    cataractCanvasContext.restore();

    cataractLastPoint = point;
    markCataractCoverage(point);
  }

  function completeCataractWipe() {
    if (cataractSceneComplete) return;
    cataractSceneComplete = true;
    if (cataractWipeSegmentStartedAt) {
      cataractWipeAccumulatedMs += Date.now() - cataractWipeSegmentStartedAt;
      cataractWipeSegmentStartedAt = 0;
    }
    if (cataractWipeStatusTimer) window.clearInterval(cataractWipeStatusTimer);
    cataractWipeStatusTimer = null;
    cataractWiping = false;
    cataractPointerId = null;
    cataractLastPoint = null;
    cataractStage.classList.add("is-clean");
    cataractWipeCanvas.classList.add("is-clean");
    cataractStatus.classList.add("is-active");
    cataractStatus.textContent = "玻璃擦乾淨了，但霧感還在";
    cancelCataractDialogueTimer();
    const idx = cataractSceneIndex;
    cataractDialogueTimer = window.setTimeout(async () => {
      cataractDialogueTimer = null;
      await awardStar(cataractStatus, cataractBar, idx + 1);
      await StoryDialog.play({ npc: 1, position: "bottom", lines: cataractScenes[idx].dialogue.map((text) => ({ who: "player", text })) });
      if (idx < cataractScenes.length - 1) {
        cataractSceneIndex = idx + 1;
        renderCataractScene();
        cataractStage.focus();
      } else {
        resetCataractJudgment();
        showView(cataractJudgmentView);
        playChoiceIntro(cataractJudgmentList, copy1.cataract.judgment);
      }
    }, 650);
  }

  function cancelCataractDialogueTimer() {
    if (cataractDialogueTimer) window.clearTimeout(cataractDialogueTimer);
    cataractDialogueTimer = null;
  }

  cataractWipeCanvas.addEventListener("pointerdown", (event) => {
    if (cataractSceneComplete) return;
    cataractPointerId = event.pointerId;
    cataractWiping = true;
    cataractWipeSegmentStartedAt = Date.now();
    cataractLastPoint = null;
    if (cataractWipeStatusTimer) window.clearInterval(cataractWipeStatusTimer);
    cataractWipeStatusTimer = window.setInterval(() => {
      if (!cataractWiping || cataractSceneComplete) return;
      const ratio = cataractCoverage.size / (CATARACT_GRID_COLS * CATARACT_GRID_ROWS);
      const coveragePercent = Math.min(100, Math.round((ratio / CATARACT_WIPE_TARGET) * 100));
      const activeMs = cataractWipeAccumulatedMs + (Date.now() - cataractWipeSegmentStartedAt);
      const secondsLeft = Math.max(0, Math.ceil((CATARACT_WIPE_MIN_MS - activeMs) / 1000));
      cataractStatus.textContent = secondsLeft > 0
        ? `繼續擦拭 ${secondsLeft} 秒（${coveragePercent}%）`
        : `擦拭玻璃 ${coveragePercent}%`;
      if (ratio >= CATARACT_WIPE_TARGET && activeMs >= CATARACT_WIPE_MIN_MS) completeCataractWipe();
    }, 120);
    cataractWipeCanvas.setPointerCapture(event.pointerId);
    eraseCataractTo(cataractPointFromPointer(event));
  });

  cataractWipeCanvas.addEventListener("pointermove", (event) => {
    if (!cataractWiping || event.pointerId !== cataractPointerId || cataractSceneComplete) return;
    eraseCataractTo(cataractPointFromPointer(event));
  });

  function finishCataractWipe(event) {
    if (!cataractWiping || event.pointerId !== cataractPointerId) return;
    if (cataractWipeSegmentStartedAt) {
      cataractWipeAccumulatedMs += Date.now() - cataractWipeSegmentStartedAt;
      cataractWipeSegmentStartedAt = 0;
    }
    cataractWiping = false;
    cataractLastPoint = null;
    cataractPointerId = null;
    if (cataractWipeStatusTimer) window.clearInterval(cataractWipeStatusTimer);
    cataractWipeStatusTimer = null;
    if (cataractWipeCanvas.hasPointerCapture(event.pointerId)) {
      cataractWipeCanvas.releasePointerCapture(event.pointerId);
    }
  }

  cataractWipeCanvas.addEventListener("pointerup", finishCataractWipe);
  cataractWipeCanvas.addEventListener("pointercancel", finishCataractWipe);
  cataractWipeCanvas.addEventListener("dragstart", (event) => event.preventDefault());

  cataractStage.addEventListener("keydown", (event) => {
    if (cataractSceneComplete || ![" ", "Enter"].includes(event.key)) return;
    event.preventDefault();
    if (!cataractCanvasContext) return;

    // 鍵盤替代操作：以數條擦拭軌跡完成同一任務。
    const h = cataractCanvasCssHeight;
    for (let index = 1; index <= 5; index += 1) {
      cataractLastPoint = { x: cataractCanvasCssWidth * .14, y: (h / 6) * index };
      eraseCataractTo({ x: cataractCanvasCssWidth * .86, y: (h / 6) * index });
    }
    completeCataractWipe();
  });

  resetCataractWipe.addEventListener("click", () => {
    if (cataractSceneComplete) return;
    resetCataractCanvas();
    cataractStage.focus();
  });

  window.addEventListener("resize", () => {
    if (!cataractView.hidden && !cataractSceneComplete) {
      window.requestAnimationFrame(resetCataractCanvas);
    }
  });

  const cataractJudgmentInputs = [...document.querySelectorAll('input[name="cataractJudgment"]')];
  const submitCataractJudgment = document.querySelector("#submitCataractJudgment");
  const cataractJudgmentNext = document.querySelector("#cataractJudgmentNext");
  const cataractJudgmentFeedback = document.querySelector("#cataractJudgmentFeedback");
  const cataractJudgmentFeedbackTitle = document.querySelector("#cataractJudgmentFeedbackTitle");
  const cataractJudgmentFeedbackText = document.querySelector("#cataractJudgmentFeedbackText");

  cataractJudgmentInputs.forEach((input) => {
    input.addEventListener("change", () => {
      submitCataractJudgment.disabled = false;
      cataractJudgmentFeedback.hidden = true;
      cataractJudgmentNext.hidden = true;
    });
  });

  const cataractJudgmentList = document.querySelector("#cataractJudgmentOptions");
  submitCataractJudgment.addEventListener("click", async () => {
    const selected = document.querySelector('input[name="cataractJudgment"]:checked');
    if (!selected) return;
    const correct = selected.value === "foggy";
    AchievementSystem.learning.judgment("vision","drops",correct);
    submitCataractJudgment.disabled = true;
    const feedbackByValue = {
      "central-curve": "這次是整體霧感，不是只有中央線條變形。",
      "far-clear": "這次即使改變距離，霧感仍然存在。",
      "edge-dark": "這次是整體變霧，不是只有四周變暗。"
    };
    await playChoiceResult(copy1.cataract.judgment, correct,
      correct ? "答對了：擦過之後，整體霧感仍然存在。" : feedbackByValue[selected.value]);
    await Room1RetryVideo.gate("cataract", correct);
    if (correct) {
      loadLocalCataractImage();
      showView(cataractEducationView);
    } else {
      resetCataractJudgment();
    }
  });

  function resetCataractJudgment() {
    cataractJudgmentInputs.forEach((input) => {
      input.checked = false;
      input.disabled = false;
    });
    cataractJudgmentFeedback.hidden = true;
    cataractJudgmentFeedback.classList.remove("is-correct");
    submitCataractJudgment.hidden = false;
    submitCataractJudgment.disabled = true;
    cataractJudgmentNext.hidden = true;
    cataractJudgmentNext.dataset.correct = "false";
  }


  // ------------------------------
  // 白內障學習後評量：3 幕生活情境
  // ------------------------------
  const startCataractAssessment = document.querySelector("#startCataractAssessment");
  const cataractAssessmentImage = document.querySelector("#cataractAssessmentImage");
  const cataractAssessmentProgress = document.querySelector("#cataractAssessmentProgress");
  const cataractAssessmentStage = document.querySelector("#cataractAssessmentStage");
  const cataractAssessmentMessage = document.querySelector("#cataractAssessmentMessage");
  const cataractAssessmentNext = document.querySelector("#cataractAssessmentNext");
  const cataractAssessmentSummary = document.querySelector("#cataractAssessmentSummary");
  const cataractCompletionCard = document.querySelector("#cataractCompletionCard");
  const revealCataractClue = document.querySelector("#revealCataractClue");
  const cataractKeyHotspot = document.querySelector("#cataractKeyHotspot");
  const cataractHazardHotspots = [...document.querySelectorAll(".hazard-hotspot")];
  let cataractAssessmentSceneIndex = 0;
  let cataractAssessmentTimer = null;
  let cataractKeyFound = false;
  const cataractHazardsSelected = new Set();
  const cataractCorrectHazards = new Set(["pedestrian", "crosswalk"]);

  const cataractAssessmentScenes = [
    { src: "assets/cataract-assessment-home.png", alt: "第一視角坐在霧感客廳，準備出門。", nextText: "前往玄關" },
    { src: "assets/cataract-assessment-keys.png", alt: "第一視角站在霧感玄關，桌面上藏著一串鑰匙。", nextText: "拿好鑰匙，出門" },
    { src: "assets/cataract-assessment-street.png", alt: "第一視角走在夜間街道，燈光有明顯光暈與霧感。", nextText: "確認選擇" }
  ];
  const cataractAssessCopy = copy1.cataract.assessment;
  const cataractAssessmentBar = document.querySelector("#cataractAssessmentProgress");
  const cataractAssessmentHint = document.querySelector("#cataractAssessmentHint");
  const npcSay = (text) => StoryDialog.ask({ npc: 1, position: "bottom", text });

  function cancelCataractAssessmentTimer() {
    if (cataractAssessmentTimer) window.clearTimeout(cataractAssessmentTimer);
    cataractAssessmentTimer = null;
  }

  function resetCataractAssessment() {
    cancelCataractAssessmentTimer();
    cataractAssessmentSceneIndex = 0;
    cataractKeyFound = false;
    cataractHazardsSelected.clear();
    cataractAssessmentSummary.hidden = true;
    if (cataractCompletionCard) cataractCompletionCard.hidden = false;
    renderCataractAssessmentScene();
  }

  function renderCataractAssessmentScene() {
    cancelCataractAssessmentTimer();
    const scene = cataractAssessmentScenes[cataractAssessmentSceneIndex];
    cataractAssessmentImage.src = scene.src;
    cataractAssessmentImage.alt = scene.alt;
    setBar(cataractAssessmentBar, cataractAssessmentSceneIndex);
    cataractAssessmentMessage.textContent = cataractAssessCopy.scenes[cataractAssessmentSceneIndex].status;
    cataractAssessmentNext.textContent = scene.nextText;
    cataractAssessmentNext.hidden = true;
    cataractKeyHotspot.hidden = true;
    cataractKeyHotspot.disabled = false;
    cataractKeyHotspot.classList.remove("is-found");
    cataractHazardHotspots.forEach((button) => {
      button.hidden = true;
      button.classList.remove("is-found", "is-selected");
      button.setAttribute("aria-pressed", "false");
      button.disabled = false;
    });

    const idx = cataractAssessmentSceneIndex;
    // 每個場景開始時由 NPC 說明任務
    const intro = StoryDialog.ask({ npc: 1, position: "bottom", text: cataractAssessCopy.scenes[idx].ask });
    if (idx === 0) {
      intro.then(() => {
        if (cataractAssessmentSceneIndex !== 0 || cataractAssessmentView.hidden) return;
        cataractAssessmentMessage.textContent = cataractAssessCopy.ready;
        cataractAssessmentNext.hidden = false;
        cataractAssessmentNext.focus();
      });
    } else if (cataractAssessmentSceneIndex === 1) {
      cataractKeyHotspot.hidden = false;
      cataractKeyFound = false;
    } else {
      cataractHazardsSelected.clear();
      cataractHazardHotspots.forEach((button) => { button.hidden = false; });
    }
  }

  startCataractAssessment.addEventListener("click", () => {
    resetCataractAssessment();
    showView(cataractAssessmentView);
    window.setTimeout(() => cataractAssessmentStage.focus(), 80);
  });

  cataractAssessmentHint.addEventListener("click", () => showHint(cataractAssessCopy.scenes[cataractAssessmentSceneIndex].hint));

  cataractKeyHotspot.addEventListener("click", async () => {
    if (cataractKeyFound || cataractAssessmentSceneIndex !== 1) return;
    cataractKeyFound = true;
    cataractKeyHotspot.classList.add("is-found");
    cataractKeyHotspot.disabled = true;
    await npcSay(cataractAssessCopy.keyFound);
    cataractAssessmentNext.hidden = false;
    cataractAssessmentNext.focus();
  });

  cataractHazardHotspots.forEach((button) => {
    button.addEventListener("click", () => {
      if (cataractAssessmentSceneIndex !== 2) return;
      const key = button.dataset.hazard;

      if (cataractHazardsSelected.has(key)) {
        cataractHazardsSelected.delete(key);
        button.classList.remove("is-selected");
        button.setAttribute("aria-pressed", "false");
      } else {
        if (cataractHazardsSelected.size >= 2) {
          npcSay(cataractAssessCopy.pickMax);
          return;
        }
        cataractHazardsSelected.add(key);
        button.classList.add("is-selected");
        button.setAttribute("aria-pressed", "true");
      }

      const count = cataractHazardsSelected.size;
      cataractAssessmentMessage.textContent = `已選 ${count}／2 個位置`;
      cataractAssessmentNext.hidden = count !== 2;
      if (count === 2) cataractAssessmentNext.focus();
    });
  });

  cataractAssessmentStage.addEventListener("click", (event) => {
    const clickedBlank = event.target === cataractAssessmentStage || event.target === cataractAssessmentImage;
    if (cataractAssessmentSceneIndex === 1 && !cataractKeyFound && clickedBlank) npcSay(cataractAssessCopy.keyMiss);
  });

  cataractAssessmentNext.addEventListener("click", async () => {
    if (cataractAssessmentSceneIndex === 2) {
      const selected = [...cataractHazardsSelected];
      const allCorrect = selected.length === 2 && selected.every((key) => cataractCorrectHazards.has(key));
      AchievementSystem.learning.assessment("vision","drops",allCorrect,{hazards:selected});

      if (!allCorrect) {
        cataractHazardsSelected.clear();
        cataractHazardHotspots.forEach((button) => {
          button.classList.remove("is-selected", "is-found");
          button.setAttribute("aria-pressed", "false");
          button.disabled = false;
        });
        cataractAssessmentNext.hidden = true;
        cataractAssessmentMessage.textContent = cataractAssessCopy.scenes[2].status;
        await npcSay(cataractAssessCopy.pickWrong);
        await Room1RetryVideo.gate("cataract-hazards", false);
        cataractAssessmentStage.focus();
        return;
      }

      cataractHazardHotspots.forEach((button) => {
        const isCorrect = cataractCorrectHazards.has(button.dataset.hazard);
        button.classList.toggle("is-found", isCorrect);
        button.classList.remove("is-selected");
        button.disabled = true;
      });
      cataractAssessmentNext.hidden = true;
      await awardStar(cataractAssessmentNext, cataractAssessmentBar, 3);
      await npcSay(cataractAssessCopy.pickRight);
      await StoryDialog.play({
        npc: cataractAssessCopy.npc, position: "center",
        lines: [{ who: "npc", text: cataractAssessCopy.cheer, pose: "talk" }, { who: "npc", text: cataractAssessCopy.reward, pose: "remind" }]
      });
      /* 第三修改計劃 B4:同一顆按鈕「完成學習」→ 寶物 →「返回房間」 */
      StoryDialog.finishButton(revealCataractClue, { finish: async () => { AchievementSystem.completeActivity("vision", "drops"); markFound("drops"); await AchievementSystem.obtainItem("vision_focus_slider"); }, back: returnToRoom });
      cataractAssessmentSummary.hidden = false;
      Room1RetryVideo.gate("cataract-hazards", true);
      if (cataractCompletionCard) cataractCompletionCard.hidden = false;
      revealCataractClue?.focus();
      return;
    }

    if (cataractAssessmentSceneIndex < cataractAssessmentScenes.length - 1) {
      const next = cataractAssessmentSceneIndex + 1;
      cataractAssessmentNext.hidden = true;
      await awardStar(cataractAssessmentNext, cataractAssessmentBar, next);
      cataractAssessmentSceneIndex = next;
      renderCataractAssessmentScene();
      window.setTimeout(() => cataractAssessmentStage.focus(), 60);
    }
  });


  const judgmentInputs = [...document.querySelectorAll('input[name="judgment"]')];
  const submitJudgment = document.querySelector("#submitJudgment");
  const judgmentNext = document.querySelector("#judgmentNext");
  const judgmentFeedback = document.querySelector("#judgmentFeedback");
  const judgmentFeedbackTitle = document.querySelector("#judgmentFeedbackTitle");
  const judgmentFeedbackText = document.querySelector("#judgmentFeedbackText");

  judgmentInputs.forEach((input) => {
    input.addEventListener("change", () => {
      submitJudgment.disabled = false;
      judgmentFeedback.hidden = true;
      judgmentNext.hidden = true;
    });
  });

  const judgmentCopy = window.StoryCopy.room1.judgment;
  const judgmentList = document.querySelector("#judgmentOptions");

  /* C4:NPC 先發問 → 選項 A–D 依序快速出現 → 玩家角色表示疑惑 */
  async function playJudgmentIntro() {
    judgmentList.classList.remove("choice-stagger");
    judgmentList.classList.add("choice-hidden");
    await StoryDialog.ask({ npc: judgmentCopy.npc, position: "center", text: judgmentCopy.ask });
    judgmentList.classList.remove("choice-hidden");
    judgmentList.classList.add("choice-stagger");
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
    await StoryDialog.play({
      npc: judgmentCopy.npc, position: "bottom", clear: true,
      lines: [{ who: "player", text: judgmentCopy.playerWonder }]
    });
  }

  submitJudgment.addEventListener("click", async () => {
    const selected = document.querySelector('input[name="judgment"]:checked');
    if (!selected) return;
    const correct = selected.value === "central-curve";
    AchievementSystem.learning.judgment("vision","grid",correct);
    submitJudgment.disabled = true;
    const feedbackByValue = {
      "whole-blur": "照片周圍仍然相對正常，最明顯的變化集中在中央物體。",
      "edge-dark": "剛才改變的不是畫面周圍，而是中央方框裡的物體輪廓。",
      "no-color": "照片的顏色仍然存在；真正改變的是中央線條的形狀。"
    };
    const explain = correct
      ? "你注意到異常集中在中央，而且原本正常的輪廓與直線出現彎曲、變形。"
      : feedbackByValue[selected.value];
    await StoryDialog.play({
      npc: judgmentCopy.npc, position: "bottom",
      lines: [
        { who: "npc", text: correct ? judgmentCopy.praise : judgmentCopy.retry },
        { who: "npc", text: explain }
      ]
    });
    await Room1RetryVideo.gate("macular", correct);
    if (correct) {
      loadLocalMacularImage();
      showView(educationView);
    } else {
      resetJudgment();
    }
  });

  judgmentNext.addEventListener("click", () => {
    if (judgmentNext.dataset.correct === "true") {
      loadLocalMacularImage();
      showView(educationView);
    } else {
      resetJudgment();
    }
  });

  function resetJudgment() {
    judgmentInputs.forEach((input) => {
      input.checked = false;
      input.disabled = false;
    });
    judgmentFeedback.hidden = true;
    judgmentFeedback.classList.remove("is-correct");
    submitJudgment.hidden = false;
    submitJudgment.disabled = true;
    judgmentNext.hidden = true;
    judgmentNext.dataset.correct = "false";
  }

  const assessCopy = window.StoryCopy.room1.assessment;
  const startAssessment = document.querySelector("#startAssessment");
  const gridChoices = [...document.querySelectorAll(".grid-choice")];
  const submitAssessment = document.querySelector("#submitAssessment");
  const assessmentRetry = document.querySelector("#assessmentRetry");
  const revealClue = document.querySelector("#revealClue");
  const assessmentFeedback = document.querySelector("#assessmentFeedback");
  const assessmentFeedbackTitle = document.querySelector("#assessmentFeedbackTitle");
  const assessmentFeedbackText = document.querySelector("#assessmentFeedbackText");
  const selectionCount = document.querySelector("#selectionCount");
  const selectedGrids = new Set();

  startAssessment.addEventListener("click", () => {
    resetAssessment();
    loadAssessmentImages();
    showView(assessmentView);
    StoryDialog.ask({ npc: assessCopy.npc, position: "center", text: assessCopy.ask });
  });

  gridChoices.forEach((choice) => {
    choice.addEventListener("click", () => {
      const key = choice.dataset.grid;
      if (selectedGrids.has(key)) {
        selectedGrids.delete(key);
        choice.setAttribute("aria-pressed", "false");
      } else {
        selectedGrids.add(key);
        choice.setAttribute("aria-pressed", "true");
      }
      const count = selectedGrids.size;
      selectionCount.textContent = `目前選取 ${count} 張`;
      submitAssessment.disabled = count === 0;
    });
  });

  submitAssessment.addEventListener("click", async () => {
    const correct = selectedGrids.has("image1") && selectedGrids.has("image3") && !selectedGrids.has("image2");
    AchievementSystem.learning.assessment("vision","grid",correct);
    gridChoices.forEach((choice) => { choice.disabled = true; });
    submitAssessment.hidden = true;
    if (!correct) {
      // C9:答錯改為 NPC 立繪對話,結束後回到可再作答的狀態(不會卡死)
      await StoryDialog.play({
        npc: assessCopy.npc, position: "bottom",
        lines: [{ who: "npc", text: assessCopy.retry }, { who: "npc", text: "請重新觀察三張圖片後,再選一次。" }]
      });
      await Room1RetryVideo.gate("macular-assessment", false); resetAssessment();
      return;
    }
    Room1RetryVideo.gate("macular-assessment", true); assessmentFeedback.hidden = false;
    assessmentFeedback.classList.add("is-correct");
    assessmentFeedbackTitle.textContent = "答對了";
    assessmentFeedbackText.textContent = "共有 2 張。圖片 A 與 C 的中央視野出現異常。";
    // C5:先鼓勵,NPC 再說話,最後進入獲得寶物演出(B9)
    await StoryDialog.play({
      npc: assessCopy.npc, position: "center",
      lines: [{ who: "npc", text: assessCopy.cheer, pose: "talk" }, { who: "npc", text: assessCopy.reward, pose: "remind" }]
    });
    /* 第三修改計劃 B4:同一顆按鈕「完成學習」→ 寶物 →「返回房間」 */
    StoryDialog.finishButton(revealClue, { finish: async () => { AchievementSystem.completeActivity("vision", "grid"); markFound("grid"); await AchievementSystem.obtainItem("vision_brass_key"); }, back: returnToRoom });
    assessmentRetry.hidden = true;
    revealClue.hidden = false;
    revealClue.focus();
  });

  assessmentRetry.addEventListener("click", resetAssessment);

  function resetAssessment() {
    selectedGrids.clear();
    gridChoices.forEach((choice) => {
      choice.disabled = false;
      choice.setAttribute("aria-pressed", "false");
    });
    selectionCount.textContent = "目前選取 0 張";
    assessmentFeedback.hidden = true;
    assessmentFeedback.classList.remove("is-correct");
    submitAssessment.hidden = false;
    submitAssessment.disabled = true;
    assessmentRetry.hidden = true;
    revealClue.hidden = true;
  }

  function loadAssessmentImages() {
    const imageMap = {
      "amsler-a": "assets/amsler-grid-abnormal-a.png",
      "amsler-b": "assets/amsler-grid-normal-b.png",
      "amsler-c": "assets/amsler-grid-abnormal-c.png"
    };

    document.querySelectorAll(".assessment-image").forEach((image) => {
      const key = image.dataset.localImage;
      const src = imageMap[key];
      image.classList.remove("is-missing");
      image.onerror = () => {
        image.removeAttribute("src");
        image.classList.add("is-missing");
      };
      if (src) image.src = src;
    });
  }

  function loadLocalMacularImage() {
    const image = document.querySelector("#macularImage");
    const candidates = [
      "assets/macular-story-01.png"
    ];
    let candidateIndex = 0;
    image.classList.remove("is-missing");
    image.onerror = () => {
      candidateIndex += 1;
      if (candidateIndex < candidates.length) {
        image.src = candidates[candidateIndex];
      } else {
        image.removeAttribute("src");
        image.classList.add("is-missing");
      }
    };
    image.src = candidates[candidateIndex];
  }

  function loadLocalPresbyopiaImage() {
    const image = document.querySelector("#presbyopiaImage");
    if (!image) return;
    image.onerror = () => image.classList.add("is-missing");
    image.classList.remove("is-missing");
    image.src = "assets/presbyopia-story-01.png";
  }



// ------------------------------
// 第四課：視力變差後的生活影響（V7.4 學習海報＋自由探索）
// ------------------------------
const impactMissionBar = document.querySelector("#impactMissionBar");
const impactGameWrap = document.querySelector("#impactGameWrap");

const exploreStage = document.querySelector("#exploreStage");
const explorePlayer = document.querySelector("#explorePlayer");
const explorePlayerCharacter = document.querySelector("#explorePlayerCharacter");
const explorePlayerAccessory = document.querySelector("#explorePlayerAccessory");
const exploreResult = document.querySelector("#exploreResult");
const revealImpactClue = document.querySelector("#revealImpactClue");
const impactClueRevealArea = document.querySelector("#impactClueRevealArea");
const exploreBar = document.querySelector("#exploreProgress");
let exploreHintSeen = false;
const exploreSwitch = document.querySelector("#exploreSwitch");
const exploreWater = document.querySelector("#exploreWater");
const exploreMop = document.querySelector("#exploreMop");
const exploreMopEffect = document.querySelector("#exploreMopEffect");
const exploreMopStatus = document.querySelector("#exploreMopStatus");
let exploreHasMop=false, exploreWaterSuppressed=false, exploreMopTimer=null, exploreMopFinished=false;
const exploreMopItem={id:"mop",x:100,y:510,radius:65,title:"找到長柄拖把了",info:"有了長柄拖把，站著就能把地擦乾，不必蹲下來。"};
function exploreCustomName(){try{const n=window.MemoryMazeCharacters?.getPlayer?.()?.name;if(n&&String(n).trim())return String(n).trim();}catch(_){}try{const p=JSON.parse(localStorage.getItem("memoryMazePlayer")||"null");return typeof p?.name==="string"&&p.name.trim()?p.name.trim():"玩家";}catch(_){return "玩家";}}
function closeExploreMopDialog(){exploreDialogOpen=false;exploreNearest=null;exploreKeys.clear();exploreStage?.focus();}
/* 第三修改計劃新增 B1-1:拖地時間拉長、水漬逐漸變乾、完成時閃光;拿到拖把後角色身上帶著拖把 */
function startExploreMopping(item){
  if(!exploreHasMop||exploreMopTimer!==null||exploreState.water||!exploreGameActive)return;
  exploreKeys.clear();
  exploreMopEffect.hidden=false;exploreMopEffect.classList.add("is-mopping");explorePlayer?.classList.add("is-mopping-player");document.querySelector("#exploreWater")?.classList.add("is-drying");
  exploreMopStatus.hidden=false;exploreMopStatus.textContent="扶牆小心拖地中……";
  exploreMopTimer=window.setTimeout(()=>{exploreMopTimer=null;exploreMopEffect.hidden=true;exploreMopEffect.classList.remove("is-mopping");explorePlayer?.classList.remove("is-mopping-player","has-mop");const w=document.querySelector("#exploreWater");w?.classList.remove("is-drying");w?.classList.add("is-dried");if(!exploreGameActive)return;exploreMopFinished=true;performExploreInteraction(item);exploreMopStatus.textContent="水漬已擦乾 · 已取得長柄拖把";},1800);
}
const exploreRug = document.querySelector("#exploreRug");
const exploreRugImage = document.querySelector("#exploreRugImage");

const EXPLORE_WORLD = { width: 900, height: 600 };
const EXPLORE_PLAYER_RADIUS = 16;
const EXPLORE_SPEED = 185;
const exploreKeys = new Set();
let exploreX = 450;
let exploreY = 520;
let exploreLastTime = 0;
let exploreFrameId = null;
let exploreNearest = null;
let exploreCompleted = false;
let exploreMoving = false;
let exploreGameActive = false;
let exploreDialogOpen = false;

const exploreState = {
  light: false,
  water: false,
  rug: false
};

const exploreInteractions = [
  {
    id: "light",
    x: 818,
    y: 344,
    radius: 78,
    element: exploreSwitch,
    title: "這裡好像太暗了",
    info: "這一區看起來暗暗的，好像少了什麼。",
    action: "要把燈打開看看嗎？",
    actionLabel: "打開電燈"
  },
  {
    id: "water",
    x: 718,
    y: 376,
    radius: 82,
    element: exploreWater,
    title: "地板這裡怪怪的",
    info: "腳邊好像有一小灘水，地面看起來濕濕的。",
    action: "要把這裡整理乾淨嗎？",
    actionLabel: "擦乾水漬"
  },
  {
    id: "rug",
    x: 450,
    y: 398,
    radius: 92,
    element: exploreRug,
    title: "地墊不太平整",
    info: "這塊地墊的一角翹起來了，看起來不太整齊。",
    action: "要把它整理好嗎？",
    actionLabel: "鋪平地墊"
  }
];

// 家具碰撞範圍使用 900×600 的虛擬座標，和畫面縮放無關。
const exploreColliders = [
  { x: 62,  y: 42,  w: 180, h: 150 }, // 左上書櫃
  { x: 282, y: 88,  w: 270, h: 132 }, // 沙發
  { x: 314, y: 224, w: 220, h: 78  }, // 茶几
  { x: 575, y: 95,  w: 104, h: 116 }, // 床邊桌
  { x: 690, y: 82,  w: 138, h: 172 }, // 床
  { x: 805, y: 195, w: 58,  h: 132 }  // 右側櫃子
];

// 四向走路:用裝扮台角色的 down/up/left/right 各 6 幀,依移動方向切換。
const EXPLORE_FRAME_SECONDS = 0.09;
let exploreWalkDraw = null;
let exploreFacingDir = "up";
let exploreFrame = 0;
let exploreFrameClock = 0;
let exploreDrawnKey = "";

function paintExploreSprite() {
  if (!exploreWalkDraw || !explorePlayerCharacter) return;
  const key = `${exploreFacingDir}:${exploreFrame}`;
  if (key === exploreDrawnKey) return;
  const canvas = explorePlayerCharacter.querySelector("canvas.mm-character-canvas");
  if (!canvas) return;
  exploreWalkDraw(canvas, exploreFacingDir, exploreFrame);
  exploreDrawnKey = key;
}

function applyExploreSelectedPlayer() {
  if (!explorePlayerCharacter) return;
  // Room 1 cane interaction uses the same player appearance as other rooms and
  // the wardrobe walk atlas, one row per facing direction. Collision code is unchanged.
  const characters = window.MemoryMazeCharacters;
  exploreDrawnKey = "";
  Promise.resolve(characters?.renderHost(explorePlayerCharacter))
    .then(() => characters?.prepareWalk?.())
    .then((draw) => {
      if (!draw) return;
      exploreWalkDraw = draw;
      paintExploreSprite();
    })
    .catch((error) => console.error("[room1] walk sprite failed", error));
  const player = window.MemoryMazeCharacters?.getPlayer();
  explorePlayer.setAttribute("aria-label", `${player?.name || "玩家"}正在探索房間`);
}

function startImpactMission() {
  resetExploreMission();
  applyExploreSelectedPlayer();
  showView(impactRunnerView);
  impactMissionBar.hidden = false;
  impactGameWrap.hidden = false;
  exploreResult.hidden = true;
  if (impactClueRevealArea) impactClueRevealArea.hidden = false;
  if (revealImpactClue) revealImpactClue.hidden = true;
  document.querySelector('[data-learning-topic="safety"]')?.dispatchEvent(new CustomEvent("learning-reset"));
  exploreGameActive = true;
  updateExplorePlayer();
  window.setTimeout(() => exploreStage?.focus(), 80);
  startExploreLoop();
  if (!exploreHintSeen) {
    exploreHintSeen = true;
    window.setTimeout(() => {
      if (impactRunnerView.hidden || exploreDialogOpen) return;
      exploreDialogOpen = true;
      showHint(copy1.cane.hint.dialog).then(() => { exploreDialogOpen = false; exploreStage?.focus(); });
    }, 350);
  }
}
document.querySelector("#exploreHintButton")?.addEventListener("click", () => {
  if (exploreDialogOpen || exploreCompleted) return;
  exploreDialogOpen = true;
  exploreKeys.clear();
  showHint(copy1.cane.hint.button).then(() => { exploreDialogOpen = false; exploreStage?.focus(); });
});

function resetExploreMission() {
  stopRunnerGame();
  exploreKeys.clear();
  exploreX = 450;
  exploreY = 520;
  exploreLastTime = 0;
  exploreNearest = null;
  exploreCompleted = false;
  exploreMoving = false;
  exploreFacingDir = "up";
  exploreFrame = 0;
  exploreFrameClock = 0;
  exploreGameActive = false;
  exploreDialogOpen = false;
  exploreHasMop=false;exploreWaterSuppressed=false;exploreMopFinished=false;explorePlayer?.classList.remove("has-mop","is-mopping-player");document.querySelector("#exploreWater")?.classList.remove("is-drying","is-dried");
  if(exploreMop)exploreMop.hidden=false;if(exploreMopStatus)exploreMopStatus.hidden=true;
  exploreState.light = false;
  exploreState.water = false;
  exploreState.rug = false;
  exploreStage?.classList.remove("lights-on");
  exploreSwitch?.classList.remove("is-done");
  exploreWater?.classList.remove("is-done");
  exploreRug?.classList.remove("is-done");
  if (exploreRugImage) exploreRugImage.src = "assets/cane-rug-curled-clean.png";
  setBar(exploreBar, 0);
  if (exploreResult) exploreResult.hidden = true;
  updateExplorePlayer();
}

function stopRunnerGame() {
  if(exploreMopTimer!==null){window.clearTimeout(exploreMopTimer);exploreMopTimer=null;}
  if(exploreMopEffect){exploreMopEffect.hidden=true;exploreMopEffect.classList.remove("is-mopping");}
  exploreGameActive = false;
  exploreKeys.clear();
  explorePlayer?.classList.remove("is-walking");
  if (exploreFrameId) {
    window.cancelAnimationFrame(exploreFrameId);
    exploreFrameId = null;
  }
}

function startExploreLoop() {
  if (exploreFrameId) window.cancelAnimationFrame(exploreFrameId);
  exploreLastTime = performance.now();
  exploreFrameId = window.requestAnimationFrame(exploreLoop);
}

function exploreLoop(now) {
  if (!impactRunnerView || impactRunnerView.hidden || !exploreGameActive) {
    exploreFrameId = null;
    exploreKeys.clear();
    explorePlayer?.classList.remove("is-walking");
    return;
  }
  const dt = Math.min(0.035, Math.max(0, (now - exploreLastTime) / 1000));
  exploreLastTime = now;
  updateExploreMovement(dt);
  updateExploreInteraction();
  exploreFrameId = window.requestAnimationFrame(exploreLoop);
}

function updateExploreMovement(dt) {
  if (exploreDialogOpen || exploreCompleted) {
    if (exploreMoving) {
      exploreMoving = false;
      explorePlayer?.classList.remove("is-walking");
      exploreFrame = 0;
      paintExploreSprite();
    }
    return;
  }

  let dx = 0;
  let dy = 0;
  if (exploreKeys.has("arrowleft") || exploreKeys.has("a")) dx -= 1;
  if (exploreKeys.has("arrowright") || exploreKeys.has("d")) dx += 1;
  if (exploreKeys.has("arrowup") || exploreKeys.has("w")) dy -= 1;
  if (exploreKeys.has("arrowdown") || exploreKeys.has("s")) dy += 1;

  if (dx !== 0 || dy !== 0) {
    const mag = Math.hypot(dx, dy) || 1;
    dx /= mag;
    dy /= mag;
    const nextX = exploreX + dx * EXPLORE_SPEED * dt;
    const nextY = exploreY + dy * EXPLORE_SPEED * dt;

    if (!exploreBlocked(nextX, exploreY)) exploreX = nextX;
    if (!exploreBlocked(exploreX, nextY)) exploreY = nextY;

    if (Math.abs(dx) > Math.abs(dy)) {
      setExploreFacing(dx < 0 ? "left" : "right");
    } else {
      setExploreFacing(dy < 0 ? "up" : "down");
    }
    if (!exploreMoving) {
      exploreMoving = true;
      exploreFrameClock = 0;
      explorePlayer?.classList.add("is-walking");
    }
    exploreFrameClock += dt;
    while (exploreFrameClock >= EXPLORE_FRAME_SECONDS) {
      exploreFrameClock -= EXPLORE_FRAME_SECONDS;
      exploreFrame = (exploreFrame + 1) % 6;
    }
    paintExploreSprite();
  } else if (exploreMoving) {
    exploreMoving = false;
    explorePlayer?.classList.remove("is-walking");
    exploreFrame = 0;
    paintExploreSprite();
  }
  updateExplorePlayer();
}

function exploreBlocked(x, y) {
  if (x < 42 || x > 858 || y < 48 || y > 558) return true;
  return exploreColliders.some((rect) => {
    const nearestX = Math.max(rect.x, Math.min(x, rect.x + rect.w));
    const nearestY = Math.max(rect.y, Math.min(y, rect.y + rect.h));
    const distX = x - nearestX;
    const distY = y - nearestY;
    return distX * distX + distY * distY < EXPLORE_PLAYER_RADIUS * EXPLORE_PLAYER_RADIUS;
  });
}

function setExploreFacing(direction) {
  if (!explorePlayer) return;
  explorePlayer.classList.remove("facing-up", "facing-down", "facing-left", "facing-right");
  explorePlayer.classList.add(`facing-${direction}`);
  exploreFacingDir = direction;
}

function updateExplorePlayer() {
  if (!explorePlayer) return;
  explorePlayer.style.left = `${(exploreX / EXPLORE_WORLD.width) * 100}%`;
  explorePlayer.style.top = `${(exploreY / EXPLORE_WORLD.height) * 100}%`;
}

function updateExploreInteraction() {
  if (!exploreGameActive || exploreCompleted || exploreDialogOpen) return;

  let nearest = null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  const waterItem=exploreInteractions.find(item=>item.id==="water");
  if(exploreWaterSuppressed&&Math.hypot(exploreX-waterItem.x,exploreY-waterItem.y)>waterItem.radius+15)exploreWaterSuppressed=false;
  for (const item of [...exploreInteractions,...(exploreHasMop?[]:[exploreMopItem])]) {
    if(item.id==="water"&&exploreWaterSuppressed)continue;
    if (exploreState[item.id]) continue;
    const distance = Math.hypot(exploreX - item.x, exploreY - item.y);
    if (distance <= item.radius && distance < nearestDistance) {
      nearest = item;
      nearestDistance = distance;
    }
  }

  exploreNearest = nearest;
  if (nearest) openExploreInteraction(nearest);
}

async function openExploreInteraction(item) {
  if (!item || exploreDialogOpen) return;
  exploreDialogOpen = true;
  exploreKeys.clear();
  explorePlayer?.classList.remove("is-walking");
  exploreMoving = false;
  /* 與朋友版 w10_1114 整合:水漬要先找到左下角的長柄拖把,再回來扶牆拖地(朋友版遊戲設計);對話改用本專案的 NPC 對話框 */
  if (item.id === "water" || item.id === "mop") { await openMopDialog(item); return; }
  // 玩家發現 → NPC 詢問 → 按鈕動作
  await StoryDialog.play({
    npc: 1, position: "bottom",
    lines: [
      { who: "player", text: `${item.title}。${item.info}` },
      { who: "npc", text: item.action, buttons: [{ label: item.actionLabel, value: true }] }
    ]
  });
  await performExploreInteraction(item);
}

async function openMopDialog(item) {
  if (item.id === "mop") {
    await StoryDialog.play({ npc: 1, position: "bottom", lines: [
      { who: "player", text: `${item.title}。` },
      { who: "npc", text: item.info, buttons: [{ label: "拿起拖把", value: true }] }
    ] });
    exploreHasMop = true; if (exploreMop) exploreMop.hidden = true; explorePlayer?.classList.add("has-mop");
    exploreMopStatus.hidden = false; exploreMopStatus.textContent = "拿到長柄拖把了。";
    closeExploreMopDialog(); return;
  }
  if (!exploreHasMop) {
    await StoryDialog.play({ npc: 1, position: "bottom", lines: [
      { who: "player", text: `${item.title}。${item.info}` },
      { who: "npc", text: `${exploreCustomName()}！！！蹲下擦乾水漬可能會有跌倒危險哦！！！`, buttons: [{ label: "找找看有沒有合適的工具", value: true }] }
    ] });
    exploreWaterSuppressed = true;
    exploreMopStatus.hidden = false; exploreMopStatus.textContent = "蹲著擦太危險……房間裡有沒有能站著擦地的工具？";
    closeExploreMopDialog(); return;
  }
  await StoryDialog.play({ npc: 1, position: "bottom", lines: [
    { who: "npc", text: "使用長柄拖把，不必蹲下。扶穩牆面，小心擦乾水漬。", buttons: [{ label: "扶牆小心拖地", value: true }] }
  ] });
  startExploreMopping(item);
}

async function performExploreInteraction(item) {
  if (!item || exploreCompleted || exploreState[item.id]) { exploreDialogOpen = false; return; }

  if(item.id==="water"&&(!exploreHasMop||!exploreMopFinished)){exploreDialogOpen=false;return;}
  exploreState[item.id] = true;
  if (item.id === "rug") {
    if (exploreRugImage) exploreRugImage.src = "assets/cane-rug-flat-clean.png";
    exploreRug?.classList.add("is-flat");
  } else {
    item.element?.classList.add("is-done");
  }
  explorePlayer?.classList.remove("is-interacting");
  void explorePlayer?.offsetWidth;
  explorePlayer?.classList.add("is-interacting");
  window.setTimeout(() => explorePlayer?.classList.remove("is-interacting"), 420);

  if (item.id === "light") exploreStage?.classList.add("lights-on");

  const done = Object.values(exploreState).filter(Boolean).length;
  exploreNearest = null;
  await awardStar(item.element || explorePlayer, exploreBar, done);

  if (done >= 3) {
    await completeExploreMission();
  } else {
    await StoryDialog.ask({ npc: 1, position: "bottom", text: copy1.cane.doneEach[done - 1] });
    exploreDialogOpen = false;
    exploreStage?.focus();
  }
}

async function completeExploreMission() {
  exploreCompleted = true;
  stopRunnerGame();
  await StoryDialog.play({ npc: 1, position: "center", lines: copy1.cane.allDone });
  /* 第三修改計劃 B4:同一顆按鈕「完成學習」→ 寶物 →「返回房間」 */
  StoryDialog.finishButton(revealImpactClue, { finish: async () => { AchievementSystem.completeActivity("vision", "cane"); markFound("cane"); await AchievementSystem.obtainItem("vision_fixation_card"); }, back: returnToRoom });
  exploreDialogOpen = false;
  impactGameWrap.hidden = true;
  exploreResult.hidden = false;
  document.querySelector('[data-learning-topic="safety"]')?.dispatchEvent(new CustomEvent("learning-reset"));
  exploreResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
  if (impactClueRevealArea) impactClueRevealArea.hidden = false;
  window.setTimeout(() => exploreResult.querySelector(".next-learning")?.focus(), 80);
}


function normalizeExploreKey(event) {
  return String(event.key || "").toLowerCase();
}

document.addEventListener("keydown", (event) => {
  if (!impactRunnerView || impactRunnerView.hidden || !exploreGameActive || exploreDialogOpen) return;
  const key = normalizeExploreKey(event);
  const movementKeys = ["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d"];
  if (movementKeys.includes(key)) {
    event.preventDefault();
    exploreKeys.add(key);
    exploreStage?.focus();
  }
});

document.addEventListener("keyup", (event) => {
  if (!impactRunnerView || impactRunnerView.hidden) return;
  const key = normalizeExploreKey(event);
  exploreKeys.delete(key);
});


// ------------------------------
// V8：臺南 ICOPE 醫療資源任務
// 查詢功能 + 3 題固定 5×5 旋轉路徑任務
// ------------------------------
const resourceHomeStep = document.querySelector("#resourceHomeStep");
const resourceQueryStep = document.querySelector("#resourceQueryStep");
const resourceMissionStep = document.querySelector("#resourceMissionStep");
const resourceMissionResult = document.querySelector("#resourceMissionResult");
const resourceFinalStep = document.querySelector("#resourceFinalStep");
const resourceStepChip = document.querySelector("#resourceStepChip");
const openResourceQuery = document.querySelector("#openResourceQuery");
const startEmergencyMissionButton = document.querySelector("#startEmergencyMission");
const queryBackHome = document.querySelector("#queryBackHome");
const missionBackHome = document.querySelector("#missionBackHome");
const districtChoices = document.querySelector("#districtChoices");
const queryUnitArea = document.querySelector("#queryUnitArea");
const selectedDistrictName = document.querySelector("#selectedDistrictName");
const unitCards = document.querySelector("#unitCards");
const changeDistrict = document.querySelector("#changeDistrict");
const unitDetailDialog = document.querySelector("#unitDetailDialog");
const closeUnitDetail = document.querySelector("#closeUnitDetail");
const routePuzzleBoard = document.querySelector("#routePuzzleBoard");
const missionPuzzleTitle = document.querySelector("#missionPuzzleTitle");
const missionPersonName = document.querySelector("#missionPersonName");
const missionStory = document.querySelector("#missionStory");
const missionConditions = document.querySelector("#missionConditions");
const missionConditionStatus = document.querySelector("#missionConditionStatus");
const missionProgressText = document.querySelector("#missionProgressText");
const puzzleLiveHint = document.querySelector("#puzzleLiveHint");
const missionResultType = document.querySelector("#missionResultType");
const missionResultName = document.querySelector("#missionResultName");
const missionResultDistrict = document.querySelector("#missionResultDistrict");
const missionResultAddress = document.querySelector("#missionResultAddress");
const missionResultPhone = document.querySelector("#missionResultPhone");
const nextEmergencyMission = document.querySelector("#nextEmergencyMission");
const continueResourceQuery = document.querySelector("#continueResourceQuery");
const resourceQueryComplete = document.querySelector("#resourceQueryComplete");

const resourceData = {
  "東區": [
    { type: "衛生所", name: "臺南市東區衛生所", address: "臺南市東區林森路一段418號", phone: "06-2674085" },
    { type: "醫院", name: "衛生福利部胸腔病院", address: "臺南市東區大同路一段69號", phone: "06-2146006" },
    { type: "醫院", name: "台灣基督長老教會新樓醫療財團法人台南新樓醫院", address: "臺南市東區東門路一段57號", phone: "06-2748316" },
    { type: "驗光所", name: "亞設驗光所", address: "臺南市東區中西里東寧路176號1樓", phone: "0987297065" }
  ],
  "北區": [
    { type: "醫院", name: "國立成功大學醫學院附設醫院", address: "臺南市北區勝利路138號", phone: "06-2353535" },
    { type: "衛生所", name: "臺南市北區衛生所", address: "臺南市北區西華街50號", phone: "06-2252404" },
    { type: "診所", name: "安和中醫診所", address: "臺南市北區北安路一段178號", phone: "06-2519388" },
    { type: "驗光所", name: "玖玖驗光所", address: "臺南市北區文成二路50號", phone: "06-2514753" }
  ],
  "佳里區": [
    { type: "醫院", name: "奇美醫療財團法人佳里奇美醫院", address: "臺南市佳里區佳里興佳興里606號", phone: "06-7263333" },
    { type: "衛生所", name: "臺南市佳里區衛生所", address: "臺南市佳里區進學路159號", phone: "06-7224106" },
    { type: "診所", name: "謝樂偉眼科診所", address: "臺南市佳里區文化路205號", phone: "06-7234303" },
    { type: "驗光所", name: "中山驗光所", address: "臺南市佳里區新生路313號", phone: "06-7222369" }
  ]
};

const DIRS = ["N", "E", "S", "W"];
const OPP = { N: "S", E: "W", S: "N", W: "E" };
const DELTA = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] };
const SHAPE_SIDES = {
  straight: ["N", "S"],
  corner: ["N", "E"],
  tee: ["N", "E", "W"]
};

function makeDecoyTiles(overrides = {}) {
  const base = [];
  const shapes = ["corner", "straight", "corner", "tee", "straight"];
  for (let r = 0; r < 5; r += 1) {
    for (let c = 0; c < 5; c += 1) {
      const key = `${r}-${c}`;
      base.push({
        row: r,
        col: c,
        shape: shapes[(r * 2 + c) % shapes.length],
        rot: ((r * 3 + c * 2 + 1) % 4),
        role: "normal",
        label: ""
      });
      if (overrides[key]) Object.assign(base[base.length - 1], overrides[key]);
    }
  }
  return base;
}

const emergencyMissions = [
  {
    person: "王奶奶",
    story: "王奶奶住在佳里區，家人希望幫她找到眼科診所，並確認有可聯絡的電話。",
    conditions: ["佳里區", "眼科診所", "電話"],
    unit: { type: "診所", name: "謝樂偉眼科診所", district: "佳里區", address: "臺南市佳里區文化路205號", phone: "06-7234303" },
    start: [2, 0, "E"],
    end: [4, 4, "N"],
    tiles: makeDecoyTiles({
      "2-1": { shape: "straight", rot: 1, role: "condition", label: "佳里區" },
      "2-2": { shape: "corner", rot: 3 },
      "1-2": { shape: "straight", rot: 0 },
      "0-2": { shape: "corner", rot: 1 },
      "0-3": { shape: "straight", rot: 1, role: "condition", label: "眼科診所" },
      "0-4": { shape: "corner", rot: 2 },
      "1-4": { shape: "straight", rot: 0, role: "condition", label: "電話" },
      "2-4": { shape: "straight", rot: 0 },
      "3-4": { shape: "straight", rot: 0 },
      "2-0": { role: "start", label: "需求" },
      "4-4": { role: "end", label: "目標" }
    }),
    scramble: { "2-1": 0, "2-2": 0, "1-2": 1, "0-2": 0, "0-3": 0, "0-4": 1, "1-4": 1, "2-4": 1, "3-4": 1 }
  },
  {
    person: "林阿公",
    story: "林阿公住在東區，家人想先找到當地衛生所，並確認可以電話聯絡。",
    conditions: ["東區", "衛生所", "電話"],
    unit: { type: "衛生所", name: "臺南市東區衛生所", district: "東區", address: "臺南市東區林森路一段418號", phone: "06-2674085" },
    start: [4, 0, "E"],
    end: [0, 0, "E"],
    tiles: makeDecoyTiles({
      "4-1": { shape: "corner", rot: 3 },
      "3-1": { shape: "straight", rot: 0, role: "condition", label: "東區" },
      "2-1": { shape: "corner", rot: 1 },
      "2-2": { shape: "straight", rot: 1 },
      "2-3": { shape: "corner", rot: 3 },
      "1-3": { shape: "straight", rot: 0, role: "condition", label: "衛生所" },
      "0-3": { shape: "corner", rot: 2 },
      "0-2": { shape: "straight", rot: 1, role: "condition", label: "電話" },
      "0-1": { shape: "straight", rot: 1 },
      "4-0": { role: "start", label: "需求" },
      "0-0": { role: "end", label: "目標" }
    }),
    scramble: { "4-1": 1, "3-1": 1, "2-1": 0, "2-2": 0, "2-3": 1, "1-3": 1, "0-3": 0, "0-2": 0, "0-1": 0 }
  },
  {
    person: "陳伯伯",
    story: "陳伯伯人在北區，家人想找到醫院並先確認聯絡電話，方便詢問後續就醫資訊。",
    conditions: ["北區", "醫院", "電話"],
    unit: { type: "醫院", name: "國立成功大學醫學院附設醫院", district: "北區", address: "臺南市北區勝利路138號", phone: "06-2353535" },
    start: [0, 0, "E"],
    end: [4, 0, "E"],
    tiles: makeDecoyTiles({
      "0-1": { shape: "straight", rot: 1 },
      "0-2": { shape: "corner", rot: 2 },
      "1-2": { shape: "straight", rot: 0, role: "condition", label: "北區" },
      "2-2": { shape: "corner", rot: 0 },
      "2-3": { shape: "straight", rot: 1, role: "condition", label: "醫院" },
      "2-4": { shape: "corner", rot: 2 },
      "3-4": { shape: "straight", rot: 0 },
      "4-4": { shape: "corner", rot: 3 },
      "4-3": { shape: "straight", rot: 1, role: "condition", label: "電話" },
      "4-2": { shape: "straight", rot: 1 },
      "4-1": { shape: "straight", rot: 1 },
      "0-0": { role: "start", label: "需求" },
      "4-0": { role: "end", label: "目標" }
    }),
    scramble: { "0-1": 0, "0-2": 0, "1-2": 1, "2-2": 1, "2-3": 0, "2-4": 0, "3-4": 1, "4-4": 1, "4-3": 0, "4-2": 0, "4-1": 0 }
  }
];

let resourceSelectedDistrict = null;
let currentEmergencyMission = 0;
let completedEmergencyMissions = 0;
let currentPuzzleTiles = [];
let missionSolved = false;
let resourceFinalTimer = null;

function showResourceSubstep(step) {
  [resourceHomeStep, resourceQueryStep, resourceMissionStep, resourceMissionResult, resourceFinalStep ].forEach((section) => {
    if (section) section.hidden = section !== step;
  });
}

function startResourceMission() {
  resourceSelectedDistrict = null;
  currentEmergencyMission = 0;
  completedEmergencyMissions = 0;
  missionSolved = false;
  if (resourceFinalTimer) window.clearTimeout(resourceFinalTimer);
  if (unitDetailDialog) unitDetailDialog.hidden = true;
  showView(resourceView);
  setBar(resourceStepChip, 0);
  startEmergencyMission(0);
}

function openResourceQueryAfterMission() {
  if (unitDetailDialog) unitDetailDialog.hidden = true;
  showResourceSubstep(resourceQueryStep);
  setBar(resourceStepChip, emergencyMissions.length);
  resourceSelectedDistrict = null;
  if (queryUnitArea) queryUnitArea.hidden = true;
  renderDistrictChoices();
  window.setTimeout(() => districtChoices?.querySelector("button")?.focus(), 50);
  if (!resourceQueryHintSeen) {
    resourceQueryHintSeen = true;
    showHint(copy1.pills.queryHint.dialog);
  }
}
let resourceQueryHintSeen = false;
let resourceMissionHintSeen = false;
document.querySelector("#resourceQueryHint")?.addEventListener("click", () => showHint(copy1.pills.queryHint.button));
document.querySelector("#resourceHintButton")?.addEventListener("click", () => showHint(copy1.pills.hint.button));

continueResourceQuery?.addEventListener("click", openResourceQueryAfterMission);
/* 第三修改計劃 B4:同一顆按鈕「完成學習」→ 寶物 →「返回房間」 */
StoryDialog.finishButton(resourceQueryComplete, { finish: async () => {
  if (unitDetailDialog) unitDetailDialog.hidden = true;
  // 整個流程(拼圖 + 查詢)走完才算通關、給寶物
  await StoryDialog.play({ npc: 1, position: "center", lines: copy1.pills.finish });
  AchievementSystem.completeActivity("vision", "pills"); markFound("pills");
  await AchievementSystem.obtainItem("vision_reading_box");
}, back: returnToRoom });

function renderDistrictChoices() {
  if (!districtChoices) return;
  districtChoices.innerHTML = "";
  Object.keys(resourceData).forEach((district) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "district-choice";
    button.innerHTML = `<span class="district-pin" aria-hidden="true">◆</span><strong>${district}</strong><small>${resourceData[district].length} 個示範單位</small>`;
    button.addEventListener("click", () => selectResourceDistrict(district));
    districtChoices.appendChild(button);
  });
}

function selectResourceDistrict(district) {
  resourceSelectedDistrict = district;
  selectedDistrictName.textContent = district;
  queryUnitArea.hidden = false;
  renderResourceUnits();
  unitCards?.querySelector("button")?.focus();
}

function renderResourceUnits() {
  if (!unitCards || !resourceSelectedDistrict) return;
  unitCards.innerHTML = "";
  resourceData[resourceSelectedDistrict].forEach((unit, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "unit-card";
    button.innerHTML = `<span class="unit-card-index">${String(index + 1).padStart(2, "0")}</span><span class="unit-type-badge">${unit.type}</span><strong>${unit.name}</strong><small>點擊查看地址與電話</small>`;
    button.addEventListener("click", () => openResourceUnit(unit));
    unitCards.appendChild(button);
  });
}

function openResourceUnit(unit) {
  document.querySelector("#unitDetailType").textContent = unit.type;
  document.querySelector("#unitDetailName").textContent = unit.name;
  document.querySelector("#unitDetailDistrict").textContent = resourceSelectedDistrict;
  document.querySelector("#unitDetailAddress").textContent = unit.address;
  document.querySelector("#unitDetailPhone").textContent = unit.phone;
  unitDetailDialog.hidden = false;
  closeUnitDetail?.focus();
}

function closeResourceDetail() {
  if (!unitDetailDialog) return;
  unitDetailDialog.hidden = true;
}

closeUnitDetail?.addEventListener("click", closeResourceDetail);
unitDetailDialog?.addEventListener("click", (event) => {
  if (event.target === unitDetailDialog) closeResourceDetail();
});

changeDistrict?.addEventListener("click", () => {
  resourceSelectedDistrict = null;
  queryUnitArea.hidden = true;
  renderDistrictChoices();
  districtChoices?.querySelector("button")?.focus();
});

function rotateSides(sides, rot) {
  return sides.map((side) => DIRS[(DIRS.indexOf(side) + rot) % 4]);
}

function tileSides(tile) {
  if (tile.role === "start") return [emergencyMissions[currentEmergencyMission].start[2]];
  if (tile.role === "end") return [emergencyMissions[currentEmergencyMission].end[2]];
  return rotateSides(SHAPE_SIDES[tile.shape] || [], tile.rot % 4);
}

function startEmergencyMission(index) {
  currentEmergencyMission = index;
  missionSolved = false;
  const mission = emergencyMissions[index];
  currentPuzzleTiles = mission.tiles.map((tile) => {
    const clone = { ...tile };
    const key = `${clone.row}-${clone.col}`;
    if (mission.scramble[key] !== undefined && clone.role !== "start" && clone.role !== "end") {
      clone.rot = mission.scramble[key];
    }
    return clone;
  });

  showResourceSubstep(resourceMissionStep);
  setBar(resourceStepChip, completedEmergencyMissions);
  missionPuzzleTitle.textContent = `任務 ${index + 1}／${emergencyMissions.length}`;
  missionPersonName.textContent = mission.person;
  missionStory.textContent = mission.story;
  missionConditions.innerHTML = mission.conditions.map((condition) => `<div class="mission-condition-chip"><span>●</span><strong>${condition}</strong></div>`).join("");
  missionConditionStatus.innerHTML = mission.conditions.map((condition) => `<div data-condition-status="${condition}"><span>○</span>${condition}</div>`).join("");
  renderRoutePuzzle();
  updatePuzzleConnectivity();
  routePuzzleBoard?.querySelector("button:not(:disabled)")?.focus();
  if (!resourceMissionHintSeen) {
    resourceMissionHintSeen = true;
    window.setTimeout(() => { if (!resourceView.hidden) showHint(copy1.pills.hint.dialog); }, 350);
  }
}

function renderRoutePuzzle() {
  if (!routePuzzleBoard) return;
  routePuzzleBoard.innerHTML = "";
  currentPuzzleTiles.forEach((tile, index) => {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = `route-tile role-${tile.role || "normal"}`;
    cell.dataset.index = String(index);
    cell.setAttribute("role", "gridcell");
    cell.setAttribute("aria-label", tile.label ? `${tile.label} 方格` : "可旋轉路徑方格");
    if (tile.role === "start" || tile.role === "end") {
      cell.disabled = true;
      cell.classList.add("is-fixed");
    }
    const pipe = document.createElement("span");
    pipe.className = "route-pipe";
    pipe.setAttribute("aria-hidden", "true");
    pipe.innerHTML = '<i class="pipe-center"></i><i class="pipe-arm arm-n"></i><i class="pipe-arm arm-e"></i><i class="pipe-arm arm-s"></i><i class="pipe-arm arm-w"></i>';
    cell.appendChild(pipe);
    if (tile.label) {
      const label = document.createElement("span");
      label.className = "route-tile-label";
      label.textContent = tile.label;
      cell.appendChild(label);
    }
    cell.addEventListener("click", () => rotatePuzzleTile(index));
    routePuzzleBoard.appendChild(cell);
    paintTile(cell, tile);
  });
}

function paintTile(cell, tile) {
  const sides = tileSides(tile);
  const pipe = cell.querySelector(".route-pipe");
  if (!pipe) return;
  pipe.className = "route-pipe";
  sides.forEach((side) => pipe.classList.add(`side-${side.toLowerCase()}`));
  cell.style.setProperty("--tile-rot", `${tile.rot * 90}deg`);
}

function rotatePuzzleTile(index) {
  if (missionSolved) return;
  const tile = currentPuzzleTiles[index];
  if (!tile || tile.role === "start" || tile.role === "end") return;
  tile.rot = (tile.rot + 1) % 4;
  const cell = routePuzzleBoard.querySelector(`[data-index="${index}"]`);
  if (cell) {
    cell.classList.add("is-rotating");
    paintTile(cell, tile);
    window.setTimeout(() => cell.classList.remove("is-rotating"), 190);
  }
  updatePuzzleConnectivity();
}

function getTileAt(row, col) {
  return currentPuzzleTiles.find((tile) => tile.row === row && tile.col === col) || null;
}

function updatePuzzleConnectivity() {
  const mission = emergencyMissions[currentEmergencyMission];
  const startTile = getTileAt(mission.start[0], mission.start[1]);
  if (!startTile) return;
  const visited = new Set();
  const queue = [startTile];
  visited.add(`${startTile.row}-${startTile.col}`);

  while (queue.length) {
    const tile = queue.shift();
    const sides = tileSides(tile);
    for (const side of sides) {
      const [dr, dc] = DELTA[side];
      const next = getTileAt(tile.row + dr, tile.col + dc);
      if (!next) continue;
      const nextSides = tileSides(next);
      if (!nextSides.includes(OPP[side])) continue;
      const key = `${next.row}-${next.col}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push(next);
      }
    }
  }

  [...routePuzzleBoard.children].forEach((cell, index) => {
    const tile = currentPuzzleTiles[index];
    cell.classList.toggle("is-connected", visited.has(`${tile.row}-${tile.col}`));
  });

  const reachedConditions = new Set();
  currentPuzzleTiles.forEach((tile) => {
    if (tile.role === "condition" && visited.has(`${tile.row}-${tile.col}`)) reachedConditions.add(tile.label);
  });
  mission.conditions.forEach((condition) => {
    const row = missionConditionStatus.querySelector(`[data-condition-status="${condition}"]`);
    if (!row) return;
    const reached = reachedConditions.has(condition);
    row.classList.toggle("is-reached", reached);
    row.querySelector("span").textContent = reached ? "✓" : "○";
  });

  const endKey = `${mission.end[0]}-${mission.end[1]}`;
  const success = visited.has(endKey) && mission.conditions.every((condition) => reachedConditions.has(condition));
  puzzleLiveHint.textContent = `已接通 ${reachedConditions.size}／${mission.conditions.length} 個條件${visited.has(endKey) ? "，「目標」已接通" : ""}。`;
  if (success) completeEmergencyMission();
}

function completeEmergencyMission() {
  if (missionSolved) return;
  missionSolved = true;
  completedEmergencyMissions = Math.max(completedEmergencyMissions, currentEmergencyMission + 1);
  [...routePuzzleBoard.querySelectorAll("button")].forEach((button) => { button.disabled = true; });
  puzzleLiveHint.textContent = "路徑完整接通！";
  window.setTimeout(async () => {
    const mission = emergencyMissions[currentEmergencyMission];
    await awardStar(routePuzzleBoard, resourceStepChip, completedEmergencyMissions);
    await StoryDialog.ask({ npc: 1, position: "bottom", text: copy1.pills.solved(mission.person) });
    missionResultType.textContent = mission.unit.type;
    missionResultName.textContent = mission.unit.name;
    missionResultDistrict.textContent = mission.unit.district;
    missionResultAddress.textContent = mission.unit.address;
    missionResultPhone.textContent = mission.unit.phone;
    nextEmergencyMission.textContent = currentEmergencyMission < emergencyMissions.length - 1 ? "下一個緊急任務" : "完成醫療資源任務";
    showResourceSubstep(resourceMissionResult);
    nextEmergencyMission.focus();
  }, 650);
}

nextEmergencyMission?.addEventListener("click", async () => {
  if (currentEmergencyMission < emergencyMissions.length - 1) {
    startEmergencyMission(currentEmergencyMission + 1);
    return;
  }
  await StoryDialog.play({ npc: 1, position: "center", lines: copy1.pills.final });
  openResourceQueryAfterMission();
});

  function loadLocalCataractImage() {
    const image = document.querySelector("#cataractImage");
    if (!image) return;
    image.onerror = () => image.classList.add("is-missing");
    image.classList.remove("is-missing");
    image.src = "assets/cataract-story-01.png";
  }

  // ===== 六房主架構整合：追蹤房間 1 五項活動 =====
  const returnToMainMap = document.querySelector("#returnToMainMap");

  function notifyParent(type, extra = {}) {
    if (window.parent !== window) window.parent.postMessage({ type, ...extra }, "*");
  }



  const room1Timer = document.querySelector("#room1Timer");
  const openRoom1Code = document.querySelector("#openRoom1Code");
  const room1CodeOverlay = document.querySelector("#room1CodeOverlay");
  const room1CodeInput = document.querySelector("#room1CodeInput");
  const room1CodeFeedback = document.querySelector("#room1CodeFeedback");
  const submitRoom1Code = document.querySelector("#submitRoom1Code");
  const closeRoom1Code = document.querySelector("#closeRoom1Code");
  // Passwords are maintained in AchievementData.flows.
  let room1TimerInterval = null;
  let room1Unlocked = false;
  let room1TimerRunning = true;
  let room1ActiveStartedAt = Date.now();
  let room1ElapsedMs = 0;

  function formatRoom1Time(totalSeconds) {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const sec = (totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }
  function getRoom1ElapsedMs() {
    return room1ElapsedMs + (room1TimerRunning && room1ActiveStartedAt ? Date.now() - room1ActiveStartedAt : 0);
  }
  function updateRoom1Timer() {
    if (!room1Timer) return;
    room1Timer.textContent = `🕰️ ${formatRoom1Time(Math.floor(getRoom1ElapsedMs() / 1000))}`;
  }
  function pauseRoom1Timer() {
    if (!room1TimerRunning) return;
    room1ElapsedMs = getRoom1ElapsedMs();
    room1ActiveStartedAt = null;
    room1TimerRunning = false;
    updateRoom1Timer();
  }
  function resumeRoom1Timer() {
    if (room1Unlocked || AchievementSystem.getRoomProgress("vision").completed || room1TimerRunning) return;
    room1ActiveStartedAt = Date.now();
    room1TimerRunning = true;
    updateRoom1Timer();
  }
  updateRoom1Timer();
  room1TimerInterval = window.setInterval(updateRoom1Timer, 250);

  function showRoom1Code() {
    room1CodeOverlay.hidden = false;
    room1CodeFeedback.textContent = "請輸入在收集系統中發現的本房密碼。";
    room1CodeInput.value = "";
    window.setTimeout(() => room1CodeInput.focus(), 50);
  }
  function hideRoom1Code() { room1CodeOverlay.hidden = true; }
  function submitRoom1Password() {
    const value = room1CodeInput.value.trim();
    const result=AchievementSystem.submitPassword("vision",value);
    if(!result.correct){room1CodeFeedback.textContent=result.message;room1CodeInput.select();return;}
    room1Unlocked = true;
    pauseRoom1Timer();
    if (room1TimerInterval) window.clearInterval(room1TimerInterval);
    updateRoom1Timer();
    room1CodeFeedback.textContent = "✅ 密碼正確！房間 1 記憶修復完成。";
    submitRoom1Code.disabled = true;
    /* 第三修改計劃 B3:密碼正確後自動回配置圖(不再出現「返回配置圖」按鈕) */
    setTimeout(() => { const ov = document.querySelector("#room1CodeOverlay"); if (ov) ov.hidden = true; notifyParent("memoryMaze:room1Complete", { elapsedSeconds: Math.floor(getRoom1ElapsedMs() / 1000) }); }, 700);
  }

  openRoom1Code?.addEventListener("click", showRoom1Code);
  closeRoom1Code?.addEventListener("click", () => {
    if (room1Unlocked) {
      pauseRoom1Timer();
      notifyParent("memoryMaze:room1Return", { completed: true });
      return;
    }
    hideRoom1Code();
    room1CodeFeedback.textContent = "";
  });
  submitRoom1Code?.addEventListener("click", submitRoom1Password);
  room1CodeInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") submitRoom1Password();
  });

  returnToMainMap?.addEventListener("click", () => {
    pauseRoom1Timer();
    notifyParent("memoryMaze:room1Return", { completed: room1Unlocked });
  });
  window.addEventListener("message", (event) => {
    if ((event.data || {}).type === "memoryMaze:room1Resume") {
      const finished=AchievementSystem.getRoomProgress('vision').completed===true;
      if(finished){room1Unlocked=true;pauseRoom1Timer();hideRoom1Code();showView(roomView);}
      else {hideRoom1Code();resumeRoom1Timer();showView(roomView);}
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (room1CodeOverlay && !room1CodeOverlay.hidden && !room1Unlocked) { hideRoom1Code(); return; }
    if (!itemOverlay.hidden) closeItem.click();
    else if (!dialogOverlay.hidden || document.querySelector(".sd-overlay")) return;
    else if (!roomView.hidden) return;
    else returnToRoom();
  });

  // ===== V9.3：逐句衛教、語音助讀與關鍵詞解謎 =====
  const learningLines = {
    macular: [
      "黃斑部負責精細的中央視力。",
      "黃斑部病變可能讓中央視野模糊、扭曲或出現暗影。",
      "如果突然看見直線變彎或中央黑影，建議就醫檢查。"
    ],
    presbyopia: [
      "老花眼常讓近距離的小字變得模糊。",
      "把物品拿遠一點，通常會比較清楚。",
      "老花眼和水晶體調節能力下降有關；閱讀時也要保持充足光線。"
    ],
    cataract: [
      "白內障不是眼鏡或玻璃表面髒了。",
      "它會讓眼睛裡的水晶體逐漸變混濁，視野像隔著一層霧。",
      "晚上或遇到強光時，也可能更容易眩光、看不清楚。"
    ],
    safety: [
      "光線不足時，可能更難看清腳下和周圍環境。",
      "濕滑的地面容易讓人滑倒。",
      "翹起的地墊或地面障礙，可能讓人絆倒。",
      "保持環境明亮、乾燥、動線整齊，可以降低跌倒風險。"
    ],
    resource: [
      "需要協助時，可以先找離自己較近的醫療資源。",
      "查詢時要確認單位名稱、地址與電話。",
      "接下來完成 3 個路徑任務，練習找到符合條件的單位。"
    ]
  };

  // 黃斑部衛教：三幕獨立圖像與台詞，順序與 learningLines.macular 一一對應。
  const macularStoryScenes = [
    { image: "assets/macular-story-01.png", dialogue: "阿公：今天，我要宣布遺囑的內容……" },
    { image: "assets/macular-story-02.png", dialogue: "阿公：這遺囑上的名字怎麼歪七扭八？是不是有人動了手腳？！" },
    { image: "assets/macular-story-03.png", dialogue: "阿公：難道不是遺囑出了問題……是我的眼睛？" }
  ];

  // 老花眼衛教：三張獨立劇情圖，與逐句衛教文字同步。
  const presbyopiaStoryScenes = [
    { image: "assets/presbyopia-story-01.png", dialogue: "阿公：明晚八點，老地方見？這麼小的字……是誰傳給她的？" },
    { image: "assets/presbyopia-story-02.png", dialogue: "阿公：老銘？！手機拿遠終於看清了！她竟敢瞞著我？！" },
    { image: "assets/presbyopia-story-03.png", dialogue: "孫女：阿公，開燈、戴上眼鏡再看！是里長阿銘提醒阿嬤要參加健康講座啦！" }
  ];

  // 白內障衛教：眼藥水活動學習頁三幕劇情；僅影響衛教圖片及台詞。
  const cataractStoryScenes = [
    { image: "assets/cataract-story-01.png", dialogue: "阿公：眼鏡怎麼擦都看不清楚！我老婆呢？" },
    { image: "assets/cataract-story-02.png", dialogue: "阿公：老婆？！……咦？我是不是認錯人了？！" },
    { image: "assets/cataract-story-03.png", dialogue: "阿嬤：老伴！生日快樂！阿公：這燈好刺眼……看得更不清楚啦？！" }
  ];

  const safetyStoryScenes = [
    { image: "assets/safety-story-01.png", dialogue: "阿公：夭壽喔！這走廊黑漆漆，咱厝是不是有不乾淨的東西？！" },
    { image: "assets/safety-story-02.png", dialogue: "阿公：啊啊啊！水鬼抓我的腳啦！" },
    { image: "assets/safety-story-03.png", dialogue: "阿公：連地毯都有鬼？！救命啊！" },
    { image: "assets/safety-story-04.png", dialogue: "阿公：原來不是鬼要害我，是家裡太亂啦！" }
  ];

  const learningRevealTargets = {
    macular: "#startAssessment",
    presbyopia: "#startPresbyopiaAssessment",
    cataract: "#startCataractAssessment",
    safety: "#revealImpactClue"
  };

  function speakLearningText(text) {
    if (!("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-TW";
    utterance.rate = 0.85;
    const voices = window.speechSynthesis.getVoices?.() || [];
    const zhVoice = voices.find((voice) => /zh[-_](TW|Hant)/i.test(voice.lang)) || voices.find((voice) => /^zh/i.test(voice.lang));
    if (zhVoice) utterance.voice = zhVoice;
    window.speechSynthesis.speak(utterance);
  }

  document.querySelectorAll(".learning-stepper[data-learning-topic]").forEach((stepper) => {
    const topic = stepper.dataset.learningTopic;
    const lines = learningLines[topic] || [];
    const lineNode = stepper.querySelector(".learning-line");
    const nextButton = stepper.querySelector(".next-learning");
    const speakButton = stepper.querySelector(".speak-learning");
    let index = 0;
    if (!lineNode || !lines.length) return;

    const revealTarget = learningRevealTargets[topic] ? document.querySelector(learningRevealTargets[topic]) : null;
    const resourceActions = topic === "resource" ? document.querySelector("#resourceHomeStep .resource-home-actions") : null;
    if (revealTarget) revealTarget.hidden = true;
    if (resourceActions) resourceActions.hidden = true;

    const renderLine = () => {
      lineNode.textContent = lines[index];
      if (topic === "macular") {
        const scene = macularStoryScenes[index];
        const image = document.querySelector("#macularImage");
        const caption = document.querySelector("#macularStoryCaption");
        if (scene && image) {
          if (image.getAttribute("src") !== scene.image) image.src = scene.image;
          image.classList.remove("is-missing");
          image.alt = `黃斑部衛教劇情，第 ${index + 1} 幕`;
        }
        if (caption) caption.textContent = scene?.dialogue || "";
      }

      if (topic === "presbyopia") {
        const scene = presbyopiaStoryScenes[index];
        const image = document.querySelector("#presbyopiaImage");
        const caption = document.querySelector("#presbyopiaStoryCaption");
        if (scene && image) {
          if (image.getAttribute("src") !== scene.image) image.src = scene.image;
          image.classList.remove("is-missing");
          image.alt = `老花眼衛教劇情，第 ${index + 1} 幕`;
        }
        if (caption) caption.textContent = scene?.dialogue || "";
      }

      if (topic === "cataract") {
        const scene = cataractStoryScenes[index];
        const image = document.querySelector("#cataractImage");
        const caption = document.querySelector("#cataractStoryCaption");
        if (scene && image) {
          if (image.getAttribute("src") !== scene.image) image.src = scene.image;
          image.classList.remove("is-missing");
          image.alt = `白內障衛教劇情，第 ${index + 1} 幕`;
        }
        if (caption) caption.textContent = scene?.dialogue || "";
      }

      if (topic === "safety") {
        const scene = safetyStoryScenes[index];
        const image = document.querySelector("#safetyStoryImage");
        const caption = document.querySelector("#safetyStoryCaption");
        if (scene && image && image.getAttribute("src") !== scene.image) image.src = scene.image;
        if (image) image.alt = `行走安全衛教劇情，第 ${index + 1} 幕`;
        if (caption) caption.textContent = scene?.dialogue || "";
      }

      if (nextButton) {
        const final = index >= lines.length - 1;
        nextButton.hidden = final;
        nextButton.textContent = final ? "已閱讀" : "下一句 ▶";
      }
      if (index >= lines.length - 1) {
        if (revealTarget) revealTarget.hidden = false;
        if (resourceActions) resourceActions.hidden = false;
      }
    };

    nextButton?.addEventListener("click", () => {
      if (index < lines.length - 1) index += 1;
      renderLine();
    });
    speakButton?.addEventListener("click", () => speakLearningText(lineNode.textContent));
    stepper.addEventListener("learning-reset", () => {
      index = 0;
      if (revealTarget) revealTarget.hidden = true;
      renderLine();
    });
    renderLine();
  });


})();
