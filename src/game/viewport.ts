import { limits } from "./constants";
import type { GameArenaInstance } from "./types";

const spawnPadding = 96;
const despawnPadding = 160;

/**
 * Calculates the radius needed to cover the current viewport from its center.
 *
 * @param gameArena - Arena dimensions.
 * @returns Half of the viewport diagonal.
 */
export const getViewportRadius = (gameArena: Pick<GameArenaInstance, "height" | "width">): number => {
  return Math.hypot(gameArena.width, gameArena.height) / 2;
};

/**
 * Calculates the distance from center where entities can spawn safely off-screen.
 *
 * @param gameArena - Arena dimensions.
 * @returns Spawn radius using the larger of the configured minimum and viewport size.
 */
export const getSpawnRadius = (gameArena: Pick<GameArenaInstance, "height" | "width">): number => {
  return Math.max(
    limits.spawningRadius,
    getViewportRadius(gameArena) + spawnPadding
  );
};

/**
 * Scales entity budgets based on viewport area.
 *
 * @param gameArena - Arena dimensions.
 * @returns Area multiplier relative to the 800x600 reference viewport.
 */
export const getViewportAreaScale = (gameArena: Pick<GameArenaInstance, "height" | "width">): number => {
  return Math.max(1, (gameArena.width * gameArena.height) / (800 * 600));
};

/**
 * Applies viewport-area scaling to an entity limit.
 *
 * @param baseLimit - Limit for the reference viewport.
 * @param gameArena - Arena dimensions.
 * @returns Rounded-up scaled limit.
 */
export const getScaledEntityLimit = (baseLimit: number, gameArena: Pick<GameArenaInstance, "height" | "width">): number => {
  return Math.ceil(baseLimit * getViewportAreaScale(gameArena));
};

/**
 * Calculates the radius beyond which entities should be removed.
 *
 * @param gameArena - Arena dimensions.
 * @returns Despawn radius using the larger of the configured minimum and viewport size.
 */
export const getDespawnRadius = (gameArena: Pick<GameArenaInstance, "height" | "width">): number => {
  return Math.max(
    limits.despawnRadius,
    getViewportRadius(gameArena) + despawnPadding
  );
};
