import type { Controller, ControllerInterfaceInstance } from "../types";

class Mouse implements Controller {
  private _canvas: HTMLCanvasElement;
  private _controllerInterface: ControllerInterfaceInstance;

  constructor(
    canvas: HTMLCanvasElement,
    controllerInterface: ControllerInterfaceInstance
  ) {
    this._canvas = canvas;
    this._controllerInterface = controllerInterface;
    this.connect();
  }

  connect(): void {
    this._canvas.addEventListener("click", this.handleClick);
    this._canvas.addEventListener("mousemove", this.handleMove);
  }

  disconnect(): void {
    this._canvas.removeEventListener("click", this.handleClick);
    this._canvas.removeEventListener("mousemove", this.handleMove);
  }

  private handleClick = (event: MouseEvent): void => {
    this._controllerInterface.handlePointer?.({
      ...this.getCanvasPoint(event),
      type: "click",
    });
  };

  private handleMove = (event: MouseEvent): void => {
    this._controllerInterface.handlePointer?.({
      ...this.getCanvasPoint(event),
      type: "move",
    });
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
