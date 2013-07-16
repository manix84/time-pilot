define("TimePilot.ControlInterface", [
    "TimePilot.CONSTANTS",
    "engine/helpers"
], function (
    CONSTS,
    helpers
) {

    /**
     * Create a ControlInterface instance
     * @constructor
     * @method
     * @returns {ControlInterface instance}
     */
    var ControlInterface = function (player) {
        this._player = player;

        this._rotationStep = (360 / CONSTS.player.rotationFrameCount);
    };

    ControlInterface.prototype = {
        /**
         * Rotate to a specified heading, moving in steps.
         * @method
         * @param   {Number} desiredHeading - Heading you wish to rotate to.
         */
        rotateToHeading: function (desiredHeading) {
            var currentHeading = this._player.getData().heading;
            this._player.setData(
                "heading",
                helpers.rotateTo(desiredHeading, currentHeading, this._rotationStep)
            );
        },

        /**
         * Rotate the player clockwise.
         * @method
         */
        rotateClockwise: function () {
            var currentHeading = this._player.getData().heading,
                desiredHeading = ((currentHeading + this._rotationStep) % 360);

            this._player.setData(
                "heading",
                helpers.rotateTo(desiredHeading, currentHeading, this._rotationStep)
            );
        },

        /**
         * Rotate the player anti-clockwise.
         * @method
         */
        rotateAntiClockwise: function () {
            var currentHeading = this._player.getData().heading,
                desiredHeading = (currentHeading - this._rotationStep);

            desiredHeading = (desiredHeading < 0) ? (360 + desiredHeading) : desiredHeading;

            this._player.setData(
                "heading",
                helpers.rotateTo(desiredHeading, currentHeading, this._rotationStep)
            );
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

    return ControlInterface;
});
