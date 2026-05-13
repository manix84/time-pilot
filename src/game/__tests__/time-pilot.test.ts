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
    userOptions.setOption("gameZoom", 5);
    userOptions.setOption("gamepadEnabled", true);
    userOptions.setOption("uiZoom", 5);
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
    for (let i = 0; i < 4; i++) {
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

  it("persists user option updates", () => {
    userOptions.setOption("controllerType", "keyboard1");
    userOptions.setOption("gamepadEnabled", true);
    userOptions.setOption("gameZoom", 6);
    userOptions.setOption("uiZoom", 7);
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
    expect(localStorage.getItem("timePilot.userOptions")).toContain('"gameZoom":6');
    expect(localStorage.getItem("timePilot.userOptions")).toContain('"uiZoom":7');
    expect(localStorage.getItem("timePilot.userOptions")).toContain(
      '"enableDebug":true'
    );
    expect(localStorage.getItem("timePilot.userOptions")).toContain(
      '"showControlsOverlay":true'
    );
  });
});
