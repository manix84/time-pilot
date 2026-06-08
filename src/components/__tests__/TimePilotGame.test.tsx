import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appExitBlockedEventName } from "arcade-engine";
import userOptions from "../../game/user-options";
import TimePilotGame from "../TimePilotGame";
import UpdateOverlay from "../UpdateOverlay";

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
    userOptions.setOption("keepScreenAwake", true);
    userOptions.setOption("videoFilterMode", "off");
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the game canvas through the hook bridge", async () => {
    await act(async () => {
      root.render(<TimePilotGame debug />);
      await new Promise((resolve) => window.setTimeout(resolve, 5));
    });

    expect(container.querySelector("[data-time-pilot-stage]")).toBeTruthy();
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
      container
        .querySelector("[data-time-pilot-game]")
        ?.getAttribute("data-filter-mode")
    ).toBe("off");

    await act(async () => {
      userOptions.setOption("videoFilterMode", "arcade-crt");
      await Promise.resolve();
    });

    expect(
      container
        .querySelector("[data-time-pilot-game]")
        ?.getAttribute("data-filter-mode")
    ).toBe("arcade-crt");
  });

  it("exposes update overlay status text to assistive technology", async () => {
    const onWarpComplete = vi.fn();
    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

    await act(async () => {
      root.render(
        <UpdateOverlay onWarpComplete={onWarpComplete} state={"updating"} />
      );
      await new Promise((resolve) => window.setTimeout(resolve, 5));
    });

    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      "Updating..."
    );

    await act(async () => {
      root.render(
        <UpdateOverlay onWarpComplete={onWarpComplete} state={"warping"} />
      );
      await new Promise((resolve) => window.setTimeout(resolve, 5));
    });

    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      "Complete"
    );
    expect(container.querySelector("canvas")?.getAttribute("aria-hidden")).toBe(
      "true"
    );
  });

  it("ignores service worker update events unless updates are enabled", async () => {
    await act(async () => {
      root.render(<TimePilotGame debug />);
      await new Promise((resolve) => window.setTimeout(resolve, 5));
    });

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent("timePilot:updateAvailable", {
          detail: {
            apply: vi.fn(),
          },
        })
      );
      window.dispatchEvent(new CustomEvent("timePilot:updateActivated"));
      await Promise.resolve();
    });

    expect(container.querySelector("[data-time-pilot-update-overlay]")).toBeNull();
  });

  it("shows a saved fallback when installed app exit is blocked", async () => {
    await act(async () => {
      root.render(<TimePilotGame debug enableAppExit />);
      await new Promise((resolve) => window.setTimeout(resolve, 5));
    });

    await act(async () => {
      window.dispatchEvent(new CustomEvent(appExitBlockedEventName));
      await Promise.resolve();
    });

    const dialog = container.querySelector("[data-time-pilot-exit-fallback]");

    expect(dialog?.getAttribute("role")).toBe("dialog");
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    expect(dialog?.textContent).toContain("Game Saved");

    await act(async () => {
      dialog?.querySelector('button[type="button"]')?.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
        })
      );
      await Promise.resolve();
    });

    expect(container.querySelector("[data-time-pilot-exit-fallback]")).toBeNull();
  });
});
