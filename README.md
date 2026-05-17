# 🕹️ Time Pilot

**Time Pilot** is a modernized React + TypeScript rebuild of an older browser-game prototype. The game still renders through a pixel-art canvas engine, but it now lives inside a Vite application with typed game modules, React lifecycle integration, CI checks, GitHub Pages deployment, and release automation.

## ✨ Highlights

- 🎮 Canvas-based arcade gameplay hosted inside React.
- ⚛️ Thin React integration via `useTimePilot`.
- 🧠 Typed game engine modules with explicit game context injection.
- 🧱 Feature-oriented source layout under `src/game`.
- 🧪 Vitest coverage for engine helpers, controllers, menus, factories, the game host, and React integration.
- 🎛️ In-app keyboard layout and gamepad configuration.
- 🧭 Canvas-rendered start/options/debug menus with keyboard, gamepad, mouse, and touch interaction.
- 🔎 UI zoom and game POV zoom with automatic viewport scaling.
- 🏆 Achievement tracking with an achievements page, progress counters, and unlock popups.
- 🎬 Startup preroll with the author logo, Time Pilot flyby, menu-logo handoff, and instant skip input.
- 💾 Session restore that skips the preroll and returns interrupted runs to a paused Continue menu.
- 🛠️ Debug tools for level select, preroll replay, runtime logging, and stored-data resets.
- 📱 Installable offline PWA mode that launches as a standalone app and enters fullscreen play from Start/Continue.
- 🔆 Optional PWA keep-awake mode, on by default, for active or paused player runs.
- 👆 Optional touch steering guide that appears only while the active gameplay touch is held.
- 🔁 Root-menu update flow that applies waiting PWA updates without interrupting play.
- 📺 Optional CRT/VHS filter presets with custom sliders.
- 🌍 Localized menus, level blurbs, and level showcase labels.
- ✅ PR checks for tests, lint, and type checking.
- 🚀 Automatic GitHub Pages deployment from `main`.
- 🏷️ Automatic GitHub Release creation from the current package version.
- 🔢 Local pre-commit version bumping based on staged changes.

## 🚀 Quick Start

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## 📱 Installable PWA

The production build includes a web app manifest and service worker. Installed
launches use the dedicated `/pwa/` endpoint, which renders only the game canvas.
The manifest uses standalone display mode with landscape orientation so Android
identifies the install as an app, then the game requests fullscreen and a
landscape orientation lock from the player's Start/Continue action where mobile
browsers allow it.

The service worker caches the app shell plus core game sprites, fonts, and
sounds so the installed game can continue to run offline after it has been
installed or loaded. On the `/pwa/` game route, the app checks for a new service
worker on load, reconnect, and tab focus. Updates wait in the background and
are applied only from the non-playing root menu through the `Update` button,
followed by the player time-warp animation and a reload.

When the game is running as an installed PWA, the root menu also shows an
`Exit` action. It asks the browser to close the app window; platforms that do
not allow scripted app closure may ignore the request.

Installed PWA options also include `Keep Screen Awake`. It is enabled by
default and uses the browser Screen Wake Lock API during active or paused player
runs so the display does not sleep mid-game. It releases automatically outside
real gameplay, such as demo, game-over, reset, and teardown states, and silently
falls back on browsers that do not support wake locks.

The showcase/landing page remains the default browser view.

Cold PWA/game starts now begin with a skippable preroll. The author logo fades
in from black, the Time Pilot logo and player flyby play next, then the logo
animates into the root-menu position while the attract demo starts behind it.

If a real player run is interrupted by closing or backgrounding the page, the
game stores a small session snapshot during page lifecycle events. On the next
launch it skips the preroll, restores the run into the same era, and opens the
root menu paused on `Continue`. A `Restart` action appears directly beneath it
for players who want to discard the restored run and begin again. The snapshot
is not written every frame, and demo, preroll, game-over, and time-warp states
are ignored.

## 🧪 Quality Checks

Run the same checks used by CI:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

`npm test` runs the Vitest suite in jsdom.

The test suite covers:

- Engine helpers, collision checks, object cloning, headings, and rotation math.
- Canvas arena, ticker, and sound wrappers using browser API shims.
- Keyboard, gamepad, mouse, and touch controller adapters.
- Menu definitions and state callbacks.
- Game entities, factories, HUD wiring, and context-backed modules.
- The `TimePilot` orchestrator and React `TimePilotGame` host component.

## ⚛️ React Usage

Use the game as a regular React component:

```tsx
import TimePilotGame from "./components/TimePilotGame";

function App() {
  return <TimePilotGame debug />;
}
```

The component delegates engine lifecycle to the hook:

```ts
const { setContainerElement, pause, resume, restart, destroy } =
  useTimePilot({ debug: true });
```

React owns mounting and cleanup. The game engine owns simulation, rendering, input, and timing.

`TimePilotGame` includes controller settings and input handling for:

- **Directional keyboard**: arrow keys or WASD point directly up, right, down, or left.
- **Rotate keyboard**: left/right rotate the player around the current heading.
- **Gamepad**: enables or disables browser Gamepad API polling.
- **Touch**: steering is relative to where the thumb first touches the screen,
  firing happens while touching, two-finger taps open the menu, three-finger
  taps request restart, and pinch gestures adjust UI and game zoom together.
  On touch-capable devices, Options includes a `Touch Steering Guide` toggle.
  When enabled, gameplay draws a guide from the initial touch point to the
  player thumb's current fire button position, and it disappears as soon as
  that touch is released.

The game also renders its start and options menus inside the canvas. Keyboard
and gamepad commands move, adjust, and activate menu items through the same
controller interface used for gameplay. Mouse and touch input support pointer
selection, scroll wheel or drag scrolling on overflowing menus, and scrollbar
dragging. Options currently include volume levels, fullscreen, controls overlay,
UI zoom, game POV zoom, video filters, achievements, language, and custom
keyboard bindings. UI zoom can also be adjusted from the keyboard with `+`/`=`
and `-`, and reset with `0`. Both zoom options default to 100% and range from
25% to 250% in 5% steps.

During play, `P` pauses the game and `Escape` opens the root menu with a
`Paused` subtitle and a `Continue` action. Pressing `Escape` again from that
paused root menu resumes play, matching the Continue button. In submenus,
`Escape`, `Backspace`, and the gamepad back button return to the previous menu.
`M` and the gamepad menu button jump back to the root menu.

The root menu can also enter a watchable gameplay demo. In demo view, the menu
drops away, the logo animates to the submenu position, HUD elements remain
visible, and any player input returns to the root menu. The demo player is not
invincible: it can die, auto-continue, score points, dodge threats, shoot
enemies/projectiles/bosses, and collect parachute bonuses.

The root menu also includes an achievements page. It lays out achievement cards
responsively, shows locked or unlocked sprite frames where icons exist, and
renders persistent counter progress for achievements such as `Quarter Master`.
Unlock notifications slide in above the credits line during play.

Game over now uses a canvas dialogue. If continues remain, the primary action
is `Continue`; otherwise it becomes `Restart`. `Exit` returns to the root menu.

When debug mode is unlocked, the level select menu includes translated era
blurbs on the left, level buttons in the centre, and animated enemy, special,
boss, and bonus previews on the right. Focusing a level also pins the background
demo preview to that era until the level select screen is closed. Debug overlays
can also show hitboxes, heading and steering vectors, and an optional turn-arc
fill for intentional moving entities. The debug menu can also replay the
startup preroll, change the runtime log level, and open reset tools for stored
preferences, scores, achievements, or all Time Pilot data. Destructive reset
actions require confirmation and name the exact data group being cleared.

Runtime logging is disabled by default. When enabled from the debug menu, the
logger supports `debug`, `info`, `warning`, `error`, and `fatal` thresholds and
uses structured console details for lifecycle events such as preroll, game
start, continues, resets, achievements, game over, and time warp.

Gameplay now includes score-based extra lives at 10,000 points and every
50,000 points after, compact HUD life counts once they reach nine lives,
continues, era-specific projectile tuning, homing rockets for levels 3 and 4,
level 5 plasma shots, shootable rockets/bombs/plasma, refreshed cloud and
asteroid props, and the six-second time-warp transition between eras. Entity
sounds support spatial panning where the browser allows it.

## 🧭 Project Structure

```text
src/
  components/
    TimePilotGame.tsx       React host component
  game/
    index.ts                TimePilot engine orchestrator
    use-time-pilot.ts       React bridge hook
    types.ts                Shared game contracts
    constants.ts            Game tuning and asset constants
    game-timing.ts          Shared simulation tick rate
    logger.ts               Debug-menu-controlled runtime logger
    screen-wake-lock.ts     Installed-PWA keep-awake helper
    storage-reset.ts        Debug reset helpers for persisted data
    achievements.ts         Achievement definitions and tracking subsystem
    achievement-notifications.ts
                            Canvas unlock popup renderer
    preroll.ts              Startup author logo, flyby, and menu handoff
    __tests__/              Game module test coverage
    controller/             Keyboard and gamepad input adapters
    engine/                 Canvas arena, ticker, sound, helpers
    menus/                  Menu definitions
    systems/                Collision, spawning, and rendering systems
    ui-scale.ts             UI and game zoom helpers
    time-warp.ts            Player time-warp sequence timing
    *.ts                    Entities, factories, HUD, options
  test/
    setup.ts                Vitest jsdom/browser API shims
```

## 🧠 Architecture

The current design keeps React out of the game loop. This is deliberate.

- React handles lifecycle, layout, and app composition.
- `useTimePilot` creates and destroys the game instance.
- `TimePilot` owns the game context and wires systems together.
- Entities, factories, controllers, HUD, and engine wrappers are class-based modules.
- Collision, spawning, and frame rendering live in dedicated systems under `src/game/systems`.
- Entities and factories receive explicit context instead of reading a global singleton.
- Simulation uses a fixed-step ticker at 50fps for movement, spawning, collisions, cleanup, and player actions.
- Rendering uses a separate animation-frame ticker to paint the latest entity locations and orientations as often as the browser can display them.
- Game rendering applies pixelated POV scaling separately from HUD and menu UI scaling.
- Rendering stays canvas-based for predictable paint ordering and frame-by-frame control.
- Public game utilities, engine entry points, systems, controllers, and React
  bridge components include JSDoc comments for generated API documentation and
  easier maintenance.

## 🔁 CI/CD

GitHub Actions are configured for:

- **Run Tests** on pull requests to `main`.
- **Run Lint** on pull requests to `main`.
- **Run TypeCheck** on pull requests to `main`.
- **Build** on pull requests to `main`.
- **Deploy to GitHub Pages** on pushes to `main`.
- **Release Current Version** on pushes to `main`.

GitHub Pages builds with:

```bash
VITE_BASE_PATH=/time-pilot/ npm run build
```

## 🔢 Versioning

The repo includes a pre-commit hook at `.githooks/pre-commit`.

Enable it in a fresh checkout:

```bash
git config core.hooksPath .githooks
```

The hook runs:

```bash
npm run precommit:staged
npm run version:bump
```

`precommit:staged` checks a temporary checkout of the staged index. It
type-checks staged TypeScript files from that staged snapshot and lints only
staged lintable files, without stashing or inspecting unstaged work. Pull
request checks still run full project scans.

The version bump script inspects staged changes:

- **major** for public API removals, deletions, or explicit breaking-change signals.
- **minor** for new source, assets, dependency changes, exports, or game feature code.
- **patch** for smaller implementation/config fixes.
- **none** for docs-only changes.

Override the heuristic when needed:

```bash
TIME_PILOT_VERSION_BUMP=major git commit
TIME_PILOT_VERSION_BUMP=minor git commit
TIME_PILOT_VERSION_BUMP=patch git commit
TIME_PILOT_VERSION_BUMP=none git commit
```

## 🗒️ Milestones

See [WHATSNEW.md](./WHATSNEW.md) for major project milestones and migration history.
