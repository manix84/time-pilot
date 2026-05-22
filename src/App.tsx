import type { CSSProperties } from "react";
import coverArt from "../art/cover.png";
import { isAboutRoute, isPwaMode, isPwaRoute, isShowcaseMode } from "./app-routing";
import titleBanner from "../art/titleBanner.png";
import TimePilotGame from "./components/TimePilotGame";

const appVersion =
  typeof __TIME_PILOT_VERSION__ === "undefined" ? "0.0.0" : __TIME_PILOT_VERSION__;
const authorLogo = `${import.meta.env.BASE_URL}logos/author-128-light.png`;
const authorUrl = "https://github.com/manix84";
const sourceUrl = "https://github.com/manix84/time-pilot";
const sponsorUrl = "https://github.com/sponsors/manix84";

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
      "Touch and drag from where your thumb lands to steer and fire, with the live steering guide enabled by default. Pinch adjusts UI and game zoom together.",
  },
];

const featureHighlights = [
  {
    title: "Offline PWA",
    details:
      "Install the canvas-only app, launch standalone, enter fullscreen play, and keep the screen awake during runs.",
  },
  {
    title: "Safe updates",
    details:
      "New builds wait in the background and surface an Update button on the root menu instead of interrupting play.",
  },
  {
    title: "Startup preroll",
    details:
      "Author logo, Time Pilot flyby, double-shot cue, and animated handoff into the root menu.",
  },
  {
    title: "Session restore",
    details:
      "Interrupted runs skip the intro on the next launch and reopen paused, with Continue and Restart ready.",
  },
  {
    title: "High scores",
    details:
      "Scores save locally first, sync when available, show satellite connection state, and include run stats like loops and near misses.",
  },
  {
    title: "About page",
    details:
      "Version, host, privacy stance, source link, and optional sponsorship are collected in one public page.",
  },
  {
    title: "Achievements",
    details:
      "Track skill shots, comeback runs, continue use, clean waves, era clears, and long-session milestones.",
  },
  {
    title: "Arcade tuning",
    details:
      "Era-specific enemy speeds, rockets, bombs, plasma shots, specials, bosses, extra lives, and continues.",
  },
  {
    title: "Debug tools",
    details:
      "Level previews, hitboxes, vectors, steering arcs, preroll replay, runtime logs, reset tools, and Storybook views.",
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
  "Skippable author and Time Pilot preroll before cold-start root-menu entry.",
  "Page-lifecycle session snapshots that restore interrupted player runs without per-frame storage writes.",
  "Standalone PWA launch with fullscreen, landscape, keep-awake, and installed-app exit requests from player actions.",
  "Local-first high scores with optional remote sync, satellite connection states, and single-use run receipts for submitted scores.",
  "Default-on touch steering guide that follows the active fire thumb from its initial touch point.",
  "Achievement subsystem with page rendering, counter progress, and unlock popups.",
  "Watch Demo mode with a mortal autopilot that scores, dodges, shoots, continues, and collects bonuses.",
  "Debug-menu runtime logging and confirmed reset actions for stored preferences, scores, and achievements.",
  "Staged-only local pre-commit checks with full-project pull request scans.",
];

const progress = [
  "React + TypeScript host",
  "Canvas game loop",
  "Scrollable localized menus",
  "Startup preroll",
  "Session restore",
  "Achievement tracking",
  "Keyboard, gamepad, mouse, and touch input",
  "Offline installable PWA",
  "Manual update flow",
  "CRT/VHS filter options",
  "Vitest coverage",
  "GitHub Pages deployment",
];

const getHostName = (): string => window.location.hostname || "localhost";

function AboutPage() {
  const facts = [
    ["Version", appVersion],
    ["Host", getHostName()],
    ["Built By", "Rob"],
    ["Cost", "Free"],
    ["Privacy", "No adverts, no tracking, local-first storage"],
    [
      "Purpose",
      "Keep a small arcade game playable, inspectable, and free while preserving the feel of a browser-era canvas project.",
    ],
  ];

  return (
    <main className={"app-shell about-shell"}>
      <section className={"about-page"} aria-labelledby={"about-title"}>
        <div className={"about-brand"}>
          <div className={"about-logo-stack"}>
            <img
              className={"about-game-logo"}
              src={titleBanner}
              alt={"Time Pilot"}
              width={574}
              height={154}
            />
            <a
              className={"about-author-link"}
              href={authorUrl}
              rel={"noreferrer"}
              target={"_blank"}
              aria-label={"Open Rob's GitHub profile"}
            >
              <img
                className={"about-author-logo"}
                src={authorLogo}
                alt={"Rob"}
                width={128}
                height={128}
              />
            </a>
          </div>
          <h1 id={"about-title"}>Time Pilot</h1>
          <p>A free, privacy-minded arcade rebuild for the web.</p>
        </div>

        <dl className={"about-facts"}>
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <div className={"about-copy"}>
          <p>
            Time Pilot is a modern React and TypeScript rebuild of an older
            browser-game prototype. It keeps the fast canvas arcade loop at the
            centre: readable waves, touch-friendly play, achievements, offline
            PWA support, and a codebase that is easy to study and improve.
          </p>
          <p>
            I built it because small web games should still feel direct, owned,
            and respectful of the person playing. The game is free, avoids ads
            and tracking, and stores player preferences, scores, achievements,
            and restore data locally on the device.
          </p>
          <p>
            I’m Rob, a software engineer who likes making practical, focused
            projects. Sponsorship is optional, but it helps keep projects like
            this maintained and free to use.
          </p>
        </div>

        <div className={"about-actions"}>
          <a href={sourceUrl} rel={"noreferrer"} target={"_blank"}>
            View Source
          </a>
          <a href={sponsorUrl} rel={"noreferrer"} target={"_blank"}>
            Sponsor Rob
          </a>
        </div>
        <p className={"about-sponsor-note"}>
          Donations and sponsorships support hosting, maintenance, and continued
          free access.
        </p>
      </section>
    </main>
  );
}

function App() {
  if (!isShowcaseMode() && isPwaRoute()) {
    return (
      <main className={"app-shell app-shell--pwa"} aria-label={"Time Pilot"}>
        <TimePilotGame
          enableAppExit={isPwaMode()}
          enableHistoryNavigation={isPwaMode()}
          enableImmersiveMode
          enableScreenWakeLock={isPwaMode()}
          enableUpdates={isPwaMode()}
        />
      </main>
    );
  }

  if (isAboutRoute()) {
    return <AboutPage />;
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
              as a playable browser demo and installable standalone PWA with
              typed engine modules, achievements, skippable startup preroll,
              fullscreen play entry, paused session restore, configurable
              controls, and automated release checks.
            </p>
            <div className={"hero-status"} aria-label={"Current build features"}>
              <span>Offline PWA</span>
              <span>Touch controls</span>
              <span>Achievements</span>
              <span>Preroll</span>
              <span>Session restore</span>
              <span>About page</span>
              <span>Manual updates</span>
            </div>
            <div className={"hero-actions"}>
              <a href={"#play"}>Play now</a>
              <a href={"pwa/"}>Open app view</a>
              <a href={"about/"}>About</a>
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
            a codebase that is easy to keep improving. The build now includes a
            skippable startup preroll, an achievements page, and unlock
            notifications alongside session restore for interrupted runs.
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
