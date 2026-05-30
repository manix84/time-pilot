import { limits } from "./constants";
import {
  getScaledViewportLimit,
  getViewportAreaScale as getEngineViewportAreaScale,
  getViewportPaddedRadius,
  getViewportRadius,
} from "./engine";
import type { GameArenaInstance, ViewportDimensions } from "./types";

const spawnPadding = 96;
const despawnPadding = 160;

export { getViewportRadius } from "./engine";

/**
 * Calculates the distance from center where entities can spawn safely off-screen.
 *
 * @param gameArena - Arena dimensions.
 * @returns Spawn radius using the larger of the configured minimum and viewport size.
 */
export const getSpawnRadius = (gameArena: ViewportDimensions): number => {
  return getViewportPaddedRadius(gameArena, {
    minRadius: limits.spawningRadius,
    padding: spawnPadding,
  });
};

/**
 * Scales entity budgets based on viewport area.
 *
 * @param gameArena - Arena dimensions.
 * @returns Area multiplier relative to the 800x600 reference viewport.
 */
export const getViewportAreaScale = (gameArena: ViewportDimensions): number =>
  getEngineViewportAreaScale(gameArena);

/**
 * Applies viewport-area scaling to an entity limit.
 *
 * @param baseLimit - Limit for the reference viewport.
 * @param gameArena - Arena dimensions.
 * @returns Rounded-up scaled limit.
 */
export const getScaledEntityLimit = (
  baseLimit: number,
  gameArena: ViewportDimensions
): number => getScaledViewportLimit(baseLimit, gameArena);

/**
 * Calculates the radius beyond which entities should be removed.
 *
 * @param gameArena - Arena dimensions.
 * @returns Despawn radius using the larger of the configured minimum and viewport size.
 */
export const getDespawnRadius = (
  gameArena: Pick<GameArenaInstance, "height" | "width">
): number => {
  return getViewportPaddedRadius(gameArena, {
    minRadius: limits.despawnRadius,
    padding: despawnPadding,
  });
};
