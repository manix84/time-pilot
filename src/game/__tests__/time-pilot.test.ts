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
    userOptions.setOption("gamepadEnabled", true);
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

  it("persists user option updates", () => {
    userOptions.setOption("controllerType", "keyboard1");
    userOptions.setOption("gamepadEnabled", true);
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
    expect(localStorage.getItem("timePilot.userOptions")).toContain(
      '"enableDebug":true'
    );
    expect(localStorage.getItem("timePilot.userOptions")).toContain(
      '"showControlsOverlay":true'
    );
  });
});
