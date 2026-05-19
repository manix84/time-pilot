import { useCallback, useEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import AchievementNotifications from "../game/achievement-notifications";
import {
  achievementDefinitions,
  type AchievementStatus,
} from "../game/achievements";
import Menus from "../game/menus";
import palette from "../game/palette";
import { CanvasDemo } from "./canvas-demo";
import { createCanvasArena } from "./menu-arena";
import "./storybook.css";

type TransitionInspectableMenu = {
  _transition: null;
};

const achievementsPageCanvasWidth = 1100;
const achievementsPageCanvasHeight = 760;
const achievementPopupCanvasWidth = 1000;
const achievementPopupCanvasHeight = 560;

const getAchievementStatuses = (): AchievementStatus[] =>
  achievementDefinitions.map((achievement, index) => ({
    ...achievement,
    progress:
      achievement.id === "quarter-master"
        ? {
          current: 9,
          goal: achievement.progressGoal ?? 25,
        }
        : undefined,
    unlocked: index % 4 === 0 || achievement.id === "last-chance",
    unlockedAt:
      index % 4 === 0 || achievement.id === "last-chance"
        ? Date.UTC(2026, 4, 19, 10 + (index % 8), index * 3)
        : undefined,
  }));

const renderAchievementsPage = (
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
): void => {
  const arena = createCanvasArena(canvas, context);
  const menu = new Menus(arena, {
    getAchievements: getAchievementStatuses,
    start: () => {},
  });

  menu.showStart();
  menu.next();
  menu.next();
  menu.activate();
  (menu as unknown as TransitionInspectableMenu)._transition = null;

  context.fillStyle = palette.level.sky1910;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.translate(canvas.width / 2, canvas.height / 2);
  menu.render();
  context.restore();
};

const AchievementPopupDemo = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    const arena = createCanvasArena(canvas, context);
    const notifications = new AchievementNotifications(arena);
    const achievement =
      achievementDefinitions.find((definition) => definition.id === "last-chance") ??
      achievementDefinitions[0];
    let animationFrame = 0;
    let lastUnlockAt = 0;

    const dispatchUnlock = (): void => {
      window.dispatchEvent(
        new CustomEvent("timePilot:achievementUnlocked", {
          detail: achievement,
        })
      );
      lastUnlockAt = performance.now();
    };

    dispatchUnlock();

    const animate = (): void => {
      const now = performance.now();

      if (now - lastUnlockAt > 3200) {
        dispatchUnlock();
      }

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = palette.level.sky1910;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.save();
      context.translate(canvas.width / 2, canvas.height / 2);
      arena.renderText("Credits 03", canvas.width / 2 - 6, canvas.height / 2 - 21, {
        size: 14,
        align: "right",
        valign: "middle",
      });
      notifications.render();
      context.restore();

      animationFrame = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      notifications.destroy();
    };
  }, []);

  return (
    <canvas
      className={"storybook-canvas"}
      height={achievementPopupCanvasHeight}
      ref={canvasRef}
      width={achievementPopupCanvasWidth}
    />
  );
};

const AchievementsDemo = () => {
  const drawAchievements = useCallback(
    (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      renderAchievementsPage(context, canvas);
    },
    []
  );

  return (
    <main className={"storybook-surface"}>
      <section className={"storybook-section storybook-achievements-section"}>
        <p className={"storybook-eyebrow"}>Game UI</p>
        <h1 className={"storybook-title"}>Achievements</h1>
        <div className={"storybook-demo-grid storybook-achievements-grid"}>
          <article className={"storybook-card"}>
            <h2>Achievement Page</h2>
            <CanvasDemo
              draw={drawAchievements}
              height={achievementsPageCanvasHeight}
              width={achievementsPageCanvasWidth}
            />
          </article>
          <article className={"storybook-card"}>
            <h2>Unlock Popup</h2>
            <AchievementPopupDemo />
          </article>
        </div>
      </section>
    </main>
  );
};

const meta = {
  title: "Game/Achievements",
  component: AchievementsDemo,
  parameters: {
    docs: {
      description: {
        component:
          "Production-rendered achievement menu and unlock popup examples using representative achievement state.",
      },
    },
  },
} satisfies Meta<typeof AchievementsDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Examples: Story = {};
