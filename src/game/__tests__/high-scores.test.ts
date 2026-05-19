import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps scores local-only when no remote run receipt exists", () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    saveHighScore(" Ace Pilot! ", 1200, ["Era: 1910"]);

    const storedScores = JSON.parse(
      localStorage.getItem(highScoreStorageKey) ?? "[]"
    ) as Array<{ name: string; syncState: string }>;

    expect(loadStoredHighScores()[0]).toMatchObject({
      name: "Ace Pilot",
      score: 1200,
    });
    expect(storedScores[0]?.syncState).toBe("local");
  });

  it("submits receipt-backed pending scores and stores remote results", async () => {
    const remoteEntry = {
      id: "remote-score",
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
    ) as Array<{ id: string; receivedAt: number; syncState: string }>;

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/high-scores",
      expect.objectContaining({ method: "POST" })
    );
    expect(storedScores[0]).toMatchObject({
      id: "remote-score",
      receivedAt: 123456,
      syncState: "synced",
    });
  });
});
