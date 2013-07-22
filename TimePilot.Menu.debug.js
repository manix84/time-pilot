define("TimePilot.Menus.debug", [
    "TimePilot.userOptions"
], function (
    userOptions
) {
    var debug = {
        showHitboxes: {
            name: "Show Hit Boxes",
            callback: function () {}
        },
        showSpriteCorners: {
            name: "Show Sprite Corners",
            callback: function () {}
        },
        showSpriteCenters: {
            name: "Show Sprite Centers",
            callback: function () {}
        },
        showPlayerCoordinates: {
            name: "Show Player Coordinates",
            callback: function () {}
        },
        invincible: {
            name: "Invinicibility",
            callback: function () {}
        }
    };

    return debug;
});
