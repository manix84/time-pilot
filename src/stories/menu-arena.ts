import type {
  CircleOptions,
  GameArenaInstance,
  RenderTextOptions,
  SpriteFrame,
} from "../game/types";

export function createCanvasArena(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D
): GameArenaInstance {
  const arena = {
    width: canvas.width,
    height: canvas.height,
    posX: 0,
    posY: 0,
    updatePosition(posX: number, posY: number) {
      arena.posX = posX;
      arena.posY = posY;
    },
    resize(width = canvas.width, height = canvas.height) {
      canvas.width = width;
      canvas.height = height;
      arena.width = width;
      arena.height = height;
    },
    getContext() {
      return context;
    },
    enterFullScreen() {},
    exitFullScreen() {},
    toggleFullScreen() {},
    setBackgroundColor(color: string) {
      canvas.style.backgroundColor = color;
    },
    clear() {
      context.clearRect(0, 0, canvas.width, canvas.height);
    },
    registerAssets() {},
    preloadAssets() {},
    renderText(
      message: string | number,
      startPosX = 0,
      startPosY = 0,
      options: RenderTextOptions = {}
    ) {
      context.save();
      context.font =
        options.font ??
        `${options.size ?? 12}px theFont, Trebuchet MS, Segoe UI, sans-serif`;
      context.textAlign = options.align ?? "left";
      context.textBaseline = options.valign ?? "top";

      if (options.stroke) {
        context.lineWidth = options.strokeWidth ?? 2;
        context.strokeStyle = options.stroke;
        context.strokeText(String(message), startPosX, startPosY);
      }

      context.fillStyle = options.color ?? "#fff";
      context.fillText(String(message), startPosX, startPosY);
      context.restore();
    },
    renderSprite(sprite: CanvasImageSource, spriteData: SpriteFrame) {
      context.drawImage(
        sprite,
        spriteData.frameX,
        spriteData.frameY,
        spriteData.frameWidth,
        spriteData.frameHeight,
        spriteData.posX,
        spriteData.posY,
        spriteData.frameWidth,
        spriteData.frameHeight
      );
    },
    drawCircle(
      posX: number,
      posY: number,
      radius: number,
      options: CircleOptions = {}
    ) {
      context.save();
      context.beginPath();
      context.arc(posX, posY, radius, 0, 2 * Math.PI);

      if (options.backgroundColor) {
        context.fillStyle = options.backgroundColor;
        context.fill();
      }

      if (options.borderColor !== false) {
        context.lineWidth = options.borderWidth ?? 1;
        context.strokeStyle = options.borderColor ?? "#fff";
        context.stroke();
      }

      context.restore();
    },
    drawDebugGrid() {},
    getElement() {
      return canvas;
    },
  } satisfies GameArenaInstance;

  return arena;
}
