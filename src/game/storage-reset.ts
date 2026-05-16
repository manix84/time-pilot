import { logger } from "./logger";

/**
 * Stored-data groups that can be wiped from the debug reset menu.
 */
export type StoredDataResetScope =
  | "achievements"
  | "all"
  | "preferences"
  | "scores";

/**
 * Local storage namespace used by the game.
 */
const timePilotStoragePrefix = "timePilot.";

/**
 * Storage keys that represent score-like data.
 */
const scoreStorageKeyPattern =
  /^timePilot\.(?:bestScore|highScore|highScores|leaderboard|score|scores)/i;

/**
 * Gets localStorage when it is available and safe to touch.
 *
 * Some browser privacy modes and embedded contexts throw on storage access, so
 * debug reset tools must handle storage as optional.
 *
 * @returns The current localStorage object, or null when unavailable.
 */
const getStorage = (): Storage | null => {
  try {
    if (
      typeof localStorage === "undefined" ||
      typeof localStorage.length !== "number" ||
      typeof localStorage.key !== "function" ||
      typeof localStorage.removeItem !== "function"
    ) {
      return null;
    }

    return localStorage;
  } catch {
    return null;
  }
};

/**
 * Removes every localStorage key that matches a predicate.
 *
 * @param matches - Predicate used to decide which keys should be removed.
 */
const removeMatchingKeys = (matches: (key: string) => boolean): void => {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    const keys = Array.from({ length: storage.length }, (_, index) =>
      storage.key(index)
    ).filter((key): key is string => !!key && matches(key));

    keys.forEach((key) => storage.removeItem(key));
  } catch (error) {
    logger.error("Failed to remove stored data keys", { error });
    // Debug reset tools should never interrupt the running game.
  }
};

/**
 * Removes stored score and leaderboard data.
 */
export const resetStoredScores = (): void => {
  logger.warning("Resetting stored scores");
  removeMatchingKeys((key) => scoreStorageKeyPattern.test(key));
};

/**
 * Removes every Time Pilot localStorage entry.
 */
export const resetAllStoredTimePilotData = (): void => {
  logger.warning("Resetting all stored Time Pilot data");
  removeMatchingKeys((key) => key.startsWith(timePilotStoragePrefix));
};
