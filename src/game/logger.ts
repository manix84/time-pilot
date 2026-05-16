import { type LogLevel } from "./log-levels";
import userOptions from "./user-options";

type ActiveLogLevel = Exclude<LogLevel, "off">;

const logPriority: Record<LogLevel, number> = {
  off: Number.POSITIVE_INFINITY,
  debug: 10,
  info: 20,
  warning: 30,
  error: 40,
  fatal: 50,
};

const consoleMethod: Record<ActiveLogLevel, "debug" | "info" | "warn" | "error"> = {
  debug: "debug",
  info: "info",
  warning: "warn",
  error: "error",
  fatal: "error",
};

const shouldLog = (level: ActiveLogLevel): boolean =>
  logPriority[level] >= logPriority[userOptions.logLevel];

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
