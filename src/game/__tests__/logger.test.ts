import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "../logger";
import userOptions from "../user-options";

describe("logger", () => {
  afterEach(() => {
    userOptions.setOption("logLevel", "off");
    vi.restoreAllMocks();
  });

  it("suppresses logs while disabled", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});

    logger.info("hidden");

    expect(info).not.toHaveBeenCalled();
  });

  it("logs enabled levels and suppresses lower priority levels", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    userOptions.setOption("logLevel", "warning");

    logger.info("hidden");
    logger.warning("visible", { scope: "scores" });

    expect(info).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      "[Time Pilot] WARNING: visible",
      { scope: "scores" }
    );
  });

  it("routes fatal logs to console error", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    userOptions.setOption("logLevel", "fatal");

    logger.fatal("crashed");

    expect(error).toHaveBeenCalledWith("[Time Pilot] FATAL: crashed");
  });
});
