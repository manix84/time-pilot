/* Converted from engine/Ticker.js (AMD) to ESM TypeScript. */
import type { TickerInstance } from "../types";

type LegacyAnimationWindow = Window &
  typeof globalThis & {
    mozRequestAnimationFrame?: typeof window.requestAnimationFrame;
    webkitRequestAnimationFrame?: typeof window.requestAnimationFrame;
    msRequestAnimationFrame?: typeof window.requestAnimationFrame;
  };

type TickerScheduleCallback = (frame: number) => void;

interface TickerScheduleItem {
  callback: TickerScheduleCallback;
  nthFrame: number;
}

interface TickerOptions {
  fps?: number;
}

const animationWindow = window as LegacyAnimationWindow;
const requestAnimationFrame =
  animationWindow.requestAnimationFrame ||
  animationWindow.mozRequestAnimationFrame ||
  animationWindow.webkitRequestAnimationFrame ||
  animationWindow.msRequestAnimationFrame;

/**
 * requestAnimationFrame-backed scheduler used by simulation and rendering loops.
 */
class Ticker implements TickerInstance {
  private _frame = 0;
  private readonly _frameInterval?: number;
  private _lastStepTime: number | null = null;
  private _schedule: Record<number, TickerScheduleItem> = {};
  private _scheduleCount = 0;
  private killCallback?: () => void;

  isRunning = false;

  constructor(options: TickerOptions = {}) {
    this._frameInterval = options.fps ? 1000 / options.fps : undefined;
  }

  start = (): void => {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this._lastStepTime = null;
    this._step();
  };

  stop = (callback?: () => void): void => {
    this.isRunning = false;
    this.killCallback = callback || (() => {});
  };

  private _step = (): void => {
    requestAnimationFrame((timestamp) => {
      if (!this.isRunning) {
        this.runKillCallback();
        return;
      }

      if (!this.shouldRunFrame(timestamp)) {
        this._step();
        return;
      }

      this._frame++;
      this._lastStepTime = timestamp;

      for (const eventId in this._schedule) {
        if (
          Object.prototype.hasOwnProperty.call(this._schedule, eventId) &&
          this._frame % this._schedule[eventId].nthFrame === 0
        ) {
          this._schedule[eventId].callback(this._frame);
        }
      }

      if (this.isRunning) {
        this._step();
      } else {
        this.runKillCallback();
      }
    });
  };

  private runKillCallback = (): void => {
    if (this.killCallback) {
      this.killCallback();
      delete this.killCallback;
    }
  };

  private shouldRunFrame = (timestamp: number): boolean => {
    if (!this._frameInterval) {
      return true;
    }

    if (this._lastStepTime === null) {
      this._lastStepTime = timestamp;
      return false;
    }

    return timestamp - this._lastStepTime >= this._frameInterval;
  };

  addSchedule = (callback: TickerScheduleCallback, nthFrame: number): number => {
    const eventId = ++this._scheduleCount;
    this._schedule[eventId] = {
      callback,
      nthFrame,
    };

    return eventId;
  };

  removeSchedule = (eventId: number): boolean => {
    if (this._schedule[eventId]) {
      delete this._schedule[eventId];
    }

    return !this._schedule[eventId];
  };

  clearSchedule = (): void => {
    this._schedule = {};
  };

  clearTicks = (): boolean => {
    this._frame = 0;

    return !this._frame;
  };

  getTicks = (): number => {
    return this._frame;
  };
}

export default Ticker;
