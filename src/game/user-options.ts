/* Converted from TimePilot.userOptions.js (AMD) to ESM TypeScript. */
import type {
  ControllerType,
  GameLanguage,
  KeyboardBindings,
  UserOptions,
} from "./types";

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

type PersistedUserOptions = Pick<
  UserOptions,
  | "controllerType"
  | "debug"
  | "enableDebug"
  | "effectsVolume"
  | "gamepadEnabled"
  | "gameZoom"
  | "keyboardBindings"
  | "language"
  | "masterVolume"
  | "musicVolume"
  | "uiZoom"
>;

const userOptionsStorageKey = "timePilot.userOptions";
const legacyDebugStorageKey = "timePilot.debugOptions";

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
  enableDebug: false,
  controllerType: "keyboard1" as ControllerType,
  gameZoom: zoomDefaultPercent,
  gamepadEnabled: true,
  keyboardBindings: defaultKeyboardBindings,
  language: "en",
  masterVolume: 10,
  musicVolume: 8,
  effectsVolume: 8,
  uiZoom: zoomDefaultPercent,
};

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

const getOptionsStorage = (): Storage | null => {
  if (
    typeof localStorage === "undefined" ||
    typeof localStorage.getItem !== "function" ||
    typeof localStorage.setItem !== "function"
  ) {
    return null;
  }

  return localStorage;
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

const writeUserOptions = (): void => {
  const storage = getOptionsStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(
      userOptionsStorageKey,
      JSON.stringify({
        controllerType: userOptions.controllerType,
        debug: userOptions.debug,
        enableDebug: userOptions.enableDebug,
        effectsVolume: userOptions.effectsVolume,
        gamepadEnabled: userOptions.gamepadEnabled,
        gameZoom: userOptions.gameZoom,
        keyboardBindings: userOptions.keyboardBindings,
        language: userOptions.language,
        masterVolume: userOptions.masterVolume,
        musicVolume: userOptions.musicVolume,
        uiZoom: userOptions.uiZoom,
      } satisfies PersistedUserOptions)
    );
  } catch {
    // Persistence is best-effort; gameplay should not depend on storage.
  }
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
  gameZoom: normalizeZoomOption(storedOptions.gameZoom),

  /**
   * Poll the browser Gamepad API alongside the selected keyboard layout.
   */
  gamepadEnabled:
    storedOptions.gamepadEnabled ?? defaultPersistedOptions.gamepadEnabled,

  keyboardBindings: {
    ...defaultPersistedOptions.keyboardBindings,
    ...storedOptions.keyboardBindings,
  },

  language: storedLanguage,
  masterVolume: storedOptions.masterVolume ?? defaultPersistedOptions.masterVolume,
  musicVolume: storedOptions.musicVolume ?? defaultPersistedOptions.musicVolume,
  effectsVolume: storedOptions.effectsVolume ?? defaultPersistedOptions.effectsVolume,
  uiZoom: normalizeZoomOption(storedOptions.uiZoom),

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
};

export default userOptions;
