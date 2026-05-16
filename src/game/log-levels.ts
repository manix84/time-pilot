/**
 * Ordered logging levels used by the runtime logger and debug menu.
 *
 * The order is intentionally UI-friendly: "off" first, then progressively
 * less verbose active levels.
 */
export const logLevels = [
  "off",
  "debug",
  "info",
  "warning",
  "error",
  "fatal",
] as const;

/**
 * A persisted logging level.
 *
 * `"off"` disables logging. Active levels log messages at that severity and
 * above.
 */
export type LogLevel = (typeof logLevels)[number];

/**
 * Checks whether a runtime value is a supported logging level.
 *
 * @param value - Value read from storage or another untyped source.
 * @returns Whether the value can be safely used as a {@link LogLevel}.
 */
export const isLogLevel = (value: unknown): value is LogLevel =>
  typeof value === "string" && (logLevels as readonly string[]).includes(value);

/**
 * Cycles through the ordered log-level list.
 *
 * @param current - Currently selected log level.
 * @param direction - `1` moves forward; `-1` moves backward.
 * @returns The next wrapped log level.
 */
export const getNextLogLevel = (
  current: LogLevel,
  direction: -1 | 1
): LogLevel => {
  const currentIndex = logLevels.indexOf(current);
  const nextIndex =
    (currentIndex + direction + logLevels.length) % logLevels.length;

  return logLevels[nextIndex];
};
