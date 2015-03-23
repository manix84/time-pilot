/* global define */
define("TimePilot.Controller.Gamepad", [
    "engine/helpers"
], function (
    helpers
) {

    var Gamepad = function (controllerInterface) {
        this._controllerInterface = controllerInterface;
        window.console.log("Gamepad Interface");

        this.connect();
    };

    Gamepad.prototype = {

        /**
         * [_listener description]
         * @method _listener
         * @param  {Event Object}  event
         */
        _listener: function (event) {
            this._gameLoop();
        },

        _gameLoop: function () {
            var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
            for (var playerIndex = 0; playerIndex < gamepads.length; playerIndex++) {
                var gamepad = gamepads[playerIndex];
                if (gamepad) {
                    if (gamepad.buttons[0].pressed && !this._isShooting) {
                        this._isShooting = true;
                        this._controllerInterface.startShooting();
                        window.console.log("start shooting");
                    } else if (!gamepad.buttons[0].pressed && this._isShooting) {
                        this._isShooting = false;
                        this._controllerInterface.stopShooting();
                        window.console.log("stop shooting");
                    }

                    if (gamepad.buttons[9].pressed && !this._isPausePressed) {
                        this._isPausePressed = true;
                        this._controllerInterface.togglePause();
                    } else if (!gamepad.buttons[9].pressed) {
                        this._isPausePressed = false;
                    }

                    if (gamepad.axes[0] || gamepad.axes[1]) {
                        var heading = helpers.findHeading({
                            posX: -(gamepad.axes[0]),
                            posY: -(gamepad.axes[1])
                        });
                        this._controllerInterface.rotateToHeading(heading);
                    }
                }
            }
            window.requestAnimationFrame(this._gameLoop.bind(this));
        },

        /**
         * [connect description]
         * @method connect
         */
        connect: function () {
            window.console.log("Connecting");
            this._gameLoop();
        },

        /**
         * [disconnect description]
         * @method disconnect
         */
        disconnect: function () {
            window.console.log("Disconnecting");
            window.removeEventListener("gamepadconnected", this._listener.bind(this), false);
        }
    };

    return Gamepad;
});
