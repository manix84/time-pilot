import { limits } from "./constants";
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
  return Math.max(
    limits.spawningRadius,
    getViewportRadius(gameArena) + spawnPadding
  );
}

export function getViewportAreaScale(
  gameArena: Pick<GameArenaInstance, "height" | "width">
): number {
  return Math.max(1, (gameArena.width * gameArena.height) / (800 * 600));
}

export function getScaledEntityLimit(
  baseLimit: number,
  gameArena: Pick<GameArenaInstance, "height" | "width">
): number {
  return Math.ceil(baseLimit * getViewportAreaScale(gameArena));
}

export function getDespawnRadius(
  gameArena: Pick<GameArenaInstance, "height" | "width">
): number {
  return Math.max(
    limits.despawnRadius,
    getViewportRadius(gameArena) + despawnPadding
  );
}
