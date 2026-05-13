/* Converted from TimePilot.Controller.Keyboard1.js (AMD) to ESM TypeScript. */
import helpers from "../engine/helpers";
import userOptions from "../user-options";
import type {
  ControlInputName,
  ControlInputState,
  Controller,
  ControllerInterfaceInstance,
} from "../types";

class Keyboard1 implements Controller {
  private _controllerInterface: ControllerInterfaceInstance;
  private _inputState?: ControlInputState;

  constructor(
    controllerInterface: ControllerInterfaceInstance,
    inputState?: ControlInputState
  ) {
    this._controllerInterface = controllerInterface;
    this._inputState = inputState;
    this.connect();
  }

  connect = (): void => {
    helpers.bind(
      "keydown",
      (event: KeyboardEvent) => {
        if (this._controllerInterface.captureKey?.(event.keyCode)) {
          event.preventDefault();
          return;
        }

        const bindings = userOptions.keyboardBindings;

        if (event.keyCode === 77) {
          event.preventDefault();
          this._setInputState("menu", true);
          this._controllerInterface.openMainMenu?.();
        } else if (event.keyCode === 187 || event.keyCode === 107) {
          event.preventDefault();
          this._controllerInterface.adjustUiZoom?.(1);
        } else if (event.keyCode === 189 || event.keyCode === 109) {
          event.preventDefault();
          this._controllerInterface.adjustUiZoom?.(-1);
        } else if (bindings.left.includes(event.keyCode)) {
          event.preventDefault();
          this._setInputState("left", true);
          if (this._controllerInterface.isMenuActive?.()) {
            this._controllerInterface.rotateToHeading(270);
          } else if (userOptions.controllerType === "keyboard2") {
            this._controllerInterface.rotateAntiClockwise();
          } else {
            this._applyDirectionalHeading();
          }
        } else if (bindings.up.includes(event.keyCode)) {
          event.preventDefault();
          this._setInputState("up", true);
          if (this._controllerInterface.isMenuActive?.()) {
            this._controllerInterface.rotateToHeading(0);
          } else if (userOptions.controllerType === "keyboard1") {
            this._applyDirectionalHeading();
          }
        } else if (bindings.right.includes(event.keyCode)) {
          event.preventDefault();
          this._setInputState("right", true);
          if (this._controllerInterface.isMenuActive?.()) {
            this._controllerInterface.rotateToHeading(90);
          } else if (userOptions.controllerType === "keyboard2") {
            this._controllerInterface.rotateClockwise();
          } else {
            this._applyDirectionalHeading();
          }
        } else if (bindings.down.includes(event.keyCode)) {
          event.preventDefault();
          this._setInputState("down", true);
          if (this._controllerInterface.isMenuActive?.()) {
            this._controllerInterface.rotateToHeading(180);
          } else if (userOptions.controllerType === "keyboard1") {
            this._applyDirectionalHeading();
          }
        } else if (
          event.keyCode === 13 &&
          this._controllerInterface.isMenuActive?.()
        ) {
          event.preventDefault();
          this._controllerInterface.startShooting();
        } else if (bindings.fire.includes(event.keyCode)) {
          event.preventDefault();
          this._setInputState("fire", true);
          this._controllerInterface.startShooting();
        } else if (bindings.fullscreen.includes(event.keyCode)) {
          event.preventDefault();
          this._controllerInterface.toggleFullScreen();
        } else if (bindings.menu.includes(event.keyCode)) {
          event.preventDefault();
          this._setInputState("menu", true);
          this._controllerInterface.goBack?.();
          this._controllerInterface.openMenu?.();
        } else if (bindings.pause.includes(event.keyCode)) {
          event.preventDefault();
          this._setInputState("pause", true);
          this._controllerInterface.togglePause();
        } else if (bindings.restart.includes(event.keyCode)) {
          event.preventDefault();
          this._setInputState("restart", true);
          this._controllerInterface.restart();
        }
      },
    );

    helpers.bind(
      "keyup",
      (event: KeyboardEvent) => {
        const bindings = userOptions.keyboardBindings;

        if (
          bindings.menu.includes(event.keyCode) ||
          bindings.fullscreen.includes(event.keyCode) ||
          bindings.pause.includes(event.keyCode) ||
          bindings.restart.includes(event.keyCode)
        ) {
          event.preventDefault();
          this._setInputState("menu", false);
          this._setInputState("pause", false);
          this._setInputState("restart", false);
        } else if (
          bindings.left.includes(event.keyCode) ||
          bindings.up.includes(event.keyCode) ||
          bindings.right.includes(event.keyCode) ||
          bindings.down.includes(event.keyCode)
        ) {
          event.preventDefault();
          this._setReleasedDirection(event.keyCode);

          if (
            userOptions.controllerType === "keyboard1" &&
            this._hasDirectionalInput()
          ) {
            this._applyDirectionalHeading();
          } else {
            this._controllerInterface.stop();
          }
        } else if (bindings.fire.includes(event.keyCode)) {
          event.preventDefault();
          this._setInputState("fire", false);
          this._controllerInterface.stopShooting();
        }
      },
    );
  };

  disconnect = (): void => {
    helpers.unbind("keydown");
    helpers.unbind("keyup");
  };

  private _setInputState = (key: ControlInputName, isPressed: boolean): void => {
    if (this._inputState) {
      if (isPressed) {
        this._inputState.activeController = "keyboard";
      }

      this._inputState[key] = isPressed;
    }
  };

  private _setReleasedDirection = (keyCode: number): void => {
    const bindings = userOptions.keyboardBindings;

    if (bindings.left.includes(keyCode)) {
      this._setInputState("left", false);
    }

    if (bindings.up.includes(keyCode)) {
      this._setInputState("up", false);
    }

    if (bindings.right.includes(keyCode)) {
      this._setInputState("right", false);
    }

    if (bindings.down.includes(keyCode)) {
      this._setInputState("down", false);
    }
  };

  private _hasDirectionalInput = (): boolean => {
    return !!(
      this._inputState?.left ||
      this._inputState?.up ||
      this._inputState?.right ||
      this._inputState?.down
    );
  };

  private _applyDirectionalHeading = (): void => {
    if (!this._inputState) {
      return;
    }

    const axisX =
      (this._inputState.right ? 1 : 0) - (this._inputState.left ? 1 : 0);
    const axisY =
      (this._inputState.down ? 1 : 0) - (this._inputState.up ? 1 : 0);

    if (!axisX && !axisY) {
      this._controllerInterface.stop();
      return;
    }

    this._controllerInterface.rotateToHeading(
      helpers.findHeading({
        posX: -axisX,
        posY: -axisY,
      })
    );
  };
}

export default Keyboard1;
