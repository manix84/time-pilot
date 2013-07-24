define("TimePilot.ControllerInterface", [
    "TimePilot.CONSTANTS"
], function (
    CONSTS
) {

    /**
     * Create a ControllerInterface instance
     * @constructor
     * @method
     * @returns {ControllerInterface instance}
     */
    var ControllerInterface = function (player, ticker, hud, gameArena) {
        this._player = player;
        this._ticker = ticker;
        this._hud = hud;
        this._gameArena = gameArena;

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

        openMenu: function () {
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
            if (this._ticker.getState()) {
                this._ticker.stop();
                this._hud.pause();
            } else {
                this._ticker.start();
            }
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
