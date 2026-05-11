/* Converted from TimePilot.Controller.Keyboard1.js (AMD) to ESM TypeScript. */
import helpers from "../engine/helpers";
import userOptions from "../user-options";
import type { Controller, ControllerInterfaceInstance } from "../types";

class Keyboard1 implements Controller {
  private _controllerInterface: ControllerInterfaceInstance;

  constructor(controllerInterface: ControllerInterfaceInstance) {
    this._controllerInterface = controllerInterface;
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
          if (userOptions.controllerType === "keyboard2") {
            this._controllerInterface.rotateAntiClockwise();
          } else {
            this._controllerInterface.rotateToHeading(270);
          }
        } else if (bindings.up.includes(event.keyCode)) {
          event.preventDefault();
          if (userOptions.controllerType === "keyboard1") {
            this._controllerInterface.rotateToHeading(0);
          }
        } else if (bindings.right.includes(event.keyCode)) {
          event.preventDefault();
          if (userOptions.controllerType === "keyboard2") {
            this._controllerInterface.rotateClockwise();
          } else {
            this._controllerInterface.rotateToHeading(90);
          }
        } else if (bindings.down.includes(event.keyCode)) {
          event.preventDefault();
          if (userOptions.controllerType === "keyboard1") {
            this._controllerInterface.rotateToHeading(180);
          }
        } else if (bindings.fire.includes(event.keyCode)) {
          event.preventDefault();
          this._controllerInterface.startShooting();
        } else if (bindings.fullscreen.includes(event.keyCode)) {
          event.preventDefault();
          this._controllerInterface.toggleFullScreen();
        } else if (bindings.menu.includes(event.keyCode)) {
          event.preventDefault();
          this._controllerInterface.toggleMenu();
          this._controllerInterface.togglePause();
        } else if (bindings.pause.includes(event.keyCode)) {
          event.preventDefault();
          this._controllerInterface.togglePause();
        } else if (bindings.restart.includes(event.keyCode)) {
          event.preventDefault();
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
        } else if (
          bindings.left.includes(event.keyCode) ||
          bindings.up.includes(event.keyCode) ||
          bindings.right.includes(event.keyCode) ||
          bindings.down.includes(event.keyCode)
        ) {
          event.preventDefault();
          this._controllerInterface.stop();
        } else if (bindings.fire.includes(event.keyCode)) {
          event.preventDefault();
          this._controllerInterface.stopShooting();
        }
      },
    );
  }

  disconnect(): void {
    helpers.unbind("keydown");
    helpers.unbind("keyup");
  }
}

export default Keyboard1;
