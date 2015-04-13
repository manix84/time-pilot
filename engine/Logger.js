/* global define */
/*jshint noarg: false*/
define("engine/Logger", function () {

    var INCLUDE_SYS_TIME = false;
    var INCLUDE_NAME_PREFIX = true;
    var INCLUDE_CALLER_NAME_IN_PREFIX = true;
    var INCLUDE_SCRIPT_NAME_IN_PREFIX = true;

    /**
     * Setting up safety net for console log.
     * @type {Console Object}
     */
    var console = window.console || {
        trace: function () {},
        log: function () {},
        debug: function () {},
        info: function () {},
        warn: function () {},
        error: function () {}
    };

    /**
     * Flag to enable debugging on all scripts.
     * @type {Boolean}
     */
    var _isDebugAllScripts = (window._isDebug || true);

    var _debugStatuses = {};

    /**
     * Creates a formatted string of the current script and function.
     * @return {String} Formatted script for current time (EG: 12:34:56.789)
     */
    var _getNamePrefix = function (scriptName) {
        scriptName = scriptName || null;
        var callerName = arguments.callee.caller.caller.caller.name || null,
            outputString = "";

        if (scriptName && INCLUDE_SCRIPT_NAME_IN_PREFIX) {
            outputString += (scriptName.charAt(0).toUpperCase() + scriptName.slice(1));
        }
        if (callerName && INCLUDE_CALLER_NAME_IN_PREFIX) {
            outputString += "." + callerName;
        }

        return outputString;
    };

    /**
     * Log messages to the console.
     */
    var _output = function (action, level, args) {
        var scriptNameLC = (typeof this._scriptName === "string" ? this._scriptName.toLowerCase() : null);
        if (_isDebugAllScripts || (scriptNameLC && _debugStatuses[scriptNameLC])) {
            var namePrefix = _getNamePrefix(this._scriptName);

            if (namePrefix && INCLUDE_NAME_PREFIX) {
                args.unshift("[" + namePrefix + "]");
            }

            console[action].apply(console, args);
        }
    };

    /**
     * Logger object, used to extend other objects with Logger methods.
     * @constructor
     * @constructs Logger
     * @param {String} [scriptName] Name representing module that's being run. This is used in console output.
     */
    var Logger = function (scriptName) {
        var that = this;

        this._scriptName = scriptName || "anonymous_" + (_debugStatuses.length + 1);

        if (this._scriptName) {
            var scriptNameLC = this._scriptName.toLowerCase();
            _debugStatuses[scriptNameLC] = false;
        }
    };

    Logger.prototype = {

        /**
         * Sends a stack trace to the console window. The trace includes the complete call stack, and includes info such
         * as filename, line number, and column number.
         *     Log Level: 5
         *     Shows on log level "trace" only.
         * @method
         */
        trace: function () {
            var argsArray = Array.prototype.slice.call(arguments);
            _output.apply(this, ["trace", 5, argsArray]);
        },

        /**
         * Sends message to the console window.
         * @alias Logger.debug()
         * @deprecated Replaced with Debug.
         */
        log: function () {
            var argsArray = Array.prototype.slice.call(arguments);
            _output.apply(this, ["debug", 4, argsArray]);
        },

        /**
         * Sends message to the console window.
         *     Log Level: 4
         *     Shows on log levels "debug" and "trace".
         * @method
         *
         */
        debug: function () {
            var argsArray = Array.prototype.slice.call(arguments);
            _output.apply(this, ["debug", 4, argsArray]);
        },

        /**
         * Sends message to the console window. The message is prefaced by an information symbol.
         *     Log Level: 3
         *     Shows on log levels "info", "debug" and "trace".
         * @method
         */
        info: function () {
            var argsArray = Array.prototype.slice.call(arguments);
            _output.apply(this, ["info", 3, argsArray]);
        },

        /**
         * Sends message to the console window, prefaced by a warning symbol.
         *     Log Level: 2
         *     Shows on log levels "warn", "info", "debug" and "trace".
         * @method
         */
        warn: function () {
            var argsArray = Array.prototype.slice.call(arguments);
            _output.apply(this, ["warn", 2, argsArray]);
        },

        /**
         * Sends message to the console window. The message text is red and prefaced by an error symbol.
         *     Log Level: 1
         *     Shows on log levels "error", "warn", "info", "debug" and "trace".
         * @method
         */
        error: function () {
            var argsArray = Array.prototype.slice.call(arguments);
            _output.apply(this, ["error", 1, argsArray]);
        },

        /**
         * Fatal error. Breaks the page.
         *     Log Level: 0
         *     Always shown.
         * @method
         */
        fatal: function () {
            var argsArray = Array.prototype.slice.call(arguments);
            _output.apply(this, ["error", 0, argsArray]);
        }
    };

    return Logger;
});
