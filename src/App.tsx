import type { CSSProperties } from "react";
import coverArt from "../art/cover.png";
import { isPwaRoute, isShowcaseMode } from "./app-routing";
import titleBanner from "../art/titleBanner.png";
import TimePilotGame from "./components/TimePilotGame";

const controlGroups = [
  {
    title: "Directional",
    details: "WASD or arrow keys point the ship directly. Space fires.",
  },
  {
    title: "Rotate",
    details:
      "Left and right rotate the ship around its current heading. Space fires.",
  },
  {
    title: "Menus",
    details:
      "Esc or M opens the root menu. Use keyboard, gamepad, mouse, or touch to choose options.",
  },
  {
    title: "Touch",
    details:
      "Touch and drag from where your thumb lands to steer and fire. Pinch adjusts UI and game zoom together.",
  },
];

const featureHighlights = [
  {
    title: "Offline PWA",
    details:
      "Install the canvas-only app, keep core sprites and sounds cached, and play when the network drops.",
  },
  {
    title: "Safe updates",
    details:
      "New builds wait in the background and surface an Update button on the root menu instead of interrupting play.",
  },
  {
    title: "Touch ready",
    details:
      "Thumb-relative steering, pinch zoom, touch menu scrolling, and multi-touch shortcuts keep phone play practical.",
  },
  {
    title: "Arcade tuning",
    details:
      "Era-specific enemy speeds, rockets, bombs, plasma shots, specials, bosses, extra lives, and continues.",
  },
  {
    title: "Visual options",
    details:
      "UI zoom, game POV zoom, fullscreen controls, and CRT/VHS-style filter presets with custom sliders.",
  },
  {
    title: "Debug tools",
    details:
      "Level previews, hitboxes, vectors, steering arcs, sprite showcases, and Storybook views for hard-to-see systems.",
  },
];

const goals = [
  "Survive readable waves while staying clear of collisions, rockets, bombs, and plasma.",
  "Destroy enemies, specials, projectiles, and bosses before they crowd the playfield.",
  "Collect parachute bonuses, earn extra lives, and keep flying through each time warp.",
];

const systemUpdates = [
  "50fps simulation with separate animation-frame rendering.",
  "Spatial entity audio for bosses, rockets, bullets, bombs, and explosions.",
  "Watch Demo mode with a mortal autopilot that scores, dodges, shoots, continues, and collects bonuses.",
  "Staged-only local pre-commit checks with full-project pull request scans.",
];

const progress = [
  "React + TypeScript host",
  "Canvas game loop",
  "Scrollable localized menus",
  "Keyboard, gamepad, mouse, and touch input",
  "Offline installable PWA",
  "Manual update flow",
  "CRT/VHS filter options",
  "Vitest coverage",
  "GitHub Pages deployment",
];

function App() {
  if (!isShowcaseMode() && isPwaRoute()) {
    return (
      <main className={"app-shell app-shell--pwa"} aria-label={"Time Pilot"}>
        <TimePilotGame />
      </main>
    );
  }

  return (
    <main className={"app-shell"}>
      <section
        className={"showcase-hero"}
        style={{ "--cover-art": `url(${coverArt})` } as CSSProperties}
      >
        <div className={"hero-inner"}>
          <div className={"hero-copy"}>
            <img
              className={"title-banner"}
              src={titleBanner}
              alt={"Time Pilot"}
              width={574}
              height={154}
            />
            <p className={"hero-kicker"}>
              Arcade prototype rebuilt for the web
            </p>
            <h1>
              Fly through time, survive the sky, and keep the screen moving.
            </h1>
            <p className={"hero-summary"}>
              A modern React + TypeScript port of a canvas arcade game, packaged
              as a playable browser demo and installable offline PWA with typed
              engine modules, configurable controls, and automated release
              checks.
            </p>
            <div className={"hero-status"} aria-label={"Current build features"}>
              <span>Offline PWA</span>
              <span>Touch controls</span>
              <span>Manual updates</span>
              <span>CRT filters</span>
            </div>
            <div className={"hero-actions"}>
              <a href={"#play"}>Play now</a>
              <a href={"pwa/"}>Open app view</a>
            </div>
          </div>

          <section
            id={"play"}
            className={"game-panel"}
            aria-label={"Playable Time Pilot demo"}
          >
            <div className={"game-panel-header"}>
              <span>Live build</span>
              <span>Canvas engine</span>
            </div>
            <TimePilotGame />
          </section>
        </div>
      </section>

      <section className={"showcase-band"}>
        <div className={"section-inner intro-grid"}>
          <div>
            <p className={"section-kicker"}>Mission</p>
            <h2>Classic arcade pressure in a small, readable web build.</h2>
          </div>
          <p>
            Time Pilot is currently focused on the essentials: fast movement,
            readable waves, canvas-rendered menus, touch-friendly controls, and
            a codebase that is easy to keep improving. The demo above is the
            project as it stands now, not a mockup.
          </p>
        </div>
      </section>

      <section className={"showcase-band features-band"}>
        <div className={"section-inner"}>
          <div className={"section-heading"}>
            <p className={"section-kicker"}>Current Build</p>
            <h2>More than a browser embed.</h2>
          </div>
          <div className={"feature-grid"}>
            {featureHighlights.map((feature) => (
              <article className={"feature-tile"} key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.details}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={"showcase-band controls-band"}>
        <div className={"section-inner"}>
          <div className={"section-heading"}>
            <p className={"section-kicker"}>Controls</p>
            <h2>Pick the flight style that feels right.</h2>
          </div>
          <div className={"info-grid"}>
            {controlGroups.map((group) => (
              <article className={"info-card"} key={group.title}>
                <h3>{group.title}</h3>
                <p>{group.details}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={"showcase-band goals-band"}>
        <div className={"section-inner split-section"}>
          <div>
            <p className={"section-kicker"}>Goals</p>
            <h2>Stay alive, make space, and chase the next wave.</h2>
          </div>
          <ol className={"goal-list"}>
            {goals.map((goal) => (
              <li key={goal}>{goal}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className={"showcase-band systems-band"}>
        <div className={"section-inner split-section"}>
          <div>
            <p className={"section-kicker"}>Under The Hood</p>
            <h2>Small systems that keep the arcade loop readable.</h2>
          </div>
          <ul className={"system-list"}>
            {systemUpdates.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className={"showcase-band progress-band"}>
        <div className={"section-inner"}>
          <div className={"section-heading"}>
            <p className={"section-kicker"}>Project Progress</p>
            <h2>What is already in place.</h2>
          </div>
          <ul className={"progress-list"}>
            {progress.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

export default App;
