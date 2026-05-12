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

  connect(): void {
    helpers.bind(
      "keydown",
      (event: KeyboardEvent) => {
        if (this._controllerInterface.captureKey?.(event.keyCode)) {
          event.preventDefault();
          return;
        }

        const bindings = userOptions.keyboardBindings;

        if (bindings.left.includes(event.keyCode)) {
          event.preventDefault();
          this._setInputState("left", true);
          if (userOptions.controllerType === "keyboard2") {
            this._controllerInterface.rotateAntiClockwise();
          } else {
            this._controllerInterface.rotateToHeading(270);
          }
        } else if (bindings.up.includes(event.keyCode)) {
          event.preventDefault();
          this._setInputState("up", true);
          if (userOptions.controllerType === "keyboard1") {
            this._controllerInterface.rotateToHeading(0);
          }
        } else if (bindings.right.includes(event.keyCode)) {
          event.preventDefault();
          this._setInputState("right", true);
          if (userOptions.controllerType === "keyboard2") {
            this._controllerInterface.rotateClockwise();
          } else {
            this._controllerInterface.rotateToHeading(90);
          }
        } else if (bindings.down.includes(event.keyCode)) {
          event.preventDefault();
          this._setInputState("down", true);
          if (userOptions.controllerType === "keyboard1") {
            this._controllerInterface.rotateToHeading(180);
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
          if (this._controllerInterface.openMenu) {
            this._controllerInterface.openMenu();
          } else {
            this._controllerInterface.toggleMenu();
          }
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
  }

  disconnect(): void {
    helpers.unbind("keydown");
    helpers.unbind("keyup");
  }

  private _setInputState(key: ControlInputName, isPressed: boolean): void {
    if (this._inputState) {
      this._inputState[key] = isPressed;
    }
  }
}

export default Keyboard1;
