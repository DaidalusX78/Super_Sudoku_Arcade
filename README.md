# Super Sudoku Arcade

A retro arcade take on Sudoku: neon CRT visuals, combo scoring, strikes, per-difficulty leaderboards and two twist modes. Plain HTML/CSS/JS, no build step.

## Run
Open `index.html` (studio intro, then **PLAY**) or `super_sudoku_arcade.html` directly in a browser.

## Modes
| Mode | Holes | Time | Twist |
|---|---|---|---|
| Easy | 30 | 10:00 | - |
| Normal | 45 | 07:00 | - |
| Hard | 55 | 03:00 | - |
| Expert | up to 60 | 02:00 | Fog: digits hidden, only the selected row/column lights up |
| Radar | up to 60 | 03:00 | A rotating beam briefly reveals digits |

Puzzles always have a unique solution, so Expert/Radar may have slightly fewer holes than requested.

## Rules & scoring
- Correct entries score 100 x multiplier (x1 to x4); the multiplier rises per correct move and resets on a mistake or after 10 s idle.
- 3 strikes or running out of time ends the run; CONTINUE (9 s countdown) resets strikes and adds time.
- Each run is recorded once on each difficulty's top-5 leaderboard (win, quit, or continue expiry).

## Controls
| Input | Action |
|---|---|
| Click / arrow keys | Select cell |
| 1-9 | Enter digit |
| Shift + 1-9, or N | Glass pencil notes |
| Backspace / Delete | Erase |
| Esc | Quit confirmation / close dialogs |

The **MENU** button opens the arcade drawer (sound, player name, high scores, quit). Opening any menu pauses the game and blurs the board.

## Project structure
- `index.html`, `logo.css`, `logo.js` - studio intro
- `super_sudoku_arcade.html`, `style.css`, `sudoku.js` - the game
- `radar_demo.html` - standalone radar prototype
- `VERSION`, `CHANGELOG.md` - versioning (semantic; the UI version comes from `GAME_VERSION` in `sudoku.js`)

Player name, sound setting and leaderboards are stored in the browser's `localStorage`.

Marc Bailey 2026