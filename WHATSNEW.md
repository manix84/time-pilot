# 🗒️ What's New

## 🧱 Modern React + TypeScript Foundation

- Migrated the browser-game prototype into a Vite app.
- Added React as the host application layer.
- Moved runtime assets into Vite-served public paths.
- Introduced TypeScript across the game source.

## 🧹 Module Cleanup

- Removed `TimePilot.*` filename prefixes.
- Reorganized dotted legacy modules into logical folders, such as:
  - `controller/gamepad.ts`
  - `controller/keyboard1.ts`
  - `menus/main.ts`
  - `menus/pause.ts`
- Added shared `types.ts` contracts for game data, controllers, assets, and engine APIs.

## 🧠 Engine Architecture

- Replaced the old prototype entry point with a typed `TimePilot` class.
- Removed the global game data-store singleton.
- Introduced explicit game context injection for entities, factories, HUD, and input systems.
- Added `useTimePilot` as the React lifecycle bridge.
- Converted the remaining prototype-style runtime modules into class-based entities, factories, controllers, engine wrappers, HUD, and menu systems.
- Split collision handling, entity spawning, and frame rendering into dedicated systems.
- Separated simulation ticking from rendering: game-state calculations run at roughly 30fps, while canvas rendering runs every animation frame.
- Added an in-app controller configuration UI for keyboard layout selection and gamepad polling.
- Added canvas-rendered start and options menus with volume controls, controller style selection, custom keyboard bindings, and keyboard/gamepad/mouse interaction.
- Fixed gamepad cleanup so animation frames are cancelled on disconnect.

## 🎮 Gameplay Tuning

- Rebalanced enemy speeds by era so biplanes, WWII fighters, helicopters, jets, and UFOs escalate more like Time Pilot.
- Tuned enemy bullets, bombs, and missiles around simple readable projectiles instead of dense bullet patterns.
- Added rocket sprites for level 3 and level 4 enemy missiles, with level 4 using faster limited homing and rockets that can be shot down.
- Updated player and enemy sprite handling for the newer sprite sheets, including level 1 biplane animation, level 3 helicopter turning, level 5 UFO animation, and the 32-frame player rotation sheet.

## 🧭 Menu, Zoom, and Debug UX

- Added localized era blurbs to the debug level select screen.
- Added Spanish to the supported menu languages.
- Added animated level select previews for basic enemies, special enemies, bosses, and bonuses.
- Added projectile previews and labels to the debug level select showcase.
- Made focused debug levels pin the background demo preview until leaving level select.
- Added idle fading on the level select menu so the background demo is easier to inspect.
- Added UI zoom and game POV zoom options, both with automatic viewport scaling.
- Expanded UI and game POV zoom limits to 25%-250%, with 100% as the default.
- Kept pixel art crisp when the game POV zoom changes.
- Added a live player scale preview beside the Game Zoom option.
- Added debug heading and steering vector overlays, with an optional turn-arc fill.
- Added keyboard shortcuts for UI zoom with `+`/`=` and `-`.
- Added `M` and the gamepad menu button as root-menu shortcuts.
- Added Escape, Backspace, and gamepad back navigation for submenus.
- Added a paused subtitle to the root menu during gameplay.
- Made Escape on the paused root menu resume gameplay, matching the Continue button.

## ✅ Automation

- Added GitHub Actions for PR tests, lint, and type checks.
- Added GitHub Pages deployment on merges to `main`.
- Added release automation based on the current `package.json` version.
- Added a pre-commit hook for smart semantic version bumping.

## 🧪 Test Coverage

- Added Vitest with jsdom for fast local and CI test runs.
- Added browser API shims for canvas, media, animation frames, and gamepads.
- Covered core engine helpers, arena behavior, ticker timing, sound wrappers, controllers, menus, factories, entities, HUD wiring, the `TimePilot` class, and the React host component.
- Covered menu back navigation, paused root-menu resume behavior, debug level select previews, zoom controls, and keyboard/gamepad menu shortcuts.
- Replaced the previous placeholder test script with a real `npm test` suite.

## 🔜 Next Milestones

- Expand gameplay levels, enemies, bonuses, and sound controls.
