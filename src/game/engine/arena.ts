/* Converted from engine/GameArena.js (AMD) to ESM TypeScript. */
import { assetPath } from "../asset-path";
import palette from "../palette";
import type {
  AssetProgress,
  CircleOptions,
  GameArenaInstance,
  RenderTextOptions,
  SpriteFrame,
} from "../types";

type CanvasContext = CanvasRenderingContext2D | WebGLRenderingContext;
type CanvasWithDebugGrid = HTMLCanvasElement & {
  moveTo?: CanvasRenderingContext2D["moveTo"];
  lineTo?: CanvasRenderingContext2D["lineTo"];
  stroke?: CanvasRenderingContext2D["stroke"];
  strokeStyle?: string;
};
type FullscreenElement = HTMLElement & {
  mozRequestFullScreen?: () => void;
  webkitRequestFullscreen?: (keyboardInput?: number) => void;
};
type FullscreenDocument = Document & {
  cancelFullScreen?: () => void;
  exitFullscreen?: () => void;
  fullscreenEnabled?: boolean;
  fullscreenElement?: Element | null;
  mozCancelFullScreen?: () => void;
  mozFullScreenElement?: Element | null;
  mozFullScreenEnabled?: boolean;
  webkitCancelFullScreen?: () => void;
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
};
type TextAlign = CanvasRenderingContext2D["textAlign"];

const spaceAdvanceMultiplier = 2;

class GameArena implements GameArenaInstance {
  private _assets: string[] = [];
  private _canvas: CanvasWithDebugGrid;
  private _containerElement: HTMLElement & { width?: number; height?: number };
  private _context?: CanvasContext | null;
  private _isInFullScreen = false;
  private _oldHeight: number;
  private _oldWidth: number;
  private _styles?: HTMLStyleElement;
  private readonly _handleFullscreenChange = (): void => {
    this._isInFullScreen = this.isFullScreen();
    if (this._isInFullScreen) {
      this.resize(screen.width, screen.height);
    } else {
      this.resize(this._oldWidth, this._oldHeight);
    }
  };
  private readonly _handleResize = (): void => {
    if (this._isInFullScreen) {
      this.resize(
        window.innerWidth || screen.width,
        window.innerHeight || screen.height
      );
      return;
    }

    this.resize();
  };

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

    document.addEventListener("fullscreenchange", this._handleFullscreenChange);
    document.addEventListener(
      "webkitfullscreenchange",
      this._handleFullscreenChange
    );
    document.addEventListener(
      "mozfullscreenchange",
      this._handleFullscreenChange
    );
    document.addEventListener(
      "msfullscreenchange",
      this._handleFullscreenChange
    );
    window.addEventListener("resize", this._handleResize);

    this._init();
  }

  private _init = (): void => {
    this._styles = document.createElement("style");
    this._styles.innerText =
      "@font-face {" +
      "font-family: 'theFont';" +
      `src: url('${assetPath("fonts/font.ttf")}');` +
      " }";
    this._canvas.tabIndex = 0;
    this._canvas.style.outline = "none";

    this._containerElement.appendChild(this._styles);
    this._containerElement.appendChild(this._canvas);
  };

  updatePosition = (posX: number, posY: number): void => {
    this.posX = posX;
    this.posY = posY;
  };

  resize = (width?: number, height?: number): void => {
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
  };

  getContext = (
    dimensions?: "2D" | "2d" | "3D" | "3d" | 2 | 3
  ): CanvasContext => {
    if (!this._context) {
      switch (dimensions) {
        case "3D":
        case "3d":
        case 3:
          this._context = this._canvas.getContext(
            "webgl"
          ) as CanvasContext | null;
          break;
        default:
          this._context = this._canvas.getContext("2d") as CanvasContext | null;
      }
    }

    if (!this._context) {
      throw new Error("Unable to create canvas context.");
    }

    return this._context;
  };

  enterFullScreen = (): void => {
    const element = this._containerElement as FullscreenElement;
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
  };

  exitFullScreen = (): void => {
    const doc = document as FullscreenDocument;
    if (doc.exitFullscreen) {
      doc.exitFullscreen();
    } else if (doc.cancelFullScreen) {
      doc.cancelFullScreen();
    } else if (doc.mozCancelFullScreen) {
      doc.mozCancelFullScreen();
    } else if (doc.webkitCancelFullScreen) {
      doc.webkitCancelFullScreen();
    }
  };

  isFullScreen = (): boolean => {
    const doc = document as FullscreenDocument;

    return Boolean(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement
    );
  };

  isFullScreenLocked = (): boolean => {
    const standaloneNavigator = navigator as Navigator & {
      standalone?: boolean;
    };

    return (
      standaloneNavigator.standalone === true ||
      window.matchMedia?.("(display-mode: fullscreen)").matches === true
    );
  };

  canToggleFullScreen = (): boolean => {
    const doc = document as FullscreenDocument;
    const element = this._containerElement as FullscreenElement;
    const canExitFullScreen = Boolean(
      doc.exitFullscreen ||
      doc.cancelFullScreen ||
      doc.mozCancelFullScreen ||
      doc.webkitCancelFullScreen
    );
    const fullscreenEnabled =
      doc.fullscreenEnabled ??
      doc.webkitFullscreenEnabled ??
      doc.mozFullScreenEnabled ??
      true;

    if (this.isFullScreen()) {
      return !this.isFullScreenLocked() && canExitFullScreen;
    }

    return (
      !this.isFullScreenLocked() &&
      fullscreenEnabled !== false &&
      Boolean(
        element.requestFullscreen ||
        element.mozRequestFullScreen ||
        element.webkitRequestFullscreen
      )
    );
  };

  toggleFullScreen = (): void => {
    if (!this.canToggleFullScreen()) {
      return;
    }

    if (this.isFullScreen()) {
      this.exitFullScreen();
    } else {
      this.enterFullScreen();
    }
  };

  setBackgroundColor = (color: string): void => {
    this._canvas.style.background = color;
  };

  clear = (): void => {
    this._canvas.width = this._canvas.width;
    (this.getContext() as CanvasRenderingContext2D).translate(
      this.width / 2,
      this.height / 2
    );
  };

  registerAssets = (assets: string | string[]): void => {
    this._assets = this._assets.concat(
      typeof assets === "string" ? [assets] : assets
    );
  };

  preloadAssets = (
    callback: (progress: AssetProgress) => void = () => {}
  ): void => {
    let loadedCount = 0;
    let remainingCount = this._assets.length;
    const images: HTMLImageElement[] = [];
    const completeAsset = () => {
      callback({
        loaded: ++loadedCount,
        remaining: --remainingCount,
      });
    };

    if (!remainingCount) {
      callback({ loaded: 0, remaining: 0 });
      return;
    }

    for (let i = this._assets.length - 1; i >= 0; i--) {
      images[i] = new Image();
      images[i].onload = completeAsset;
      images[i].onerror = completeAsset;
      images[i].src = this._assets[i];
      this._assets.splice(i, 1);
    }
  };

  renderText = (
    message: string | number,
    startPosX = 0,
    startPosY = 0,
    newOptions: RenderTextOptions = {}
  ): void => {
    const options: Required<RenderTextOptions> = {
      size: newOptions.size || 12,
      align: newOptions.align || "left",
      valign: newOptions.valign || "top",
      color: newOptions.color || palette.text.white,
      font: newOptions.font || "theFont",
      stroke: newOptions.stroke || false,
      strokeWidth: newOptions.strokeWidth || 1,
    };
    const context = this.getContext() as CanvasRenderingContext2D;

    context.fillStyle = options.color;
    context.font = `${options.size}px ${options.font}`;
    context.textAlign = options.align;
    context.textBaseline = options.valign;

    this.renderTextWithExpandedSpaces(
      context,
      String(message),
      startPosX,
      startPosY,
      options
    );
  };

  private renderTextWithExpandedSpaces = (
    context: CanvasRenderingContext2D,
    message: string,
    startPosX: number,
    startPosY: number,
    options: Required<RenderTextOptions>
  ): void => {
    if (!message.includes(" ")) {
      context.fillText(message, startPosX, startPosY);

      if (options.stroke) {
        context.lineWidth = options.strokeWidth;
        context.strokeStyle = options.stroke;
        context.strokeText(message, startPosX, startPosY);
      }
      return;
    }

    const runs = message.split(/(\s+)/).filter((run) => run.length > 0);
    const totalWidth = runs.reduce(
      (width, run) => width + this.getTextRunWidth(context, run),
      0
    );
    const originalAlign = context.textAlign;
    let cursorX =
      startPosX - this.getTextAlignOffset(totalWidth, originalAlign);

    context.textAlign = "left";

    for (const run of runs) {
      if (!/^\s+$/.test(run)) {
        context.fillText(run, cursorX, startPosY);

        if (options.stroke) {
          context.lineWidth = options.strokeWidth;
          context.strokeStyle = options.stroke;
          context.strokeText(run, cursorX, startPosY);
        }
      }

      cursorX += this.getTextRunWidth(context, run);
    }

    context.textAlign = originalAlign;
  };

  private getTextRunWidth = (
    context: CanvasRenderingContext2D,
    run: string
  ): number => {
    const width = context.measureText(run).width;

    return /^\s+$/.test(run) ? width * spaceAdvanceMultiplier : width;
  };

  private getTextAlignOffset = (width: number, align: TextAlign): number => {
    if (align === "center") {
      return width / 2;
    }

    if (align === "right" || align === "end") {
      return width;
    }

    return 0;
  };

  renderSprite = (sprite: CanvasImageSource, spriteData: SpriteFrame): void => {
    const context = this.getContext() as CanvasRenderingContext2D;
    const renderWidth = spriteData.renderWidth ?? spriteData.frameWidth;
    const renderHeight = spriteData.renderHeight ?? spriteData.frameHeight;
    const posY = spriteData.flipY
      ? -(spriteData.posY + renderHeight)
      : spriteData.posY;

    context.imageSmoothingEnabled = false;

    if (spriteData.flipY) {
      context.save();
      context.scale(1, -1);
    }

    context.drawImage(
      sprite,
      spriteData.frameX * spriteData.frameWidth,
      spriteData.frameY * spriteData.frameHeight,
      spriteData.frameWidth,
      spriteData.frameHeight,
      spriteData.posX,
      posY,
      renderWidth,
      renderHeight
    );

    if (spriteData.flipY) {
      context.restore();
    }
  };

  drawCircle = (
    posX = 0,
    posY = 0,
    radius: number,
    options: CircleOptions = {}
  ): void => {
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
  };

  drawDebugGrid = (widthSpace = 20, heightSpace = 20): void => {
    const context = this.getContext() as CanvasRenderingContext2D;

    for (let x = 0; x <= this.width; x += widthSpace) {
      context.moveTo(0.5 + x, 0);
      context.lineTo(0.5 + x, this.height);
    }

    for (let x = 0; x <= this.height; x += heightSpace) {
      context.moveTo(0, 0.5 + x);
      context.lineTo(this.width, 0.5 + x);
    }

    context.strokeStyle = palette.menu.disabledText;
    context.stroke();
  };

  getElement = (): HTMLCanvasElement => {
    return this._canvas;
  };

  destroy = (): void => {
    document.removeEventListener(
      "fullscreenchange",
      this._handleFullscreenChange
    );
    document.removeEventListener(
      "webkitfullscreenchange",
      this._handleFullscreenChange
    );
    document.removeEventListener(
      "mozfullscreenchange",
      this._handleFullscreenChange
    );
    document.removeEventListener(
      "msfullscreenchange",
      this._handleFullscreenChange
    );
    window.removeEventListener("resize", this._handleResize);
    this._canvas.remove();
    this._styles?.remove();
  };
}

export default GameArena;
