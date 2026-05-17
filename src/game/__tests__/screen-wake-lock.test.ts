import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canUseScreenWakeLock,
  ScreenWakeLockController,
} from "../screen-wake-lock";

describe("screen wake lock", () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, "wakeLock");
    vi.restoreAllMocks();
  });

  it("reports support when the wake lock API is available", () => {
    Object.defineProperty(navigator, "wakeLock", {
      configurable: true,
      value: {
        request: vi.fn(),
      },
    });

    expect(canUseScreenWakeLock()).toBe(true);
  });

  it("acquires and releases a screen wake lock", async () => {
    const sentinel = new EventTarget() as EventTarget & {
      release: () => Promise<void>;
      released: boolean;
    };
    sentinel.released = false;
    sentinel.release = vi.fn(async () => {
      sentinel.released = true;
    });
    const request = vi.fn(async () => sentinel);

    Object.defineProperty(navigator, "wakeLock", {
      configurable: true,
      value: { request },
    });
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

    const controller = new ScreenWakeLockController();

    controller.setActive(true);
    await Promise.resolve();

    expect(request).toHaveBeenCalledWith("screen");

    controller.setActive(false);
    await Promise.resolve();

    expect(sentinel.release).toHaveBeenCalled();

    controller.destroy();
  });
});
