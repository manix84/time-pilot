import { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { drawDebugVectors } from "../game/debug-vectors";
import palette from "../game/palette";
import "./storybook.css";

type DebugVectorSceneProps = {
  showSteeringArc?: boolean;
};

const degreesToRadians = (degrees: number): number => degrees * (Math.PI / 180);

const drawLabel = (
  context: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number
): void => {
  context.fillStyle = palette.menu.mutedText;
  context.font = "14px theFont, Trebuchet MS, Segoe UI, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, x, y);
};

const drawCraft = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  heading: number,
  fillStyle: string
): void => {
  context.save();
  context.translate(x, y);
  context.rotate(degreesToRadians(heading));
  context.fillStyle = fillStyle;
  context.strokeStyle = palette.text.white;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(0, -18);
  context.lineTo(14, 14);
  context.lineTo(0, 8);
  context.lineTo(-14, 14);
  context.closePath();
  context.fill();
  context.stroke();
  context.restore();
};

const drawProjectile = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  heading: number
): void => {
  context.save();
  context.translate(x, y);
  context.rotate(degreesToRadians(heading));
  context.fillStyle = palette.aircraft.enemyBullet;
  context.fillRect(-4, -10, 8, 20);
  context.restore();
};

const drawLegend = (context: CanvasRenderingContext2D, x: number, y: number): void => {
  const entries = [
    ["Heading", palette.debug.headingVector],
    ["Steering", palette.debug.steeringVector],
    ["Turn arc", palette.debug.steeringArcFill],
  ] as const;

  context.font = "13px theFont, Trebuchet MS, Segoe UI, sans-serif";
  context.textAlign = "left";
  context.textBaseline = "middle";

  entries.forEach(([label, color], index) => {
    const itemY = y + index * 24;

    context.fillStyle = color;
    context.fillRect(x, itemY - 6, 22, 12);
    context.fillStyle = palette.menu.mutedText;
    context.fillText(label, x + 32, itemY);
  });
};

const DebugVectorScene = ({ showSteeringArc = false }: DebugVectorSceneProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    let animationFrame = 0;
    const startedAt = performance.now();

    const render = (): void => {
      const elapsed = performance.now() - startedAt;
      const turn = Math.sin(elapsed / 760) * 70;
      const playerHeading = (elapsed / 40) % 360;
      const enemyHeading = 230 + Math.sin(elapsed / 900) * 28;
      const enemySteering = 118 + Math.sin(elapsed / 520) * 34;
      const projectileHeading = 62;

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = palette.level.sky1982;
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.fillStyle = "rgba(4, 10, 18, 0.62)";
      context.fillRect(0, 0, canvas.width, canvas.height);

      drawLegend(context, 28, 36);

      drawCraft(context, 190, 210, playerHeading, "#2B78FF");
      drawDebugVectors(context, 190, 210, playerHeading, playerHeading + turn, {
        fillTurnArc: showSteeringArc,
        length: 58,
      });
      drawLabel(context, "Player turning", 190, 284);

      drawCraft(context, 440, 210, enemyHeading, "#D84F3F");
      drawDebugVectors(context, 440, 210, enemyHeading, enemySteering, {
        fillTurnArc: showSteeringArc,
        length: 58,
      });
      drawLabel(context, "Enemy tracking", 440, 284);

      drawProjectile(context, 690, 210, projectileHeading);
      drawDebugVectors(
        context,
        690,
        210,
        projectileHeading,
        projectileHeading,
        {
          fillTurnArc: showSteeringArc,
          length: 42,
        }
      );
      drawLabel(context, "Straight projectile", 690, 284);

      animationFrame = window.requestAnimationFrame(render);
    };

    render();

    return () => window.cancelAnimationFrame(animationFrame);
  }, [showSteeringArc]);

  return (
    <canvas
      className={"storybook-canvas"}
      height={360}
      ref={canvasRef}
      width={860}
    />
  );
};

const meta = {
  title: "Game/Debug Options",
  component: DebugVectorScene,
  parameters: {
    docs: {
      description: {
        component:
          "Animated debug overlay examples using the same heading, steering, and turn-arc renderer as gameplay entities.",
      },
    },
  },
} satisfies Meta<typeof DebugVectorScene>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HeadingAndSteeringVectors: Story = {
  args: {
    showSteeringArc: false,
  },
};

export const WithSteeringArcFill: Story = {
  args: {
    showSteeringArc: true,
  },
};
