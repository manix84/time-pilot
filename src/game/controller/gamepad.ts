/* Converted from TimePilot.Controller.Gamepad.js (AMD) to ESM TypeScript. */
import helpers from "../engine/helpers";
import type { ControlInputState, Controller, ControllerInterfaceInstance } from "../types";

type NavigatorWithGamepads = Navigator & {
  webkitGetGamepads?: () => (globalThis.Gamepad | null)[];
};

class Gamepad implements Controller {
  private _animationFrame: number | null = null;
  private _controllerInterface: ControllerInterfaceInstance;
  private _inputState?: ControlInputState;
  private _isConnected = false;
  private _isFireButtonPressed = false;
  private _isPauseButtonPressed = false;
  private _isRestartButtonPressed = false;

  constructor(
    controllerInterface: ControllerInterfaceInstance,
    inputState?: ControlInputState
  ) {
    this._controllerInterface = controllerInterface;
    this._inputState = inputState;
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
        this._setInputState("fire", true);
        this._controllerInterface.startShooting();
      } else if (!gamepad.buttons[0].pressed && this._isFireButtonPressed) {
        this._isFireButtonPressed = false;
        this._setInputState("fire", false);
        this._controllerInterface.stopShooting();
      }

      if (gamepad.buttons[9].pressed && !this._isPauseButtonPressed) {
        this._isPauseButtonPressed = true;
        this._setInputState("pause", true);
        this._controllerInterface.togglePause();
      } else if (!gamepad.buttons[9].pressed) {
        this._isPauseButtonPressed = false;
        this._setInputState("pause", false);
      }

      if (gamepad.buttons[8].pressed && !this._isRestartButtonPressed) {
        this._isRestartButtonPressed = true;
        this._setInputState("restart", true);
        this._controllerInterface.restart();
      } else if (!gamepad.buttons[8].pressed) {
        this._isRestartButtonPressed = false;
        this._setInputState("restart", false);
      }

      if (gamepad.axes[0] || gamepad.axes[1]) {
        this._setAxisState(gamepad.axes[0], gamepad.axes[1]);
        const heading = helpers.findHeading({
          posX: -gamepad.axes[0],
          posY: -gamepad.axes[1],
        });
        this._controllerInterface.rotateToHeading(heading);
      } else {
        this._setAxisState(0, 0);
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

  private _setAxisState(axisX: number, axisY: number): void {
    if (!this._inputState) {
      return;
    }

    const threshold = 0.2;
    this._inputState.left = axisX < -threshold;
    this._inputState.right = axisX > threshold;
    this._inputState.up = axisY < -threshold;
    this._inputState.down = axisY > threshold;
  }

  private _setInputState(
    key: keyof ControlInputState,
    isPressed: boolean
  ): void {
    if (this._inputState) {
      this._inputState[key] = isPressed;
    }
  }
}

export default Gamepad;
