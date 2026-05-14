export type Heading = number;

export interface Coordinates {
  posX: number;
  posY: number;
}

export interface PositionedRadius extends Coordinates {
  radius: number;
}

export interface SpriteFrame extends Coordinates {
  flipY?: boolean;
  frameWidth: number;
  frameHeight: number;
  frameX: number;
  frameY: number;
  renderHeight?: number;
  renderWidth?: number;
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

export interface PropData extends Coordinates {
  level: number;
  type: number;
  layer: number;
}

export interface BonusData extends Coordinates {
  level: number;
  layer: number;
  removeMe: boolean;
  type: "parachute";
}

export interface SpriteImage extends HTMLImageElement {
  frameWidth?: number;
  frameHeight?: number;
  frameX?: number;
  frameY?: number;
}

export interface ControllerCommands {
  openMenu?: () => void;
  restart?: () => void;
  pause?: () => void;
}

export type ControllerType = "keyboard1" | "keyboard2";
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
  explode: () => void;
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
    explosion?: BulletData["explosion"]
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
  clearLevelPreview?: () => void;
  getLevel?: () => number;
  previewLevel?: (level: number) => void;
  selectLevel?: (level: number) => void;
  start: () => void;
}

export interface ShowStartMenuOptions {
  startLabel?: string;
}

export interface MenuSystemInstance {
  adjustUiZoom: (direction: -1 | 1) => void;
  resetUiZoom: () => void;
  adjust: (direction: -1 | 1) => void;
  captureKey: (keyCode: number) => boolean;
  isActive: () => boolean;
  showStart: (options?: ShowStartMenuOptions) => void;
  hide: () => void;
  render: () => void;
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
  initialAim?: "facing" | "player";
  tracksPlayer?: boolean;
  turnRate?: number;
  shootable?: boolean;
  explosion?: ProjectileExplosionConfig;
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
  bossDamageFrames?: number;
  countsTowardBoss: boolean;
  deathFlashFrameY?: number;
  deathFlashTicks?: number;
  headingFrameOffset?: number;
  deathValue: number;
  horizontalDirectionFrames?: number;
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
  gameZoom: number;
  gamepadEnabled: boolean;
  keyboardBindings: KeyboardBindings;
  language: GameLanguage;
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
  setOption: <K extends keyof UserOptions>(key: K, value: UserOptions[K]) => void;
}
