import { assetPath } from "../asset-path";
import { levels, player } from "../constants";
import { getLevelIntroText } from "../i18n";
import {
  getTimeWarpFrameForDistance,
  getTimeWarpRenderState,
  timeWarpAnimationTicks,
  timeWarpFrameWidth,
  timeWarpFrameHeight,
  timeWarpRenderScale,
  type TimeWarpPlayerMode,
} from "../time-warp";
import { getGameScale } from "../ui-scale";
import type { GameDataStore, RenderingSystemInstance } from "../types";

const playerRotationStep = 360 / player.rotationFrameCount;

class RenderingSystem implements RenderingSystemInstance {
  private _context: GameDataStore;
  private _playerSprite = new Image();
  private _timeWarpSprite = new Image();

  constructor(context: GameDataStore) {
    this._context = context;
    this._playerSprite.src = player.sprite.src;
    this._timeWarpSprite.src = assetPath("sprites/player/timewarp.png");
  }

  renderFrame = (): void => {
    this._context._gameArena.clear();

    if (this.isTimeWarpEffectActive()) {
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
    this.renderTimeWarpEffect(context);
    context.restore();
  };

  private renderTimeWarpEffect = (context: CanvasRenderingContext2D): void => {
    const transition = this._context._timeWarpTransition;

    if (!transition) {
      return;
    }

    const elapsedTicks =
      this._context._gameTicker.getTicks() - transition.effectStartedAtTick;
    const renderWidth = timeWarpFrameWidth * timeWarpRenderScale;
    const visibleWidth = this._context._gameArena.width / getGameScale(
      this._context._gameArena.width,
      this._context._gameArena.height
    );
    const halfCellCount = Math.ceil(visibleWidth / 2 / renderWidth);
    const renderState = getTimeWarpRenderState(elapsedTicks, halfCellCount);

    if (!renderState) {
      return;
    }

    if (renderState.warpVisible) {
      this.renderTimeWarpStrip(context, renderState.halfCells, renderState.layers);

      if (renderState.centerFrame !== undefined) {
        this.renderTimeWarpFrame(context, renderState.centerFrame, -renderWidth / 2);
      }
    }

    this.renderTimeWarpPlayer(context, renderState.playerMode);
  };

  private renderTimeWarpStrip = (
    context: CanvasRenderingContext2D,
    halfCells: number,
    layers: readonly number[]
  ): void => {
    if (halfCells <= 0 || layers.length === 0) {
      return;
    }

    const renderWidth = timeWarpFrameWidth * timeWarpRenderScale;
    const renderHeight = timeWarpFrameHeight * timeWarpRenderScale;

    for (let distance = halfCells; distance >= 1; distance -= 1) {
      const frame = getTimeWarpFrameForDistance(distance, layers);
      this.renderTimeWarpFrame(context, frame, -distance * renderWidth);
    }

    for (let distance = 1; distance <= halfCells; distance += 1) {
      const frame = getTimeWarpFrameForDistance(distance, layers);
      this.renderTimeWarpFrame(context, frame, (distance - 1) * renderWidth);
    }

    context.imageSmoothingEnabled = false;
  };

  private renderTimeWarpFrame = (
    context: CanvasRenderingContext2D,
    frame: number,
    posX: number
  ): void => {
    const renderWidth = timeWarpFrameWidth * timeWarpRenderScale;
    const renderHeight = timeWarpFrameHeight * timeWarpRenderScale;
    const sourceX = frame * timeWarpFrameWidth;

    context.drawImage(
      this._timeWarpSprite,
      sourceX,
      0,
      timeWarpFrameWidth,
      timeWarpFrameHeight,
      posX,
      -renderHeight / 2,
      renderWidth,
      renderHeight
    );
  };

  private renderTimeWarpPlayer = (
    context: CanvasRenderingContext2D,
    mode: TimeWarpPlayerMode
  ): void => {
    if (mode === "hidden") {
      return;
    }

    const heading = ((this._context._player.getData("heading") ?? 90) + 360) % 360;
    const frame =
      Math.round(((heading + 270) % 360) / playerRotationStep) %
      player.rotationFrameCount;
    const layer = mode === "white" ? 1 : mode === "black" ? 2 : 0;
    const sourceX = player.spriteFrameAxis === "y" ? 0 : frame * player.frameWidth;
    const sourceY =
      player.spriteFrameAxis === "y"
        ? frame * player.frameHeight
        : layer * player.frameHeight;

    context.drawImage(
      this._playerSprite,
      sourceX,
      sourceY,
      player.frameWidth,
      player.frameHeight,
      -player.width / 2,
      -player.height / 2,
      player.width,
      player.height
    );
  };

  private isTimeWarpEffectActive = (): boolean => {
    const transition = this._context._timeWarpTransition;

    return (
      !!transition &&
      this._context._gameTicker.getTicks() >= transition.effectStartedAtTick &&
      this._context._gameTicker.getTicks() <
        transition.effectStartedAtTick + timeWarpAnimationTicks
    );
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
