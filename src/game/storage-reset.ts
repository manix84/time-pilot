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
  } catch {
    // Debug reset tools should never interrupt the running game.
  }
};

export const resetStoredScores = (): void => {
  removeMatchingKeys((key) => scoreStorageKeyPattern.test(key));
};

export const resetAllStoredTimePilotData = (): void => {
  removeMatchingKeys((key) => key.startsWith(timePilotStoragePrefix));
};
