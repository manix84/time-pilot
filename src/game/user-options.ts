/* Converted from TimePilot.userOptions.js (AMD) to ESM TypeScript. */
import type { ControllerType, UserOptions } from "./types";

var userOptions: UserOptions = {
  debug: {
    /**
     * Draw either a circle or a box showing what counts as a hit, either by a bullet/missile or the player.
     * @type {Boolean}
     */
    showHitboxes: true,

    /**
     * Render corner points to show the sprite dimensions.
     * @type {Boolean}
     */
    showSpriteCorners: true,

    /**
     * Render corner points to show the sprite dimensions.
     * @type {Boolean}
     */
    showSpriteCenters: true,

    /**
     * Display gameplay controls on the HUD.
     * @type {Boolean}
     */
    showControlsOverlay: false,

    /**
     * Write the current player coordinates on screen.
     * @type {Boolean}
     */
    showPlayerCoordinates: true,

    /**
     * Make the player immortal.
     * @type {boolean}
     */
    invincible: true,
  },

  /**
   * Enable debug menus and overlays.
   * @type {Boolean}
   */
  enableDebug: false,

  /**
   * Selected controller to be accessed on the controlInterface.
   * @type {String}
   */
  controllerType: "keyboard1" as ControllerType,

  /**
   * Poll the browser Gamepad API alongside the selected keyboard layout.
   */
  gamepadEnabled: true,

  keyboardBindings: {
    left: [37, 65],
    up: [38, 87],
    right: [39, 68],
    down: [40, 83],
    fire: [32],
    fullscreen: [70],
    menu: [27],
    pause: [80],
    restart: [82],
  },

  masterVolume: 10,
  musicVolume: 8,
  effectsVolume: 8,

  /**
   * Set options in this object (userOptions), and store it so that the user doesn't have to set options each time
   * @method
   */
  setOption: (key, value) => {
    userOptions[key] = value;
  },
};

/**
 * Gather overrides the user has set.
 */
(() => {})();

export default userOptions;
