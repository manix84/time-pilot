/* global define */
define("engine/Ticker", function () {
    var requestAnimationFrame =
            window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.msRequestAnimationFrame;
    /**
     * Creates an instance of a ticker object.
     * @method
     */
    var Ticker = function () {
        this._frame = 0;
        this.isRunning = false;
        this._schedule = {};
        this._scheduleCount = 0;
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
        stop: function () {
            this.isRunning = false;
        },

        /**
         * Run a single animated step.
         * @method
         */
        _step: function () {
            var that = this;
            requestAnimationFrame(function () {
                that._frame++;
                for (var eventId in that._schedule) {
                    if (
                        that._schedule.hasOwnProperty(eventId) &&
                        (that._frame % that._schedule[eventId].nthFrame === 0)
                    ) {
                        that._schedule[eventId].callback(that._frame);
                    }
                }
                if (that.isRunning) {
                    that._step();
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
        addSchedule: function (callback, nthFrame) {
            nthFrame = nthFrame;

            var eventId = ++this._scheduleCount;
            this._schedule[eventId] = {
                callback: callback,
                nthFrame: nthFrame
            };

            return eventId;
        },

        /**
         * Remove scheduled event, based on ID returned from "addSchedule" method.
         * @method
         * @param   {Number} eventId - ID to remove, passed back from "addSchedule".
         * @returns {Boolean} Boolean of if the removal sucessful. If the ID did not exist, this is still successful.
         */
        removeSchedule: function (eventId) {
            if (this._schedule[eventId]) {
                delete this._schedule[eventId];
            }
            return !this._schedule[eventId];
        },

        /**
         * Empty Schedule of all events.
         * @method
         */
        clearSchedule: function () {
            this._schedule = {};
        },

        /**
         * Reset frame count back to 0.
         * @method
         * @returns {Boolean}
         */
        clearTicks: function () {
            this._frame = 0;

            return !this._frame;
        },

        /**
         * Get the current number of frames that have occured since start.
         * @method
         * @returns {Number}
         */
        getTicks: function () {
            return this._frame;
        }
    };

    return Ticker;
});
