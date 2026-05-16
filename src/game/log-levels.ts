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
