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
- Separated simulation ticking from rendering: game-state calculations run at 50fps, while canvas rendering runs every animation frame.
- Added an in-app controller configuration UI for keyboard layout selection and gamepad polling.
- Added canvas-rendered start and options menus with volume controls, controller style selection, custom keyboard bindings, and keyboard/gamepad/mouse interaction.
- Fixed gamepad cleanup so animation frames are cancelled on disconnect.

## 🎮 Gameplay Tuning

- Rebalanced enemy speeds by era so biplanes, WWII fighters, helicopters, jets, and UFOs escalate more like Time Pilot.
- Tuned enemy bullets, bombs, and missiles around simple readable projectiles instead of dense bullet patterns.
- Added rocket sprites for level 3 and level 4 enemy missiles, with very slow level 3 homing, limited level 4 homing, and rockets that can be shot down.
- Added the animated level 5 plasma projectile sprite and kept plasma shots non-homing while making their initial aim independent of UFO facing.
- Added bomb and plasma projectile explosion sprites for shoot-downs and player impacts.
- Updated player and enemy sprite handling for the newer sprite sheets, including level 1 biplane animation, level 3 helicopter turning, level 5 UFO animation, and the 32-frame player rotation sheet.
- Updated bonus and explosion sprite geometry for the refreshed parachute, basic enemy, boss, and special bomber sheets.
- Replaced level 5 cloud props with refreshed asteroid sprites.
- Updated level 1 biplane sprite handling for the half-size refreshed sheet.
- Updated level 2 fighter sprite handling for the refreshed three-row directional animation and death-flash sheet.
- Updated level 4 basic enemy sprite handling for the refreshed three-row directional animation and death-flash sheet.
- Updated level 5 basic enemy sprite handling for the refreshed two-row animation and death-flash sheet.
- Updated the player sprite handling for the white and black time-warp animation layers.
- Added the six-second player time-warp sound effect.
- Added optional time-warp sound playback to the Storybook preview.
- Added looping boss sound effects for levels 1-4, with positional audio support where the browser allows it.
- Added spatial enemy bullet, enemy explosion, rocket launch, and rocket flight sound effects.
- Added score-based extra lives at 10,000 points and every 50,000 points after, with an extra-life sound effect.
- Compacted the HUD life display to a multiplier once the player reaches nine lives.
- Added the delayed four-frame player time-warp transition effect before advancing to the next era, timed to six seconds total.
- Added a Storybook preview for the delayed four-frame player time-warp effect.
- Added continues and a game-over dialogue that offers Continue when continues
  remain, Restart when they do not, and Exit back to the root menu.
- Reworked demo gameplay so the demo pilot is mortal, earns score, instantly
  continues, dodges bullets and rockets, targets enemies/projectiles/bosses,
  and collects parachute bonuses.
- Improved enemy steering so enemies try to attack without behaving like direct
  collision-seeking kamikaze craft.
- Added cloud layering so large clouds can pass behind the player with a faint
  duplicate over the top, while asteroids remain separate level 5 props.

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
- Added the root-menu Watch Demo flow, including animated logo movement into
  and out of demo view and control-overlay input display for demo actions.
- Added fullscreen options and an `F` key toggle that stay in sync with browser
  fullscreen state.
- Moved the controls overlay toggle into Options and hid the unfinished Control
  Type row behind an opt-in URL flag.
- Added touch-friendly menu behavior, including scrollable menu containers,
  wheel scrolling, scrollbar dragging, touch drag scrolling, and movement
  thresholds so small finger movement still counts as a tap.
- Added touch gameplay affordances: two-finger menu access, three-finger
  restart confirmation, pinch zoom for UI and game scale together, and
  touch-relative steering.
- Added root-menu update availability. When a PWA update is waiting, the
  non-playing root menu shows Update, applies the waiting worker, plays a
  no-delay player time-warp overlay, and reloads into the updated files.
- Added video filter settings under Options, including Off, CRT/VHS presets,
  custom sliders, descriptions, and CSS-based RGB split/filter overlays.
- Added alternating UK/US and Spain/Mexico flag fades for English and Spanish.

## ✅ Automation

- Added GitHub Actions for PR tests, lint, and type checks.
- Added GitHub Pages deployment on merges to `main`.
- Added release automation based on the current `package.json` version.
- Added a pre-commit hook for smart semantic version bumping.
- Changed the local pre-commit checks to lint and type-check only staged files
  from a temporary staged-index snapshot, while PR checks continue to scan the
  full project.
- Added a dry-run production build to pull request checks.
- Added installable PWA support with a dedicated `/pwa/` canvas-only endpoint,
  offline app-shell/game-asset caching, and non-interrupting service worker
  update detection.

## 🧪 Test Coverage

- Added Vitest with jsdom for fast local and CI test runs.
- Added browser API shims for canvas, media, animation frames, and gamepads.
- Covered core engine helpers, arena behavior, ticker timing, sound wrappers, controllers, menus, factories, entities, HUD wiring, the `TimePilot` class, and the React host component.
- Covered menu back navigation, paused root-menu resume behavior, debug level select previews, zoom controls, and keyboard/gamepad menu shortcuts.
- Added coverage for touch menu routing and scrolling, staged-only hook logic,
  update menu availability, filter editing baselines, time-warp previews, and
  debug overlay stories.
- Replaced the previous placeholder test script with a real `npm test` suite.

## 🔜 Next Milestones

- Continue tuning filters, offline update ergonomics, enemy AI, and mobile
  touch feel.
