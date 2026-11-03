// ==========================================================================
// SUPER SUDOKU ARCADE - MASTER GAME ENGINE
// ==========================================================================

// --- 1. Audio Synth Engine ---
let isMuted = localStorage.getItem('superSudokuMuted') === 'true';

function initMuteButton() {
  const muteBtn = document.getElementById('mute-btn');
  if (!muteBtn) return;
  if (isMuted) {
    muteBtn.innerText = '🔇';
    muteBtn.classList.add('muted');
  } else {
    muteBtn.innerText = '🔊';
    muteBtn.classList.remove('muted');
  }
}

function toggleMute() {
  isMuted = !isMuted;
  localStorage.setItem('superSudokuMuted', isMuted);
  initMuteButton();
}

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(type) {
  if (!audioCtx || isMuted) return;
  
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  
  if (type === 'move') {
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(440, now);
    oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.05);
    gainNode.gain.setValueAtTime(0.05, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    oscillator.start(now);
    oscillator.stop(now + 0.05);
  } else if (type === 'correct') {
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(987.77, now);
    oscillator.frequency.setValueAtTime(1318.51, now + 0.08);
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  } else if (type === 'error') {
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, now);
    oscillator.frequency.exponentialRampToValueAtTime(40, now + 0.2);
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  } else if (type === 'win') {
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(523.25, now);
    oscillator.frequency.setValueAtTime(659.25, now + 0.1);
    oscillator.frequency.setValueAtTime(783.99, now + 0.2);
    oscillator.frequency.setValueAtTime(1046.50, now + 0.3);
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
    oscillator.start(now);
    oscillator.stop(now + 0.6);
  } else if (type === 'gameover') {
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(300, now);
    oscillator.frequency.exponentialRampToValueAtTime(50, now + 1.5);
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 1.5);
    oscillator.start(now);
    oscillator.stop(now + 1.5);
  }
}

// --- 2. DOM Selectors & State Variables ---
const boardContainer = document.getElementById('sudoku-board');
const timerBar = document.querySelector('.timer-bar');
const comboDisplay = document.querySelector('.combo-value');
const scoreDisplay = document.getElementById('score-display');
const hiScoreDisplay = document.getElementById('hi-score-display');
const timeDisplay = document.getElementById('time-display');

let playerScore = 0;
const BASE_POINTS = 100;
let highScore = parseInt(localStorage.getItem('superSudokuHighScore')) || 0;
if (hiScoreDisplay) hiScoreDisplay.innerText = highScore.toString().padStart(6, '0');

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
let isExpertMode = false; 
let currentMode = 'normal';
let currentSolution = [];
let cellCenters = [];

// Glass Pencil Candidate Notes System (High z-index screen marker)
let isNotesMode = false;
let cellNotes = Array.from({ length: 81 }, () => new Set());

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

// Radar Rotation Engine
let radarAngle = 0;
let radarInterval = null;

// --- Helper: Safely extract digit from cell via data attribute ---
function getCellValue(cell) {
  if (!cell) return '';
  return cell.dataset.value || '';
}

// --- 3. Sudoku Generation Engine ---
function isSafe(grid, index, value) {
  const row = Math.floor(index / 9), col = index % 9;
  const blockRow = Math.floor(row / 3), blockCol = Math.floor(col / 3);
  for (let i = 0; i < 81; i++) {
    if (i === index) continue;
    const r = Math.floor(i / 9), c = i % 9;
    const bRow = Math.floor(r / 3), bCol = Math.floor(c / 3);
    if (r === row || c === col || (bRow === blockRow && bCol === blockCol)) {
      if (grid[i] === value) return false;
    }
  }
  return true;
}

function fillGrid(grid) {
  for (let i = 0; i < 81; i++) {
    if (grid[i] === 0) {
      let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
      for (let n of nums) {
        if (isSafe(grid, i, n)) {
          grid[i] = n;
          if (fillGrid(grid)) return true;
          grid[i] = 0; 
        }
      }
      return false; 
    }
  }
  return true; 
}

function generatePuzzle(difficultyHoles) {
  let grid = new Array(81).fill(0);
  fillGrid(grid);
  currentSolution = [...grid]; // Store ground truth solved grid
  
  let puzzle = [...grid];
  let holes = difficultyHoles;
  while (holes > 0) {
    let randomIndex = Math.floor(Math.random() * 81);
    if (puzzle[randomIndex] !== 0) {
      puzzle[randomIndex] = 0;
      holes--;
    }
  }
  return puzzle;
}

// Cache cell centers for high-performance radar calculations (no DOM thrashing)
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

// --- 4. Game Setup & Board Initialization ---
function startGame(holes, timeInSeconds, mode = 'normal') {
  initAudio();
  playSound('move');
  currentDifficulty = holes; 
  currentDifficultyTime = timeInSeconds; 
  currentMode = mode;
  isExpertMode = (mode === 'expert');
  
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

  const puzzleData = generatePuzzle(currentDifficulty); 

  for (let i = 0; i < 81; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    
    const row = Math.floor(i / 9);
    const col = i % 9;
    const boxRow = Math.floor(row / 3);
    const boxCol = Math.floor(col / 3);

    // Highlight 3x3 block structures: subtle alternating tint
    if ((boxRow + boxCol) % 2 === 1) {
      cell.classList.add('box-alt');
    }
    // Prominent 3x3 box boundary dividers
    if (col === 2 || col === 5) {
      cell.classList.add('box-boundary-right');
    }
    if (row === 2 || row === 5) {
      cell.classList.add('box-boundary-bottom');
    }
    
    cell.addEventListener('click', () => selectCell(i));

    // Big digit display element
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

    // Glass Pencil Notes Grid (High z-index screen marker layer)
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
  
  // Append radar sweep overlay layer
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

// --- 5. Radar Engine (Central Sweeping Beam) ---
const RADAR_SWEEP_DURATION_MS = 7000; // 7.0s rotation
const RADAR_SWEEP_ARC_DEG = 60;        // Width of main illumination beam
const RADAR_PRE_LEAD_DEG = 30;         // Leading ping angle ahead of beam
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

// --- 6. Cell Selection & Highlights ---
function selectCell(index) {
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
    // Radar beam runs continuously in the background
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
}

// --- 7. Gameplay Input & Validation ---
function isValidMove(index, value) {
  if (!currentSolution || !currentSolution.length) return true;
  return currentSolution[index] === parseInt(value, 10);
}

function handleInput(value) {
  if (isGameOver || selectedCellIndex === null) return; 

  const cell = gridCells[selectedCellIndex];
  // Lockout check: Never allow modifying given or already correctly solved (locked) cells!
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
        // If no player number, clear any candidate notes
        cellNotes[selectedCellIndex].clear();
        renderCellNotes(selectedCellIndex);
      }
    }
    if (!isGameOver) selectCell(selectedCellIndex);
    return;
  }

  const numVal = parseInt(value, 10);
  if (isNaN(numVal) || numVal < 1 || numVal > 9) return;

  // --- GLASS PENCIL CANDIDATE NOTES MODE ---
  if (isNotesMode) {
    // Only place candidate marks on unconfirmed cells
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

  // --- STANDARD NUMBER ENTRY MODE ---
  const isValid = isValidMove(selectedCellIndex, value);
  if (digitSpan) digitSpan.innerText = value;
  cell.dataset.value = String(value);
  cell.setAttribute('data-has-value', 'true');
  cell.classList.add('player'); 

  if (isValid) {
    cell.classList.remove('error');
    cell.classList.add('locked'); // Lock cell permanently so it cannot be overtyped or scored twice!
    
    // Clear candidate notes in this confirmed cell
    cellNotes[selectedCellIndex].clear();
    renderCellNotes(selectedCellIndex);

    // Auto-clear this candidate number from all peer cells in same row, column, and 3x3 box
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

    handleCorrectMove(cell); 
    checkWinCondition(); 
  } else {
    playSound('error'); 
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
  if (!isGameOver) selectCell(selectedCellIndex);
}

// --- 8. HUD & Counter Updates ---
function updateScore() {
  if (scoreDisplay) scoreDisplay.innerText = playerScore.toString().padStart(6, '0');
  if (playerScore > highScore) {
    highScore = playerScore;
    localStorage.setItem('superSudokuHighScore', highScore); 
    if (hiScoreDisplay) hiScoreDisplay.innerText = highScore.toString().padStart(6, '0');
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

// --- 9. Combo Timer Engine ---
function updateTimer(timestamp) {
  if (!lastFrameTime) lastFrameTime = timestamp;
  const deltaTime = timestamp - lastFrameTime;
  lastFrameTime = timestamp;

  if (comboTimeLeft > 0) {
    comboTimeLeft -= deltaTime;
    const percentage = Math.max(0, (comboTimeLeft / COMBO_MAX_TIME) * 100);
    if (timerBar) timerBar.style.width = percentage + '%';
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
  
  cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(updateTimer);
}

function breakCombo() {
  currentMultiplier = 1;
  comboTimeLeft = 0;
  if (timerBar) timerBar.style.width = '0%';
  updateComboDisplay();
  cancelAnimationFrame(animationFrameId);
}

// --- 10. Win / Game Over & Arcade Countdown ---
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
    continueCountdown--;
    if (timerDisplay) timerDisplay.innerText = continueCountdown;

    if (continueCountdown <= 0) {
      clearInterval(continueTimerInterval);
      document.getElementById('game-over-screen').classList.remove('active');
      document.getElementById('title-screen').classList.add('active');
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
  
  // Grant bonus continue time if timer had expired or was critically low
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
    selectCell(selectedCellIndex);
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
  
  // Pause gameplay timers while confirmation modal is active
  clearInterval(mainTimerInterval);
  stopRadarEngine();
  
  const quitModal = document.getElementById('quit-confirm-screen');
  if (quitModal) quitModal.classList.add('active');
}

function closeQuitModal() {
  initAudio();
  playSound('move');
  
  const quitModal = document.getElementById('quit-confirm-screen');
  if (quitModal) quitModal.classList.remove('active');
  
  // Resume game timer and radar if still in active play
  if (!isGameOver) {
    if (currentDifficultyTime > 0 && timeRemaining > 0) {
      clearInterval(mainTimerInterval);
      mainTimerInterval = setInterval(gameTimerTick, 1000);
    }
    if (currentMode === 'radar') {
      startRadarEngine();
    }
  }
}

function confirmQuitToMenu() {
  const quitModal = document.getElementById('quit-confirm-screen');
  if (quitModal) quitModal.classList.remove('active');
  quitToMenu();
}

function quitToMenu() {
  initAudio();
  playSound('move');
  
  isGameOver = true;
  stopRadarEngine();
  clearInterval(mainTimerInterval);
  clearInterval(continueTimerInterval);
  cancelAnimationFrame(animationFrameId);
  
  // Reset pencil notes mode
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
  
  if (quitModal) quitModal.classList.remove('active');
  if (gameOverScreen) gameOverScreen.classList.remove('active');
  if (winScreen) winScreen.classList.remove('active');
  if (titleScreen) titleScreen.classList.add('active');
  
  selectedCellIndex = null;
  gridCells.forEach(cell => {
    cell.classList.remove('selected', 'highlighted', 'same-number', 'lighthouse-beam', 'lit', 'pre-lit');
  });
  
  breakCombo();
}

function resetGame() {
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
  if (timerBar) timerBar.style.width = '0%';
  
  // Reset pencil notes mode
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

// --- 11. Event Listeners ---
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
      // Quick Note shortcut via Shift + Digit
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

// Boot Initializers
initMuteButton();
