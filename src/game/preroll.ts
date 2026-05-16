import { assetPath } from "./asset-path";
import i18n from "./i18n";
import palette from "./palette";
import { player } from "./constants";
import { getUiScale } from "./ui-scale";
import type { GameArenaInstance } from "./types";

type PrerollOptions = {
  onComplete: () => void;
  onSettleStart: () => void;
  playBulletSound: () => void;
};

const authorLogoFadeMs = 800;
const authorLogoHoldMs = 1500;
const authorLogoViewportRatio = 0.5;
const logoFadeMs = 800;
const shipFlyDurationMs = 1500;
const postFlyoutHoldMs = 1000;
const logoSettleMs = 700;
const doubleShotDelayMs = 120;
const menuDesignWidth = 660;
const menuDesignHeight = 500;
const menuEdgePadding = 24;
const menuLogoY = -126;
const menuLogoScale = 2;
const logoSourceWidth = 420;
const logoSourceHeight = 96;
const logoPerspectiveHeight = 86;
const logoPerspectiveBottomWidth = 390;
const timePilotStartMs = authorLogoFadeMs + authorLogoHoldMs + authorLogoFadeMs;

/**
 * Startup preroll animation shown before the root menu.
 */
class Preroll {
  private readonly arena: GameArenaInstance;
  private readonly authorLogo = new Image();
  private readonly onComplete: () => void;
  private readonly onSettleStart: () => void;
  private readonly playBulletSound: () => void;
  private readonly playerSprite = new Image();
  private logoCanvas?: HTMLCanvasElement;
  private startedAt = 0;
  private playedFirstShot = false;
  private playedSecondShot = false;
  private startedSettle = false;
  private completed = false;

  constructor(arena: GameArenaInstance, options: PrerollOptions) {
    this.arena = arena;
    this.onComplete = options.onComplete;
    this.onSettleStart = options.onSettleStart;
    this.playBulletSound = options.playBulletSound;
    this.authorLogo.src = assetPath("logos/author.png");
    this.playerSprite.src = player.sprite.src;
    this.restart();
  }

  restart = (): void => {
    this.startedAt = performance.now();
    this.playedFirstShot = false;
    this.playedSecondShot = false;
    this.startedSettle = false;
    this.completed = false;
  };

  skip = (): void => {
    if (this.completed) {
      return;
    }

    this.completed = true;
    this.onComplete();
  };

  isSettling = (): boolean => this.getTimePilotElapsed() >= this.getSettleStartMs();

  render = (): void => {
    if (this.completed) {
      return;
    }

    const elapsed = this.getElapsed();
    const timePilotElapsed = this.getTimePilotElapsed();
    const flyEndMs = this.getFlyEndMs();
    const settleStartMs = this.getSettleStartMs();
    const settleProgress = Math.max(
      0,
      Math.min(1, (timePilotElapsed - settleStartMs) / logoSettleMs)
    );
    const isSettling = timePilotElapsed >= settleStartMs;

    if (isSettling && !this.startedSettle) {
      this.startedSettle = true;
      this.onSettleStart();
    }

    if (settleProgress >= 1) {
      this.completed = true;
      this.onComplete();
      return;
    }

    const context = this.arena.getContext() as CanvasRenderingContext2D;

    context.save();
    this.renderBlackOverlay(context, isSettling ? 1 - settleProgress : 1);

    if (elapsed < timePilotStartMs) {
      this.renderAuthorLogo(context, elapsed);
      context.restore();
      return;
    }

    this.renderLogo(context, timePilotElapsed, settleProgress);

    if (timePilotElapsed >= logoFadeMs && timePilotElapsed <= flyEndMs) {
      this.renderShip(context, timePilotElapsed - logoFadeMs);
    }

    this.playShotCues(timePilotElapsed);
    context.restore();
  };

  private renderBlackOverlay = (
    context: CanvasRenderingContext2D,
    opacity: number
  ): void => {
    context.save();
    context.globalAlpha *= Math.max(0, Math.min(1, opacity));
    context.fillStyle = "#000";
    context.fillRect(
      -(this.arena.width / 2),
      -(this.arena.height / 2),
      this.arena.width,
      this.arena.height
    );
    context.restore();
  };

  private renderAuthorLogo = (
    context: CanvasRenderingContext2D,
    elapsed: number
  ): void => {
    const fadeOutStartMs = authorLogoFadeMs + authorLogoHoldMs;
    const alpha =
      elapsed < authorLogoFadeMs
        ? elapsed / authorLogoFadeMs
        : elapsed >= fadeOutStartMs
          ? 1 - (elapsed - fadeOutStartMs) / authorLogoFadeMs
          : 1;
    const size =
      Math.min(this.arena.width, this.arena.height) * authorLogoViewportRatio;

    context.save();
    context.globalAlpha *= Math.max(0, Math.min(1, alpha));
    context.drawImage(
      this.authorLogo,
      -size / 2,
      -size / 2,
      size,
      size
    );
    context.restore();
  };

  private renderLogo = (
    context: CanvasRenderingContext2D,
    elapsed: number,
    settleProgress: number
  ): void => {
    const fadeProgress = Math.max(0, Math.min(1, elapsed / logoFadeMs));
    const easedSettle = this.easeInOutCubic(settleProgress);
    const initialScale = this.getInitialLogoScale();
    const menuScale = this.getMenuScale();
    const scale = this.lerp(initialScale, menuLogoScale * menuScale, easedSettle);
    const y = this.lerp(0, menuLogoY * menuScale, easedSettle);

    context.save();
    context.globalAlpha *= fadeProgress;
    context.translate(0, y);
    context.scale(scale, scale);
    this.drawPerspectiveLogo(context, this.getLogoCanvas());
    context.restore();
  };

  private renderShip = (
    context: CanvasRenderingContext2D,
    flyElapsedMs: number
  ): void => {
    const progress = Math.max(0, Math.min(1, flyElapsedMs / shipFlyDurationMs));
    const shipRenderSize = this.getFlybyShipRenderSize();
    const startX = -this.arena.width / 2 - shipRenderSize / 2;
    const endX = this.arena.width / 2 + shipRenderSize / 2;
    const x = this.lerp(startX, endX, progress);
    const frame = 0;
    const sourceX = player.spriteFrameAxis === "y" ? 0 : frame * player.frameWidth;
    const sourceY = player.spriteFrameAxis === "y" ? frame * player.frameHeight : 0;

    context.imageSmoothingEnabled = false;
    context.drawImage(
      this.playerSprite,
      sourceX,
      sourceY,
      player.frameWidth,
      player.frameHeight,
      x - shipRenderSize / 2,
      -shipRenderSize / 2,
      shipRenderSize,
      shipRenderSize
    );
  };

  private playShotCues = (elapsed: number): void => {
    const centerMs = logoFadeMs + shipFlyDurationMs / 2;

    if (elapsed >= centerMs && !this.playedFirstShot) {
      this.playedFirstShot = true;
      this.playBulletSound();
    }

    if (elapsed >= centerMs + doubleShotDelayMs && !this.playedSecondShot) {
      this.playedSecondShot = true;
      this.playBulletSound();
    }
  };

  private getInitialLogoScale = (): number =>
    Math.min(
      (this.arena.width * 0.8) / logoPerspectiveBottomWidth,
      (this.arena.height * 0.9) / logoPerspectiveHeight
    );

  private getFlybyShipRenderSize = (): number =>
    (logoPerspectiveHeight * this.getInitialLogoScale()) / 2;

  private getMenuScale = (): number => {
    const availableWidth = Math.max(1, this.arena.width - menuEdgePadding * 2);
    const availableHeight = Math.max(1, this.arena.height - menuEdgePadding * 2);

    return (
      Math.min(
        1,
        availableWidth / menuDesignWidth,
        availableHeight / menuDesignHeight
      ) * getUiScale(this.arena.width, this.arena.height)
    );
  };

  private getElapsed = (): number => performance.now() - this.startedAt;

  private getTimePilotElapsed = (): number => this.getElapsed() - timePilotStartMs;

  private getFlyEndMs = (): number => logoFadeMs + shipFlyDurationMs;

  private getSettleStartMs = (): number =>
    this.getFlyEndMs() + postFlyoutHoldMs;

  private getLogoCanvas = (): HTMLCanvasElement => {
    if (this.logoCanvas) {
      return this.logoCanvas;
    }

    const logoCanvas = document.createElement("canvas");
    logoCanvas.width = logoSourceWidth;
    logoCanvas.height = logoSourceHeight;

    const context = logoCanvas.getContext("2d");
    if (context) {
      this.drawLogoText(context, logoSourceWidth, logoSourceHeight);
    }

    this.logoCanvas = logoCanvas;
    return logoCanvas;
  };

  private drawLogoText = (
    context: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void => {
    const textX = width / 2;
    const textY = height / 2 + 3;
    const fontSize = Math.min(52, Math.floor(520 / i18n.title.length));

    context.font = `900 ${fontSize}px 'Bookman Old Style', Georgia, serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";

    [
      { x: 9, y: 9, color: palette.title.shadowDeep },
      { x: 7, y: 7, color: palette.title.shadowDark },
      { x: 5, y: 5, color: palette.title.shadowMid },
      { x: 3, y: 3, color: palette.title.shadowOrange },
      { x: 2, y: 2, color: palette.title.shadowLight },
      { x: 1, y: 1, color: palette.title.shadowGold },
    ].forEach((layer) => {
      context.fillStyle = layer.color;
      context.fillText(i18n.title, textX + layer.x, textY + layer.y);
    });

    context.fillStyle = palette.title.face;
    context.fillText(i18n.title, textX, textY);
  };

  private drawPerspectiveLogo = (
    context: CanvasRenderingContext2D,
    logoCanvas: HTMLCanvasElement
  ): void => {
    const topWidth = 260;
    const sliceHeight = 2;

    for (let sourceY = 0; sourceY < logoSourceHeight; sourceY += sliceHeight) {
      const progress = sourceY / (logoSourceHeight - sliceHeight);
      const targetWidth =
        topWidth + (logoPerspectiveBottomWidth - topWidth) * progress;
      const targetY =
        -logoPerspectiveHeight / 2 +
        (sourceY / logoSourceHeight) * logoPerspectiveHeight;
      const targetSliceHeight = Math.ceil(
        (sliceHeight / logoSourceHeight) * logoPerspectiveHeight
      );

      context.drawImage(
        logoCanvas,
        0,
        sourceY,
        logoSourceWidth,
        sliceHeight,
        -targetWidth / 2,
        targetY,
        targetWidth,
        targetSliceHeight
      );
    }
  };

  private easeInOutCubic = (progress: number): number =>
    progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

  private lerp = (from: number, to: number, progress: number): number =>
    from + (to - from) * progress;
}

export default Preroll;
