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
    userOptions.setOption("keepScreenAwake", true);
    userOptions.setOption("language", "en");
    userOptions.setOption("logLevel", "off");
    userOptions.setOption("uiZoom", 100);
    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 0,
    });
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("mounts into a container and can pause, resume, restart, and destroy", async () => {
    userOptions.setOption("logLevel", "info");
    const game = new TimePilot(host, { debug: true });

    await new Promise((resolve) => window.setTimeout(resolve, 20));

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

  it("requests immersive mode when the player starts from the menu", async () => {
    const enterImmersiveMode = vi.fn();
    const game = new TimePilot(host, {
      debug: true,
      enterImmersiveMode,
      gamepadEnabled: false,
    });
    const pilot = game as unknown as {
      context: {
        _menus: {
          activate: () => void;
          showStart: () => void;
        };
      };
    };

    await new Promise((resolve) => window.setTimeout(resolve, 5));

    pilot.context._menus.showStart();
    pilot.context._menus.activate();

    expect(enterImmersiveMode).toHaveBeenCalled();

    game.destroyGame();
  });

  it("keeps the screen wake lock active while gameplay is running or paused", async () => {
    const setScreenWakeLock = vi.fn();
    const game = new TimePilot(host, {
      debug: true,
      gamepadEnabled: false,
      setScreenWakeLock,
    });
    const pilot = game as unknown as {
      beginGame: () => void;
    };

    await new Promise((resolve) => window.setTimeout(resolve, 5));

    pilot.beginGame();
    expect(setScreenWakeLock).toHaveBeenLastCalledWith(true);

    game.pauseGame(true);
    expect(setScreenWakeLock).toHaveBeenLastCalledWith(true);

    userOptions.setOption("keepScreenAwake", false);
    game.resumeGame();
    expect(setScreenWakeLock).toHaveBeenLastCalledWith(false);

    game.destroyGame();
    expect(setScreenWakeLock).toHaveBeenLastCalledWith(false);
  });

  it("defaults the active controls overlay to touch on touch devices", async () => {
    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 1,
    });

    const game = new TimePilot(host, { debug: true });
    const pilot = game as unknown as {
      context: {
        _controlInputState: {
          activeController: string;
        };
      };
    };

    await new Promise((resolve) => window.setTimeout(resolve, 5));

    expect(pilot.context._controlInputState.activeController).toBe("touch");

    game.destroyGame();
  });

  it("mirrors demo autopilot controls into the controls overlay state", async () => {
    const game = new TimePilot(host, { debug: true, gamepadEnabled: false });
    const pilot = game as unknown as {
      startDemoMode: () => void;
      updateDemoAutopilot: () => void;
      context: {
        _controlInputState: {
          down: boolean;
          fire: boolean;
          left: boolean;
          right: boolean;
          up: boolean;
        };
        _demoControlInputState: {
          down: boolean;
          fire: boolean;
          left: boolean;
          right: boolean;
          up: boolean;
        };
      };
    };

    await new Promise((resolve) => window.setTimeout(resolve, 5));

    pilot.startDemoMode();
    pilot.updateDemoAutopilot();

    expect(pilot.context._controlInputState.fire).toBe(false);
    expect(
      [
        pilot.context._controlInputState.right,
        pilot.context._controlInputState.left,
        pilot.context._controlInputState.up,
        pilot.context._controlInputState.down,
      ].some(Boolean)
    ).toBe(false);
    expect(pilot.context._demoControlInputState.fire).toBe(true);
    expect(
      [
        pilot.context._demoControlInputState.right,
        pilot.context._demoControlInputState.left,
        pilot.context._demoControlInputState.up,
        pilot.context._demoControlInputState.down,
      ].some(Boolean)
    ).toBe(true);

    game.destroyGame();
  });

  it("steers the demo player away from incoming projectiles", async () => {
    const game = new TimePilot(host, { debug: true, gamepadEnabled: false });
    const pilot = game as unknown as {
      startDemoMode: () => void;
      updateDemoAutopilot: () => void;
      context: {
        _demoControlInputState: {
          left: boolean;
          right: boolean;
        };
        _enemyBullets: {
          create: (
            originX: number,
            originY: number,
            heading: number,
            size: number,
            velocity: number,
            color: string,
            playSound?: boolean,
            coordinateSpace?: "screen" | "world"
          ) => void;
        };
        _player: {
          getData: (key: "newHeading") => number | false | undefined;
        };
      };
    };

    await new Promise((resolve) => window.setTimeout(resolve, 5));

    pilot.startDemoMode();
    pilot.context._enemyBullets.create(
      0,
      -60,
      180,
      6,
      8,
      "#fff",
      false,
      "world"
    );

    pilot.updateDemoAutopilot();

    expect(pilot.context._player.getData("newHeading")).toBe(270);
    expect(pilot.context._demoControlInputState.left).toBe(true);
    expect(pilot.context._demoControlInputState.right).toBe(false);

    game.destroyGame();
  });

  it("aims the demo player at attack targets when not dodging", async () => {
    const game = new TimePilot(host, { debug: true, gamepadEnabled: false });
    const pilot = game as unknown as {
      startDemoMode: () => void;
      updateDemoAutopilot: () => void;
      context: {
        _enemies: {
          create: (posX: number, posY: number, heading: number) => void;
        };
        _player: {
          getData: (key: "newHeading") => number | false | undefined;
        };
      };
    };

    await new Promise((resolve) => window.setTimeout(resolve, 5));

    pilot.startDemoMode();
    pilot.context._enemies.create(-120, 0, 90);

    pilot.updateDemoAutopilot();

    expect(pilot.context._player.getData("newHeading")).toBe(270);

    game.destroyGame();
  });

  it("aims the demo player at bonuses when it is safe", async () => {
    const game = new TimePilot(host, { debug: true, gamepadEnabled: false });
    const pilot = game as unknown as {
      startDemoMode: () => void;
      updateDemoAutopilot: () => void;
      context: {
        _bonuses: {
          create: (posX: number, posY: number) => void;
        };
        _player: {
          getData: (key: "newHeading") => number | false | undefined;
        };
      };
    };

    await new Promise((resolve) => window.setTimeout(resolve, 5));

    pilot.startDemoMode();
    pilot.context._bonuses.create(120, 0);

    pilot.updateDemoAutopilot();

    expect(pilot.context._player.getData("newHeading")).toBe(90);

    game.destroyGame();
  });

  it("does not force the demo player alive while death is resolving", async () => {
    const game = new TimePilot(host, { debug: true, gamepadEnabled: false });
    const pilot = game as unknown as {
      startDemoMode: () => void;
      updateDemoAutopilot: () => void;
      context: {
        _demoControlInputState: {
          fire: boolean;
          right: boolean;
        };
        _player: {
          getData: (key?: string) => Record<string, unknown>;
          setData: (key: string, value: unknown) => void;
        };
      };
    };

    await new Promise((resolve) => window.setTimeout(resolve, 5));

    pilot.startDemoMode();
    pilot.context._player.setData("isAlive", false);
    pilot.context._demoControlInputState.fire = true;
    pilot.context._demoControlInputState.right = true;

    pilot.updateDemoAutopilot();

    expect(pilot.context._player.getData("isAlive")).toBe(false);
    expect(pilot.context._demoControlInputState.fire).toBe(false);
    expect(pilot.context._demoControlInputState.right).toBe(false);

    game.destroyGame();
  });

  it("auto-continues the demo after the final death without game-over state", async () => {
    const game = new TimePilot(host, { debug: true, gamepadEnabled: false });
    const pilot = game as unknown as {
      continueDemoIfNeeded: () => void;
      startDemoMode: () => void;
      context: {
        _player: {
          getData: (key?: string) => Record<string, unknown>;
          setData: (key: string, value: unknown) => void;
        };
      };
    };

    await new Promise((resolve) => window.setTimeout(resolve, 5));

    pilot.startDemoMode();
    pilot.context._player.setData("score", 1200);
    pilot.context._player.setData("nextExtraLifeScore", 10000);
    pilot.context._player.setData("lives", 0);
    pilot.context._player.setData("isAlive", false);
    pilot.context._player.getData().removeMe = true;

    pilot.continueDemoIfNeeded();

    expect(pilot.context._player.getData("lives")).toBe(3);
    expect(pilot.context._player.getData("continues")).toBe(Infinity);
    expect(pilot.context._player.getData("score")).toBe(1200);
    expect(pilot.context._player.getData("nextExtraLifeScore")).toBe(10000);
    expect(pilot.context._player.getData("isAlive")).toBe(true);
    expect(pilot.context._player.getData("removeMe")).toBeUndefined();

    game.destroyGame();
  });

  it("keeps demo score when cycling demo levels", async () => {
    const game = new TimePilot(host, { debug: true, gamepadEnabled: false });
    const pilot = game as unknown as {
      advanceDemoLevel: () => void;
      startDemoMode: () => void;
      context: {
        _player: {
          getData: (key?: string) => Record<string, unknown> | number;
          setData: (key: string, value: unknown) => void;
        };
      };
    };

    await new Promise((resolve) => window.setTimeout(resolve, 5));

    pilot.startDemoMode();
    pilot.context._player.setData("score", 2500);
    pilot.context._player.setData("nextExtraLifeScore", 10000);

    pilot.advanceDemoLevel();

    expect(pilot.context._player.getData("score")).toBe(2500);
    expect(pilot.context._player.getData("nextExtraLifeScore")).toBe(10000);

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
    for (let i = 0; i < 3; i++) {
      pilot.context._menus.next();
    }
    pilot.context._menus.activate();
    for (let i = 0; i < 8; i++) {
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

  it("saves a playable session snapshot when the page is hidden", async () => {
    const game = new TimePilot(host, { debug: true });
    const pilot = game as unknown as {
      beginGame: () => void;
      context: {
        _player: {
          setData: (key: string, value: unknown, isLastKnownGood?: boolean) => void;
        };
      };
    };

    await new Promise((resolve) => window.setTimeout(resolve, 5));

    pilot.beginGame();
    pilot.context._player.setData("score", 12345, true);
    pilot.context._player.setData("lives", 2, true);
    pilot.context._player.setData("continues", 1, true);
    pilot.context._player.setData("posX", 42);
    pilot.context._player.setData("posY", -24);
    window.dispatchEvent(new Event("pagehide"));

    const snapshot = JSON.parse(
      localStorage.getItem("timePilot.gameSession") ?? "{}"
    );

    expect(snapshot).toMatchObject({
      level: 1,
      player: {
        continues: 1,
        lives: 2,
        posX: 42,
        posY: -24,
        score: 12345,
      },
      version: 1,
    });

    game.destroyGame();
  });

  it("saves a playable session snapshot before exiting the installed app", async () => {
    const exitApp = vi.fn();
    const game = new TimePilot(host, {
      exitApp,
      gamepadEnabled: false,
    });
    const pilot = game as unknown as {
      beginGame: () => void;
      context: {
        _menus: {
          activate: () => void;
          next: () => void;
          showStart: (options?: { startLabel?: string }) => void;
        };
        _player: {
          setData: (key: string, value: unknown, isLastKnownGood?: boolean) => void;
        };
      };
    };

    await new Promise((resolve) => window.setTimeout(resolve, 5));

    pilot.beginGame();
    pilot.context._player.setData("score", 23456, true);
    pilot.context._player.setData("lives", 2, true);
    pilot.context._player.setData("continues", 1, true);
    pilot.context._player.setData("posX", 64);
    pilot.context._player.setData("posY", -12);
    pilot.context._menus.showStart({ startLabel: "Continue" });
    for (let i = 0; i < 3; i++) {
      pilot.context._menus.next();
    }
    pilot.context._menus.activate();

    const snapshot = JSON.parse(
      localStorage.getItem("timePilot.gameSession") ?? "{}"
    );

    expect(exitApp).toHaveBeenCalled();
    expect(snapshot).toMatchObject({
      level: 1,
      player: {
        continues: 1,
        lives: 2,
        posX: 64,
        posY: -12,
        score: 23456,
      },
      version: 1,
    });

    game.destroyGame();
  });

  it("restores a saved session paused at the root menu", async () => {
    vi.stubGlobal(
      "Image",
      class {
        complete = true;
        onerror: (() => void) | null = null;
        onload: (() => void) | null = null;

        set src(_value: string) {
          window.setTimeout(() => this.onload?.(), 0);
        }
      }
    );
    localStorage.setItem(
      "timePilot.gameSession",
      JSON.stringify({
        level: 3,
        player: {
          continues: 2,
          heading: 90,
          lives: 1,
          nextExtraLifeScore: 50000,
          posX: 120,
          posY: -80,
          score: 34567,
        },
        savedAt: Date.now(),
        version: 1,
      })
    );
    const game = new TimePilot(host, { debug: true });
    const pilot = game as unknown as {
      context: {
        _gameTicker: { isRunning: boolean };
        _level: number;
        _menus: { next: () => void; activate: () => void; render: () => void };
        _player: {
          getData: (
            key: "continues" | "heading" | "lives" | "posX" | "posY" | "score"
          ) => number | undefined;
        };
      };
    };

    await new Promise((resolve) => window.setTimeout(resolve, 5));

    const renderText = vi.spyOn(pilot.context._menus, "render");
    pilot.context._menus.render();

    expect(pilot.context._gameTicker.isRunning).toBe(false);
    expect(pilot.context._level).toBe(3);
    expect(pilot.context._player.getData("score")).toBe(34567);
    expect(pilot.context._player.getData("lives")).toBe(1);
    expect(pilot.context._player.getData("continues")).toBe(2);
    expect(pilot.context._player.getData("heading")).toBe(90);
    expect(pilot.context._player.getData("posX")).toBe(120);
    expect(pilot.context._player.getData("posY")).toBe(-80);
    expect(renderText).toHaveBeenCalled();

    pilot.context._menus.next();
    pilot.context._menus.activate();

    expect(localStorage.getItem("timePilot.gameSession")).toBeNull();
    expect(pilot.context._gameTicker.isRunning).toBe(true);
    expect(pilot.context._level).toBe(1);

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
    expect(schedules).toHaveLength(7);
    const [, , movement, rotation, shooting, , cleanup] = schedules;

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

  it("keeps the player and scenery moving during a level intro until player input", () => {
    const game = new TimePilot(host, { debug: true, gamepadEnabled: false });
    const pilot = game as unknown as {
      configureGameLoop: () => void;
      context: {
        _bonuses: { reposition: () => void };
        _bullets: { reposition: () => void };
        _controlInputState: { fire: boolean };
        _enemyBullets: { reposition: () => void };
        _enemies: { reposition: () => void };
        _gameTicker: {
          _schedule: Record<string, { callback: () => void; nthFrame: number }>;
          clearSchedule: () => void;
        };
        _levelIntroUntilTick: number;
        _player: {
          reposition: () => void;
          rotate: () => void;
          setData: (key: string, value: unknown) => void;
          shoot: () => void;
          stopShooting: () => void;
        };
        _props: { reposition: () => void };
      };
      spawningSystem: { spawnEntities: () => void };
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
      vi.spyOn(pilot.context._bonuses, "reposition"),
      vi.spyOn(pilot.spawningSystem, "spawnEntities"),
    ];

    pilot.context._gameTicker.clearSchedule();
    pilot.configureGameLoop();
    pilot.context._levelIntroUntilTick = 250;

    const schedules = Object.values(pilot.context._gameTicker._schedule);
    expect(schedules).toHaveLength(7);
    const [, , movement, rotation, shooting] = schedules;

    movement.callback();
    rotation.callback();
    shooting.callback();

    expect(pilot.context._player.stopShooting).toHaveBeenCalled();
    expect(pilot.context._player.reposition).toHaveBeenCalled();
    expect(pilot.context._props.reposition).toHaveBeenCalled();
    expect(pilot.spawningSystem.spawnEntities).toHaveBeenCalled();
    expect(pilot.context._player.rotate).not.toHaveBeenCalled();
    expect(pilot.context._player.shoot).not.toHaveBeenCalled();
    expect(pilot.context._enemies.reposition).not.toHaveBeenCalled();
    expect(pilot.context._bullets.reposition).not.toHaveBeenCalled();
    expect(pilot.context._enemyBullets.reposition).not.toHaveBeenCalled();
    expect(pilot.context._bonuses.reposition).not.toHaveBeenCalled();
    expect(pilot.context._levelIntroUntilTick).toBe(250);

    spies.forEach((spy) => spy.mockClear());
    pilot.context._controlInputState.fire = true;

    movement.callback();
    rotation.callback();
    shooting.callback();

    expect(pilot.context._levelIntroUntilTick).toBe(0);
    expect(pilot.context._enemies.reposition).toHaveBeenCalled();
    expect(pilot.context._bullets.reposition).toHaveBeenCalled();
    expect(pilot.context._enemyBullets.reposition).toHaveBeenCalled();
    expect(pilot.context._bonuses.reposition).toHaveBeenCalled();
    expect(pilot.context._player.rotate).toHaveBeenCalled();
    expect(pilot.context._player.shoot).toHaveBeenCalled();

    game.destroyGame();
  });

  it("does not report demo time-warp progression to achievements", () => {
    const game = new TimePilot(host, { debug: true, gamepadEnabled: false });
    const pilot = game as unknown as {
      beginTimeWarpTransition: () => void;
      completeTimeWarpTransition: () => void;
      context: {
        _achievements: {
          onLevelCompleted: (
            level: number,
            nextLevel: number,
            playerData: unknown
          ) => void;
          onLevelStarted: (level: number) => void;
        };
        _gameTicker: {
          getTicks: () => number;
        };
        _isDemoMode: boolean;
        _level: number;
        _timeWarpTransition?: {
          endsAtTick: number;
        };
      };
      isDemoMode: boolean;
    };
    let ticks = 1000;
    const getTicks = vi
      .spyOn(pilot.context._gameTicker, "getTicks")
      .mockImplementation(() => ticks);
    const onLevelCompleted = vi.spyOn(
      pilot.context._achievements,
      "onLevelCompleted"
    );
    const onLevelStarted = vi.spyOn(
      pilot.context._achievements,
      "onLevelStarted"
    );

    pilot.isDemoMode = true;
    pilot.context._isDemoMode = true;
    pilot.context._level = 4;

    pilot.beginTimeWarpTransition();
    ticks = pilot.context._timeWarpTransition?.endsAtTick ?? ticks;
    pilot.completeTimeWarpTransition();

    expect(onLevelCompleted).not.toHaveBeenCalled();
    expect(onLevelStarted).not.toHaveBeenCalled();

    getTicks.mockRestore();
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
