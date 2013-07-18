define("TimePilot.userOptions", function () {

    var userOptions = {
        debug: {
            /**
             * Draw either a circle or a box showing what counts as a hit, either by a bullet/missile or the player.
             * @type {Boolean}
             */
            showHitboxes: true,

            /**
             * Render corner points to show the sprite dimensions.
             * @type {Boolean}
             */
            showSpriteCorners: true,

            /**
             * Render corner points to show the sprite dimensions.
             * @type {Boolean}
             */
            showSpriteCenters: true,

            /**
             * Write the current player coordinates on screen.
             * @type {Boolean}
             */
            showPlayerCoordinates: true,

            /**
             * Make the player immortal.
             * @type {boolean}
             */
            invincible: true
        },

        /**
         * Enable debug menus and overlays.
         * @type {Boolean}
         */
        enableDebug: false,

        /**
         * Selected controller to be accessed on the controlInterface.
         * @type {String}
         */
        controllerType: "keyboard1",

        /**
         * Set options in this object (userOptions), and store it so that the user doesn't have to set options each time
         * @method
         */
        setOption: function () {}
    };

    /**
     * Gather overrides the user has set.
     */
    (function () {
    }());

    return userOptions;
});
