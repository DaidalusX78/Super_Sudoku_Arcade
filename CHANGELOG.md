# Changelog

All notable changes to **Super Sudoku Arcade** will be documented in this file.

## [1.5.0] - 2026-11-04
### Added
- **Title Screen Menu Access**: Added direct access to the Arcade Menu from the Title Screen via a dedicated `☰ ARCADE MENU` button.

### Changed
- **3x3 Numpad Layout**: Converted the numeric keypad into an authentic 3x3 layout (digits 1–9) with enlarged digit labels (26px) that expand to comfortably fill available space.
- **Glass Pencil & Erase Action Bar**: Moved the `⌫ ERASE` action alongside `GLASS PENCIL` in the action bar directly above the 3x3 numpad.
- **Badge Layering**: Increased the digit remaining `.badge` `z-index` to 50 (above the CRT layer and board effects) for crystal-clear visibility.
- **Reduced CRT Overlay**: Decreased the CRT scanline and vignette overlay intensity by 20% (`opacity: 0.68`) to improve overall screen clarity and contrast.
- **Top-Docked Minimal HUD**: Pinned `top-hud-row` and `stats-hud-row` directly to the top of the screen with minimal 2px padding.
- **Doubled HI-SCORE Size**: Doubled the font-size of `.hi-score-label` from 11px to 22px for instant high-visibility arcade scoring.

## [1.4.0] - 2026-11-04
### Added
- Visual combo decay indicator: shrinking neon underline under the multiplier value with a pulse warning during the final 2.5 seconds.
- Time bonus on Stage Clear: awards `+10 pts × seconds remaining` and displays the bonus breakdown on the win screen.

### Changed
- Grouped HUD, 9x9 board, pencil bar, and numpad in a centered stack (`justify-content: center; gap: 6px`) to eliminate the vertical gap above the numpad on tall screens.
- Updated erase button to `⌫ ERASE` with larger, higher-contrast text for mobile ergonomics.
## [1.3.0] - 2026-11-04
### Added
- Unit tests (`npm test`, Node's built-in runner, no dependencies) for the puzzle generator/solver and leaderboard storage/migration.
- Accessibility: ARIA roles and labels, dialog semantics, screen-reader announcements (cell position, correct/wrong, win/game over), focus moved into and trapped inside open overlays, keyboard activation for clickable labels, visible focus ring, `prefers-reduced-motion` support.
- Fonts are bundled locally (`fonts/`, SIL OFL); the game now makes no network requests.
- Leaderboard opens on the last-played difficulty (remembered between sessions).

### Changed
- `sudoku.js` split into `generator.js`, `leaderboard.js`, `audio.js` and `sudoku.js` (classic scripts, still no build step).
- Puzzle generation retries with fresh grids to reach the requested hole count more often (Expert/Radar now reliably 58+ of 60).
- Off-screen menu drawer is no longer reachable by keyboard.

### Fixed
- Solver now rejects puzzles with conflicting givens instead of searching them.
- Leaderboard rank labels (1ST/2ND/3RD) no longer collide with player names.
## [1.2.0] - 2026-11-04
### Changed
- Leaderboards start empty (placeholder scores removed); empty slots show as `---`.
- Board is blurred while the game is paused (menu or dialogs open) so the puzzle can't be studied for free.

### Added
- One-time migration: placeholder scores from v1.1.x are purged and the old single high score is moved to the NORMAL leaderboard.
- README.md with gameplay, controls and project structure.
## [1.1.1] - 2026-11-04
### Fixed
- Leaderboard no longer records duplicate entries when using CONTINUE; a score is recorded once per run (win, quit, or continue expiry).
- Name entry and leaderboard modals now appear above the arcade menu instead of behind its backdrop.
- Puzzle generator now guarantees a unique solution, so a correct move is never penalised as a strike.
- Game timers stay paused while any menu/modal is open, and the Game Over continue countdown holds while browsing scores.

### Changed
- Version string is defined once in sudoku.js and rendered into the UI.
- Overlays use dynamic viewport height on mobile.
- Added .gitattributes to normalise line endings.

### Removed
- Dead code: unused radar/expert variables, legacy mute-button branch, unused .title-logo style.
## [1.1.0] - 2026-11-04
### Added
- **Custom Player Name**: Players can customize their pilot callsign/name (defaulting to PLAYER 1) via the HUD, start screen, or arcade menu.
- **Difficulty-Based Leaderboards**: High score tracking for each difficulty level (Easy, Normal, Hard, Expert, Radar) with ranking and top 5 records.
- **Arcade Pop-Out Menu**: Retro sliding drawer with sound toggling, change callsign, leaderboard access, quit to menu, resume, and Marc Bailey 2026 credits.
- **Version Control Tagging**: Added `VERSION` file, `v1.1.0` in UI headers, footers, and menus.

### Changed
- **Renamed**: Main file `sudoku.html` renamed to `super_sudoku_arcade.html`.
- **Enlarged Digital Clock**: Increased 7-segment LED clock size to 34px for instant readability.
- **Enlarged Numpad Badges**: Digit count remaining badges are now significantly larger (13px), bold, with a distinct glowing arcade container.
- **Reduced Vertical Padding**: Minimized top and bottom body/container padding to expand screen space for mobile and arcade screens.

### Removed
- **Unused Timer Container**: Removed the unused combo progress timer bar from the HUD and stylesheet.
- **HUD Row Borders**: Removed borders from `.top-hud-row` and `.stats-hud-row` for a clean, unified dashboard appearance.

## [1.0.0] - 2026-11-03
- Initial release of Super Sudoku Arcade with Easy, Normal, Hard, Expert Fog, and Radar sweep modes.
