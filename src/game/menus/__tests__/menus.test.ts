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
    expect(context.strokeText).toHaveBeenCalledWith("TIME PILOT", 5, 7);
    expect(context.fillText).toHaveBeenCalledWith("TIME PILOT", -3, -5);
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
