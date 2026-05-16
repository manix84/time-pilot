import { logger } from "./logger";

export type StoredDataResetScope =
  | "achievements"
  | "all"
  | "preferences"
  | "scores";

const timePilotStoragePrefix = "timePilot.";
const scoreStorageKeyPattern =
  /^timePilot\.(?:bestScore|highScore|highScores|leaderboard|score|scores)/i;

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

export const resetStoredScores = (): void => {
  logger.warning("Resetting stored scores");
  removeMatchingKeys((key) => scoreStorageKeyPattern.test(key));
};

export const resetAllStoredTimePilotData = (): void => {
  logger.warning("Resetting all stored Time Pilot data");
  removeMatchingKeys((key) => key.startsWith(timePilotStoragePrefix));
};
