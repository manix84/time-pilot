import { useCallback } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import palette from "../game/palette";
import { CanvasDemo } from "./canvas-demo";
import { drawLabel } from "./canvas-label";
import "./storybook.css";

const drawGameText = (context: CanvasRenderingContext2D, message: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = "left"): void => {
  context.fillStyle = color;
  context.font = `${size}px theFont, Trebuchet MS, Segoe UI, sans-serif`;
  context.textAlign = align;
  context.textBaseline = "middle";
  context.fillText(message, x, y);
};

const TextSamples = () => {
  const draw = useCallback((context: CanvasRenderingContext2D) => {
    context.fillStyle = "#06101d";
    context.fillRect(0, 0, 560, 360);

    drawLabel(context, "HUD", 28, 26);
    drawGameText(context, "123450", 28, 70, 30, palette.text.white);
    drawGameText(context, "421.20 x -108.44", 28, 112, 15, palette.menu.mutedText);
    drawGameText(context, "270°", 28, 138, 15, palette.menu.mutedText);

    drawLabel(context, "Game States", 280, 26);
    drawGameText(context, "Loading", 280, 70, 30, palette.text.white);
    drawGameText(context, "Game Over", 280, 116, 30, palette.text.white);
    drawGameText(context, 'Press "R" to reset', 280, 154, 20, palette.text.white);

    drawLabel(context, "Menu Text", 28, 210);
    drawGameText(context, "A.D. 1910", 28, 252, 18, palette.menu.mutedText);
    drawGameText(context, "Press a key", 28, 286, 16, palette.menu.waitingText);
    drawGameText(context, "Master Volume", 280, 252, 16, palette.menu.itemText);
    drawGameText(context, "5", 510, 252, 16, palette.menu.mutedText, "right");
  }, []);

  return (
    <main className={"storybook-surface"}>
      <section className={"storybook-section"}>
        <p className={"storybook-eyebrow"}>Design System</p>
        <h1 className={"storybook-title"}>Game Text</h1>
        <CanvasDemo draw={draw} />
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
