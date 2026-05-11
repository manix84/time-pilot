/* Converted from TimePilot.Menu.js (AMD) to ESM TypeScript. */
import type { GameArenaInstance } from "./types";

var Menus = function (gameArena: GameArenaInstance) {
  this._gameArena = gameArena;
};

Menus.prototype = {
  _renderButton: function () {
    var context = this._gameArena.getContext();
  },

  show: () => {},

  hide: () => {},

  render: () => {},
};

export default Menus;
