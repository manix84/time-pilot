export type Heading = number;

export interface Coordinates {
  posX: number;
  posY: number;
}

export interface PositionedRadius extends Coordinates {
  radius: number;
}

export interface SpriteFrame extends Coordinates {
  frameWidth: number;
  frameHeight: number;
  frameX: number;
  frameY: number;
}

export interface RenderTextOptions {
  align?: CanvasTextAlign;
  valign?: CanvasTextBaseline;
  size?: number;
  color?: string;
  font?: string;
  stroke?: string | false;
  strokeWidth?: number;
}

export interface CircleOptions {
  backgroundColor?: string;
  borderColor?: string | false;
  borderWidth?: number;
}

export interface AssetProgress {
  loaded: number;
  remaining: number;
}

export interface PlayerData extends Coordinates {
  isAlive: boolean;
  deathTick: number | false;
  isFiring: boolean;
  isShooting?: boolean;
  heading: Heading;
  newHeading: Heading | false;
  exploading: number;
  continues: number;
  lives: number;
  score: number;
  level: number;
  removeMe?: boolean;
}

export interface BulletData extends Coordinates {
  heading: Heading;
  size: number;
  velocity: number;
  color: string;
}

export interface EnemyData extends Coordinates {
  heading: Heading;
  level: number;
  deathTick: number | false;
  tickOffset: number;
}

export interface PropData extends Coordinates {
  level: number;
  type: number;
  layer: number;
}

export interface BonusData extends Coordinates {
  level: number;
  layer: number;
  removeMe: boolean;
}

export interface SpriteImage extends HTMLImageElement {
  frameWidth?: number;
  frameHeight?: number;
  frameX?: number;
  frameY?: number;
}

export interface ControllerCommands {
  restart?: () => void;
  pause?: () => void;
}

export type ControllerType = "keyboard1" | "keyboard2";
export type ControlInputName =
  | "down"
  | "fire"
  | "left"
  | "menu"
  | "pause"
  | "restart"
  | "right"
  | "up";

export type ControlInputState = Record<ControlInputName, boolean>;

export interface KeyboardBindings {
  down: number[];
  fire: number[];
  fullscreen: number[];
  left: number[];
  menu: number[];
  pause: number[];
  restart: number[];
  right: number[];
  up: number[];
}

export interface Controller {
  disconnect?: () => void;
}

export interface MenuPointerData extends Coordinates {
  type: "click" | "move";
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
}

export interface TickerInstance {
  isRunning: boolean;
  start: () => void;
  stop: (callback?: () => void) => void;
  addSchedule: (callback: (frame: number) => void, nthFrame: number) => number;
  removeSchedule: (eventId: number) => boolean;
  clearSchedule: () => void;
  clearTicks: () => boolean;
  getTicks: () => number;
}

export interface BulletInstance {
  removeMe: boolean;
  getData: (key?: keyof BulletData) => BulletData | BulletData[keyof BulletData] | undefined;
  setData: (key: keyof BulletData, value: BulletData[keyof BulletData]) => boolean;
  setLevel: (level: number) => boolean;
  reposition: () => void;
  render: () => void;
}

export interface BulletFactoryInstance {
  create: (
    originX: number,
    originY: number,
    heading: Heading,
    size: number,
    velocity: number,
    color: string
  ) => void;
  getCount: () => number;
  getData: () => BulletData[];
  cleanup: () => void;
  reposition: () => void;
  render: () => void;
  clearAll: () => void;
}

export interface PlayerInstance {
  getData(): PlayerData;
  getData<K extends keyof PlayerData>(key: K): PlayerData[K] | undefined;
  setData: <K extends keyof PlayerData>(
    key: K,
    value: PlayerData[K],
    isLastKnownGood?: boolean
  ) => boolean;
  resetData: () => void;
  reposition: () => void;
  rotate: () => void;
  startShooting: () => void;
  stopShooting: () => void;
  shoot: () => void;
  render: () => void;
  kill: () => void;
}

export interface EnemyInstance {
  isAlive: boolean;
  removeMe: boolean;
  getData: (key?: keyof EnemyData) => EnemyData | EnemyData[keyof EnemyData] | undefined;
  setData: (key: keyof EnemyData, value: EnemyData[keyof EnemyData]) => boolean;
  detectCollision: (
    objectPosX: number,
    objectPosY: number,
    objectHitRadius: number
  ) => boolean;
  reposition: () => void;
  render: () => void;
  kill: () => void;
}

export interface EnemyFactoryInstance {
  create: (posX: number, posY: number, heading: Heading) => void;
  getCount: () => number;
  isUnderLimit: () => boolean;
  getData: () => EnemyData[];
  getEntities: () => EnemyInstance[];
  cleanup: () => void;
  reposition: () => void;
  render: () => void;
  clearAll: () => void;
}

export interface PropInstance {
  removeMe: boolean;
  getData(): PropData;
  getData<K extends keyof PropData>(key: K): PropData[K] | undefined;
  reposition: () => void;
  render: () => void;
}

export interface PropFactoryInstance {
  create: (posX: number, posY: number) => void;
  getCount: () => number;
  getData: () => PropData[];
  cleanup: () => void;
  reposition: () => void;
  render: (layer?: number | false) => void;
  clearAll: () => void;
}

export interface HudInstance {
  render: () => void;
  restart: () => void;
}

export interface ControllerInterfaceInstance {
  rotateToHeading: (desiredHeading: Heading) => void;
  rotateClockwise: () => void;
  rotateAntiClockwise: () => void;
  stop: () => void;
  toggleMenu: () => void;
  openMenu?: () => void;
  startShooting: () => void;
  stopShooting: () => void;
  toggleFullScreen: () => void;
  togglePause: () => void;
  restart: () => void;
  rotateCounterClockwise: () => void;
  rotateRight: () => void;
  rotateLeft: () => void;
  handlePointer?: (pointer: MenuPointerData) => void;
  captureKey?: (keyCode: number) => boolean;
  isMenuActive?: () => boolean;
}

export interface GameDataStore {
  _level: number;
  _controlInputState: ControlInputState;
  _gameArena: GameArenaInstance;
  _renderTicker: TickerInstance;
  _gameTicker: TickerInstance;
  _bullets: BulletFactoryInstance;
  _player: PlayerInstance;
  _enemies: EnemyFactoryInstance;
  _props: PropFactoryInstance;
  _hud: HudInstance;
  _menus: MenuSystemInstance;
  _currentController: Controller[];
}

export interface CollisionSystemInstance {
  detectCollisions: () => void;
}

export interface SpawningSystemInstance {
  addInitialProps: () => void;
  spawnEntities: () => void;
}

export interface RenderingSystemInstance {
  renderFrame: () => void;
}

export interface MenuSystemCommands {
  start: () => void;
}

export interface MenuSystemInstance {
  adjust: (direction: -1 | 1) => void;
  captureKey: (keyCode: number) => boolean;
  isActive: () => boolean;
  showStart: () => void;
  hide: () => void;
  render: () => void;
  next: () => void;
  previous: () => void;
  activate: () => void;
  handlePointer: (pointer: MenuPointerData) => void;
}

export interface MenuControl {
  name: string;
  type: "button" | "enum" | "slider" | "toggle";
  callback?: () => void;
  options?: number[] | Record<string, string>;
  getValue?: () => unknown;
  setValue?: (value?: unknown) => void;
}

export interface MenuDefinition {
  name: string;
  buttons: Record<string, MenuControl>;
}

export interface SpriteAsset {
  src: string;
}

export interface SoundAsset {
  src: string;
}

export interface ExplosionConfig {
  sprite: SpriteAsset;
  sound: SoundAsset;
  width: number;
  height: number;
  frames: number;
  frameLimiter: number;
}

export interface ProjectileConfig {
  velocity: number;
  size: number;
  color: string;
  sound?: SoundAsset;
}

export interface PlayerConfig {
  sprite: SpriteAsset;
  width: number;
  height: number;
  hitRadius: number;
  rotationFrameCount: number;
  explosion: ExplosionConfig;
  projectile: ProjectileConfig & { sound: SoundAsset };
}

export interface EnemyConfig {
  deathValue: number;
  sprite: SpriteAsset;
  velocity: number;
  turnLimiter: number;
  width: number;
  height: number;
  firingChance: number;
  hitRadius: number;
  canRotate: boolean;
  spawnLimit: number;
  projectile: ProjectileConfig;
  explosion: ExplosionConfig;
}

export interface PropConfig {
  sprite: SpriteAsset;
  width: number;
  height: number;
  relativeVelocity: number;
  layer: number;
  reversed: boolean;
}

export interface BonusConfig {
  sprite: SpriteAsset;
  velocity: number;
  animationCycle: number[];
  width: number;
  height: number;
}

export interface LevelConfig {
  arena: {
    introText: string;
    backgroundColor: string;
    spawningArc: number;
    spawningRadius: number;
    despawnRadius: number;
  };
  player: {
    velocity: number;
    turnInterval: number;
  };
  enemies: {
    basic: EnemyConfig;
  };
  bonus: BonusConfig;
  props: PropConfig[];
}

export interface TimePilotConstants {
  player: PlayerConfig;
  limits: {
    props: number;
    spawningRadius: number;
    despawnRadius: number;
  };
  levels: Record<number, LevelConfig>;
}

export interface UserOptions {
  debug: {
    showHitboxes: boolean;
    showSpriteCorners: boolean;
    showSpriteCenters: boolean;
    showControlsOverlay: boolean;
    showPlayerCoordinates: boolean;
    invincible: boolean;
  };
  enableDebug: boolean;
  controllerType: ControllerType;
  gamepadEnabled: boolean;
  keyboardBindings: KeyboardBindings;
  masterVolume: number;
  musicVolume: number;
  effectsVolume: number;
  setKeyboardBinding: <K extends keyof KeyboardBindings>(
    key: K,
    value: KeyboardBindings[K]
  ) => void;
  setDebugOption: <K extends keyof UserOptions["debug"]>(
    key: K,
    value: UserOptions["debug"][K]
  ) => void;
  setOption: <K extends keyof UserOptions>(key: K, value: UserOptions[K]) => void;
}
