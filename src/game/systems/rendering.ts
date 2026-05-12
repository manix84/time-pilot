import { levels } from "../constants";
import { getLevelIntroText } from "../i18n";
import type { GameDataStore, RenderingSystemInstance } from "../types";

class RenderingSystem implements RenderingSystemInstance {
  private _context: GameDataStore;

  constructor(context: GameDataStore) {
    this._context = context;
  }

  renderFrame = (): void => {
    this._context._gameArena.clear();
    this._context._gameArena.setBackgroundColor(
      levels[this._context._level].arena.backgroundColor
    );

    this._context._props.render(1);
    this._context._bonuses.render();
    this._context._bullets.render();
    this._context._enemies.render();
    this._context._enemyBullets.render();
    this._context._player.render();
    this._context._props.render(2);

    if (!this._context._menus.isActive()) {
      this._context._hud.render();
    }

    this.renderLevelIntroText();
    this.renderDemoLevelFade();
    this._context._menus.render();
  };

  private renderLevelIntroText = (): void => {
    if (!this.isLevelIntroActive() || this._context._menus.isActive()) {
      return;
    }

    this._context._gameArena.renderText(
      getLevelIntroText(this._context._level),
      0,
      44,
      {
        size: 24,
        align: "center",
        valign: "middle",
      }
    );
  };

  private isLevelIntroActive = (): boolean => {
    return (
      !!this._context._levelIntroUntilTick &&
      this._context._gameTicker.getTicks() < this._context._levelIntroUntilTick
    );
  };

  private renderDemoLevelFade = (): void => {
    if (
      !this._context._isDemoMode ||
      this._context._demoFadeStartedAtTick === undefined ||
      this._context._demoFadeUntilTick === undefined
    ) {
      return;
    }

    const ticks = this._context._gameTicker.getTicks();

    if (ticks >= this._context._demoFadeUntilTick) {
      return;
    }

    const duration =
      this._context._demoFadeUntilTick - this._context._demoFadeStartedAtTick;
    const progress =
      (ticks - this._context._demoFadeStartedAtTick) / Math.max(1, duration);
    const context = this._context._gameArena.getContext() as CanvasRenderingContext2D;

    context.save();
    context.globalAlpha = Math.max(0, Math.min(1, 1 - progress));
    context.fillStyle = "#000";
    context.fillRect(
      -(this._context._gameArena.width / 2),
      -(this._context._gameArena.height / 2),
      this._context._gameArena.width,
      this._context._gameArena.height
    );
    context.restore();
  };
}

export default RenderingSystem;
