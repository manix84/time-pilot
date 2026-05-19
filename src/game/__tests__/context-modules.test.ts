import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BonusFactory from "../bonus-factory";
import BulletFactory from "../bullet-factory";
import ControllerInterface from "../controller-interface";
import EnemyFactory from "../enemy-factory";
import Hud from "../hud";
import Player from "../player";
import PropFactory from "../prop-factory";
import { createRunStats } from "../run-stats";
import userOptions from "../user-options";
import type {
  BulletData,
  GameArenaInstance,
  GameDataStore,
  MenuSystemInstance,
  TickerInstance,
} from "../types";

const createArena = (): GameArenaInstance => {
  const context = document.createElement("canvas").getContext("2d")!;
  context.rotate = context.rotate ?? vi.fn();

  return {
    width: 800,
    height: 600,
    posX: 0,
    posY: 0,
    updatePosition: vi.fn(function (
      this: GameArenaInstance,
      posX: number,
      posY: number
    ) {
      this.posX = posX;
      this.posY = posY;
    }),
    resize: vi.fn(),
    getContext: vi.fn(() => context),
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
  };
};

const createTicker = (): TickerInstance => {
  let frame = 0;

  return {
    isRunning: true,
    start: vi.fn(function (this: TickerInstance) {
      this.isRunning = true;
    }),
    stop: vi.fn(function (this: TickerInstance, callback?: () => void) {
      this.isRunning = false;
      callback?.();
    }),
    addSchedule: vi.fn(() => 1),
    removeSchedule: vi.fn(() => true),
    clearSchedule: vi.fn(),
    clearTicks: vi.fn(() => {
      frame = 0;
      return true;
    }),
    getTicks: vi.fn(() => ++frame),
  };
};

const createContext = (): GameDataStore => {
  const context = {
    _level: 1,
    _formations: {},
    _levelProgress: {
      bossDefeated: false,
      bossKillThreshold: 56,
      bossSpawned: false,
      standardEnemyKills: 0,
    },
    _runStats: createRunStats(),
    _hasReachedHighScore: false,
    _nextParachuteScore: 1000,
    _controlInputState: {
      down: false,
      fire: false,
      left: false,
      menu: false,
      pause: false,
      restart: false,
      right: false,
      up: false,
      activeController: "keyboard",
    },
    _gameArena: createArena(),
    _renderTicker: createTicker(),
    _gameTicker: createTicker(),
    _currentController: [],
  } as unknown as GameDataStore;

  context._bullets = new BulletFactory(context);
  context._enemyBullets = new BulletFactory(context);
  context._player = new Player(context);
  context._enemies = new EnemyFactory(context);
  context._props = new PropFactory(context);
  context._bonuses = new BonusFactory(context);
  context._hud = new Hud(context);
  context._menus = {
    adjust: vi.fn(),
    adjustUiZoom: vi.fn(),
    resetUiZoom: vi.fn(),
    captureKey: vi.fn(() => false),
    getNavigationState: vi.fn(() => ({
      active: false,
      canGoBack: false,
      depth: 0,
      isPausedRoot: false,
      isRoot: false,
      isWatchingDemo: false,
    })),
    isActive: vi.fn(() => false),
    isWatchingDemo: vi.fn(() => false),
    showDemoWatch: vi.fn(),
    showGameOver: vi.fn(),
    showStart: vi.fn(),
    showRestartConfirm: vi.fn(),
    hide: vi.fn(),
    render: vi.fn(),
    next: vi.fn(),
    previous: vi.fn(),
    goBack: vi.fn(),
    goToRoot: vi.fn(),
    activate: vi.fn(),
    handlePointer: vi.fn(),
  } satisfies MenuSystemInstance;

  return context;
};

const getHudLifeIconCalls = (context: GameDataStore) =>
  vi
    .mocked(context._gameArena.renderSprite)
    .mock.calls.filter(([sprite]) =>
      (sprite as HTMLImageElement).src.includes("/sprites/player/player.png")
    );

const getHudTrophyCalls = (context: GameDataStore) =>
  vi
    .mocked(context._gameArena.renderSprite)
    .mock.calls.filter(([sprite]) =>
      (sprite as HTMLImageElement).src.includes(
        "/sprites/achievements/trophy_gold_32.png"
      )
    );

describe("context-backed game modules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    userOptions.setOption("enableDebug", false);
    userOptions.setOption("gameZoom", 100);
    userOptions.setDebugOption("showHeadingVectors", false);
    userOptions.setDebugOption("showHitboxes", true);
    userOptions.setDebugOption("showSteeringArc", false);
    userOptions.setOption("uiZoom", 100);
    localStorage.clear();
  });

  it("creates, moves, renders, and clears bullets", () => {
    const context = createContext();

    context._bullets.create(0, 0, 90, 4, 7, "#fff");
    expect(context._bullets.getCount()).toBe(1);
    expect(context._bullets.getData()).toHaveLength(1);

    context._bullets.reposition();
    context._bullets.render();
    context._bullets.clearAll();

    expect(context._bullets.getCount()).toBe(0);
  });

  it("renders enemy bullets as world-positioned circles", () => {
    const context = createContext();
    context._player.setData("posX", 10);
    context._player.setData("posY", 20);

    context._enemyBullets.create(
      30,
      50,
      180,
      6,
      5,
      "#FF9",
      false,
      "world",
      "circle"
    );
    context._enemyBullets.render();

    const canvasContext = context._gameArena.getContext() as CanvasRenderingContext2D;
    expect(canvasContext.arc).toHaveBeenCalledWith(20, 30, 3, 0, Math.PI * 2);
  });

  it("renders and steers homing rocket sprites", () => {
    const context = createContext();
    context._player.setData("posX", 0);
    context._player.setData("posY", 100);

    context._enemyBullets.create(
      0,
      0,
      90,
      8,
      11,
      "#FF9",
      false,
      "world",
      "sprite",
      {
        sprite: { src: "/sprites/enemies/projectiles/rocket.png" },
        width: 12,
        height: 9,
        frames: 16,
        renderWidth: 24,
        renderHeight: 18,
      },
      true,
      4
    );

    const [rocket] = context._enemyBullets.getEntities();

    context._enemyBullets.reposition();
    context._enemyBullets.render();

    const rocketData = rocket.getData() as BulletData;
    expect(rocketData.heading).toBe(94);
    expect(context._gameArena.renderSprite).toHaveBeenCalledWith(
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 9,
        frameWidth: 12,
        frameX: 0,
        renderHeight: 18,
        renderWidth: 24,
      })
    );
  });

  it("renders animated plasma projectile sprites", () => {
    const context = createContext();
    const now = vi.spyOn(performance, "now").mockReturnValue(360);

    context._enemyBullets.create(
      0,
      0,
      90,
      6,
      8.75,
      "#FF9",
      false,
      "world",
      "sprite",
      {
        sprite: { src: "/sprites/enemies/projectiles/plasma.png" },
        width: 8,
        height: 7,
        frames: 8,
        frameMode: "animation",
        renderWidth: 8,
        renderHeight: 7,
      }
    );

    context._enemyBullets.render();

    expect(context._gameArena.renderSprite).toHaveBeenCalledWith(
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 7,
        frameWidth: 8,
        frameX: 3,
        renderHeight: 7,
        renderWidth: 8,
      })
    );

    now.mockRestore();
  });

  it("renders projectile explosion sprites before cleanup", () => {
    const context = createContext();
    vi.mocked(context._gameTicker.getTicks)
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(104);

    context._enemyBullets.create(
      20,
      30,
      90,
      6,
      4.5,
      "#FF9",
      false,
      "world",
      "sprite",
      {
        sprite: { src: "/sprites/enemies/projectiles/bomb.png" },
        width: 16,
        height: 16,
        frames: 2,
        frameAxis: "y",
        frameMode: "animation",
        renderWidth: 16,
        renderHeight: 16,
      },
      false,
      0,
      true,
      {
        sprite: { src: "/sprites/enemies/projectiles/bomb_explosion.png" },
        width: 11,
        height: 11,
        frames: 4,
        frameLimiter: 4,
      }
    );

    const [bomb] = context._enemyBullets.getEntities();
    bomb.explode();
    bomb.render();

    expect(context._gameArena.renderSprite).toHaveBeenCalledWith(
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 11,
        frameWidth: 11,
        frameX: 1,
      })
    );
    expect(bomb.removeMe).toBe(false);
  });

  it("moves and renders the player", () => {
    const context = createContext();

    context._player.startShooting();
    context._player.reposition();
    context._player.rotate();
    context._player.shoot();
    context._player.render();

    expect(context._gameArena.updatePosition).toHaveBeenCalled();
    expect(context._gameArena.renderSprite).toHaveBeenCalledWith(
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 16,
        frameWidth: 16,
        frameX: 0,
      })
    );
    expect(context._bullets.getCount()).toBe(1);
  });

  it("maps the 32-frame player sprite strip around the full circle", () => {
    const context = createContext();

    context._player.setData("heading", 90);
    context._player.render();
    context._player.setData("heading", 180);
    context._player.render();
    context._player.setData("heading", 270);
    context._player.render();
    context._player.setData("heading", 0);
    context._player.render();
    context._player.setData("heading", 315);
    context._player.render();

    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      1,
      expect.any(HTMLImageElement),
      expect.objectContaining({ frameX: 0, frameY: 0, flipY: false })
    );
    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      2,
      expect.any(HTMLImageElement),
      expect.objectContaining({ frameX: 8, frameY: 0, flipY: false })
    );
    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      3,
      expect.any(HTMLImageElement),
      expect.objectContaining({ frameX: 16, frameY: 0, flipY: false })
    );
    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      4,
      expect.any(HTMLImageElement),
      expect.objectContaining({ frameX: 24, frameY: 0, flipY: false })
    );
    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      5,
      expect.any(HTMLImageElement),
      expect.objectContaining({ frameX: 20, frameY: 0, flipY: false })
    );
  });

  it("spends a life and respawns the player at level start after death", () => {
    const context = createContext();
    const handleRespawn = vi.fn();
    vi.mocked(context._gameTicker.getTicks).mockReturnValue(10);
    context._player.setRespawnCallback?.(handleRespawn);
    context._player.setData("score", 1200);
    context._player.setData("posX", 50);
    context._player.setData("posY", -30);
    context._enemyBullets.create(10, 20, 180, 6, 5, "#FF9", false, "world");

    context._player.kill();

    expect(context._player.getData("lives")).toBe(2);
    expect(context._player.getData("isAlive")).toBe(false);
    expect(context._player.getData("score")).toBe(1200);

    vi.mocked(context._gameTicker.getTicks).mockReturnValue(50);
    context._player.render();

    expect(context._player.getData("isAlive")).toBe(true);
    expect(context._player.getData("deathTick")).toBe(false);
    expect(context._player.getData("score")).toBe(1200);
    expect(context._player.getData("posX")).toBe(0);
    expect(context._player.getData("posY")).toBe(0);
    expect(context._enemyBullets.getCount()).toBe(0);
    expect(context._gameArena.updatePosition).toHaveBeenCalledWith(0, 0);
    expect(handleRespawn).toHaveBeenCalledTimes(1);
  });

  it("allows the demo player to die even when debug invincibility is enabled", () => {
    const context = createContext();
    context._isDemoMode = true;
    userOptions.setOption("enableDebug", true);
    userOptions.setDebugOption("invincible", true);
    context._player.setData("lives", 3);

    context._player.kill();

    expect(context._player.getData("lives")).toBe(2);
    expect(context._player.getData("isAlive")).toBe(false);
  });

  it("steers slower enemies toward a trailing point behind the player", () => {
    const context = createContext();
    vi.mocked(context._gameTicker.getTicks).mockReturnValue(32);
    context._player.setData("heading", 90);
    context._enemies.create(0, -100, 180);
    const enemy = context._enemies.getEntities()[0];

    enemy.setData("tickOffset", 0);
    enemy.reposition();

    expect(enemy.getData("heading")).toBe(202.5);
  });

  it("leaves final-life game over messaging to the menu system", () => {
    const context = createContext();
    context._player.setData("lives", 1);

    context._player.kill();
    context._hud.render();

    expect(context._gameArena.renderText).not.toHaveBeenCalledWith(
      "Game Over",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
  });

  it("awards extra lives at 10000 and every 50000 points after", () => {
    Object.defineProperty(HTMLMediaElement.prototype, "canPlay", {
      configurable: true,
      value: true,
    });
    const play = vi.mocked(HTMLMediaElement.prototype.play);
    const context = createContext();

    play.mockClear();
    context._player.setData("score", 9999);

    expect(context._player.getData("lives")).toBe(3);
    expect(context._player.getData("nextExtraLifeScore")).toBe(10000);
    expect(play).not.toHaveBeenCalled();

    context._player.setData("score", 10000);

    expect(context._player.getData("lives")).toBe(4);
    expect(context._player.getData("nextExtraLifeScore")).toBe(60000);
    expect(play).toHaveBeenCalledTimes(1);

    play.mockClear();
    context._player.setData("score", 110000);

    expect(context._player.getData("lives")).toBe(6);
    expect(context._player.getData("nextExtraLifeScore")).toBe(160000);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("compacts the HUD life icons at nine lives", () => {
    const context = createContext();

    context._player.setData("lives", 9);
    context._hud.render();

    expect(getHudLifeIconCalls(context)).toHaveLength(1);
    expect(context._gameArena.renderText).toHaveBeenCalledWith(
      "9 x",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "right" })
    );
  });

  it("renders individual HUD life icons below nine lives", () => {
    const context = createContext();

    context._player.setData("lives", 8);
    context._hud.render();

    expect(getHudLifeIconCalls(context)).toHaveLength(8);
    expect(context._gameArena.renderText).not.toHaveBeenCalledWith(
      "8 x",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
  });

  it("renders a trophy next to the score after reaching the highest score", () => {
    const context = createContext();

    context._hasReachedHighScore = true;
    context._hud.render();

    expect(getHudTrophyCalls(context)).toHaveLength(1);
    expect(context._gameArena.renderText).toHaveBeenCalledWith(
      0,
      -348,
      -290,
      expect.objectContaining({ size: 30 })
    );
  });

  it("renders HUD with current player data after reset", () => {
    const context = createContext();
    userOptions.setOption("enableDebug", true);
    userOptions.setDebugOption("showPlayerCoordinates", true);

    context._player.setData("score", 300);
    context._player.setData("posX", 12);
    context._player.setData("posY", 34);
    context._player.setData("heading", 180);
    context._player.setData("score", 300, true);
    context._player.setData("posX", 12, true);
    context._player.setData("posY", 34, true);
    context._player.setData("heading", 180, true);
    context._player.resetData();

    context._hud.render();

    expect(getHudLifeIconCalls(context)).toHaveLength(3);
    expect(context._gameArena.renderSprite).toHaveBeenCalledWith(
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 16,
        frameWidth: 16,
        frameX: 0,
        renderHeight: 32,
        renderWidth: 32,
      })
    );
    expect(context._gameArena.renderText).toHaveBeenCalledWith(
      300,
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
    expect(context._gameArena.renderText).toHaveBeenCalledWith(
      "12.00 x 34.00",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
    expect(context._gameArena.renderText).toHaveBeenCalledWith(
      "180°",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
  });

  it("renders remaining credits in the mirrored bottom HUD position", () => {
    const context = createContext();

    context._player.setData("continues", 1);
    context._hud.render();

    expect(context._gameArena.renderText).toHaveBeenCalledWith(
      "Credits 01",
      394,
      279,
      expect.objectContaining({
        align: "right",
        valign: "middle",
      })
    );
  });

  it("localizes the HUD credits label", () => {
    const context = createContext();
    userOptions.setOption("language", "es");

    context._player.setData("continues", Infinity);
    context._hud.render();

    expect(context._gameArena.renderText).toHaveBeenCalledWith(
      "Creditos ∞",
      394,
      279,
      expect.objectContaining({ align: "right" })
    );
  });

  it("renders boss progress ships clipped to the current kill progress", () => {
    const context = createContext();
    const canvasContext = context._gameArena.getContext() as CanvasRenderingContext2D;
    const drawImage = vi.spyOn(canvasContext, "drawImage");
    const rect = vi.spyOn(canvasContext, "rect");

    context._levelProgress.standardEnemyKills = 28;
    context._hud.render();

    expect(drawImage).toHaveBeenCalledTimes(20);
    expect(drawImage).toHaveBeenCalledWith(
      expect.any(Image),
      64,
      20,
      16,
      8,
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number)
    );
    expect(rect).toHaveBeenCalledWith(-394, 262, 150, 34);
  });

  it("fills boss progress at the threshold and hides it once the boss is spawned", () => {
    const context = createContext();
    const canvasContext = context._gameArena.getContext() as CanvasRenderingContext2D;
    const drawImage = vi.spyOn(canvasContext, "drawImage");
    const rect = vi.spyOn(canvasContext, "rect");

    context._levelProgress.standardEnemyKills = 56;
    context._hud.render();

    expect(drawImage).toHaveBeenCalledTimes(20);
    expect(rect).toHaveBeenCalledWith(-394, 262, 300, 34);

    drawImage.mockClear();
    rect.mockClear();
    context._levelProgress.bossSpawned = true;
    context._hud.render();

    expect(drawImage).not.toHaveBeenCalled();
    expect(rect).not.toHaveBeenCalledWith(-394, 262, expect.any(Number), 34);
  });

  it("hides boss progress after the boss is defeated", () => {
    const context = createContext();
    const canvasContext = context._gameArena.getContext() as CanvasRenderingContext2D;
    const drawImage = vi.spyOn(canvasContext, "drawImage");

    context._levelProgress.standardEnemyKills = 56;
    context._levelProgress.bossDefeated = true;
    context._hud.render();

    expect(drawImage).not.toHaveBeenCalled();
  });

  it("creates, exposes, renders, and clears enemies, props, and bonuses", () => {
    const context = createContext();

    context._enemies.create(100, 100, 180);
    context._props.create(50, 50);
    context._bonuses.create(75, 75);

    expect(context._enemies.getCount()).toBe(1);
    expect(context._props.getCount()).toBe(1);
    expect(context._bonuses.getCount()).toBe(1);
    expect(context._enemies.getEntities()).toHaveLength(1);
    expect(context._bonuses.getEntities()).toHaveLength(1);

    context._enemies.reposition();
    context._props.reposition();
    context._bonuses.reposition();
    context._enemies.render();
    context._props.render();
    context._bonuses.render();
    context._enemies.clearAll();
    context._props.clearAll();
    context._bonuses.clearAll();

    expect(context._enemies.getCount()).toBe(0);
    expect(context._props.getCount()).toBe(0);
    expect(context._bonuses.getCount()).toBe(0);
  });

  it("renders refreshed cloud props at pixel-doubled dimensions", () => {
    const context = createContext();
    vi.spyOn(Math, "random").mockReturnValue(0);

    context._props.create(50, 50);
    context._props.render();

    expect(context._gameArena.renderSprite).toHaveBeenCalledWith(
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 9,
        frameWidth: 16,
        renderHeight: 18,
        renderWidth: 32,
      })
    );
  });

  it("renders the largest cloud as a fly-through overlay only for clouds", () => {
    const context = createContext();
    vi.spyOn(Math, "random").mockReturnValue(0.8);

    context._props.create(50, 50);
    context._props.render(2, { flyThroughOnly: true, opacity: 0.5 });

    expect(context._gameArena.renderSprite).toHaveBeenCalledWith(
      expect.objectContaining({
        src: expect.stringContaining("cloud3.png"),
      }),
      expect.objectContaining({
        frameHeight: 16,
        frameWidth: 46,
        renderHeight: 32,
        renderWidth: 92,
      })
    );

    vi.mocked(context._gameArena.renderSprite).mockClear();

    context._level = 5;
    context._props.clearAll();
    context._props.create(50, 50);
    context._props.render(2, { flyThroughOnly: true, opacity: 0.5 });

    expect(context._gameArena.renderSprite).not.toHaveBeenCalled();
  });

  it("renders level 5 props as asteroids", () => {
    const context = createContext();
    context._level = 5;
    vi.spyOn(Math, "random").mockReturnValue(0);

    context._props.create(50, 50);
    context._props.render();

    const [propData] = context._props.getData();

    expect(propData.level).toBe(5);
    expect(context._gameArena.renderSprite).toHaveBeenCalledWith(
      expect.objectContaining({
        src: expect.stringContaining("asteroid1.png"),
      }),
      expect.objectContaining({
        frameHeight: 12,
        frameWidth: 14,
        renderHeight: 24,
        renderWidth: 28,
      })
    );
  });

  it("awards parachute bonuses in 1000 point steps capped at 5000", () => {
    const context = createContext();

    for (let i = 0; i < 6; i++) {
      vi.mocked(context._gameTicker.getTicks).mockReturnValue(i * 100);
      context._bonuses.create(0, 0);
      const [bonus] = context._bonuses.getEntities();
      bonus.collect();
      vi.mocked(context._gameTicker.getTicks).mockReturnValue(i * 100 + 61);
      bonus.reposition();
      context._bonuses.cleanup();
    }

    expect(context._player.getData("score")).toBe(20000);
    expect(context._nextParachuteScore).toBe(5000);
  });

  it("renders the refreshed parachute as a four-frame swing", () => {
    const context = createContext();

    context._bonuses.create(40, 60);
    const [bonus] = context._bonuses.getEntities();

    vi.mocked(context._gameTicker.getTicks).mockReturnValue(24);
    bonus.render();
    vi.mocked(context._gameTicker.getTicks).mockReturnValue(40);
    bonus.render();

    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      1,
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 16,
        frameWidth: 16,
        frameX: 3,
        frameY: 0,
        renderHeight: 32,
        renderWidth: 32,
      })
    );
    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      2,
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 16,
        frameWidth: 16,
        frameX: 2,
        frameY: 0,
        renderHeight: 32,
        renderWidth: 32,
      })
    );
  });

  it("renders collected parachute score at the pickup position before cleanup", () => {
    const context = createContext();

    vi.mocked(context._gameTicker.getTicks).mockReturnValue(10);
    context._bonuses.create(40, 60);
    const [bonus] = context._bonuses.getEntities();

    bonus.collect();
    bonus.render();

    expect(context._gameArena.renderText).toHaveBeenCalledWith(
      1000,
      40,
      60,
      expect.objectContaining({
        align: "center",
        color: "#FFF",
        valign: "middle",
      })
    );
    expect(bonus.detectCollision(40, 60, 8)).toBe(false);

    vi.mocked(context._gameTicker.getTicks).mockReturnValue(71);
    bonus.reposition();
    context._bonuses.cleanup();

    expect(context._bonuses.getCount()).toBe(0);
  });

  it("awards regular enemy score only once per enemy kill", () => {
    const context = createContext();

    context._enemies.create(100, 100, 180);
    const [enemy] = context._enemies.getEntities();

    enemy.kill();
    enemy.kill();

    expect(context._player.getData("score")).toBe(100);
    expect(context._levelProgress.standardEnemyKills).toBe(1);
  });

  it("tracks boss progress from standard enemies and defeats bosses after seven hits", () => {
    const context = createContext();

    context._enemies.create(100, 100, 180);
    const [enemy] = context._enemies.getEntities();

    enemy.kill();

    expect(context._levelProgress.standardEnemyKills).toBe(1);

    context._enemies.create(200, 100, 180, { type: "boss" });
    const boss = context._enemies.getEntities()[1];

    for (let i = 0; i < 6; i++) {
      boss.kill();
    }

    expect(boss.isAlive).toBe(true);
    expect(context._player.getData("score")).toBe(100);
    expect(context._levelProgress.bossDefeated).toBe(false);

    boss.kill();

    expect(boss.isAlive).toBe(false);
    expect(context._player.getData("score")).toBe(3100);
    expect(context._levelProgress.bossDefeated).toBe(true);
    expect(context._levelProgress.standardEnemyKills).toBe(1);
  });

  it("renders boss damage and facing frames from the damage sheet", () => {
    const context = createContext();

    context._enemies.create(200, 100, 90, { type: "boss" });
    const [boss] = context._enemies.getEntities();

    boss.render();
    boss.kill();
    boss.kill();
    boss.render();
    boss.setData("heading", 270);
    boss.kill();
    boss.kill();
    boss.render();

    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      1,
      expect.any(HTMLImageElement),
      expect.objectContaining({ frameX: 0 })
    );
    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      2,
      expect.any(HTMLImageElement),
      expect.objectContaining({ frameX: 1 })
    );
    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      3,
      expect.any(HTMLImageElement),
      expect.objectContaining({ frameX: 6 })
    );
  });

  it("renders level 1 biplane rotor animation rows without changing orientation", () => {
    const context = createContext();

    context._enemies.create(100, 100, 180);
    const [enemy] = context._enemies.getEntities();

    vi.mocked(context._gameTicker.getTicks).mockReturnValue(9);
    enemy.render();
    vi.mocked(context._gameTicker.getTicks).mockReturnValue(10);
    enemy.render();

    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      1,
      expect.any(HTMLImageElement),
      expect.objectContaining({ frameX: 8, frameY: 0 })
    );
    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      2,
      expect.any(HTMLImageElement),
      expect.objectContaining({ frameX: 8, frameY: 1 })
    );
  });

  it("renders the level 1 biplane flash row before the explosion sheet", () => {
    const context = createContext();

    vi.mocked(context._gameTicker.getTicks).mockReturnValue(100);
    context._enemies.create(100, 100, 180);
    const [enemy] = context._enemies.getEntities();

    enemy.kill();
    vi.mocked(context._gameTicker.getTicks).mockReturnValue(103);
    enemy.render();
    vi.mocked(context._gameTicker.getTicks).mockReturnValue(106);
    enemy.render();

    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      1,
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 16,
        frameWidth: 16,
        frameX: 8,
        frameY: 2,
        renderHeight: 32,
        renderWidth: 32,
      })
    );
    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      2,
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 16,
        frameWidth: 16,
        frameX: 0,
        frameY: 0,
      })
    );
  });

  it("renders level 2 fighters with their offset directional animation rows", () => {
    const context = createContext();
    context._level = 2;

    context._enemies.create(100, 100, 90);
    const [enemy] = context._enemies.getEntities();

    vi.mocked(context._gameTicker.getTicks).mockReturnValue(9);
    enemy.render();
    vi.mocked(context._gameTicker.getTicks).mockReturnValue(10);
    enemy.render();
    enemy.setData("heading", 0);
    enemy.render();

    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      1,
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 16,
        frameWidth: 16,
        frameX: 0,
        frameY: 0,
        renderHeight: 32,
        renderWidth: 32,
      })
    );
    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      2,
      expect.any(HTMLImageElement),
      expect.objectContaining({ frameX: 0, frameY: 1 })
    );
    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      3,
      expect.any(HTMLImageElement),
      expect.objectContaining({ frameX: 12, frameY: 1 })
    );
  });

  it("renders the level 2 fighter flash row before the explosion sheet", () => {
    const context = createContext();
    context._level = 2;

    vi.mocked(context._gameTicker.getTicks).mockReturnValue(100);
    context._enemies.create(100, 100, 180);
    const [enemy] = context._enemies.getEntities();

    enemy.kill();
    vi.mocked(context._gameTicker.getTicks).mockReturnValue(103);
    enemy.render();
    vi.mocked(context._gameTicker.getTicks).mockReturnValue(106);
    enemy.render();

    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      1,
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 16,
        frameWidth: 16,
        frameX: 4,
        frameY: 2,
        renderHeight: 32,
        renderWidth: 32,
      })
    );
    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      2,
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 16,
        frameWidth: 16,
        frameX: 0,
        frameY: 0,
      })
    );
  });

  it("renders level 3 helicopters with horizontal direction frames and animation rows", () => {
    const context = createContext();
    context._level = 3;

    context._enemies.create(100, 100, 90);
    const [enemy] = context._enemies.getEntities();

    vi.mocked(context._gameTicker.getTicks).mockReturnValue(9);
    enemy.render();
    enemy.setData("heading", 0);
    vi.mocked(context._gameTicker.getTicks).mockReturnValue(10);
    enemy.render();
    enemy.setData("heading", 270);
    vi.mocked(context._gameTicker.getTicks).mockReturnValue(19);
    enemy.render();

    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      1,
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 16,
        frameWidth: 16,
        frameX: 0,
        frameY: 0,
        renderHeight: 32,
        renderWidth: 32,
      })
    );
    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      2,
      expect.any(HTMLImageElement),
      expect.objectContaining({ frameX: 4, frameY: 1 })
    );
    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      3,
      expect.any(HTMLImageElement),
      expect.objectContaining({ frameX: 8, frameY: 1 })
    );
  });

  it("renders the level 3 helicopter flash row before the explosion sheet", () => {
    const context = createContext();
    context._level = 3;

    vi.mocked(context._gameTicker.getTicks).mockReturnValue(100);
    context._enemies.create(100, 100, 270);
    const [enemy] = context._enemies.getEntities();

    enemy.kill();
    vi.mocked(context._gameTicker.getTicks).mockReturnValue(103);
    enemy.render();

    expect(context._gameArena.renderSprite).toHaveBeenCalledWith(
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 16,
        frameWidth: 16,
        frameX: 8,
        frameY: 2,
        renderHeight: 32,
        renderWidth: 32,
      })
    );
  });

  it("renders level 4 basic enemies with offset directional animation rows", () => {
    const context = createContext();
    context._level = 4;

    context._enemies.create(100, 100, 90);
    const [enemy] = context._enemies.getEntities();

    vi.mocked(context._gameTicker.getTicks).mockReturnValue(9);
    enemy.render();
    vi.mocked(context._gameTicker.getTicks).mockReturnValue(10);
    enemy.render();
    enemy.setData("heading", 0);
    enemy.render();

    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      1,
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 16,
        frameWidth: 16,
        frameX: 0,
        frameY: 0,
        renderHeight: 32,
        renderWidth: 32,
      })
    );
    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      2,
      expect.any(HTMLImageElement),
      expect.objectContaining({ frameX: 0, frameY: 1 })
    );
    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      3,
      expect.any(HTMLImageElement),
      expect.objectContaining({ frameX: 12, frameY: 1 })
    );
  });

  it("renders the level 4 basic enemy flash row before the explosion sheet", () => {
    const context = createContext();
    context._level = 4;

    vi.mocked(context._gameTicker.getTicks).mockReturnValue(100);
    context._enemies.create(100, 100, 180);
    const [enemy] = context._enemies.getEntities();

    enemy.kill();
    vi.mocked(context._gameTicker.getTicks).mockReturnValue(103);
    enemy.render();

    expect(context._gameArena.renderSprite).toHaveBeenCalledWith(
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 16,
        frameWidth: 16,
        frameX: 4,
        frameY: 2,
        renderHeight: 32,
        renderWidth: 32,
      })
    );
  });

  it("renders level 5 basic enemies as four animation frames without rotation", () => {
    const context = createContext();
    context._level = 5;

    context._enemies.create(100, 100, 180);
    const [enemy] = context._enemies.getEntities();

    vi.mocked(context._gameTicker.getTicks).mockReturnValue(30);
    enemy.render();

    expect(context._gameArena.renderSprite).toHaveBeenCalledWith(
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 16,
        frameWidth: 16,
        frameX: 3,
        frameY: 0,
        renderHeight: 32,
        renderWidth: 32,
      })
    );
  });

  it("renders the level 5 basic enemy flash row before the explosion sheet", () => {
    const context = createContext();
    context._level = 5;

    vi.mocked(context._gameTicker.getTicks).mockReturnValue(100);
    context._enemies.create(100, 100, 180);
    const [enemy] = context._enemies.getEntities();

    enemy.kill();
    vi.mocked(context._gameTicker.getTicks).mockReturnValue(103);
    enemy.render();

    expect(context._gameArena.renderSprite).toHaveBeenCalledWith(
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 16,
        frameWidth: 16,
        frameX: 2,
        frameY: 1,
        renderHeight: 32,
        renderWidth: 32,
      })
    );
  });

  it("awards the 1940 special bomber after three hits without boss progress", () => {
    const context = createContext();
    context._level = 2;

    context._enemies.create(100, 100, 90, { type: "specialBomber" });
    const [bomber] = context._enemies.getEntities();

    bomber.kill();
    bomber.kill();

    expect(bomber.isAlive).toBe(true);
    expect(context._player.getData("score")).toBe(0);
    expect(context._levelProgress.standardEnemyKills).toBe(0);

    bomber.kill();

    expect(bomber.isAlive).toBe(false);
    expect(context._player.getData("score")).toBe(1500);
    expect(context._levelProgress.standardEnemyKills).toBe(0);
    expect(context._levelProgress.bossDefeated).toBe(false);
  });

  it("renders the 1940 special bomber damage and death-flash rows", () => {
    const context = createContext();
    context._level = 2;
    vi.mocked(context._gameTicker.getTicks).mockReturnValue(100);

    context._enemies.create(100, 100, 90, { type: "specialBomber" });
    const [bomber] = context._enemies.getEntities();

    bomber.kill();
    bomber.render();

    expect(context._gameArena.renderSprite).toHaveBeenLastCalledWith(
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 16,
        frameWidth: 32,
        frameX: 1,
        frameY: 0,
        renderHeight: 32,
        renderWidth: 64,
      })
    );

    vi.mocked(context._gameTicker.getTicks).mockReturnValue(110);
    bomber.render();

    expect(context._gameArena.renderSprite).toHaveBeenLastCalledWith(
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 16,
        frameWidth: 32,
        frameX: 1,
        frameY: 1,
        renderHeight: 32,
        renderWidth: 64,
      })
    );

    bomber.kill();
    bomber.kill();
    bomber.render();

    expect(context._gameArena.renderSprite).toHaveBeenLastCalledWith(
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 16,
        frameWidth: 32,
        frameX: 3,
        frameY: 2,
        renderHeight: 32,
        renderWidth: 64,
      })
    );
  });

  it("uses the left-facing special bomber damage frames for leftward travel", () => {
    const context = createContext();
    context._level = 2;
    vi.mocked(context._gameTicker.getTicks).mockReturnValue(100);

    context._enemies.create(100, 100, 270, { type: "specialBomber" });
    const [bomber] = context._enemies.getEntities();

    bomber.kill();
    bomber.render();

    expect(context._gameArena.renderSprite).toHaveBeenLastCalledWith(
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 16,
        frameWidth: 32,
        frameX: 5,
        frameY: 0,
        renderHeight: 32,
        renderWidth: 64,
      })
    );

    bomber.kill();
    bomber.kill();
    bomber.render();

    expect(context._gameArena.renderSprite).toHaveBeenLastCalledWith(
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 16,
        frameWidth: 32,
        frameX: 7,
        frameY: 2,
        renderHeight: 32,
        renderWidth: 64,
      })
    );
  });

  it("awards the formation bonus when every formation enemy is killed", () => {
    const context = createContext();
    context._formations["formation-1"] = {
      awarded: false,
      escaped: false,
      remaining: 2,
      total: 2,
    };

    context._enemies.create(100, 100, 180, { formationId: "formation-1" });
    context._enemies.create(130, 100, 180, { formationId: "formation-1" });

    context._enemies.getEntities().forEach((enemy) => enemy.kill());

    expect(context._player.getData("score")).toBe(2200);
    expect(context._formations["formation-1"].awarded).toBe(true);
  });

  it("does not award the formation bonus after a formation enemy escapes", () => {
    const context = createContext();
    context._formations["formation-1"] = {
      awarded: false,
      escaped: false,
      remaining: 2,
      total: 2,
    };

    context._enemies.create(100, 100, 180, { formationId: "formation-1" });
    context._enemies.create(130, 100, 180, { formationId: "formation-1" });
    context._formations["formation-1"].escaped = true;

    context._enemies.getEntities().forEach((enemy) => enemy.kill());

    expect(context._player.getData("score")).toBe(200);
    expect(context._formations["formation-1"].awarded).toBe(false);
  });

  it("renders hitboxes for every active damage collision participant", () => {
    const context = createContext();
    userOptions.setOption("enableDebug", true);
    userOptions.setDebugOption("showHitboxes", true);

    context._bullets.create(0, 0, 90, 4, 7, "#fff");
    context._enemies.create(100, 100, 180);
    context._bonuses.create(80, 80);
    context._player.render();
    context._bullets.render();
    context._enemies.render();
    context._bonuses.render();

    expect(context._gameArena.drawCircle).toHaveBeenCalledWith(0, 0, 16, {
      borderColor: expect.stringMatching(/^#[0-9a-f]{6}$/),
    });
    expect(context._gameArena.drawCircle).toHaveBeenCalledWith(0, 0, 4, {
      borderColor: "#0F0",
    });
    expect(context._gameArena.drawCircle).toHaveBeenCalledWith(100, 100, 8, {
      borderColor: "#F00",
    });
    expect(context._gameArena.drawCircle).toHaveBeenCalledWith(80, 80, 8, {
      borderColor: "#0FF",
    });
  });

  it("renders heading and steering vectors for intentional moving entities only", () => {
    const context = createContext();
    const canvasContext = context._gameArena.getContext() as CanvasRenderingContext2D;
    userOptions.setOption("enableDebug", true);
    userOptions.setDebugOption("showHeadingVectors", true);
    userOptions.setDebugOption("showSteeringArc", true);
    context._player.setData("heading", 90);
    context._player.setData("newHeading", 0);

    context._bullets.create(0, 0, 90, 4, 7, "#fff");
    context._enemies.create(100, 100, 180);
    context._bonuses.create(80, 80);
    context._enemies.reposition();

    context._player.render();
    context._bullets.render();
    context._enemies.render();
    const lineCountBeforeBonus = vi.mocked(canvasContext.lineTo).mock.calls.length;
    context._bonuses.render();

    expect(vi.mocked(canvasContext.lineTo).mock.calls).toEqual(
      expect.arrayContaining([
        [expect.closeTo(38), expect.closeTo(0)],
        [expect.closeTo(0), expect.closeTo(-38)],
      ])
    );
    expect(canvasContext.fill).toHaveBeenCalled();
    expect(canvasContext.stroke).toHaveBeenCalled();
    expect(vi.mocked(canvasContext.lineTo).mock.calls.length).toBe(
      lineCountBeforeBonus
    );
  });

  it("renders HUD and delegates controller commands", () => {
    const context = createContext();
    const restart = vi.fn();
    const pause = vi.fn();
    const controls = new ControllerInterface(context, { restart, pause });

    controls.rotateToHeading(270);
    controls.startShooting();
    controls.stopShooting();
    controls.toggleFullScreen();
    controls.openMenu();
    controls.togglePause();
    controls.restart();
    context._hud.render();
    context._hud.restart();

    expect(context._player.getData().newHeading).toBe(270);
    expect(context._gameArena.toggleFullScreen).toHaveBeenCalled();
    expect(context._menus.showStart).toHaveBeenCalled();
    expect(pause).toHaveBeenCalled();
    expect(restart).toHaveBeenCalled();
    expect(context._gameArena.renderText).toHaveBeenCalled();
  });

  it("opens restart confirmation for alive players and skips it when dead", () => {
    const context = createContext();
    const restart = vi.fn();
    const openMenu = vi.fn(() => {
      vi.mocked(context._menus.isActive).mockReturnValue(true);
    });
    const controls = new ControllerInterface(context, { restart, openMenu });

    controls.requestRestartConfirmation();

    expect(openMenu).toHaveBeenCalled();
    expect(context._menus.showRestartConfirm).toHaveBeenCalled();
    expect(restart).not.toHaveBeenCalled();

    vi.mocked(context._menus.showRestartConfirm).mockClear();
    vi.mocked(context._menus.isActive).mockReturnValue(false);
    context._player.setData("isAlive", false);

    controls.requestRestartConfirmation();

    expect(restart).toHaveBeenCalled();
    expect(context._menus.showRestartConfirm).not.toHaveBeenCalled();
  });

  it("renders only the active controller overlay", () => {
    const context = createContext();
    userOptions.setDebugOption("showControlsOverlay", true);

    context._controlInputState.activeController = "keyboard";
    context._hud.render();

    expect(context._gameArena.renderText).toHaveBeenCalledWith(
      "Space",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "center" })
    );
    expect(context._gameArena.renderText).not.toHaveBeenCalledWith(
      "Menu",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );

    vi.mocked(context._gameArena.renderText).mockClear();
    context._controlInputState.activeController = "gamepad";
    context._hud.render();

    expect(context._gameArena.renderText).toHaveBeenCalledWith(
      "Menu",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "center" })
    );
    expect(context._gameArena.renderText).not.toHaveBeenCalledWith(
      "Space",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );

    vi.mocked(context._gameArena.renderText).mockClear();
    context._controlInputState.activeController = "touch";
    context._controlInputState.fire = true;
    context._hud.render();

    expect(context._gameArena.renderText).toHaveBeenCalledWith(
      "FIRE",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "center" })
    );
    expect(context._gameArena.renderText).not.toHaveBeenCalledWith(
      "Space",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
    expect(context._gameArena.renderText).not.toHaveBeenCalledWith(
      "Menu",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
  });

  it("renders the live touch steering guide only during gameplay", () => {
    const context = createContext();

    context._controlInputState.activeController = "touch";
    context._controlInputState.fire = true;
    context._controlInputState.touchOrigin = { posX: 120, posY: 80 };
    context._controlInputState.touchCurrent = { posX: 170, posY: 40 };
    context._hud.render();

    expect(context._gameArena.renderText).toHaveBeenCalledWith(
      "FIRE",
      170,
      40,
      expect.objectContaining({ align: "center" })
    );

    vi.mocked(context._gameArena.renderText).mockClear();
    vi.mocked(context._menus.isActive).mockReturnValue(true);
    context._hud.render();

    expect(context._gameArena.renderText).not.toHaveBeenCalledWith(
      "FIRE",
      170,
      40,
      expect.anything()
    );
  });

  it("routes controller actions to the active menu", () => {
    const context = createContext();
    vi.mocked(context._menus.isActive).mockReturnValue(true);
    const controls = new ControllerInterface(context, {});

    controls.rotateToHeading(90);
    controls.rotateToHeading(270);
    controls.rotateClockwise();
    controls.rotateAntiClockwise();
    controls.startShooting();
    controls.openMenu();
    controls.togglePause();
    controls.restart();
    controls.handlePointer?.({ posX: 0, posY: 0, type: "click" });

    expect(context._menus.adjust).toHaveBeenCalledWith(1);
    expect(context._menus.adjust).toHaveBeenCalledWith(-1);
    expect(context._menus.activate).toHaveBeenCalledTimes(3);
    expect(context._menus.showStart).not.toHaveBeenCalled();
    expect(context._menus.handlePointer).toHaveBeenCalledWith({
      posX: 0,
      posY: 0,
      type: "click",
    });
    expect(context._player.getData().isShooting).not.toBe(true);
  });

  it("pauses the running game when opening the menu", () => {
    const context = createContext();
    const pause = vi.fn();
    const controls = new ControllerInterface(context, { pause });

    controls.openMenu();

    expect(pause).toHaveBeenCalled();
    expect(context._menus.showStart).toHaveBeenCalled();
  });

  it("does not resume an already paused game when opening the menu", () => {
    const context = createContext();
    context._gameTicker.isRunning = false;
    const pause = vi.fn();
    const controls = new ControllerInterface(context, { pause });

    controls.openMenu();

    expect(pause).not.toHaveBeenCalled();
    expect(context._menus.showStart).toHaveBeenCalled();
  });
});
