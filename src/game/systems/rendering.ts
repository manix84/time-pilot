import CONSTS from "../constants";
import type { GameDataStore, RenderingSystemInstance } from "../types";

class RenderingSystem implements RenderingSystemInstance {
  private _context: GameDataStore;

  constructor(context: GameDataStore) {
    this._context = context;
  }

  renderFrame(): void {
    this._context._gameArena.clear();
    this._context._gameArena.setBackgroundColor(
      CONSTS.levels[this._context._level].arena.backgroundColor
    );

    this._context._props.render(1);
    this._context._bullets.render();
    this._context._enemies.render();
    this._context._player.render();
    this._context._props.render(2);
    this._context._hud.render();
  }
}

export default RenderingSystem;
