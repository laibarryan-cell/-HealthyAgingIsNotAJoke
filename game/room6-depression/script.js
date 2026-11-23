(() => {
  'use strict';

  const STORAGE_KEY = 'icope.psychological.room.v3.2-reset';
  const roomView = document.querySelector('#roomView');
  const missionView = document.querySelector('#missionView');
  const missionContent = document.querySelector('#missionContent');
  const saveStatus = document.querySelector('#saveStatus');
  const missionTitle = document.querySelector('#missionTitle');
  const missionEyebrow = missionView.querySelector('.mission-bar .eyebrow');
  const roomTimer = document.querySelector('#roomTimer');
  let roomStartAt = Date.now();
  let roomTimerRunning = false;
  let roomFrozenSeconds = 0;
  let roomTimerHandle = null;

  function formatRoomTime(seconds){
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  }
  function getRoomElapsedSeconds(){return roomFrozenSeconds+(roomTimerRunning?Math.max(0,Math.floor((Date.now()-roomStartAt)/1000)):0);}
  function renderRoomTimer(){
    if(roomTimer) roomTimer.textContent = `🕰️ ${formatRoomTime(getRoomElapsedSeconds())}`;
  }
  function startRoomTimer(){
    if(AchievementSystem.getRoomProgress('depression').completed)return;
    if(roomTimerRunning)return;
    roomTimerRunning=true;roomStartAt=Date.now();
    if(roomTimerHandle) clearInterval(roomTimerHandle);
    renderRoomTimer();
    roomTimerHandle = setInterval(renderRoomTimer, 1000);
  }
  function stopRoomTimer(){
    if(!roomTimerRunning) return;
    roomFrozenSeconds = getRoomElapsedSeconds();
    roomTimerRunning = false;
    if(roomTimerHandle){ clearInterval(roomTimerHandle); roomTimerHandle = null; }
    renderRoomTimer();
  }

  document.querySelector('#openRoom6Code').onclick=()=>{document.querySelector('#room6CodeInput').value='';document.querySelector('#room6CodeFeedback').textContent='';document.querySelector('#room6CodeDialog').showModal();};
  document.querySelector('#closeRoom6Code').onclick=()=>document.querySelector('#room6CodeDialog').close();
  document.querySelector('#room6CodeForm').onsubmit=e=>{e.preventDefault();const result=AchievementSystem.submitPassword('depression',document.querySelector('#room6CodeInput').value);const feedback=document.querySelector('#room6CodeFeedback');if(!result.correct){feedback.textContent=result.message;return;}stopRoomTimer();feedback.innerHTML=`🎉 密碼正確！房間 6「心理陪伴」完成。<br>本關時間：<b>${formatRoomTime(getRoomElapsedSeconds())}</b>`;setTimeout(()=>{document.querySelector('#room6CodeDialog').close();window.parent.postMessage({type:'memoryMaze:room6Complete'},'*');},700);};
  let lastHotspot = null;
  let storageProblem = '';

  const createBlankState = () => ({
    version: 31,
    completedItems: [],
    clues: [],
    game: CareEngine.createState(),
    album: FactorsEngine.createState(),
    medicine: { completed: false }
  });

  const roomState = loadState();

  function loadState() {
    const blank = createBlankState();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return blank;
      const saved = JSON.parse(raw);

      try { blank.game = CareEngine.restore(saved.game); }
      catch { storageProblem = '五日陪伴進度無法讀取，已重新開啟新的日誌。'; }

      try { blank.album = FactorsEngine.restore(saved.album); }
      catch {
        storageProblem = storageProblem || '家庭相簿進度無法讀取，已重新開啟相簿；其他進度保留。';
      }

      const allowed = ['tablet', 'album', 'medicine'];
      blank.completedItems = Array.isArray(saved.completedItems)
        ? allowed.filter((id) => saved.completedItems.includes(id))
        : [];

      blank.clues = Array.isArray(saved.clues) && saved.clues.some((c) => c.id === 'companionship')
        ? [{ id: 'companionship', text: '理解・傾聽・支持' }]
        : [];

      if (saved.medicine && typeof saved.medicine === 'object') {
        blank.medicine.completed = !!saved.medicine.completed;
      }
      return blank;
    } catch {
      storageProblem = '無法讀取原有進度，已開啟新的日誌。';
      return blank;
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(roomState));
    } catch {
      storageProblem = '此瀏覽器無法保存進度；目前仍可遊玩，關閉頁面後可能遺失。';
    }
    if (window.DepressionPuzzle && window.AchievementSystem) {
      void window.DepressionPuzzle.syncRewards(roomState).catch(console.warn);
    }
    saveStatus.textContent = storageProblem || '✓ 進度已保存在此瀏覽器';
    saveStatus.classList.toggle('save-warning', !!storageProblem);
  }

  function markComplete(item) {
    AchievementSystem.completeActivity("depression",item);
    const completed = new Set(roomState.completedItems);
    completed.add(item);
    roomState.completedItems = [...completed];

    if (item === 'medicine') roomState.medicine.completed = true;
  }

  function renderRoomProgress() {
    document.querySelector('#roomCount').textContent = roomState.completedItems.length;
    document.querySelector('#clueCount').textContent = '物品請在左下角收集系統查看';

    document.querySelectorAll('.hotspot').forEach((button) => {
      const done = roomState.completedItems.includes(button.dataset.item);
      button.classList.toggle('done', done);
      button.classList.toggle('is-hinting', !done);
    });

    const tabletSmall = document.querySelector('.hotspot-tablet small');
    const albumSmall = document.querySelector('.hotspot-album small');
    const medicineSmall = document.querySelector('.hotspot-medicine small');

    tabletSmall.textContent = roomState.completedItems.includes('tablet')
      ? '✓ 已完成 · 查看日誌'
      : roomState.game.stage !== 'intro' ? '接續你的陪伴 ↗' : '打開照護日誌 ↗';
    albumSmall.textContent = roomState.completedItems.includes('album')
      ? '✓ 已完成 · 回顧學習'
      : roomState.album.seen.length ? '接續生活紀錄 ↗' : '生活裡的片刻';
    medicineSmall.textContent = roomState.completedItems.includes('medicine')
      ? '✓ 已完成 · 重新查看'
      : '身邊的支持';
  }

  function cleanupMission() {
    if (window.FactorsLearning?.dispose) window.FactorsLearning.dispose();
    if (window.CareRPG?.dispose) window.CareRPG.dispose();
    missionContent.replaceChildren();
  }

  function showRoom() {
    cleanupMission();
    missionView.hidden = true;
    missionView.style.display = 'none';
    roomView.hidden = false;
    roomView.style.display = 'flex';
    renderRoomProgress();
    lastHotspot?.focus();
    window.scrollTo(0, 0);
  }

  function showMission(item = 'tablet') {
    cleanupMission();
    roomView.hidden = true;
    roomView.style.display = 'none';
    missionView.hidden = false;
    missionView.style.display = 'block';
    window.scrollTo(0, 0);

    if (item === 'album') {
      missionTitle.textContent = '最近發生了什麼？';
      missionEyebrow.textContent = '家庭相簿／生活紀錄本';
      window.FactorsLearning.mount(missionContent, roomState.album, {
        onSave(state) {
          roomState.album = state;
          if (state.completed) {markComplete('album');window.AchievementSystem.obtainItem('depression_diary');}
          save();
        },
        onReturn: showRoom
      });
    } else if (item === 'medicine') {
      missionTitle.textContent = '醫藥盒｜心理支持與醫療資源';
      missionEyebrow.textContent = '醫藥盒';
      mountMedicineModule(missionContent, {
        completed: roomState.medicine.completed,
        onComplete() {
          markComplete('medicine');
          save();
        },
        onReturn: showRoom
      });
    } else {
      missionTitle.textContent = '五日陪伴';
      missionEyebrow.textContent = '照護日誌';
      // Reconcile older five-day records missing Day 1/3 collectibles.
      const previousDays=roomState.game?.completed ? 5 : window.DepressionPuzzle.logic.reviewedThrough(roomState.game);
      if(previousDays>=1)window.AchievementSystem.obtainItem('depression_red_photo_filter');
      if(previousDays>=3)window.AchievementSystem.obtainItem('depression_blue_note_filter');
      if(previousDays>=5)window.AchievementSystem.obtainItem('depression_diary_key');
      window.CareRPG.mount(missionContent, roomState.game, {
        onSave(state) {
          roomState.game = state;
          const completedDays=state.completed ? 5 : window.DepressionPuzzle.logic.reviewedThrough(state);
          if(completedDays>=1)window.AchievementSystem.obtainItem('depression_red_photo_filter');
          if(completedDays>=3)window.AchievementSystem.obtainItem('depression_blue_note_filter');
          if(completedDays>=5)window.AchievementSystem.obtainItem('depression_diary_key');
          if (state.completed) markComplete('tablet');
          save();
        },
        onReturn: showRoom,
        onReplay() {
          document.querySelector('#replayDialog').showModal();
        },
        hasClue: () => roomState.clues.some((c) => c.id === 'companionship')
      });
    }

    save();
  }

  document.querySelector('#returnRoom').addEventListener('click', showRoom);

  const returnToMap = document.querySelector('#returnToMap');
  if (returnToMap) {
    returnToMap.addEventListener('click', () => {
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'memoryMaze:room6Return' }, '*');
      } else {
        history.back();
      }
    });
  }

  function handleHotspotActivate(button) {
    if (!button) return;
    lastHotspot = button;
    const item = button.dataset.item;
    if (item === 'tablet') return showMission('tablet');
    if (item === 'album') return showMission('album');
    if (item === 'medicine') return showMission('medicine');
  }

  document.querySelectorAll('.hotspot').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      handleHotspotActivate(button);
    });
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleHotspotActivate(button);
      }
    });
  });

  const replayDialog = document.querySelector('#replayDialog');
  document.querySelector('#cancelReplay').onclick = () => replayDialog.close();
  document.querySelector('#confirmReplay').onclick = () => {
    replayDialog.close();
    if (window.CareRPG?.dispose) window.CareRPG.dispose();
    roomState.game = CareEngine.createState();
    save();
    showMission('tablet');
  };

  window.addEventListener('pagehide', () => {
    cleanupMission();
    stopRoomTimer();
    save();
  });

  roomView.style.display = 'flex';
  missionView.style.display = 'none';
  renderRoomProgress();
  save();
  window.addEventListener('message',event=>{
    if(event.data?.type==='memoryMaze:room6Resume')startRoomTimer();
    if(event.data?.type==='memoryMaze:room6Pause')stopRoomTimer();
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopRoomTimer();});
  // The room6 iframe is loaded in the background; timer starts only on explicit parent resume.

  /* 醫藥盒：複製營養房資源模組並改為心理支持情境 */
  function mountMedicineModule(container, handlers) {
    const template = document.querySelector('#resourceTemplate');
    const fragment = template.content.cloneNode(true);
    container.appendChild(fragment);

    const resourceData = {
      '仁德區': [
        { type: '醫院／精神專科', name: '衛生福利部嘉南療養院', address: '台南市仁德區裕忠路539號', phone: '06-2795019' },
        { type: '衛生所', name: '臺南市仁德區衛生所', address: '台南市仁德區中山路606巷2號', phone: '06-2704153' }
      ],
      '東區': [
        { type: '診所', name: '昕晴診所', address: '台南市東區崇明24街1號', phone: '06-2686668' },
        { type: '醫院', name: '台南市立醫院(委託秀傳醫療社團法人經營)', address: '臺南市東區崇德路670號', phone: '06-2609926' },
        { type: '衛生所', name: '臺南市東區衛生所', address: '台南市東區林森路一段418號', phone: '06-2674085' },
        { type: '醫院', name: '台灣基督長老教會新樓醫療財團法人台南新樓醫院', address: '台南市東區東門路一段57號', phone: '06-2748316' }
      ],
      '北區': [
        { type: '醫院', name: '國立成功大學醫學院附設醫院', address: '台南市北區勝利路138號', phone: '06-2353535' },
        { type: '衛生所', name: '臺南市北區衛生所', address: '台南市北區西華街50號', phone: '06-2252404' }
      ],
      '安南區': [
        { type: '醫院', name: '臺南市立安南醫院', address: '臺南市安南區長和路二段66號', phone: '06-3553111' },
        { type: '衛生所', name: '臺南市安南區衛生所', address: '台南市安南區仁安路70號', phone: '06-2567406' }
      ],
      '永康區': [
        { type: '醫院', name: '奇美醫療財團法人奇美醫院', address: '台南市永康區中華路901號', phone: '06-2812811' },
        { type: '衛生所', name: '臺南市永康區衛生所', address: '台南市永康區文化路51號', phone: '06-2326507' }
      ],
      '中西區': [
        { type: '醫院', name: '衛生福利部臺南醫院', address: '臺南市中西區中山路125號', phone: '06-2200055' },
        { type: '衛生所', name: '臺南市中西區衛生所', address: '台南市中西區環河街94號', phone: '06-2252403' }
      ]
    };

    const missions = [
      {
        person: '李奶奶',
        story: '李奶奶最近常說自己提不起勁，也變得不太想和人說話。她住在仁德區，家人想先找到可作為心理支持起點的精神專科醫院，並確認聯絡電話。',
        conditions: ['仁德區', '醫院／精神專科', '電話'],
        path: [[4,0],[3,0],[3,1],[2,1],[2,2],[1,2],[1,3],[0,3],[0,4]],
        conditionIndexes: [2,5,7],
        unit: { type: '醫院／精神專科', name: '衛生福利部嘉南療養院', district: '仁德區', address: '台南市仁德區裕忠路539號', phone: '06-2795019' }
      },
      {
        person: '陳阿公',
        story: '陳阿公在伴侶生病後，常常說自己睡不好、也不太想出門。他住在東區，家人想先找可以詢問的示範診所，並把聯絡電話記下來。',
        conditions: ['東區', '診所', '電話'],
        path: [[0,0],[1,0],[2,0],[3,0],[4,0],[4,1],[4,2],[4,3],[4,4],[3,4],[2,4],[1,4],[0,4]],
        conditionIndexes: [3,6,9],
        unit: { type: '診所', name: '昕晴診所', district: '東區', address: '台南市東區崇明24街1號', phone: '06-2686668' }
      },
      {
        person: '黃伯伯',
        story: '黃伯伯退休後心情明顯低落，家人希望先找到北區的大型醫院，作為進一步評估與轉介的起點，並先確認電話。',
        conditions: ['北區', '醫院', '電話'],
        path: [[0,0],[0,1],[0,2],[0,3],[1,3],[2,3],[2,2],[2,1],[3,1],[4,1],[4,2],[4,3],[4,4]],
        conditionIndexes: [2,6,9],
        unit: { type: '醫院', name: '國立成功大學醫學院附設醫院', district: '北區', address: '台南市北區勝利路138號', phone: '06-2353535' }
      }
    ];

    const DIR_DELTA = { N: [-1,0], E: [0,1], S: [1,0], W: [0,-1] };
    const OPPOSITE = { N: 'S', E: 'W', S: 'N', W: 'E' };
    const ROTATE = ['N', 'E', 'S', 'W'];

    let puzzleIndex = 0;
    let puzzleTiles = [];
    let puzzleSolved = false;
    let completedPuzzleCount = 0;
    const timers = [];

    const $ = (selector) => container.querySelector(selector);

    function clearTimers() {
      while (timers.length) clearTimeout(timers.pop());
    }

    function showSection(id) {
      ['resourceHome', 'queryStep', 'puzzleStep', 'puzzleResult', 'resourceFinal'].forEach((sectionId) => {
        const node = $(`#${sectionId}`);
        if (node) node.hidden = sectionId !== id;
      });
    }

    function bindHome() {
      $('#openQuery').addEventListener('click', showQuery);
      $('#openPuzzle').addEventListener('click', () => startPuzzle(0));
      container.querySelectorAll('.resource-home-button').forEach((button) => button.addEventListener('click', showHome));
      $('#closeUnitDialog').addEventListener('click', () => { $('#unitDialog').hidden = true; });
      $('#unitDialog').addEventListener('click', (event) => {
        if (event.target.id === 'unitDialog') event.currentTarget.hidden = true;
      });
      $('#resourceReturn').addEventListener('click', handlers.onReturn);
    }

    function showHome() {
      showSection('resourceHome');
    }

    function showQuery() {
      showSection('queryStep');
      const districts = $('#districts');
      districts.hidden = false;
      districts.innerHTML = '';
      $('#unitArea').hidden = true;

      Object.entries(resourceData).forEach(([district, units]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'district-card';
        button.innerHTML = `<span>◆</span><strong>${district}</strong><small>${units.length} 個示範單位</small>`;
        button.addEventListener('click', () => renderUnits(district));
        districts.appendChild(button);
      });

      $('#changeDistrict').onclick = () => {
        $('#unitArea').hidden = true;
        districts.hidden = false;
      };
    }

    function renderUnits(district) {
      $('#districts').hidden = true;
      $('#unitArea').hidden = false;
      $('#districtName').textContent = district;
      const cards = $('#unitCards');
      cards.innerHTML = '';

      resourceData[district].forEach((unit) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'unit-card';
        button.innerHTML = `<span class="unit-badge">${unit.type}</span><strong>${unit.name}</strong><small>點擊查看地址與電話</small>`;
        button.addEventListener('click', () => showUnitDialog(district, unit));
        cards.appendChild(button);
      });
    }

    function showUnitDialog(district, unit) {
      $('#unitDetail').innerHTML = `<span class="unit-badge">${unit.type}</span><h3>${unit.name}</h3><dl><div><dt>區域</dt><dd>${district}</dd></div><div><dt>地址</dt><dd>${unit.address}</dd></div><div><dt>電話</dt><dd>${unit.phone}</dd></div></dl><p>此單位列於 115 年臺南市 ICOPE 評估單位清單。本模組僅用於長者情緒低落或心情困擾時的資源查找練習；實際服務內容、科別與時間仍應先向院所確認。</p>`;
      $('#unitDialog').hidden = false;
    }

    function directionBetween(a, b) {
      const dr = b[0] - a[0];
      const dc = b[1] - a[1];
      return dr === -1 ? 'N' : dc === 1 ? 'E' : dr === 1 ? 'S' : 'W';
    }

    function shapeForSides(sides) {
      if (sides.length === 1) return { shape: 'cap', rot: ROTATE.indexOf(sides[0]) };
      const set = new Set(sides);
      if (set.has('N') && set.has('S')) return { shape: 'straight', rot: 0 };
      if (set.has('E') && set.has('W')) return { shape: 'straight', rot: 1 };
      const corners = [['N', 'E'], ['E', 'S'], ['S', 'W'], ['W', 'N']];
      return { shape: 'corner', rot: corners.findIndex((pair) => pair.every((side) => set.has(side))) };
    }

    function buildMissionTiles(mission) {
      const tiles = [];
      for (let row = 0; row < 5; row += 1) {
        for (let col = 0; col < 5; col += 1) {
          tiles.push({ row, col, shape: (row + col) % 3 === 0 ? 'corner' : 'straight', rot: (row * 2 + col + 1) % 4, role: 'normal', label: '' });
        }
      }
      mission.path.forEach((coord, index) => {
        const sides = [];
        if (index > 0) sides.push(directionBetween(coord, mission.path[index - 1]));
        if (index < mission.path.length - 1) sides.push(directionBetween(coord, mission.path[index + 1]));
        const spec = shapeForSides(sides);
        const tile = tiles.find((candidate) => candidate.row === coord[0] && candidate.col === coord[1]);
        Object.assign(tile, spec);
        if (index === 0) tile.role = 'start';
        else if (index === mission.path.length - 1) tile.role = 'end';
        const conditionPosition = mission.conditionIndexes.indexOf(index);
        if (conditionPosition >= 0) {
          tile.role = 'condition';
          tile.label = mission.conditions[conditionPosition];
        }
        if (tile.role !== 'start' && tile.role !== 'end') tile.rot = (tile.rot + (index % 2 ? 1 : 2)) % 4;
      });
      return tiles;
    }

    function sidesFor(tile) {
      const bases = tile.shape === 'straight' ? ['N', 'S'] : tile.shape === 'corner' ? ['N', 'E'] : ['N'];
      return bases.map((side) => ROTATE[(ROTATE.indexOf(side) + tile.rot) % 4]);
    }

    function paintTile(element, tile) {
      const pipe = element.querySelector('.route-pipe');
      pipe.className = 'route-pipe';
      sidesFor(tile).forEach((side) => pipe.classList.add(`side-${side.toLowerCase()}`));
    }

    function renderBoard() {
      const board = $('#routeBoard');
      board.innerHTML = '';
      puzzleTiles.forEach((tile, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `route-tile ${tile.role}`;
        if (tile.role === 'start' || tile.role === 'end') {
          button.disabled = true;
          button.classList.add('fixed');
        }
        button.innerHTML = '<span class="route-pipe"><i class="pipe-center"></i><i class="pipe-arm arm-n"></i><i class="pipe-arm arm-e"></i><i class="pipe-arm arm-s"></i><i class="pipe-arm arm-w"></i></span>' + (tile.label ? `<span class="tile-label">${tile.label}</span>` : tile.role !== 'normal' ? `<span class="tile-label">${tile.role === 'start' ? '需求' : '目標'}</span>` : '');
        paintTile(button, tile);
        button.addEventListener('click', () => {
          if (puzzleSolved) return;
          tile.rot = (tile.rot + 1) % 4;
          paintTile(button, tile);
          updateConnectivity();
        });
        board.appendChild(button);
      });
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
          if (!visited.has(key)) {
            visited.add(key);
            queue.push(next);
          }
        });
      }

      container.querySelectorAll('.route-tile').forEach((element, index) => {
        const tile = puzzleTiles[index];
        element.classList.toggle('connected', visited.has(`${tile.row}-${tile.col}`));
      });

      const reached = new Set(puzzleTiles.filter((tile) => tile.role === 'condition' && visited.has(`${tile.row}-${tile.col}`)).map((tile) => tile.label));
      mission.conditions.forEach((condition) => {
        const row = $(`[data-status="${condition}"]`);
        const yes = reached.has(condition);
        row.classList.toggle('reached', yes);
        row.querySelector('span').textContent = yes ? '✓' : '○';
      });

      const end = mission.path[mission.path.length - 1];
      const endReached = visited.has(`${end[0]}-${end[1]}`);
      $('#puzzleHint').textContent = `已接通 ${reached.size}／3 個指定條件${endReached ? '，「目標」已接通' : ''}。`;
      if (endReached && mission.conditions.every((condition) => reached.has(condition))) finishPuzzle();
    }

    function startPuzzle(index) {
      clearTimers();
      puzzleIndex = index;
      puzzleSolved = false;
      const mission = missions[index];
      puzzleTiles = buildMissionTiles(mission);
      showSection('puzzleStep');
      $('#puzzleTitle').textContent = `任務 ${index + 1}／3`;
      $('#personName').textContent = mission.person;
      $('#missionStory').textContent = mission.story;
      $('#puzzleProgress').textContent = `完成 ${completedPuzzleCount}／3`;
      $('#missionConditions').innerHTML = mission.conditions.map((condition) => `<div class="condition-chip"><span>◆</span><strong>${condition}</strong></div>`).join('');
      $('#conditionStatus').innerHTML = mission.conditions.map((condition) => `<div class="condition-status" data-status="${condition}"><span>○</span>${condition}</div>`).join('');
      renderBoard();
      updateConnectivity();
    }

    function finishPuzzle() {
      if (puzzleSolved) return;
      puzzleSolved = true;
      completedPuzzleCount = Math.max(completedPuzzleCount, puzzleIndex + 1);
      const mission = missions[puzzleIndex];
      container.querySelectorAll('.route-tile').forEach((button) => { button.disabled = true; });
      $('#puzzleHint').textContent = '路徑完整接通！';
      const timer = setTimeout(() => {
        showSection('puzzleResult');
        const unit = mission.unit;
        $('#resultCard').innerHTML = `<span class="unit-badge">${unit.type}</span><h4>${unit.name}</h4><dl><div><dt>區域</dt><dd>${unit.district}</dd></div><div><dt>地址</dt><dd>${unit.address}</dd></div><div><dt>電話</dt><dd>${unit.phone}</dd></div></dl>`;
        const next = $('#nextPuzzle');
        next.textContent = puzzleIndex < 2 ? '下一個心理支持任務' : '完成心理支持資源任務';
        next.onclick = () => puzzleIndex < 2 ? startPuzzle(puzzleIndex + 1) : showFinal(true);
      }, 650);
      timers.push(timer);
    }

    function showFinal(markDone = true) {
      if (markDone) handlers.onComplete();
      showSection('resourceFinal');
      const timer = setTimeout(() => { $('#resourceReturn').hidden = false; }, 1200);
      timers.push(timer);
    }

    bindHome();
    if (handlers.completed) {
      showFinal(false);
    } else {
      showHome();
    }
  }
})();
