import {
  createHighScoreManager,
  normalizeHighScoreName as normalizeEngineHighScoreName,
  type HighScoreManager,
  type HighScoreRunReceipt,
} from "arcade-engine";
import { normalizeGameSpeed, normalizeRenderFps } from "./game-timing";
import type {
  HighScoreEntry,
  HighScoreSettings,
  HighScoreSyncStatus,
} from "./types";

const highScoreStorageKey = "timePilot.highScores";
const highScoreApiBasePath = "/api/high-scores";
const highScoreApiTimeoutMs = 2500;
const highScoreApiProbeIntervalMs = 30000;
const highScoreSyncSuccessDisplayMs = 2500;
const fakeHighScoreBaseCreatedAt = Date.UTC(2012, 8, 13);
const maxStoredHighScores = 10;
const maxCachedHighScores = 50;

let highScoreManager:
  | HighScoreManager<HighScoreSettings>
  | undefined;
let highScoreManagerApiEnabled: boolean | undefined;
let highScoreApiProbeInFlight = false;
let highScoreApiLastProbeAt = 0;

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
    score: 120000,
    stats: ["Era: 1970", "Bosses: 2", "Continues: 0", "Accuracy: suspicious"],
  },
  {
    createdAt: fakeHighScoreBaseCreatedAt + 86400000,
    id: "captain-definitely-real",
    name: "Captain Definitely Real",
    score: 90000,
    stats: ["Era: 1940", "Bosses: 1", "Lives left: 1", "Clouds dodged: many"],
  },
  {
    createdAt: fakeHighScoreBaseCreatedAt + 86400000 * 2,
    id: "pewpew-von-laser",
    name: "PewPew von Laser",
    score: 70000,
    stats: ["Era: 1940", "Missiles annoyed: 73", "Continues: 0"],
  },
  {
    createdAt: fakeHighScoreBaseCreatedAt + 86400000 * 3,
    id: "baron-von-biplane",
    name: "Baron von Biplane",
    score: 55000,
    stats: ["Era: 1910", "Loops: too many", "Near misses: 38"],
  },
  {
    createdAt: fakeHighScoreBaseCreatedAt + 86400000 * 4,
    id: "not-a-bot-9000",
    name: "Not A Bot 9000",
    score: 42000,
    stats: ["Era: 1910", "Inputs: perfectly normal", "Snacks: 3"],
  },
  {
    createdAt: fakeHighScoreBaseCreatedAt + 86400000 * 5,
    id: "debug-dave",
    name: "Debug Dave",
    score: 30000,
    stats: ["Era: 1910", "Hitboxes blamed: yes", "Restart count: private"],
  },
  {
    createdAt: fakeHighScoreBaseCreatedAt + 86400000 * 6,
    id: "loop-de-loop-lou",
    name: "Loop-de-Loop Lou",
    score: 22000,
    stats: ["Era: 1910", "Loops: 12", "Near misses: 0", "Dignity: optional"],
  },
  {
    createdAt: fakeHighScoreBaseCreatedAt + 86400000 * 7,
    id: "captain-one-more",
    name: "Captain One More",
    score: 15000,
    stats: ["Era: 1910", "Restarts: 9", "Continues: 3", "Sleep: none"],
  },
  {
    createdAt: fakeHighScoreBaseCreatedAt + 86400000 * 8,
    id: "miss-by-a-mile",
    name: "Missed By A Pixel",
    score: 9000,
    stats: ["Era: 1910", "Near misses: 28", "Luck: suspicious"],
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
 * Returns the latest high-score save/sync status for menu indicators.
 */
export const getHighScoreSyncStatus = (): HighScoreSyncStatus | null => {
  const status = getHighScoreManager().getHighScoreSyncStatus();

  queueHighScoreApiProbe(status);

  return status;
};

/**
 * Reads player-submitted high scores from local storage.
 */
export const loadStoredHighScores = (): HighScoreEntry[] =>
  getHighScoreManager().loadStoredHighScores() as HighScoreEntry[];

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
  getHighScoreManager().getHighScoreThresholds(limit) as HighScoreEntry[];

/**
 * Starts a remotely verifiable high-score run when the API is available.
 */
export const startHighScoreRun = async (
  settings?: HighScoreSettings
): Promise<HighScoreRunReceipt | null> =>
  getHighScoreManager().startHighScoreRun(normalizeHighScoreSettings(settings));

/**
 * Persists a newly submitted high score locally.
 */
export const saveHighScore = (
  name: string,
  score: number,
  stats: string[],
  run?: HighScoreRunReceipt | null,
  settings?: HighScoreSettings
): HighScoreEntry => {
  const manager = getHighScoreManager();
  const entry = manager.saveHighScore(
    name,
    score,
    stats,
    run,
    normalizeHighScoreSettings(settings)
  ) as HighScoreEntry;

  if (!run && !isApiDisabledByConfig()) {
    void manager.syncHighScores();
  }

  return entry;
};

/**
 * Best-effort two-way sync between local high scores and the remote API.
 */
export const syncHighScores = async (): Promise<void> => {
  await getHighScoreManager().syncHighScores();
};

/**
 * Produces the short arcade-style name stored with a submitted score.
 */
export const normalizeHighScoreName = (name: string): string =>
  normalizeEngineHighScoreName(name, "PILOT");

const getHighScoreManager = (): HighScoreManager<HighScoreSettings> => {
  const apiEnabled = !isApiDisabledByConfig();

  if (
    highScoreManager &&
    highScoreManagerApiEnabled === apiEnabled
  ) {
    return highScoreManager;
  }

  highScoreManagerApiEnabled = apiEnabled;
  highScoreManager = createHighScoreManager<HighScoreSettings>({
    apiBasePath: highScoreApiBasePath,
    apiEnabled,
    apiTimeoutMs: highScoreApiTimeoutMs,
    defaultScores: fakeHighScores,
    fetch: (...args) => fetch(...args),
    formatSettings: formatHighScoreSettingsForIntegrity,
    gameVersion: getGameVersion(),
    maxCachedScores: maxCachedHighScores,
    maxScores: maxStoredHighScores,
    normalizeName: normalizeHighScoreName,
    normalizeSettings: normalizeHighScoreSettings,
    now: () => Date.now(),
    random: () => Math.random(),
    storage: getStorage(),
    storageKey: highScoreStorageKey,
    syncSuccessDisplayMs: highScoreSyncSuccessDisplayMs,
  });

  return highScoreManager;
};

const queueHighScoreApiProbe = (status: HighScoreSyncStatus | null): void => {
  if (
    status !== "error" ||
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

const isApiDisabledByConfig = (): boolean => getApiMode() === "offline";

const getApiMode = (): "auto" | "offline" => {
  const configuredMode = import.meta.env.VITE_API_MODE;

  return configuredMode === "offline" ? "offline" : "auto";
};

const normalizeHighScoreSettings = (
  value: unknown
): HighScoreSettings | undefined => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const settings = value as Partial<HighScoreSettings>;

  return {
    gameSpeed: normalizeGameSpeed(settings.gameSpeed),
    renderFps: normalizeRenderFps(settings.renderFps),
  };
};

const formatHighScoreSettingsForIntegrity = (
  settings?: HighScoreSettings
): string =>
  settings
    ? JSON.stringify({
      gameSpeed: settings.gameSpeed,
      renderFps: settings.renderFps,
    })
    : "";

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
