import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BonusFactory from "../bonus-factory";
import BulletFactory from "../bullet-factory";
import ControllerInterface from "../controller-interface";
import EnemyFactory from "../enemy-factory";
import Hud from "../hud";
import Player from "../player";
import PropFactory from "../prop-factory";
import userOptions from "../user-options";
import type {
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
    captureKey: vi.fn(() => false),
    isActive: vi.fn(() => false),
    showStart: vi.fn(),
    hide: vi.fn(),
    render: vi.fn(),
    next: vi.fn(),
    previous: vi.fn(),
    activate: vi.fn(),
    handlePointer: vi.fn(),
  } satisfies MenuSystemInstance;

  return context;
};

describe("context-backed game modules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    userOptions.setOption("enableDebug", false);
    userOptions.setDebugOption("showHitboxes", true);
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

  it("spends a life and respawns the player at level start after death", () => {
    const context = createContext();
    vi.mocked(context._gameTicker.getTicks).mockReturnValue(10);
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
  });

  it("shows game over only after the final life is lost", () => {
    const context = createContext();
    context._player.setData("lives", 1);

    context._player.kill();
    context._hud.render();

    expect(context._gameArena.renderText).toHaveBeenCalledWith(
      "Game Over",
      0,
      0,
      expect.any(Object)
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

    expect(context._gameArena.renderSprite).toHaveBeenCalledTimes(3);
    expect(context._gameArena.renderSprite).toHaveBeenCalledWith(
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 16,
        frameWidth: 16,
        frameX: 24,
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
        frameHeight: 32,
        frameWidth: 32,
        frameX: 8,
        frameY: 2,
      })
    );
    expect(context._gameArena.renderSprite).toHaveBeenNthCalledWith(
      2,
      expect.any(HTMLImageElement),
      expect.objectContaining({
        frameHeight: 32,
        frameWidth: 32,
        frameX: 0,
        frameY: 0,
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
        frameX: 3,
        frameY: 0,
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
    expect(context._gameArena.drawCircle).toHaveBeenCalledWith(80, 80, 10, {
      borderColor: "#0FF",
    });
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

  it("renders only the active controller overlay", () => {
    const context = createContext();
    userOptions.setOption("enableDebug", true);
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
