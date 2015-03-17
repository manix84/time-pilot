/* global define */
define("TimePilot.Menus.main", [
    "TimePilot.userOptions"
], function (
    userOptions
) {
    var main = {
        name: "Welcome",
        buttons: {
            start: {
                name: "Start 1 Player",
                type: "button",
                callback: function () {}
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
                getValue: function () {},
                setValue: function () {}
            }
        }
    };

    return main;
});
