/* Converted from TimePilot.Hud.js (AMD) to ESM TypeScript. */
import { levels, player } from "./constants";
import i18n from "./i18n";
import palette from "./palette";
import { getUiScale } from "./ui-scale";
import userOptions from "./user-options";
import type {
  ControlInputState,
  EnemyConfig,
  GameArenaInstance,
  GameDataStore,
  HudInstance,
  SpriteImage,
} from "./types";

const bossProgressSlots = 10;
const bossProgressWidth = 300;
const bossProgressHeight = 34;
const bossProgressPadding = 3;
const bossProgressEdgeInset = 6;
const bossProgressBottomInset = 4;
const bossProgressFrameDuration = 140;
const bossProgressEnemyScale = 0.5;
const directionalEnemyVisibleHeight = 8;

class Hud implements HudInstance {
  private _context: GameDataStore;
  private _enemySprites: Partial<Record<number, SpriteImage>> = {};
  private _gameArena: GameArenaInstance;
  private _playerSprite: SpriteImage;

  constructor(context: GameDataStore) {
    this._context = context;
    this._gameArena = context._gameArena;

    this._playerSprite = new Image() as SpriteImage;
    this._playerSprite.src = player.sprite.src;
    this._playerSprite.frameWidth = player.frameWidth;
    this._playerSprite.frameHeight = player.frameHeight;
    this._playerSprite.frameX = 0;
    this._playerSprite.frameY = 0;
  }

  render = (): void => {
    const context = this._gameArena.getContext() as CanvasRenderingContext2D;
    const playerData = this._context._player.getData();
    const uiScale = this._getUiScale();
    const uiWidth = this._getUiWidth();
    const uiHeight = this._getUiHeight();

    context.save();
    context.scale(uiScale, uiScale);

    this._gameArena.renderText(
      playerData.score,
      -(uiWidth / 2) + 20,
      -(uiHeight / 2) + 10,
      { size: 30 }
    );

    if (userOptions.enableDebug && userOptions.debug.showPlayerCoordinates) {
      this._gameArena.renderText(
        `${playerData.posX.toFixed(2)} x ${playerData.posY.toFixed(2)}`,
        -(uiWidth / 2) + 20,
        -(uiHeight / 2) + 40,
        { size: 15 }
      );
      this._gameArena.renderText(
        `${playerData.heading}°`,
        -(uiWidth / 2) + 20,
        -(uiHeight / 2) + 55,
        { size: 15 }
      );
    }

    if (userOptions.debug.showControlsOverlay) {
      this.renderControlsOverlay();
    }

    this.renderLives(playerData.lives, uiWidth, uiHeight);
    this.renderCredits(playerData.continues, uiWidth, uiHeight);
    this.renderBossProgress(uiWidth, uiHeight);

    context.restore();
  };

  private renderCredits = (
    continues: number,
    uiWidth: number,
    uiHeight: number
  ): void => {
    this._gameArena.renderText(
      `Credits ${this.formatCredits(continues)}`,
      uiWidth / 2 - bossProgressEdgeInset,
      uiHeight / 2 - bossProgressBottomInset - bossProgressHeight / 2,
      {
        size: 14,
        align: "right",
        valign: "middle",
        color: palette.text.white,
      }
    );
  };

  private formatCredits = (continues: number): string => {
    if (!Number.isFinite(continues) || continues < 0) {
      return "∞";
    }

    return `${Math.max(0, Math.min(99, Math.floor(continues)))}`.padStart(
      2,
      "0"
    );
  };

  private renderBossProgress = (uiWidth: number, uiHeight: number): void => {
    const levelConfig = levels[this._context._level];

    if (!levelConfig) {
      return;
    }

    const progress = this._context._levelProgress;
    const threshold = progress.bossKillThreshold;

    if (threshold <= 0 || progress.bossDefeated) {
      return;
    }

    const context = this._gameArena.getContext() as CanvasRenderingContext2D;
    const x = -(uiWidth / 2) + bossProgressEdgeInset;
    const y = uiHeight / 2 - bossProgressBottomInset - bossProgressHeight;
    const progressRatio = Math.max(
      0,
      Math.min(1, progress.standardEnemyKills / threshold)
    );
    const filledSlots = Math.floor(progressRatio * bossProgressSlots);
    const partialSlotProgress = progressRatio * bossProgressSlots - filledSlots;

    context.save();
    for (let slot = 0; slot < bossProgressSlots; slot++) {
      this.renderBossProgressEnemy(levelConfig.enemies.basic, slot, x, y, 0.18);
    }

    const fillWidth =
      ((filledSlots + partialSlotProgress) / bossProgressSlots) *
      bossProgressWidth;

    if (fillWidth > 0) {
      context.save();
      context.beginPath();
      context.rect(x, y, fillWidth, bossProgressHeight);
      context.clip();
      for (let slot = 0; slot < bossProgressSlots; slot++) {
        this.renderBossProgressEnemy(levelConfig.enemies.basic, slot, x, y, 1);
      }
      context.restore();
    }

    context.restore();
  };

  private renderBossProgressEnemy = (
    enemyConfig: EnemyConfig,
    slot: number,
    barX: number,
    barY: number,
    alpha: number
  ): void => {
    const context = this._gameArena.getContext() as CanvasRenderingContext2D;
    const sprite = this.getEnemySprite(this._context._level);
    const slotWidth =
      (bossProgressWidth - bossProgressPadding * 2) / bossProgressSlots;
    const renderHeight =
      Math.min(28, bossProgressHeight - bossProgressPadding * 2) *
      bossProgressEnemyScale;
    const frame = this.getRightFacingEnemyFrame(enemyConfig);
    const sourceHeight = this.getBossProgressSourceHeight(enemyConfig);
    const sourceX = frame.x * enemyConfig.width;
    const sourceY =
      frame.y * enemyConfig.height + (enemyConfig.height - sourceHeight) / 2;
    const renderWidth = renderHeight * (enemyConfig.width / sourceHeight);
    const posX =
      barX + bossProgressPadding + slot * slotWidth + (slotWidth - renderWidth) / 2;
    const posY = barY + (bossProgressHeight - renderHeight) / 2;

    context.save();
    context.globalAlpha *= alpha;
    context.imageSmoothingEnabled = false;
    context.drawImage(
      sprite,
      sourceX,
      sourceY,
      enemyConfig.width,
      sourceHeight,
      posX,
      posY,
      renderWidth,
      renderHeight
    );
    context.restore();
  };

  private getBossProgressSourceHeight = (enemyConfig: EnemyConfig): number => {
    if (
      enemyConfig.canRotate ||
      enemyConfig.horizontalDirectionFrames ||
      enemyConfig.animationRows
    ) {
      return Math.min(directionalEnemyVisibleHeight, enemyConfig.height);
    }

    return enemyConfig.height;
  };

  private getRightFacingEnemyFrame = (
    enemyConfig: EnemyConfig
  ): { x: number; y: number } => {
    const tick = Math.floor(performance.now() / bossProgressFrameDuration);

    if (enemyConfig.damageFrames) {
      return {
        x: 0,
        y: tick % (enemyConfig.animationRows ?? 1),
      };
    }

    if (enemyConfig.animationRows && enemyConfig.horizontalDirectionFrames) {
      return {
        x: 0,
        y: tick % enemyConfig.animationRows,
      };
    }

    if (enemyConfig.animationRows) {
      return {
        x: enemyConfig.canRotate
          ? this.getDirectionalFrameForHeading(enemyConfig, 90)
          : tick % (enemyConfig.animationFrames ?? 1),
        y: tick % enemyConfig.animationRows,
      };
    }

    if (enemyConfig.animationFrames && !enemyConfig.canRotate) {
      return {
        x: tick % enemyConfig.animationFrames,
        y: 0,
      };
    }

    if (enemyConfig.canRotate) {
      return {
        x: this.getDirectionalFrameForHeading(enemyConfig, 90),
        y: 0,
      };
    }

    return { x: 0, y: 0 };
  };

  private getDirectionalFrameForHeading = (
    enemyConfig: EnemyConfig,
    heading: number
  ): number =>
    Math.floor(
      ((heading + (enemyConfig.headingFrameOffset ?? 0) + 360) % 360) / 22.5
    );

  private getEnemySprite = (level: number): SpriteImage => {
    if (this._enemySprites[level]) {
      return this._enemySprites[level];
    }

    const sprite = new Image() as SpriteImage;
    sprite.src = levels[level].enemies.basic.sprite.src;
    this._enemySprites[level] = sprite;
    return sprite;
  };

  private renderLives = (lives: number, uiWidth: number, uiHeight: number): void => {
    if (lives >= 9) {
      const iconX = uiWidth / 2 - player.width - 10;
      const iconY = -(uiHeight / 2 - 10);

      this.renderLifeIcon(iconX, iconY);
      this._gameArena.renderText(`${lives} x`, iconX - 12, iconY + player.height / 2, {
        size: 20,
        align: "right",
        valign: "middle",
        color: palette.text.white,
      });
      return;
    }

    for (let i = 0; i < lives; ++i) {
      this.renderLifeIcon(
        uiWidth / 2 - player.width - (player.width + 10) * i - 10,
        -(uiHeight / 2 - 10)
      );
    }
  };

  private renderLifeIcon = (posX: number, posY: number): void => {
    this._gameArena.renderSprite(this._playerSprite, {
      frameWidth: this._playerSprite.frameWidth ?? player.frameWidth,
      frameHeight: this._playerSprite.frameHeight ?? player.frameHeight,
      frameX: this._playerSprite.frameX ?? 0,
      frameY: this._playerSprite.frameY ?? 0,
      renderWidth: player.width,
      renderHeight: player.height,
      posX,
      posY,
    });
  };

  restart = (): void => {
    const context = this._gameArena.getContext() as CanvasRenderingContext2D;

    context.save();
    context.scale(this._getUiScale(), this._getUiScale());
    this._gameArena.renderText(i18n.hud.restarting, 0, 0, {
      size: 30,
      align: "center",
      valign: "middle",
      color: palette.text.white,
    });
    context.restore();
  };

  private renderControlsOverlay = (): void => {
    const context = this._gameArena.getContext() as CanvasRenderingContext2D;
    const inputState =
      this._context._isDemoMode && this._context._demoControlInputState
        ? this._context._demoControlInputState
        : this._context._controlInputState;

    context.save();
    context.globalAlpha = 0.9;

    if (inputState.activeController === "gamepad") {
      this.renderGamepadOverlay(
        context,
        this._getUiWidth() / 2 - 244,
        this._getUiHeight() / 2 - 114,
        inputState
      );
    } else if (inputState.activeController === "touch") {
      this.renderTouchOverlay(
        context,
        this._getUiWidth() / 2 - 120,
        this._getUiHeight() / 2 - 124,
        inputState
      );
    } else {
      this.renderKeyboardOverlay(
        context,
        this._getUiWidth() / 2 - 190,
        this._getUiHeight() / 2 - 124,
        inputState
      );
    }

    context.restore();
  };

  private renderKeyboardOverlay = (context: CanvasRenderingContext2D, x: number, y: number, inputState: ControlInputState): void => {
    this.renderKey(context, "W", x + 44, y, 34, 28, inputState.up);
    this.renderKey(context, "A", x, y + 32, 34, 28, inputState.left);
    this.renderKey(context, "S", x + 44, y + 32, 34, 28, inputState.down);
    this.renderKey(context, "D", x + 88, y + 32, 34, 28, inputState.right);
    this.renderKey(context, "Space", x, y + 68, 122, 28, inputState.fire);
    this.renderMouseOverlay(context, x + 138, y + 10, inputState.fire);
  };

  private renderTouchOverlay = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    inputState: ControlInputState
  ): void => {
    this.renderTouchStick(context, x + 60, y + 60, inputState);
  };

  private renderMouseOverlay = (context: CanvasRenderingContext2D, x: number, y: number, isPressed: boolean): void => {
    context.globalAlpha = isPressed ? 0.92 : 0.5;
    context.fillStyle = isPressed ? palette.overlay.activeWash : "transparent";
    context.strokeStyle = isPressed ? palette.overlay.activeFill : palette.overlay.line;
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(x, y, 30, 48, 14);
    context.fill();
    context.stroke();

    context.beginPath();
    context.moveTo(x + 15, y + 5);
    context.lineTo(x + 15, y + 22);
    context.moveTo(x + 3, y + 22);
    context.lineTo(x + 27, y + 22);
    context.stroke();

    context.globalAlpha = isPressed ? 1 : 0.6;
    this._gameArena.renderText("M1", x + 15, y + 36, {
      size: 8,
      align: "center",
      valign: "middle",
      color: isPressed ? palette.overlay.activeFill : palette.overlay.line,
    });
  };

  private renderKey = (context: CanvasRenderingContext2D, label: string, x: number, y: number, width: number, height: number, isPressed: boolean): void => {
    context.globalAlpha = isPressed ? 0.92 : 0.5;
    context.fillStyle = isPressed ? palette.overlay.activeWash : "transparent";
    context.strokeStyle = isPressed ? palette.overlay.activeFill : palette.overlay.line;
    context.lineWidth = 2;
    context.fillRect(x, y, width, height);
    context.strokeRect(x, y, width, height);

    context.globalAlpha = isPressed ? 1 : 0.6;
    this._gameArena.renderText(label, x + width / 2, y + height / 2, {
      size: 12,
      align: "center",
      valign: "middle",
      color: isPressed ? palette.overlay.activeFill : palette.overlay.line,
    });
  };

  private renderGamepadOverlay = (context: CanvasRenderingContext2D, x: number, y: number, inputState: ControlInputState): void => {
    context.globalAlpha = 0.5;
    context.strokeStyle = palette.overlay.line;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x + 32, y + 20);
    context.lineTo(x + 78, y + 8);
    context.lineTo(x + 134, y + 8);
    context.lineTo(x + 180, y + 20);
    context.lineTo(x + 196, y + 64);
    context.lineTo(x + 174, y + 90);
    context.lineTo(x + 136, y + 70);
    context.lineTo(x + 76, y + 70);
    context.lineTo(x + 38, y + 90);
    context.lineTo(x + 16, y + 64);
    context.closePath();
    context.stroke();

    const menuY = y + 27;
    const faceButtonX = x + 152;
    const faceButtonY = y + 58;
    const faceButtonRadius = 6;
    const faceButtonGap = 1;
    const faceButtonOffset = faceButtonRadius * 2 + faceButtonGap;

    this.renderShoulderButton(context, "L", x + 48, y + 6, inputState.rotateLeft ?? false, -0.26);
    this.renderShoulderButton(context, "R", x + 164, y + 6, inputState.rotateRight ?? false, 0.26);
    this.renderStick(context, x + 60, y + 58, inputState);
    this.renderButton(context, "Y", faceButtonX, faceButtonY - faceButtonOffset, inputState.fire, faceButtonRadius);
    this.renderButton(context, "A", faceButtonX, faceButtonY + faceButtonOffset, inputState.fire, faceButtonRadius);
    this.renderButton(context, "X", faceButtonX - faceButtonOffset, faceButtonY, inputState.fire, faceButtonRadius);
    this.renderButton(context, "B", faceButtonX + faceButtonOffset, faceButtonY, inputState.fire, faceButtonRadius);
    this.renderButton(context, "Menu", x + 106, menuY, inputState.menu);
    this.renderOvalButton(context, "P", x + 74, menuY, inputState.pause);
    this.renderOvalButton(context, "R", x + 138, menuY, inputState.restart);
  };

  private renderStick = (context: CanvasRenderingContext2D, x: number, y: number, inputState: ControlInputState): void => {
    const isPressed =
      inputState.up || inputState.right || inputState.down || inputState.left;
    const offsetX = inputState.left ? -5 : inputState.right ? 5 : 0;
    const offsetY = inputState.up ? -5 : inputState.down ? 5 : 0;

    context.globalAlpha = 0.5;
    context.strokeStyle = palette.overlay.line;
    context.beginPath();
    context.arc(x, y, 16, 0, 2 * Math.PI);
    context.stroke();

    context.globalAlpha = isPressed ? 0.95 : 0.55;
    context.fillStyle = isPressed ? palette.overlay.activeFill : "transparent";
    context.strokeStyle = isPressed ? palette.overlay.activeFill : palette.overlay.line;
    context.beginPath();
    context.arc(x + offsetX, y + offsetY, 9, 0, 2 * Math.PI);
    context.fill();
    context.stroke();
  };

  private renderTouchStick = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    inputState: ControlInputState
  ): void => {
    const isDirectional =
      inputState.up || inputState.right || inputState.down || inputState.left;
    const isPressed = inputState.fire || isDirectional;
    const offsetX = inputState.left ? -18 : inputState.right ? 18 : 0;
    const offsetY = inputState.up ? -18 : inputState.down ? 18 : 0;

    context.globalAlpha = isPressed ? 0.24 : 0.12;
    context.fillStyle = isPressed ? palette.overlay.activeWashStrong : palette.overlay.line;
    context.beginPath();
    context.arc(x, y, 54, 0, 2 * Math.PI);
    context.fill();

    context.globalAlpha = 0.55;
    context.strokeStyle = palette.overlay.line;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(x, y, 42, 0, 2 * Math.PI);
    context.stroke();

    context.globalAlpha = 0.32;
    context.beginPath();
    context.moveTo(x - 42, y);
    context.lineTo(x + 42, y);
    context.moveTo(x, y - 42);
    context.lineTo(x, y + 42);
    context.stroke();

    if (isDirectional) {
      context.globalAlpha = 0.9;
      context.strokeStyle = palette.overlay.activeFill;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + offsetX, y + offsetY);
      context.stroke();
    }

    context.globalAlpha = isPressed ? 0.96 : 0.55;
    context.fillStyle = isPressed ? palette.overlay.activeFill : "transparent";
    context.strokeStyle = isPressed ? palette.overlay.activeFill : palette.overlay.line;
    context.beginPath();
    context.arc(x + offsetX, y + offsetY, 18, 0, 2 * Math.PI);
    context.fill();
    context.stroke();

    if (isPressed) {
      context.globalAlpha = 1;
      this._gameArena.renderText("FIRE", x + offsetX, y + offsetY, {
        size: 7,
        align: "center",
        valign: "middle",
        color: palette.menu.selectedText,
      });
    }
  };

  private renderButton = (
    context: CanvasRenderingContext2D,
    label: string,
    x: number,
    y: number,
    isPressed: boolean,
    radius = label.length > 1 ? 9 : 12
  ): void => {

    context.globalAlpha = isPressed ? 0.95 : 0.5;
    context.fillStyle = isPressed ? palette.overlay.activeWashStrong : "transparent";
    context.strokeStyle = isPressed ? palette.overlay.activeFill : palette.overlay.line;
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI);
    context.fill();
    context.stroke();

    context.globalAlpha = isPressed ? 1 : 0.65;
    this._gameArena.renderText(label, x, y, {
      size: label.length > 1 ? 7 : 10,
      align: "center",
      valign: "middle",
      color: isPressed ? palette.overlay.activeFill : palette.overlay.line,
    });
  };

  private renderOvalButton = (context: CanvasRenderingContext2D, label: string, x: number, y: number, isPressed: boolean): void => {
    const width = 28;
    const height = 8;

    context.globalAlpha = isPressed ? 0.95 : 0.5;
    context.fillStyle = isPressed ? palette.overlay.activeWashStrong : "transparent";
    context.strokeStyle = isPressed ? palette.overlay.activeFill : palette.overlay.line;
    context.beginPath();
    context.roundRect(x - width / 2, y - height / 2, width, height, height / 2);
    context.fill();
    context.stroke();

    context.globalAlpha = isPressed ? 1 : 0.65;
    this._gameArena.renderText(label, x, y, {
      size: 9,
      align: "center",
      valign: "middle",
      color: isPressed ? palette.overlay.activeFill : palette.overlay.line,
    });
  };

  private renderShoulderButton = (
    context: CanvasRenderingContext2D,
    label: string,
    x: number,
    y: number,
    isPressed: boolean,
    rotation: number
  ): void => {
    const width = 46;
    const height = 12;

    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.globalAlpha = isPressed ? 0.95 : 0.5;
    context.fillStyle = isPressed ? palette.overlay.activeWashStrong : "transparent";
    context.strokeStyle = isPressed ? palette.overlay.activeFill : palette.overlay.line;
    context.beginPath();
    context.roundRect(-width / 2, -height / 2, width, height, 4);
    context.fill();
    context.stroke();

    context.globalAlpha = isPressed ? 1 : 0.65;
    this._gameArena.renderText(label, 0, 0, {
      size: 8,
      align: "center",
      valign: "middle",
      color: isPressed ? palette.overlay.activeFill : palette.overlay.line,
    });
    context.restore();
  };

  private _getUiScale = (): number => {
    return getUiScale(this._gameArena.width, this._gameArena.height);
  };

  private _getUiWidth = (): number => {
    return this._gameArena.width / this._getUiScale();
  };

  private _getUiHeight = (): number => {
    return this._gameArena.height / this._getUiScale();
  };
}

export default Hud;
