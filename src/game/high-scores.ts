import type { HighScoreEntry, HighScoreSyncStatus } from "./types";

type HighScoreSyncState = "local" | "pending" | "synced";

interface HighScoreRunReceipt {
  issuedAt: number;
  runId: string;
  token: string;
}

interface StoredHighScoreEntry extends HighScoreEntry {
  integrity?: HighScoreIntegrity;
  receivedAt?: number;
  run?: HighScoreRunReceipt;
  submittedAt: number;
  syncState: HighScoreSyncState;
}

interface HighScoreIntegrity {
  checksum: string;
  multiplier: number;
  scoreProduct: number;
  statsProduct: number;
  version: 1;
}

const highScoreStorageKey = "timePilot.highScores";
const highScoreApiBasePath = "/api/high-scores";
const highScoreApiTimeoutMs = 2500;
const highScoreApiProbeIntervalMs = 30000;
const highScoreSyncSuccessDisplayMs = 2500;
const fakeHighScoreBaseCreatedAt = Date.UTC(2012, 8, 13);
const highScoreIntegrityVersion = 1;
const highScoreIntegrityHashModulo = 1000003;
const highScoreIntegrityMinMultiplier = 101;
const highScoreIntegrityMultiplierRange = 897;
const maxHighScoreStats = 12;
const maxStoredHighScores = 10;
const maxCachedHighScores = 50;
let highScoreApiOffline = false;
let highScoreApiProbeInFlight = false;
let highScoreApiLastProbeAt = 0;
let highScoreSyncStatus: HighScoreSyncStatus | null = "waiting";
let highScoreSyncStatusChangedAt = Date.now();

/**
 * Returns the latest high-score save/sync status for menu indicators.
 */
export const getHighScoreSyncStatus = (): HighScoreSyncStatus | null => {
  queueHighScoreApiProbe();

  if (
    highScoreSyncStatus === "success" &&
    Date.now() - highScoreSyncStatusChangedAt >= highScoreSyncSuccessDisplayMs
  ) {
    return "waiting";
  }

  return highScoreSyncStatus;
};

const queueHighScoreApiProbe = (): void => {
  if (
    highScoreSyncStatus !== "error" ||
    !highScoreApiOffline ||
    highScoreApiProbeInFlight ||
    isApiDisabledByConfig()
  ) {
    return;
  }

  const now = Date.now();

  if (now - highScoreApiLastProbeAt < highScoreApiProbeIntervalMs) {
    return;
  }

  highScoreApiLastProbeAt = now;
  highScoreApiProbeInFlight = true;
  void syncHighScores().finally(() => {
    highScoreApiProbeInFlight = false;
  });
};

const setHighScoreSyncStatus = (status: HighScoreSyncStatus | null): void => {
  if (highScoreSyncStatus === status) {
    return;
  }

  highScoreSyncStatus = status;
  highScoreSyncStatusChangedAt = Date.now();
};

/**
 * Placeholder high-score table used until remote score storage exists.
 *
 * The names are intentionally silly so players do not mistake them for real
 * submitted scores.
 */
export const fakeHighScores: HighScoreEntry[] = [
  {
    createdAt: fakeHighScoreBaseCreatedAt,
    id: "shooty-mcshootface",
    name: "Shooty McShootface",
    score: 1000000,
    stats: ["Era: 2001", "Bosses: 5", "Continues: 0", "Accuracy: suspicious"],
  },
  {
    createdAt: fakeHighScoreBaseCreatedAt + 86400000,
    id: "captain-definitely-real",
    name: "Captain Definitely Real",
    score: 875500,
    stats: ["Era: 1982", "Bosses: 4", "Lives left: 1", "Clouds dodged: all"],
  },
  {
    createdAt: fakeHighScoreBaseCreatedAt + 86400000 * 2,
    id: "pewpew-von-laser",
    name: "PewPew von Laser",
    score: 742250,
    stats: ["Era: 1970", "Missiles annoyed: 312", "Continues: 1"],
  },
  {
    createdAt: fakeHighScoreBaseCreatedAt + 86400000 * 3,
    id: "baron-von-biplane",
    name: "Baron von Biplane",
    score: 501910,
    stats: ["Era: 1940", "Loops: too many", "Near misses: 88"],
  },
  {
    createdAt: fakeHighScoreBaseCreatedAt + 86400000 * 4,
    id: "not-a-bot-9000",
    name: "Not A Bot 9000",
    score: 404404,
    stats: ["Era: 1910", "Inputs: perfectly normal", "Snacks: 3"],
  },
  {
    createdAt: fakeHighScoreBaseCreatedAt + 86400000 * 5,
    id: "debug-dave",
    name: "Debug Dave",
    score: 123456,
    stats: ["Era: 1910", "Hitboxes blamed: yes", "Restart count: private"],
  },
  {
    createdAt: fakeHighScoreBaseCreatedAt + 86400000 * 6,
    id: "loop-de-loop-lou",
    name: "Loop-de-Loop Lou",
    score: 98765,
    stats: ["Era: 1910", "Loops: 42", "Near misses: 0", "Dignity: optional"],
  },
  {
    createdAt: fakeHighScoreBaseCreatedAt + 86400000 * 7,
    id: "captain-one-more",
    name: "Captain One More",
    score: 76543,
    stats: ["Era: 1910", "Restarts: 9", "Continues: 3", "Sleep: none"],
  },
  {
    createdAt: fakeHighScoreBaseCreatedAt + 86400000 * 8,
    id: "miss-by-a-mile",
    name: "Missed By A Pixel",
    score: 54321,
    stats: ["Era: 1910", "Near misses: 128", "Luck: suspicious"],
  },
  {
    createdAt: fakeHighScoreBaseCreatedAt + 86400000 * 9,
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
  [
    ...loadStoredHighScores(),
    ...fakeHighScores.slice(0, maxStoredHighScores),
  ].slice(0, maxStoredHighScores);

/**
 * Returns true leaderboard entries sorted by score for award thresholds.
 */
export const getHighScoreThresholds = (limit: number): HighScoreEntry[] =>
  [...loadStoredHighScores(), ...fakeHighScores]
    .sort(sortHighScores)
    .slice(0, Math.max(0, Math.floor(limit)));

/**
 * Starts a remotely verifiable high-score run when the API is available.
 */
export const startHighScoreRun = async (): Promise<HighScoreRunReceipt | null> => {
  if (!canUseHighScoreApi()) {
    setHighScoreSyncStatus("error");
    return null;
  }

  setHighScoreSyncStatus("syncing");

  try {
    const response = await fetchHighScoreApi("/runs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        gameVersion: getGameVersion(),
        startedAt: Date.now(),
      }),
    });

    if (!response?.ok) {
      markHighScoreApiOffline();
      setHighScoreSyncStatus("error");
      return null;
    }

    const receipt = (await response.json()) as Partial<HighScoreRunReceipt>;

    if (!isHighScoreRunReceipt(receipt)) {
      markHighScoreApiOffline();
      setHighScoreSyncStatus("error");
      return null;
    }

    highScoreApiOffline = false;
    setHighScoreSyncStatus("success");
    return receipt;
  } catch {
    markHighScoreApiOffline();
    setHighScoreSyncStatus("error");
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
  const shouldSync = Boolean(run && canUseHighScoreApi());

  setHighScoreSyncStatus(shouldSync ? "syncing" : "waiting");
  const createdAt = Date.now();
  const entry: StoredHighScoreEntry = {
    createdAt,
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: normalizeHighScoreName(name),
    run: shouldSync ? run ?? undefined : undefined,
    score: Math.max(0, Math.floor(score)),
    stats: stats.slice(0, maxHighScoreStats),
    submittedAt: createdAt,
    syncState: shouldSync ? "pending" : "local",
  };

  if (shouldSync && entry.run) {
    entry.integrity = createHighScoreIntegrity(entry, entry.run);
  }

  const storedScores = trimStoredScoreRecords(
    upsertScoreRecords(loadStoredScoreRecords(), [entry])
  );

  saveStoredScoreRecords(storedScores);
  void syncHighScores();

  return toHighScoreEntry(entry);
};

/**
 * Best-effort two-way sync between local high scores and the remote API.
 */
export const syncHighScores = async (): Promise<void> => {
  if (!canUseHighScoreApi()) {
    markHighScoreApiOffline();
    setHighScoreSyncStatus("error");
    return;
  }

  setHighScoreSyncStatus("syncing");
  const submitted = await submitPendingScores();
  const pulled = await pullRemoteScores();
  const synced = submitted && pulled && !hasPendingScores();

  if (synced) {
    highScoreApiOffline = false;
  } else {
    markHighScoreApiOffline();
  }
  setHighScoreSyncStatus(synced ? "success" : "error");
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
  right.score - left.score ||
  left.createdAt - right.createdAt ||
  left.name.localeCompare(right.name);

const loadStoredScoreRecords = (): StoredHighScoreEntry[] => {
  try {
    const storage = getStorage();
    const storedScores = storage?.getItem(highScoreStorageKey);

    if (!storedScores) {
      return [];
    }

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
  try {
    getStorage()?.setItem(
      highScoreStorageKey,
      JSON.stringify(trimStoredScoreRecords(entries))
    );
  } catch {
    // High-score persistence is best effort; gameplay should keep running.
  }
};

const submitPendingScores = async (): Promise<boolean> => {
  if (!canUseHighScoreApi()) {
    return !hasPendingScores();
  }

  const records = loadStoredScoreRecords();
  let changed = false;
  let completed = true;

  for (const record of records) {
    if (record.syncState !== "pending") {
      continue;
    }

    if (!record.run) {
      record.syncState = "local";
      changed = true;
      continue;
    }

    if (!record.integrity) {
      record.integrity = createHighScoreIntegrity(record, record.run);
      changed = true;
    } else if (!isValidHighScoreIntegrity(record, record.run)) {
      record.integrity = undefined;
      record.run = undefined;
      record.syncState = "local";
      changed = true;
      continue;
    }

    try {
      const response = await fetchHighScoreApi("", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entry: toHighScoreEntry(record),
          gameVersion: getGameVersion(),
          integrity: record.integrity,
          run: record.run,
          submittedAt: record.submittedAt,
        }),
      });

      if (!response) {
        completed = false;
        break;
      }

      if (isTerminalSyncRejection(response.status)) {
        record.integrity = undefined;
        record.syncState = "local";
        record.run = undefined;
        changed = true;
        continue;
      }

      if (!response.ok) {
        completed = false;
        break;
      }

      const remoteEntry = (await response.json()) as Partial<StoredHighScoreEntry>;

      if (!isHighScoreEntry(remoteEntry)) {
        continue;
      }

      const storedRemoteEntry = remoteEntry as HighScoreEntry &
        Partial<StoredHighScoreEntry>;

      record.id = storedRemoteEntry.id;
      record.createdAt = storedRemoteEntry.createdAt;
      record.name = storedRemoteEntry.name;
      record.score = Math.max(0, Math.floor(storedRemoteEntry.score));
      record.stats = storedRemoteEntry.stats.slice(0, maxHighScoreStats);
      record.integrity = undefined;
      record.receivedAt = storedRemoteEntry.receivedAt ?? Date.now();
      record.run = undefined;
      record.syncState = "synced";
      changed = true;
    } catch {
      completed = false;
      break;
    }
  }

  if (changed) {
    saveStoredScoreRecords(records);
  }

  return completed;
};

const pullRemoteScores = async (): Promise<boolean> => {
  if (!canUseHighScoreApi()) {
    return true;
  }

  try {
    const response = await fetchHighScoreApi();

    if (!response?.ok) {
      return false;
    }

    const remoteScores = (await response.json()) as unknown;

    if (!Array.isArray(remoteScores)) {
      return false;
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

    return true;
  } catch {
    // Offline-first sync is intentionally best effort.
    return false;
  }
};

const hasPendingScores = (): boolean =>
  loadStoredScoreRecords().some((record) => record.syncState === "pending");

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

const trimStoredScoreRecords = (
  entries: StoredHighScoreEntry[]
): StoredHighScoreEntry[] => {
  const pending = entries
    .filter((entry) => entry.syncState === "pending")
    .sort(sortHighScores);
  const cached = entries
    .filter((entry) => entry.syncState !== "pending")
    .sort(sortHighScores)
    .slice(0, Math.max(0, maxCachedHighScores - pending.length));

  return [...pending, ...cached].slice(0, maxCachedHighScores);
};

const normalizeStoredEntry = (
  entry: HighScoreEntry | StoredHighScoreEntry
): StoredHighScoreEntry => {
  const stored = entry as Partial<StoredHighScoreEntry>;

  return {
    id: entry.id,
    createdAt:
      typeof stored.createdAt === "number"
        ? stored.createdAt
        : typeof stored.submittedAt === "number"
          ? stored.submittedAt
          : Date.now(),
    name: normalizeHighScoreName(entry.name),
    receivedAt:
      typeof stored.receivedAt === "number" ? stored.receivedAt : undefined,
    run: isHighScoreRunReceipt(stored.run) ? stored.run : undefined,
    score: Math.max(0, Math.floor(entry.score)),
    stats: entry.stats.slice(0, maxHighScoreStats),
    integrity: isHighScoreIntegrity(stored.integrity)
      ? stored.integrity
      : undefined,
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

const isTerminalSyncRejection = (status: number): boolean =>
  status === 401 || status === 422;

const createHighScoreIntegrity = (
  entry: HighScoreEntry & Pick<StoredHighScoreEntry, "submittedAt">,
  run: HighScoreRunReceipt
): HighScoreIntegrity => {
  const multiplier =
    highScoreIntegrityMinMultiplier +
    Math.floor(Math.random() * highScoreIntegrityMultiplierRange);
  const scoreProduct = Math.max(0, Math.floor(entry.score)) * multiplier;
  const statsProduct =
    (hashText(entry.stats.join("\n")) % highScoreIntegrityHashModulo) *
    multiplier;

  return {
    checksum: createHighScoreIntegrityChecksum(
      entry,
      run,
      multiplier,
      scoreProduct,
      statsProduct
    ),
    multiplier,
    scoreProduct,
    statsProduct,
    version: highScoreIntegrityVersion,
  };
};

const isValidHighScoreIntegrity = (
  entry: HighScoreEntry & Pick<StoredHighScoreEntry, "integrity" | "submittedAt">,
  run: HighScoreRunReceipt
): boolean => {
  if (!isHighScoreIntegrity(entry.integrity)) {
    return false;
  }

  const expectedScoreProduct =
    Math.max(0, Math.floor(entry.score)) * entry.integrity.multiplier;
  const expectedStatsProduct =
    (hashText(entry.stats.join("\n")) % highScoreIntegrityHashModulo) *
    entry.integrity.multiplier;

  return (
    entry.integrity.scoreProduct === expectedScoreProduct &&
    entry.integrity.statsProduct === expectedStatsProduct &&
    entry.integrity.checksum ===
      createHighScoreIntegrityChecksum(
        entry,
        run,
        entry.integrity.multiplier,
        entry.integrity.scoreProduct,
        entry.integrity.statsProduct
      )
  );
};

const createHighScoreIntegrityChecksum = (
  entry: HighScoreEntry & Pick<StoredHighScoreEntry, "submittedAt">,
  run: HighScoreRunReceipt,
  multiplier: number,
  scoreProduct: number,
  statsProduct: number
): string =>
  hashText(
    [
      highScoreIntegrityVersion,
      run.runId,
      run.token,
      run.issuedAt,
      entry.id,
      entry.name,
      Math.max(0, Math.floor(entry.score)),
      entry.stats.join("\n"),
      entry.submittedAt,
      multiplier,
      scoreProduct,
      statsProduct,
    ].join("|")
  ).toString(36);

const hashText = (text: string): number => {
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const markHighScoreApiOffline = (): void => {
  highScoreApiOffline = true;
  highScoreApiLastProbeAt = Date.now();
};

const canUseHighScoreApi = (): boolean => !isApiDisabledByConfig();

const isApiDisabledByConfig = (): boolean => getApiMode() === "offline";

const getApiMode = (): "auto" | "offline" => {
  const configuredMode = import.meta.env.VITE_API_MODE;

  return configuredMode === "offline" ? "offline" : "auto";
};

const fetchHighScoreApi = async (
  path = "",
  init?: RequestInit
): Promise<Response | null> => {
  if (!canUseHighScoreApi()) {
    return null;
  }

  const controller =
    typeof AbortController === "undefined" ? null : new AbortController();
  const timeout =
    controller === null
      ? undefined
      : setTimeout(() => controller.abort(), highScoreApiTimeoutMs);

  try {
    return await fetch(`${highScoreApiBasePath}${path}`, {
      ...init,
      signal: controller?.signal ?? init?.signal,
    });
  } catch {
    return null;
  } finally {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
  }
};

const toHighScoreEntry = (entry: HighScoreEntry): HighScoreEntry => ({
  createdAt: entry.createdAt,
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

const isHighScoreIntegrity = (value: unknown): value is HighScoreIntegrity => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const integrity = value as Partial<HighScoreIntegrity>;

  return (
    integrity.version === highScoreIntegrityVersion &&
    typeof integrity.multiplier === "number" &&
    Number.isInteger(integrity.multiplier) &&
    integrity.multiplier >= highScoreIntegrityMinMultiplier &&
    integrity.multiplier <
      highScoreIntegrityMinMultiplier + highScoreIntegrityMultiplierRange &&
    typeof integrity.scoreProduct === "number" &&
    Number.isInteger(integrity.scoreProduct) &&
    typeof integrity.statsProduct === "number" &&
    Number.isInteger(integrity.statsProduct) &&
    typeof integrity.checksum === "string"
  );
};

const isHighScoreEntry = (value: unknown): value is HighScoreEntry => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<HighScoreEntry>;

  return (
    (candidate.createdAt === undefined ||
      typeof candidate.createdAt === "number") &&
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.score === "number" &&
    Array.isArray(candidate.stats) &&
    candidate.stats.every((stat) => typeof stat === "string")
  );
};
