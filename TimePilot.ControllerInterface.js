/* global define */
define("TimePilot.ControllerInterface", [
    "TimePilot.CONSTANTS",
    "TimePilot.dataStore"
], function (
    CONSTS,
    dataStore
) {

    /**
     * Create a ControllerInterface instance
     * @constructor
     * @method
     * @returns {ControllerInterface instance}
     */
    var ControllerInterface = function (commands) {
        this._player = dataStore._player;
        this._ticker = dataStore._ticker;
        this._hud = dataStore._hud;
        this._gameArena = dataStore._gameArena;

        this._commands = {
            restart: commands.restart || function () {},
            pause: commands.pause || function () {}
        }

        this._rotationStep = (360 / CONSTS.player.rotationFrameCount);
    };

    ControllerInterface.prototype = {
        /**
         * Rotate to a specified heading, moving in steps.
         * @method
         * @param   {Number} desiredHeading - Heading you wish to rotate to.
         */
        rotateToHeading: function (desiredHeading) {
            this._player.setData("newHeading", desiredHeading);
        },

        /**
         * Rotate the player clockwise.
         * @method
         */
        rotateClockwise: function () {
            var currentHeading = this._player.getData().heading,
                desiredHeading = ((currentHeading + this._rotationStep) % 360);

            this._player.setData("newHeading", desiredHeading);
        },

        /**
         * Rotate the player anti-clockwise.
         * @method
         */
        rotateAntiClockwise: function () {
            var currentHeading = this._player.getData().heading,
                desiredHeading = (currentHeading - this._rotationStep);

            desiredHeading = ((desiredHeading < 0) ? (360 + desiredHeading) : desiredHeading);

            this._player.setData("newHeading", desiredHeading);
        },

        /**
         * Stop rotating to last desired heading.
         * @method
         */
        stop: function () {
            this._player.setData("newHeading", false);
        },

        toggleMenu: function () {
            window.console.log("Opening Menu");
        },

        startShooting: function () {
            this._player.startShooting();
        },

        stopShooting: function () {
            this._player.stopShooting();
        },

        toggleFullScreen: function () {
            this._gameArena.toggleFullScreen();
        },

        togglePause: function () {
            this._commands.pause();
        },

        restart: function () {
            this._commands.restart();
        },

        /**
         * An alias for rotateAntiClockwise
         */
        rotateCounterClockwise: this.rotateAntiClockwise,

        /**
         * An alias for rotateClockwise.
         */
        rotateRight: this.rotateClockwise,

        /**
         * An alias for rotateAntiClockwise
         */
        rotateLeft: this.rotateAntiClockwise


    };

    return ControllerInterface;
});
