/* Converted from TimePilot.Controller.Keyboard2.js (AMD) to ESM TypeScript. */
import { helpers } from "@time-pilot/arcade-engine";
import userOptions from "../user-options";
import type {
  ControlInputName,
  ControlInputState,
  Controller,
  ControllerInterfaceInstance,
} from "../types";

/**
 * Secondary keyboard controller adapter.
 */
class Keyboard2 implements Controller {
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
        const menuActive = this._controllerInterface.isMenuActive?.() ?? false;

        if (menuActive && event.repeat && this._isMenuCommandKey(event.keyCode)) {
          event.preventDefault();
          return;
        }

        if (event.keyCode === 77) {
          event.preventDefault();
          this._setInputState("menu", true);
          this._controllerInterface.openMainMenu?.();
        } else if (event.keyCode === 187 || event.keyCode === 107) {
          event.preventDefault();
          this._controllerInterface.adjustZoom?.(1);
        } else if (event.keyCode === 189 || event.keyCode === 109) {
          event.preventDefault();
          this._controllerInterface.adjustZoom?.(-1);
        } else if (event.keyCode === 48 || event.keyCode === 96) {
          event.preventDefault();
          this._controllerInterface.resetZoom?.();
        } else if (bindings.fullscreen.includes(event.keyCode)) {
          event.preventDefault();
          this._controllerInterface.toggleFullScreen();
        } else if (bindings.left.includes(event.keyCode)) {
          event.preventDefault();
          if (menuActive) {
            this._controllerInterface.rotateToHeading(270);
          } else if (userOptions.controllerType === "keyboard2") {
            this._setInputState("left", true);
            this._controllerInterface.rotateAntiClockwise();
          } else {
            this._setInputState("left", true);
            this._controllerInterface.rotateToHeading(270);
          }
        } else if (bindings.up.includes(event.keyCode)) {
          event.preventDefault();
          if (
            menuActive ||
            userOptions.controllerType === "keyboard1"
          ) {
            if (!menuActive) {
              this._setInputState("up", true);
            }
            this._controllerInterface.rotateToHeading(0);
          }
        } else if (bindings.right.includes(event.keyCode)) {
          event.preventDefault();
          if (menuActive) {
            this._controllerInterface.rotateToHeading(90);
          } else if (userOptions.controllerType === "keyboard2") {
            this._setInputState("right", true);
            this._controllerInterface.rotateClockwise();
          } else {
            this._setInputState("right", true);
            this._controllerInterface.rotateToHeading(90);
          }
        } else if (bindings.down.includes(event.keyCode)) {
          event.preventDefault();
          if (
            menuActive ||
            userOptions.controllerType === "keyboard1"
          ) {
            if (!menuActive) {
              this._setInputState("down", true);
            }
            this._controllerInterface.rotateToHeading(180);
          }
        } else if (
          event.keyCode === 13 &&
          menuActive
        ) {
          event.preventDefault();
          this._controllerInterface.startShooting();
        } else if (bindings.fire.includes(event.keyCode)) {
          event.preventDefault();
          this._setInputState("fire", true);
          this._controllerInterface.startShooting();
        } else if (bindings.menu.includes(event.keyCode)) {
          event.preventDefault();
          this._setInputState("menu", true);
          this._controllerInterface.goBack?.();
          this._controllerInterface.openMenu?.();
        } else if (bindings.pause.includes(event.keyCode)) {
          event.preventDefault();
          this._setInputState("pause", true);
          this._controllerInterface.togglePause();
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
          bindings.pause.includes(event.keyCode)
        ) {
          event.preventDefault();
          this._setInputState("menu", false);
          this._setInputState("pause", false);
        } else if (
          bindings.left.includes(event.keyCode) ||
          bindings.up.includes(event.keyCode) ||
          bindings.down.includes(event.keyCode) ||
          bindings.right.includes(event.keyCode)
        ) {
          event.preventDefault();
          this._setInputState("left", false);
          this._setInputState("up", false);
          this._setInputState("right", false);
          this._setInputState("down", false);
          this._controllerInterface.stop();
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

  private _isMenuCommandKey = (keyCode: number): boolean => {
    const bindings = userOptions.keyboardBindings;

    return (
      keyCode === 13 ||
      bindings.fire.includes(keyCode) ||
      bindings.left.includes(keyCode) ||
      bindings.up.includes(keyCode) ||
      bindings.right.includes(keyCode) ||
      bindings.down.includes(keyCode)
    );
  };
}

export default Keyboard2;
