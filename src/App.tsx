import type { CSSProperties } from "react";
import coverArt from "../art/cover.png";
import titleBanner from "../art/titleBanner.png";
import TimePilotGame from "./components/TimePilotGame";

const pwaModeStorageKey = "timePilot.pwaMode";

const isShowcaseMode = (): boolean => {
  const url = new URL(window.location.href);

  return url.searchParams.get("mode") === "showcase" || url.hash === "#showcase";
};

const isInstalledDisplayMode = (): boolean => {
  const displayModes = ["fullscreen", "standalone", "minimal-ui"];
  const standaloneNavigator = navigator as Navigator & { standalone?: boolean };
  const url = new URL(window.location.href);
  const explicitPwaMode =
    url.searchParams.get("mode") === "pwa" ||
    url.hash === "#pwa" ||
    url.pathname.endsWith("/play");
  const installedDisplayMode =
    standaloneNavigator.standalone === true ||
    displayModes.some((mode) =>
      window.matchMedia?.(`(display-mode: ${mode})`).matches
    );

  if (explicitPwaMode || installedDisplayMode) {
    try {
      window.localStorage.setItem(pwaModeStorageKey, "true");
    } catch {
      // PWA mode still works without storage persistence.
    }

    return true;
  }

  try {
    return window.localStorage.getItem(pwaModeStorageKey) === "true";
  } catch {
    return false;
  }
};

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
      "Esc opens the start menu. Use keyboard, gamepad, or mouse to choose options.",
  },
];

const goals = [
  "Survive incoming waves while staying clear of collisions.",
  "Destroy enemy ships before they crowd the playfield.",
  "Collect bonus drops when they appear and keep flying as the pace builds.",
];

const progress = [
  "React + TypeScript host",
  "Canvas game loop",
  "Start and options menus",
  "Keyboard and gamepad input",
  "Vitest coverage",
  "GitHub Pages deployment",
];

function App() {
  if (!isShowcaseMode() && isInstalledDisplayMode()) {
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
              as a playable browser demo with typed engine modules, configurable
              controls, and automated release checks.
            </p>
          </div>

          <section
            className={"game-panel"}
            aria-label={"Playable Time Pilot demo"}
          >
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
            readable waves, canvas-rendered menus, and a codebase that is easy
            to keep improving. The demo above is the project as it stands now,
            not a mockup.
          </p>
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
