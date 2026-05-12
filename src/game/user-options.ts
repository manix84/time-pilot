/* Converted from TimePilot.userOptions.js (AMD) to ESM TypeScript. */
import type {
  ControllerType,
  GameLanguage,
  KeyboardBindings,
  UserOptions,
} from "./types";

const supportedLanguages: GameLanguage[] = ["en", "fr", "de", "it", "nl", "ro"];

type PersistedUserOptions = Pick<
  UserOptions,
  | "controllerType"
  | "debug"
  | "enableDebug"
  | "effectsVolume"
  | "gamepadEnabled"
  | "keyboardBindings"
  | "language"
  | "masterVolume"
  | "musicVolume"
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
    showPlayerCoordinates: true,
    invincible: true,
  },
  enableDebug: false,
  controllerType: "keyboard1" as ControllerType,
  gamepadEnabled: true,
  keyboardBindings: defaultKeyboardBindings,
  language: "en",
  masterVolume: 10,
  musicVolume: 8,
  effectsVolume: 8,
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
        keyboardBindings: userOptions.keyboardBindings,
        language: userOptions.language,
        masterVolume: userOptions.masterVolume,
        musicVolume: userOptions.musicVolume,
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
     * Write the current player coordinates on screen.
     * @type {Boolean}
     */
    showPlayerCoordinates:
      storedOptions.debug?.showPlayerCoordinates ??
      defaultPersistedOptions.debug.showPlayerCoordinates,

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
