import helpers from "../engine/helpers";
import type {
  ControlInputName,
  ControlInputState,
  Controller,
  ControllerInterfaceInstance,
  Coordinates,
} from "../types";

class TouchController implements Controller {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _controllerInterface: ControllerInterfaceInstance;
  private readonly _deadZone = 18;
  private readonly _inputState?: ControlInputState;
  private _activeTouchId: number | null = null;
  private _touchOrigin: Coordinates | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    controllerInterface: ControllerInterfaceInstance,
    inputState?: ControlInputState
  ) {
    this._canvas = canvas;
    this._controllerInterface = controllerInterface;
    this._inputState = inputState;
    this.connect();
  }

  connect = (): void => {
    this._canvas.addEventListener("touchstart", this.handleTouchStart, {
      passive: false,
    });
    this._canvas.addEventListener("touchmove", this.handleTouchMove, {
      passive: false,
    });
    this._canvas.addEventListener("touchend", this.handleTouchEnd, {
      passive: false,
    });
    this._canvas.addEventListener("touchcancel", this.handleTouchEnd, {
      passive: false,
    });
  };

  disconnect = (): void => {
    this._canvas.removeEventListener("touchstart", this.handleTouchStart);
    this._canvas.removeEventListener("touchmove", this.handleTouchMove);
    this._canvas.removeEventListener("touchend", this.handleTouchEnd);
    this._canvas.removeEventListener("touchcancel", this.handleTouchEnd);
  };

  private handleTouchStart = (event: TouchEvent): void => {
    event.preventDefault();

    const touch = event.changedTouches[0];
    if (!touch) {
      return;
    }

    this._activeTouchId = touch.identifier;
    const point = this.getCanvasPoint(touch);
    this._touchOrigin = point;

    if (this._controllerInterface.isMenuActive?.()) {
      this._controllerInterface.handlePointer?.({
        ...point,
        type: "press",
      });
      return;
    }

    this._controllerInterface.startShooting();
    if (this._inputState) {
      this._inputState.fire = true;
    }
    this.updateHeadingFromPoint(this.getRelativePoint(point));
  };

  private handleTouchMove = (event: TouchEvent): void => {
    event.preventDefault();

    const touch = this.getActiveTouch(event.changedTouches);
    if (!touch) {
      return;
    }

    const point = this.getCanvasPoint(touch);

    if (this._controllerInterface.isMenuActive?.()) {
      this._controllerInterface.handlePointer?.({
        ...point,
        type: "drag",
      });
      return;
    }

    this.updateHeadingFromPoint(this.getRelativePoint(point));
  };

  private handleTouchEnd = (event: TouchEvent): void => {
    event.preventDefault();

    const touch = this.getActiveTouch(event.changedTouches);
    if (!touch) {
      return;
    }

    if (this._controllerInterface.isMenuActive?.()) {
      const point = this.getCanvasPoint(touch);

      this._controllerInterface.handlePointer?.({
        ...point,
        type: "release",
      });
    }

    this._controllerInterface.stopShooting();
    if (this._inputState) {
      this._inputState.fire = false;
    }
    this._activeTouchId = null;
    this._touchOrigin = null;
    this.clearDirectionState();
  };

  private getActiveTouch = (touchList: TouchList): Touch | null => {
    for (const touch of Array.from(touchList)) {
      if (touch.identifier === this._activeTouchId) {
        return touch;
      }
    }

    return null;
  };

  private getCanvasPoint = (touch: Touch): Coordinates => {
    const bounds = this._canvas.getBoundingClientRect();
    const scaleX = this._canvas.width / bounds.width;
    const scaleY = this._canvas.height / bounds.height;

    return {
      posX: (touch.clientX - bounds.left) * scaleX - this._canvas.width / 2,
      posY: (touch.clientY - bounds.top) * scaleY - this._canvas.height / 2,
    };
  };

  private getRelativePoint = (point: Coordinates): Coordinates => {
    if (!this._touchOrigin) {
      throw new Error("Touch movement cannot be resolved without a touch origin.");
    }

    return {
      posX: point.posX - this._touchOrigin.posX,
      posY: point.posY - this._touchOrigin.posY,
    };
  };

  private updateHeadingFromPoint = (point: Coordinates): void => {
    const distance = Math.hypot(point.posX, point.posY);

    if (distance < this._deadZone) {
      return;
    }

    const heading = helpers.findHeading({
      posX: -point.posX,
      posY: -point.posY,
    });
    this._controllerInterface.rotateToHeading(heading);
    this.setDirectionalInput(point);
  };

  private setDirectionalInput = (point: Coordinates): void => {
    if (!this._inputState) {
      return;
    }

    const horizontal = Math.abs(point.posX) > this._deadZone;
    const vertical = Math.abs(point.posY) > this._deadZone;

    this._inputState.activeController = "touch";
    this._inputState.left = horizontal && point.posX < 0;
    this._inputState.right = horizontal && point.posX > 0;
    this._inputState.up = vertical && point.posY < 0;
    this._inputState.down = vertical && point.posY > 0;
  };

  private clearDirectionState = (): void => {
    if (!this._inputState) {
      return;
    }

    this._inputState.left = false;
    this._inputState.right = false;
    this._inputState.up = false;
    this._inputState.down = false;
  };
}

export default TouchController;
