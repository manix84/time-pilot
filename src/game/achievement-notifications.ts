import palette from "./palette";
import { getUiScale } from "./ui-scale";
import type { AchievementDefinition, AchievementStatus } from "./achievements";
import type { GameArenaInstance } from "./types";

type AchievementNotification = {
  achievement: AchievementDefinition;
  startedAt: number;
};

const popupWidth = 300;
const popupHeight = 64;
const popupMargin = 10;
const popupBottomOffset = 54;
const popupSlideDistance = 28;
const popupSlideMs = 260;
const popupHoldMs = 2600;
const popupExitMs = 220;
const popupIconSize = 48;

class AchievementNotifications {
  private readonly arena: GameArenaInstance;
  private readonly iconSprites: Partial<Record<string, HTMLImageElement>> = {};
  private readonly notifications: AchievementNotification[] = [];
  private readonly handleAchievementUnlocked = (event: Event): void => {
    const achievement = (event as CustomEvent<AchievementDefinition | undefined>)
      .detail;

    if (!achievement) {
      return;
    }

    this.notifications.push({
      achievement,
      startedAt: performance.now(),
    });
  };

  constructor(arena: GameArenaInstance) {
    this.arena = arena;
    window.addEventListener(
      "timePilot:achievementUnlocked",
      this.handleAchievementUnlocked
    );
  }

  destroy = (): void => {
    window.removeEventListener(
      "timePilot:achievementUnlocked",
      this.handleAchievementUnlocked
    );
  };

  render = (): void => {
    const notification = this.notifications[0];

    if (!notification) {
      return;
    }

    const elapsed = performance.now() - notification.startedAt;
    const totalDuration = popupSlideMs + popupHoldMs + popupExitMs;

    if (elapsed >= totalDuration) {
      this.notifications.shift();
      this.render();
      return;
    }

    const context = this.arena.getContext() as CanvasRenderingContext2D;
    const uiScale = getUiScale(this.arena.width, this.arena.height);
    const uiWidth = this.arena.width / uiScale;
    const uiHeight = this.arena.height / uiScale;
    const progress = this.getAnimationProgress(elapsed);
    const eased = this.easeOutCubic(progress);
    const hiddenX = uiWidth / 2 + popupMargin;
    const visibleX = uiWidth / 2 - popupMargin - popupWidth;
    const x = hiddenX - (popupWidth + popupSlideDistance) * eased;
    const y = uiHeight / 2 - popupBottomOffset - popupHeight;

    context.save();
    context.scale(uiScale, uiScale);
    context.globalAlpha *= this.getOpacity(elapsed);
    this.renderPopup(context, notification.achievement, x, y);
    context.restore();
  };

  private renderPopup = (
    context: CanvasRenderingContext2D,
    achievement: AchievementDefinition,
    x: number,
    y: number
  ): void => {
    const iconX = x + 8;
    const iconY = y + (popupHeight - popupIconSize) / 2;
    const textX = iconX + popupIconSize + 10;
    const textWidth = popupWidth - (textX - x) - 10;

    context.fillStyle = palette.menu.itemBackground;
    context.fillRect(x, y, popupWidth, popupHeight);
    context.strokeStyle = palette.menu.selectedBorder;
    context.lineWidth = 2;
    context.strokeRect(x, y, popupWidth, popupHeight);

    this.renderIcon(context, achievement, iconX, iconY);

    this.arena.renderText(achievement.name, textX, y + 10, {
      size: 11,
      align: "left",
      valign: "top",
      color: palette.menu.selectedBackground,
    });

    this.wrapText(achievement.description, Math.max(20, Math.floor(textWidth / 6)))
      .slice(0, 2)
      .forEach((line, index) => {
        this.arena.renderText(line, textX, y + 30 + index * 12, {
          size: 8,
          align: "left",
          valign: "top",
          color: palette.menu.itemText,
        });
      });
  };

  private renderIcon = (
    context: CanvasRenderingContext2D,
    achievement: AchievementDefinition,
    x: number,
    y: number
  ): void => {
    const icon = achievement.icon;
    const sprite = this.getIconSprite(achievement);

    context.imageSmoothingEnabled = false;

    if (!sprite.complete || sprite.naturalWidth <= 0 || sprite.naturalHeight <= 0) {
      this.renderIconPlaceholder(context, x, y);
      return;
    }

    try {
      context.drawImage(
        sprite,
        icon.unlockedFrameX * icon.frameWidth,
        0,
        icon.frameWidth,
        icon.frameHeight,
        x,
        y,
        popupIconSize,
        popupIconSize
      );
    } catch {
      this.renderIconPlaceholder(context, x, y);
    }
  };

  private renderIconPlaceholder = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number
  ): void => {
    const centerX = x + popupIconSize / 2;
    const centerY = y + popupIconSize / 2;

    context.fillStyle = palette.menu.progressFill;
    context.fillRect(x, y, popupIconSize, popupIconSize);
    context.strokeStyle = palette.menu.selectedBorder;
    context.lineWidth = 2;
    context.strokeRect(x, y, popupIconSize, popupIconSize);
    context.beginPath();
    context.arc(centerX, centerY, popupIconSize / 2 - 5, 0, Math.PI * 2);
    context.stroke();
  };

  private getIconSprite = (
    achievement: Pick<AchievementStatus, "icon">
  ): HTMLImageElement => {
    const cachedSprite = this.iconSprites[achievement.icon.src];

    if (cachedSprite) {
      return cachedSprite;
    }

    const sprite = new Image();
    sprite.src = achievement.icon.src;
    this.iconSprites[achievement.icon.src] = sprite;

    return sprite;
  };

  private getAnimationProgress = (elapsed: number): number => {
    if (elapsed < popupSlideMs) {
      return elapsed / popupSlideMs;
    }

    if (elapsed < popupSlideMs + popupHoldMs) {
      return 1;
    }

    return 1 - (elapsed - popupSlideMs - popupHoldMs) / popupExitMs;
  };

  private getOpacity = (elapsed: number): number => {
    if (elapsed < popupSlideMs) {
      return Math.max(0.3, elapsed / popupSlideMs);
    }

    if (elapsed < popupSlideMs + popupHoldMs) {
      return 1;
    }

    return Math.max(0, 1 - (elapsed - popupSlideMs - popupHoldMs) / popupExitMs);
  };

  private easeOutCubic = (progress: number): number => {
    const clamped = Math.max(0, Math.min(1, progress));

    return 1 - Math.pow(1 - clamped, 3);
  };

  private wrapText = (text: string, maxLength: number): string[] => {
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";

    words.forEach((word) => {
      const nextLine = line ? `${line} ${word}` : word;

      if (nextLine.length > maxLength && line) {
        lines.push(line);
        line = word;
        return;
      }

      line = nextLine;
    });

    if (line) {
      lines.push(line);
    }

    return lines;
  };
}

export default AchievementNotifications;
