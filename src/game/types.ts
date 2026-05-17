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

/**
 * Mutable player state stored in the game data context.
 */
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
  nextExtraLifeScore: number;
  score: number;
  level: number;
  removeMe?: boolean;
}

/**
 * Mutable enemy state stored in enemy instances.
 */
export interface EnemyData extends Coordinates {
  heading: Heading;
  hitPoints: number;
  level: number;
  deathTick: number | false;
  tickOffset: number;
  type: "basic" | "boss" | "specialBomber";
  formationId?: string;
  formationUntilTick?: number;
  formationWaveAmplitude?: number;
  formationWaveFrequency?: number;
  formationWavePhase?: number;
}

/**
 * Background prop state.
 */
export interface PropData extends Coordinates {
  level: number;
  type: number;
  layer: number;
}

/**
 * Bonus pickup state.
 */
export interface BonusData extends Coordinates {
  level: number;
  layer: number;
  removeMe: boolean;
  type: "parachute";
}

/**
 * Image element with optional sprite metadata attached.
 */
export interface SpriteImage extends HTMLImageElement {
  frameWidth?: number;
  frameHeight?: number;
  frameX?: number;
  frameY?: number;
}

/**
 * Commands exposed from the game shell to controller adapters.
 */
export interface ControllerCommands {
  isPrerollActive?: () => boolean;
  openMenu?: () => void;
  restart?: () => void;
  pause?: () => void;
  skipPreroll?: () => void;
}

/**
 * Supported keyboard controller layouts.
 */
export type ControllerType = "keyboard1" | "keyboard2";
export type {
  FilterMode,
  FilterRuntimeBoosts,
  FilterSettingKey,
  FilterSettings,
} from "./filter-settings";
import type {
  FilterMode,
  FilterSettingKey,
  FilterSettings,
} from "./filter-settings";
import type AchievementSystem from "./achievements";
import type { AchievementStatus } from "./achievements";
import type { LogLevel } from "./log-levels";
import type { StoredDataResetScope } from "./storage-reset";
export type GameLanguage = "de" | "en" | "es" | "fr" | "it" | "nl" | "ro";
export type ControlInputName =
  | "down"
  | "fire"
  | "left"
  | "menu"
  | "pause"
  | "restart"
  | "right"
  | "up";

export type ControlInputSource = "gamepad" | "keyboard" | "touch";

export type ControlInputState = Record<ControlInputName, boolean> & {
  activeController: ControlInputSource;
  rotateLeft?: boolean;
  rotateRight?: boolean;
  touchCurrent?: Coordinates | null;
  touchOrigin?: Coordinates | null;
};

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
  deltaY?: number;
  source?: "mouse" | "touch";
  type: "click" | "drag" | "move" | "press" | "release" | "wheel";
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
  addSchedule: (callback: (frame: number) => void, nthFrame: number) => number;
  removeSchedule: (eventId: number) => boolean;
  clearSchedule: () => void;
  clearTicks: () => boolean;
  getTicks: () => number;
}

export interface BulletInstance {
  removeMe: boolean;
  explode: () => void;
  destroy: () => void;
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
    color: string,
    playSound?: boolean,
    coordinateSpace?: BulletData["coordinateSpace"],
    shape?: BulletData["shape"],
    sprite?: BulletData["sprite"],
    tracksPlayer?: boolean,
    turnRate?: number,
    shootable?: boolean,
    explosion?: BulletData["explosion"],
    sound?: BulletData["sound"],
    flightSound?: BulletData["flightSound"],
    explosionSound?: BulletData["explosionSound"]
  ) => void;
  getCount: () => number;
  getData: () => BulletData[];
  getEntities: () => BulletInstance[];
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
  setRespawnCallback?: (callback: () => void) => void;
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
  destroy: () => void;
}

export interface EnemySpawnOptions {
  type?: EnemyData["type"];
  formationId?: string;
  formationUntilTick?: number;
  formationWaveAmplitude?: number;
  formationWaveFrequency?: number;
  formationWavePhase?: number;
}

export interface LevelProgressState {
  bossDefeated: boolean;
  bossKillThreshold: number;
  bossSpawned: boolean;
  standardEnemyKills: number;
}

export interface TimeWarpTransitionState {
  endsAtTick: number;
  effectStartedAtTick: number;
  lives: number;
  nextLevel: number;
  score: number;
  screenCleared: boolean;
  startedAtTick: number;
}

export interface FormationState {
  awarded: boolean;
  escaped: boolean;
  remaining: number;
  total: number;
}

export interface EnemyFactoryInstance {
  create: (
    posX: number,
    posY: number,
    heading: Heading,
    options?: EnemySpawnOptions
  ) => void;
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
  isFlyThrough: () => boolean;
  reposition: () => void;
  render: (options?: { opacity?: number }) => void;
}

export interface PropFactoryInstance {
  create: (posX: number, posY: number) => void;
  getCount: () => number;
  getData: () => PropData[];
  cleanup: () => void;
  reposition: () => void;
  render: (
    layer?: number | false,
    options?: { excludeFlyThrough?: boolean; flyThroughOnly?: boolean; opacity?: number }
  ) => void;
  clearAll: () => void;
}

export interface BonusInstance {
  removeMe: boolean;
  getData(): BonusData;
  getData<K extends keyof BonusData>(key: K): BonusData[K] | undefined;
  detectCollision: (
    objectPosX: number,
    objectPosY: number,
    objectHitRadius: number
  ) => boolean;
  collect: () => void;
  reposition: () => void;
  render: () => void;
}

export interface BonusFactoryInstance {
  create: (posX: number, posY: number, type?: BonusData["type"]) => void;
  getCount: () => number;
  getData: () => BonusData[];
  getEntities: () => BonusInstance[];
  cleanup: () => void;
  reposition: () => void;
  render: () => void;
  clearAll: () => void;
}

export interface HudInstance {
  render: () => void;
  restart: () => void;
}

export interface ControllerInterfaceInstance {
  adjustUiZoom?: (direction: -1 | 1) => void;
  resetUiZoom?: () => void;
  requestRestartConfirmation?: () => void;
  rotateToHeading: (desiredHeading: Heading) => void;
  rotateClockwise: () => void;
  rotateAntiClockwise: () => void;
  stop: () => void;
  toggleMenu: () => void;
  openMainMenu?: () => void;
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
  goBack?: () => void;
  isMenuActive?: () => boolean;
}

export interface GameDataStore {
  _level: number;
  _levelProgress: LevelProgressState;
  _formations: Record<string, FormationState>;
  _demoFadeStartedAtTick?: number;
  _demoFadeUntilTick?: number;
  _isDemoMode?: boolean;
  _levelIntroUntilTick?: number;
  _timeWarpTransition?: TimeWarpTransitionState;
  _nextParachuteScore?: number;
  _controlInputState: ControlInputState;
  _demoControlInputState?: ControlInputState;
  _gameArena: GameArenaInstance;
  _renderTicker: TickerInstance;
  _gameTicker: TickerInstance;
  _bonuses: BonusFactoryInstance;
  _bullets: BulletFactoryInstance;
  _enemyBullets: BulletFactoryInstance;
  _player: PlayerInstance;
  _enemies: EnemyFactoryInstance;
  _props: PropFactoryInstance;
  _hud: HudInstance;
  _menus: MenuSystemInstance;
  _currentController: Controller[];
  _achievements?: AchievementSystem;
}

export interface CollisionSystemInstance {
  detectCollisions: () => void;
}

export interface SpawningSystemInstance {
  addInitialProps: () => void;
  spawnEntities: () => void;
}

export interface RenderFrameOptions {
  menuRenderOptions?: MenuRenderOptions;
  renderMenus?: boolean;
}

export interface RenderingSystemInstance {
  renderFrame: (options?: RenderFrameOptions) => void;
  destroy?: () => void;
}

export interface MenuSystemCommands {
  applyUpdate?: () => void;
  canWatchDemo?: () => boolean;
  canApplyUpdate?: () => boolean;
  /**
   * Returns whether PWA screen wake-lock controls should be shown.
   */
  canUseScreenWakeLock?: () => boolean;
  clearLevelPreview?: () => void;
  continueGame?: () => void;
  exitApp?: () => void;
  exitToRoot?: () => void;
  getContinues?: () => number;
  getAchievements?: () => AchievementStatus[];
  getLevel?: () => number;
  previewLevel?: (level: number) => void;
  playPreroll?: () => void;
  onNavigationChanged?: (state: MenuNavigationState) => void;
  resetStoredData?: (scope: StoredDataResetScope) => void;
  restart?: () => void;
  selectLevel?: (level: number) => void;
  setDebugContinues?: (continues: number) => void;
  setDebugLives?: (lives: number) => void;
  /**
   * Reconciles the screen wake lock after the user toggles the PWA option.
   */
  syncScreenWakeLock?: () => void;
  start: () => void;
  startNewGame?: () => void;
  watchDemo?: () => void;
}

export interface ShowStartMenuOptions {
  showRestart?: boolean;
  startLabel?: string;
}

export interface MenuNavigationState {
  active: boolean;
  canGoBack: boolean;
  depth: number;
  isPausedRoot: boolean;
  isRoot: boolean;
  isWatchingDemo: boolean;
}

export interface MenuRenderOptions {
  renderLogo?: boolean;
}

export interface MenuSystemInstance {
  adjustUiZoom: (direction: -1 | 1) => void;
  resetUiZoom: () => void;
  adjust: (direction: -1 | 1) => void;
  captureKey: (keyCode: number) => boolean;
  getNavigationState: () => MenuNavigationState;
  isActive: () => boolean;
  isWatchingDemo: () => boolean;
  showStart: (options?: ShowStartMenuOptions) => void;
  showDemoWatch: () => void;
  showGameOver: () => void;
  showRestartConfirm: () => void;
  hide: () => void;
  render: (options?: MenuRenderOptions) => void;
  next: () => void;
  previous: () => void;
  goBack: () => void;
  goToRoot: () => void;
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

export interface ProjectileSpriteConfig {
  sprite: SpriteAsset;
  width: number;
  height: number;
  frames?: number;
  frameAxis?: "x" | "y";
  frameMode?: "animation" | "heading";
  renderWidth?: number;
  renderHeight?: number;
}

export interface ProjectileExplosionConfig {
  sprite: SpriteAsset;
  width: number;
  height: number;
  frames: number;
  frameLimiter: number;
  renderWidth?: number;
  renderHeight?: number;
}

export interface BulletData extends Coordinates {
  coordinateSpace: "screen" | "world";
  heading: Heading;
  shape: "circle" | "sprite" | "square";
  size: number;
  velocity: number;
  color: string;
  sprite?: ProjectileSpriteConfig;
  tracksPlayer?: boolean;
  turnRate?: number;
  shootable?: boolean;
  explosion?: ProjectileExplosionConfig;
  sound?: SoundAsset;
  flightSound?: SoundAsset;
  explosionSound?: SoundAsset;
  explosionTick: number | false;
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
  sprite?: ProjectileSpriteConfig;
  sound?: SoundAsset;
  flightSound?: SoundAsset;
  initialAim?: "facing" | "player";
  tracksPlayer?: boolean;
  turnRate?: number;
  shootable?: boolean;
  explosion?: ProjectileExplosionConfig;
  explosionSound?: SoundAsset;
}

export interface PlayerConfig {
  sprite: SpriteAsset;
  spriteFrameAxis?: "x" | "y";
  frameWidth: number;
  frameHeight: number;
  width: number;
  height: number;
  hitRadius: number;
  rotationFrameCount: number;
  explosion: ExplosionConfig;
  projectile: ProjectileConfig & { sound: SoundAsset };
}

export interface EnemyConfig {
  animationFrames?: number;
  animationRows?: number;
  ambientSound?: SoundAsset;
  bossDamageFrames?: number;
  countsTowardBoss: boolean;
  damageFrames?: number;
  deathFlashFrameY?: number;
  deathFlashTicks?: number;
  headingFrameOffset?: number;
  deathValue: number;
  horizontalDirectionFrames?: number;
  leftFacingFrameOffset?: number;
  sprite: SpriteAsset;
  velocity: number;
  turnLimiter: number;
  width: number;
  height: number;
  firingChance: number;
  hitPoints: number;
  hitRadius: number;
  canRotate: boolean;
  tracksPlayer: boolean;
  renderHeight?: number;
  renderWidth?: number;
  spawnLimit: number;
  projectile: ProjectileConfig;
  explosion: ExplosionConfig;
}

export interface EnemyFormationConfig {
  breakPattern?: string;
  fireStaggerTicks?: number;
  holdTicks: number;
  movement: string;
  name: string;
  radiusChange?: number;
  rotationSpeed?: number;
  spawnChance: number;
  slots: Coordinates[];
  steering?: string;
  transformSlots?: Coordinates[];
  waveAmplitude: number;
  waveFrequency: number;
}

export interface PropConfig {
  sprite: SpriteAsset;
  width: number;
  height: number;
  renderWidth?: number;
  renderHeight?: number;
  foregroundOpacity?: number;
  relativeVelocity: number;
  layer: number;
  reversed: boolean;
}

export interface BonusConfig {
  sprite: SpriteAsset;
  velocity: number;
  animationCycle: number[];
  hitRadius: number;
  width: number;
  height: number;
  renderWidth?: number;
  renderHeight?: number;
}

export interface LevelConfig {
  enabled: boolean;
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
    boss: EnemyConfig;
    formations: EnemyFormationConfig[];
    specialBomber?: EnemyConfig;
  };
  bonus: BonusConfig;
  props: PropConfig[];
}

export interface TimePilotConstants {
  player: PlayerConfig;
  sounds: {
    coinDrop: SoundAsset;
    enemyShoot: SoundAsset;
    extraLife: SoundAsset;
    gameStart: SoundAsset;
    nextLevel: SoundAsset;
    timeWarp: SoundAsset;
    waveStart: SoundAsset;
  };
  scoring: {
    bomber1940: number;
    boss: number;
    formationBonus: number;
    missile: number;
    parachute: {
      max: number;
      min: number;
      step: number;
    };
    extraLife: {
      first: number;
      interval: number;
    };
    regularEnemy: number;
  };
  limits: {
    bossKillThresholdBase: number;
    bossKillThresholdIncrementPerLevel: number;
    bonuses: number;
    enemyBullets: number;
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
    showHeadingVectors: boolean;
    showPlayerCoordinates: boolean;
    showSteeringArc: boolean;
    invincible: boolean;
  };
  enableDebug: boolean;
  controllerType: ControllerType;
  debugContinues: number;
  debugLives: number;
  gameZoom: number;
  gamepadEnabled: boolean;
  /**
   * Keeps the screen awake during active or paused player runs when supported.
   */
  keepScreenAwake: boolean;
  /**
   * Shows the live touch steering guide during gameplay.
   */
  touchSteeringOverlay: boolean;
  filterSettings: FilterSettings;
  keyboardBindings: KeyboardBindings;
  language: GameLanguage;
  logLevel: LogLevel;
  masterVolume: number;
  musicVolume: number;
  effectsVolume: number;
  uiZoom: number;
  setKeyboardBinding: <K extends keyof KeyboardBindings>(
    key: K,
    value: KeyboardBindings[K]
  ) => void;
  setDebugOption: <K extends keyof UserOptions["debug"]>(
    key: K,
    value: UserOptions["debug"][K]
  ) => void;
  setFilterSetting: (key: FilterSettingKey, value: number) => void;
  videoFilterMode: FilterMode;
  setOption: <K extends keyof UserOptions>(key: K, value: UserOptions[K]) => void;
}
