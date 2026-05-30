/* Converted from TimePilot.userOptions.js (AMD) to ESM TypeScript. */
import type {
  ControllerType,
  FilterMode,
  GameLanguage,
  KeyboardBindings,
  UserOptions,
} from "./types";
import {
  defaultCustomFilterSettings,
  defaultFilterMode,
  filterModes,
  normalizeFilterIntensity,
  normalizeFilterSettings,
} from "./filter-settings";
import {
  defaultGameSpeed,
  defaultRenderFps,
  normalizeGameSpeed,
  normalizeRenderFps,
} from "./game-timing";
import { isLogLevel } from "./log-levels";

const supportedLanguages: GameLanguage[] = [
  "en",
  "fr",
  "es",
  "de",
  "it",
  "nl",
  "ro",
];
const zoomDefaultPercent = 100;
const zoomMaxPercent = 250;
const zoomMinPercent = 25;
const oldZoomBasePercent = 75;
const oldZoomStepPercent = 5;
const userOptionsVersion = 2;

type PersistedUserOptions = Pick<
  UserOptions,
  | "controllerType"
  | "debug"
  | "debugContinues"
  | "debugLives"
  | "enableDebug"
  | "effectsVolume"
  | "gamepadEnabled"
  | "gameSpeed"
  | "gameZoom"
  | "filterSettings"
  | "keyboardBindings"
  | "keepScreenAwake"
  | "language"
  | "logLevel"
  | "masterVolume"
  | "musicVolume"
  | "renderFps"
  | "touchSteeringOverlay"
  | "uiZoom"
  | "videoFilterMode"
> & {
  optionsVersion?: number;
};

/**
 * Local storage key for persisted user options.
 */
export const userOptionsStorageKey = "timePilot.userOptions";

/**
 * Legacy local storage key used by older debug-option persistence.
 */
export const legacyDebugStorageKey = "timePilot.debugOptions";

const defaultKeyboardBindings: KeyboardBindings = {
  left: [37, 65],
  up: [38, 87],
  right: [39, 68],
  down: [40, 83],
  fire: [32],
  fullscreen: [70],
  menu: [27],
  pause: [80],
  restart: [82],
};

const defaultPersistedOptions: PersistedUserOptions = {
  debug: {
    showHitboxes: true,
    showSpriteCorners: true,
    showSpriteCenters: true,
    showControlsOverlay: false,
    showHeadingVectors: false,
    showPlayerCoordinates: true,
    showSteeringArc: false,
    invincible: true,
  },
  debugContinues: 3,
  debugLives: 3,
  enableDebug: false,
  controllerType: "keyboard1" as ControllerType,
  gameZoom: zoomDefaultPercent,
  gamepadEnabled: true,
  gameSpeed: defaultGameSpeed,
  filterSettings: defaultCustomFilterSettings,
  keyboardBindings: defaultKeyboardBindings,
  keepScreenAwake: true,
  language: "en",
  logLevel: "off",
  masterVolume: 8,
  musicVolume: 2,
  renderFps: defaultRenderFps,
  effectsVolume: 8,
  touchSteeringOverlay: true,
  uiZoom: zoomDefaultPercent,
  videoFilterMode: defaultFilterMode,
};

const cloneDefaultPersistedOptions = (): PersistedUserOptions => ({
  ...defaultPersistedOptions,
  debug: { ...defaultPersistedOptions.debug },
  filterSettings: { ...defaultPersistedOptions.filterSettings },
  keyboardBindings: {
    down: [...defaultPersistedOptions.keyboardBindings.down],
    fire: [...defaultPersistedOptions.keyboardBindings.fire],
    fullscreen: [...defaultPersistedOptions.keyboardBindings.fullscreen],
    left: [...defaultPersistedOptions.keyboardBindings.left],
    menu: [...defaultPersistedOptions.keyboardBindings.menu],
    pause: [...defaultPersistedOptions.keyboardBindings.pause],
    restart: [...defaultPersistedOptions.keyboardBindings.restart],
    right: [...defaultPersistedOptions.keyboardBindings.right],
    up: [...defaultPersistedOptions.keyboardBindings.up],
  },
});

const normalizeZoomOption = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return zoomDefaultPercent;
  }

  const percent =
    value >= 0 && value <= 10
      ? oldZoomBasePercent + value * oldZoomStepPercent
      : value;

  return Math.max(zoomMinPercent, Math.min(zoomMaxPercent, percent));
};

const normalizeIntegerOption = (
  value: unknown,
  defaultValue: number,
  min: number,
  max: number
): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return defaultValue;
  }

  return Math.max(min, Math.min(max, Math.round(value)));
};

const getOptionsStorage = (): Storage | null => {
  try {
    if (
      typeof localStorage === "undefined" ||
      typeof localStorage.getItem !== "function" ||
      typeof localStorage.setItem !== "function"
    ) {
      return null;
    }

    return localStorage;
  } catch {
    return null;
  }
};

const isNumberArray = (value: unknown): value is number[] => {
  return Array.isArray(value) && value.every((item) => typeof item === "number");
};

const normalizeKeyboardBindings = (bindings: unknown): KeyboardBindings => {
  const normalized = { ...defaultPersistedOptions.keyboardBindings };

  if (!bindings || typeof bindings !== "object") {
    return normalized;
  }

  for (const key of Object.keys(normalized) as Array<keyof KeyboardBindings>) {
    const value = (bindings as Partial<Record<keyof KeyboardBindings, unknown>>)[key];

    if (isNumberArray(value)) {
      normalized[key] = value;
    }
  }

  return normalized;
};

const readStoredOptions = (): Partial<PersistedUserOptions> => {
  const storage = getOptionsStorage();

  if (!storage) {
    return {};
  }

  try {
    const storedOptions = JSON.parse(
      storage.getItem(userOptionsStorageKey) ?? "{}"
    ) as Partial<PersistedUserOptions>;
    const legacyDebugOptions = JSON.parse(
      storage.getItem(legacyDebugStorageKey) ?? "{}"
    ) as Partial<Pick<UserOptions, "debug" | "enableDebug">>;

    return {
      ...legacyDebugOptions,
      ...storedOptions,
      debug: {
        ...legacyDebugOptions.debug,
        ...storedOptions.debug,
      },
    };
  } catch {
    return {};
  }
};

const storedOptions = readStoredOptions();
const storedLanguage = supportedLanguages.includes(storedOptions.language as GameLanguage)
  ? storedOptions.language as GameLanguage
  : defaultPersistedOptions.language;
const storedFilterMode = filterModes.includes(storedOptions.videoFilterMode as FilterMode)
  ? storedOptions.videoFilterMode as FilterMode
  : defaultPersistedOptions.videoFilterMode;
const storedLogLevel = isLogLevel(storedOptions.logLevel)
  ? storedOptions.logLevel
  : defaultPersistedOptions.logLevel;
const storedTouchSteeringOverlay =
  storedOptions.optionsVersion === userOptionsVersion
    ? storedOptions.touchSteeringOverlay
    : undefined;

const dispatchUserOptionsChanged = (): void => {
  window.dispatchEvent(new CustomEvent("timePilot:userOptionsChanged"));
};

const writeUserOptions = (): void => {
  const storage = getOptionsStorage();

  if (!storage) {
    dispatchUserOptionsChanged();
    return;
  }

  try {
    storage.setItem(
      userOptionsStorageKey,
      JSON.stringify({
        controllerType: userOptions.controllerType,
        debug: userOptions.debug,
        debugContinues: userOptions.debugContinues,
        debugLives: userOptions.debugLives,
        enableDebug: userOptions.enableDebug,
        effectsVolume: userOptions.effectsVolume,
        gamepadEnabled: userOptions.gamepadEnabled,
        gameSpeed: userOptions.gameSpeed,
        gameZoom: userOptions.gameZoom,
        filterSettings: userOptions.filterSettings,
        keyboardBindings: userOptions.keyboardBindings,
        keepScreenAwake: userOptions.keepScreenAwake,
        language: userOptions.language,
        logLevel: userOptions.logLevel,
        masterVolume: userOptions.masterVolume,
        musicVolume: userOptions.musicVolume,
        renderFps: userOptions.renderFps,
        optionsVersion: userOptionsVersion,
        touchSteeringOverlay: userOptions.touchSteeringOverlay,
        uiZoom: userOptions.uiZoom,
        videoFilterMode: userOptions.videoFilterMode,
      } satisfies PersistedUserOptions)
    );
  } catch {
    // Persistence is best-effort; gameplay should not depend on storage.
  }

  dispatchUserOptionsChanged();
};

var userOptions: UserOptions = {
  debug: {
    /**
     * Draw either a circle or a box showing what counts as a hit, either by a bullet/missile or the player.
     * @type {Boolean}
     */
    showHitboxes:
      storedOptions.debug?.showHitboxes ??
      defaultPersistedOptions.debug.showHitboxes,

    /**
     * Render corner points to show the sprite dimensions.
     * @type {Boolean}
     */
    showSpriteCorners:
      storedOptions.debug?.showSpriteCorners ??
      defaultPersistedOptions.debug.showSpriteCorners,

    /**
     * Render corner points to show the sprite dimensions.
     * @type {Boolean}
     */
    showSpriteCenters:
      storedOptions.debug?.showSpriteCenters ??
      defaultPersistedOptions.debug.showSpriteCenters,

    /**
     * Display gameplay controls on the HUD.
     * @type {Boolean}
     */
    showControlsOverlay:
      storedOptions.debug?.showControlsOverlay ??
      defaultPersistedOptions.debug.showControlsOverlay,

    /**
     * Draw facing and steering vectors for intentional moving entities.
     * @type {Boolean}
     */
    showHeadingVectors:
      storedOptions.debug?.showHeadingVectors ??
      defaultPersistedOptions.debug.showHeadingVectors,

    /**
     * Write the current player coordinates on screen.
     * @type {Boolean}
     */
    showPlayerCoordinates:
      storedOptions.debug?.showPlayerCoordinates ??
      defaultPersistedOptions.debug.showPlayerCoordinates,

    /**
     * Fill the shortest turning arc between heading and steering vectors.
     * @type {Boolean}
     */
    showSteeringArc:
      storedOptions.debug?.showSteeringArc ??
      defaultPersistedOptions.debug.showSteeringArc,

    /**
     * Make the player immortal.
     * @type {boolean}
     */
    invincible:
      storedOptions.debug?.invincible ??
      defaultPersistedOptions.debug.invincible,
  },

  /**
   * Enable debug menus and overlays.
   * @type {Boolean}
   */
  enableDebug:
    storedOptions.enableDebug ?? defaultPersistedOptions.enableDebug,

  /**
   * Selected controller to be accessed on the controlInterface.
   * @type {String}
   */
  controllerType:
    storedOptions.controllerType ?? defaultPersistedOptions.controllerType,
  debugContinues: normalizeIntegerOption(
    storedOptions.debugContinues,
    defaultPersistedOptions.debugContinues,
    0,
    99
  ),
  debugLives: normalizeIntegerOption(
    storedOptions.debugLives,
    defaultPersistedOptions.debugLives,
    1,
    99
  ),
  gameZoom: normalizeZoomOption(storedOptions.gameZoom),

  /**
   * Poll the browser Gamepad API alongside the selected keyboard layout.
   */
  gamepadEnabled:
    storedOptions.gamepadEnabled ?? defaultPersistedOptions.gamepadEnabled,
  gameSpeed: normalizeGameSpeed(storedOptions.gameSpeed),

  filterSettings: normalizeFilterSettings(storedOptions.filterSettings),

  keyboardBindings: normalizeKeyboardBindings(storedOptions.keyboardBindings),

  /**
   * Keep the screen awake during player runs in installed PWA mode.
   */
  keepScreenAwake:
    storedOptions.keepScreenAwake ?? defaultPersistedOptions.keepScreenAwake,

  language: storedLanguage,
  logLevel: storedLogLevel,
  masterVolume: storedOptions.masterVolume ?? defaultPersistedOptions.masterVolume,
  musicVolume: storedOptions.musicVolume ?? defaultPersistedOptions.musicVolume,
  renderFps: normalizeRenderFps(storedOptions.renderFps),
  effectsVolume: storedOptions.effectsVolume ?? defaultPersistedOptions.effectsVolume,
  /**
   * Display a live touch steering guide during gameplay.
   */
  touchSteeringOverlay:
    storedTouchSteeringOverlay ?? defaultPersistedOptions.touchSteeringOverlay,
  uiZoom: normalizeZoomOption(storedOptions.uiZoom),
  videoFilterMode: storedFilterMode,

  /**
   * Set options in this object (userOptions), and store it so that the user doesn't have to set options each time
   * @method
   */
  setOption: (key, value) => {
    userOptions[key] = value;
    writeUserOptions();
  },

  setKeyboardBinding: (key, value) => {
    userOptions.keyboardBindings[key] = value;
    writeUserOptions();
  },

  setDebugOption: (key, value) => {
    userOptions.debug[key] = value;
    writeUserOptions();
  },

  setFilterSetting: (key, value) => {
    userOptions.filterSettings[key] = normalizeFilterIntensity(value);
    userOptions.videoFilterMode = "custom";
    writeUserOptions();
  },
};

/**
 * Restores runtime user options to defaults and removes persisted preferences.
 */
export const resetUserOptions = (): void => {
  const defaults = cloneDefaultPersistedOptions();
  const storage = getOptionsStorage();

  userOptions.debug = defaults.debug;
  userOptions.debugContinues = defaults.debugContinues;
  userOptions.debugLives = defaults.debugLives;
  userOptions.enableDebug = defaults.enableDebug;
  userOptions.controllerType = defaults.controllerType;
  userOptions.gameZoom = defaults.gameZoom;
  userOptions.gamepadEnabled = defaults.gamepadEnabled;
  userOptions.gameSpeed = defaults.gameSpeed;
  userOptions.filterSettings = defaults.filterSettings;
  userOptions.keyboardBindings = defaults.keyboardBindings;
  userOptions.keepScreenAwake = defaults.keepScreenAwake;
  userOptions.language = defaults.language;
  userOptions.logLevel = defaults.logLevel;
  userOptions.masterVolume = defaults.masterVolume;
  userOptions.musicVolume = defaults.musicVolume;
  userOptions.renderFps = defaults.renderFps;
  userOptions.effectsVolume = defaults.effectsVolume;
  userOptions.touchSteeringOverlay = defaults.touchSteeringOverlay;
  userOptions.uiZoom = defaults.uiZoom;
  userOptions.videoFilterMode = defaults.videoFilterMode;

  try {
    storage?.removeItem(userOptionsStorageKey);
    storage?.removeItem(legacyDebugStorageKey);
  } catch {
    // Resetting preferences should remain best-effort like normal persistence.
  }

  dispatchUserOptionsChanged();
};

export default userOptions;
