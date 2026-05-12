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
  MenuSystemInstance,
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
  getElement: vi.fn(() => document.createElement("canvas")),
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

const createPlayer = (overrides: Partial<PlayerData> = {}): PlayerInstance => {
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
    ...overrides,
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

const createContext = ({
  arenaOverrides = {},
  enemyAlive = true,
  enemyCollides = true,
  enemyLimitAvailable = true,
  playerOverrides = {},
  propCount = 0,
  ticks = 200,
}: {
  arenaOverrides?: Partial<GameArenaInstance>;
  enemyAlive?: boolean;
  enemyCollides?: boolean;
  enemyLimitAvailable?: boolean;
  playerOverrides?: Partial<PlayerData>;
  propCount?: number;
  ticks?: number;
} = {}): GameDataStore => {
  const enemy: EnemyInstance = {
    isAlive: enemyAlive,
    removeMe: false,
    getData: vi.fn(),
    setData: vi.fn(() => true),
    detectCollision: vi.fn(() => enemyCollides),
    reposition: vi.fn(),
    render: vi.fn(),
    kill: vi.fn(() => {
      enemy.isAlive = false;
    }),
  };

  return {
    _level: 1,
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
    _gameArena: {
      ...createArena(),
      ...arenaOverrides,
    },
    _renderTicker: createTicker(),
    _gameTicker: {
      ...createTicker(),
      getTicks: vi.fn(() => ticks),
    },
    _bullets: {
      create: vi.fn(),
      getCount: vi.fn(() => 1),
      getData: vi.fn(() => [{ posX: 1, posY: 2, heading: 90, size: 4, velocity: 7, color: "#fff" }]),
      cleanup: vi.fn(),
      reposition: vi.fn(),
      render: vi.fn(),
      clearAll: vi.fn(),
    } satisfies BulletFactoryInstance,
    _player: createPlayer(playerOverrides),
    _enemies: {
      create: vi.fn(),
      getCount: vi.fn(() => 1),
      isUnderLimit: vi.fn(() => enemyLimitAvailable),
      getData: vi.fn(() => []),
      getEntities: vi.fn(() => [enemy]),
      cleanup: vi.fn(),
      reposition: vi.fn(),
      render: vi.fn(),
      clearAll: vi.fn(),
    } satisfies EnemyFactoryInstance,
    _props: {
      create: vi.fn(),
      getCount: vi.fn(() => propCount),
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
    _menus: {
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
    } satisfies MenuSystemInstance,
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

  it("skips collisions when enemies or the player are not alive", () => {
    const deadEnemyContext = createContext({ enemyAlive: false });
    const deadEnemySystem = new CollisionSystem(deadEnemyContext);

    deadEnemySystem.detectCollisions();

    expect(deadEnemyContext._player.kill).not.toHaveBeenCalled();

    const deadPlayerContext = createContext({
      playerOverrides: { isAlive: false },
    });
    const deadPlayerSystem = new CollisionSystem(deadPlayerContext);

    deadPlayerSystem.detectCollisions();

    const [enemy] = deadPlayerContext._enemies.getEntities();
    expect(enemy.detectCollision).not.toHaveBeenCalled();
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

  it("expands spawn areas to cover wide or tall viewports", () => {
    const context = createContext({
      arenaOverrides: {
        width: 1920,
        height: 1080,
      },
      playerOverrides: {
        heading: 90,
        posX: 10,
        posY: 20,
      },
    });
    const system = new SpawningSystem(context);

    vi.spyOn(Math, "random").mockReturnValue(0);

    system.addInitialProps();
    system.spawnEntities();

    expect(context._props.create).toHaveBeenNthCalledWith(1, -1046, -616);

    const [enemyX, enemyY] = vi.mocked(context._enemies.create).mock.calls[0];
    const distanceFromPlayer = Math.hypot(enemyX - 10, enemyY - 20);

    expect(distanceFromPlayer).toBeGreaterThan(1100);
  });

  it("does not spawn when limits or timing block new entities", () => {
    const context = createContext({
      enemyLimitAvailable: false,
      propCount: 20,
      ticks: 201,
    });
    const system = new SpawningSystem(context);

    vi.spyOn(Math, "random").mockReturnValue(0);

    system.spawnEntities();

    expect(context._enemies.create).not.toHaveBeenCalled();
    expect(context._props.create).not.toHaveBeenCalled();
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
    expect(context._menus.render).toHaveBeenCalled();
  });
});
