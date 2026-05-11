import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
});

