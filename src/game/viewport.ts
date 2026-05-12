import { limits } from "./constants";
import type { GameArenaInstance } from "./types";

const spawnPadding = 96;
const despawnPadding = 160;

export const getViewportRadius = (gameArena: Pick<GameArenaInstance, "height" | "width">): number => {
  return Math.hypot(gameArena.width, gameArena.height) / 2;
};

export const getSpawnRadius = (gameArena: Pick<GameArenaInstance, "height" | "width">): number => {
  return Math.max(
    limits.spawningRadius,
    getViewportRadius(gameArena) + spawnPadding
  );
};

export const getViewportAreaScale = (gameArena: Pick<GameArenaInstance, "height" | "width">): number => {
  return Math.max(1, (gameArena.width * gameArena.height) / (800 * 600));
};

export const getScaledEntityLimit = (baseLimit: number, gameArena: Pick<GameArenaInstance, "height" | "width">): number => {
  return Math.ceil(baseLimit * getViewportAreaScale(gameArena));
};

export const getDespawnRadius = (gameArena: Pick<GameArenaInstance, "height" | "width">): number => {
  return Math.max(
    limits.despawnRadius,
    getViewportRadius(gameArena) + despawnPadding
  );
};
