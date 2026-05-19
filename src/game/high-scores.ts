import type { HighScoreEntry } from "./types";

type HighScoreSyncState = "local" | "pending" | "synced";

interface HighScoreRunReceipt {
  issuedAt: number;
  runId: string;
  token: string;
}

interface StoredHighScoreEntry extends HighScoreEntry {
  receivedAt?: number;
  run?: HighScoreRunReceipt;
  submittedAt: number;
  syncState: HighScoreSyncState;
}

const highScoreStorageKey = "timePilot.highScores";
const highScoreApiBasePath = "/api/high-scores";
const maxHighScoreStats = 12;
const maxStoredHighScores = 10;
const maxCachedHighScores = 50;

/**
 * Placeholder high-score table used until remote score storage exists.
 *
 * The names are intentionally silly so players do not mistake them for real
 * submitted scores.
 */
export const fakeHighScores: HighScoreEntry[] = [
  {
    id: "shooty-mcshootface",
    name: "Shooty McShootface",
    score: 1000000,
    stats: ["Era: 2001", "Bosses: 5", "Continues: 0", "Accuracy: suspicious"],
  },
  {
    id: "captain-definitely-real",
    name: "Captain Definitely Real",
    score: 875500,
    stats: ["Era: 1982", "Bosses: 4", "Lives left: 1", "Clouds dodged: all"],
  },
  {
    id: "pewpew-von-laser",
    name: "PewPew von Laser",
    score: 742250,
    stats: ["Era: 1970", "Missiles annoyed: 312", "Continues: 1"],
  },
  {
    id: "baron-von-biplane",
    name: "Baron von Biplane",
    score: 501910,
    stats: ["Era: 1940", "Loops: too many", "Near misses: 88"],
  },
  {
    id: "not-a-bot-9000",
    name: "Not A Bot 9000",
    score: 404404,
    stats: ["Era: 1910", "Inputs: perfectly normal", "Snacks: 3"],
  },
  {
    id: "debug-dave",
    name: "Debug Dave",
    score: 123456,
    stats: ["Era: 1910", "Hitboxes blamed: yes", "Restart count: private"],
  },
  {
    id: "loop-de-loop-lou",
    name: "Loop-de-Loop Lou",
    score: 98765,
    stats: ["Era: 1910", "Loops: 42", "Near misses: 0", "Dignity: optional"],
  },
  {
    id: "captain-one-more",
    name: "Captain One More",
    score: 76543,
    stats: ["Era: 1910", "Restarts: 9", "Continues: 3", "Sleep: none"],
  },
  {
    id: "miss-by-a-mile",
    name: "Missed By A Pixel",
    score: 54321,
    stats: ["Era: 1910", "Near misses: 128", "Luck: suspicious"],
  },
  {
    id: "keyboard-karen",
    name: "Keyboard Karen",
    score: 1910,
    stats: ["Era: 1910", "Complaints filed: 12", "Clouds blamed: yes"],
  },
];

/**
 * Reads player-submitted high scores from local storage.
 */
export const loadStoredHighScores = (): HighScoreEntry[] => {
  return loadStoredScoreRecords()
    .sort(sortHighScores)
    .slice(0, maxStoredHighScores)
    .map(toHighScoreEntry);
};

/**
 * Combines locally saved scores with the fake default table.
 */
export const getHighScores = (): HighScoreEntry[] =>
  [...loadStoredHighScores(), ...fakeHighScores]
    .sort(sortHighScores)
    .slice(0, maxStoredHighScores);

/**
 * Starts a remotely verifiable high-score run when the API is available.
 */
export const startHighScoreRun = async (): Promise<HighScoreRunReceipt | null> => {
  try {
    const response = await fetch(`${highScoreApiBasePath}/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        gameVersion: getGameVersion(),
        startedAt: Date.now(),
      }),
    });

    if (!response.ok) {
      return null;
    }

    const receipt = (await response.json()) as Partial<HighScoreRunReceipt>;

    if (!isHighScoreRunReceipt(receipt)) {
      return null;
    }

    return receipt;
  } catch {
    return null;
  }
};

/**
 * Persists a newly submitted high score locally.
 */
export const saveHighScore = (
  name: string,
  score: number,
  stats: string[],
  run?: HighScoreRunReceipt | null
): HighScoreEntry => {
  const entry: StoredHighScoreEntry = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: normalizeHighScoreName(name),
    run: run ?? undefined,
    score: Math.max(0, Math.floor(score)),
    stats: stats.slice(0, maxHighScoreStats),
    submittedAt: Date.now(),
    syncState: run ? "pending" : "local",
  };
  const storedScores = upsertScoreRecords(loadStoredScoreRecords(), [entry])
    .sort(sortHighScores)
    .slice(0, maxCachedHighScores);

  saveStoredScoreRecords(storedScores);
  void syncHighScores();

  return toHighScoreEntry(entry);
};

/**
 * Best-effort two-way sync between local high scores and the remote API.
 */
export const syncHighScores = async (): Promise<void> => {
  await submitPendingScores();
  await pullRemoteScores();
};

/**
 * Produces the short arcade-style name stored with a submitted score.
 */
export const normalizeHighScoreName = (name: string): string => {
  const normalized = name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 .'_-]/gi, "")
    .slice(0, 16);

  return normalized || "PILOT";
};

const sortHighScores = (left: HighScoreEntry, right: HighScoreEntry): number =>
  right.score - left.score || left.name.localeCompare(right.name);

const loadStoredScoreRecords = (): StoredHighScoreEntry[] => {
  const storage = getStorage();
  const storedScores = storage?.getItem(highScoreStorageKey);

  if (!storedScores) {
    return [];
  }

  try {
    const parsed = JSON.parse(storedScores);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(isHighScoreEntry)
      .map(normalizeStoredEntry)
      .sort(sortHighScores)
      .slice(0, maxCachedHighScores);
  } catch {
    return [];
  }
};

const saveStoredScoreRecords = (entries: StoredHighScoreEntry[]): void => {
  getStorage()?.setItem(
    highScoreStorageKey,
    JSON.stringify(entries.sort(sortHighScores).slice(0, maxCachedHighScores))
  );
};

const submitPendingScores = async (): Promise<void> => {
  const records = loadStoredScoreRecords();
  let changed = false;

  for (const record of records) {
    if (record.syncState !== "pending") {
      continue;
    }

    if (!record.run) {
      record.syncState = "local";
      changed = true;
      continue;
    }

    try {
      const response = await fetch(highScoreApiBasePath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entry: toHighScoreEntry(record),
          gameVersion: getGameVersion(),
          run: record.run,
          submittedAt: record.submittedAt,
        }),
      });

      if (!response.ok) {
        continue;
      }

      const remoteEntry = (await response.json()) as Partial<StoredHighScoreEntry>;

      if (!isHighScoreEntry(remoteEntry)) {
        continue;
      }

      const storedRemoteEntry = remoteEntry as HighScoreEntry &
        Partial<StoredHighScoreEntry>;

      record.id = storedRemoteEntry.id;
      record.name = storedRemoteEntry.name;
      record.score = Math.max(0, Math.floor(storedRemoteEntry.score));
      record.stats = storedRemoteEntry.stats.slice(0, maxHighScoreStats);
      record.receivedAt = storedRemoteEntry.receivedAt ?? Date.now();
      record.syncState = "synced";
      changed = true;
    } catch {
      return;
    }
  }

  if (changed) {
    saveStoredScoreRecords(records);
  }
};

const pullRemoteScores = async (): Promise<void> => {
  try {
    const response = await fetch(highScoreApiBasePath);

    if (!response.ok) {
      return;
    }

    const remoteScores = (await response.json()) as unknown;

    if (!Array.isArray(remoteScores)) {
      return;
    }

    const remoteRecords = remoteScores
      .filter(isHighScoreEntry)
      .map((entry) => {
        const remoteEntry = entry as HighScoreEntry &
          Partial<StoredHighScoreEntry>;

        return normalizeStoredEntry({
          ...remoteEntry,
          receivedAt:
            typeof remoteEntry.receivedAt === "number"
              ? remoteEntry.receivedAt
              : Date.now(),
          submittedAt:
            typeof remoteEntry.submittedAt === "number"
              ? remoteEntry.submittedAt
              : Date.now(),
          syncState: "synced",
        });
      });

    saveStoredScoreRecords(
      upsertScoreRecords(loadStoredScoreRecords(), remoteRecords)
    );
  } catch {
    // Offline-first sync is intentionally best effort.
  }
};

const upsertScoreRecords = (
  current: StoredHighScoreEntry[],
  incoming: StoredHighScoreEntry[]
): StoredHighScoreEntry[] => {
  const byId = new Map(current.map((entry) => [entry.id, entry]));

  incoming.forEach((entry) => {
    byId.set(entry.id, entry);
  });

  return [...byId.values()];
};

const normalizeStoredEntry = (
  entry: HighScoreEntry | StoredHighScoreEntry
): StoredHighScoreEntry => {
  const stored = entry as Partial<StoredHighScoreEntry>;

  return {
    id: entry.id,
    name: normalizeHighScoreName(entry.name),
    receivedAt:
      typeof stored.receivedAt === "number" ? stored.receivedAt : undefined,
    run: isHighScoreRunReceipt(stored.run) ? stored.run : undefined,
    score: Math.max(0, Math.floor(entry.score)),
    stats: entry.stats.slice(0, maxHighScoreStats),
    submittedAt:
      typeof stored.submittedAt === "number" ? stored.submittedAt : Date.now(),
    syncState: normalizeSyncState(stored.syncState, stored.run),
  };
};

const normalizeSyncState = (
  syncState: unknown,
  run: unknown
): HighScoreSyncState => {
  if (
    syncState === "local" ||
    syncState === "pending" ||
    syncState === "synced"
  ) {
    return syncState;
  }

  return isHighScoreRunReceipt(run) ? "pending" : "local";
};

const toHighScoreEntry = (entry: HighScoreEntry): HighScoreEntry => ({
  id: entry.id,
  name: entry.name,
  score: entry.score,
  stats: entry.stats,
});

const getStorage = (): Storage | null => {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
};

const getGameVersion = (): string => {
  if (typeof __TIME_PILOT_VERSION__ === "undefined") {
    return "dev";
  }

  return __TIME_PILOT_VERSION__;
};

const isHighScoreRunReceipt = (
  value: unknown
): value is HighScoreRunReceipt => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const receipt = value as Partial<HighScoreRunReceipt>;

  return (
    typeof receipt.issuedAt === "number" &&
    typeof receipt.runId === "string" &&
    typeof receipt.token === "string"
  );
};

const isHighScoreEntry = (value: unknown): value is HighScoreEntry => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<HighScoreEntry>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.score === "number" &&
    Array.isArray(candidate.stats) &&
    candidate.stats.every((stat) => typeof stat === "string")
  );
};
