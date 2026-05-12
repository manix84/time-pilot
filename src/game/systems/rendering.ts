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
    this.renderLevelIntroText();
    this._context._props.render(2);

    if (!this._context._menus.isActive()) {
      this._context._hud.render();
    }

    this._context._menus.render();
  }

  private renderLevelIntroText(): void {
    if (!this.isLevelIntroActive() || this._context._menus.isActive()) {
      return;
    }

    this._context._gameArena.renderText(
      CONSTS.levels[this._context._level].arena.introText,
      0,
      44,
      {
        size: 24,
        align: "center",
        valign: "middle",
      }
    );
  }

  private isLevelIntroActive(): boolean {
    return (
      !!this._context._levelIntroUntilTick &&
      this._context._gameTicker.getTicks() < this._context._levelIntroUntilTick
    );
  }
}

export default RenderingSystem;
