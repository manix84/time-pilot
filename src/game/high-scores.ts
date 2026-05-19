import type { HighScoreEntry } from "./types";

const highScoreStorageKey = "timePilot.highScores";
const maxStoredHighScores = 10;

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
];

/**
 * Reads player-submitted high scores from local storage.
 */
export const loadStoredHighScores = (): HighScoreEntry[] => {
  const storedScores = localStorage.getItem(highScoreStorageKey);

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
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        score: Math.max(0, Math.floor(entry.score)),
        stats: entry.stats.slice(0, 6),
      }))
      .sort(sortHighScores)
      .slice(0, maxStoredHighScores);
  } catch {
    return [];
  }
};

/**
 * Combines locally saved scores with the fake default table.
 */
export const getHighScores = (): HighScoreEntry[] =>
  [...loadStoredHighScores(), ...fakeHighScores]
    .sort(sortHighScores)
    .slice(0, maxStoredHighScores);

/**
 * Persists a newly submitted high score locally.
 */
export const saveHighScore = (
  name: string,
  score: number,
  stats: string[]
): HighScoreEntry => {
  const entry: HighScoreEntry = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: normalizeHighScoreName(name),
    score: Math.max(0, Math.floor(score)),
    stats: stats.slice(0, 6),
  };
  const storedScores = [...loadStoredHighScores(), entry]
    .sort(sortHighScores)
    .slice(0, maxStoredHighScores);

  localStorage.setItem(highScoreStorageKey, JSON.stringify(storedScores));

  return entry;
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
