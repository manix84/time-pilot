import type { Controller, ControllerInterfaceInstance } from "../types";

class Mouse implements Controller {
  private _canvas: HTMLCanvasElement;
  private _controllerInterface: ControllerInterfaceInstance;
  private _isPressed = false;
  private _isDragging = false;

  constructor(
    canvas: HTMLCanvasElement,
    controllerInterface: ControllerInterfaceInstance
  ) {
    this._canvas = canvas;
    this._controllerInterface = controllerInterface;
    this.connect();
  }

  connect(): void {
    this._canvas.addEventListener("mousedown", this.handlePress);
    this._canvas.addEventListener("mousemove", this.handleMove);
    this._canvas.addEventListener("mouseup", this.handleRelease);
  }

  disconnect(): void {
    this._canvas.removeEventListener("mousedown", this.handlePress);
    this._canvas.removeEventListener("mousemove", this.handleMove);
    this._canvas.removeEventListener("mouseup", this.handleRelease);
  }

  private handlePress = (event: MouseEvent): void => {
    this._isPressed = true;
    this._isDragging = false;
    this._controllerInterface.handlePointer?.({
      ...this.getCanvasPoint(event),
      type: "press",
    });
  };

  private handleMove = (event: MouseEvent): void => {
    if (this._isPressed) {
      this._isDragging = true;
    }

    this._controllerInterface.handlePointer?.({
      ...this.getCanvasPoint(event),
      type: this._isPressed ? "drag" : "move",
    });
  };

  private handleRelease = (event: MouseEvent): void => {
    if (!this._isPressed) {
      return;
    }

    const point = this.getCanvasPoint(event);

    this._controllerInterface.handlePointer?.({
      ...point,
      type: "release",
    });

    this._isPressed = false;
    this._isDragging = false;
  };

  private getCanvasPoint(event: MouseEvent) {
    const bounds = this._canvas.getBoundingClientRect();
    const scaleX = this._canvas.width / bounds.width;
    const scaleY = this._canvas.height / bounds.height;

    return {
      posX:
        (event.clientX - bounds.left) * scaleX - this._canvas.width / 2,
      posY:
        (event.clientY - bounds.top) * scaleY - this._canvas.height / 2,
    };
  }
}

export default Mouse;
