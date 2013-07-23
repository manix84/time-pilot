define("TimePilot.Menus.pause", [
    "TimePilot.userOptions"
], function (
    userOptions
) {
    var pause = {
        name: "Paused",
        buttons: {
            musicVolume: {
                name: "Music Volume",
                options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                type: "slider",
                setValue: function () {},
                getValue: function () {}
            },
            effectsVolume: {
                name: "Effects Volume",
                type: "slider",
                options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                setValue: function () {},
                getValue: function () {}
            },
            controllerType: {
                name: "Contoller",
                type: "enum",
                options: {
                    keyboard1: "Keyboard Set 1",
                    keyboard2: "Keyboard Set 2",
                    joystick: "Joystick/Gamepad",
                    touch: "Touch Screen"
                },
                setValue: function () {},
                getValue: function () {}
            }
        }

    };

    return pause;
});

