import CONSTS from "./constants";
import type { GameArenaInstance } from "./types";

const spawnPadding = 96;
const despawnPadding = 160;

export function getViewportRadius(
  gameArena: Pick<GameArenaInstance, "height" | "width">
): number {
  return Math.hypot(gameArena.width, gameArena.height) / 2;
}

export function getSpawnRadius(
  gameArena: Pick<GameArenaInstance, "height" | "width">
): number {
  return Math.max(CONSTS.limits.spawningRadius, getViewportRadius(gameArena) + spawnPadding);
}

export function getDespawnRadius(
  gameArena: Pick<GameArenaInstance, "height" | "width">
): number {
  return Math.max(
    CONSTS.limits.despawnRadius,
    getViewportRadius(gameArena) + despawnPadding
  );
}
