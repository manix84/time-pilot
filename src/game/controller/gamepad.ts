/* Converted from TimePilot.Controller.Gamepad.js (AMD) to ESM TypeScript. */
import helpers from "../engine/helpers";
import type { Controller, ControllerInterfaceInstance } from "../types";

type NavigatorWithGamepads = Navigator & {
  webkitGetGamepads?: () => (globalThis.Gamepad | null)[];
};

class Gamepad implements Controller {
  private _animationFrame: number | null = null;
  private _controllerInterface: ControllerInterfaceInstance;
  private _isConnected = false;
  private _isFireButtonPressed = false;
  private _isPauseButtonPressed = false;
  private _isRestartButtonPressed = false;

  constructor(controllerInterface: ControllerInterfaceInstance) {
    this._controllerInterface = controllerInterface;
    this.connect();
  }

  private _gameLoop(): void {
    if (!this._isConnected) {
      return;
    }

    const navigatorWithGamepads = navigator as NavigatorWithGamepads;
    const gamepads = navigator.getGamepads
      ? navigator.getGamepads()
      : navigatorWithGamepads.webkitGetGamepads
        ? navigatorWithGamepads.webkitGetGamepads()
        : [];

    for (const gamepad of gamepads) {
      if (!gamepad) {
        continue;
      }

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
        const heading = helpers.findHeading({
          posX: -gamepad.axes[0],
          posY: -gamepad.axes[1],
        });
        this._controllerInterface.rotateToHeading(heading);
      }
    }

    this._animationFrame = window.requestAnimationFrame(() => this._gameLoop());
  }

  connect(): void {
    if (this._isConnected) {
      return;
    }

    this._isConnected = true;
    this._gameLoop();
  }

  disconnect(): void {
    this._isConnected = false;

    if (this._animationFrame !== null) {
      window.cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }
  }
}

export default Gamepad;
