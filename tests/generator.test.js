const test = require('node:test');
const assert = require('node:assert/strict');
const { isSafe, fillGrid, generatePuzzle, countSolutions } = require('../generator.js');

const isValidSolvedGrid = g => {
  const units = [];
  for (let i = 0; i < 9; i++) {
    units.push([...Array(9)].map((_, j) => g[i * 9 + j]));                      // row
    units.push([...Array(9)].map((_, j) => g[j * 9 + i]));                      // column
    const br = Math.floor(i / 3) * 3, bc = (i % 3) * 3;
    units.push([...Array(9)].map((_, j) => g[(br + Math.floor(j / 3)) * 9 + bc + (j % 3)])); // box
  }
  return units.every(u => [...u].sort().join('') === '123456789');
};

test('fillGrid produces a valid complete sudoku', () => {
  for (let k = 0; k < 5; k++) {
    const g = new Array(81).fill(0);
    assert.ok(fillGrid(g));
    assert.ok(isValidSolvedGrid(g));
  }
});

test('isSafe detects row, column and box conflicts', () => {
  const g = new Array(81).fill(0);
  g[0] = 5;
  assert.equal(isSafe(g, 8, 5), false);   // same row
  assert.equal(isSafe(g, 72, 5), false);  // same column
  assert.equal(isSafe(g, 10, 5), false);  // same box
  assert.equal(isSafe(g, 40, 5), true);   // unrelated cell
});

test('countSolutions: empty grid has multiple solutions, solved grid exactly one', () => {
  assert.equal(countSolutions(new Array(81).fill(0), 2), 2);
  const g = new Array(81).fill(0);
  fillGrid(g);
  assert.equal(countSolutions(g, 2), 1);
});

test('countSolutions respects the limit and detects invalid puzzles', () => {
  const bad = new Array(81).fill(0);
  bad[0] = 1; bad[1] = 1; // two 1s in a row => unsolvable
  assert.equal(countSolutions(bad, 2), 0);
});

for (const [name, holes, minimum] of [['easy', 30, 30], ['normal', 45, 45], ['hard', 55, 55], ['expert/radar', 60, 56]]) {
  test(`generatePuzzle(${holes}) [${name}] is unique, consistent and has enough holes`, () => {
    for (let k = 0; k < 5; k++) {
      const { puzzle, solution, holes: made } = generatePuzzle(holes);
      assert.ok(isValidSolvedGrid(solution), 'solution must be valid');
      assert.ok(made >= minimum && made <= holes, `holes ${made} not in [${minimum}, ${holes}]`);
      assert.equal(puzzle.filter(v => v === 0).length, made);
      assert.ok(puzzle.every((v, i) => v === 0 || v === solution[i]), 'givens must match solution');
      assert.equal(countSolutions(puzzle, 2), 1, 'puzzle must have exactly one solution');
    }
  });
}
