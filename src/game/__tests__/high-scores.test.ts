import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getHighScoreThresholds,
  getHighScoreSyncStatus,
  getHighScores,
  loadStoredHighScores,
  saveHighScore,
  syncHighScores,
} from "../high-scores";

const highScoreStorageKey = "timePilot.highScores";

const createJsonResponse = (body: unknown) =>
  ({
    json: vi.fn(() => Promise.resolve(body)),
    ok: true,
  }) as unknown as Response;

describe("high score storage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(Date, "now").mockReturnValue(
      Date.parse("2026-05-19T10:00:00.000Z")
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps scores local-only when no remote run receipt exists", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    saveHighScore(" Ace Pilot! ", 1200, ["Era: 1910"]);

    const storedScores = JSON.parse(
      localStorage.getItem(highScoreStorageKey) ?? "[]"
    ) as Array<{ name: string; syncState: string }>;

    expect(loadStoredHighScores()[0]).toMatchObject({
      createdAt: Date.parse("2026-05-19T10:00:00.000Z"),
      name: "Ace Pilot",
      score: 1200,
    });
    expect(storedScores[0]?.syncState).toBe("local");
    expect(getHighScoreSyncStatus()).toBe("syncing");

    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(getHighScoreSyncStatus()).toBe("error");
  });

  it("submits receipt-backed pending scores and stores remote results", async () => {
    const remoteEntry = {
      id: "remote-score",
      createdAt: 2000,
      name: "Sync Pilot",
      receivedAt: 123456,
      score: 5000,
      stats: ["Era: 1910", "Enemies: 2"],
    };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(
      (input, init) => {
        if (input === "/api/high-scores" && init?.method === "POST") {
          return Promise.resolve(createJsonResponse(remoteEntry));
        }

        return Promise.resolve(createJsonResponse([remoteEntry]));
      }
    );

    localStorage.setItem(
      highScoreStorageKey,
      JSON.stringify([
        {
          id: "local-score",
          createdAt: 2000,
          name: "Sync Pilot",
          run: {
            issuedAt: 1000,
            runId: "run-1",
            token: "receipt-token",
          },
          score: 5000,
          stats: ["Era: 1910", "Enemies: 2"],
          submittedAt: 2000,
          syncState: "pending",
        },
      ])
    );

    await syncHighScores();

    const storedScores = JSON.parse(
      localStorage.getItem(highScoreStorageKey) ?? "[]"
    ) as Array<{
      createdAt: number;
      id: string;
      receivedAt: number;
      syncState: string;
    }>;

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/high-scores",
      expect.objectContaining({ method: "POST" })
    );
    expect(storedScores[0]).toMatchObject({
      createdAt: 2000,
      id: "remote-score",
      receivedAt: 123456,
      syncState: "synced",
    });
    expect(getHighScoreSyncStatus()).toBe("success");
  });

  it("sorts matching scores by the first creation timestamp", () => {
    localStorage.setItem(
      highScoreStorageKey,
      JSON.stringify([
        {
          createdAt: 3000,
          id: "newer-score",
          name: "Newer",
          score: 1000,
          stats: [],
          submittedAt: 3000,
          syncState: "local",
        },
        {
          createdAt: 1000,
          id: "older-score",
          name: "Older",
          score: 1000,
          stats: [],
          submittedAt: 1000,
          syncState: "local",
        },
      ])
    );

    expect(loadStoredHighScores().map((score) => score.name)).toEqual([
      "Older",
      "Newer",
    ]);
  });

  it("keeps saved scores visible ahead of placeholder scores", () => {
    saveHighScore("New Pilot", 1200, ["Era: 1910"]);

    expect(getHighScores()[0]).toMatchObject({
      name: "New Pilot",
      score: 1200,
    });
    expect(getHighScoreThresholds(3).map((score) => score.score)).toEqual([
      1000000,
      875500,
      742250,
    ]);
  });

  it("keeps gameplay-safe score saves best effort when storage writes fail", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });

    expect(() =>
      saveHighScore("Storage Pilot", 4000, ["Era: 1910"])
    ).not.toThrow();
  });

  it("keeps gameplay-safe score reads best effort when storage reads fail", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    expect(loadStoredHighScores()).toEqual([]);
    expect(getHighScores()).toHaveLength(10);
  });

  it("downgrades terminal sync rejections to local scores", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      if (input === "/api/high-scores" && init?.method === "POST") {
        return Promise.resolve({
          ok: false,
          status: 401,
        } as Response);
      }

      return Promise.resolve(createJsonResponse([]));
    });

    localStorage.setItem(
      highScoreStorageKey,
      JSON.stringify([
        {
          id: "expired-score",
          createdAt: 2000,
          name: "Expired Pilot",
          run: {
            issuedAt: 1000,
            runId: "run-expired",
            token: "receipt-token",
          },
          score: 5000,
          stats: ["Era: 1910"],
          submittedAt: 2000,
          syncState: "pending",
        },
      ])
    );

    await syncHighScores();

    const storedScores = JSON.parse(
      localStorage.getItem(highScoreStorageKey) ?? "[]"
    ) as Array<{ run?: unknown; syncState: string }>;

    expect(storedScores[0]).toMatchObject({ syncState: "local" });
    expect(storedScores[0]?.run).toBeUndefined();
    expect(getHighScoreSyncStatus()).toBe("success");
  });

  it("persists successful pending sync updates before a later submit fails", async () => {
    const remoteEntry = {
      id: "remote-score",
      createdAt: 2000,
      name: "Sync Pilot",
      receivedAt: 123456,
      score: 5000,
      stats: ["Era: 1910", "Enemies: 2"],
    };
    let postCount = 0;

    vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      if (input === "/api/high-scores" && init?.method === "POST") {
        postCount += 1;

        if (postCount === 1) {
          return Promise.resolve(createJsonResponse(remoteEntry));
        }

        return Promise.reject(new Error("offline"));
      }

      return Promise.resolve(createJsonResponse([]));
    });

    localStorage.setItem(
      highScoreStorageKey,
      JSON.stringify([
        {
          id: "first-local-score",
          createdAt: 2000,
          name: "Sync Pilot",
          run: {
            issuedAt: 1000,
            runId: "run-1",
            token: "receipt-token",
          },
          score: 5000,
          stats: ["Era: 1910", "Enemies: 2"],
          submittedAt: 2000,
          syncState: "pending",
        },
        {
          id: "second-local-score",
          createdAt: 3000,
          name: "Offline Pilot",
          run: {
            issuedAt: 1000,
            runId: "run-2",
            token: "receipt-token",
          },
          score: 4500,
          stats: ["Era: 1910", "Enemies: 1"],
          submittedAt: 3000,
          syncState: "pending",
        },
      ])
    );

    await syncHighScores();

    const storedScores = JSON.parse(
      localStorage.getItem(highScoreStorageKey) ?? "[]"
    ) as Array<{ id: string; syncState: string }>;

    expect(storedScores).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "remote-score",
          syncState: "synced",
        }),
        expect.objectContaining({
          id: "second-local-score",
          syncState: "pending",
        }),
      ])
    );
    expect(getHighScoreSyncStatus()).toBe("error");
  });
});
