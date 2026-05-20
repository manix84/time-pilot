import type { RunStats } from "./types";

/**
 * Creates a fresh statistics object for a player run.
 */
export const createRunStats = (
  startedAtTick = 0,
  initialLevel = 1
): RunStats => ({
  bonusesCollected: 0,
  bossesDefeated: 0,
  continuesUsed: 0,
  enemiesDestroyed: 0,
  highestLevelReached: initialLevel,
  levelsCompleted: 0,
  livesLost: 0,
  loops: 0,
  nearMisses: 0,
  playerEnemyCollisions: 0,
  playerProjectileHits: 0,
  restarts: 0,
  shootableProjectilesDestroyed: 0,
  shotsFired: 0,
  shotsHit: 0,
  startedAtTick,
});

/**
 * Returns true when an unknown value has the persisted run-stat shape.
 */
export const isRunStats = (value: unknown): value is RunStats => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const stats = value as Partial<RunStats>;

  return (
    typeof stats.bonusesCollected === "number" &&
    typeof stats.bossesDefeated === "number" &&
    typeof stats.continuesUsed === "number" &&
    typeof stats.enemiesDestroyed === "number" &&
    typeof stats.highestLevelReached === "number" &&
    typeof stats.levelsCompleted === "number" &&
    typeof stats.livesLost === "number" &&
    typeof stats.playerEnemyCollisions === "number" &&
    typeof stats.playerProjectileHits === "number" &&
    typeof stats.shootableProjectilesDestroyed === "number" &&
    typeof stats.shotsFired === "number" &&
    typeof stats.shotsHit === "number" &&
    typeof stats.startedAtTick === "number"
  );
};

/**
 * Sanitizes restored run statistics so corrupted storage cannot leak into UI.
 */
export const normalizeRunStats = (
  stats: Partial<RunStats>,
  fallback = createRunStats()
): RunStats => ({
  bonusesCollected: nonNegativeInteger(stats.bonusesCollected, fallback.bonusesCollected),
  bossesDefeated: nonNegativeInteger(stats.bossesDefeated, fallback.bossesDefeated),
  continuesUsed: nonNegativeInteger(stats.continuesUsed, fallback.continuesUsed),
  enemiesDestroyed: nonNegativeInteger(
    stats.enemiesDestroyed,
    fallback.enemiesDestroyed
  ),
  highestLevelReached: nonNegativeInteger(
    stats.highestLevelReached,
    fallback.highestLevelReached
  ),
  levelsCompleted: nonNegativeInteger(stats.levelsCompleted, fallback.levelsCompleted),
  livesLost: nonNegativeInteger(stats.livesLost, fallback.livesLost),
  loops: nonNegativeInteger(stats.loops, fallback.loops),
  nearMisses: nonNegativeInteger(stats.nearMisses, fallback.nearMisses),
  playerEnemyCollisions: nonNegativeInteger(
    stats.playerEnemyCollisions,
    fallback.playerEnemyCollisions
  ),
  playerProjectileHits: nonNegativeInteger(
    stats.playerProjectileHits,
    fallback.playerProjectileHits
  ),
  restarts: nonNegativeInteger(stats.restarts, fallback.restarts),
  shootableProjectilesDestroyed: nonNegativeInteger(
    stats.shootableProjectilesDestroyed,
    fallback.shootableProjectilesDestroyed
  ),
  shotsFired: nonNegativeInteger(stats.shotsFired, fallback.shotsFired),
  shotsHit: nonNegativeInteger(
    Math.min(stats.shotsHit, stats.shotsFired),
    fallback.shotsHit
  ),
  startedAtTick: nonNegativeInteger(stats.startedAtTick, fallback.startedAtTick),
});

const nonNegativeInteger = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : fallback;
