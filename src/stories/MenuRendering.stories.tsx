import { useCallback } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import Menus from "../game/menus";
import palette from "../game/palette";
import { CanvasDemo } from "./canvas-demo";
import { createCanvasArena } from "./menu-arena";
import "./storybook.css";

type MenuScreenDemo = "start" | "options" | "debug";

const prepareMenu = (menu: Menus, screen: MenuScreenDemo): void => {
  menu.showStart();

  if (screen === "options") {
    menu.next();
    menu.activate();
    return;
  }

  if (screen === "debug") {
    [38, 38, 40, 40, 37, 39, 37, 39, 66, 65].forEach((keyCode) => {
      menu.captureKey(keyCode);
    });
    menu.next();
    menu.next();
    menu.activate();
  }
};

const drawMenu = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, screen: MenuScreenDemo): void => {
  context.fillStyle = palette.level.sky1910;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const arena = createCanvasArena(canvas, context);
  const menu = new Menus(arena, { start: () => {} });
  prepareMenu(menu, screen);

  context.save();
  context.translate(canvas.width / 2, canvas.height / 2);
  menu.render();
  context.restore();
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
            <h2>Options Menu</h2>
            <CanvasDemo draw={drawOptions} height={520} width={560} />
          </article>
          <article className={"storybook-card"}>
            <h2>Debug Menu</h2>
            <CanvasDemo draw={drawDebug} height={460} width={560} />
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
          "Canvas snapshots rendered through the production menu system, including the Konami-unlocked debug branch.",
      },
    },
  },
} satisfies Meta<typeof MenuRenderingDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Examples: Story = {};
