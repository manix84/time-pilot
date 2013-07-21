define("TimePilot.Menus", [
    "TimePilot.userOptions"
], function (
    userOptions
) {
    var Menus = function (gameArena) {
        this._gameArena = gameArena;
    };

    Menus.prototype = {
        _map: [
            {
                name: "Music Volume",
                key: "music_volume",
                options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
            },
            {
                name: "Effects Volume",
                key: "effects_volume",
                options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
            },
            {
                name: "Contoller",
                key: "controller_type",
                options: {
                    keyboard1: "Keyboard Set 1",
                    keyboard2: "Keyboard Set 2",
                    joystick: "Joystick/Gamepad",
                    touch: "Touch Screen"
                }
            },
            {
                name: "Debug",
                key: "debug",
                map: [
                    {
                        name: "Show Hit Boxes",
                        key: "debug.showHitboxes"
                    },
                    {
                        name: "Show Sprite Corners",
                        key: "debug.showSpriteCorners"
                    },
                    {
                        name: "Show Sprite Centers",
                        key: "debug.showSpriteCenters"
                    },
                    {
                        name: "Show Player Coordinates",
                        key: "debug.showPlayerCoordinates"
                    },
                    {
                        name: "Invinicibility",
                        key: "debug.invincible"
                    }
                ]
            }
        ],

        show: function () {},

        hide: function () {}
    };

    return Menus;
});
