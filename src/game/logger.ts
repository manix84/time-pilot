import { type LogLevel } from "./log-levels";
import userOptions from "./user-options";

/**
 * Active severities accepted by the logger.
 *
 * The persisted `"off"` option is excluded because it is a configuration
 * state, not a log event severity.
 */
type ActiveLogLevel = Exclude<LogLevel, "off">;

/**
 * Numeric severity threshold for each log level.
 *
 * Higher values are more severe. `"off"` is set above every active severity so
 * no event can pass the threshold while logging is disabled.
 */
const logPriority: Record<LogLevel, number> = {
  off: Number.POSITIVE_INFINITY,
  debug: 10,
  info: 20,
  warning: 30,
  error: 40,
  fatal: 50,
};

/**
 * Browser console method used for each active severity.
 */
const consoleMethod: Record<ActiveLogLevel, "debug" | "info" | "warn" | "error"> = {
  debug: "debug",
  info: "info",
  warning: "warn",
  error: "error",
  fatal: "error",
};

/**
 * Checks whether a severity should be emitted for the current user option.
 *
 * @param level - Active severity to test.
 * @returns Whether the event meets the configured log threshold.
 */
const shouldLog = (level: ActiveLogLevel): boolean =>
  logPriority[level] >= logPriority[userOptions.logLevel];

/**
 * Writes a formatted log line if the active threshold allows it.
 *
 * @param level - Severity for the event.
 * @param message - Short human-readable event message.
 * @param details - Optional structured data to pass through to the console.
 */
const writeLog = (
  level: ActiveLogLevel,
  message: string,
  ...details: unknown[]
): void => {
  if (!shouldLog(level)) {
    return;
  }

  const method = consoleMethod[level];
  const writer = console[method] ?? console.log;

  writer.call(
    console,
    `[Time Pilot] ${level.toUpperCase()}: ${message}`,
    ...details
  );
};

/**
 * Runtime logger controlled by the debug menu's Log Level setting.
 *
 * Logging is disabled by default for players. When enabled, messages are
 * prefixed consistently and optional details are forwarded as structured
 * console arguments.
 */
export const logger = {
  shouldLog,
  debug: (message: string, ...details: unknown[]) =>
    writeLog("debug", message, ...details),
  info: (message: string, ...details: unknown[]) =>
    writeLog("info", message, ...details),
  warning: (message: string, ...details: unknown[]) =>
    writeLog("warning", message, ...details),
  error: (message: string, ...details: unknown[]) =>
    writeLog("error", message, ...details),
  fatal: (message: string, ...details: unknown[]) =>
    writeLog("fatal", message, ...details),
};
