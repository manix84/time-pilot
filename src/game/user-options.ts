/* Converted from TimePilot.userOptions.js (AMD) to ESM TypeScript. */
import {
  createUserOptionsStore,
  defaultCustomDisplayFilterSettings as defaultCustomFilterSettings,
  defaultDisplayFilterMode as defaultFilterMode,
  displayFilterModes as filterModes,
  isRuntimeLogLevel as isLogLevel,
  normalizeDisplayFilterIntensity as normalizeFilterIntensity,
  normalizeDisplayFilterSettings as normalizeFilterSettings,
  normalizeUserOptions,
  userOptionsChangedEventName,
} from "arcade-engine";
import type {
  ControllerType,
  FilterMode,
  GameLanguage,
  KeyboardBindings,
  UserOptions,
} from "./types";
import {
  defaultGameSpeed,
  defaultRenderFps,
  normalizeGameSpeed,
  normalizeRenderFps,
} from "./game-timing";

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
} & Record<string, unknown>;

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

const optionsStorage = {
  getItem: (key: string): string | null => {
    const storage = getOptionsStorage();

    if (!storage) {
      return null;
    }

    try {
      if (key !== userOptionsStorageKey) {
        return storage.getItem(key);
      }

      const storedOptions = parseStoredOptions(
        storage.getItem(userOptionsStorageKey)
      );
      const legacyDebugOptions = parseStoredOptions(
        storage.getItem(legacyDebugStorageKey)
      ) as Partial<Pick<UserOptions, "debug" | "enableDebug">>;

      return JSON.stringify({
        ...legacyDebugOptions,
        ...storedOptions,
        debug: {
          ...getObjectRecord(legacyDebugOptions.debug),
          ...getObjectRecord(storedOptions.debug),
        },
      });
    } catch {
      return null;
    }
  },
  removeItem: (key: string): void => {
    const storage = getOptionsStorage();

    try {
      storage?.removeItem(key);

      if (key === userOptionsStorageKey) {
        storage?.removeItem(legacyDebugStorageKey);
      }
    } catch {
      // Preference persistence is best-effort.
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      getOptionsStorage()?.setItem(key, value);
    } catch {
      // Preference persistence is best-effort.
    }
  },
};

const parseStoredOptions = (value: string | null): Record<string, unknown> => {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);

    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
};

const getObjectRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

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

const normalizeStoredOptions = (
  stored: unknown,
  defaults: PersistedUserOptions
): PersistedUserOptions => {
  const base = normalizeUserOptions(stored, defaults);
  const storedOptions =
    stored && typeof stored === "object"
      ? (stored as Partial<PersistedUserOptions>)
      : {};

  return {
    ...base,
    debug: {
      ...defaults.debug,
      ...(storedOptions.debug && typeof storedOptions.debug === "object"
        ? storedOptions.debug
        : {}),
    },
    controllerType:
      storedOptions.controllerType === "keyboard1" ||
      storedOptions.controllerType === "keyboard2" ||
      storedOptions.controllerType === "touch"
        ? storedOptions.controllerType
        : defaults.controllerType,
    debugContinues: normalizeIntegerOption(
      storedOptions.debugContinues,
      defaults.debugContinues,
      0,
      99
    ),
    debugLives: normalizeIntegerOption(
      storedOptions.debugLives,
      defaults.debugLives,
      1,
      99
    ),
    filterSettings: normalizeFilterSettings(storedOptions.filterSettings),
    gameSpeed: normalizeGameSpeed(storedOptions.gameSpeed),
    gameZoom: normalizeZoomOption(storedOptions.gameZoom),
    keyboardBindings: normalizeKeyboardBindings(storedOptions.keyboardBindings),
    language: supportedLanguages.includes(storedOptions.language as GameLanguage)
      ? storedOptions.language as GameLanguage
      : defaults.language,
    logLevel: isLogLevel(storedOptions.logLevel)
      ? storedOptions.logLevel
      : defaults.logLevel,
    renderFps: normalizeRenderFps(storedOptions.renderFps),
    touchSteeringOverlay:
      storedOptions.optionsVersion === userOptionsVersion
        ? storedOptions.touchSteeringOverlay ?? defaults.touchSteeringOverlay
        : defaults.touchSteeringOverlay,
    uiZoom: normalizeZoomOption(storedOptions.uiZoom),
    videoFilterMode: filterModes.includes(storedOptions.videoFilterMode as FilterMode)
      ? storedOptions.videoFilterMode as FilterMode
      : defaults.videoFilterMode,
  };
};

const userOptionsStore = createUserOptionsStore<PersistedUserOptions>({
  defaults: cloneDefaultPersistedOptions(),
  eventName: userOptionsChangedEventName,
  normalize: normalizeStoredOptions,
  storage: optionsStorage,
  storageKey: userOptionsStorageKey,
  version: userOptionsVersion,
});

const applyPersistedOptions = (options: PersistedUserOptions): void => {
  userOptions.debug = { ...options.debug };
  userOptions.debugContinues = options.debugContinues;
  userOptions.debugLives = options.debugLives;
  userOptions.enableDebug = options.enableDebug;
  userOptions.controllerType = options.controllerType;
  userOptions.gameZoom = options.gameZoom;
  userOptions.gamepadEnabled = options.gamepadEnabled;
  userOptions.gameSpeed = options.gameSpeed;
  userOptions.filterSettings = { ...options.filterSettings };
  userOptions.keyboardBindings = {
    down: [...options.keyboardBindings.down],
    fire: [...options.keyboardBindings.fire],
    fullscreen: [...options.keyboardBindings.fullscreen],
    left: [...options.keyboardBindings.left],
    menu: [...options.keyboardBindings.menu],
    pause: [...options.keyboardBindings.pause],
    restart: [...options.keyboardBindings.restart],
    right: [...options.keyboardBindings.right],
    up: [...options.keyboardBindings.up],
  };
  userOptions.keepScreenAwake = options.keepScreenAwake;
  userOptions.language = options.language;
  userOptions.logLevel = options.logLevel;
  userOptions.masterVolume = options.masterVolume;
  userOptions.musicVolume = options.musicVolume;
  userOptions.renderFps = options.renderFps;
  userOptions.effectsVolume = options.effectsVolume;
  userOptions.touchSteeringOverlay = options.touchSteeringOverlay;
  userOptions.uiZoom = options.uiZoom;
  userOptions.videoFilterMode = options.videoFilterMode;
};

const initialOptions = userOptionsStore.getOptions();

var userOptions: UserOptions = {
  ...initialOptions,

  /**
   * Set options in this object (userOptions), and store it so that the user doesn't have to set options each time
   * @method
   */
  setOption: (key, value) => {
    if (
      key === "setOption" ||
      key === "setKeyboardBinding" ||
      key === "setDebugOption" ||
      key === "setFilterSetting"
    ) {
      return;
    }

    applyPersistedOptions(
      userOptionsStore.setOption(key as keyof PersistedUserOptions, value as never)
    );
  },

  setKeyboardBinding: (key, value) => {
    applyPersistedOptions(
      userOptionsStore.setOptions((current) => ({
        keyboardBindings: {
          ...current.keyboardBindings,
          [key]: value,
        },
      }))
    );
  },

  setDebugOption: (key, value) => {
    applyPersistedOptions(
      userOptionsStore.setOptions((current) => ({
        debug: {
          ...current.debug,
          [key]: value,
        },
      }))
    );
  },

  setFilterSetting: (key, value) => {
    applyPersistedOptions(
      userOptionsStore.setOptions((current) => ({
        filterSettings: {
          ...current.filterSettings,
          [key]: normalizeFilterIntensity(value),
        },
        videoFilterMode: "custom",
      }))
    );
  },
};

/**
 * Restores runtime user options to defaults and removes persisted preferences.
 */
export const resetUserOptions = (): void => {
  applyPersistedOptions(userOptionsStore.reset());
};

export default userOptions;
