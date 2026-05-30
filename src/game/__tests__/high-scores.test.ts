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
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
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

    vi.mocked(Date.now).mockReturnValue(
      Date.parse("2026-05-19T10:00:03.000Z")
    );

    expect(getHighScoreSyncStatus()).toBe("waiting");
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
    saveHighScore("New Pilot", 1200, ["Era: 1910"], null, {
      gameSpeed: 1.25,
      renderFps: 50,
    });

    expect(getHighScores()[0]).toMatchObject({
      name: "New Pilot",
      score: 1200,
      settings: {
        gameSpeed: 1.25,
        renderFps: 50,
      },
    });
    expect(getHighScoreThresholds(3).map((score) => score.score)).toEqual([
      120000,
      90000,
      70000,
    ]);
  });

  it("syncs receipt-backed score timing settings", async () => {
    const remoteEntry = {
      id: "remote-settings-score",
      createdAt: 2000,
      name: "Settings Pilot",
      receivedAt: 3000,
      score: 5000,
      settings: {
        gameSpeed: 0.9,
        renderFps: "max",
      },
      stats: ["Era: 1910"],
    };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(
      (input, init) => {
        if (input === "/api/high-scores" && init?.method === "POST") {
          return Promise.resolve(createJsonResponse(remoteEntry));
        }

        return Promise.resolve(createJsonResponse([remoteEntry]));
      }
    );

    saveHighScore(
      "Settings Pilot",
      5000,
      ["Era: 1910"],
      {
        issuedAt: 1000,
        runId: "run-settings",
        token: "receipt-token",
      },
      {
        gameSpeed: 0.9,
        renderFps: "max",
      }
    );

    await syncHighScores();

    const postCall = fetchMock.mock.calls.find(
      ([input, init]) => input === "/api/high-scores" && init?.method === "POST"
    );
    const body = JSON.parse(String(postCall?.[1]?.body ?? "{}")) as {
      entry?: { settings?: unknown };
    };

    expect(body.entry?.settings).toEqual({
      gameSpeed: 0.9,
      renderFps: "max",
    });
    expect(loadStoredHighScores()[0]?.settings).toEqual({
      gameSpeed: 0.9,
      renderFps: "max",
    });
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

  it("skips remote sync when API access is configured offline", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(createJsonResponse([]));
    vi.stubEnv("VITE_API_MODE", "offline");

    await syncHighScores();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(getHighScoreSyncStatus()).toBe("error");
  });

  it("stores receipt-backed scores locally when API access is configured offline", () => {
    vi.stubEnv("VITE_API_MODE", "offline");

    saveHighScore("Static Pilot", 5000, ["Era: 1910"], {
      issuedAt: 1000,
      runId: "run-static",
      token: "receipt-token",
    });

    const storedScores = JSON.parse(
      localStorage.getItem(highScoreStorageKey) ?? "[]"
    ) as Array<{ run?: unknown; syncState: string }>;

    expect(storedScores[0]).toMatchObject({ syncState: "local" });
    expect(storedScores[0]?.run).toBeUndefined();
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

  it("caches remote high-score tables without resubmitting cached rows", async () => {
    const remoteEntry = {
      id: "remote-cached-score",
      createdAt: 2000,
      name: "Remote Pilot",
      receivedAt: 3000,
      score: 8000,
      stats: ["Era: 1910"],
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(createJsonResponse([remoteEntry]));

    await syncHighScores();
    await syncHighScores();

    const storedScores = JSON.parse(
      localStorage.getItem(highScoreStorageKey) ?? "[]"
    ) as Array<{ id: string; syncState: string }>;

    expect(storedScores[0]).toMatchObject({
      id: "remote-cached-score",
      syncState: "synced",
    });
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/high-scores",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("keeps pending local submissions when caching a full remote table", async () => {
    const remoteScores = Array.from({ length: 60 }, (_, index) => ({
      id: `remote-score-${index}`,
      createdAt: 1000 + index,
      name: `Remote ${index}`,
      receivedAt: 2000 + index,
      score: 100000 - index,
      stats: ["Era: 1910"],
    }));

    vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      if (input === "/api/high-scores" && init?.method === "POST") {
        return Promise.reject(new Error("offline"));
      }

      return Promise.resolve(createJsonResponse(remoteScores));
    });

    localStorage.setItem(
      highScoreStorageKey,
      JSON.stringify([
        {
          id: "low-pending-score",
          createdAt: 5000,
          name: "Pending Pilot",
          run: {
            issuedAt: 1000,
            runId: "run-pending",
            token: "receipt-token",
          },
          score: 1,
          stats: ["Era: 1910"],
          submittedAt: 5000,
          syncState: "pending",
        },
      ])
    );

    await syncHighScores();

    const storedScores = JSON.parse(
      localStorage.getItem(highScoreStorageKey) ?? "[]"
    ) as Array<{ id: string; syncState: string }>;

    expect(storedScores).toContainEqual(
      expect.objectContaining({
        id: "low-pending-score",
        syncState: "pending",
      })
    );
  });

  it("does not submit pending scores with invalid local integrity", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(createJsonResponse([]));

    localStorage.setItem(
      highScoreStorageKey,
      JSON.stringify([
        {
          id: "tampered-score",
          createdAt: 2000,
          integrity: {
            checksum: "bad",
            multiplier: 101,
            scoreProduct: 1,
            statsProduct: 1,
            version: 1,
          },
          name: "Tampered",
          run: {
            issuedAt: 1000,
            runId: "run-tampered",
            token: "receipt-token",
          },
          score: 999999,
          stats: ["Era: 1910"],
          submittedAt: 2000,
          syncState: "pending",
        },
      ])
    );

    await syncHighScores();

    const storedScores = JSON.parse(
      localStorage.getItem(highScoreStorageKey) ?? "[]"
    ) as Array<{ integrity?: unknown; run?: unknown; syncState: string }>;

    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/high-scores",
      expect.objectContaining({ method: "POST" })
    );
    expect(storedScores[0]).toMatchObject({ syncState: "local" });
    expect(storedScores[0]?.integrity).toBeUndefined();
    expect(storedScores[0]?.run).toBeUndefined();
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
