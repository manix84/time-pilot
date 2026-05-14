import { afterEach, describe, expect, it } from "vitest";
import { isPwaRoute } from "./app-routing";

describe("App routing helpers", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("recognizes the dedicated PWA endpoint and emitted index page", () => {
    window.history.replaceState(null, "", "/pwa/");
    expect(isPwaRoute()).toBe(true);

    window.history.replaceState(null, "", "/pwa/index.html");
    expect(isPwaRoute()).toBe(true);

    window.history.replaceState(null, "", "/");
    expect(isPwaRoute()).toBe(false);
  });
});
