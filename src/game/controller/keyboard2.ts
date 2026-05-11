/* Converted from TimePilot.Controller.Keyboard2.js (AMD) to ESM TypeScript. */
import helpers from "../engine/helpers";
import type { Controller, ControllerInterfaceInstance } from "../types";

class Keyboard2 implements Controller {
  private _controllerInterface: ControllerInterfaceInstance;

  constructor(controllerInterface: ControllerInterfaceInstance) {
    this._controllerInterface = controllerInterface;
    this.connect();
  }

  connect(): void {
    helpers.bind(
      "keydown",
      (event: KeyboardEvent) => {
        switch (event.keyCode) {
          case 37:
          case 65:
            event.preventDefault();
            this._controllerInterface.rotateAntiClockwise();
            break;
          case 39:
          case 68:
            event.preventDefault();
            this._controllerInterface.rotateClockwise();
            break;
          case 32:
            event.preventDefault();
            this._controllerInterface.startShooting();
            break;
          case 70:
            event.preventDefault();
            this._controllerInterface.toggleFullScreen();
            break;
          case 27:
            event.preventDefault();
            this._controllerInterface.openMenu?.();
            this._controllerInterface.togglePause();
            break;
          case 80:
            event.preventDefault();
            this._controllerInterface.togglePause();
            break;
        }
      },
    );

    helpers.bind(
      "keyup",
      (event: KeyboardEvent) => {
        switch (event.keyCode) {
          case 27:
          case 70:
          case 80:
            event.preventDefault();
            break;
          case 37:
          case 39:
          case 65:
          case 68:
            event.preventDefault();
            this._controllerInterface.stop();
            break;
          case 32:
            event.preventDefault();
            this._controllerInterface.stopShooting();
            break;
        }
      },
    );
  }

  disconnect(): void {
    helpers.unbind("keydown");
    helpers.unbind("keyup");
  }
}

export default Keyboard2;
