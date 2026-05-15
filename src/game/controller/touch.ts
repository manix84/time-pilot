import helpers from "../engine/helpers";
import { clampZoomPercent, zoomStepPercent } from "../ui-scale";
import type {
  ControlInputName,
  ControlInputState,
  Controller,
  ControllerInterfaceInstance,
  Coordinates,
} from "../types";
import userOptions from "../user-options";

type TouchGestureMode = "multi" | "single" | null;

class TouchController implements Controller {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _controllerInterface: ControllerInterfaceInstance;
  private readonly _deadZone = 18;
  private readonly _pinchSensitivity = 35;
  private readonly _tapMaxDuration = 260;
  private readonly _inputState?: ControlInputState;
  private _activeTouchId: number | null = null;
  private _gestureMode: TouchGestureMode = null;
  private _maxTouchCount = 0;
  private _multiTouchMoved = false;
  private _multiTouchStartedAt = 0;
  private _pinchBaseGameZoom = 100;
  private _pinchBaseUiZoom = 100;
  private _pinchStartDistance = 0;
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
    this._canvas.focus();

    if (event.touches.length >= 2) {
      this.startMultiTouchGesture(event);
      return;
    }

    const touch = event.changedTouches[0];
    if (!touch) {
      return;
    }

    this._gestureMode = "single";
    this._activeTouchId = touch.identifier;
    const point = this.getCanvasPoint(touch);
    this._touchOrigin = point;

    if (this._controllerInterface.isMenuActive?.()) {
      this._controllerInterface.handlePointer?.({
        ...point,
        source: "touch",
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

    if (this._gestureMode === "multi") {
      this.updatePinchZoom(event);
      return;
    }

    const touch = this.getActiveTouch(event.changedTouches);
    if (!touch) {
      return;
    }

    const point = this.getCanvasPoint(touch);

    if (this._controllerInterface.isMenuActive?.()) {
      this._controllerInterface.handlePointer?.({
        ...point,
        source: "touch",
        type: "drag",
      });
      return;
    }

    this.updateHeadingFromPoint(this.getRelativePoint(point));
  };

  private handleTouchEnd = (event: TouchEvent): void => {
    event.preventDefault();

    if (this._gestureMode === "multi") {
      if (event.touches.length === 0) {
        this.finishMultiTouchGesture();
      }
      return;
    }

    const touch = this.getActiveTouch(event.changedTouches);
    if (!touch) {
      return;
    }

    if (this._controllerInterface.isMenuActive?.()) {
      const point = this.getCanvasPoint(touch);

      this._controllerInterface.handlePointer?.({
        ...point,
        source: "touch",
        type: "release",
      });
    }

    this._controllerInterface.stopShooting();
    if (this._inputState) {
      this._inputState.fire = false;
    }
    this._activeTouchId = null;
    this._gestureMode = null;
    this._touchOrigin = null;
    this.clearDirectionState();
  };

  private startMultiTouchGesture = (event: TouchEvent): void => {
    this.stopSingleTouchInput();

    this._gestureMode = "multi";
    this._maxTouchCount = Math.max(this._maxTouchCount, event.touches.length);
    this._multiTouchMoved = false;
    this._multiTouchStartedAt = performance.now();
    this._pinchStartDistance = this.getTouchDistance(event.touches);
    this._pinchBaseGameZoom = userOptions.gameZoom;
    this._pinchBaseUiZoom = userOptions.uiZoom;

    if (this._inputState) {
      this._inputState.activeController = "touch";
    }
  };

  private updatePinchZoom = (event: TouchEvent): void => {
    this._maxTouchCount = Math.max(this._maxTouchCount, event.touches.length);

    if (event.touches.length < 2 || this._pinchStartDistance <= 0) {
      return;
    }

    const distance = this.getTouchDistance(event.touches);
    const zoomDelta = Math.log(distance / this._pinchStartDistance) * this._pinchSensitivity;
    const steppedDelta =
      Math.round(zoomDelta / zoomStepPercent) * zoomStepPercent;

    if (Math.abs(steppedDelta) >= zoomStepPercent) {
      this._multiTouchMoved = true;
    }

    userOptions.setOption(
      "uiZoom",
      clampZoomPercent(this._pinchBaseUiZoom + steppedDelta)
    );
    userOptions.setOption(
      "gameZoom",
      clampZoomPercent(this._pinchBaseGameZoom + steppedDelta)
    );
  };

  private finishMultiTouchGesture = (): void => {
    const wasTap =
      !this._multiTouchMoved &&
      performance.now() - this._multiTouchStartedAt <= this._tapMaxDuration;

    if (wasTap) {
      if (this._maxTouchCount >= 3) {
        this._controllerInterface.requestRestartConfirmation?.();
        this.setInputPulse("restart");
      } else if (this._maxTouchCount === 2) {
        this._controllerInterface.openMainMenu?.();
        this.setInputPulse("menu");
      }
    }

    this._gestureMode = null;
    this._maxTouchCount = 0;
    this._multiTouchMoved = false;
    this._multiTouchStartedAt = 0;
    this._pinchStartDistance = 0;
  };

  private stopSingleTouchInput = (): void => {
    if (this._activeTouchId === null) {
      return;
    }

    this._controllerInterface.stopShooting();
    if (this._inputState) {
      this._inputState.fire = false;
    }
    this._activeTouchId = null;
    this._touchOrigin = null;
    this.clearDirectionState();
  };

  private setInputPulse = (input: Extract<ControlInputName, "menu" | "restart">): void => {
    if (!this._inputState) {
      return;
    }

    this._inputState.activeController = "touch";
    this._inputState[input] = true;
    window.setTimeout(() => {
      this._inputState![input] = false;
    }, 120);
  };

  private getTouchDistance = (touchList: TouchList): number => {
    const first = touchList[0];
    const second = touchList[1];

    if (!first || !second) {
      return 0;
    }

    return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
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
