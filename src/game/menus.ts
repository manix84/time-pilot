/* Converted from TimePilot.Menu.js (AMD) to ESM TypeScript. */
import type { GameArenaInstance } from "./types";

class Menus {
  private _gameArena: GameArenaInstance;

  constructor(gameArena: GameArenaInstance) {
    this._gameArena = gameArena;
  }

  private _renderButton(): void {
    this._gameArena.getContext();
  }

  show(): void {}

  hide(): void {}

  render(): void {
    this._renderButton();
  }
}

export default Menus;
