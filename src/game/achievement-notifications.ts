import { AchievementNotificationRenderer } from "arcade-engine";
import palette from "./palette";
import { getUiScale } from "./ui-scale";
import {
  achievementNotificationHeight,
  achievementNotificationIconSize,
  achievementNotificationWidth,
} from "./achievement-layout";
import type { AchievementDefinition, AchievementStatus } from "./achievements";
import type { GameArenaInstance } from "./types";

const popupCreditsLineBottomOffset = 21;
const popupCreditsGap = 16;

/**
 * Renders queued achievement unlock popups over the game canvas.
 */
class AchievementNotifications {
  private readonly arena: GameArenaInstance;
  private readonly iconSprites: Partial<Record<string, HTMLImageElement>> = {};
  private readonly renderer: AchievementNotificationRenderer;
  private readonly handleAchievementUnlocked = (event: Event): void => {
    const achievement = (event as CustomEvent<AchievementDefinition | undefined>)
      .detail;

    if (!achievement) {
      return;
    }

    const sprite = this.getIconSprite(achievement);

    this.renderer.enqueue({
      description: achievement.description,
      icon: {
        frameHeight: achievement.icon.frameHeight,
        frameWidth: achievement.icon.frameWidth,
        frameX: achievement.icon.unlockedFrameX * achievement.icon.frameWidth,
        frameY: 0,
        image: sprite,
      },
      name: achievement.name,
    });
  };

  constructor(arena: GameArenaInstance) {
    this.arena = arena;
    this.renderer = new AchievementNotificationRenderer({
      context: arena.getContext() as CanvasRenderingContext2D,
      getViewport: () => ({
        height: this.arena.height / 2,
        width: this.arena.width / 2,
      }),
      layout: {
        bottomOffset: popupCreditsLineBottomOffset + popupCreditsGap,
        height: achievementNotificationHeight,
        iconSize: achievementNotificationIconSize,
        width: achievementNotificationWidth,
      },
      scale: () => getUiScale(this.arena.width, this.arena.height),
      theme: {
        background: palette.menu.itemBackground,
        border: palette.menu.selectedBorder,
        descriptionText: palette.menu.itemText,
        iconBackground: palette.menu.progressFill,
        iconBorder: palette.menu.selectedBorder,
        titleText: palette.menu.selectedBackground,
      },
    });

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
    this.renderer.destroy();
  };

  render = (): void => {
    this.renderer.render();
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
}

export default AchievementNotifications;
