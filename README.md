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

Puzzles always have a unique solution; Expert/Radar request 60 holes but typically get 58-60 because very sparse unique puzzles are rare.

## Rules & scoring
- Correct entries score 100 x multiplier (x1 to x4); the multiplier rises per correct move (with a shrinking underline timer) and resets on a mistake or after 10 s idle.
- Clearing a stage awards a time bonus of +10 points per second remaining.
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

The **MENU** button opens the arcade drawer (sound, player name, high scores, quit). To prevent cheating, the in-game countdown timer continues counting down while the drawer is open.

## Project structure
- `index.html`, `logo.css`, `logo.js` - studio intro
- `super_sudoku_arcade.html`, `style.css` - the game page
- `generator.js` - puzzle generation and unique-solution solver (pure logic)
- `leaderboard.js` - leaderboard storage and migration (pure logic)
- `audio.js` - synthesised sound effects and sound setting
- `sudoku.js` - game engine and UI
- `fonts/` - bundled VT323, Press Start 2P, and DSEG7 Classic (SIL Open Font License)
- `tests/` - unit tests
- `radar_demo.html` - standalone radar prototype
- `VERSION`, `CHANGELOG.md` - versioning (semantic; the UI version comes from `GAME_VERSION` in `sudoku.js`)

## Tests
`npm test` runs the unit tests (Node 18+, no dependencies).

Player name, sound setting and leaderboards are stored in the browser's `localStorage`.

Marc Bailey 2026