import {
  removeScoreStorageKeys,
  removeStorageNamespace,
} from "arcade-engine";
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
 * Removes stored score and leaderboard data.
 */
export const resetStoredScores = (): void => {
  logger.warning("Resetting stored scores");
  removeScoreStorageKeys(timePilotStoragePrefix, {
    onError: (error) => logger.error("Failed to remove stored score keys", { error }),
  });
};

/**
 * Removes every Time Pilot localStorage entry.
 */
export const resetAllStoredTimePilotData = (): void => {
  logger.warning("Resetting all stored Time Pilot data");
  removeStorageNamespace(timePilotStoragePrefix, {
    onError: (error) => logger.error("Failed to remove stored data keys", { error }),
  });
};
