import { afterEach, describe, expect, it, vi } from "vitest";

const createStorageMock = (initialStore: Record<string, string> = {}): Storage => {
  let store = { ...initialStore };

  return {
    get length() {
      return Object.keys(store).length;
    },
    clear: vi.fn(() => {
      store = {};
    }),
    getItem: vi.fn((key: string) => store[key] ?? null),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value);
    }),
  };
};

describe("user options persistence", () => {
  afterEach(() => {
    vi.resetModules();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: createStorageMock(),
    });
  });

  it("uses defaults when localStorage access is denied", async () => {
    vi.resetModules();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Blocked", "SecurityError");
      },
    });

    const { default: userOptions } = await import("../user-options");

    expect(userOptions.keyboardBindings.up).toEqual([38, 87]);
    expect(userOptions.language).toBe("en");
  });

  it("ignores corrupted persisted keyboard bindings", async () => {
    vi.resetModules();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: createStorageMock({
        "timePilot.userOptions": JSON.stringify({
          keyboardBindings: {
            fire: [13],
            left: "bad",
            up: null,
          },
        }),
      }),
    });

    const { default: userOptions } = await import("../user-options");

    expect(userOptions.keyboardBindings.fire).toEqual([13]);
    expect(userOptions.keyboardBindings.left).toEqual([37, 65]);
    expect(userOptions.keyboardBindings.up).toEqual([38, 87]);
  });

  it("resets runtime options and removes persisted preference storage", async () => {
    vi.resetModules();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: createStorageMock(),
    });

    const { default: userOptions, resetUserOptions } = await import("../user-options");

    userOptions.setOption("uiZoom", 150);
    userOptions.setOption("language", "es");
    userOptions.setKeyboardBinding("fire", [13]);

    resetUserOptions();

    expect(userOptions.uiZoom).toBe(100);
    expect(userOptions.language).toBe("en");
    expect(userOptions.keyboardBindings.fire).toEqual([32]);
    expect(localStorage.getItem("timePilot.userOptions")).toBeNull();
    expect(localStorage.getItem("timePilot.debugOptions")).toBeNull();
  });
});
