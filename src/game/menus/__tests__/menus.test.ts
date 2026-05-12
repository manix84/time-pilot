import { afterEach, describe, expect, it, vi } from "vitest";
import Menus from "../../menus";
import type { GameArenaInstance } from "../../types";
import userOptions from "../../user-options";
import debugMenu from "../debug";
import mainMenu from "../main";
import pauseMenu from "../pause";

const createArena = (): GameArenaInstance => ({
  width: 800,
  height: 600,
  posX: 0,
  posY: 0,
  updatePosition: vi.fn(),
  resize: vi.fn(),
  getContext: vi.fn(() => document.createElement("canvas").getContext("2d")!),
  enterFullScreen: vi.fn(),
  exitFullScreen: vi.fn(),
  toggleFullScreen: vi.fn(),
  setBackgroundColor: vi.fn(),
  clear: vi.fn(),
  registerAssets: vi.fn(),
  preloadAssets: vi.fn(),
  renderText: vi.fn(),
  renderSprite: vi.fn(),
  drawCircle: vi.fn(),
  drawDebugGrid: vi.fn(),
  getElement: vi.fn(() => document.createElement("canvas")),
});

describe("menu definitions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    userOptions.setOption("enableDebug", false);
    userOptions.setDebugOption("invincible", true);
    userOptions.setDebugOption("showControlsOverlay", false);
    userOptions.setDebugOption("showHitboxes", true);
    userOptions.setDebugOption("showPlayerCoordinates", true);
    userOptions.setOption("controllerType", "keyboard1");
    userOptions.setOption("masterVolume", 10);
    userOptions.setKeyboardBinding("up", [38, 87]);
  });

  it("defines the main menu controls", () => {
    expect(mainMenu.name).toBe("Welcome");
    expect(mainMenu.buttons.start.callback?.()).toBeUndefined();
  });

  it("defines debug toggles", () => {
    expect(Object.values(debugMenu.buttons).every((button) => button.type === "toggle")).toBe(
      true
    );
  });

  it("defines pause settings", () => {
    expect(pauseMenu.buttons.musicVolume.options).toContain(11);
    expect(pauseMenu.buttons.controllerType.type).toBe("enum");
  });

  it("renders and activates the start menu", () => {
    const start = vi.fn();
    const arena = createArena();
    const menus = new Menus(arena, { start });

    menus.showStart();
    menus.render();
    menus.activate();
    const context = vi.mocked(arena.getContext).mock.results[0]
      .value as CanvasRenderingContext2D;

    expect(menus.isActive()).toBe(true);
    expect(context.transform).not.toHaveBeenCalled();
    expect(context.drawImage).toHaveBeenCalled();
    expect(start).toHaveBeenCalled();
  });

  it("supports pointer selection and click activation", () => {
    const start = vi.fn();
    const menus = new Menus(createArena(), { start });

    menus.showStart();
    menus.handlePointer({ posX: 0, posY: 0, type: "move" });
    expect(start).not.toHaveBeenCalled();

    menus.handlePointer({ posX: 0, posY: 0, type: "click" });
    expect(start).toHaveBeenCalled();
  });

  it("can render a continue action on the start screen", () => {
    const arena = createArena();
    const menus = new Menus(arena, { start: vi.fn() });

    menus.showStart({ startLabel: "Continue" });
    menus.render();

    expect(arena.renderText).toHaveBeenCalledWith(
      "Continue",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );
  });

  it("activates normal buttons from pointer press and release", () => {
    const start = vi.fn();
    const menus = new Menus(createArena(), { start });

    menus.showStart();
    menus.handlePointer({ posX: 0, posY: 0, type: "press" });
    expect(start).not.toHaveBeenCalled();

    menus.handlePointer({ posX: 0, posY: 0, type: "release" });
    expect(start).toHaveBeenCalledTimes(1);
  });

  it("does not activate a pressed button when released outside it", () => {
    const start = vi.fn();
    const menus = new Menus(createArena(), { start });

    menus.showStart();
    menus.handlePointer({ posX: 0, posY: 0, type: "press" });
    menus.handlePointer({ posX: 0, posY: 90, type: "release" });

    expect(start).not.toHaveBeenCalled();
  });

  it("opens options and adjusts volume and controller type", () => {
    const menus = new Menus(createArena(), { start: vi.fn() });
    userOptions.setOption("masterVolume", 5);
    userOptions.setOption("controllerType", "keyboard1");

    menus.showStart();
    menus.next();
    menus.activate();

    menus.adjust(1);
    expect(userOptions.masterVolume).toBe(6);

    menus.next();
    menus.next();
    menus.next();
    menus.adjust(1);
    expect(userOptions.controllerType).toBe("keyboard2");
  });

  it("renders slider values with a clipped progress underlay", () => {
    const arena = createArena();
    const menus = new Menus(arena, { start: vi.fn() });
    userOptions.setOption("masterVolume", 5);

    menus.showStart();
    menus.next();
    menus.activate();
    menus.render();

    const contexts = vi
      .mocked(arena.getContext)
      .mock.results.map((result) => result.value as CanvasRenderingContext2D);

    expect(
      contexts.some((context) =>
        vi.mocked(context.rect).mock.calls.some(
          (call) =>
            call[0] === -150 && call[1] === -54 && call[2] === 150 && call[3] === 36
        )
      )
    ).toBe(true);
    expect(contexts.some((context) => vi.mocked(context.clip).mock.calls.length > 0)).toBe(
      true
    );
    expect(arena.renderText).toHaveBeenCalledWith(
      "Master Volume",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ color: "#111927" })
    );
  });

  it("sets slider values from pointer clicks at the nearest step", () => {
    const menus = new Menus(createArena(), { start: vi.fn() });
    userOptions.setOption("masterVolume", 10);

    menus.showStart();
    menus.next();
    menus.activate();

    menus.handlePointer({ posX: -9, posY: -14, type: "click" });
    expect(userOptions.masterVolume).toBe(5);

    menus.handlePointer({ posX: -150, posY: -14, type: "click" });
    expect(userOptions.masterVolume).toBe(0);

    menus.handlePointer({ posX: 150, posY: -14, type: "click" });
    expect(userOptions.masterVolume).toBe(10);
  });

  it("drags slider values to the pointer position until release", () => {
    const menus = new Menus(createArena(), { start: vi.fn() });
    userOptions.setOption("masterVolume", 10);

    menus.showStart();
    menus.next();
    menus.activate();

    menus.handlePointer({ posX: -90, posY: -14, type: "press" });
    expect(userOptions.masterVolume).toBe(2);

    menus.handlePointer({ posX: 0, posY: -14, type: "drag" });
    expect(userOptions.masterVolume).toBe(5);

    menus.handlePointer({ posX: 210, posY: -14, type: "drag" });
    expect(userOptions.masterVolume).toBe(10);

    menus.handlePointer({ posX: 60, posY: -14, type: "release" });
    menus.handlePointer({ posX: 60, posY: -14, type: "drag" });
    expect(userOptions.masterVolume).toBe(10);
  });

  it("scales menus uniformly inside the padded viewport", () => {
    const performanceNow = vi.spyOn(performance, "now").mockReturnValue(0);
    const arena = {
      ...createArena(),
      height: 220,
    };
    const menus = new Menus(arena, { start: vi.fn() });

    menus.showStart();
    menus.next();
    menus.activate();

    for (let i = 0; i < 4; i++) {
      menus.next();
    }

    menus.activate();

    for (let i = 0; i < 5; i++) {
      menus.next();
    }

    performanceNow.mockReturnValue(1200);
    menus.render();

    const context = vi.mocked(arena.getContext).mock.results[0]
      .value as CanvasRenderingContext2D;

    expect(context.scale).toHaveBeenCalledWith(0.344, 0.344);
    expect(context.rect).toHaveBeenCalledWith(
      -1093.0232558139535,
      -250.00000000000006,
      2186.046511627907,
      500.0000000000001
    );
    expect(context.clip).toHaveBeenCalled();
  });

  it("keeps pointer slider input aligned with scaled menus", () => {
    const arena = {
      ...createArena(),
      width: 320,
      height: 480,
    };
    const menus = new Menus(arena, { start: vi.fn() });
    userOptions.setOption("masterVolume", 10);

    menus.showStart();
    menus.next();
    menus.activate();
    menus.render();

    const context = vi.mocked(arena.getContext).mock.results[0]
      .value as CanvasRenderingContext2D;
    const scale = 272 / 438;

    expect(context.scale).toHaveBeenCalledWith(scale, scale);

    menus.handlePointer({
      posX: -9 * scale,
      posY: -14 * scale,
      type: "click",
    });

    expect(userOptions.masterVolume).toBe(5);
  });

  it("animates the title position into and out of submenus", () => {
    const performanceNow = vi.spyOn(performance, "now").mockReturnValue(0);
    const arena = createArena();
    const menus = new Menus(arena, { start: vi.fn() });

    menus.showStart();
    menus.next();
    menus.activate();
    menus.render();

    expect(arena.renderText).toHaveBeenCalledWith(
      "Options",
      0,
      -82,
      expect.objectContaining({ align: "center" })
    );

    performanceNow.mockReturnValue(600);
    menus.render();

    expect(arena.renderText).toHaveBeenCalledWith(
      "Options",
      0,
      -124,
      expect.objectContaining({ align: "center" })
    );

    performanceNow.mockReturnValue(1200);
    menus.render();

    expect(arena.renderText).toHaveBeenCalledWith(
      "Options",
      0,
      -166,
      expect.objectContaining({ align: "center" })
    );

    for (let i = 0; i < 5; i++) {
      menus.next();
    }

    menus.activate();
    menus.render();

    expect(arena.renderText).toHaveBeenCalledWith(
      "A.D. 1910",
      0,
      -166,
      expect.objectContaining({ align: "center" })
    );

    performanceNow.mockReturnValue(2400);
    menus.render();

    expect(arena.renderText).toHaveBeenCalledWith(
      "A.D. 1910",
      0,
      -82,
      expect.objectContaining({ align: "center" })
    );
  });

  it("unlocks the debug menu with the Konami code", () => {
    const arena = createArena();
    const menus = new Menus(arena, { start: vi.fn() });

    menus.showStart();
    for (const keyCode of [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]) {
      expect(menus.captureKey(keyCode)).toBe(false);
    }

    menus.render();

    expect(userOptions.enableDebug).toBe(true);
    expect(localStorage.getItem("timePilot.userOptions")).toContain(
      '"enableDebug":true'
    );
    expect(arena.renderText).toHaveBeenCalledWith(
      "Debug",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );
  });

  it("does not consume regular menu navigation keys", () => {
    const menus = new Menus(createArena(), { start: vi.fn() });

    menus.showStart();

    expect(menus.captureKey(40)).toBe(false);
  });

  it("keeps the debug menu unlocked for the current browser session", () => {
    userOptions.setOption("enableDebug", true);
    const arena = createArena();
    const menus = new Menus(arena, { start: vi.fn() });

    menus.showStart();
    menus.render();

    expect(arena.renderText).toHaveBeenCalledWith(
      "Debug",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );
  });

  it("opens debug options, toggles flags, and goes back", () => {
    const arena = createArena();
    const menus = new Menus(arena, { start: vi.fn() });

    menus.showStart();
    for (const keyCode of [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]) {
      menus.captureKey(keyCode);
    }

    menus.next();
    menus.next();
    menus.activate();
    menus.render();

    expect(arena.renderText).toHaveBeenCalledWith(
      "Invincibility Shield",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );

    menus.activate();
    expect(userOptions.debug.invincible).toBe(false);
    expect(localStorage.getItem("timePilot.userOptions")).toContain(
      '"invincible":false'
    );

    for (let i = 0; i < 5; i++) {
      menus.next();
    }

    menus.activate();
    menus.render();

    expect(arena.renderText).toHaveBeenCalledWith(
      "Start",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );
  });

  it("captures a replacement keyboard binding", () => {
    const menus = new Menus(createArena(), { start: vi.fn() });

    menus.showStart();
    menus.next();
    menus.activate();

    for (let i = 0; i < 4; i++) {
      menus.next();
    }

    menus.activate();
    menus.activate();
    expect(menus.captureKey(73)).toBe(true);
    expect(userOptions.keyboardBindings.up).toEqual([73]);
    expect(localStorage.getItem("timePilot.userOptions")).toContain('"up":[73]');
    expect(menus.captureKey(74)).toBe(false);
  });

  it("denies duplicate keyboard bindings with a warning", () => {
    const arena = createArena();
    const menus = new Menus(arena, { start: vi.fn() });

    menus.showStart();
    menus.next();
    menus.activate();

    for (let i = 0; i < 4; i++) {
      menus.next();
    }

    menus.activate();
    menus.next();
    menus.next();
    menus.activate();

    expect(menus.captureKey(87)).toBe(true);
    expect(userOptions.keyboardBindings.down).toEqual([40, 83]);

    menus.render();

    expect(arena.renderText).toHaveBeenCalledWith(
      "Already assigned to Up",
      0,
      172,
      expect.objectContaining({ align: "center" })
    );
  });
});
