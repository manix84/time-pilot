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

  it("renders controller settings and accepts configuration changes", async () => {
    await act(async () => {
      root.render(<TimePilotGame debug />);
      await new Promise((resolve) => window.setTimeout(resolve, 5));
    });

    const rotateKeyboard = container.querySelector<HTMLInputElement>(
      'input[value="keyboard2"]'
    );
    const gamepadToggle = container.querySelector<HTMLInputElement>(
      '.gamepad-toggle input[type="checkbox"]'
    );

    expect(rotateKeyboard).toBeInstanceOf(HTMLInputElement);
    expect(gamepadToggle).toBeInstanceOf(HTMLInputElement);
    expect(gamepadToggle?.checked).toBe(true);

    await act(async () => {
      rotateKeyboard?.click();
      gamepadToggle?.click();
      await new Promise((resolve) => window.setTimeout(resolve, 5));
    });

    expect(rotateKeyboard?.checked).toBe(true);
    expect(gamepadToggle?.checked).toBe(false);
    expect(container.querySelector("canvas")).toBeInstanceOf(HTMLCanvasElement);
  });
});
