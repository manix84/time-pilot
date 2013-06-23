define("Ticker", function () {
    /**
     * Creates an instance of a ticker object.
     * @method
     * @param   {Function} callback      - Function to be run when start is called.
     * @param   {Number}   [interval=17] - Interval between ticks. Defaults to 60fps (17ms interval).
     */
    var Ticker = function (callback, interval) {
        this._callback = callback;
        this._interval = interval || 17;
        this._ticks = 0;
        this._state = 0;
    };

    Ticker.prototype = {
        /**
         * Start ticker.
         * @method
         * @returns {Boolean}
         */
        start: function () {
            var that = this;
            this._theTicker = window.setInterval(function () {
                that._ticks++;
                that._callback();
            }, this._interval);
            this._state = 1;
            return !!this._theTicker;
        },

        /**
         * Stop ticker.
         * @method
         * @returns {Boolean}
         */
        stop: function () {
            window.clearInterval(this._theTicker);
            this._state = 0;
            return !this._theTicker;
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
         * Currently running state. 1 = running, 0 = stopped.
         * @method
         * @returns {Number}
         */
        getState: function () {
            return this._state;
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
