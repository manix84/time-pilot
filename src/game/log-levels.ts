export const logLevels = [
  "off",
  "debug",
  "info",
  "warning",
  "error",
  "fatal",
] as const;

export type LogLevel = (typeof logLevels)[number];

export const isLogLevel = (value: unknown): value is LogLevel =>
  typeof value === "string" && (logLevels as readonly string[]).includes(value);

export const getNextLogLevel = (
  current: LogLevel,
  direction: -1 | 1
): LogLevel => {
  const currentIndex = logLevels.indexOf(current);
  const nextIndex =
    (currentIndex + direction + logLevels.length) % logLevels.length;

  return logLevels[nextIndex];
};
