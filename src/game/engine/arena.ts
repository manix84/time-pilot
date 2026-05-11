/* Converted from engine/GameArena.js (AMD) to ESM TypeScript. */
import type {
  AssetProgress,
  CircleOptions,
  GameArenaInstance,
  RenderTextOptions,
  SpriteFrame,
} from "../types";
import helpers from "./helpers";

type CanvasContext = CanvasRenderingContext2D | WebGLRenderingContext;
type CanvasWithDebugGrid = HTMLCanvasElement & {
  moveTo?: CanvasRenderingContext2D["moveTo"];
  lineTo?: CanvasRenderingContext2D["lineTo"];
  stroke?: CanvasRenderingContext2D["stroke"];
  strokeStyle?: string;
};
type FullscreenCanvas = HTMLCanvasElement & {
  mozRequestFullScreen?: () => void;
  webkitRequestFullscreen?: (keyboardInput?: number) => void;
};
type FullscreenDocument = Document & {
  cancelFullScreen?: () => void;
  mozCancelFullScreen?: () => void;
  webkitCancelFullScreen?: () => void;
};

class GameArena implements GameArenaInstance {
  private _assets: string[] = [];
  private _canvas: CanvasWithDebugGrid;
  private _containerElement: HTMLElement & { width?: number; height?: number };
  private _context?: CanvasContext | null;
  private _isInFullScreen = false;
  private _oldHeight: number;
  private _oldWidth: number;
  private _styles?: HTMLStyleElement;

  height = 0;
  posX = 0;
  posY = 0;
  width = 0;

  constructor(containerElement: HTMLElement) {
    this._containerElement = containerElement;
    this._canvas = document.createElement("canvas");
    this.resize();

    this._oldWidth = this._containerElement.clientWidth;
    this._oldHeight = this._containerElement.clientHeight;

    helpers.bind(
      "fullscreenchange webkitfullscreenchange mozfullscreenchange msfullscreenchange",
      () => {
        this._isInFullScreen = !this._isInFullScreen;
        if (this._isInFullScreen) {
          this.resize(screen.width, screen.height);
          window.console.log("Entered Full-Screen");
        } else {
          this.resize(this._oldWidth, this._oldHeight);
          window.console.log("Exited Full-Screen");
        }
      }
    );

    this._init();
  }

  private _init(): void {
    this._styles = document.createElement("style");
    this._styles.innerText =
      "@font-face {" +
      "font-family: 'theFont';" +
      "src: url('/fonts/font.ttf');" +
      " }";

    this._containerElement.appendChild(this._styles);
    this._containerElement.appendChild(this._canvas);
  }

  updatePosition(posX: number, posY: number): void {
    this.posX = posX;
    this.posY = posY;
  }

  resize(width?: number, height?: number): void {
    const nextWidth = width || this._containerElement.clientWidth;
    const nextHeight = height || this._containerElement.clientHeight;

    if (this._oldWidth !== this.width && this._oldHeight !== this.height) {
      this._oldWidth = this.width;
      this._oldHeight = this.height;
    }

    this._canvas.width = nextWidth;
    this._canvas.height = nextHeight;

    this._containerElement.width = nextWidth;
    this._containerElement.height = nextHeight;

    this.width = nextWidth;
    this.height = nextHeight;
  }

  getContext(
    dimensions?: "2D" | "2d" | "3D" | "3d" | 2 | 3
  ): CanvasContext {
    if (!this._context) {
      switch (dimensions) {
        case "3D":
        case "3d":
        case 3:
          this._context = this._canvas.getContext("webgl") as CanvasContext | null;
          break;
        default:
          this._context = this._canvas.getContext("2d") as CanvasContext | null;
      }
    }

    if (!this._context) {
      throw new Error("Unable to create canvas context.");
    }

    return this._context;
  }

  enterFullScreen(): void {
    const element = this._canvas as FullscreenCanvas;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen(
        (Element as unknown as { ALLOW_KEYBOARD_INPUT?: number })
          .ALLOW_KEYBOARD_INPUT
      );
    }
  }

  exitFullScreen(): void {
    const doc = document as FullscreenDocument;
    if (doc.cancelFullScreen) {
      doc.cancelFullScreen();
    } else if (doc.mozCancelFullScreen) {
      doc.mozCancelFullScreen();
    } else if (doc.webkitCancelFullScreen) {
      doc.webkitCancelFullScreen();
    }
  }

  toggleFullScreen(): void {
    window.console.log("this._isInFullScreen", this._isInFullScreen);
    if (this._isInFullScreen) {
      this.exitFullScreen();
    } else {
      this.enterFullScreen();
    }
  }

  setBackgroundColor(color: string): void {
    this._canvas.style.background = color;
  }

  clear(): void {
    this._canvas.width = this._canvas.width;
    (this.getContext() as CanvasRenderingContext2D).translate(
      this.width / 2,
      this.height / 2
    );
  }

  registerAssets(assets: string | string[]): void {
    this._assets = this._assets.concat(
      typeof assets === "string" ? [assets] : assets
    );
  }

  preloadAssets(callback: (progress: AssetProgress) => void = () => {}): void {
    let loadedCount = 0;
    let remainingCount = this._assets.length - 1;
    const images: HTMLImageElement[] = [];
    const completeAsset = () => {
      callback({
        loaded: ++loadedCount,
        remaining: --remainingCount,
      });
    };

    for (let i = remainingCount; 0 < i; i--) {
      images[i] = new Image();
      images[i].src = this._assets[i];
      images[i].onload = completeAsset;
      images[i].onerror = completeAsset;
      this._assets.splice(i, 1);
    }
  }

  renderText(
    message: string | number,
    startPosX = 0,
    startPosY = 0,
    newOptions: RenderTextOptions = {}
  ): void {
    const options: Required<RenderTextOptions> = {
      size: newOptions.size || 12,
      align: newOptions.align || "left",
      valign: newOptions.valign || "top",
      color: newOptions.color || "#fff",
      font: newOptions.font || "theFont",
      stroke: newOptions.stroke || false,
      strokeWidth: newOptions.strokeWidth || 1,
    };
    const context = this.getContext() as CanvasRenderingContext2D;

    context.fillStyle = options.color;
    context.font = `${options.size}px ${options.font}`;
    context.textAlign = options.align;
    context.textBaseline = options.valign;
    context.fillText(String(message), startPosX, startPosY);

    if (options.stroke) {
      context.lineWidth = options.strokeWidth;
      context.strokeStyle = options.stroke;
      context.strokeText(String(message), startPosX, startPosY);
    }
  }

  renderSprite(sprite: CanvasImageSource, spriteData: SpriteFrame): void {
    const context = this.getContext() as CanvasRenderingContext2D;

    context.drawImage(
      sprite,
      spriteData.frameX * spriteData.frameWidth,
      spriteData.frameY * spriteData.frameHeight,
      spriteData.frameWidth,
      spriteData.frameHeight,
      spriteData.posX,
      spriteData.posY,
      spriteData.frameWidth,
      spriteData.frameHeight
    );
  }

  drawCircle(
    posX = 0,
    posY = 0,
    radius: number,
    options: CircleOptions = {}
  ): void {
    const circleOptions: {
      backgroundColor: string;
      borderColor: string | false;
      borderWidth: number;
    } = {
      backgroundColor: options.backgroundColor || "transparent",
      borderColor: options.borderColor || false,
      borderWidth: options.borderWidth || 1,
    };
    const context = this.getContext() as CanvasRenderingContext2D;

    context.beginPath();
    context.arc(posX, posY, radius, 0, 2 * Math.PI, false);
    context.fillStyle = circleOptions.backgroundColor;
    context.fill();

    if (circleOptions.borderColor) {
      context.lineWidth = circleOptions.borderWidth;
      context.strokeStyle = circleOptions.borderColor;
      context.stroke();
    }
  }

  drawDebugGrid(widthSpace = 20, heightSpace = 20): void {
    const context = this.getContext() as CanvasRenderingContext2D;

    for (let x = 0; x <= this.width; x += widthSpace) {
      context.moveTo(0.5 + x, 0);
      context.lineTo(0.5 + x, this.height);
    }

    for (let x = 0; x <= this.height; x += heightSpace) {
      context.moveTo(0, 0.5 + x);
      context.lineTo(this.width, 0.5 + x);
    }

    context.strokeStyle = "#AAA";
    context.stroke();
  }

  getElement(): HTMLCanvasElement {
    return this._canvas;
  }
}

export default GameArena;
