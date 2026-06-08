import {
  addAchievementProgress,
  createAchievementState,
  getAchievementStatuses as getEngineAchievementStatuses,
  unlockAchievement,
  type AchievementDefinition as EngineAchievementDefinition,
  type AchievementState,
} from "arcade-engine";
import { assetPath } from "./asset-path";
import { gameTickRate } from "./game-timing";
import { logger } from "./logger";
import type {
  BulletData,
  EnemyData,
  GameDataStore,
  PlayerData,
} from "./types";

/**
 * Stable identifier for an achievement definition.
 */
export type AchievementId =
  | "this-is-fine"
  | "i-meant-to-do-that"
  | "professional-cloud-dodger"
  | "we-have-lift-off"
  | "not-again"
  | "oops-all-missiles"
  | "the-wright-stuff"
  | "pilot-error"
  | "insert-coin"
  | "still-alive-somehow"
  | "you-can-do-that"
  | "one-more-run"
  | "just-one-more-run"
  | "seriously-one-more-run"
  | "last-chance"
  | "credit-feeder"
  | "against-all-odds"
  | "back-in-the-fight"
  | "phoenix-pilot"
  | "final-continue"
  | "three-strikes"
  | "arcade-spirit"
  | "no-safety-net"
  | "quarter-master";

/**
 * Static achievement metadata.
 */
export interface AchievementDefinition
  extends EngineAchievementDefinition<AchievementId> {
  /**
   * Stable achievement identifier used for persistence.
   */
  id: AchievementId;
  /**
   * Player-facing title.
   */
  name: string;
  /**
   * Player-facing unlock criteria.
   */
  description: string;
  /**
   * Sprite sheet metadata for the locked and unlocked icon frames.
   */
  icon: {
    frameHeight: number;
    frameWidth: number;
    lockedFrameX: number;
    unlockedFrameX: number;
    src: string;
  };
  /**
   * Optional target for achievements that expose persistent progress.
   */
  progressGoal?: number;
}

/**
 * Achievement metadata combined with current player progress.
 */
export interface AchievementStatus extends AchievementDefinition {
  /**
   * Optional counter state for achievements with visible progress.
   */
  progress?: {
    current: number;
    goal: number;
  };
  /**
   * Whether this achievement has been unlocked.
   */
  unlocked: boolean;
  /**
   * Millisecond timestamp for when the achievement was unlocked.
   */
  unlockedAt?: number;
}

const achievementIcon = (fileName: string): AchievementDefinition["icon"] => ({
  frameHeight: 64,
  frameWidth: 64,
  lockedFrameX: 0,
  unlockedFrameX: 1,
  src: assetPath(`sprites/achievements/${fileName}`),
});

/**
 * Ordered list of all achievements shown on the achievements page.
 */
export const achievementDefinitions: AchievementDefinition[] = [
  {
    id: "we-have-lift-off",
    name: "We Have Lift Off",
    description: "Begin your first mission.",
    icon: achievementIcon("achievement_weHaveLiftOff.png"),
  },
  {
    id: "pilot-error",
    name: "Pilot Error",
    description: "Lose a life by flying directly into an enemy.",
    icon: achievementIcon("achievement_pilotError.png"),
  },
  {
    id: "not-again",
    name: "Not Again",
    description: "Lose a life within 3 seconds of respawning.",
    icon: achievementIcon("achievement_notAgain.png"),
  },
  {
    id: "insert-coin",
    name: "Insert Coin",
    description: "Use your first continue.",
    icon: achievementIcon("achievement_insertCoin.png"),
  },
  {
    id: "one-more-run",
    name: "One More Run",
    description: "Start another game immediately after a game over.",
    icon: achievementIcon("achievement_oneMoreRun.png"),
  },
  {
    id: "you-can-do-that",
    name: "You Can Do That?!",
    description: "Discover a hidden mechanic or unexpected interaction.",
    icon: achievementIcon("achievement_youCanDoThat.png"),
  },
  {
    id: "i-meant-to-do-that",
    name: "I Meant To Do That",
    description: "Destroy an enemy moments before colliding with it.",
    icon: achievementIcon("achievement_iMeantToDoThat.png"),
  },
  {
    id: "professional-cloud-dodger",
    name: "Professional Cloud Dodger",
    description: "Avoid every enemy projectile for an entire wave.",
    icon: achievementIcon("achievement_professionalCloudDodger.png"),
  },
  {
    id: "oops-all-missiles",
    name: "Oops, All Missiles",
    description: "Survive a wave filled with missile attacks.",
    icon: achievementIcon("achievement_oopsAllMissiles.png"),
  },
  {
    id: "this-is-fine",
    name: "This Is Fine",
    description: "Survive for 30 seconds with only 1 life remaining.",
    icon: achievementIcon("achievement_thisIsFine.png"),
  },
  {
    id: "still-alive-somehow",
    name: "Still Alive Somehow",
    description: "Survive a chaotic screen with only 1 life remaining.",
    icon: achievementIcon("achievement_stillAliveSomehow.png"),
  },
  {
    id: "three-strikes",
    name: "Three Strikes",
    description: "Lose all 3 lives in under a minute.",
    icon: achievementIcon("achievement_threeStrikes.png"),
  },
  {
    id: "last-chance",
    name: "Last Chance",
    description: "Reach a new era on your final life.",
    icon: achievementIcon("achievement_lastChance.png"),
  },
  {
    id: "back-in-the-fight",
    name: "Back In The Fight",
    description: "Continue a game and immediately defeat a boss.",
    icon: achievementIcon("achievement_backInTheFight.png"),
  },
  {
    id: "credit-feeder",
    name: "Credit Feeder",
    description: "Use every continue in a single run.",
    icon: achievementIcon("achievement_creditFeeder.png"),
  },
  {
    id: "just-one-more-run",
    name: "Just One More Run",
    description: "Use all continues and still start another game.",
    icon: achievementIcon("achievement_justOneMoreRun.png"),
  },
  {
    id: "the-wright-stuff",
    name: "The Wright Stuff",
    description: "Complete the 1910 era without losing a life.",
    icon: achievementIcon("achievement_theWrightStuff.png"),
  },
  {
    id: "against-all-odds",
    name: "Against All Odds",
    description: "Recover from a near game over and clear the stage.",
    icon: achievementIcon("achievement_againstAllOdds.png"),
  },
  {
    id: "phoenix-pilot",
    name: "Phoenix Pilot",
    description: "Lose all lives except one, then survive an entire era.",
    icon: achievementIcon("achievement_phoenixPilot.png"),
  },
  {
    id: "quarter-master",
    name: "Quarter Master",
    description: "Use continues 25 times total.",
    icon: achievementIcon("achievement_quarterMaster.png"),
    progressGoal: 25,
  },
  {
    id: "seriously-one-more-run",
    name: "Seriously, One More Run",
    description: "Play for over an hour in a single session.",
    icon: achievementIcon("achievement_seriouslyOneMoreRun.png"),
  },
  {
    id: "arcade-spirit",
    name: "Arcade Spirit",
    description: "Finish a run without using continues.",
    icon: achievementIcon("achievement_arcadeSpirit.png"),
  },
  {
    id: "no-safety-net",
    name: "No Safety Net",
    description: "Disable continues and still reach the future era.",
    icon: achievementIcon("achievement_noSafetyNet.png"),
  },
  {
    id: "final-continue",
    name: "Final Continue",
    description: "Win the game after using your last continue.",
    icon: achievementIcon("achievement_finalContinue.png"),
  },
];

type PlayerHitCause = "enemy" | "projectile";

interface LegacyAchievementStorageState extends Partial<AchievementState<AchievementId>> {
  counters?: Partial<Record<"continuesUsed", number>>;
}

interface RunState {
  bossDefeatedAfterContinueUntilTick: number;
  continuesUsed: number;
  deathTicks: number[];
  gameOverSeen: boolean;
  initialContinues: number;
  initialLives: number;
  lastRespawnTick: number | false;
  lowLifeStartedAtTick: number | false;
  nearGameOverSeen: boolean;
  playedAfterGameOver: boolean;
  runStartedAtTick: number;
  usedContinue: boolean;
  usedEveryContinue: boolean;
}

interface EraState {
  level: number;
  lostLifeEver: boolean;
  lostLifeSinceOneLife: boolean;
  reachedOneLife: boolean;
  reachedOneLifeTick: number | false;
}

interface WaveState {
  hitByProjectile: boolean;
  missileProjectiles: number;
  nonMissileProjectiles: number;
  projectileCount: number;
}

/**
 * Local storage key for persisted achievement state.
 */
export const achievementStorageKey = "timePilot.achievements";
const thisIsFineTicks = 30 * gameTickRate;
const notAgainTicks = 3 * gameTickRate;
const threeStrikesTicks = 60 * gameTickRate;
const oneHourTicks = 60 * 60 * gameTickRate;
const immediateBossTicks = 10 * gameTickRate;
const nearCollisionDistance = 72;
const chaoticEntityThreshold = 8;
const chaoticProjectileThreshold = 3;
const futureLevel = 5;
const missileWaveProjectileThreshold = 3;

const getStorage = (): Storage | null => {
  try {
    if (
      typeof localStorage === "undefined" ||
      typeof localStorage.getItem !== "function" ||
      typeof localStorage.setItem !== "function"
    ) {
      return null;
    }

    return localStorage;
  } catch {
    return null;
  }
};

const readStorage = (): AchievementState<AchievementId> => {
  const storage = getStorage();

  if (!storage) {
    return createAchievementState<AchievementId>();
  }

  try {
    const stored = JSON.parse(
      storage.getItem(achievementStorageKey) ?? "{}"
    ) as LegacyAchievementStorageState;
    const progress = {
      ...stored.progress,
      ...(stored.progress?.["quarter-master"] === undefined &&
      stored.counters?.continuesUsed !== undefined
        ? { "quarter-master": stored.counters.continuesUsed }
        : {}),
    };

    return createAchievementState<AchievementId>({
      progress,
      unlocked: stored.unlocked,
      unlockedAt: stored.unlockedAt,
    });
  } catch {
    return createAchievementState<AchievementId>();
  }
};

const createDefaultRunState = (): RunState => ({
  bossDefeatedAfterContinueUntilTick: 0,
  continuesUsed: 0,
  deathTicks: [],
  gameOverSeen: false,
  initialContinues: 0,
  initialLives: 3,
  lastRespawnTick: false,
  lowLifeStartedAtTick: false,
  nearGameOverSeen: false,
  playedAfterGameOver: false,
  runStartedAtTick: 0,
  usedContinue: false,
  usedEveryContinue: false,
});

/**
 * Tracks achievement criteria and persistence for real player runs.
 */
class AchievementSystem {
  private readonly context: GameDataStore;
  private era: EraState | undefined;
  private run: RunState = createDefaultRunState();
  private state: AchievementState<AchievementId>;
  private readonly waves = new Map<string, WaveState>();

  constructor(context: GameDataStore) {
    this.context = context;
    this.state = readStorage();
  }

  getUnlocked = (): AchievementId[] => [...this.state.unlocked];

  hasUnlocked = (id: AchievementId): boolean => this.state.unlocked.includes(id);

  getStatuses = (): AchievementStatus[] =>
    getEngineAchievementStatuses(
      achievementDefinitions,
      this.state
    ) as AchievementStatus[];

  onRunStarted = (playerData: PlayerData): void => {
    if (!this.canTrackAchievements()) {
      return;
    }

    const tick = this.getTicks();
    const previousRun = this.run;
    const startedAfterGameOver = previousRun.gameOverSeen;
    const startedAfterUsingEveryContinue = previousRun.usedEveryContinue;

    this.run = {
      ...createDefaultRunState(),
      initialContinues: playerData.continues,
      initialLives: playerData.lives,
      playedAfterGameOver: startedAfterGameOver,
      runStartedAtTick: tick,
    };
    this.startEra(playerData.level);

    this.unlock("we-have-lift-off");

    if (startedAfterGameOver) {
      this.unlock("one-more-run");
    }

    if (startedAfterGameOver && startedAfterUsingEveryContinue) {
      this.unlock("just-one-more-run");
    }
  };

  onContinueUsed = (remainingContinues: number): void => {
    if (!this.canTrackAchievements()) {
      return;
    }

    this.run.usedContinue = true;
    this.run.continuesUsed += 1;
    this.run.bossDefeatedAfterContinueUntilTick = this.getTicks() + immediateBossTicks;
    this.run.usedEveryContinue =
      this.run.initialContinues > 0 && remainingContinues <= 0;
    this.unlock("insert-coin");

    if (this.run.usedEveryContinue) {
      this.unlock("credit-feeder");
    }

    this.addProgress("quarter-master", 1);
  };

  onGameOver = (): void => {
    if (!this.canTrackAchievements()) {
      return;
    }

    this.run.gameOverSeen = true;
  };

  onRespawn = (): void => {
    if (!this.canTrackAchievements()) {
      return;
    }

    this.run.lastRespawnTick = this.getTicks();
  };

  onPlayerHit = (cause: PlayerHitCause, playerData: PlayerData): void => {
    if (!this.canTrackAchievements()) {
      return;
    }

    const tick = this.getTicks();

    this.run.deathTicks = [...this.run.deathTicks, tick].filter(
      (deathTick) => tick - deathTick <= threeStrikesTicks
    );

    if (this.era) {
      this.era.lostLifeEver = true;

      if (this.era.reachedOneLife) {
        this.era.lostLifeSinceOneLife = true;
      }
    }

    this.waves.forEach((wave) => {
      if (cause === "projectile") {
        wave.hitByProjectile = true;
      }
    });

    if (cause === "enemy") {
      this.unlock("pilot-error");
    }

    if (
      this.run.lastRespawnTick !== false &&
      tick - this.run.lastRespawnTick <= notAgainTicks
    ) {
      this.unlock("not-again");
    }

    if (
      this.run.initialLives >= 3 &&
      this.run.deathTicks.length >= 3 &&
      this.run.deathTicks[this.run.deathTicks.length - 1] -
        this.run.deathTicks[0] <= threeStrikesTicks
    ) {
      this.unlock("three-strikes");
    }

    this.trackLowLife(playerData);
  };

  onEnemyDestroyed = (details: {
    enemyData: EnemyData;
    playerData: PlayerData;
    source: "collision" | "playerBullet";
  }): void => {
    if (!this.canTrackAchievements()) {
      return;
    }

    if (details.enemyData.type === "boss") {
      this.onBossDefeated();
    }

    if (details.source !== "playerBullet") {
      return;
    }

    const distance = Math.hypot(
      details.enemyData.posX - details.playerData.posX,
      details.enemyData.posY - details.playerData.posY
    );

    if (distance <= nearCollisionDistance) {
      this.unlock("i-meant-to-do-that");
    }
  };

  onShootableProjectileDestroyed = (): void => {
    if (!this.canTrackAchievements()) {
      return;
    }

    this.unlock("you-can-do-that");
  };

  onWaveStarted = (formationId: string): void => {
    if (!this.canTrackAchievements()) {
      return;
    }

    this.waves.set(formationId, {
      hitByProjectile: false,
      missileProjectiles: 0,
      nonMissileProjectiles: 0,
      projectileCount: 0,
    });
  };

  onEnemyProjectileSpawned = (bulletData: Partial<BulletData>): void => {
    if (!this.canTrackAchievements()) {
      return;
    }

    this.waves.forEach((wave) => {
      wave.projectileCount += 1;

      if (bulletData.tracksPlayer && bulletData.sprite) {
        wave.missileProjectiles += 1;
        return;
      }

      wave.nonMissileProjectiles += 1;
    });
  };

  onWaveCompleted = (formationId: string): void => {
    if (!this.canTrackAchievements()) {
      return;
    }

    const wave = this.waves.get(formationId);

    if (!wave) {
      return;
    }

    if (wave.projectileCount > 0 && !wave.hitByProjectile) {
      this.unlock("professional-cloud-dodger");
    }

    if (
      wave.missileProjectiles >= missileWaveProjectileThreshold &&
      wave.nonMissileProjectiles === 0 &&
      !wave.hitByProjectile
    ) {
      this.unlock("oops-all-missiles");
    }

    this.waves.delete(formationId);
  };

  onLevelCompleted = (level: number, nextLevel: number, playerData: PlayerData): void => {
    if (!this.canTrackAchievements()) {
      return;
    }

    const finalLife = playerData.lives === 1;
    const wrappedToFirstLevel = nextLevel <= level;

    if (level === 1 && !this.era?.lostLifeEver) {
      this.unlock("the-wright-stuff");
    }

    if (finalLife) {
      this.unlock("last-chance");
    }

    if (this.run.nearGameOverSeen) {
      this.unlock("against-all-odds");
    }

    if (this.era?.reachedOneLife && !this.era.lostLifeSinceOneLife) {
      this.unlock("phoenix-pilot");
    }

    if (wrappedToFirstLevel && this.run.usedEveryContinue) {
      this.unlock("final-continue");
    }

    if (wrappedToFirstLevel && !this.run.usedContinue) {
      this.unlock("arcade-spirit");
    }

    this.startEra(nextLevel);
  };

  onLevelStarted = (level: number): void => {
    if (!this.canTrackAchievements()) {
      return;
    }

    if (level >= futureLevel && this.run.initialContinues <= 0) {
      this.unlock("no-safety-net");
    }
  };

  update = (): void => {
    if (!this.canTrackAchievements()) {
      return;
    }

    const playerData = this.context._player.getData();
    const tick = this.getTicks();

    if (!playerData.isAlive) {
      return;
    }

    this.trackLowLife(playerData);

    if (
      playerData.lives === 1 &&
      this.run.lowLifeStartedAtTick !== false &&
      tick - this.run.lowLifeStartedAtTick >= thisIsFineTicks
    ) {
      this.unlock("this-is-fine");
    }

    if (
      tick - this.run.runStartedAtTick >= oneHourTicks &&
      !this.context._isDemoMode
    ) {
      this.unlock("seriously-one-more-run");
    }

    if (playerData.lives === 1 && this.isScreenChaotic()) {
      this.unlock("still-alive-somehow");
    }
  };

  reset = (): void => {
    logger.warning("Resetting achievements");
    this.era = undefined;
    this.run = createDefaultRunState();
    this.state = createAchievementState<AchievementId>();
    this.waves.clear();

    try {
      getStorage()?.removeItem(achievementStorageKey);
    } catch {
      // Achievement persistence should never interrupt gameplay.
    }
  };

  private onBossDefeated = (): void => {
    if (this.getTicks() <= this.run.bossDefeatedAfterContinueUntilTick) {
      this.unlock("back-in-the-fight");
    }
  };

  private trackLowLife = (playerData: PlayerData): void => {
    if (playerData.lives !== 1) {
      this.run.lowLifeStartedAtTick = false;
      return;
    }

    if (this.run.lowLifeStartedAtTick === false) {
      this.run.lowLifeStartedAtTick = this.getTicks();
    }

    this.run.nearGameOverSeen = true;

    if (this.era && !this.era.reachedOneLife) {
      this.era.reachedOneLife = true;
      this.era.reachedOneLifeTick = this.getTicks();
      this.era.lostLifeSinceOneLife = false;
    }
  };

  private startEra = (level: number): void => {
    this.era = {
      level,
      lostLifeEver: false,
      lostLifeSinceOneLife: false,
      reachedOneLife: false,
      reachedOneLifeTick: false,
    };
    this.waves.clear();
  };

  private isScreenChaotic = (): boolean => {
    const enemies = this.context._enemies
      .getEntities()
      .filter((enemy) => enemy.isAlive && !enemy.removeMe).length;
    const projectiles = this.context._enemyBullets
      .getEntities()
      .filter((bullet) => !bullet.removeMe).length;

    return (
      enemies + projectiles >= chaoticEntityThreshold &&
      projectiles >= chaoticProjectileThreshold
    );
  };

  private getTicks = (): number => this.context._gameTicker.getTicks();

  private canTrackAchievements = (): boolean => !this.context._isDemoMode;

  private unlock = (id: AchievementId): void => {
    const result = unlockAchievement(this.state, id, Date.now());

    this.state = result.state;

    if (!result.unlocked) {
      return;
    }

    this.handleUnlocked(id);
    this.persist();
  };

  private addProgress = (id: AchievementId, amount: number): void => {
    const result = addAchievementProgress(
      achievementDefinitions,
      this.state,
      id,
      amount,
      Date.now()
    );

    this.state = result.state;

    if (result.unlocked) {
      this.handleUnlocked(id);
    }

    this.persist();
  };

  private handleUnlocked = (id: AchievementId): void => {
    logger.info("Achievement unlocked", { id });
    window.dispatchEvent(
      new CustomEvent("timePilot:achievementUnlocked", {
        detail: achievementDefinitions.find((achievement) => achievement.id === id),
      })
    );
  };

  private persist = (): void => {
    const storage = getStorage();

    if (!storage) {
      return;
    }

    try {
      storage.setItem(
        achievementStorageKey,
        JSON.stringify(this.state)
      );
    } catch {
      // Achievement persistence should never interrupt gameplay.
    }
  };
}

export default AchievementSystem;
