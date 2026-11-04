// ==========================================================================
// SUPER SUDOKU ARCADE - LEADERBOARD STORAGE (localStorage, no DOM access)
// Loaded as a classic script in the browser and as a CommonJS module in tests.
// ==========================================================================

// --- 3. High Scores Leaderboard Engine ---
const LEADERBOARD_MODES = ['easy', 'normal', 'hard', 'expert', 'radar'];
const LEADERBOARD_SIZE = 5;

// Placeholder entries shipped in v1.1.0/v1.1.1. They are purged on first load
// of v1.2.0 so leaderboards only ever contain real scores.
const LEGACY_SEEDED_SCORES = {
  easy: [['MCB', 14500], ['ARC', 11200], ['NEO', 9800], ['JED', 8500], ['ACE', 7200]],
  normal: [['MCB', 18200], ['VEX', 14000], ['RET', 12500], ['CYB', 10400], ['ZED', 9100]],
  hard: [['MCB', 22800], ['KOR', 17500], ['BLZ', 15300], ['MAX', 13000], ['SYN', 11200]],
  expert: [['MCB', 28500], ['GHO', 21000], ['DRK', 18400], ['VOID', 16000], ['NULL', 13500]],
  radar: [['MCB', 25000], ['SWP', 19800], ['BEAM', 16500], ['ECHO', 14200], ['PULSE', 12000]]
};

function emptyLeaderboards() {
  const boards = {};
  LEADERBOARD_MODES.forEach(mode => { boards[mode] = []; });
  return boards;
}

function getLeaderboards() {
  try {
    const data = localStorage.getItem('superSudokuLeaderboards');
    if (data) {
      const parsed = JSON.parse(data);
      LEADERBOARD_MODES.forEach(mode => {
        if (!parsed[mode] || !Array.isArray(parsed[mode])) parsed[mode] = [];
      });
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse leaderboard data:', e);
  }
  return emptyLeaderboards();
}

// One-time migration: purge placeholder scores and carry over the old
// single (mode-less) high score. It is placed on NORMAL since the old
// version never recorded which mode it came from.
function migrateLegacyData(playerName) {
  if (localStorage.getItem('superSudokuMigratedV120')) return;

  const boards = getLeaderboards();
  LEADERBOARD_MODES.forEach(mode => {
    const seeded = LEGACY_SEEDED_SCORES[mode];
    boards[mode] = boards[mode].filter(entry =>
      !seeded.some(([name, score]) => entry.name === name && entry.score === score));
  });

  const legacyHigh = parseInt(localStorage.getItem('superSudokuHighScore'), 10);
  if (legacyHigh > 0) {
    boards.normal.push({ name: (playerName || 'PLAYER 1').toUpperCase(), score: legacyHigh, date: '2026' });
    boards.normal.sort((a, b) => b.score - a.score);
    boards.normal = boards.normal.slice(0, LEADERBOARD_SIZE);
  }

  saveLeaderboards(boards);
  localStorage.removeItem('superSudokuHighScore');
  localStorage.setItem('superSudokuMigratedV120', 'true');
}
function saveLeaderboards(boards) {
  try {
    localStorage.setItem('superSudokuLeaderboards', JSON.stringify(boards));
  } catch (e) {
    console.error('Failed to save leaderboard data:', e);
  }
}

function getModeHighScore(mode) {
  const boards = getLeaderboards();
  const list = boards[mode] || [];
  return list.length > 0 ? list[0].score : 0;
}

function recordScore(mode, score, playerName) {
  if (score <= 0) return { rank: -1, isNewHighScore: false };
  const boards = getLeaderboards();
  const list = boards[mode] || [];
  
  const currentPilot = (playerName && playerName.trim()) ? playerName.trim().toUpperCase() : 'PILOT';
  const entry = {
    name: currentPilot,
    score: score,
    date: '2026'
  };

  list.push(entry);
  list.sort((a, b) => b.score - a.score);
  const trimmed = list.slice(0, LEADERBOARD_SIZE);
  boards[mode] = trimmed;
  saveLeaderboards(boards);

  const rank = trimmed.findIndex(e => e === entry) + 1;
  const isNewHighScore = rank === 1;
  return { rank, isNewHighScore };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LEADERBOARD_MODES, LEADERBOARD_SIZE, getLeaderboards, saveLeaderboards, getModeHighScore, recordScore, migrateLegacyData };
}
