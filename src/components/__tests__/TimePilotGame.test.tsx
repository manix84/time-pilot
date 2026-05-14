import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userOptions from "../../game/user-options";
import TimePilotGame from "../TimePilotGame";

describe("TimePilotGame", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    userOptions.setOption("enableDebug", false);
    userOptions.setOption("videoFilterMode", "off");
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the game canvas through the hook bridge", async () => {
    await act(async () => {
      root.render(<TimePilotGame debug />);
      await new Promise((resolve) => window.setTimeout(resolve, 5));
    });

    expect(container.querySelector(".time-pilot-stage")).toBeTruthy();
    expect(container.querySelector("canvas")).toBeInstanceOf(HTMLCanvasElement);
  });

  it("does not render controller settings outside the canvas", async () => {
    await act(async () => {
      root.render(<TimePilotGame debug />);
      await new Promise((resolve) => window.setTimeout(resolve, 5));
    });

    expect(container.querySelector(".time-pilot-controls")).toBeNull();
    expect(container.querySelector("input")).toBeNull();
    expect(container.querySelector("canvas")).toBeInstanceOf(HTMLCanvasElement);
  });

  it("updates the viewport filter mode when user options change", async () => {
    await act(async () => {
      root.render(<TimePilotGame debug />);
      await new Promise((resolve) => window.setTimeout(resolve, 5));
    });

    expect(
      container.querySelector(".time-pilot-game")?.getAttribute("data-filter-mode")
    ).toBe("off");

    await act(async () => {
      userOptions.setOption("videoFilterMode", "arcade-crt");
      await Promise.resolve();
    });

    expect(
      container.querySelector(".time-pilot-game")?.getAttribute("data-filter-mode")
    ).toBe("arcade-crt");
  });
});
