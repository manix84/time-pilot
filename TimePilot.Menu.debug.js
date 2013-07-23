define("TimePilot.Menus.debug", [
    "TimePilot.userOptions"
], function (
    userOptions
) {
    var debug = {
        name: "Debug Options",
        buttons: {
            showHitboxes: {
                name: "Show Hit Boxes",
                type: "toggle",
                setValue: function () {},
                getValue: function () {}
            },
            showSpriteCorners: {
                name: "Show Sprite Corners",
                type: "toggle",
                setValue: function () {},
                getValue: function () {}
            },
            showSpriteCenters: {
                name: "Show Sprite Centers",
                type: "toggle",
                setValue: function () {},
                getValue: function () {}
            },
            showPlayerCoordinates: {
                name: "Show Player Coordinates",
                type: "toggle",
                setValue: function () {},
                getValue: function () {}
            },
            invincible: {
                name: "Invinicibility",
                type: "toggle",
                setValue: function () {},
                getValue: function () {}
            }
        }
    };

    return debug;
});
