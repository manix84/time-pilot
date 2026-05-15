/* Converted from TimePilot.Controller.Gamepad.js (AMD) to ESM TypeScript. */
import helpers from "../engine/helpers";
import type {
  ControlInputName,
  ControlInputState,
  Controller,
  ControllerInterfaceInstance,
} from "../types";

type NavigatorWithGamepads = Navigator & {
  webkitGetGamepads?: () => (globalThis.Gamepad | null)[];
};
type MenuDirection = "down" | "left" | "right" | "up";

class Gamepad implements Controller {
  private _animationFrame: number | null = null;
  private _controllerInterface: ControllerInterfaceInstance;
  private _inputState?: ControlInputState;
  private _isConnected = false;
  private _isBackButtonPressed = false;
  private _isFireButtonPressed = false;
  private _isMenuButtonPressed = false;
  private _isRestartButtonPressed = false;
  private _menuDirection: MenuDirection | null = null;
  private _isRotateLeftButtonPressed = false;
  private _isRotateRightButtonPressed = false;

  constructor(
    controllerInterface: ControllerInterfaceInstance,
    inputState?: ControlInputState
  ) {
    this._controllerInterface = controllerInterface;
    this._inputState = inputState;
    this.connect();
  }

  private _gameLoop = (): void => {
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

      const isFaceButtonPressed = this._isFaceButtonPressed(gamepad);

      if (isFaceButtonPressed && !this._isFireButtonPressed) {
        this._isFireButtonPressed = true;
        this._setInputState("fire", true);
        this._controllerInterface.startShooting();
      } else if (!isFaceButtonPressed && this._isFireButtonPressed) {
        this._isFireButtonPressed = false;
        this._setInputState("fire", false);
        this._controllerInterface.stopShooting();
      }

      if (gamepad.buttons[9].pressed && !this._isMenuButtonPressed) {
        this._isMenuButtonPressed = true;
        this._setInputState("menu", true);
        this._controllerInterface.openMainMenu?.();
      } else if (!gamepad.buttons[9].pressed) {
        this._isMenuButtonPressed = false;
        this._setInputState("menu", false);
      }

      if (
        this._controllerInterface.isMenuActive?.() &&
        gamepad.buttons[8].pressed &&
        !this._isBackButtonPressed
      ) {
        this._isBackButtonPressed = true;
        this._setInputState("menu", true);
        this._controllerInterface.goBack?.();
      } else if (!this._controllerInterface.isMenuActive?.() && gamepad.buttons[8].pressed && !this._isRestartButtonPressed) {
        this._isRestartButtonPressed = true;
        this._setInputState("restart", true);
        this._controllerInterface.restart();
      } else if (!gamepad.buttons[8].pressed) {
        this._isBackButtonPressed = false;
        this._isRestartButtonPressed = false;
        this._setInputState("menu", false);
        this._setInputState("restart", false);
      }

      const menuActive = this._controllerInterface.isMenuActive?.() ?? false;

      if (gamepad.buttons[4]?.pressed && (!menuActive || !this._isRotateLeftButtonPressed)) {
        this._isRotateLeftButtonPressed = true;
        this._setActiveController();
        this._setRotationState("rotateLeft", true);
        this._controllerInterface.rotateAntiClockwise();
      } else {
        if (!gamepad.buttons[4]?.pressed) {
          this._isRotateLeftButtonPressed = false;
        }
        this._setRotationState("rotateLeft", false);
      }

      if (gamepad.buttons[5]?.pressed && (!menuActive || !this._isRotateRightButtonPressed)) {
        this._isRotateRightButtonPressed = true;
        this._setActiveController();
        this._setRotationState("rotateRight", true);
        this._controllerInterface.rotateClockwise();
      } else {
        if (!gamepad.buttons[5]?.pressed) {
          this._isRotateRightButtonPressed = false;
        }
        this._setRotationState("rotateRight", false);
      }

      const directionalInput = this._getDirectionalInput(gamepad);

      if (menuActive) {
        if (!this._isMenuGamepadInputEngaged(gamepad, directionalInput)) {
          this._handleMenuDirection({ axisX: 0, axisY: 0 });
          continue;
        }

        this._handleMenuDirection(directionalInput);
        continue;
      }

      this._menuDirection = null;

      if (directionalInput.axisX || directionalInput.axisY) {
        this._setAxisState(directionalInput.axisX, directionalInput.axisY);
        const heading = helpers.findHeading({
          posX: -directionalInput.axisX,
          posY: -directionalInput.axisY,
        });
        this._controllerInterface.rotateToHeading(heading);
      } else {
        this._setAxisState(0, 0);
      }
    }

    this._animationFrame = window.requestAnimationFrame(() => this._gameLoop());
  };

  connect = (): void => {
    if (this._isConnected) {
      return;
    }

    this._isConnected = true;
    this._gameLoop();
  };

  disconnect = (): void => {
    this._isConnected = false;

    if (this._animationFrame !== null) {
      window.cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }
  };

  private _getDirectionalInput = (gamepad: globalThis.Gamepad): {
    axisX: number;
    axisY: number;
  } => {
    const threshold = 0.2;
    const stickX = Math.abs(gamepad.axes[0] ?? 0) > threshold ? gamepad.axes[0] : 0;
    const stickY = Math.abs(gamepad.axes[1] ?? 0) > threshold ? gamepad.axes[1] : 0;

    if (stickX || stickY) {
      return {
        axisX: stickX,
        axisY: stickY,
      };
    }

    return {
      axisX: gamepad.buttons[14]?.pressed
        ? -1
        : gamepad.buttons[15]?.pressed
          ? 1
          : 0,
      axisY: gamepad.buttons[12]?.pressed
        ? -1
        : gamepad.buttons[13]?.pressed
          ? 1
          : 0,
    };
  };

  private _isFaceButtonPressed = (gamepad: globalThis.Gamepad): boolean => {
    return [0, 1, 2, 3].some((buttonIndex) => gamepad.buttons[buttonIndex]?.pressed);
  };

  private _isMenuGamepadInputEngaged = (
    gamepad: globalThis.Gamepad,
    directionalInput: { axisX: number; axisY: number }
  ): boolean => {
    if (this._inputState?.activeController === "gamepad") {
      return true;
    }

    if (
      this._isFaceButtonPressed(gamepad) ||
      gamepad.buttons[4]?.pressed ||
      gamepad.buttons[5]?.pressed ||
      gamepad.buttons[8]?.pressed ||
      gamepad.buttons[9]?.pressed ||
      [12, 13, 14, 15].some((buttonIndex) => gamepad.buttons[buttonIndex]?.pressed)
    ) {
      return true;
    }

    return (
      Math.abs(directionalInput.axisX) >= 0.75 ||
      Math.abs(directionalInput.axisY) >= 0.75
    );
  };

  private _handleMenuDirection = (directionalInput: {
    axisX: number;
    axisY: number;
  }): void => {
    const direction = this._getMenuDirection(directionalInput);

    this._setAxisState(
      direction === "left" ? -1 : direction === "right" ? 1 : 0,
      direction === "up" ? -1 : direction === "down" ? 1 : 0
    );

    if (!direction) {
      this._menuDirection = null;
      return;
    }

    if (direction === this._menuDirection) {
      return;
    }

    this._menuDirection = direction;
    const headingByDirection: Record<MenuDirection, number> = {
      down: 180,
      left: 270,
      right: 90,
      up: 0,
    };

    this._controllerInterface.rotateToHeading(headingByDirection[direction]);
  };

  private _getMenuDirection = (directionalInput: {
    axisX: number;
    axisY: number;
  }): MenuDirection | null => {
    const absX = Math.abs(directionalInput.axisX);
    const absY = Math.abs(directionalInput.axisY);

    if (absX < 0.2 && absY < 0.2) {
      return null;
    }

    if (absX > absY) {
      return directionalInput.axisX < 0 ? "left" : "right";
    }

    return directionalInput.axisY < 0 ? "up" : "down";
  };

  private _setAxisState = (axisX: number, axisY: number): void => {
    if (!this._inputState) {
      return;
    }

    const threshold = 0.2;
    this._inputState.left = axisX < -threshold;
    this._inputState.right = axisX > threshold;
    this._inputState.up = axisY < -threshold;
    this._inputState.down = axisY > threshold;

    if (
      this._inputState.left ||
      this._inputState.right ||
      this._inputState.up ||
      this._inputState.down
    ) {
      this._setActiveController();
    }
  };

  private _setActiveController = (): void => {
    if (this._inputState) {
      this._inputState.activeController = "gamepad";
    }
  };

  private _setRotationState = (key: "rotateLeft" | "rotateRight", isPressed: boolean): void => {
    if (this._inputState) {
      if (isPressed) {
        this._setActiveController();
      }

      this._inputState[key] = isPressed;
    }
  };

  private _setInputState = (key: ControlInputName, isPressed: boolean): void => {
    if (this._inputState) {
      if (isPressed) {
        this._setActiveController();
      }

      this._inputState[key] = isPressed;
    }
  };
}

export default Gamepad;
