// ==========================================================================
// SUPER SUDOKU ARCADE - GAME ENGINE & UI (needs audio.js, leaderboard.js, generator.js)
// Version: 1.1.0 | Created by Marc Bailey 2026
// ==========================================================================

const GAME_VERSION = 'v1.4.0';

// Render the single-source version string everywhere it is displayed
document.querySelectorAll('.app-version').forEach(el => {
  el.textContent = el.dataset.prefix ? `${el.dataset.prefix}${GAME_VERSION}` : GAME_VERSION;
});

// --- 2. Player Name Management ---
let playerName = localStorage.getItem('superSudokuPlayerName') || 'PLAYER 1';

function updatePlayerNameDisplay() {
  const hudPlayer = document.getElementById('player-name-display');
  const titlePlayer = document.getElementById('title-player-name');
  const menuPlayer = document.getElementById('menu-player-display');
  
  const displayName = playerName.toUpperCase().trim() || 'PLAYER 1';
  if (hudPlayer) hudPlayer.innerText = `${displayName} ✎`;
  if (titlePlayer) titlePlayer.innerText = displayName;
  if (menuPlayer) menuPlayer.innerText = displayName;
}

function openNameModal() {
  initAudio();
  playSound('move');
  pauseTimers();

  const nameModal = document.getElementById('name-modal');
  const nameInput = document.getElementById('player-name-input');
  if (nameInput) {
    nameInput.value = playerName === 'PLAYER 1' ? '' : playerName;
    setTimeout(() => nameInput.focus(), 100);
  }
  if (nameModal) nameModal.classList.add('active');
}

function closeNameModal() {
  initAudio();
  playSound('move');
  const nameModal = document.getElementById('name-modal');
  if (nameModal) nameModal.classList.remove('active');
  
  // Only resume if menu isn't open
  const menu = document.getElementById('arcade-menu');
  if (!menu || !menu.classList.contains('active')) {
    resumeTimers();
  }
}

function savePlayerName() {
  const nameInput = document.getElementById('player-name-input');
  let chosen = nameInput ? nameInput.value.trim().toUpperCase() : '';
  if (!chosen) chosen = 'PLAYER 1';
  playerName = chosen.substring(0, 12);
  localStorage.setItem('superSudokuPlayerName', playerName);
  updatePlayerNameDisplay();
  closeNameModal();
}

let activeLeaderboardTab = 'easy';

function openLeaderboardModal(diff) {
  initAudio();
  playSound('move');
  pauseTimers();

  activeLeaderboardTab = diff || currentMode || 'easy';
  switchLeaderboardTab(activeLeaderboardTab);

  const modal = document.getElementById('leaderboard-modal');
  if (modal) modal.classList.add('active');
}

function switchLeaderboardTab(diff) {
  activeLeaderboardTab = diff;
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    if (tab.dataset.diff === diff) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  const boards = getLeaderboards();
  const entries = boards[diff] || [];
  const listContainer = document.getElementById('leaderboard-list');
  if (!listContainer) return;

  listContainer.innerHTML = '';
  for (let idx = 0; idx < LEADERBOARD_SIZE; idx++) {
    const entry = entries[idx];
    const rankNum = idx + 1;
    const row = document.createElement('div');
    row.className = `leaderboard-row rank-${rankNum}` + (entry ? '' : ' empty');
    
    let rankLabel = `#${rankNum}`;
    if (rankNum === 1) rankLabel = '1ST';
    if (rankNum === 2) rankLabel = '2ND';
    if (rankNum === 3) rankLabel = '3RD';

    row.innerHTML = entry
      ? `
      <span class="rank-badge">${rankLabel}</span>
      <span class="leader-name">${escapeHtml(entry.name)}</span>
      <span class="leader-score">${entry.score.toString().padStart(6, '0')}</span>
    `
      : `
      <span class="rank-badge">${rankLabel}</span>
      <span class="leader-name">---</span>
      <span class="leader-score">------</span>
    `;
    listContainer.appendChild(row);
  }
}

function closeLeaderboardModal() {
  initAudio();
  playSound('move');
  const modal = document.getElementById('leaderboard-modal');
  if (modal) modal.classList.remove('active');

  const menu = document.getElementById('arcade-menu');
  if (!menu || !menu.classList.contains('active')) {
    resumeTimers();
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// --- 4. Arcade Pop-Out Menu System ---
function toggleArcadeMenu() {
  initAudio();
  playSound('move');
  const menu = document.getElementById('arcade-menu');
  const backdrop = document.getElementById('menu-backdrop');
  if (!menu) return;

  if (menu.classList.contains('active')) {
    closeArcadeMenu();
  } else {
    openArcadeMenu();
  }
}

function openArcadeMenu() {
  pauseTimers();
  updatePlayerNameDisplay();
  initMuteButton();

  const menu = document.getElementById('arcade-menu');
  const backdrop = document.getElementById('menu-backdrop');
  if (menu) menu.classList.add('active');
  if (backdrop) backdrop.classList.add('active');
}

function closeArcadeMenu() {
  initAudio();
  playSound('move');
  const menu = document.getElementById('arcade-menu');
  const backdrop = document.getElementById('menu-backdrop');
  if (menu) menu.classList.remove('active');
  if (backdrop) backdrop.classList.remove('active');

  resumeTimers();
}

function handleMenuQuit() {
  closeArcadeMenu();
  requestQuit();
}

// --- 5. DOM Selectors & State Variables ---
const boardContainer = document.getElementById('sudoku-board');
const comboDisplay = document.querySelector('.combo-value');
const scoreDisplay = document.getElementById('score-display');
const hiScoreDisplay = document.getElementById('hi-score-display');
const timeDisplay = document.getElementById('time-display');

let playerScore = 0;
const BASE_POINTS = 100;
const TIME_BONUS_PER_SECOND = 10;

let strikes = 0;
const MAX_STRIKES = 3;

// Combo Timer (10 seconds)
const COMBO_MAX_TIME = 10000;
let comboTimeLeft = 0;
let currentMultiplier = 1;
const MAX_MULTIPLIER = 4;
let lastFrameTime = 0;
let animationFrameId;

// Countdown Timer
let currentDifficultyTime = 0; 
let timeRemaining = 0;
let mainTimerInterval = null;

// Arcade Continue Countdown
let continueTimerInterval = null;
let continueCountdown = 9;

// Modes & Grid State
let selectedCellIndex = null;
let gridCells = []; 
let isGameOver = true; 
let currentDifficulty = 40; 
const VALID_MODES = ['easy', 'normal', 'hard', 'expert', 'radar'];
const savedMode = localStorage.getItem('superSudokuLastMode');
let currentMode = VALID_MODES.includes(savedMode) ? savedMode : 'normal';
let currentSolution = [];
let cellCenters = [];

// Glass Pencil Candidate Notes System
let isNotesMode = false;
let cellNotes = Array.from({ length: 81 }, () => new Set());

function updateHiScoreHUD() {
  if (!hiScoreDisplay) return;
  const currentModeScore = getModeHighScore(currentMode);
  hiScoreDisplay.innerText = currentModeScore.toString().padStart(6, '0');
}

function toggleNotesMode() {
  isNotesMode = !isNotesMode;
  initAudio();
  playSound('move');
  
  const notesBtn = document.getElementById('notes-btn');
  const notesIndicator = document.getElementById('notes-indicator');
  if (notesBtn && notesIndicator) {
    if (isNotesMode) {
      notesBtn.classList.add('notes-active');
      notesIndicator.innerText = 'ON';
    } else {
      notesBtn.classList.remove('notes-active');
      notesIndicator.innerText = 'OFF';
    }
  }
}

function renderCellNotes(index) {
  const cell = gridCells[index];
  if (!cell) return;
  const notesContainer = cell.querySelector('.cell-notes');
  if (!notesContainer) return;

  const notes = cellNotes[index];
  const slots = notesContainer.querySelectorAll('.note-slot');
  slots.forEach(slot => {
    const num = parseInt(slot.dataset.note, 10);
    if (notes && notes.has(num)) {
      slot.classList.add('active');
    } else {
      slot.classList.remove('active');
    }
  });
}

function getCellValue(cell) {
  if (!cell) return '';
  return cell.dataset.value || '';
}

function cacheCellCenters() {
  if (!gridCells.length) return;
  cellCenters = gridCells.map(cell => {
    const rect = cell.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  });
}
window.addEventListener('resize', cacheCellCenters);

// --- 7. Game Setup & Board Initialization ---
function startGame(holes, timeInSeconds, mode = 'normal') {
  initAudio();
  playSound('move');
  currentDifficulty = holes; 
  currentDifficultyTime = timeInSeconds; 
  currentMode = mode;
  localStorage.setItem('superSudokuLastMode', mode);
  
  updateHiScoreHUD();

  const titleScreen = document.getElementById('title-screen');
  if (titleScreen) titleScreen.classList.remove('active');
  resetGame();
}

function initializeBoard() {
  if (!boardContainer) return;
  stopRadarEngine();
  boardContainer.innerHTML = ''; 
  gridCells = [];
  cellNotes = Array.from({ length: 81 }, () => new Set());
  
  if (currentMode === 'expert') {
    boardContainer.classList.add('expert-fog');
  } else {
    boardContainer.classList.remove('expert-fog');
  }

  if (currentMode === 'radar') {
    boardContainer.classList.add('radar-mode');
  } else {
    boardContainer.classList.remove('radar-mode');
  }

  const generated = generatePuzzle(currentDifficulty);
  const puzzleData = generated.puzzle;
  currentSolution = generated.solution;

  for (let i = 0; i < 81; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    
    const row = Math.floor(i / 9);
    const col = i % 9;
    const boxRow = Math.floor(row / 3);
    const boxCol = Math.floor(col / 3);

    if ((boxRow + boxCol) % 2 === 1) {
      cell.classList.add('box-alt');
    }
    if (col === 2 || col === 5) {
      cell.classList.add('box-boundary-right');
    }
    if (row === 2 || row === 5) {
      cell.classList.add('box-boundary-bottom');
    }
    
    cell.addEventListener('click', () => selectCell(i));

    const digitSpan = document.createElement('span');
    digitSpan.className = 'cell-digit';

    if (puzzleData[i] !== 0) {
      digitSpan.innerText = puzzleData[i];
      cell.dataset.value = String(puzzleData[i]);
      cell.setAttribute('data-has-value', 'true');
      cell.classList.add('given');
    } else {
      cell.dataset.value = '';
      cell.setAttribute('data-has-value', 'false');
    }
    cell.appendChild(digitSpan);

    const notesContainer = document.createElement('div');
    notesContainer.className = 'cell-notes';
    for (let n = 1; n <= 9; n++) {
      const slot = document.createElement('span');
      slot.className = 'note-slot';
      slot.dataset.note = n;
      slot.innerText = n;
      notesContainer.appendChild(slot);
    }
    cell.appendChild(notesContainer);
    
    boardContainer.appendChild(cell);
    gridCells.push(cell);
  }
  
  const radarOverlay = document.createElement('div');
  radarOverlay.className = 'radar-overlay';
  radarOverlay.id = 'radar-overlay';
  radarOverlay.innerHTML = `
    <div class="radar-ping-line" id="radar-ping-line"></div>
    <div class="radar-beam" id="radar-beam"></div>
  `;
  boardContainer.appendChild(radarOverlay);

  cacheCellCenters();
  updateDigitCounters();

  if (currentMode === 'radar') {
    startRadarEngine();
  }
}

// --- 8. Radar Engine ---
const RADAR_SWEEP_DURATION_MS = 7000;
const RADAR_SWEEP_ARC_DEG = 60;
const RADAR_PRE_LEAD_DEG = 30;
let radarStartTime = null;
let radarAnimFrame = null;

function startRadarEngine() {
  stopRadarEngine();
  if (currentMode !== 'radar') return;

  radarStartTime = null;
  cacheCellCenters();

  function updateRadarSweep(timestamp) {
    if (isGameOver || currentMode !== 'radar') return;
    if (!radarStartTime) radarStartTime = timestamp;
    const elapsed = timestamp - radarStartTime;

    const currentAngle = ((elapsed % RADAR_SWEEP_DURATION_MS) / RADAR_SWEEP_DURATION_MS) * 360;
    const leadingAngle = (currentAngle + RADAR_PRE_LEAD_DEG) % 360;

    const radarBeam = document.getElementById('radar-beam');
    const radarPingLine = document.getElementById('radar-ping-line');
    if (radarBeam) radarBeam.style.transform = `rotate(${currentAngle}deg)`;
    if (radarPingLine) radarPingLine.style.transform = `rotate(${leadingAngle}deg)`;

    if (!boardContainer) return;
    const boardRect = boardContainer.getBoundingClientRect();
    const centerX = boardRect.left + boardRect.width / 2;
    const centerY = boardRect.top + boardRect.height / 2;

    for (let i = 0; i < gridCells.length; i++) {
      const cell = gridCells[i];
      if (i === selectedCellIndex) {
        cell.classList.remove('lit', 'pre-lit');
        continue;
      }

      const center = cellCenters[i];
      if (!center) continue;

      let dx = center.x - centerX;
      let dy = center.y - centerY;
      let cellAngle = (Math.atan2(dy, dx) * (180 / Math.PI)) + 90;
      if (cellAngle < 0) cellAngle += 360;

      let mainDiff = (currentAngle - cellAngle + 360) % 360;
      let leadDiff = (leadingAngle - cellAngle + 360) % 360;

      cell.classList.remove('lit', 'pre-lit');

      if (mainDiff <= RADAR_SWEEP_ARC_DEG) {
        cell.classList.add('lit');
      } else if (leadDiff <= 15) {
        cell.classList.add('pre-lit');
      }
    }

    radarAnimFrame = requestAnimationFrame(updateRadarSweep);
  }

  radarAnimFrame = requestAnimationFrame(updateRadarSweep);
}

function stopRadarEngine() {
  if (radarAnimFrame) {
    cancelAnimationFrame(radarAnimFrame);
    radarAnimFrame = null;
  }
}

// --- 9. Cell Selection & Highlights ---
function selectCell(index, silent = false) {
  if (isGameOver) return;
  initAudio(); 
  playSound('move'); 
  
  selectedCellIndex = index;
  const selectedNumber = getCellValue(gridCells[index]);
  const targetRow = Math.floor(index / 9);
  const targetCol = index % 9;

  gridCells.forEach(cell => {
    cell.classList.remove('selected', 'highlighted', 'same-number', 'lighthouse-beam');
  });

  if (currentMode === 'radar') {
    // Radar beam runs continuously
  } else if (currentMode === 'expert') {
    gridCells.forEach((cell, i) => {
      const r = Math.floor(i / 9);
      const c = i % 9;
      if (r === targetRow || c === targetCol) {
        cell.classList.add('lighthouse-beam');
      }
    });
  } else {
    const blockRow = Math.floor(targetRow / 3);
    const blockCol = Math.floor(targetCol / 3);

    gridCells.forEach((cell, i) => {
      const r = Math.floor(i / 9);
      const c = i % 9;
      const bRow = Math.floor(r / 3);
      const bCol = Math.floor(c / 3);

      if (r === targetRow || c === targetCol || (bRow === blockRow && bCol === blockCol)) {
        cell.classList.add('highlighted');
      }
    });

    if (selectedNumber !== "") {
      gridCells.forEach(cell => {
        if (getCellValue(cell) === selectedNumber) {
          cell.classList.add('same-number');
        }
      });
    }
  }

  gridCells[index].classList.add('selected');

  // Radar/Expert hide digits visually; keep announcements to position + given/empty state only there
  const hideValue = currentMode === 'radar' || currentMode === 'expert';
  const val = getCellValue(gridCells[index]);
  if (!silent) announce(`Row ${targetRow + 1}, column ${targetCol + 1}, ` + (val && !hideValue ? `value ${val}` : (val ? 'filled' : 'empty')));
}

// --- 10. Gameplay Input & Validation ---
function isValidMove(index, value) {
  if (!currentSolution || !currentSolution.length) return true;
  return currentSolution[index] === parseInt(value, 10);
}

function handleInput(value) {
  if (isGameOver || selectedCellIndex === null) return; 

  const cell = gridCells[selectedCellIndex];
  if (cell.classList.contains('given') || cell.classList.contains('locked')) return;

  const digitSpan = cell.querySelector('.cell-digit');

  if (value === 'clear') {
    if (isNotesMode) {
      cellNotes[selectedCellIndex].clear();
      renderCellNotes(selectedCellIndex);
    } else {
      if (cell.classList.contains('player')) {
        cell.dataset.value = '';
        cell.setAttribute('data-has-value', 'false');
        if (digitSpan) digitSpan.innerText = '';
        cell.classList.remove('player', 'error');
        updateDigitCounters();
      } else {
        cellNotes[selectedCellIndex].clear();
        renderCellNotes(selectedCellIndex);
      }
    }
    if (!isGameOver) selectCell(selectedCellIndex, true);
    return;
  }

  const numVal = parseInt(value, 10);
  if (isNaN(numVal) || numVal < 1 || numVal > 9) return;

  if (isNotesMode) {
    if (cell.classList.contains('given') || cell.classList.contains('locked') || getCellValue(cell) !== '') return;

    if (cellNotes[selectedCellIndex].has(numVal)) {
      cellNotes[selectedCellIndex].delete(numVal);
    } else {
      cellNotes[selectedCellIndex].add(numVal);
    }
    renderCellNotes(selectedCellIndex);
    initAudio();
    playSound('move');
    return;
  }

  const isValid = isValidMove(selectedCellIndex, value);
  if (digitSpan) digitSpan.innerText = value;
  cell.dataset.value = String(value);
  cell.setAttribute('data-has-value', 'true');
  cell.classList.add('player'); 

  if (isValid) {
    cell.classList.remove('error');
    cell.classList.add('locked');
    
    cellNotes[selectedCellIndex].clear();
    renderCellNotes(selectedCellIndex);

    const targetRow = Math.floor(selectedCellIndex / 9);
    const targetCol = selectedCellIndex % 9;
    const targetBoxRow = Math.floor(targetRow / 3);
    const targetBoxCol = Math.floor(targetCol / 3);

    for (let i = 0; i < 81; i++) {
      if (i === selectedCellIndex) continue;
      const r = Math.floor(i / 9);
      const c = i % 9;
      const br = Math.floor(r / 3);
      const bc = Math.floor(c / 3);
      if (r === targetRow || c === targetCol || (br === targetBoxRow && bc === targetBoxCol)) {
        if (cellNotes[i].has(numVal)) {
          cellNotes[i].delete(numVal);
          renderCellNotes(i);
        }
      }
    }

    announce('Correct. Score ' + (playerScore + BASE_POINTS * currentMultiplier));
    handleCorrectMove(cell); 
    checkWinCondition(); 
  } else {
    playSound('error'); 
    announce('Wrong number. Strike ' + (strikes + 1) + ' of ' + MAX_STRIKES);
    cell.classList.add('error');
    breakCombo(); 
    
    strikes++;
    updateStrikes();
    
    if (strikes >= MAX_STRIKES) {
      triggerGameOver();
    }
    setTimeout(() => {
      if (cell.classList.contains('error')) {
        cell.dataset.value = '';
        cell.setAttribute('data-has-value', 'false');
        if (digitSpan) digitSpan.innerText = '';
        cell.classList.remove('player', 'error');
        updateDigitCounters();
      }
    }, 400); 
  }

  updateDigitCounters();
  if (!isGameOver) selectCell(selectedCellIndex, true);
}

// --- 11. HUD & Counter Updates ---
function updateScore() {
  if (scoreDisplay) scoreDisplay.innerText = playerScore.toString().padStart(6, '0');
  const currentModeScore = getModeHighScore(currentMode);
  if (playerScore > currentModeScore) {
    if (hiScoreDisplay) hiScoreDisplay.innerText = playerScore.toString().padStart(6, '0');
  }
}

function updateStrikes() {
  const boxes = document.querySelectorAll('.strike-box');
  boxes.forEach((box, index) => {
    if (index < strikes) {
      box.classList.add('active');
      box.innerText = 'X';
    } else {
      box.classList.remove('active');
      box.innerText = '';
    }
  });
}

function updateDigitCounters() {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };

  gridCells.forEach(cell => {
    const val = parseInt(getCellValue(cell));
    if (val >= 1 && val <= 9 && !cell.classList.contains('error')) {
      counts[val]++;
    }
  });

  for (let num = 1; num <= 9; num++) {
    const remaining = 9 - counts[num];
    const badge = document.getElementById(`badge-${num}`);
    const btn = document.querySelector(`.num-btn[data-num="${num}"]`);

    if (badge && btn) {
      badge.innerText = Math.max(0, remaining);
      if (remaining <= 0) {
        btn.classList.add('completed');
      } else {
        btn.classList.remove('completed');
      }
    }
  }
}

function updateComboDisplay() {
  if (!comboDisplay) return;
  comboDisplay.classList.remove('mult-2', 'mult-3', 'mult-4', 'pop');
  void comboDisplay.offsetWidth;

  if (currentMultiplier === 1) {
    comboDisplay.innerText = 'x1';
  } else if (currentMultiplier === 2) {
    comboDisplay.innerText = 'x2';
    comboDisplay.classList.add('mult-2', 'pop');
  } else if (currentMultiplier === 3) {
    comboDisplay.innerText = 'x3';
    comboDisplay.classList.add('mult-3', 'pop');
  } else if (currentMultiplier === MAX_MULTIPLIER) {
    comboDisplay.innerText = 'MAX x4';
    comboDisplay.classList.add('mult-4', 'pop');
  }
}

function updateTimeDisplay() {
  if (!timeDisplay) return;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  timeDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  if (timeRemaining <= 10 && timeRemaining > 0) {
    timeDisplay.classList.add('danger-pulse');
    playSound('move'); 
  } else {
    timeDisplay.classList.remove('danger-pulse');
  }
}

function gameTimerTick() {
  if (isGameOver) return;
  timeRemaining--;
  updateTimeDisplay();
  
  if (timeRemaining <= 0) {
    clearInterval(mainTimerInterval);
    triggerGameOver(); 
  }
}

// --- 12. Combo Logic ---
function renderComboDecay() {
  if (!comboDisplay) return;
  const pct = comboTimeLeft > 0 ? Math.max(0, Math.min(100, (comboTimeLeft / COMBO_MAX_TIME) * 100)) : 0;
  comboDisplay.style.setProperty('--combo-pct', pct.toFixed(1));
  if (comboTimeLeft > 0 && comboTimeLeft <= 2500) {
    comboDisplay.classList.add('combo-expiring');
  } else {
    comboDisplay.classList.remove('combo-expiring');
  }
}

function updateTimer(timestamp) {
  if (!lastFrameTime) lastFrameTime = timestamp;
  const deltaTime = timestamp - lastFrameTime;
  lastFrameTime = timestamp;

  if (comboTimeLeft > 0) {
    comboTimeLeft -= deltaTime;
    renderComboDecay();
    animationFrameId = requestAnimationFrame(updateTimer);
  } else {
    breakCombo();
  }
}

function handleCorrectMove(cell) {
  playSound('correct'); 
  
  const pointsEarned = parseInt(BASE_POINTS) * parseInt(currentMultiplier);
  playerScore += pointsEarned;
  updateScore();

  const popup = document.createElement('span');
  popup.classList.add('floating-score');
  popup.innerText = `+${pointsEarned}`;
  cell.appendChild(popup);
  
  setTimeout(() => {
    if (popup && popup.parentNode) popup.remove();
  }, 1000);

  comboTimeLeft = COMBO_MAX_TIME;
  lastFrameTime = performance.now(); 
  if (currentMultiplier < MAX_MULTIPLIER) currentMultiplier++;
  
  updateComboDisplay();
  renderComboDecay();
  
  cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(updateTimer);
}

function breakCombo() {
  currentMultiplier = 1;
  comboTimeLeft = 0;
  updateComboDisplay();
  renderComboDecay();
  cancelAnimationFrame(animationFrameId);
}

// --- Run Finalisation (records the score exactly once per run) ---
let runRecorded = true; // true until a run starts

function finalizeRun() {
  if (runRecorded) return { rank: -1, isNewHighScore: false };
  runRecorded = true;
  const result = recordScore(currentMode, playerScore, playerName);
  updateHiScoreHUD();
  return result;
}

// --- 13. Timer Pause & Resume Utilities ---
function pauseTimers() {
  // Hide the board while paused so the puzzle can't be studied for free
  if (!isGameOver) document.body.classList.add('paused');
  clearInterval(mainTimerInterval);
  stopRadarEngine();
  cancelAnimationFrame(animationFrameId);
}

// True while any pause-inducing UI (menu, name entry, leaderboard, quit confirm) is open
function isPauseUiOpen() {
  return ['arcade-menu', 'name-modal', 'leaderboard-modal', 'quit-confirm-screen']
    .some(id => {
      const el = document.getElementById(id);
      return el && el.classList.contains('active');
    });
}

function resumeTimers() {
  if (isPauseUiOpen()) return;
  document.body.classList.remove('paused');
  if (!isGameOver) {
    if (currentDifficultyTime > 0 && timeRemaining > 0) {
      clearInterval(mainTimerInterval);
      mainTimerInterval = setInterval(gameTimerTick, 1000);
    }
    if (comboTimeLeft > 0) {
      lastFrameTime = performance.now();
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(updateTimer);
    }
    if (currentMode === 'radar') {
      startRadarEngine();
    }
  }
}

// --- 14. Win / Game Over & Arcade Countdown ---
function checkWinCondition() {
  for (let i = 0; i < 81; i++) {
    const cell = gridCells[i];
    const val = parseInt(getCellValue(cell), 10);
    if (isNaN(val) || val !== currentSolution[i]) return false;
    if (cell.classList.contains('error')) return false;
  }
  triggerWin();
  return true;
}

function startContinueCountdown() {
  clearInterval(continueTimerInterval);
  continueCountdown = 9;
  const timerDisplay = document.getElementById('continue-timer');
  if (timerDisplay) timerDisplay.innerText = continueCountdown;

  continueTimerInterval = setInterval(() => {
    // Hold the countdown while the user is browsing scores or editing their name
    if (isPauseUiOpen()) return;

    continueCountdown--;
    if (timerDisplay) timerDisplay.innerText = continueCountdown;

    if (continueCountdown <= 0) {
      clearInterval(continueTimerInterval);
      finalizeRun();
      document.getElementById('game-over-screen').classList.remove('active');
      document.getElementById('title-screen').classList.add('active');
      updateHiScoreHUD();
    }
  }, 1000);
}

function continueGame() {
  clearInterval(continueTimerInterval);
  const gameOverScreen = document.getElementById('game-over-screen');
  if (gameOverScreen) gameOverScreen.classList.remove('active');
  
  isGameOver = false;
  strikes = 0;
  updateStrikes();
  
  if (currentDifficultyTime > 0) {
    if (timeRemaining <= 10) {
      timeRemaining = Math.max(60, Math.floor(currentDifficultyTime / 3));
    }
    updateTimeDisplay();
    clearInterval(mainTimerInterval);
    mainTimerInterval = setInterval(gameTimerTick, 1000);
  }
  
  breakCombo();
  if (currentMode === 'radar') {
    startRadarEngine();
  }
  if (selectedCellIndex !== null) {
    selectCell(selectedCellIndex, true);
  }
}

function triggerWin() {
  playSound('win'); 
  isGameOver = true;
  stopRadarEngine();
  clearInterval(mainTimerInterval);
  cancelAnimationFrame(animationFrameId);
  gridCells.forEach(cell => cell.classList.remove('selected', 'highlighted', 'same-number', 'lighthouse-beam', 'lit', 'pre-lit'));
  selectedCellIndex = null;

  // Award time bonus on stage clear (+10 pts per second remaining)
  const timeBonus = Math.max(0, timeRemaining) * TIME_BONUS_PER_SECOND;
  if (timeBonus > 0) {
    playerScore += timeBonus;
    updateScore();
  }

  // Record score into leaderboard (once per run)
  const result = finalizeRun();
  const winSummary = document.getElementById('win-score-summary');
  if (winSummary) {
    const bonusText = timeBonus > 0 ? ` (TIME BONUS +${timeBonus})` : '';
    winSummary.innerHTML = `SCORE: ${playerScore.toString().padStart(6, '0')}${bonusText}` + 
      (result.rank > 0 ? ` &bull; RANK #${result.rank} ${result.isNewHighScore ? '🔥 NEW RECORD!' : ''}` : '');
  }

  updateHiScoreHUD();
  announce('Stage clear. Score ' + playerScore);
  document.getElementById('win-screen').classList.add('active');
}

function triggerGameOver() {
  playSound('gameover');
  isGameOver = true;
  stopRadarEngine();
  clearInterval(mainTimerInterval);
  cancelAnimationFrame(animationFrameId);
  gridCells.forEach(cell => cell.classList.remove('selected', 'highlighted', 'same-number', 'lighthouse-beam', 'lit', 'pre-lit'));
  selectedCellIndex = null;

  // Score is recorded only when the run truly ends (continue declined/expired or quit),
  // so using CONTINUE never creates duplicate leaderboard entries.
  const gameoverSummary = document.getElementById('gameover-score-summary');
  if (gameoverSummary) {
    gameoverSummary.innerHTML = `FINAL SCORE: ${playerScore.toString().padStart(6, '0')}`;
  }

  announce('Game over. Final score ' + playerScore);
  document.getElementById('game-over-screen').classList.add('active');
  startContinueCountdown();
}

function requestQuit() {
  if (isGameOver) {
    quitToMenu();
    return;
  }
  initAudio();
  playSound('move');
  pauseTimers();
  
  const quitModal = document.getElementById('quit-confirm-screen');
  if (quitModal) quitModal.classList.add('active');
}

function closeQuitModal() {
  initAudio();
  playSound('move');
  
  const quitModal = document.getElementById('quit-confirm-screen');
  if (quitModal) quitModal.classList.remove('active');
  
  resumeTimers();
}

function confirmQuitToMenu() {
  const quitModal = document.getElementById('quit-confirm-screen');
  if (quitModal) quitModal.classList.remove('active');
  quitToMenu();
}

function quitToMenu() {
  initAudio();
  playSound('move');
  
  finalizeRun();
  isGameOver = true;
  document.body.classList.remove('paused');
  stopRadarEngine();
  clearInterval(mainTimerInterval);
  clearInterval(continueTimerInterval);
  cancelAnimationFrame(animationFrameId);
  
  isNotesMode = false;
  const notesBtn = document.getElementById('notes-btn');
  const notesIndicator = document.getElementById('notes-indicator');
  if (notesBtn && notesIndicator) {
    notesBtn.classList.remove('notes-active');
    notesIndicator.innerText = 'OFF';
  }

  const quitModal = document.getElementById('quit-confirm-screen');
  const gameOverScreen = document.getElementById('game-over-screen');
  const winScreen = document.getElementById('win-screen');
  const titleScreen = document.getElementById('title-screen');
  const nameModal = document.getElementById('name-modal');
  const lbModal = document.getElementById('leaderboard-modal');
  const arcadeMenu = document.getElementById('arcade-menu');
  const menuBackdrop = document.getElementById('menu-backdrop');
  
  if (quitModal) quitModal.classList.remove('active');
  if (gameOverScreen) gameOverScreen.classList.remove('active');
  if (winScreen) winScreen.classList.remove('active');
  if (nameModal) nameModal.classList.remove('active');
  if (lbModal) lbModal.classList.remove('active');
  if (arcadeMenu) arcadeMenu.classList.remove('active');
  if (menuBackdrop) menuBackdrop.classList.remove('active');
  
  if (titleScreen) titleScreen.classList.add('active');
  
  updateHiScoreHUD();
  updatePlayerNameDisplay();

  selectedCellIndex = null;
  gridCells.forEach(cell => {
    cell.classList.remove('selected', 'highlighted', 'same-number', 'lighthouse-beam', 'lit', 'pre-lit');
  });
  
  breakCombo();
}

function resetGame() {
  finalizeRun();
  runRecorded = false;
  clearInterval(continueTimerInterval);
  const quitModal = document.getElementById('quit-confirm-screen');
  if (quitModal) quitModal.classList.remove('active');
  document.getElementById('win-screen').classList.remove('active');
  document.getElementById('game-over-screen').classList.remove('active'); 
  
  isGameOver = false;
  stopRadarEngine();
  selectedCellIndex = null;
  currentMultiplier = 1;
  comboTimeLeft = 0;
  
  isNotesMode = false;
  const notesBtn = document.getElementById('notes-btn');
  const notesIndicator = document.getElementById('notes-indicator');
  if (notesBtn && notesIndicator) {
    notesBtn.classList.remove('notes-active');
    notesIndicator.innerText = 'OFF';
  }

  playerScore = 0;
  updateScore();
  
  strikes = 0;     
  updateStrikes(); 
  
  updateComboDisplay();
  updateHiScoreHUD();
  
  clearInterval(mainTimerInterval);
  if (currentDifficultyTime > 0) {
    timeRemaining = currentDifficultyTime;
    updateTimeDisplay();
    mainTimerInterval = setInterval(gameTimerTick, 1000);
  } else {
    if (timeDisplay) timeDisplay.innerText = '00:00';
  }

  initializeBoard(); 
}

// --- 15. Event Listeners ---
document.querySelectorAll('.num-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const targetBtn = e.target.closest('.num-btn');
    if (!targetBtn) return;
    
    if (targetBtn.classList.contains('action-btn')) {
      handleInput('clear');
    } else {
      const num = targetBtn.getAttribute('data-num');
      if (num) handleInput(num);
    }
  });
});

document.addEventListener('keydown', (e) => {
  initAudio(); 

  // Name modal Enter key
  const nameModal = document.getElementById('name-modal');
  if (nameModal && nameModal.classList.contains('active')) {
    if (e.key === 'Enter') {
      savePlayerName();
      return;
    }
    if (e.key === 'Escape') {
      closeNameModal();
      return;
    }
    return;
  }

  // Leaderboard modal Escape key
  const lbModal = document.getElementById('leaderboard-modal');
  if (lbModal && lbModal.classList.contains('active')) {
    if (e.key === 'Escape') {
      closeLeaderboardModal();
      return;
    }
  }

  // Arcade menu Escape key
  const arcadeMenu = document.getElementById('arcade-menu');
  if (arcadeMenu && arcadeMenu.classList.contains('active')) {
    if (e.key === 'Escape') {
      closeArcadeMenu();
      return;
    }
  }

  // Escape hotkey to trigger or close Quit Confirmation
  if (e.key === 'Escape') {
    const quitModal = document.getElementById('quit-confirm-screen');
    if (quitModal && quitModal.classList.contains('active')) {
      closeQuitModal();
    } else if (!isGameOver) {
      requestQuit();
    }
    return;
  }

  // Toggle Glass Pencil Notes with 'N'
  if (e.key === 'n' || e.key === 'N') {
    e.preventDefault();
    toggleNotesMode();
    return;
  }
  
  if (selectedCellIndex === null) return; 

  let newRow = Math.floor(selectedCellIndex / 9);
  let newCol = selectedCellIndex % 9;

  if (e.key === 'ArrowUp') newRow = Math.max(0, newRow - 1);
  if (e.key === 'ArrowDown') newRow = Math.min(8, newRow + 1);
  if (e.key === 'ArrowLeft') newCol = Math.max(0, newCol - 1);
  if (e.key === 'ArrowRight') newCol = Math.min(8, newCol + 1);

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault(); 
    selectCell(newRow * 9 + newCol);
  }

  if (e.key >= '1' && e.key <= '9') {
    if (e.shiftKey) {
      const wasNotesMode = isNotesMode;
      isNotesMode = true;
      handleInput(e.key);
      isNotesMode = wasNotesMode;
    } else {
      handleInput(e.key);
    }
  }
  if (e.key === 'Backspace' || e.key === 'Delete') handleInput('clear');
});

// --- 16. Accessibility helpers ---
function announce(message) {
  const region = document.getElementById('sr-status');
  if (!region) return;
  region.textContent = '';
  // Re-set on next tick so repeated identical messages are still announced
  setTimeout(() => { region.textContent = message; }, 30);
}

const OVERLAY_IDS = ['name-modal', 'leaderboard-modal', 'quit-confirm-screen', 'game-over-screen', 'win-screen', 'arcade-menu', 'title-screen'];
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [role="button"][tabindex="0"]';

function getTopOverlay() {
  // Stacking order: modals above menu above game-end screens above title
  const order = ['name-modal', 'leaderboard-modal', 'quit-confirm-screen', 'arcade-menu', 'game-over-screen', 'win-screen', 'title-screen'];
  for (const id of order) {
    const el = document.getElementById(id);
    if (el && el.classList.contains('active')) return el;
  }
  return null;
}

function focusFirstIn(el) {
  const target = el.querySelector('input, .btn-continue, button, [role="button"]');
  if (target) target.focus({ preventScroll: true });
}

// Move focus into an overlay when it opens and keep Tab inside the top overlay
function initFocusManagement() {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      const el = m.target;
      const wasActive = (m.oldValue || '').split(/\s+/).includes('active');
      const isActive = el.classList.contains('active');
      if (el.id === 'arcade-menu') el.setAttribute('aria-hidden', String(!isActive));
      if (isActive && !wasActive) setTimeout(() => focusFirstIn(el), 50);
    });
  });
  OVERLAY_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const overlay = getTopOverlay();
    if (!overlay) return;
    const items = [...overlay.querySelectorAll(FOCUSABLE)].filter(n => n.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (!overlay.contains(document.activeElement)) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // Keyboard activation for non-<button> controls marked role="button"
  document.addEventListener('keydown', e => {
    const t = e.target;
    if (t && t.getAttribute && t.getAttribute('role') === 'button' && t.tagName !== 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      t.click();
    }
  });
}
// Boot Initializers
migrateLegacyData(playerName);
initFocusManagement();
setTimeout(() => { const t = document.getElementById('title-screen'); if (t && t.classList.contains('active')) focusFirstIn(t); }, 100);
initMuteButton();
updatePlayerNameDisplay();
updateHiScoreHUD();
