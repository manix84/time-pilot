define("TimePilot.Menus.main", function () {
    var main = {
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

    return main;
});
