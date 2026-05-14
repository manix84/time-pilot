import { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { drawDebugVectors } from "../game/debug-vectors";
import palette from "../game/palette";
import "./storybook.css";

type DebugVectorSceneProps = {
  collisionOffset?: number;
  mode?: "vectors" | "hitboxes" | "collision";
  showInvincibilityShield?: boolean;
  showSteeringArc?: boolean;
};

const degreesToRadians = (degrees: number): number => degrees * (Math.PI / 180);

const distanceBetween = (
  first: { x: number; y: number },
  second: { x: number; y: number }
): number => Math.hypot(first.x - second.x, first.y - second.y);

const circlesCollide = (
  first: { radius: number; x: number; y: number },
  second: { radius: number; x: number; y: number }
): boolean => distanceBetween(first, second) <= first.radius + second.radius;

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

const drawHitbox = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  isColliding = false
): void => {
  context.save();
  context.globalAlpha = isColliding ? 0.24 : 0.1;
  context.fillStyle = color;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;
  context.strokeStyle = color;
  context.lineWidth = isColliding ? 4 : 2;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.stroke();
  context.restore();
};

const drawCollisionLine = (
  context: CanvasRenderingContext2D,
  first: { radius: number; x: number; y: number },
  second: { radius: number; x: number; y: number },
  isColliding: boolean
): void => {
  context.save();
  context.strokeStyle = isColliding ? palette.menu.selectedBackground : palette.menu.mutedText;
  context.lineWidth = 2;
  context.setLineDash(isColliding ? [] : [6, 5]);
  context.beginPath();
  context.moveTo(first.x, first.y);
  context.lineTo(second.x, second.y);
  context.stroke();
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

const drawHitboxLegend = (context: CanvasRenderingContext2D, x: number, y: number): void => {
  const entries = [
    ["Player", palette.debug.playerHitbox],
    ["Enemy", palette.debug.enemyHitbox],
    ["Bonus", palette.debug.bonusHitbox],
    ["Invincible", palette.aircraft.playerShield],
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

const drawHitboxScene = (
  context: CanvasRenderingContext2D,
  elapsed: number,
  showInvincibilityShield: boolean
): void => {
  const playerHitbox = { x: 190, y: 205, radius: showInvincibilityShield ? 16 : 8 };
  const bulletHitbox = { x: 380, y: 190, radius: 4 };
  const enemyHitbox = { x: 515, y: 205, radius: 18 };
  const bonusHitbox = { x: 690, y: 205, radius: 8 };
  const shieldPulse = 1 + Math.sin(elapsed / 130) * 0.08;

  drawHitboxLegend(context, 28, 36);

  drawCraft(context, playerHitbox.x, playerHitbox.y, (elapsed / 46) % 360, "#2B78FF");
  if (showInvincibilityShield) {
    drawHitbox(
      context,
      playerHitbox.x,
      playerHitbox.y,
      playerHitbox.radius * shieldPulse,
      palette.aircraft.playerShield
    );
  }
  drawHitbox(
    context,
    playerHitbox.x,
    playerHitbox.y,
    playerHitbox.radius,
    palette.debug.playerHitbox
  );
  drawLabel(context, showInvincibilityShield ? "Invincible player" : "Player", playerHitbox.x, 284);

  drawProjectile(context, bulletHitbox.x, bulletHitbox.y, 90);
  drawHitbox(context, bulletHitbox.x, bulletHitbox.y, bulletHitbox.radius, palette.debug.playerHitbox);
  drawLabel(context, "Player bullet", bulletHitbox.x, 284);

  drawCraft(context, enemyHitbox.x, enemyHitbox.y, 245, "#D84F3F");
  drawHitbox(context, enemyHitbox.x, enemyHitbox.y, enemyHitbox.radius, palette.debug.enemyHitbox);
  drawLabel(context, "Enemy", enemyHitbox.x, 284);

  context.save();
  context.translate(bonusHitbox.x, bonusHitbox.y);
  context.fillStyle = "#FFD400";
  context.strokeStyle = palette.text.white;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(0, 0, 13, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.restore();
  drawHitbox(context, bonusHitbox.x, bonusHitbox.y, bonusHitbox.radius, palette.debug.bonusHitbox);
  drawLabel(context, "Bonus", bonusHitbox.x, 284);
};

const drawCollisionScene = (
  context: CanvasRenderingContext2D,
  elapsed: number,
  collisionOffset: number,
  showInvincibilityShield: boolean
): void => {
  const playerHitbox = { x: 260, y: 205, radius: showInvincibilityShield ? 16 : 8 };
  const enemyHitbox = {
    x: 440 + collisionOffset + Math.sin(elapsed / 900) * 28,
    y: 205 + Math.sin(elapsed / 620) * 8,
    radius: 18,
  };
  const bulletHitbox = {
    x: 440 + collisionOffset / 2 + Math.sin(elapsed / 700) * 20,
    y: 124,
    radius: 4,
  };
  const bonusHitbox = {
    x: 260 + Math.sin(elapsed / 820) * 34,
    y: 316,
    radius: 8,
  };
  const enemyCollision = circlesCollide(playerHitbox, enemyHitbox);
  const bulletCollision = circlesCollide(playerHitbox, bulletHitbox);
  const bonusCollision = circlesCollide(playerHitbox, bonusHitbox);

  drawHitboxLegend(context, 28, 36);
  drawCollisionLine(context, playerHitbox, enemyHitbox, enemyCollision);
  drawCollisionLine(context, playerHitbox, bulletHitbox, bulletCollision);
  drawCollisionLine(context, playerHitbox, bonusHitbox, bonusCollision);

  drawCraft(context, playerHitbox.x, playerHitbox.y, (elapsed / 44) % 360, "#2B78FF");
  if (showInvincibilityShield) {
    drawHitbox(context, playerHitbox.x, playerHitbox.y, playerHitbox.radius, palette.aircraft.playerShield);
  }
  drawHitbox(context, playerHitbox.x, playerHitbox.y, playerHitbox.radius, palette.debug.playerHitbox);

  drawCraft(context, enemyHitbox.x, enemyHitbox.y, 250, "#D84F3F");
  drawHitbox(context, enemyHitbox.x, enemyHitbox.y, enemyHitbox.radius, palette.debug.enemyHitbox, enemyCollision);

  drawProjectile(context, bulletHitbox.x, bulletHitbox.y, 180);
  drawHitbox(context, bulletHitbox.x, bulletHitbox.y, bulletHitbox.radius, palette.debug.playerHitbox, bulletCollision);

  context.save();
  context.translate(bonusHitbox.x, bonusHitbox.y);
  context.fillStyle = "#FFD400";
  context.strokeStyle = palette.text.white;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(0, 0, 13, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.restore();
  drawHitbox(context, bonusHitbox.x, bonusHitbox.y, bonusHitbox.radius, palette.debug.bonusHitbox, bonusCollision);

  drawLabel(
    context,
    enemyCollision ? "Enemy collision" : "Enemy clear",
    enemyHitbox.x,
    enemyHitbox.y + 62
  );
  drawLabel(
    context,
    bulletCollision ? "Bullet hit" : "Bullet clear",
    bulletHitbox.x,
    bulletHitbox.y - 42
  );
  drawLabel(
    context,
    bonusCollision ? "Bonus collect" : "Bonus clear",
    bonusHitbox.x,
    bonusHitbox.y + 44
  );
};

const DebugVectorScene = ({
  collisionOffset = 0,
  mode = "vectors",
  showInvincibilityShield = false,
  showSteeringArc = false,
}: DebugVectorSceneProps) => {
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

      if (mode === "hitboxes") {
        drawHitboxScene(context, elapsed, showInvincibilityShield);
      } else if (mode === "collision") {
        drawCollisionScene(context, elapsed, collisionOffset, showInvincibilityShield);
      } else {
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
      }

      animationFrame = window.requestAnimationFrame(render);
    };

    render();

    return () => window.cancelAnimationFrame(animationFrame);
  }, [collisionOffset, mode, showInvincibilityShield, showSteeringArc]);

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
  args: {
    collisionOffset: 0,
    mode: "vectors",
    showInvincibilityShield: false,
    showSteeringArc: false,
  },
  argTypes: {
    collisionOffset: {
      control: { min: -180, max: 160, step: 10, type: "range" },
      if: { arg: "mode", eq: "collision" },
    },
    mode: {
      control: "select",
      options: ["vectors", "hitboxes", "collision"],
    },
  },
  parameters: {
    controls: {
      disable: false,
    },
    docs: {
      description: {
        component:
          "Animated debug overlay examples using the same heading, steering, and turn-arc renderer as gameplay entities.",
      },
    },
    options: {
      selectedPanel: "storybook/controls/panel",
      showPanel: true,
    },
  },
} satisfies Meta<typeof DebugVectorScene>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HeadingAndSteeringVectors: Story = {
  args: {
    mode: "vectors",
    showSteeringArc: false,
  },
};

export const WithSteeringArcFill: Story = {
  args: {
    mode: "vectors",
    showSteeringArc: true,
  },
};

export const HitboxVariants: Story = {
  args: {
    mode: "hitboxes",
    showInvincibilityShield: true,
  },
};

export const CollisionDetection: Story = {
  args: {
    collisionOffset: -150,
    mode: "collision",
    showInvincibilityShield: false,
  },
};
