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
- Fixed gamepad cleanup so animation frames are cancelled on disconnect.

## ✅ Automation

- Added GitHub Actions for PR tests, lint, and type checks.
- Added GitHub Pages deployment on merges to `main`.
- Added release automation based on the current `package.json` version.
- Added a pre-commit hook for smart semantic version bumping.

## 🧪 Test Coverage

- Added Vitest with jsdom for fast local and CI test runs.
- Added browser API shims for canvas, media, animation frames, and gamepads.
- Covered core engine helpers, arena behavior, ticker timing, sound wrappers, controllers, menus, factories, entities, HUD wiring, the `TimePilot` class, and the React host component.
- Replaced the previous placeholder test script with a real `npm test` suite.

## 🔜 Next Milestones

- Add keyboard/gamepad configuration UI.
- Expand gameplay levels, enemies, bonuses, and sound controls.
