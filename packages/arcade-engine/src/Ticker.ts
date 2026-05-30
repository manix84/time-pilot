/* Converted from engine/Ticker.js (AMD) to ESM TypeScript. */
import type { TickerInstance } from "./types";

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
  fixedStepFps?: number;
  fps?: number;
  maxCatchUpFrames?: number;
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
  private _accumulatedStepTime = 0;
  private _fixedStepInterval?: number;
  private _frameInterval?: number;
  private _lastStepTime: number | null = null;
  private readonly _maxCatchUpFrames: number;
  private _schedule: Record<number, TickerScheduleItem> = {};
  private _scheduleCount = 0;
  private killCallback?: () => void;

  isRunning = false;

  constructor(options: TickerOptions = {}) {
    if (options.fixedStepFps && options.fps) {
      throw new Error("Ticker cannot use fixedStepFps and fps together.");
    }

    this._fixedStepInterval = options.fixedStepFps
      ? 1000 / options.fixedStepFps
      : undefined;
    this._frameInterval = options.fps ? 1000 / options.fps : undefined;
    this._maxCatchUpFrames = options.maxCatchUpFrames ?? 10;
  }

  setFps = (fps?: number): void => {
    if (this._fixedStepInterval) {
      throw new Error("Ticker cannot set fps while using fixedStepFps.");
    }

    this._frameInterval = fps ? 1000 / fps : undefined;
    this.resetTiming();
  };

  setFixedStepFps = (fps: number): void => {
    if (this._frameInterval) {
      throw new Error("Ticker cannot set fixedStepFps while using fps.");
    }

    this._fixedStepInterval = 1000 / fps;
    this.resetTiming();
  };

  start = (): void => {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this._accumulatedStepTime = 0;
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

      const framesToRun = this.getFramesToRun(timestamp);

      if (!framesToRun) {
        this._step();
        return;
      }

      for (let frame = 0; frame < framesToRun && this.isRunning; frame++) {
        this.runScheduledFrame();
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

  private resetTiming = (): void => {
    this._accumulatedStepTime = 0;
    this._lastStepTime = null;
  };

  private getFramesToRun = (timestamp: number): number => {
    if (this._fixedStepInterval) {
      return this.getFixedStepFrameCount(timestamp);
    }

    return this.shouldRunRenderFrame(timestamp) ? 1 : 0;
  };

  private getFixedStepFrameCount = (timestamp: number): number => {
    if (this._lastStepTime === null) {
      this._lastStepTime = timestamp;
      return 0;
    }

    const elapsedMs = timestamp - this._lastStepTime;
    this._lastStepTime = timestamp;

    if (elapsedMs <= 0) {
      return 0;
    }

    this._accumulatedStepTime += elapsedMs;

    const elapsedFrames = Math.floor(
      this._accumulatedStepTime / this._fixedStepInterval
    );

    if (!elapsedFrames) {
      return 0;
    }

    const framesToRun = Math.min(elapsedFrames, this._maxCatchUpFrames);
    this._accumulatedStepTime -= framesToRun * this._fixedStepInterval;

    if (elapsedFrames > this._maxCatchUpFrames) {
      this._accumulatedStepTime %= this._fixedStepInterval;
    }

    return framesToRun;
  };

  private shouldRunRenderFrame = (timestamp: number): boolean => {
    if (!this._frameInterval) {
      return true;
    }

    if (this._lastStepTime === null) {
      this._lastStepTime = timestamp;
      return false;
    }

    if (timestamp - this._lastStepTime < this._frameInterval) {
      return false;
    }

    this._lastStepTime = timestamp;
    return true;
  };

  private runScheduledFrame = (): void => {
    this._frame++;

    for (const eventId in this._schedule) {
      if (
        Object.prototype.hasOwnProperty.call(this._schedule, eventId) &&
        this._frame % this._schedule[eventId].nthFrame === 0
      ) {
        this._schedule[eventId].callback(this._frame);
      }
    }
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
