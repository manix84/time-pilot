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
        this._ticks = 0;
        this.isRunning = false;
        this._schedule = {};
        this._scheduleCount = 0;
    };

    Ticker.prototype = {
        /**
         * Start ticker.
         * @method
         */
        start: function () {
            this.isRunning = true;
            this._step();
        },

        /**
         * Stop ticker.
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
                that._ticks++;
                for (var eventId in that._schedule) {
                    if (
                        that._schedule.hasOwnProperty(eventId) &&
                        (that._ticks % that._schedule[eventId].nthTick === 0)
                    ) {
                        that._schedule[eventId].callback(that._ticks);
                    }
                }
                if (that.isRunning) {
                    that._step();
                }
            });
        },

        /**
         * Add event callback to schedule. This runs a callback on each Nth tick.
         * @method
         * @param   {Function} callback - Method to run on Nth ticks.
         * @param   {Number}   nthTick  - Run this callback ever Nth tick.
         * @returns {Number}   ID number for callback. Used in "removeSchedule".
         */
        addSchedule: function (callback, nthTick) {
            nthTick = nthTick;

            var eventId = ++this._scheduleCount;
            this._schedule[eventId] = {
                callback: callback,
                nthTick: nthTick
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
         * Reset ticks back to 0.
         * @method
         * @returns {Boolean}
         */
        clearTicks: function () {
            this._ticks = 0;

            return !this._ticks;
        },

        /**
         * Get the current number of ticks that have occured since start.
         * @method
         * @returns {Number}
         */
        getTicks: function () {
            return this._ticks;
        }
    };

    return Ticker;
});
