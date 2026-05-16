import { afterEach, describe, expect, it } from "vitest";
import { isPwaMode, isPwaRoute } from "./app-routing";

describe("App routing helpers", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
    Reflect.deleteProperty(window, "matchMedia");
    Reflect.deleteProperty(navigator, "standalone");
  });

  it("recognizes the dedicated PWA endpoint and emitted index page", () => {
    window.history.replaceState(null, "", "/pwa/");
    expect(isPwaRoute()).toBe(true);

    window.history.replaceState(null, "", "/pwa/index.html");
    expect(isPwaRoute()).toBe(true);

    window.history.replaceState(null, "", "/");
    expect(isPwaRoute()).toBe(false);
  });

  it("recognizes installed PWA display modes separately from the PWA route", () => {
    window.history.replaceState(null, "", "/pwa/");
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: (query: string) => ({
        matches: query === "(display-mode: standalone)",
      }),
    });

    expect(isPwaRoute()).toBe(true);
    expect(isPwaMode()).toBe(true);
  });

  it("does not treat the browser PWA route as installed PWA mode", () => {
    window.history.replaceState(null, "", "/pwa/");
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({
        matches: false,
      }),
    });

    expect(isPwaRoute()).toBe(true);
    expect(isPwaMode()).toBe(false);
  });

  it("recognizes iOS standalone PWA mode", () => {
    Object.defineProperty(navigator, "standalone", {
      configurable: true,
      value: true,
    });

    expect(isPwaMode()).toBe(true);
  });
});
