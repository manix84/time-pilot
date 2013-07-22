define("TimePilot.Menus.pause", [
    "TimePilot.userOptions"
], function (
    userOptions
) {
    var pause = {
        musicVolume: {
            name: "Music Volume",
            options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            callback: function () {}
        },
        effectsVolume: {
            name: "Effects Volume",
            options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            callback: function () {}
        },
        controllerType: {
            name: "Contoller",
            options: {
                keyboard1: "Keyboard Set 1",
                keyboard2: "Keyboard Set 2",
                joystick: "Joystick/Gamepad",
                touch: "Touch Screen"
            },
            callback: function () {}
        }
    };

    return pause;
});

