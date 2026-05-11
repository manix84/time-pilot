import { beforeEach, describe, expect, it, vi } from "vitest";
import CollisionSystem from "../collision";
import RenderingSystem from "../rendering";
import SpawningSystem from "../spawning";
import type {
  BulletFactoryInstance,
  EnemyFactoryInstance,
  EnemyInstance,
  GameArenaInstance,
  GameDataStore,
  HudInstance,
  PlayerData,
  PlayerInstance,
  PropFactoryInstance,
  TickerInstance,
} from "../../types";

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
});

const createTicker = (): TickerInstance => ({
  isRunning: true,
  start: vi.fn(),
  stop: vi.fn(),
  addSchedule: vi.fn(() => 1),
  removeSchedule: vi.fn(() => true),
  clearSchedule: vi.fn(),
  clearTicks: vi.fn(() => true),
  getTicks: vi.fn(() => 200),
});

const createPlayer = (): PlayerInstance => {
  const data: PlayerData = {
    isAlive: true,
    deathTick: false,
    isFiring: false,
    heading: 90,
    newHeading: false,
    posX: 10,
    posY: 20,
    exploading: 0,
    continues: 0,
    lives: 3,
    score: 0,
    level: 1,
  };

  return {
    getData: vi.fn((key?: keyof PlayerData) =>
      key ? data[key] : data
    ) as PlayerInstance["getData"],
    setData: vi.fn((key: keyof PlayerData, value: PlayerData[keyof PlayerData]) => {
      data[key] = value as never;
      return true;
    }) as PlayerInstance["setData"],
    resetData: vi.fn(),
    reposition: vi.fn(),
    rotate: vi.fn(),
    startShooting: vi.fn(),
    stopShooting: vi.fn(),
    shoot: vi.fn(),
    render: vi.fn(),
    kill: vi.fn(() => {
      data.isAlive = false;
    }),
  };
};

const createContext = (): GameDataStore => {
  const enemy: EnemyInstance = {
    isAlive: true,
    removeMe: false,
    getData: vi.fn(),
    setData: vi.fn(() => true),
    detectCollision: vi.fn(() => true),
    reposition: vi.fn(),
    render: vi.fn(),
    kill: vi.fn(() => {
      enemy.isAlive = false;
    }),
  };

  return {
    _level: 1,
    _gameArena: createArena(),
    _renderTicker: createTicker(),
    _gameTicker: createTicker(),
    _bullets: {
      create: vi.fn(),
      getCount: vi.fn(() => 1),
      getData: vi.fn(() => [{ posX: 1, posY: 2, heading: 90, size: 4, velocity: 7, color: "#fff" }]),
      cleanup: vi.fn(),
      reposition: vi.fn(),
      render: vi.fn(),
      clearAll: vi.fn(),
    } satisfies BulletFactoryInstance,
    _player: createPlayer(),
    _enemies: {
      create: vi.fn(),
      getCount: vi.fn(() => 1),
      isUnderLimit: vi.fn(() => true),
      getData: vi.fn(() => []),
      getEntities: vi.fn(() => [enemy]),
      cleanup: vi.fn(),
      reposition: vi.fn(),
      render: vi.fn(),
      clearAll: vi.fn(),
    } satisfies EnemyFactoryInstance,
    _props: {
      create: vi.fn(),
      getCount: vi.fn(() => 0),
      getData: vi.fn(() => []),
      cleanup: vi.fn(),
      reposition: vi.fn(),
      render: vi.fn(),
      clearAll: vi.fn(),
    } satisfies PropFactoryInstance,
    _hud: {
      render: vi.fn(),
      restart: vi.fn(),
    } satisfies HudInstance,
    _currentController: [],
  };
};

describe("game systems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs collision checks between enemies, player, and bullets", () => {
    const context = createContext();
    const system = new CollisionSystem(context);

    system.detectCollisions();

    const [enemy] = context._enemies.getEntities();
    expect(enemy.kill).toHaveBeenCalled();
    expect(context._player.kill).toHaveBeenCalled();
  });

  it("spawns initial props and tick-based entities", () => {
    const context = createContext();
    const system = new SpawningSystem(context);

    vi.spyOn(Math, "random").mockReturnValue(0);

    system.addInitialProps();
    system.spawnEntities();

    expect(context._props.create).toHaveBeenCalled();
    expect(context._enemies.create).toHaveBeenCalled();
  });

  it("renders a frame in the expected scene order", () => {
    const context = createContext();
    const system = new RenderingSystem(context);

    system.renderFrame();

    expect(context._gameArena.clear).toHaveBeenCalled();
    expect(context._gameArena.setBackgroundColor).toHaveBeenCalledWith("#007");
    expect(context._props.render).toHaveBeenNthCalledWith(1, 1);
    expect(context._bullets.render).toHaveBeenCalled();
    expect(context._enemies.render).toHaveBeenCalled();
    expect(context._player.render).toHaveBeenCalled();
    expect(context._props.render).toHaveBeenNthCalledWith(2, 2);
    expect(context._hud.render).toHaveBeenCalled();
  });
});
