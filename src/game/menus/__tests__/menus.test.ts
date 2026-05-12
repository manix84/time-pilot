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
    sessionStorage.clear();
    userOptions.enableDebug = false;
    userOptions.debug.invincible = true;
    userOptions.debug.showControlsOverlay = false;
    userOptions.debug.showHitboxes = true;
    userOptions.debug.showPlayerCoordinates = true;
    userOptions.setOption("controllerType", "keyboard1");
    userOptions.setOption("masterVolume", 10);
    userOptions.keyboardBindings.up = [38, 87];
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

  it("scrolls long menus inside a padded viewport", () => {
    const arena = {
      ...createArena(),
      height: 220,
    };
    const menus = new Menus(arena, { start: vi.fn() });

    menus.showStart();
    menus.next();
    menus.activate();

    for (let i = 0; i < 9; i++) {
      menus.next();
    }

    menus.render();

    const context = vi.mocked(arena.getContext).mock.results[0]
      .value as CanvasRenderingContext2D;

    expect(context.rect).toHaveBeenCalledWith(-376, -86, 752, 172);
    expect(context.clip).toHaveBeenCalled();
    expect(context.translate).toHaveBeenCalledWith(0, -238);

    menus.handlePointer({ posX: 0, posY: 70, type: "click" });
    menus.render();

    expect(arena.renderText).toHaveBeenCalledWith(
      "Start",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
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
    expect(sessionStorage.getItem("timePilot.debugUnlocked")).toBe("true");
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
    sessionStorage.setItem("timePilot.debugUnlocked", "true");
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
    expect(menus.captureKey(73)).toBe(true);
    expect(userOptions.keyboardBindings.up).toEqual([73]);
    expect(menus.captureKey(74)).toBe(false);
  });
});
