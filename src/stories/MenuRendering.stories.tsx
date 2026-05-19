import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import Menus from "../game/menus";
import palette from "../game/palette";
import type { HighScoreEntry, MenuSystemCommands } from "../game/types";
import { createCanvasArena } from "./menu-arena";
import "./storybook.css";

type MenuScreenDemo =
  | "start"
  | "paused"
  | "options"
  | "zoom"
  | "debug"
  | "level"
  | "high-scores"
  | "high-score-entry";
type TransitionInspectableMenu = {
  _transition: null;
};

const menuStoryCanvasWidth = 800;
const menuStoryCanvasHeight = 600;
const menuStoryRenderScale = 1;
const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];

const storyHighScores: HighScoreEntry[] = [
  {
    createdAt: Date.UTC(2026, 4, 16),
    id: "local-ace",
    name: "Local Ace",
    score: 234560,
    stats: ["Era: 1982", "Lives left: 1", "Continues: 0", "Boss progress: 51/56"],
  },
  {
    createdAt: Date.UTC(2026, 4, 17),
    id: "shooty-mcshootface",
    name: "Shooty McShootface",
    score: 1000000,
    stats: ["Era: 2001", "Bosses: 5", "Continues: 0", "Accuracy: suspicious"],
  },
  {
    createdAt: Date.UTC(2026, 4, 18),
    id: "debug-dave",
    name: "Debug Dave",
    score: 123456,
    stats: ["Era: 1910", "Hitboxes blamed: yes", "Restart count: private"],
  },
];

const createMenuCommands = (): MenuSystemCommands => ({
  clearLevelPreview: () => {},
  getHighScores: () => storyHighScores,
  getPendingHighScore: () => ({
    score: 345670,
    stats: ["Era: 1970", "Lives left: 0", "Continues: 1", "Boss progress: 44/56"],
  }),
  previewLevel: () => {},
  saveHighScore: () => {},
  selectLevel: () => {},
  start: () => {},
});

const renderMenuFrame = (
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  menu: Menus
): void => {
  context.fillStyle = palette.level.sky1910;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.translate(canvas.width / 2, canvas.height / 2);
  context.scale(menuStoryRenderScale, menuStoryRenderScale);
  menu.render();
  context.restore();
};

const unlockDebugMenu = (menu: Menus): void => {
  konamiCode.forEach((keyCode) => {
    menu.captureKey(keyCode);
  });
};

const selectRootItem = (menu: Menus, itemOffset: number): void => {
  for (let i = 0; i < itemOffset; i++) {
    menu.next();
  }

  menu.activate();
};

const prepareMenu = (menu: Menus, screen: MenuScreenDemo): void => {
  if (screen === "high-score-entry") {
    menu.showGameOver();
    return;
  }

  menu.showStart(screen === "paused" ? { startLabel: "Continue" } : undefined);

  if (screen === "options" || screen === "zoom") {
    selectRootItem(menu, 1);

    if (screen === "zoom") {
      for (let i = 0; i < 4; i++) {
        menu.next();
      }
    }
    return;
  }

  if (screen === "high-scores") {
    selectRootItem(menu, 3);
    return;
  }

  if (screen === "debug" || screen === "level") {
    unlockDebugMenu(menu);
    selectRootItem(menu, 4);

    if (screen === "level") {
      for (let i = 0; i < 8; i++) {
        menu.next();
      }
      menu.activate();
    }
  }
};

const settleMenuTransition = (menu: Menus): void => {
  (menu as unknown as TransitionInspectableMenu)._transition = null;
};

const MenuLiveDemo = ({
  height = menuStoryCanvasHeight,
  screen,
  width = menuStoryCanvasWidth,
}: {
  height?: number;
  screen: MenuScreenDemo;
  width?: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    const arena = createCanvasArena(canvas, context);
    const menu = new Menus(arena, createMenuCommands());
    let animationFrame = 0;

    prepareMenu(menu, screen);
    settleMenuTransition(menu);

    const animate = (): void => {
      renderMenuFrame(context, canvas, menu);
      animationFrame = window.requestAnimationFrame(animate);
    };

    animate();

    return () => window.cancelAnimationFrame(animationFrame);
  }, [screen]);

  return (
    <canvas
      className={"storybook-canvas"}
      height={height}
      ref={canvasRef}
      width={width}
    />
  );
};

const MenuTransitionDemo = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    const arena = createCanvasArena(canvas, context);
    const menu = new Menus(arena, createMenuCommands());
    let isOpen = false;
    let lastToggleAt = performance.now() - 900;
    let animationFrame = 0;

    menu.showStart();

    const toggleMenu = (): void => {
      if (isOpen) {
        menu.previous();
        menu.activate();
      } else {
        selectRootItem(menu, 1);
      }

      isOpen = !isOpen;
    };

    const animate = (): void => {
      const now = performance.now();

      if (now - lastToggleAt > 1700) {
        toggleMenu();
        lastToggleAt = now;
      }

      renderMenuFrame(context, canvas, menu);
      animationFrame = window.requestAnimationFrame(animate);
    };

    animate();

    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <canvas
      className={"storybook-canvas"}
      height={menuStoryCanvasHeight}
      ref={canvasRef}
      width={menuStoryCanvasWidth}
    />
  );
};

const MenuStoryFrame = ({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) => (
  <main className={"storybook-surface"}>
    <section className={"storybook-section storybook-menu-section"}>
      <p className={"storybook-eyebrow"}>Game UI</p>
      <h1 className={"storybook-title"}>{label}</h1>
      <div className={"storybook-demo-grid storybook-menu-grid"}>
        <article className={"storybook-card storybook-wide-card"}>
          <h2>{label}</h2>
          {children}
        </article>
      </div>
    </section>
  </main>
);

const MenuScreenStory = ({ screen, title }: { screen: MenuScreenDemo; title: string }) => (
  <MenuStoryFrame label={title}>
    <MenuLiveDemo screen={screen} />
  </MenuStoryFrame>
);

const meta = {
  title: "Game/Menu Rendering",
  component: MenuScreenStory,
  parameters: {
    docs: {
      description: {
        component:
          "Canvas snapshots rendered through the production menu system, split by menu section.",
      },
    },
  },
} satisfies Meta<typeof MenuScreenStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RootMenu: Story = {
  args: { screen: "start", title: "Root Menu" },
  render: () => <MenuScreenStory screen={"start"} title={"Root Menu"} />,
};

export const PausedRootMenu: Story = {
  args: { screen: "paused", title: "Paused Root Menu" },
  render: () => <MenuScreenStory screen={"paused"} title={"Paused Root Menu"} />,
};

export const Options: Story = {
  args: { screen: "options", title: "Options Menu" },
  render: () => <MenuScreenStory screen={"options"} title={"Options Menu"} />,
};

export const GameZoomPreview: Story = {
  args: { screen: "zoom", title: "Game Zoom Preview" },
  render: () => <MenuScreenStory screen={"zoom"} title={"Game Zoom Preview"} />,
};

export const Debug: Story = {
  args: { screen: "debug", title: "Debug Menu" },
  render: () => <MenuScreenStory screen={"debug"} title={"Debug Menu"} />,
};

export const LevelSelect: Story = {
  args: { screen: "level", title: "Level Select Showcase" },
  render: () => <MenuScreenStory screen={"level"} title={"Level Select Showcase"} />,
};

export const HighScores: Story = {
  args: { screen: "high-scores", title: "High Scores" },
  render: () => <MenuScreenStory screen={"high-scores"} title={"High Scores"} />,
};

export const SaveScoreNameEntry: Story = {
  args: { screen: "high-score-entry", title: "Save Score Name Entry" },
  render: () => <MenuScreenStory screen={"high-score-entry"} title={"Save Score Name Entry"} />,
};

export const SubmenuTransition: Story = {
  args: { screen: "start", title: "Submenu Transition" },
  render: () => (
    <MenuStoryFrame label={"Submenu Transition"}>
      <MenuTransitionDemo />
    </MenuStoryFrame>
  ),
};
