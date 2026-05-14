import { assetPath } from "../asset-path";
import { levels } from "../constants";
import { getLevelIntroText } from "../i18n";
import { getGameScale } from "../ui-scale";
import type { GameDataStore, RenderingSystemInstance } from "../types";

const timeWarpFrameCount = 8;
const timeWarpFrameDurationTicks = 18;
const timeWarpFrameHeight = 16;
const timeWarpFrameWidth = 8;
const timeWarpFlashTicks = 3;
const timeWarpRenderScale = 2;

class RenderingSystem implements RenderingSystemInstance {
  private _context: GameDataStore;
  private _timeWarpSprite = new Image();

  constructor(context: GameDataStore) {
    this._context = context;
    this._timeWarpSprite.src = assetPath("sprites/player/timewarp.png");
  }

  renderFrame = (): void => {
    this._context._gameArena.clear();

    if (this._context._timeWarpTransition) {
      this.renderTimeWarpTransition();
      this._context._menus.render();
      return;
    }

    this._context._gameArena.setBackgroundColor(
      levels[this._context._level].arena.backgroundColor
    );
    this.renderWorld();

    if (!this._context._menus.isActive()) {
      this._context._hud.render();
    }

    this.renderLevelIntroText();
    this.renderDemoLevelFade();
    this._context._menus.render();
  };

  private renderWorld = (): void => {
    const context = this._context._gameArena.getContext() as CanvasRenderingContext2D;

    context.save();
    context.imageSmoothingEnabled = false;
    const gameScale = getGameScale(
      this._context._gameArena.width,
      this._context._gameArena.height
    );
    context.scale(gameScale, gameScale);
    this._context._props.render(1);
    this._context._bonuses.render();
    this._context._bullets.render();
    this._context._enemies.render();
    this._context._enemyBullets.render();
    this._context._player.render();
    this._context._props.render(2);
    context.restore();
  };

  private renderTimeWarpTransition = (): void => {
    this._context._gameArena.setBackgroundColor("#000");

    const context = this._context._gameArena.getContext() as CanvasRenderingContext2D;
    const gameScale = getGameScale(
      this._context._gameArena.width,
      this._context._gameArena.height
    );

    context.save();
    context.imageSmoothingEnabled = false;
    context.scale(gameScale, gameScale);
    this._context._player.render();
    this.renderTimeWarpEffect(context);
    context.restore();
  };

  private renderTimeWarpEffect = (context: CanvasRenderingContext2D): void => {
    const transition = this._context._timeWarpTransition;

    if (!transition) {
      return;
    }

    const elapsedTicks =
      this._context._gameTicker.getTicks() - transition.startedAtTick;

    if (elapsedTicks < timeWarpFlashTicks) {
      context.save();
      context.fillStyle = "#FFF";
      context.fillRect(
        -(this._context._gameArena.width / 2),
        -(this._context._gameArena.height / 2),
        this._context._gameArena.width,
        this._context._gameArena.height
      );
      context.restore();
      return;
    }

    const frame = Math.floor(
      (elapsedTicks - timeWarpFlashTicks) / timeWarpFrameDurationTicks
    );

    if (frame < 0 || frame >= timeWarpFrameCount) {
      return;
    }

    const renderWidth = timeWarpFrameWidth * timeWarpRenderScale;
    const renderHeight = timeWarpFrameHeight * timeWarpRenderScale;
    const sourceX = frame * timeWarpFrameWidth;

    context.drawImage(
      this._timeWarpSprite,
      sourceX,
      0,
      timeWarpFrameWidth,
      timeWarpFrameHeight,
      -renderWidth,
      -renderHeight / 2,
      renderWidth,
      renderHeight
    );

    context.save();
    context.scale(-1, 1);
    context.drawImage(
      this._timeWarpSprite,
      sourceX,
      0,
      timeWarpFrameWidth,
      timeWarpFrameHeight,
      -renderWidth,
      -renderHeight / 2,
      renderWidth,
      renderHeight
    );
    context.restore();
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
