import { beforeEach, describe, expect, it, vi } from "vitest";
import AchievementSystem, { achievementDefinitions } from "../achievements";
import { gameFps } from "../game-timing";
import { createRunStats } from "../run-stats";
import type {
  BonusFactoryInstance,
  BulletFactoryInstance,
  BulletInstance,
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
} from "../types";

const createTicker = (getTicks: () => number): TickerInstance => ({
  isRunning: true,
  start: vi.fn(),
  stop: vi.fn(),
  addSchedule: vi.fn(() => 1),
  removeSchedule: vi.fn(() => true),
  clearSchedule: vi.fn(),
  clearTicks: vi.fn(() => true),
  getTicks,
});

const createPlayer = (data: PlayerData): PlayerInstance => ({
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
  kill: vi.fn(),
});

const createEnemy = (): EnemyInstance => ({
  isAlive: true,
  removeMe: false,
  getData: vi.fn(),
  setData: vi.fn(() => true),
  detectCollision: vi.fn(() => false),
  reposition: vi.fn(),
  render: vi.fn(),
  kill: vi.fn(),
  destroy: vi.fn(),
});

const createBullet = (): BulletInstance => ({
  removeMe: false,
  explode: vi.fn(),
  destroy: vi.fn(),
  getData: vi.fn(),
  setData: vi.fn(() => true),
  setLevel: vi.fn(() => true),
  reposition: vi.fn(),
  render: vi.fn(),
});

const createContext = (
  playerData: Partial<PlayerData> = {},
  getTicks: () => number = () => 0
): GameDataStore => {
  const data: PlayerData = {
    isAlive: true,
    deathTick: false,
    isFiring: false,
    heading: 90,
    newHeading: false,
    posX: 0,
    posY: 0,
    exploading: 0,
    continues: 3,
    lives: 3,
    nextExtraLifeScore: 10000,
    score: 0,
    level: 1,
    ...playerData,
  };

  return {
    _level: data.level,
    _levelProgress: {
      bossDefeated: false,
      bossKillThreshold: 56,
      bossSpawned: false,
      standardEnemyKills: 0,
    },
    _runStats: createRunStats(0, data.level),
    _formations: {},
    _isDemoMode: false,
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
    } satisfies GameArenaInstance,
    _renderTicker: createTicker(getTicks),
    _gameTicker: createTicker(getTicks),
    _bonuses: {
      create: vi.fn(),
      getCount: vi.fn(() => 0),
      getData: vi.fn(() => []),
      getEntities: vi.fn(() => []),
      cleanup: vi.fn(),
      reposition: vi.fn(),
      render: vi.fn(),
      clearAll: vi.fn(),
    } satisfies BonusFactoryInstance,
    _bullets: {
      create: vi.fn(),
      getCount: vi.fn(() => 0),
      getData: vi.fn(() => []),
      getEntities: vi.fn(() => []),
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
    _player: createPlayer(data),
    _enemies: {
      create: vi.fn(),
      getCount: vi.fn(() => 0),
      isUnderLimit: vi.fn(() => true),
      getData: vi.fn(() => []),
      getEntities: vi.fn(() => []),
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
    _menus: {
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
    } satisfies MenuSystemInstance,
    _currentController: [],
  };
};

describe("AchievementSystem", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("unlocks first mission, repeat run, and continue achievements", () => {
    const context = createContext();
    const achievements = new AchievementSystem(context);

    achievements.onRunStarted(context._player.getData());
    achievements.onContinueUsed(2);
    achievements.onContinueUsed(1);
    achievements.onContinueUsed(0);
    achievements.onGameOver();
    achievements.onRunStarted(context._player.getData());

    expect(achievements.getUnlocked()).toEqual(
      expect.arrayContaining([
        "we-have-lift-off",
        "insert-coin",
        "credit-feeder",
        "one-more-run",
        "just-one-more-run",
      ])
    );
  });

  it("exposes icon metadata for achievement presentation", () => {
    const lastChance = achievementDefinitions.find(
      (achievement) => achievement.id === "last-chance"
    );

    expect(lastChance?.icon.src).toBe(
      "/sprites/achievements/achievement_lastChance.png"
    );
    expect(lastChance?.icon).toEqual(
      expect.objectContaining({
        frameHeight: 64,
        frameWidth: 64,
        lockedFrameX: 0,
        unlockedFrameX: 1,
      })
    );
    expect(
      achievementDefinitions.every((achievement) =>
        achievement.icon.src.startsWith("/sprites/achievements/achievement_")
      )
    ).toBe(true);
  });

  it("persists total continue progress for Quarter Master", () => {
    const context = createContext();
    const achievements = new AchievementSystem(context);

    achievements.onRunStarted(context._player.getData());

    for (let i = 0; i < 25; i++) {
      achievements.onContinueUsed(3);
    }

    const restored = new AchievementSystem(context);

    expect(restored.hasUnlocked("quarter-master")).toBe(true);
    expect(
      restored.getStatuses().find((achievement) => achievement.id === "quarter-master")
        ?.progress
    ).toEqual({
      current: 25,
      goal: 25,
    });
  });

  it("resets runtime achievement status and persisted achievement storage", () => {
    const context = createContext();
    const achievements = new AchievementSystem(context);

    achievements.onRunStarted(context._player.getData());
    achievements.onContinueUsed(2);
    achievements.reset();

    expect(achievements.getUnlocked()).toEqual([]);
    expect(
      achievements.getStatuses().find((achievement) => achievement.id === "quarter-master")
        ?.progress
    ).toEqual({
      current: 0,
      goal: 25,
    });
    expect(localStorage.getItem("timePilot.achievements")).toBeNull();
  });

  it("tracks clean missile-heavy waves", () => {
    const context = createContext();
    const achievements = new AchievementSystem(context);

    achievements.onWaveStarted("wave-1");
    achievements.onEnemyProjectileSpawned({
      tracksPlayer: true,
      sprite: {
        sprite: { src: "/sprites/enemies/projectiles/rocket.png" },
        width: 12,
        height: 9,
      },
    });
    achievements.onEnemyProjectileSpawned({
      tracksPlayer: true,
      sprite: {
        sprite: { src: "/sprites/enemies/projectiles/rocket.png" },
        width: 12,
        height: 9,
      },
    });
    achievements.onEnemyProjectileSpawned({
      tracksPlayer: true,
      sprite: {
        sprite: { src: "/sprites/enemies/projectiles/rocket.png" },
        width: 12,
        height: 9,
      },
    });
    achievements.onWaveCompleted("wave-1");

    expect(achievements.getUnlocked()).toEqual(
      expect.arrayContaining([
        "professional-cloud-dodger",
        "oops-all-missiles",
      ])
    );
  });

  it("tracks low-life survival and chaotic screens", () => {
    let ticks = 0;
    const context = createContext({ lives: 1 }, () => ticks);
    const achievements = new AchievementSystem(context);
    const enemies = Array.from({ length: 5 }, createEnemy);
    const bullets = Array.from({ length: 3 }, createBullet);

    vi.mocked(context._enemies.getEntities).mockReturnValue(enemies);
    vi.mocked(context._enemyBullets.getEntities).mockReturnValue(bullets);

    achievements.onRunStarted(context._player.getData());
    achievements.update();
    ticks = 1500;
    achievements.update();

    expect(achievements.getUnlocked()).toEqual(
      expect.arrayContaining(["this-is-fine", "still-alive-somehow"])
    );
  });

  it("tracks era completion achievements", () => {
    const context = createContext({ continues: 0, level: 1 });
    const achievements = new AchievementSystem(context);

    achievements.onRunStarted(context._player.getData());
    achievements.onLevelCompleted(1, 2, context._player.getData());
    achievements.onLevelStarted(5);

    expect(achievements.getUnlocked()).toEqual(
      expect.arrayContaining([
        "the-wright-stuff",
        "no-safety-net",
      ])
    );
  });

  it("does not award no-death era completion after losing a life", () => {
    const context = createContext({ level: 1, lives: 2 });
    const achievements = new AchievementSystem(context);

    achievements.onRunStarted(context._player.getData());
    achievements.onPlayerHit("projectile", context._player.getData());
    achievements.onLevelCompleted(1, 2, context._player.getData());

    expect(achievements.hasUnlocked("the-wright-stuff")).toBe(false);
  });

  it("tracks collision, near-collision, respawn, and hidden mechanic events", () => {
    let ticks = 100;
    const context = createContext({ lives: 2 }, () => ticks);
    const achievements = new AchievementSystem(context);

    achievements.onRunStarted(context._player.getData());
    achievements.onRespawn();
    ticks = 200;
    achievements.onPlayerHit("enemy", {
      ...context._player.getData(),
      lives: 1,
    });
    achievements.onEnemyDestroyed({
      enemyData: {
        deathTick: false,
        heading: 180,
        hitPoints: 0,
        level: 1,
        posX: 50,
        posY: 0,
        tickOffset: 0,
        type: "basic",
      },
      playerData: context._player.getData(),
      source: "playerBullet",
    });
    achievements.onShootableProjectileDestroyed();

    expect(achievements.getUnlocked()).toEqual(
      expect.arrayContaining([
        "pilot-error",
        "not-again",
        "i-meant-to-do-that",
        "you-can-do-that",
      ])
    );
  });

  it("ignores achievement criteria while demo mode is active", () => {
    let ticks = 0;
    const context = createContext({ continues: 0, level: 5, lives: 1 }, () => ticks);
    context._isDemoMode = true;
    const achievements = new AchievementSystem(context);
    const enemies = Array.from({ length: 5 }, createEnemy);
    const bullets = Array.from({ length: 3 }, createBullet);

    vi.mocked(context._enemies.getEntities).mockReturnValue(enemies);
    vi.mocked(context._enemyBullets.getEntities).mockReturnValue(bullets);

    achievements.onRunStarted(context._player.getData());
    achievements.onContinueUsed(0);
    achievements.onWaveStarted("demo-wave");
    achievements.onEnemyProjectileSpawned({
      tracksPlayer: true,
      sprite: {
        sprite: { src: "/sprites/enemies/projectiles/rocket.png" },
        width: 12,
        height: 9,
      },
    });
    achievements.onWaveCompleted("demo-wave");
    achievements.onRespawn();
    achievements.onPlayerHit("enemy", context._player.getData());
    achievements.onEnemyDestroyed({
      enemyData: {
        deathTick: false,
        heading: 180,
        hitPoints: 0,
        level: 5,
        posX: 10,
        posY: 0,
        tickOffset: 0,
        type: "boss",
      },
      playerData: context._player.getData(),
      source: "playerBullet",
    });
    achievements.onShootableProjectileDestroyed();
    achievements.onLevelCompleted(5, 1, context._player.getData());
    achievements.onLevelStarted(5);
    ticks = 60 * 60 * gameFps;
    achievements.update();

    expect(achievements.getUnlocked()).toEqual([]);
    expect(
      achievements.getStatuses().find((achievement) => achievement.id === "quarter-master")
        ?.progress
    ).toEqual({
      current: 0,
      goal: 25,
    });
  });
});
