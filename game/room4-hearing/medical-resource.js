(() => {
"use strict";
const resourceView = document.querySelector("#resourceView");
const hearingApp = document.querySelector("#app");
if (!resourceView || !hearingApp) return;

// V8：臺南 ICOPE 醫療資源任務
// 查詢功能 + 3 題固定 5×5 旋轉路徑任務
// ------------------------------
const resourceHomeStep = document.querySelector("#resourceHomeStep");
const resourceQueryStep = document.querySelector("#resourceQueryStep");
const resourceMissionStep = document.querySelector("#resourceMissionStep");
const resourceMissionResult = document.querySelector("#resourceMissionResult");
const resourceFinalStep = document.querySelector("#resourceFinalStep");
const resourceStepChip = document.querySelector("#r4Bar");
const resourceHintBtn = document.querySelector("#resourceHint");
const M4 = () => window.StoryCopy.room4.medicine;
const seenHints = new Set();
let hintText = null;
function setBar(n) { if (resourceStepChip && window.StoryKit) window.StoryKit.setBar(resourceStepChip, n); }
/* 首次進入該畫面由 NPC 給提示;之後可按「💡 操作提示」重看 */
function enterPhase(id, hint) {
  hintText = hint;
  if (seenHints.has(id)) return Promise.resolve();
  seenHints.add(id);
  return window.R4.say(hint.lines);
}
resourceHintBtn?.addEventListener("click", () => { if (hintText) window.R4.say([hintText.button]); });
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
const resourceFinalReturn = document.querySelector("#resourceFinalReturn");

const resourceData = {
  "安南區": [
    { type: "醫院", name: "臺南市立安南醫院_委託中國醫藥大學興建經營", address: "臺南市安南區長和路二段66號", phone: "06-3553111" },
    { type: "衛生所", name: "臺南市安南區衛生所", address: "臺南市安南區仁安路70號", phone: "06-2567406" },
    { type: "診所", name: "魏大倫耳鼻喉科診所", address: "臺南市安南區安和路一段356號一樓", phone: "06-2568119" }
  ],
  "東區": [
    { type: "衛生所", name: "臺南市東區衛生所", address: "臺南市東區林森路一段418號", phone: "06-2674085" },
    { type: "醫院", name: "衛生福利部胸腔病院", address: "臺南市東區大同路一段69號", phone: "06-2146006" },
    { type: "醫院", name: "台灣基督長老教會新樓醫療財團法人台南新樓醫院", address: "臺南市東區東門路一段57號", phone: "06-2748316" }
  ],
  "北區": [
    { type: "醫院", name: "國立成功大學醫學院附設醫院", address: "臺南市北區勝利路138號", phone: "06-2353535" },
    { type: "衛生所", name: "臺南市北區衛生所", address: "臺南市北區西華街50號", phone: "06-2252404" }
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
    story: "王奶奶住在安南區，最近常常聽不清楚別人說話，家人希望幫她找到耳鼻喉科診所，並確認有可聯絡的電話。",
    conditions: ["安南區", "耳鼻喉科診所", "電話"],
    unit: { type: "診所", name: "魏大倫耳鼻喉科診所", district: "安南區", address: "臺南市安南區安和路一段356號一樓", phone: "06-2568119" },
    start: [2, 0, "E"],
    end: [4, 4, "N"],
    tiles: makeDecoyTiles({
      "2-1": { shape: "straight", rot: 1, role: "condition", label: "安南區" },
      "2-2": { shape: "corner", rot: 3 },
      "1-2": { shape: "straight", rot: 0 },
      "0-2": { shape: "corner", rot: 1 },
      "0-3": { shape: "straight", rot: 1, role: "condition", label: "耳鼻喉科診所" },
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
  resourceView.scrollTop = 0;
  [resourceHomeStep, resourceQueryStep, resourceMissionStep, resourceMissionResult, resourceFinalStep].forEach((section) => {
    if (section) section.hidden = section !== step;
  });
}

function startResourceMission() {
  // 醫藥盒也是獨立活動：通知主遊戲切換到 activity-mode，隱藏房間探索 HUD。
  try {
    if (window.parent !== window) window.parent.postMessage({type:'memoryMaze:room45Mode', room:4, mode:'activity'}, '*');
  } catch (e) {}
  resourceSelectedDistrict = null;
  currentEmergencyMission = 0;
  completedEmergencyMissions = 0;
  missionSolved = false;
  if (resourceFinalTimer) window.clearTimeout(resourceFinalTimer);
  if (resourceFinalReturn) resourceFinalReturn.hidden = true;
  if (unitDetailDialog) unitDetailDialog.hidden = true;
  resourceView.hidden = false;
  hearingApp.hidden = true;
  showResourceSubstep(resourceHomeStep);
  if (window.StoryKit && resourceStepChip) window.StoryKit.makeBar(resourceStepChip, 3);
  setBar(0);
  enterPhase("med-home", M4().home);
  window.setTimeout(() => openResourceQuery?.focus(), 80);
}

function openResourceHome() {
  if (unitDetailDialog) unitDetailDialog.hidden = true;
  showResourceSubstep(resourceHomeStep);
  hintText = M4().home;
  openResourceQuery?.focus();
}

openResourceQuery?.addEventListener("click", () => {
  showResourceSubstep(resourceQueryStep);
  resourceSelectedDistrict = null;
  if (queryUnitArea) queryUnitArea.hidden = true;
  renderDistrictChoices();
  enterPhase("med-query", M4().query);
  districtChoices?.querySelector("button")?.focus();
});

startEmergencyMissionButton?.addEventListener("click", () => {
  currentEmergencyMission = 0;
  completedEmergencyMissions = 0;
  startEmergencyMission(0);
});

queryBackHome?.addEventListener("click", openResourceHome);
missionBackHome?.addEventListener("click", openResourceHome);

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
    button.innerHTML = `<span class="unit-card-index">${String(index + 1).padStart(2, "0")}</span><span class="unit-type-badge">${unit.type}</span><strong>${unit.name}</strong>`;
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
  missionPuzzleTitle.textContent = `任務 ${index + 1}／${emergencyMissions.length}`;
  missionPersonName.textContent = mission.person;
  missionStory.textContent = mission.story;
  missionProgressText.textContent = `任務完成 ${completedEmergencyMissions}／${emergencyMissions.length}`;
  missionConditions.innerHTML = mission.conditions.map((condition) => `<div class="mission-condition-chip"><span>●</span><strong>${condition}</strong></div>`).join("");
  missionConditionStatus.innerHTML = mission.conditions.map((condition) => `<div data-condition-status="${condition}"><span>○</span>${condition}</div>`).join("");
  puzzleLiveHint.textContent = "";
  setBar(completedEmergencyMissions);
  enterPhase("med-puzzle", M4().puzzle);
  renderRoutePuzzle();
  updatePuzzleConnectivity();
  routePuzzleBoard?.querySelector("button:not(:disabled)")?.focus();
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
  const solvedIndex = currentEmergencyMission;
  window.setTimeout(async () => {
    const mission = emergencyMissions[currentEmergencyMission];
    await window.R4.star(routePuzzleBoard, completedEmergencyMissions);
    await window.R4.say([M4().solved(mission.person)]);
    if (resourceView.hidden || currentEmergencyMission !== solvedIndex) return;
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

nextEmergencyMission?.addEventListener("click", () => {
  if (currentEmergencyMission < emergencyMissions.length - 1) {
    startEmergencyMission(currentEmergencyMission + 1);
    return;
  }
  showResourceSubstep(resourceFinalStep);
  if (resourceFinalReturn) resourceFinalReturn.hidden = true;
  if (resourceFinalTimer) window.clearTimeout(resourceFinalTimer);
  (async () => {
    await window.R4.say(M4().finish.map((x) => x.text), { position: "center" });
    if (resourceView.hidden) return;
    /* 第三修改計劃 B4:同一顆按鈕「完成學習」→ 寶物 →「返回聽力房」 */
    window.StoryDialog.finishButton(resourceFinalReturn, { backLabel:"返回房間", finish: async () => { window.AchievementSystem.completeActivity("hearing", "medicine"); }, back: returnToHearingRoom });
    resourceFinalTimer = window.setTimeout(() => {
      if (resourceFinalReturn) {
        resourceFinalReturn.hidden = false;
        resourceFinalReturn.focus();
      }
    }, 2800);
  })();
});


function returnToHearingRoom(){
  // 回到聽力房底圖後才恢復房間探索 HUD。
  try {
    if (window.parent !== window) window.parent.postMessage({type:'memoryMaze:room45Mode', room:4, mode:'overview'}, '*');
  } catch (e) {}
  if (resourceFinalTimer) window.clearTimeout(resourceFinalTimer);
  if (unitDetailDialog) unitDetailDialog.hidden = true;
  resourceView.hidden = true;
  hearingApp.hidden = false;
  window.Hearing4?.showRoom();
  window.scrollTo({top:0,behavior:"smooth"});
  window.setTimeout(()=>document.querySelector('[data-object="medicine"]')?.focus(),80);
}
resourceView.querySelectorAll(".room-return").forEach((button)=>button.addEventListener("click", returnToHearingRoom));
window.HearingMedical = { open: startResourceMission, close: returnToHearingRoom };
})();
