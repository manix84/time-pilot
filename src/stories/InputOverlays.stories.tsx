import { useCallback, useEffect, useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import palette from "../game/palette";
import type { ControlInputName, ControlInputState } from "../game/types";
import { CanvasDemo } from "./canvas-demo";
import "./storybook.css";

type OverlayControlInputName = Exclude<keyof ControlInputState, "activeController">;

const keyMap: Record<string, ControlInputName> = {
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  KeyA: "left",
  KeyD: "right",
  KeyP: "pause",
  KeyR: "restart",
  KeyS: "down",
  KeyW: "up",
  Space: "fire",
  Escape: "menu",
};

const createInputState = (): ControlInputState => {
  return {
    down: false,
    fire: false,
    left: false,
    menu: false,
    pause: false,
    restart: false,
    right: false,
    rotateLeft: false,
    rotateRight: false,
    up: false,
    activeController: "keyboard",
  };
};

const renderText = (context: CanvasRenderingContext2D, label: string, x: number, y: number, size: number, color: string): void => {
  context.fillStyle = color;
  context.font = `${size}px theFont, Trebuchet MS, Segoe UI, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, x, y);
};

const renderKey = (context: CanvasRenderingContext2D, label: string, x: number, y: number, width: number, height: number, isPressed: boolean): void => {
  context.globalAlpha = isPressed ? 0.92 : 0.5;
  context.fillStyle = isPressed ? palette.overlay.activeWash : "transparent";
  context.strokeStyle = isPressed ? palette.overlay.activeFill : palette.overlay.line;
  context.lineWidth = 2;
  context.fillRect(x, y, width, height);
  context.strokeRect(x, y, width, height);

  context.globalAlpha = isPressed ? 1 : 0.6;
  renderText(
    context,
    label,
    x + width / 2,
    y + height / 2,
    14,
    isPressed ? palette.overlay.activeFill : palette.overlay.line
  );
};

const renderKeyboardOverlay = (context: CanvasRenderingContext2D, x: number, y: number, inputState: ControlInputState): void => {
  renderKey(context, "W", x + 54, y, 42, 34, inputState.up);
  renderKey(context, "A", x, y + 40, 42, 34, inputState.left);
  renderKey(context, "S", x + 54, y + 40, 42, 34, inputState.down);
  renderKey(context, "D", x + 108, y + 40, 42, 34, inputState.right);
  renderKey(context, "Space", x, y + 86, 150, 34, inputState.fire);
};

const renderStick = (context: CanvasRenderingContext2D, x: number, y: number, inputState: ControlInputState): void => {
  const isPressed =
    inputState.up || inputState.right || inputState.down || inputState.left;
  const offsetX = inputState.left ? -7 : inputState.right ? 7 : 0;
  const offsetY = inputState.up ? -7 : inputState.down ? 7 : 0;

  context.globalAlpha = 0.5;
  context.strokeStyle = palette.overlay.line;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(x, y, 24, 0, 2 * Math.PI);
  context.stroke();

  context.globalAlpha = isPressed ? 0.95 : 0.55;
  context.fillStyle = isPressed ? palette.overlay.activeFill : "transparent";
  context.strokeStyle = isPressed ? palette.overlay.activeFill : palette.overlay.line;
  context.beginPath();
  context.arc(x + offsetX, y + offsetY, 13, 0, 2 * Math.PI);
  context.fill();
  context.stroke();
};

const renderButton = (
  context: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  isPressed: boolean,
  radius = label.length > 1 ? 12 : 16
): void => {

  context.globalAlpha = isPressed ? 0.95 : 0.5;
  context.fillStyle = isPressed ? palette.overlay.activeWashStrong : "transparent";
  context.strokeStyle = isPressed ? palette.overlay.activeFill : palette.overlay.line;
  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI);
  context.fill();
  context.stroke();

  context.globalAlpha = isPressed ? 1 : 0.65;
  renderText(
    context,
    label,
    x,
    y,
    label.length > 1 ? 8 : 12,
    isPressed ? palette.overlay.activeFill : palette.overlay.line
  );
};

const renderOvalButton = (context: CanvasRenderingContext2D, label: string, x: number, y: number, isPressed: boolean): void => {
  const width = 34;
  const height = 10;

  context.globalAlpha = isPressed ? 0.95 : 0.5;
  context.fillStyle = isPressed ? palette.overlay.activeWashStrong : "transparent";
  context.strokeStyle = isPressed ? palette.overlay.activeFill : palette.overlay.line;
  context.beginPath();
  context.roundRect(x - width / 2, y - height / 2, width, height, height / 2);
  context.fill();
  context.stroke();

  context.globalAlpha = isPressed ? 1 : 0.65;
  renderText(
    context,
    label,
    x,
    y,
    10,
    isPressed ? palette.overlay.activeFill : palette.overlay.line
  );
};

const renderShoulderButton = (
  context: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  isPressed: boolean,
  rotation: number
): void => {
  const width = 58;
  const height = 16;

  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.globalAlpha = isPressed ? 0.95 : 0.5;
  context.fillStyle = isPressed ? palette.overlay.activeWashStrong : "transparent";
  context.strokeStyle = isPressed ? palette.overlay.activeFill : palette.overlay.line;
  context.beginPath();
  context.roundRect(-width / 2, -height / 2, width, height, 5);
  context.fill();
  context.stroke();

  context.globalAlpha = isPressed ? 1 : 0.65;
  renderText(
    context,
    label,
    0,
    0,
    10,
    isPressed ? palette.overlay.activeFill : palette.overlay.line
  );
  context.restore();
};

const renderGamepadOverlay = (context: CanvasRenderingContext2D, x: number, y: number, inputState: ControlInputState): void => {
  context.globalAlpha = 0.5;
  context.strokeStyle = palette.overlay.line;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(x + 42, y + 26);
  context.lineTo(x + 96, y + 10);
  context.lineTo(x + 170, y + 10);
  context.lineTo(x + 224, y + 26);
  context.lineTo(x + 246, y + 86);
  context.lineTo(x + 218, y + 124);
  context.lineTo(x + 166, y + 96);
  context.lineTo(x + 100, y + 96);
  context.lineTo(x + 48, y + 124);
  context.lineTo(x + 20, y + 86);
  context.closePath();
  context.stroke();

  const menuY = y + 31;
  const faceButtonX = x + 198;
  const faceButtonY = y + 72;
  const faceButtonRadius = 8;
  const faceButtonGap = 1;
  const faceButtonOffset = faceButtonRadius * 2 + faceButtonGap;

  renderShoulderButton(context, "L", x + 62, y + 8, inputState.rotateLeft ?? false, -0.29);
  renderShoulderButton(context, "R", x + 204, y + 8, inputState.rotateRight ?? false, 0.29);
  renderStick(context, x + 68, y + 72, inputState);
  renderButton(context, "Y", faceButtonX, faceButtonY - faceButtonOffset, inputState.fire, faceButtonRadius);
  renderButton(context, "A", faceButtonX, faceButtonY + faceButtonOffset, inputState.fire, faceButtonRadius);
  renderButton(context, "X", faceButtonX - faceButtonOffset, faceButtonY, inputState.fire, faceButtonRadius);
  renderButton(context, "B", faceButtonX + faceButtonOffset, faceButtonY, inputState.fire, faceButtonRadius);
  renderButton(context, "Menu", x + 130, menuY, inputState.menu);
  renderOvalButton(context, "P", x + 91, menuY, inputState.pause);
  renderOvalButton(context, "R", x + 169, menuY, inputState.restart);
};

const renderTouchOverlay = (context: CanvasRenderingContext2D, x: number, y: number, inputState: ControlInputState): void => {
  const isDirectional =
    inputState.up || inputState.right || inputState.down || inputState.left;
  const isPressed = inputState.fire || isDirectional;
  const offsetX = inputState.left ? -28 : inputState.right ? 28 : 0;
  const offsetY = inputState.up ? -28 : inputState.down ? 28 : 0;
  const centerX = x + 80;
  const centerY = y + 80;

  context.globalAlpha = isPressed ? 0.24 : 0.12;
  context.fillStyle = isPressed ? palette.overlay.activeWashStrong : palette.overlay.line;
  context.beginPath();
  context.arc(centerX, centerY, 70, 0, 2 * Math.PI);
  context.fill();

  context.globalAlpha = 0.55;
  context.strokeStyle = palette.overlay.line;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(centerX, centerY, 54, 0, 2 * Math.PI);
  context.stroke();

  context.globalAlpha = 0.32;
  context.beginPath();
  context.moveTo(centerX - 54, centerY);
  context.lineTo(centerX + 54, centerY);
  context.moveTo(centerX, centerY - 54);
  context.lineTo(centerX, centerY + 54);
  context.stroke();

  if (isDirectional) {
    context.globalAlpha = 0.9;
    context.strokeStyle = palette.overlay.activeFill;
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.lineTo(centerX + offsetX, centerY + offsetY);
    context.stroke();
  }

  context.globalAlpha = isPressed ? 0.96 : 0.55;
  context.fillStyle = isPressed ? palette.overlay.activeFill : "transparent";
  context.strokeStyle = isPressed ? palette.overlay.activeFill : palette.overlay.line;
  context.beginPath();
  context.arc(centerX + offsetX, centerY + offsetY, 24, 0, 2 * Math.PI);
  context.fill();
  context.stroke();

  if (isPressed) {
    context.globalAlpha = 1;
    renderText(
      context,
      "FIRE",
      centerX + offsetX,
      centerY + offsetY,
      8,
      palette.menu.selectedText
    );
  }
};

const InputOverlayDemo = () => {
  const [inputState, setInputState] = useState(createInputState);
  const controls = useMemo(
    () => [
      ["up", "W / Up"],
      ["left", "A / Left"],
      ["down", "S / Down"],
      ["right", "D / Right"],
      ["fire", "Space / A/B/X/Y / Touch"],
      ["menu", "Esc / Menu"],
      ["pause", "P"],
      ["restart", "R"],
      ["rotateLeft", "L Shoulder"],
      ["rotateRight", "R Shoulder"],
    ] satisfies Array<[OverlayControlInputName, string]>,
    []
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent, isPressed: boolean) => {
      const inputName = keyMap[event.code];

      if (!inputName) {
        return;
      }

      event.preventDefault();
      setInputState((current) => ({
        ...current,
        activeController: "keyboard",
        [inputName]: isPressed,
      }));
    };
    const handleKeyDown = (event: KeyboardEvent) => handleKey(event, true);
    const handleKeyUp = (event: KeyboardEvent) => handleKey(event, false);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const drawKeyboard = useCallback(
    (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      context.fillStyle = "#06101d";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.save();
      renderKeyboardOverlay(context, 65, 50, inputState);
      context.restore();
    },
    [inputState]
  );
  const drawGamepad = useCallback(
    (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      context.fillStyle = "#06101d";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.save();
      renderGamepadOverlay(context, 20, 36, inputState);
      context.restore();
    },
    [inputState]
  );
  const drawTouch = useCallback(
    (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      context.fillStyle = "#06101d";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.save();
      renderTouchOverlay(context, 60, 10, inputState);
      context.restore();
    },
    [inputState]
  );

  const toggleInput = (inputName: OverlayControlInputName): void => {
    setInputState((current) => ({
      ...current,
      [inputName]: !current[inputName],
    }));
  };

  const clearInput = (): void => {
    setInputState(createInputState());
  };

  return (
    <main className={"storybook-surface"}>
      <section className={"storybook-section"}>
        <p className={"storybook-eyebrow"}>Game UI</p>
        <h1 className={"storybook-title"}>Controller Input Overlays</h1>
        <div className={"storybook-demo-grid"}>
          <article className={"storybook-card"}>
            <h2>Keyboard</h2>
            <CanvasDemo draw={drawKeyboard} height={180} width={280} />
          </article>
          <article className={"storybook-card"}>
            <h2>Gamepad</h2>
            <CanvasDemo draw={drawGamepad} height={180} width={280} />
          </article>
          <article className={"storybook-card"}>
            <h2>Touch</h2>
            <CanvasDemo draw={drawTouch} height={180} width={280} />
          </article>
        </div>
        <div className={"storybook-controls"}>
          {controls.map(([inputName, label]) => (
            <button
              aria-pressed={inputState[inputName]}
              key={inputName}
              onClick={() => toggleInput(inputName)}
              type={"button"}
            >
              {label}
            </button>
          ))}
          <button onClick={clearInput} type={"button"}>
            Clear
          </button>
        </div>
      </section>
    </main>
  );
};

const meta = {
  title: "Game/Input Overlays",
  component: InputOverlayDemo,
  parameters: {
    docs: {
      description: {
        component:
          "Interactive keyboard, gamepad, and touch joystick overlays. Keyboard events and story controls both update the lit state.",
      },
    },
  },
} satisfies Meta<typeof InputOverlayDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {};
