import { beforeEach, describe, expect, it, vi } from "vitest";
import CollisionSystem from "../collision";
import RenderingSystem from "../rendering";
import SpawningSystem from "../spawning";
import userOptions from "../../user-options";
import type {
  BonusFactoryInstance,
  BonusInstance,
  BulletData,
  BulletInstance,
  BulletFactoryInstance,
  EnemyData,
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

const createEnemyBullet = (
  overrides: Partial<BulletData> = {}
): BulletInstance => {
  const enemyBulletData: BulletData = {
    color: "#ff9",
    coordinateSpace: "world",
    heading: 180,
    posX: 10,
    posY: 20,
    shape: "circle",
    size: 6,
    velocity: 5,
    explosionTick: false,
    ...overrides,
  };

  return {
    removeMe: false,
    explode: vi.fn(function (this: BulletInstance) {
      if (enemyBulletData.explosion) {
        enemyBulletData.explosionTick = 200;
        return;
      }

      this.removeMe = true;
    }),
    getData: vi.fn((key?: keyof BulletData) =>
      key ? enemyBulletData[key] : enemyBulletData
    ) as BulletInstance["getData"],
    setData: vi.fn(() => true),
    setLevel: vi.fn(() => true),
    reposition: vi.fn(),
    render: vi.fn(),
  };
};

const playerBulletData: BulletData[] = [
  {
    color: "#fff",
    coordinateSpace: "screen",
    heading: 90,
    posX: 1,
    posY: 2,
    shape: "square",
    size: 4,
    velocity: 7,
    explosionTick: false,
  },
];

const createPlayerBullet = (): BulletInstance => {
  const bulletData = { ...playerBulletData[0] };

  return {
    removeMe: false,
    explode: vi.fn(function (this: BulletInstance) {
      this.removeMe = true;
    }),
    getData: vi.fn((key?: keyof BulletData) =>
      key ? bulletData[key] : bulletData
    ) as BulletInstance["getData"],
    setData: vi.fn(() => true),
    setLevel: vi.fn(() => true),
    reposition: vi.fn(),
    render: vi.fn(),
  };
};

const createContext = ({
  arenaOverrides = {},
  demoFadeStartedAtTick = 0,
  demoFadeUntilTick = 0,
  demoMode = false,
  enemyAlive = true,
  enemyCollides = true,
  enemyLimitAvailable = true,
  levelIntroUntilTick = 0,
  playerOverrides = {},
  propCount = 0,
  timeWarpTransition,
  ticks = 200,
  level = 1,
}: {
  arenaOverrides?: Partial<GameArenaInstance>;
  demoFadeStartedAtTick?: number;
  demoFadeUntilTick?: number;
  demoMode?: boolean;
  enemyAlive?: boolean;
  enemyCollides?: boolean;
  enemyLimitAvailable?: boolean;
  levelIntroUntilTick?: number;
  playerOverrides?: Partial<PlayerData>;
  propCount?: number;
  timeWarpTransition?: GameDataStore["_timeWarpTransition"];
  ticks?: number;
  level?: number;
} = {}): GameDataStore => {
  const enemyData: EnemyData = {
    deathTick: false,
    heading: 180,
    hitPoints: 1,
    level: 1,
    posX: 100,
    posY: 100,
    tickOffset: 0,
    type: "basic",
  };
  const enemy: EnemyInstance = {
    isAlive: enemyAlive,
    removeMe: false,
    getData: vi.fn((key?: keyof EnemyData) =>
      key ? enemyData[key] : enemyData
    ) as EnemyInstance["getData"],
    setData: vi.fn(() => true),
    detectCollision: vi.fn(() => enemyCollides),
    reposition: vi.fn(),
    render: vi.fn(),
    kill: vi.fn(() => {
      enemy.isAlive = false;
    }),
    destroy: vi.fn(),
  };
  const bonus: BonusInstance = {
    removeMe: false,
    getData: vi.fn(),
    detectCollision: vi.fn(() => true),
    collect: vi.fn(),
    reposition: vi.fn(),
    render: vi.fn(),
  };
  return {
    _level: level,
    _formations: {},
    _levelProgress: {
      bossDefeated: false,
      bossKillThreshold: 56,
      bossSpawned: false,
      standardEnemyKills: 0,
    },
    _demoFadeStartedAtTick: demoFadeStartedAtTick,
    _demoFadeUntilTick: demoFadeUntilTick,
    _isDemoMode: demoMode,
    _levelIntroUntilTick: levelIntroUntilTick,
    _timeWarpTransition: timeWarpTransition,
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
    _bonuses: {
      create: vi.fn(),
      getCount: vi.fn(() => 0),
      getData: vi.fn(() => []),
      getEntities: vi.fn(() => [bonus]),
      cleanup: vi.fn(),
      reposition: vi.fn(),
      render: vi.fn(),
      clearAll: vi.fn(),
    } satisfies BonusFactoryInstance,
    _bullets: {
      create: vi.fn(),
      getCount: vi.fn(() => 1),
      getData: vi.fn(() => playerBulletData),
      getEntities: vi.fn(() => [createPlayerBullet()]),
      cleanup: vi.fn(),
      reposition: vi.fn(),
      render: vi.fn(),
      clearAll: vi.fn(),
    } satisfies BulletFactoryInstance,
    _enemyBullets: {
      create: vi.fn(),
      getCount: vi.fn(() => 0),
      getData: vi.fn(() => []),
      getEntities: vi.fn(() => []),
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
      adjustUiZoom: vi.fn(),
      resetUiZoom: vi.fn(),
      captureKey: vi.fn(() => false),
      isActive: vi.fn(() => false),
      showStart: vi.fn(),
      hide: vi.fn(),
      render: vi.fn(),
      next: vi.fn(),
      previous: vi.fn(),
      goBack: vi.fn(),
      goToRoot: vi.fn(),
      activate: vi.fn(),
      handlePointer: vi.fn(),
    } satisfies MenuSystemInstance,
    _currentController: [],
  };
};

describe("game systems", () => {
  beforeEach(() => {
    userOptions.setOption("gameZoom", 100);
  });

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

  it("collects bonuses through player collision only", () => {
    const context = createContext();
    const system = new CollisionSystem(context);

    system.detectCollisions();

    const [bonus] = context._bonuses.getEntities();
    expect(bonus.detectCollision).toHaveBeenCalledWith(10, 20, 8);
    expect(bonus.collect).toHaveBeenCalled();
  });

  it("kills the player when enemy bullets hit them", () => {
    const context = createContext();
    const enemyBullet = createEnemyBullet();
    vi.mocked(context._enemyBullets.getEntities).mockReturnValue([enemyBullet]);
    const system = new CollisionSystem(context);

    system.detectCollisions();

    expect(context._player.kill).toHaveBeenCalled();
    expect(enemyBullet.removeMe).toBe(true);
  });

  it("lets player bullets shoot down shootable enemy projectiles", () => {
    const context = createContext({
      enemyCollides: false,
      playerOverrides: { posX: 0, posY: 0 },
    });
    const enemyBullet = createEnemyBullet({
      posX: 1,
      posY: 2,
      shootable: true,
    });
    const playerBullet = createPlayerBullet();
    vi.mocked(context._enemyBullets.getEntities).mockReturnValue([enemyBullet]);
    vi.mocked(context._bullets.getEntities).mockReturnValue([playerBullet]);
    const system = new CollisionSystem(context);

    system.detectCollisions();

    expect(playerBullet.removeMe).toBe(true);
    expect(enemyBullet.removeMe).toBe(true);
    expect(context._player.kill).not.toHaveBeenCalled();
  });

  it("keeps the player alive while demo collisions continue resolving bullets", () => {
    const context = createContext({ demoMode: true });
    const system = new CollisionSystem(context);

    system.detectCollisions();

    const [enemy] = context._enemies.getEntities();
    expect(enemy.kill).toHaveBeenCalled();
    expect(context._player.kill).not.toHaveBeenCalled();
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

  it("skips collisions while the level intro is active", () => {
    const context = createContext({ levelIntroUntilTick: 250, ticks: 200 });
    const system = new CollisionSystem(context);

    system.detectCollisions();

    const [enemy] = context._enemies.getEntities();
    expect(enemy.detectCollision).not.toHaveBeenCalled();
    expect(context._player.kill).not.toHaveBeenCalled();
  });

  it("spawns initial props and tick-based entities", () => {
    const context = createContext();
    const system = new SpawningSystem(context);

    vi.spyOn(Math, "random").mockReturnValue(0);

    system.addInitialProps();
    system.spawnEntities();

    expect(context._props.create).toHaveBeenCalled();
    expect(context._enemies.create).toHaveBeenCalled();
    expect(context._enemyBullets.create).toHaveBeenCalledWith(
      100,
      100,
      expect.any(Number),
      6,
      5.5,
      "#FF9",
      false,
      "world",
      "circle",
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );
    expect(context._bonuses.create).not.toHaveBeenCalled();
  });

  it("spawns fast very-slow-homing rockets on level 3", () => {
    const context = createContext({ level: 3 });
    const system = new SpawningSystem(context);

    vi.spyOn(Math, "random").mockReturnValue(0);

    system.spawnEntities();

    expect(context._enemyBullets.create).toHaveBeenCalledWith(
      100,
      100,
      expect.any(Number),
      8,
      10,
      "#FF9",
      false,
      "world",
      "sprite",
      expect.objectContaining({
        frames: 16,
        height: 9,
        renderHeight: 18,
        renderWidth: 24,
        width: 12,
      }),
      true,
      0.5,
      true,
      undefined
    );
  });

  it("spawns faster homing rockets on level 4", () => {
    const context = createContext({ level: 4 });
    const system = new SpawningSystem(context);

    vi.spyOn(Math, "random").mockReturnValue(0);

    system.spawnEntities();

    expect(context._enemyBullets.create).toHaveBeenCalledWith(
      100,
      100,
      expect.any(Number),
      8,
      11,
      "#FF9",
      false,
      "world",
      "sprite",
      expect.objectContaining({
        frames: 16,
        height: 9,
        renderHeight: 18,
        renderWidth: 24,
        width: 12,
      }),
      true,
      1,
      true,
      undefined
    );
  });

  it("aims level 5 plasma shots at the player without homing", () => {
    const context = createContext({ level: 5 });
    const system = new SpawningSystem(context);

    vi.spyOn(Math, "random").mockReturnValue(0);

    system.spawnEntities();

    const call = vi.mocked(context._enemyBullets.create).mock.calls.at(-1);
    expect(call?.[2]).not.toBe(180);
    expect(call?.[4]).toBe(8.75);
    expect(call?.[8]).toBe("sprite");
    expect(call?.[9]).toEqual(
      expect.objectContaining({
        frameMode: "animation",
        frames: 8,
        height: 7,
        renderHeight: 7,
        renderWidth: 8,
        width: 8,
      })
    );
    expect(call?.[10]).toBeUndefined();
    expect(call?.[11]).toBeUndefined();
    expect(call?.[12]).toBe(true);
    expect(call?.[13]).toEqual(
      expect.objectContaining({
        frames: 4,
        height: 13,
        width: 16,
      })
    );
  });

  it("spawns the boss after the level kill threshold", () => {
    const context = createContext();
    context._levelProgress.standardEnemyKills = 56;
    const system = new SpawningSystem(context);

    system.spawnEntities();

    expect(context._enemies.create).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      { type: "boss" }
    );
    expect(context._levelProgress.bossSpawned).toBe(true);
  });

  it("spawns the 1940 special bomber as a horizontal non-progression enemy", () => {
    const context = createContext({ level: 2, ticks: 900 });
    const system = new SpawningSystem(context);

    vi.spyOn(Math, "random").mockReturnValue(0);

    system.spawnEntities();

    expect(context._enemies.create).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      90,
      { type: "specialBomber" }
    );
  });

  it("drops bombs from the 1940 special bomber", () => {
    const context = createContext({ level: 2, ticks: 180 });
    const [bomber] = context._enemies.getEntities();
    vi.mocked(bomber.getData).mockImplementation((key?: keyof EnemyData) => {
      const data: EnemyData = {
        deathTick: false,
        heading: 90,
        hitPoints: 3,
        level: 2,
        posX: 100,
        posY: 100,
        tickOffset: 0,
        type: "specialBomber" as const,
      };

      return key ? data[key] : data;
    });
    const system = new SpawningSystem(context);

    vi.spyOn(Math, "random").mockReturnValue(0);

    system.spawnEntities();

    expect(context._enemyBullets.create).toHaveBeenCalledWith(
      100,
      109,
      180,
      6,
      4.5,
      "#FF9",
      false,
      "world",
      "sprite",
      expect.objectContaining({
        height: 3,
        renderHeight: 6,
        renderWidth: 24,
        width: 12,
      }),
      undefined,
      undefined,
      true,
      expect.objectContaining({
        frames: 4,
        height: 11,
        width: 11,
      })
    );
  });

  it("spawns bonuses along the top and upper side spawn areas", () => {
    const context = createContext({ ticks: 600 });
    const system = new SpawningSystem(context);

    vi.spyOn(Math, "random").mockReturnValue(0);

    system.spawnEntities();

    expect(context._bonuses.create).toHaveBeenCalledWith(-390, -328);
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

  it("scales initial prop density for larger viewports", () => {
    const context = createContext({
      arenaOverrides: {
        width: 1920,
        height: 1080,
      },
    });
    const system = new SpawningSystem(context);

    vi.spyOn(Math, "random").mockReturnValue(0);

    system.addInitialProps();

    expect(context._props.create).toHaveBeenCalledTimes(87);
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
    expect(context._bonuses.create).not.toHaveBeenCalled();
  });

  it("does not spawn enemies, props, or bonuses while the level intro is active", () => {
    const context = createContext({ levelIntroUntilTick: 250, ticks: 200 });
    const system = new SpawningSystem(context);

    vi.spyOn(Math, "random").mockReturnValue(0);

    system.spawnEntities();

    expect(context._enemies.create).not.toHaveBeenCalled();
    expect(context._props.create).not.toHaveBeenCalled();
    expect(context._bonuses.create).not.toHaveBeenCalled();
  });

  it("renders a frame in the expected scene order", () => {
    const context = createContext();
    const system = new RenderingSystem(context);

    system.renderFrame();

    expect(context._gameArena.clear).toHaveBeenCalled();
    expect(context._gameArena.setBackgroundColor).toHaveBeenCalledWith("#4FC3F7");
    expect(context._props.render).toHaveBeenNthCalledWith(1, 1);
    expect(context._bonuses.render).toHaveBeenCalled();
    expect(context._bullets.render).toHaveBeenCalled();
    expect(context._enemies.render).toHaveBeenCalled();
    expect(context._enemyBullets.render).toHaveBeenCalled();
    expect(context._player.render).toHaveBeenCalled();
    expect(context._props.render).toHaveBeenNthCalledWith(2, 2);
    expect(context._hud.render).toHaveBeenCalled();
    expect(context._menus.render).toHaveBeenCalled();
  });

  it("renders level intro text above gameplay and below menus while intro is active", () => {
    const context = createContext({ levelIntroUntilTick: 250, ticks: 200 });
    const system = new RenderingSystem(context);

    system.renderFrame();

    expect(context._gameArena.renderText).toHaveBeenCalledWith(
      "A.D 1910",
      0,
      44,
      expect.objectContaining({
        align: "center",
        size: 24,
        valign: "middle",
      })
    );
    expect(
      vi.mocked(context._props.render).mock.invocationCallOrder[1]
    ).toBeLessThan(
      vi.mocked(context._gameArena.renderText).mock.invocationCallOrder[0]
    );
    expect(
      vi.mocked(context._gameArena.renderText).mock.invocationCallOrder[0]
    ).toBeLessThan(vi.mocked(context._menus.render).mock.invocationCallOrder[0]);
  });

  it("renders demo level fade behind active menus", () => {
    const context = createContext({
      demoFadeStartedAtTick: 100,
      demoFadeUntilTick: 130,
      demoMode: true,
      ticks: 115,
    });
    vi.mocked(context._menus.isActive).mockReturnValue(true);
    const system = new RenderingSystem(context);

    system.renderFrame();

    const canvasContexts = vi
      .mocked(context._gameArena.getContext)
      .mock.results.map((result) => result.value as CanvasRenderingContext2D);
    const canvasContext = canvasContexts.find((renderingContext) =>
      vi.mocked(renderingContext.fillRect).mock.calls.some(
        (call) => call[0] === -400 && call[1] === -300 && call[2] === 800 && call[3] === 600
      )
    )!;

    expect(canvasContext.fillRect).toHaveBeenCalledWith(-400, -300, 800, 600);
    expect(context._menus.render).toHaveBeenCalled();
    expect(vi.mocked(canvasContext.fillRect).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(context._menus.render).mock.invocationCallOrder[0]
    );
  });

  it("renders the expanding time warp frame strip over the centered player", () => {
    const context = createContext({
      ticks: 320,
      timeWarpTransition: {
        effectStartedAtTick: 250,
        endsAtTick: 520,
        lives: 3,
        nextLevel: 2,
        score: 1000,
        screenCleared: true,
        startedAtTick: 200,
      },
    });
    const system = new RenderingSystem(context);

    system.renderFrame();

    const canvasContexts = vi
      .mocked(context._gameArena.getContext)
      .mock.results.map((result) => result.value as CanvasRenderingContext2D);
    const drawImageCalls = canvasContexts.flatMap((renderingContext) =>
      vi.mocked(renderingContext.drawImage).mock.calls
    );

    expect(context._gameArena.setBackgroundColor).toHaveBeenCalledWith("#000");
    expect(context._props.render).not.toHaveBeenCalled();
    expect(context._hud.render).not.toHaveBeenCalled();
    expect(drawImageCalls).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([
          expect.any(HTMLImageElement),
          0,
          0,
          16,
          16,
          -416,
          -16,
          32,
          32,
        ]),
      ])
    );
    expect(drawImageCalls.length).toBeGreaterThan(20);
  });

  it("hides HUD rendering while menus are active", () => {
    const context = createContext();
    vi.mocked(context._menus.isActive).mockReturnValue(true);
    const system = new RenderingSystem(context);

    system.renderFrame();

    expect(context._hud.render).not.toHaveBeenCalled();
    expect(context._menus.render).toHaveBeenCalled();
  });

  it("hides level intro text while menus are active", () => {
    const context = createContext({ levelIntroUntilTick: 250, ticks: 200 });
    vi.mocked(context._menus.isActive).mockReturnValue(true);
    const system = new RenderingSystem(context);

    system.renderFrame();

    expect(context._gameArena.renderText).not.toHaveBeenCalledWith(
      "A.D 1910",
      expect.any(Number),
      expect.any(Number),
      expect.anything()
    );
  });
});
