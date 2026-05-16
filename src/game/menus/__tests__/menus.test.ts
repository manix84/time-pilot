import { afterEach, describe, expect, it, vi } from "vitest";
import { filterPresets } from "../../filter-settings";
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
  isFullScreen: vi.fn(() => false),
  isFullScreenLocked: vi.fn(() => false),
  canToggleFullScreen: vi.fn(() => true),
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
    userOptions.setDebugOption("showHeadingVectors", false);
    userOptions.setDebugOption("showControlsOverlay", false);
    userOptions.setDebugOption("showHitboxes", true);
    userOptions.setDebugOption("showPlayerCoordinates", true);
    userOptions.setDebugOption("showSteeringArc", false);
    userOptions.setOption("controllerType", "keyboard1");
    userOptions.setOption("debugContinues", 3);
    userOptions.setOption("debugLives", 3);
    userOptions.setOption("language", "en");
    userOptions.setOption("gameZoom", 100);
    userOptions.setOption("masterVolume", 10);
    userOptions.setOption("uiZoom", 100);
    userOptions.setOption("filterSettings", { ...filterPresets.off });
    userOptions.setOption("videoFilterMode", "off");
    userOptions.setKeyboardBinding("up", [38, 87]);
    window.history.replaceState(null, "", "/");
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
    const versionCall = vi
      .mocked(arena.renderText)
      .mock.calls.find(([message]) => /^v\d+\.\d+\.\d+/.test(String(message)));
    const startMenuScale =
      Math.min(1, (arena.width - 48) / 828, (arena.height - 48) / 500) * 1;

    expect(versionCall?.[0]).toEqual(expect.stringMatching(/^v\d+\.\d+\.\d+/));
    expect(versionCall?.[1]).toBeCloseTo(
      (arena.width / 2 - 12) / startMenuScale
    );
    expect(versionCall?.[2]).toBeCloseTo(
      (arena.height / 2 - 10) / startMenuScale
    );
    expect(versionCall?.[3]).toEqual(
      expect.objectContaining({
        align: "right",
        valign: "bottom",
      })
    );
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
    expect(arena.renderText).toHaveBeenCalledWith(
      "Paused",
      0,
      -42,
      expect.objectContaining({ align: "center" })
    );
  });

  it("shows the update action on the non-playing root menu when an update is waiting", () => {
    const applyUpdate = vi.fn();
    const arena = createArena();
    const menus = new Menus(arena, {
      applyUpdate,
      canApplyUpdate: () => true,
      start: vi.fn(),
    });

    menus.showStart();
    menus.render();

    expect(arena.renderText).toHaveBeenCalledWith(
      "Update",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );

    menus.next();
    menus.next();
    menus.next();
    menus.activate();

    expect(applyUpdate).toHaveBeenCalled();
  });

  it("renders submenu and back chevrons", () => {
    const arena = createArena();
    const menus = new Menus(arena, { start: vi.fn() });

    menus.showStart();
    menus.render();

    let contexts = vi
      .mocked(arena.getContext)
      .mock.results.map((result) => result.value as CanvasRenderingContext2D);
    let fillRectCalls = contexts.flatMap((context) =>
      vi.mocked(context.fillRect).mock.calls
    );

    expect(fillRectCalls).toEqual(
      expect.arrayContaining([
        [136, 45, 3, 3],
      ])
    );

    vi.mocked(arena.getContext).mockClear();
    menus.next();
    menus.activate();
    menus.render();

    contexts = vi
      .mocked(arena.getContext)
      .mock.results.map((result) => result.value as CanvasRenderingContext2D);
    fillRectCalls = contexts.flatMap((context) =>
      vi.mocked(context.fillRect).mock.calls
    );

    expect(fillRectCalls).toEqual(
      expect.arrayContaining([
        [-137, 391, 3, 3],
      ])
    );
  });

  it("shows watch demo during demo mode and exits it on input", () => {
    const performanceNow = vi.spyOn(performance, "now").mockReturnValue(0);
    const watchDemo = vi.fn();
    const arena = createArena();
    userOptions.setOption("enableDebug", true);
    const menus = new Menus(arena, {
      canWatchDemo: () => true,
      start: vi.fn(),
      watchDemo,
    });

    menus.showStart();
    menus.render();
    const renderCalls = vi.mocked(arena.renderText).mock.calls;
    const debugY = renderCalls.find((call) => call[0] === "Debug")?.[2];
    const watchDemoY = renderCalls.find((call) => call[0] === "Watch Demo")?.[2];
    expect(debugY).toBeLessThan(
      typeof watchDemoY === "number" ? watchDemoY : Number.NaN
    );

    vi.mocked(arena.renderText).mockClear();
    menus.next();
    menus.next();
    menus.next();
    menus.next();
    menus.activate();
    menus.render();

    expect(watchDemo).toHaveBeenCalled();
    expect(menus.isWatchingDemo()).toBe(true);
    expect(arena.renderText).not.toHaveBeenCalledWith(
      "Demo",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );

    performanceNow.mockReturnValue(750);
    menus.render();
    expect(arena.renderText).toHaveBeenCalledWith(
      "Demo",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "center" })
    );
    expect(arena.renderText).not.toHaveBeenCalledWith(
      "Watch Demo",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );

    vi.mocked(arena.renderText).mockClear();
    performanceNow.mockReturnValue(800);
    menus.activate();

    expect(menus.isWatchingDemo()).toBe(false);
    menus.render();
    expect(arena.renderText).toHaveBeenCalledWith(
      "Demo",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "center" })
    );

    vi.mocked(arena.renderText).mockClear();
    performanceNow.mockReturnValue(901);
    menus.render();
    expect(arena.renderText).not.toHaveBeenCalledWith(
      "Demo",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
    expect(arena.renderText).toHaveBeenCalledWith(
      "Watch Demo",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );
  });

  it("opens the achievements page from the root menu with icon frames and progress", () => {
    const arena = createArena();
    const icon = (name: string) => ({
      frameWidth: 64,
      frameHeight: 64,
      lockedFrameX: 0,
      unlockedFrameX: 1,
      src: `/sprites/achievements/${name}`,
    });
    const menus = new Menus(arena, {
      getAchievements: () => [
        {
          id: "last-chance",
          name: "Last Chance",
          description: "Reach a new era on your final life.",
          icon: icon("achievement_lastChance.png"),
          unlocked: true,
        },
        {
          id: "quarter-master",
          name: "Quarter Master",
          description: "Use continues 25 times total.",
          icon: icon("achievement_quarterMaster.png"),
          progress: {
            current: 7,
            goal: 25,
          },
          progressGoal: 25,
          unlocked: false,
        },
        {
          id: "pilot-error",
          name: "Pilot Error",
          description: "Lose a life by flying directly into an enemy.",
          icon: icon("achievement_pilotError.png"),
          unlocked: false,
        },
      ],
      start: vi.fn(),
    });

    menus.showStart();
    menus.render();

    const optionsY = vi
      .mocked(arena.renderText)
      .mock.calls.find((call) => call[0] === "Options")?.[2];
    const achievementsY = vi
      .mocked(arena.renderText)
      .mock.calls.find((call) => call[0] === "Achievements")?.[2];

    expect(optionsY).toBeLessThan(
      typeof achievementsY === "number" ? achievementsY : Number.NaN
    );

    vi.mocked(arena.renderText).mockClear();
    vi.mocked(arena.getContext).mockClear();
    menus.next();
    menus.next();
    menus.activate();
    menus.render();

    expect(arena.renderText).toHaveBeenCalledWith(
      "Achievements",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "center" })
    );
    expect(arena.renderText).toHaveBeenCalledWith(
      "Quarter Master",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );
    expect(arena.renderText).toHaveBeenCalledWith(
      "7/25",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );

    const fillRectCalls = vi
      .mocked(arena.getContext)
      .mock.results.flatMap((result) =>
        vi.mocked((result.value as CanvasRenderingContext2D).fillRect).mock.calls
      );

    expect(fillRectCalls.length).toBeGreaterThan(0);
  });

  it("does not crash the achievements page while icon art is missing", () => {
    const arena = createArena();
    const menus = new Menus(arena, {
      getAchievements: () => [
        {
          id: "last-chance",
          name: "Last Chance",
          description: "Reach a new era on your final life.",
          icon: {
            frameWidth: 64,
            frameHeight: 64,
            lockedFrameX: 0,
            unlockedFrameX: 1,
            src: "/sprites/achievements/not-created-yet.png",
          },
          unlocked: false,
        },
      ],
      start: vi.fn(),
    });

    menus.showStart();
    menus.next();
    menus.next();
    menus.activate();

    expect(() => menus.render()).not.toThrow();

    const strokeRectCalls = vi
      .mocked(arena.getContext)
      .mock.results.flatMap((result) =>
        vi.mocked((result.value as CanvasRenderingContext2D).strokeRect).mock.calls
      );

    expect(strokeRectCalls).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([
          expect.any(Number),
          expect.any(Number),
          48,
          48,
        ]),
      ])
    );
  });

  it("shows restart confirmation and only restarts after confirmation", () => {
    const restart = vi.fn();
    const arena = createArena();
    const menus = new Menus(arena, { start: vi.fn(), restart });

    menus.showStart({ startLabel: "Continue" });
    menus.showRestartConfirm();
    menus.render();

    expect(arena.renderText).toHaveBeenCalledWith(
      "Restart Game?",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "center" })
    );
    expect(arena.renderText).toHaveBeenCalledWith(
      "Restart",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );

    menus.next();
    menus.activate();
    expect(restart).not.toHaveBeenCalled();

    menus.showRestartConfirm();
    menus.activate();
    expect(restart).toHaveBeenCalled();
  });

  it("shows continue on game over when continues remain", () => {
    const continueGame = vi.fn();
    const exitToRoot = vi.fn();
    const arena = createArena();
    const menus = new Menus(arena, {
      continueGame,
      exitToRoot,
      getContinues: () => 1,
      start: vi.fn(),
    });

    menus.showGameOver();
    menus.render();

    expect(arena.renderText).toHaveBeenCalledWith(
      "Game Over",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "center" })
    );
    expect(arena.renderText).toHaveBeenCalledWith(
      "Continue",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );

    menus.activate();
    expect(continueGame).toHaveBeenCalled();

    menus.showGameOver();
    menus.next();
    menus.activate();
    expect(exitToRoot).toHaveBeenCalled();
  });

  it("shows restart on game over when no continues remain", () => {
    const restart = vi.fn();
    const arena = createArena();
    const menus = new Menus(arena, {
      getContinues: () => 0,
      restart,
      start: vi.fn(),
    });

    menus.showGameOver();
    menus.render();

    expect(arena.renderText).toHaveBeenCalledWith(
      "Restart",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );

    menus.activate();
    expect(restart).toHaveBeenCalled();
  });

  it("continues from the paused root menu on escape", () => {
    const start = vi.fn();
    const menus = new Menus(createArena(), { start });

    menus.showStart({ startLabel: "Continue" });

    expect(menus.captureKey(27)).toBe(true);
    expect(start).toHaveBeenCalled();
  });

  it("keeps the non-game root menu open on escape", () => {
    const start = vi.fn();
    const menus = new Menus(createArena(), { start });

    menus.showStart();

    expect(menus.captureKey(27)).toBe(true);
    expect(menus.isActive()).toBe(true);
    expect(start).not.toHaveBeenCalled();
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

  it("keeps tiny touch drags as taps", () => {
    const start = vi.fn();
    const menus = new Menus(createArena(), { start });

    menus.showStart();
    menus.handlePointer({ posX: 0, posY: 0, source: "touch", type: "press" });
    menus.handlePointer({ posX: 2, posY: 5, source: "touch", type: "drag" });
    menus.handlePointer({ posX: 2, posY: 5, source: "touch", type: "release" });

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

  it("opens options, adjusts volume, and hides control type", () => {
    const arena = createArena();
    const menus = new Menus(arena, { start: vi.fn() });
    userOptions.setOption("masterVolume", 5);
    userOptions.setOption("controllerType", "keyboard1");

    menus.showStart();
    menus.next();
    menus.activate();

    menus.activate();
    expect(userOptions.masterVolume).toBe(4);

    menus.adjust(1);
    expect(userOptions.masterVolume).toBe(5);

    menus.render();
    expect(arena.renderText).not.toHaveBeenCalledWith(
      "Control Type",
      expect.any(Number),
      expect.any(Number),
      expect.anything()
    );
    expect(userOptions.controllerType).toBe("keyboard1");
  });

  it("can reveal the hidden control type option with an explicit URL flag", () => {
    window.history.replaceState(null, "", "/?showControlType=true");
    const arena = createArena();
    const menus = new Menus(arena, { start: vi.fn() });

    menus.showStart();
    menus.next();
    menus.activate();
    menus.render();

    expect(arena.renderText).toHaveBeenCalledWith(
      "Control Type",
      expect.any(Number),
      expect.any(Number),
      expect.anything()
    );
  });

  it("toggles fullscreen from the options menu and disables it when locked", () => {
    const arena = createArena();
    const menus = new Menus(arena, { start: vi.fn() });

    menus.showStart();
    menus.next();
    menus.activate();

    for (let i = 0; i < 6; i++) {
      menus.next();
    }

    menus.render();
    expect(arena.renderText).toHaveBeenCalledWith(
      "Full Screen",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );
    expect(arena.renderText).toHaveBeenCalledWith(
      "Off",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "right" })
    );

    menus.activate();
    expect(arena.toggleFullScreen).toHaveBeenCalled();

    vi.mocked(arena.renderText).mockClear();
    vi.mocked(arena.isFullScreen).mockReturnValue(true);
    menus.render();
    expect(arena.renderText).toHaveBeenCalledWith(
      "On",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "right" })
    );

    const lockedArena = createArena();
    vi.mocked(lockedArena.isFullScreenLocked).mockReturnValue(true);
    vi.mocked(lockedArena.canToggleFullScreen).mockReturnValue(false);
    const lockedMenus = new Menus(lockedArena, { start: vi.fn() });

    lockedMenus.showStart();
    lockedMenus.next();
    lockedMenus.activate();
    for (let i = 0; i < 6; i++) {
      lockedMenus.next();
    }

    lockedMenus.activate();
    expect(lockedArena.toggleFullScreen).not.toHaveBeenCalled();
  });

  it("toggles the controls overlay from the options menu", () => {
    const arena = createArena();
    const menus = new Menus(arena, { start: vi.fn() });

    menus.showStart();
    menus.next();
    menus.activate();

    for (let i = 0; i < 7; i++) {
      menus.next();
    }

    menus.render();
    expect(arena.renderText).toHaveBeenCalledWith(
      "Show Controls Overlay",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );
    expect(arena.renderText).toHaveBeenCalledWith(
      "Off",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "right" })
    );

    menus.activate();
    expect(userOptions.debug.showControlsOverlay).toBe(true);
  });

  it("opens filters, changes presets, edits custom values, and resets", () => {
    const arena = createArena();
    const menus = new Menus(arena, { start: vi.fn() });

    menus.showStart();
    menus.next();
    menus.activate();

    for (let i = 0; i < 5; i++) {
      menus.next();
    }

    menus.activate();
    menus.render();
    expect(arena.renderText).toHaveBeenCalledWith(
      "Video Filter Mode",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );

    menus.activate();
    expect(userOptions.videoFilterMode).toBe("custom");

    menus.adjust(1);
    expect(userOptions.videoFilterMode).toBe("off");

    menus.next();
    menus.activate();
    menus.adjust(1);
    expect(userOptions.videoFilterMode).toBe("custom");
    expect(userOptions.filterSettings.scanlines).toBe(1);

    menus.captureKey(27);
    menus.next();
    menus.next();
    menus.activate();
    expect(userOptions.videoFilterMode).toBe("off");
    expect(userOptions.filterSettings.scanlines).toBe(0);
  });

  it("uses the active filter preset as the custom filter edit baseline", () => {
    const arena = createArena();
    const menus = new Menus(arena, { start: vi.fn() });
    userOptions.setOption("videoFilterMode", "arcade-crt");
    userOptions.setOption("filterSettings", { ...filterPresets.off });

    menus.showStart();
    menus.next();
    menus.activate();

    for (let i = 0; i < 5; i++) {
      menus.next();
    }

    menus.activate();
    menus.next();
    menus.activate();
    menus.render();

    expect(arena.renderText).toHaveBeenCalledWith(
      "35",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "right" })
    );

    menus.adjust(1);

    expect(userOptions.videoFilterMode).toBe("custom");
    expect(userOptions.filterSettings.scanlines).toBe(36);
    expect(userOptions.filterSettings.crtMask).toBe(filterPresets["arcade-crt"].crtMask);
  });

  it("adjusts UI and game zoom from the options menu", () => {
    const arena = createArena();
    const menus = new Menus(arena, { start: vi.fn() });
    userOptions.setOption("uiZoom", 100);
    userOptions.setOption("gameZoom", 100);

    menus.showStart();
    menus.next();
    menus.activate();

    for (let i = 0; i < 3; i++) {
      menus.next();
    }

    menus.adjust(1);
    expect(userOptions.uiZoom).toBe(105);

    menus.next();
    menus.adjust(-1);
    expect(userOptions.gameZoom).toBe(95);

    menus.render();

    expect(arena.renderText).toHaveBeenCalledWith(
      "105%",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "right" })
    );
    expect(arena.renderText).toHaveBeenCalledWith(
      "95%",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "right" })
    );
  });

  it("uses escape and backspace to return from submenus", () => {
    const arena = createArena();
    const menus = new Menus(arena, { start: vi.fn() });

    menus.showStart();
    menus.next();
    menus.activate();

    expect(menus.captureKey(8)).toBe(true);
    menus.render();
    expect(arena.renderText).toHaveBeenCalledWith(
      "Start",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );

    menus.next();
    menus.activate();
    for (let i = 0; i < 9; i++) {
      menus.next();
    }
    menus.activate();

    expect(menus.captureKey(27)).toBe(true);
    menus.render();
    expect(arena.renderText).toHaveBeenCalledWith(
      "Options",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "center" })
    );
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

  it("steps slider values left from pointer taps and clicks", () => {
    const menus = new Menus(createArena(), { start: vi.fn() });
    userOptions.setOption("masterVolume", 10);

    menus.showStart();
    menus.next();
    menus.activate();

    menus.handlePointer({
      posX: 0,
      posY: -14 * (752 / 828),
      type: "click",
    });
    expect(userOptions.masterVolume).toBe(9);

    menus.handlePointer({
      posX: 0,
      posY: -14 * (752 / 828),
      type: "press",
    });
    menus.handlePointer({
      posX: 0,
      posY: -14 * (752 / 828),
      type: "release",
    });
    expect(userOptions.masterVolume).toBe(8);

    userOptions.setOption("masterVolume", 0);
    menus.handlePointer({
      posX: 0,
      posY: -14 * (752 / 828),
      type: "click",
    });
    expect(userOptions.masterVolume).toBe(0);
  });

  it("drags slider values to the pointer position until release", () => {
    const menus = new Menus(createArena(), { start: vi.fn() });
    userOptions.setOption("masterVolume", 10);

    menus.showStart();
    menus.next();
    menus.activate();

    const transitionScale = 752 / 828;

    menus.handlePointer({
      posX: -90 * transitionScale,
      posY: -14 * transitionScale,
      type: "press",
    });
    expect(userOptions.masterVolume).toBe(10);

    menus.handlePointer({ posX: 0, posY: -14 * transitionScale, type: "drag" });
    expect(userOptions.masterVolume).toBe(5);

    menus.handlePointer({
      posX: 210 * transitionScale,
      posY: -14 * transitionScale,
      type: "drag",
    });
    expect(userOptions.masterVolume).toBe(10);

    menus.handlePointer({
      posX: 60 * transitionScale,
      posY: -14 * transitionScale,
      type: "release",
    });
    menus.handlePointer({
      posX: 60 * transitionScale,
      posY: -14 * transitionScale,
      type: "drag",
    });
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

    for (let i = 0; i < 3; i++) {
      menus.next();
    }

    menus.activate();
    menus.adjust(1);

    for (let i = 0; i < 7; i++) {
      menus.next();
    }

    performanceNow.mockReturnValue(1200);
    menus.render();

    const context = vi.mocked(arena.getContext).mock.results[0]
      .value as CanvasRenderingContext2D;

    expect(context.scale).toHaveBeenCalledWith(0.24767999999999998, 0.24767999999999998);
    expect(context.rect).toHaveBeenCalledWith(
      -1518.0878552971576,
      -237.22222222222223,
      3036.175710594315,
      584.4444444444445
    );
    expect(context.clip).toHaveBeenCalled();
  });

  it("clips overflowing zoomed menus below the header", () => {
    const performanceNow = vi.spyOn(performance, "now").mockReturnValue(0);
    const arena = createArena();
    const menus = new Menus(arena, { start: vi.fn() });
    userOptions.setOption("uiZoom", 250);

    menus.showStart();
    menus.next();
    menus.activate();
    performanceNow.mockReturnValue(600);
    menus.render();
    vi.mocked(arena.getContext).mockClear();
    menus.render();

    const context = vi.mocked(arena.getContext).mock.results[0]
      .value as CanvasRenderingContext2D;

    expect(context.scale).toHaveBeenCalledWith(2.5, 2.5);
    expect(context.rect).toHaveBeenCalledWith(
      expect.any(Number),
      expect.closeTo(-0.4),
      expect.any(Number),
      expect.any(Number)
    );
    expect(context.fillRect).toHaveBeenCalledWith(
      expect.any(Number),
      expect.closeTo(-0.4),
      2,
      expect.any(Number)
    );
  });

  it("scrolls overflowing zoomed menus with wheel input and scrollbar drag", () => {
    const performanceNow = vi.spyOn(performance, "now").mockReturnValue(600);
    const arena = createArena();
    const menus = new Menus(arena, { start: vi.fn() });
    userOptions.setOption("uiZoom", 250);
    const getThumbY = (context: CanvasRenderingContext2D): number => {
      const thumbCall = vi
        .mocked(context.fillRect)
        .mock.calls.find((call) => call[2] === 4);

      return Number(thumbCall?.[1]);
    };

    menus.showStart();
    menus.next();
    menus.activate();
    menus.render();

    let context = vi.mocked(arena.getContext).mock.results[0]
      .value as CanvasRenderingContext2D;
    const initialThumbY = getThumbY(context);

    vi.mocked(arena.getContext).mockClear();
    menus.handlePointer({ deltaY: 120, posX: 0, posY: 0, type: "wheel" });
    menus.render();

    context = vi.mocked(arena.getContext).mock.results[0]
      .value as CanvasRenderingContext2D;
    const wheelThumbY = getThumbY(context);

    expect(wheelThumbY).toBeGreaterThan(initialThumbY);

    vi.mocked(arena.getContext).mockClear();
    menus.handlePointer({ posX: 373, posY: wheelThumbY * 2.5, type: "press" });
    menus.handlePointer({ posX: 373, posY: (wheelThumbY + 20) * 2.5, type: "drag" });
    menus.render();

    context = vi.mocked(arena.getContext).mock.results[0]
      .value as CanvasRenderingContext2D;

    expect(getThumbY(context)).toBeGreaterThan(wheelThumbY);
  });

  it("scrolls overflowing menus with touch drag gestures", () => {
    const arena = createArena();
    const menus = new Menus(arena, { start: vi.fn() });
    userOptions.setOption("uiZoom", 250);
    const getThumbY = (context: CanvasRenderingContext2D): number => {
      const thumbCall = vi
        .mocked(context.fillRect)
        .mock.calls.find((call) => call[2] === 4);

      return Number(thumbCall?.[1]);
    };

    menus.showStart();
    menus.next();
    menus.activate();
    menus.render();

    let context = vi.mocked(arena.getContext).mock.results[0]
      .value as CanvasRenderingContext2D;
    const initialThumbY = getThumbY(context);

    vi.mocked(arena.getContext).mockClear();
    menus.handlePointer({ posX: 0, posY: 0, source: "touch", type: "press" });
    menus.handlePointer({ posX: 0, posY: -160, source: "touch", type: "drag" });
    menus.handlePointer({ posX: 0, posY: -160, source: "touch", type: "release" });
    menus.render();

    context = vi.mocked(arena.getContext).mock.results[0]
      .value as CanvasRenderingContext2D;

    expect(getThumbY(context)).toBeGreaterThan(initialThumbY);
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
    const scale = (272 / 828) * 0.72;

    expect(context.scale).toHaveBeenCalledWith(scale, scale);

    menus.handlePointer({
      posX: -9 * scale,
      posY: -14 * scale,
      type: "click",
    });

    expect(userOptions.masterVolume).toBe(9);
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

    performanceNow.mockReturnValue(250);
    menus.render();

    expect(arena.renderText).toHaveBeenCalledWith(
      "Options",
      0,
      expect.any(Number),
      expect.objectContaining({ align: "center" })
    );

    performanceNow.mockReturnValue(500);
    menus.render();

    expect(arena.renderText).toHaveBeenCalledWith(
      "Options",
      0,
      -200,
      expect.objectContaining({ align: "center" })
    );

    for (let i = 0; i < 10; i++) {
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

    performanceNow.mockReturnValue(1000);
    menus.render();

    expect(arena.renderText).toHaveBeenCalledWith(
      "Start",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );
    expect(arena.renderText).not.toHaveBeenCalledWith(
      "A.D. 1910",
      expect.any(Number),
      expect.any(Number),
      expect.anything()
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

  it("can replay the preroll from the debug menu", () => {
    const arena = createArena();
    const playPreroll = vi.fn();
    const menus = new Menus(arena, {
      playPreroll,
      start: vi.fn(),
    });

    menus.showStart();
    for (const keyCode of [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]) {
      menus.captureKey(keyCode);
    }

    menus.next();
    menus.next();
    menus.next();
    menus.activate();

    for (let i = 0; i < 8; i++) {
      menus.next();
    }

    menus.render();
    expect(arena.renderText).toHaveBeenCalledWith(
      "Play Preroll",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );

    menus.activate();

    expect(playPreroll).toHaveBeenCalledOnce();
  });

  it("unlocks the debug menu with touch Konami gestures", () => {
    const arena = createArena();
    const menus = new Menus(arena, { start: vi.fn() });
    const swipe = (deltaX: number, deltaY: number): void => {
      menus.handlePointer({ posX: 0, posY: 0, source: "touch", type: "press" });
      menus.handlePointer({
        posX: deltaX,
        posY: deltaY,
        source: "touch",
        type: "release",
      });
    };
    const tap = (): void => {
      menus.handlePointer({ posX: 120, posY: 0, source: "touch", type: "press" });
      menus.handlePointer({ posX: 120, posY: 0, source: "touch", type: "release" });
    };

    menus.showStart();
    swipe(0, -48);
    swipe(0, -48);
    swipe(0, 48);
    swipe(0, 48);
    swipe(-48, 0);
    swipe(48, 0);
    swipe(-48, 0);
    swipe(48, 0);
    tap();
    tap();
    menus.render();

    expect(userOptions.enableDebug).toBe(true);
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

    for (let i = 0; i < 3; i++) {
      menus.next();
    }

    menus.activate();
    expect(userOptions.debug.showHeadingVectors).toBe(true);
    expect(localStorage.getItem("timePilot.userOptions")).toContain(
      '"showHeadingVectors":true'
    );

    menus.next();
    menus.activate();
    expect(userOptions.debug.showSteeringArc).toBe(true);
    expect(localStorage.getItem("timePilot.userOptions")).toContain(
      '"showSteeringArc":true'
    );

    menus.next();
    menus.adjust(1);
    expect(userOptions.debugLives).toBe(4);
    expect(localStorage.getItem("timePilot.userOptions")).toContain(
      '"debugLives":4'
    );

    menus.next();
    menus.adjust(1);
    expect(userOptions.debugContinues).toBe(4);
    expect(localStorage.getItem("timePilot.userOptions")).toContain(
      '"debugContinues":4'
    );

    for (let i = 0; i < 4; i++) {
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

  it("opens level select as a submenu with enemy icons", () => {
    const arena = createArena();
    let selectedLevel = 1;
    const selectLevel = vi.fn((level: number) => {
      selectedLevel = level;
    });
    const clearLevelPreview = vi.fn();
    const previewLevel = vi.fn();
    const menus = new Menus(arena, {
      clearLevelPreview,
      getLevel: () => selectedLevel,
      previewLevel,
      selectLevel,
      start: vi.fn(),
    });

    menus.showStart();
    for (const keyCode of [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]) {
      menus.captureKey(keyCode);
    }

    menus.next();
    menus.next();
    menus.next();
    menus.activate();

    for (let i = 0; i < 7; i++) {
      menus.next();
    }

    const now = vi.spyOn(performance, "now").mockReturnValue(0);

    menus.activate();
    expect(previewLevel).toHaveBeenLastCalledWith(1);

    menus.render();
    now.mockReturnValue(140);
    menus.render();

    const contexts = vi
      .mocked(arena.getContext)
      .mock.results.map((result) => result.value as CanvasRenderingContext2D);
    const drawImageCalls = contexts.flatMap((context) =>
      vi.mocked(context.drawImage).mock.calls
    );

    expect(arena.renderText).toHaveBeenCalledWith(
      "Select Level",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "center" })
    );
    expect(arena.renderText).toHaveBeenCalledWith(
      "A.D 1910",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );
    expect(arena.renderText).toHaveBeenCalledWith(
      "The Dawn of Flight",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );
    expect(arena.renderText).toHaveBeenCalledWith(
      "Bullet",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "center" })
    );
    expect(arena.renderText).toHaveBeenCalledWith(
      "Bright open skies,",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );
    expect(
      contexts.some((context) => vi.mocked(context.drawImage).mock.calls.length > 0)
    ).toBe(true);
    expect(
      drawImageCalls.some(
        (call) => call[1] === 64 && call[2] === 0 && call[3] === 16 && call[4] === 16
      )
    ).toBe(true);
    expect(
      drawImageCalls.some(
        (call) => call[1] === 64 && call[2] === 16 && call[3] === 16 && call[4] === 16
      )
    ).toBe(true);
    expect(
      drawImageCalls.some(
        (call) => call[1] === 0 && call[2] === 16 && call[3] === 16 && call[4] === 16
      )
    ).toBe(true);
    expect(arena.renderText).not.toHaveBeenCalledWith(
      "Selected",
      expect.any(Number),
      expect.any(Number),
      expect.anything()
    );

    menus.next();
    expect(previewLevel).toHaveBeenLastCalledWith(1);
    menus.render();
    expect(arena.renderText).not.toHaveBeenCalledWith(
      "A.D 1940",
      -260,
      -54,
      expect.anything()
    );
    expect(selectLevel).not.toHaveBeenCalled();
    menus.activate();

    expect(clearLevelPreview).toHaveBeenCalled();
    expect(selectLevel).toHaveBeenCalledWith(2);
  });

  it("fades the level select menu backplate and restores it on escape", () => {
    const arena = createArena();
    const menus = new Menus(arena, {
      getLevel: () => 1,
      previewLevel: vi.fn(),
      selectLevel: vi.fn(),
      start: vi.fn(),
    });
    const now = vi.spyOn(performance, "now").mockReturnValue(0);

    menus.showStart();
    for (const keyCode of [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]) {
      menus.captureKey(keyCode);
    }

    menus.next();
    menus.next();
    menus.next();
    menus.activate();
    for (let i = 0; i < 7; i++) {
      menus.next();
    }
    menus.activate();

    vi.mocked(arena.getContext).mockClear();
    now.mockReturnValue(3900);
    menus.render();

    const fadedContexts = vi
      .mocked(arena.getContext)
      .mock.results.map((result) => result.value as CanvasRenderingContext2D);

    expect(
      fadedContexts.some((context) =>
        vi.mocked(context.fillRect).mock.calls.some(
          (call) => call[0] === -400 && call[1] === -300 && call[2] === 800 && call[3] === 600
        )
      )
    ).toBe(false);

    vi.mocked(arena.getContext).mockClear();
    now.mockReturnValue(3200);
    menus.captureKey(27);
    menus.render();

    const restoredContexts = vi
      .mocked(arena.getContext)
      .mock.results.map((result) => result.value as CanvasRenderingContext2D);

    expect(
      restoredContexts.some((context) =>
        vi.mocked(context.fillRect).mock.calls.some(
          (call) => call[0] === -400 && call[1] === -300 && call[2] === 800 && call[3] === 600
        )
      )
    ).toBe(true);
  });

  it("captures a replacement keyboard binding", () => {
    const menus = new Menus(createArena(), { start: vi.fn() });

    menus.showStart();
    menus.next();
    menus.activate();

    for (let i = 0; i < 9; i++) {
      menus.next();
    }

    menus.activate();
    menus.activate();
    expect(menus.captureKey(73)).toBe(true);
    expect(userOptions.keyboardBindings.up).toEqual([73]);
    expect(localStorage.getItem("timePilot.userOptions")).toContain('"up":[73]');
    expect(menus.captureKey(74)).toBe(false);
  });

  it("returns to options after selecting a language", () => {
    const arena = createArena();
    const menus = new Menus(arena, { start: vi.fn() });

    menus.showStart();
    menus.next();
    menus.activate();

    for (let i = 0; i < 8; i++) {
      menus.next();
    }

    menus.activate();
    menus.next();
    menus.activate();
    menus.render();

    expect(userOptions.language).toBe("fr");
    expect(arena.renderText).toHaveBeenCalledWith(
      "Options",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "center" })
    );
    expect(arena.renderText).toHaveBeenCalledWith(
      "Francais",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "right" })
    );
  });

  it("denies duplicate keyboard bindings with a warning", () => {
    const arena = createArena();
    const menus = new Menus(arena, { start: vi.fn() });

    menus.showStart();
    menus.next();
    menus.activate();

    for (let i = 0; i < 9; i++) {
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

  it("confirms grouped reset actions from the debug reset submenu", () => {
    const arena = createArena();
    const resetStoredData = vi.fn();
    const menus = new Menus(arena, {
      resetStoredData,
      start: vi.fn(),
    });

    menus.showStart();
    for (const keyCode of [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]) {
      menus.captureKey(keyCode);
    }

    menus.next();
    menus.next();
    menus.next();
    menus.activate();

    for (let i = 0; i < 9; i++) {
      menus.next();
    }

    menus.activate();
    menus.render();

    expect(arena.renderText).toHaveBeenCalledWith(
      "Reset Data",
      0,
      -200,
      expect.objectContaining({ align: "center" })
    );
    expect(arena.renderText).toHaveBeenCalledWith(
      "Reset Preferences",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );
    expect(arena.renderText).toHaveBeenCalledWith(
      "Reset Scores",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );
    expect(arena.renderText).toHaveBeenCalledWith(
      "Reset Achievements",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );
    expect(arena.renderText).toHaveBeenCalledWith(
      "Reset All Stored Data",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );

    menus.activate();
    menus.render();

    expect(arena.renderText).toHaveBeenCalledWith(
      "Confirm Reset?",
      0,
      -200,
      expect.objectContaining({ align: "center" })
    );
    expect(arena.renderText).toHaveBeenCalledWith(
      "preferences. This cannot be undone.",
      0,
      expect.any(Number),
      expect.objectContaining({ align: "center" })
    );
    expect(arena.renderText).toHaveBeenCalledWith(
      "Confirm Reset",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "left" })
    );

    menus.next();
    menus.activate();

    expect(resetStoredData).not.toHaveBeenCalled();

    menus.activate();
    menus.activate();

    expect(resetStoredData).toHaveBeenCalledOnce();
    expect(resetStoredData).toHaveBeenCalledWith("preferences");
  });
});
