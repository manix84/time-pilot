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
