# Changelog

All notable changes to **Super Sudoku Arcade** will be documented in this file.

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
