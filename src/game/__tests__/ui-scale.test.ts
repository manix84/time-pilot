import { afterEach, describe, expect, it } from "vitest";
import {
  formatGameZoom,
  formatUiZoom,
  getGameScale,
  getManualGameScale,
  getManualUiScale,
  getUiScale,
  getViewportGameScale,
  getViewportUiScale,
} from "../ui-scale";
import userOptions from "../user-options";

describe("UI and game scaling", () => {
  afterEach(() => {
    localStorage.clear();
    userOptions.setOption("gameZoom", 100);
    userOptions.setOption("uiZoom", 100);
  });

  it("formats manual zoom values in five percent steps", () => {
    userOptions.setOption("uiZoom", 105);
    userOptions.setOption("gameZoom", 95);

    expect(getManualUiScale()).toBe(1.05);
    expect(getManualGameScale()).toBe(0.95);
    expect(formatUiZoom()).toBe("105%");
    expect(formatGameZoom()).toBe("95%");
  });

  it("combines manual zoom with viewport scaling", () => {
    userOptions.setOption("uiZoom", 100);
    userOptions.setOption("gameZoom", 100);

    expect(getUiScale(1600, 1200)).toBe(1.35);
    expect(getGameScale(1600, 1200)).toBe(1.35);
    expect(getUiScale(320, 480)).toBe(0.72);
    expect(getGameScale(320, 480)).toBe(0.75);
  });

  it("supports the full manual zoom range", () => {
    userOptions.setOption("uiZoom", 25);
    userOptions.setOption("gameZoom", 250);

    expect(getManualUiScale()).toBe(0.25);
    expect(getManualGameScale()).toBe(2.5);
    expect(formatUiZoom()).toBe("25%");
    expect(formatGameZoom()).toBe("250%");
  });

  it("clamps viewport-only scale helpers", () => {
    expect(getViewportUiScale(2000, 1600)).toBe(1.35);
    expect(getViewportUiScale(240, 320)).toBe(0.72);
    expect(getViewportGameScale(2000, 1600)).toBe(1.35);
    expect(getViewportGameScale(240, 320)).toBe(0.75);
  });
});
