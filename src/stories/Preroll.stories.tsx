import { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import Preroll from "../game/preroll";
import palette from "../game/palette";
import { createCanvasArena } from "./menu-arena";
import "./storybook.scss";

const prerollCanvasWidth = 1100;
const prerollCanvasHeight = 720;

const renderDemoBackdrop = (
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  elapsed: number
): void => {
  context.fillStyle = palette.level.sky1910;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.save();
  context.globalAlpha = 0.22;
  context.strokeStyle = "#dfe9f8";
  context.lineWidth = 2;

  const cloudOffset = (elapsed / 32) % 260;
  for (let index = -1; index < 6; index += 1) {
    const x = index * 260 - cloudOffset;
    const y = 150 + (index % 2) * 170;

    context.beginPath();
    context.arc(x + 30, y, 26, 0, Math.PI * 2);
    context.arc(x + 68, y - 8, 34, 0, Math.PI * 2);
    context.arc(x + 112, y + 4, 28, 0, Math.PI * 2);
    context.stroke();
  }

  context.restore();
};

const PrerollDemo = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    const arena = createCanvasArena(canvas, context);
    let animationFrame = 0;
    let showBackdrop = false;
    let restartTimer: number | undefined;

    const createPreroll = (): Preroll =>
      new Preroll(arena, {
        onComplete: () => {
          restartTimer = window.setTimeout(() => {
            showBackdrop = false;
            preroll = createPreroll();
          }, 900);
        },
        onSettleStart: () => {
          showBackdrop = true;
        },
        playBulletSound: () => {},
      });

    let preroll = createPreroll();

    const animate = (): void => {
      const elapsed = performance.now();

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (showBackdrop) {
        renderDemoBackdrop(context, canvas, elapsed);
      }

      context.save();
      context.translate(canvas.width / 2, canvas.height / 2);
      preroll.render();
      context.restore();

      animationFrame = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(animationFrame);

      if (restartTimer !== undefined) {
        window.clearTimeout(restartTimer);
      }
    };
  }, []);

  return (
    <canvas
      className={"storybook-canvas storybook-pixel-canvas"}
      height={prerollCanvasHeight}
      ref={canvasRef}
      width={prerollCanvasWidth}
    />
  );
};

const PrerollStory = () => (
  <main className={"storybook-surface"}>
    <section className={"storybook-section storybook-preroll-section"}>
      <p className={"storybook-eyebrow"}>Startup Flow</p>
      <h1 className={"storybook-title"}>Preroll</h1>
      <article className={"storybook-card storybook-wide-card"}>
        <h2>Author Card, Flyby, and Menu Handoff</h2>
        <PrerollDemo />
        <p>
          Silent Storybook preview of the production preroll timing. The live
          game plays the bullet cue and hands off to the root menu with the
          attract demo running behind it.
        </p>
      </article>
    </section>
  </main>
);

const meta = {
  title: "Game/Preroll",
  component: PrerollStory,
  parameters: {
    docs: {
      description: {
        component:
          "Production-rendered startup preroll with the author logo, Time Pilot logo, player flyby, and root-menu handoff.",
      },
    },
  },
} satisfies Meta<typeof PrerollStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sequence: Story = {};
