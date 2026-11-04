// ==========================================================================
// SUPER SUDOKU ARCADE - PUZZLE GENERATOR (pure logic, no DOM access)
// Loaded as a classic script in the browser and as a CommonJS module in tests.
// ==========================================================================

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

// Builds a puzzle with a UNIQUE solution. Cells are removed in random order and
// a removal is kept only if the puzzle stays uniquely solvable. Some grids cannot
// reach very high hole counts, so up to `maxAttempts` fresh grids are tried and
// the best result is kept (stopping early once the target is reached).
// Returns { puzzle, solution, holes }.
function generatePuzzle(targetHoles, maxAttempts = 40) {
  let best = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const solution = new Array(81).fill(0);
    fillGrid(solution);

    const puzzle = [...solution];
    const order = Array.from({ length: 81 }, (_, i) => i).sort(() => Math.random() - 0.5);
    let holes = 0;
    for (const idx of order) {
      if (holes >= targetHoles) break;
      const backup = puzzle[idx];
      puzzle[idx] = 0;
      if (countSolutions(puzzle, 2) === 1) {
        holes++;
      } else {
        puzzle[idx] = backup;
      }
    }

    if (!best || holes > best.holes) best = { puzzle, solution, holes };
    if (holes >= targetHoles) break;
  }
  return best;
}

// Bitmask backtracking solver with minimum-remaining-values heuristic.
// Counts solutions up to `limit` (stops early).
function countSolutions(puzzle, limit) {
  const grid = [...puzzle];
  const rows = new Array(9).fill(0);
  const cols = new Array(9).fill(0);
  const boxes = new Array(9).fill(0);

  for (let i = 0; i < 81; i++) {
    const v = grid[i];
    if (v) {
      const bit = 1 << v;
      const r = Math.floor(i / 9), c = i % 9;
      const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
      // Conflicting givens => no valid solution
      if ((rows[r] | cols[c] | boxes[b]) & bit) return 0;
      rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
    }
  }

  let count = 0;

  function solve() {
    let best = -1, bestMask = 0, bestCount = 10;
    for (let i = 0; i < 81; i++) {
      if (grid[i] !== 0) continue;
      const r = Math.floor(i / 9), c = i % 9;
      const used = rows[r] | cols[c] | boxes[Math.floor(r / 3) * 3 + Math.floor(c / 3)];
      const avail = ~used & 0x3FE;
      let n = 0;
      for (let m = avail; m; m &= m - 1) n++;
      if (n < bestCount) {
        best = i; bestMask = avail; bestCount = n;
        if (n === 0) return;
        if (n === 1) break;
      }
    }
    if (best === -1) { count++; return; }

    const r = Math.floor(best / 9), c = best % 9, b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
    for (let v = 1; v <= 9 && count < limit; v++) {
      const bit = 1 << v;
      if (!(bestMask & bit)) continue;
      grid[best] = v;
      rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
      solve();
      grid[best] = 0;
      rows[r] &= ~bit; cols[c] &= ~bit; boxes[b] &= ~bit;
    }
  }

  solve();
  return count;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { isSafe, fillGrid, generatePuzzle, countSolutions };
}
