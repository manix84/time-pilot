import { useCallback } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import i18n from "../game/i18n";
import palette from "../game/palette";
import { CanvasDemo } from "./canvas-demo";
import { drawLabel } from "./canvas-label";
import "./storybook.scss";

const drawGameText = (context: CanvasRenderingContext2D, message: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = "left"): void => {
  context.fillStyle = color;
  context.font = `${size}px theFont, Trebuchet MS, Segoe UI, sans-serif`;
  context.textAlign = align;
  context.textBaseline = "middle";
  context.fillText(message, x, y);
};

const drawTitleText = (context: CanvasRenderingContext2D, x: number, y: number): void => {
  const text = i18n.title;
  const layers = [
    { x: 9, y: 9, color: palette.title.shadowDeep },
    { x: 7, y: 7, color: palette.title.shadowDark },
    { x: 5, y: 5, color: palette.title.shadowMid },
    { x: 3, y: 3, color: palette.title.shadowOrange },
    { x: 2, y: 2, color: palette.title.shadowLight },
    { x: 1, y: 1, color: palette.title.shadowGold },
  ];

  context.font = "900 52px 'Bookman Old Style', Georgia, serif";
  context.textAlign = "center";
  context.textBaseline = "middle";

  for (const layer of layers) {
    context.fillStyle = layer.color;
    context.fillText(text, x + layer.x, y + layer.y);
  }

  context.fillStyle = palette.title.face;
  context.fillText(text, x, y);
};

const TextSamples = () => {
  const draw = useCallback((context: CanvasRenderingContext2D) => {
    context.fillStyle = "#06101d";
    context.fillRect(0, 0, 560, 360);

    drawLabel(context, "Title", 28, 26);
    drawTitleText(context, 280, 82);

    drawLabel(context, "HUD", 28, 148);
    drawGameText(context, "123450", 28, 192, 30, palette.text.white);
    drawGameText(context, "421.20 x -108.44", 28, 234, 15, palette.menu.mutedText);
    drawGameText(context, "270°", 28, 260, 15, palette.menu.mutedText);

    drawLabel(context, "Game States", 280, 148);
    drawGameText(context, "Loading", 280, 192, 30, palette.text.white);
    drawGameText(context, i18n.hud.gameOver, 280, 238, 30, palette.text.white);
    drawGameText(context, i18n.hud.pressRestartToReset, 280, 276, 20, palette.text.white);

    drawLabel(context, "Menu Text", 28, 320);
    drawGameText(context, i18n.levels[1].introText, 28, 362, 18, palette.menu.mutedText);
    drawGameText(context, i18n.menu.pressAKey, 28, 396, 16, palette.menu.waitingText);
    drawGameText(context, i18n.menu.masterVolume, 280, 362, 16, palette.menu.itemText);
    drawGameText(context, "5", 510, 362, 16, palette.menu.mutedText, "right");
  }, []);

  return (
    <main className={"storybook-surface"}>
      <section className={"storybook-section"}>
        <p className={"storybook-eyebrow"}>Design System</p>
        <h1 className={"storybook-title"}>Game Text</h1>
        <CanvasDemo draw={draw} height={430} />
      </section>
    </main>
  );
};

const meta = {
  title: "Design System/Text",
  component: TextSamples,
} satisfies Meta<typeof TextSamples>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Samples: Story = {};
