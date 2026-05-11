/* Converted from engine/Ticker.js (AMD) to ESM TypeScript. */
import type { TickerInstance } from "../types";

type LegacyAnimationWindow = Window &
  typeof globalThis & {
    mozRequestAnimationFrame?: typeof window.requestAnimationFrame;
    webkitRequestAnimationFrame?: typeof window.requestAnimationFrame;
    msRequestAnimationFrame?: typeof window.requestAnimationFrame;
  };

var animationWindow = window as LegacyAnimationWindow;
var requestAnimationFrame =
  animationWindow.requestAnimationFrame ||
  animationWindow.mozRequestAnimationFrame ||
  animationWindow.webkitRequestAnimationFrame ||
  animationWindow.msRequestAnimationFrame;
/**
 * Creates an instance of a ticker object.
 * @method
 */
type TickerScheduleCallback = (frame: number) => void;

interface TickerScheduleItem {
  callback: TickerScheduleCallback;
  nthFrame: number;
}

var Ticker = function () {
  this._frame = 0;
  this.isRunning = false;
  this._schedule = {} as Record<number, TickerScheduleItem>;
  this._scheduleCount = 0;
} as unknown as {
  new (): TickerInstance;
  prototype: Record<string, unknown>;
};

Ticker.prototype = {
  /**
   * Start animation.
   * @method
   */
  start: function () {
    this.isRunning = true;
    this._step();
  },

  /**
   * Stop animation.
   * @method
   */
  stop: function (callback?: () => void): void {
    this.isRunning = false;
    this.killCallback = callback || (() => {});
  },

  /**
   * Run a single animated step.
   * @method
   */
  _step: function () {
    var that = this;
    requestAnimationFrame(() => {
      that._frame++;
      for (var eventId in that._schedule) {
        if (
          that._schedule.hasOwnProperty(eventId) &&
          that._frame % that._schedule[eventId].nthFrame === 0
        ) {
          that._schedule[eventId].callback(that._frame);
        }
      }
      if (that.isRunning) {
        that._step();
      } else if (that.killCallback) {
        that.killCallback();
        delete that.killCallback;
      }
    });
  },

  /**
   * Add event callback to schedule. This runs a callback on each Nth frame.
   * @method
   * @param   {Function} callback - Method to run on Nth frames.
   * @param   {Number}   nthFrame  - Run this callback ever Nth frame.
   * @returns {Number}   ID number for callback. Used in "removeSchedule".
   */
  addSchedule: function (callback: TickerScheduleCallback, nthFrame: number): number {
    nthFrame = nthFrame;

    var eventId = ++this._scheduleCount;
    this._schedule[eventId] = {
      callback: callback,
      nthFrame: nthFrame,
    };

    return eventId;
  },

  /**
   * Remove scheduled event, based on ID returned from "addSchedule" method.
   * @method
   * @param   {Number} eventId - ID to remove, passed back from "addSchedule".
   * @returns {Boolean} Boolean of if the removal sucessful. If the ID did not exist, this is still successful.
   */
  removeSchedule: function (eventId: number): boolean {
    if (this._schedule[eventId]) {
      delete this._schedule[eventId];
    }
    return !this._schedule[eventId];
  },

  /**
   * Empty Schedule of all events.
   * @method
   */
  clearSchedule: function (): void {
    this._schedule = {};
  },

  /**
   * Reset frame count back to 0.
   * @method
   * @returns {Boolean}
   */
  clearTicks: function (): boolean {
    this._frame = 0;

    return !this._frame;
  },

  /**
   * Get the current number of frames that have occured since start.
   * @method
   * @returns {Number}
   */
  getTicks: function (): number {
    return this._frame;
  },
};

export default Ticker;
