import { useCallback, useEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import Menus from "../game/menus";
import palette from "../game/palette";
import { CanvasDemo } from "./canvas-demo";
import { createCanvasArena } from "./menu-arena";
import "./storybook.css";

type MenuScreenDemo = "start" | "options" | "debug" | "paused" | "level" | "zoom";
type TransitionInspectableMenu = {
  _transition: null;
};

const renderMenuFrame = (
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  menu: Menus
): void => {
  context.fillStyle = palette.level.sky1910;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.translate(canvas.width / 2, canvas.height / 2);
  menu.render();
  context.restore();
};

const prepareMenu = (menu: Menus, screen: MenuScreenDemo): void => {
  menu.showStart(screen === "paused" ? { startLabel: "Continue" } : undefined);

  if (screen === "options") {
    menu.next();
    menu.activate();
    return;
  }

  if (screen === "zoom") {
    menu.next();
    menu.activate();
    for (let i = 0; i < 4; i++) {
      menu.next();
    }
    return;
  }

  if (screen === "debug" || screen === "level") {
    [38, 38, 40, 40, 37, 39, 37, 39, 66, 65].forEach((keyCode) => {
      menu.captureKey(keyCode);
    });
    menu.next();
    menu.next();
    menu.activate();

    if (screen === "level") {
      for (let i = 0; i < 4; i++) {
        menu.next();
      }
      menu.activate();
    }
  }
};

const settleMenuTransition = (menu: Menus): void => {
  (menu as unknown as TransitionInspectableMenu)._transition = null;
};

const drawMenu = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, screen: MenuScreenDemo): void => {
  const arena = createCanvasArena(canvas, context);
  const menu = new Menus(arena, { start: () => {} });
  prepareMenu(menu, screen);
  settleMenuTransition(menu);

  renderMenuFrame(context, canvas, menu);
};

const MenuLiveDemo = ({
  height = 520,
  screen,
  width = 760,
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
    const menu = new Menus(arena, {
      clearLevelPreview: () => {},
      previewLevel: () => {},
      selectLevel: () => {},
      start: () => {},
    });
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
    const menu = new Menus(arena, { start: () => {} });
    let isOpen = false;
    let lastToggleAt = performance.now() - 900;
    let animationFrame = 0;

    menu.showStart();

    const toggleMenu = (): void => {
      if (isOpen) {
        menu.previous();
        menu.activate();
      } else {
        menu.next();
        menu.activate();
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
      height={520}
      ref={canvasRef}
      width={560}
    />
  );
};

const MenuRenderingDemo = () => {
  const drawStart = useCallback(
    (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      drawMenu(context, canvas, "start");
    },
    []
  );
  const drawOptions = useCallback(
    (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      drawMenu(context, canvas, "options");
    },
    []
  );
  const drawDebug = useCallback(
    (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      drawMenu(context, canvas, "debug");
    },
    []
  );

  return (
    <main className={"storybook-surface"}>
      <section className={"storybook-section"}>
        <p className={"storybook-eyebrow"}>Game UI</p>
        <h1 className={"storybook-title"}>Menu Rendering</h1>
        <div className={"storybook-demo-grid"}>
          <article className={"storybook-card"}>
            <h2>Main Menu</h2>
            <CanvasDemo draw={drawStart} height={420} width={560} />
          </article>
          <article className={"storybook-card"}>
            <h2>Paused Root Menu</h2>
            <MenuLiveDemo height={420} screen={"paused"} width={560} />
          </article>
          <article className={"storybook-card"}>
            <h2>Options Menu</h2>
            <CanvasDemo draw={drawOptions} height={520} width={560} />
          </article>
          <article className={"storybook-card"}>
            <h2>Game Zoom Preview</h2>
            <MenuLiveDemo height={520} screen={"zoom"} width={760} />
          </article>
          <article className={"storybook-card"}>
            <h2>Debug Menu</h2>
            <CanvasDemo draw={drawDebug} height={460} width={560} />
          </article>
          <article className={"storybook-card"}>
            <h2>Level Select Showcase</h2>
            <MenuLiveDemo height={520} screen={"level"} width={900} />
          </article>
          <article className={"storybook-card"}>
            <h2>Submenu Transition</h2>
            <MenuTransitionDemo />
          </article>
        </div>
      </section>
    </main>
  );
};

const meta = {
  title: "Game/Menu Rendering",
  component: MenuRenderingDemo,
  parameters: {
    docs: {
      description: {
        component:
          "Canvas snapshots rendered through the production menu system after transition settling, plus a live submenu transition loop.",
      },
    },
  },
} satisfies Meta<typeof MenuRenderingDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Examples: Story = {};
