import { describe, expect, it } from "vitest";
import {
  resetAllStoredTimePilotData,
  resetStoredScores,
} from "../storage-reset";

describe("storage reset helpers", () => {
  it("removes score-like Time Pilot storage without touching other data", () => {
    localStorage.setItem("timePilot.highScore", "12000");
    localStorage.setItem("timePilot.scores", "[]");
    localStorage.setItem("timePilot.userOptions", "{}");
    localStorage.setItem("other.game.highScore", "9000");

    resetStoredScores();

    expect(localStorage.getItem("timePilot.highScore")).toBeNull();
    expect(localStorage.getItem("timePilot.scores")).toBeNull();
    expect(localStorage.getItem("timePilot.userOptions")).toBe("{}");
    expect(localStorage.getItem("other.game.highScore")).toBe("9000");
  });

  it("removes all Time Pilot namespaced storage", () => {
    localStorage.setItem("timePilot.userOptions", "{}");
    localStorage.setItem("timePilot.achievements", "{}");
    localStorage.setItem("timePilot.highScore", "12000");
    localStorage.setItem("other.game.highScore", "9000");

    resetAllStoredTimePilotData();

    expect(localStorage.getItem("timePilot.userOptions")).toBeNull();
    expect(localStorage.getItem("timePilot.achievements")).toBeNull();
    expect(localStorage.getItem("timePilot.highScore")).toBeNull();
    expect(localStorage.getItem("other.game.highScore")).toBe("9000");
  });
});
