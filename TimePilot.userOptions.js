define("TimePilot.userOptions", function () {

    var userOptions = {
        debug: {
            /**
             * Draw either a circle or a box showing what counts as a hit, either by a bullet/missile or the player.
             * @type {Boolean}
             */
            showHitboxes: true,

            /**
             * Render corner points to show the sprite dimentions.
             * @type {Boolean}
             */
            showSpriteCorners: true,

            /**
             * Render corner points to show the sprite dimentions.
             * @type {Boolean}
             */
            showSpriteCenters: true,

            /**
             * Write the current player coordinates on screen.
             * @type {Boolean}
             */
            showPlayerCoordinates: true
        },

        enableDebug: true,

        controllerType: "keyboard1",

        setOption: function () {}
    };

    /**
     * Gather overrides the user has set.
     */
    (function () {

    }());

    return userOptions;
});
