/**
 * Heading in degrees, where 0 points up the screen.
 */
export type Heading = number;

/**
 * Two-dimensional position in game coordinates.
 */
export interface Coordinates {
  posX: number;
  posY: number;
}

/**
 * Position plus collision/render radius.
 */
export interface PositionedRadius extends Coordinates {
  radius: number;
}

/**
 * Source and destination data for rendering a sprite frame.
 */
export interface SpriteFrame extends Coordinates {
  flipY?: boolean;
  frameWidth: number;
  frameHeight: number;
  frameX: number;
  frameY: number;
  renderHeight?: number;
  renderWidth?: number;
}

/**
 * Options for canvas-rendered text.
 */
export interface RenderTextOptions {
  align?: CanvasTextAlign;
  valign?: CanvasTextBaseline;
  size?: number;
  color?: string;
  font?: string;
  stroke?: string | false;
  strokeWidth?: number;
}

/**
 * Options for drawing debug or gameplay circles.
 */
export interface CircleOptions {
  backgroundColor?: string;
  borderColor?: string | false;
  borderWidth?: number;
}

/**
 * Asset preload progress counts.
 */
export interface AssetProgress {
  loaded: number;
  remaining: number;
}

export interface GameArenaOptions {
  debugGridColor?: string;
  defaultTextColor?: string;
  fontFamily?: string;
  fontUrl?: string;
}

export interface GameArenaInstance extends Coordinates {
  width: number;
  height: number;
  updatePosition: (posX: number, posY: number) => void;
  resize: (width?: number, height?: number) => void;
  getContext: (
    dimensions?: "2D" | "2d" | "3D" | "3d" | 2 | 3
  ) => CanvasRenderingContext2D | WebGLRenderingContext;
  enterFullScreen: () => void;
  exitFullScreen: () => void;
  isFullScreen: () => boolean;
  isFullScreenLocked: () => boolean;
  canToggleFullScreen: () => boolean;
  toggleFullScreen: () => void;
  setBackgroundColor: (color: string) => void;
  clear: () => void;
  registerAssets: (assets: string | string[]) => void;
  preloadAssets: (callback?: (progress: AssetProgress) => void) => void;
  renderText: (
    message: string | number,
    startPosX?: number,
    startPosY?: number,
    options?: RenderTextOptions
  ) => void;
  renderSprite: (sprite: CanvasImageSource, spriteData: SpriteFrame) => void;
  drawCircle: (
    posX: number,
    posY: number,
    radius: number,
    options?: CircleOptions
  ) => void;
  drawDebugGrid: (widthSpace?: number, heightSpace?: number) => void;
  getElement: () => HTMLCanvasElement;
  destroy?: () => void;
}

export interface TickerInstance {
  isRunning: boolean;
  start: () => void;
  stop: (callback?: () => void) => void;
  setFixedStepFps: (fps: number) => void;
  setFps: (fps?: number) => void;
  addSchedule: (callback: (frame: number) => void, nthFrame: number) => number;
  removeSchedule: (eventId: number) => boolean;
  clearSchedule: () => void;
  clearTicks: () => boolean;
  getTicks: () => number;
}

export type SoundChannel = "effects" | "music";

export interface SoundPlaybackBlockedDetails {
  channel: SoundChannel;
  sources: string[];
}

export interface SoundEngineConfiguration {
  getVolume?: (channel: SoundChannel) => number;
  onPlaybackBlocked?: (details: SoundPlaybackBlockedDetails) => void;
  volumeChangeEventName?: string;
  volumeChangeEventTarget?: EventTarget;
}
