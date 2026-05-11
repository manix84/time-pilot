/* Converted from TimePilot.Controller.Gamepad.js (AMD) to ESM TypeScript. */
import helpers from "./engine/helpers";
import type { Controller, ControllerInterfaceInstance } from "./TimePilot.types";

var Gamepad = function (controllerInterface: ControllerInterfaceInstance) {
  this._controllerInterface = controllerInterface;

  this.connect();
} as unknown as {
  new (controllerInterface: ControllerInterfaceInstance): Controller;
  prototype: Record<string, unknown>;
};

Gamepad.prototype = {
  /**
   * Is the fire button pressed on the Gamepad.
   * @type {Boolean}
   */
  _isFireButtonPressed: false,
  /**
   * Is the pause button pressed on the Gamepad.
   * @type {Boolean}
   */
  _isPauseButtonPressed: false,
  /**
   * Is the restart button pressed on the Gamepad.
   * @type {Boolean}
   */
  _isRestartButtonPressed: false,

  /**
   * Looping to check for gamepad data.
   * @method _gameLoop
   */
  _gameLoop: function () {
    var navigatorWithGamepads = navigator as Navigator & {
      webkitGetGamepads?: () => (Gamepad | null)[];
    };
    var gamepads = navigator.getGamepads
      ? navigator.getGamepads()
      : navigatorWithGamepads.webkitGetGamepads
        ? navigatorWithGamepads.webkitGetGamepads()
        : [];
    for (var playerIndex = 0; playerIndex < gamepads.length; playerIndex++) {
      var gamepad = gamepads[playerIndex];
      if (gamepad) {
        if (gamepad.buttons[0].pressed && !this._isFireButtonPressed) {
          this._isFireButtonPressed = true;
          this._controllerInterface.startShooting();
        } else if (!gamepad.buttons[0].pressed && this._isFireButtonPressed) {
          this._isFireButtonPressed = false;
          this._controllerInterface.stopShooting();
        }

        if (gamepad.buttons[9].pressed && !this._isPauseButtonPressed) {
          this._isPauseButtonPressed = true;
          this._controllerInterface.togglePause();
        } else if (!gamepad.buttons[9].pressed) {
          this._isPauseButtonPressed = false;
        }

        if (gamepad.buttons[8].pressed && !this._isRestartButtonPressed) {
          this._isRestartButtonPressed = true;
          this._controllerInterface.restart();
        } else if (!gamepad.buttons[8].pressed) {
          this._isRestartButtonPressed = false;
        }

        if (gamepad.axes[0] || gamepad.axes[1]) {
          var heading = helpers.findHeading({
            posX: -gamepad.axes[0],
            posY: -gamepad.axes[1],
          });
          this._controllerInterface.rotateToHeading(heading);
        }
      }
    }
    window.requestAnimationFrame(this._gameLoop.bind(this));
  },

  /**
   * Connecting the Gamepad controller interface
   * @method connect
   */
  connect: function () {
    this._gameLoop();
  },

  /**
   * Disconnecting the Gamepad controller interface.
   * @method disconnect
   */
  disconnect: () => {},
};

export default Gamepad;
