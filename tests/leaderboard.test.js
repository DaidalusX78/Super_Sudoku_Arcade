const test = require('node:test');
const assert = require('node:assert/strict');

// Minimal in-memory localStorage mock (must exist before leaderboard.js is used)
let store = {};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; }
};
const lb = require('../leaderboard.js');
const reset = () => { store = {}; };

test('leaderboards start empty for every mode', () => {
  reset();
  const boards = lb.getLeaderboards();
  lb.LEADERBOARD_MODES.forEach(m => assert.deepEqual(boards[m], []));
  assert.equal(lb.getModeHighScore('easy'), 0);
});

test('recordScore ranks, sorts and keeps only the top 5', () => {
  reset();
  [500, 900, 100, 700, 300, 800, 200].forEach(s => lb.recordScore('hard', s, 'TST'));
  const list = lb.getLeaderboards().hard;
  assert.deepEqual(list.map(e => e.score), [900, 800, 700, 500, 300]);
  assert.equal(lb.getModeHighScore('hard'), 900);
});

test('recordScore returns rank and new-record flag', () => {
  reset();
  assert.deepEqual(lb.recordScore('easy', 1000, 'AAA'), { rank: 1, isNewHighScore: true });
  assert.deepEqual(lb.recordScore('easy', 500, 'BBB'), { rank: 2, isNewHighScore: false });
});

test('recordScore ignores zero scores and keeps modes separate', () => {
  reset();
  assert.equal(lb.recordScore('easy', 0, 'AAA').rank, -1);
  lb.recordScore('radar', 400, 'AAA');
  assert.equal(lb.getLeaderboards().easy.length, 0);
  assert.equal(lb.getLeaderboards().radar.length, 1);
});

test('names are stored uppercase with a fallback', () => {
  reset();
  lb.recordScore('easy', 100, 'marc');
  lb.recordScore('easy', 50, '   ');
  const names = lb.getLeaderboards().easy.map(e => e.name);
  assert.deepEqual(names, ['MARC', 'PILOT']);
});

test('corrupt storage falls back to empty boards', () => {
  reset();
  store.superSudokuLeaderboards = '{not json';
  assert.deepEqual(lb.getLeaderboards().easy, []);
});

test('migration purges placeholder scores, keeps real ones, moves old high score, runs once', () => {
  reset();
  store.superSudokuLeaderboards = JSON.stringify({
    easy: [{ name: 'MCB', score: 14500 }, { name: 'MARC', score: 5000 }],
    normal: [{ name: 'MCB', score: 18200 }]
  });
  store.superSudokuHighScore = '4200';
  lb.migrateLegacyData('marc');
  const boards = lb.getLeaderboards();
  assert.deepEqual(boards.easy.map(e => e.score), [5000]);
  assert.deepEqual(boards.normal.map(e => [e.name, e.score]), [['MARC', 4200]]);
  assert.equal(store.superSudokuHighScore, undefined);

  const snapshot = JSON.stringify(boards);
  lb.migrateLegacyData('marc');
  assert.equal(JSON.stringify(lb.getLeaderboards()), snapshot);
});
