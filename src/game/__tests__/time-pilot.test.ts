import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TimePilot from "../index";
import userOptions from "../user-options";

describe("TimePilot engine", () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    host = document.createElement("div");
    Object.defineProperty(host, "clientWidth", { value: 800 });
    Object.defineProperty(host, "clientHeight", { value: 600 });
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
    userOptions.setOption("enableDebug", false);
    userOptions.setDebugOption("invincible", true);
    localStorage.clear();
    userOptions.setOption("controllerType", "keyboard1");
    userOptions.setOption("gameZoom", 100);
    userOptions.setOption("gamepadEnabled", true);
    userOptions.setOption("language", "en");
    userOptions.setOption("uiZoom", 100);
    vi.restoreAllMocks();
  });

  it("mounts into a container and can pause, resume, restart, and destroy", async () => {
    const game = new TimePilot(host, { debug: true });

    await new Promise((resolve) => window.setTimeout(resolve, 5));

    expect(host.querySelector("canvas")).toBeInstanceOf(HTMLCanvasElement);

    game.pauseGame(true);
    game.resumeGame();
    game.restartGame();
    game.destroyGame();

    expect(console.info).toHaveBeenCalled();
  });

  it("applies controller options without enabling gamepad polling", async () => {
    const requestAnimationFrameSpy = vi.mocked(window.requestAnimationFrame);

    requestAnimationFrameSpy.mockClear();

    const game = new TimePilot(host, {
      controllerType: "keyboard2",
      gamepadEnabled: false,
    });

    await new Promise((resolve) => window.setTimeout(resolve, 5));

    expect(userOptions.controllerType).toBe("keyboard2");
    expect(userOptions.gamepadEnabled).toBe(false);
    expect(requestAnimationFrameSpy).not.toHaveBeenCalled();

    game.destroyGame();
  });

  it("starts the player game from the selected debug level", async () => {
    const game = new TimePilot(host, { debug: true });
    const pilot = game as unknown as {
      context: {
        _isDemoMode: boolean;
        _level: number;
        _menus: {
          activate: () => void;
          next: () => void;
          showStart: () => void;
        };
        _player: {
          getData: (key: "level") => number | undefined;
        };
      };
    };

    await new Promise((resolve) => window.setTimeout(resolve, 5));

    pilot.context._menus.showStart();
    for (let i = 0; i < 2; i++) {
      pilot.context._menus.next();
    }
    pilot.context._menus.activate();
    for (let i = 0; i < 5; i++) {
      pilot.context._menus.next();
    }
    pilot.context._menus.activate();
    for (let i = 0; i < 2; i++) {
      pilot.context._menus.next();
    }
    pilot.context._menus.activate();

    expect(pilot.context._isDemoMode).toBe(false);
    expect(pilot.context._level).toBe(3);
    expect(pilot.context._player.getData("level")).toBe(3);

    game.destroyGame();
  });

  it("freezes gameplay during the time-warp delay before the visible effect", () => {
    const game = new TimePilot(host, { debug: true, gamepadEnabled: false });
    const pilot = game as unknown as {
      configureGameLoop: () => void;
      context: {
        _bullets: { cleanup: () => void; reposition: () => void };
        _enemyBullets: { cleanup: () => void; reposition: () => void };
        _enemies: { cleanup: () => void; reposition: () => void };
        _gameTicker: {
          _schedule: Record<string, { callback: () => void; nthFrame: number }>;
          clearSchedule: () => void;
          getTicks: () => number;
        };
        _levelProgress: { bossDefeated: boolean };
        _player: {
          reposition: () => void;
          rotate: () => void;
          shoot: () => void;
          stopShooting: () => void;
        };
        _props: { cleanup: () => void; reposition: () => void };
      };
    };
    const spies = [
      vi.spyOn(pilot.context._player, "reposition"),
      vi.spyOn(pilot.context._player, "rotate"),
      vi.spyOn(pilot.context._player, "shoot"),
      vi.spyOn(pilot.context._player, "stopShooting"),
      vi.spyOn(pilot.context._enemies, "reposition"),
      vi.spyOn(pilot.context._bullets, "reposition"),
      vi.spyOn(pilot.context._enemyBullets, "reposition"),
      vi.spyOn(pilot.context._props, "reposition"),
      vi.spyOn(pilot.context._enemies, "cleanup"),
      vi.spyOn(pilot.context._bullets, "cleanup"),
      vi.spyOn(pilot.context._enemyBullets, "cleanup"),
      vi.spyOn(pilot.context._props, "cleanup"),
    ];

    pilot.context._gameTicker.clearSchedule();
    pilot.configureGameLoop();
    pilot.context._levelProgress.bossDefeated = true;

    const schedules = Object.values(pilot.context._gameTicker._schedule);
    const movement = schedules[3];
    const rotation = schedules[4];
    const shooting = schedules[5];
    const cleanup = schedules[7];

    cleanup.callback();
    expect(pilot.context._levelProgress.bossDefeated).toBe(false);
    spies.forEach((spy) => spy.mockClear());

    movement.callback();
    rotation.callback();
    shooting.callback();
    cleanup.callback();

    expect(pilot.context._player.stopShooting).toHaveBeenCalled();
    expect(pilot.context._player.reposition).not.toHaveBeenCalled();
    expect(pilot.context._player.rotate).not.toHaveBeenCalled();
    expect(pilot.context._player.shoot).not.toHaveBeenCalled();
    expect(pilot.context._enemies.reposition).not.toHaveBeenCalled();
    expect(pilot.context._bullets.reposition).not.toHaveBeenCalled();
    expect(pilot.context._enemyBullets.reposition).not.toHaveBeenCalled();
    expect(pilot.context._props.reposition).not.toHaveBeenCalled();
    expect(pilot.context._enemies.cleanup).not.toHaveBeenCalled();
    expect(pilot.context._bullets.cleanup).not.toHaveBeenCalled();
    expect(pilot.context._enemyBullets.cleanup).not.toHaveBeenCalled();
    expect(pilot.context._props.cleanup).not.toHaveBeenCalled();

    game.destroyGame();
  });

  it("persists user option updates", () => {
    userOptions.setOption("controllerType", "keyboard1");
    userOptions.setOption("gamepadEnabled", true);
    userOptions.setOption("gameZoom", 125);
    userOptions.setOption("language", "es");
    userOptions.setOption("uiZoom", 150);
    userOptions.setOption("enableDebug", true);
    userOptions.setDebugOption("showControlsOverlay", true);

    expect(userOptions.controllerType).toBe("keyboard1");
    expect(userOptions.gamepadEnabled).toBe(true);
    expect(localStorage.getItem("timePilot.userOptions")).toContain(
      '"controllerType":"keyboard1"'
    );
    expect(localStorage.getItem("timePilot.userOptions")).toContain(
      '"gamepadEnabled":true'
    );
    expect(localStorage.getItem("timePilot.userOptions")).toContain('"gameZoom":125');
    expect(localStorage.getItem("timePilot.userOptions")).toContain('"language":"es"');
    expect(localStorage.getItem("timePilot.userOptions")).toContain('"uiZoom":150');
    expect(localStorage.getItem("timePilot.userOptions")).toContain(
      '"enableDebug":true'
    );
    expect(localStorage.getItem("timePilot.userOptions")).toContain(
      '"showControlsOverlay":true'
    );
  });
});
