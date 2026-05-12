import { useCallback, useEffect, useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import palette from "../game/palette";
import type { ControlInputName, ControlInputState } from "../game/types";
import { CanvasDemo } from "./canvas-demo";
import "./storybook.css";

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

function createInputState(): ControlInputState {
  return {
    down: false,
    fire: false,
    left: false,
    menu: false,
    pause: false,
    restart: false,
    right: false,
    up: false,
    activeController: "keyboard",
  };
}

function renderText(
  context: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  context.fillStyle = color;
  context.font = `${size}px theFont, Trebuchet MS, Segoe UI, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, x, y);
}

function renderKey(
  context: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  isPressed: boolean
): void {
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
}

function renderKeyboardOverlay(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  inputState: ControlInputState
): void {
  renderKey(context, "W", x + 54, y, 42, 34, inputState.up);
  renderKey(context, "A", x, y + 40, 42, 34, inputState.left);
  renderKey(context, "S", x + 54, y + 40, 42, 34, inputState.down);
  renderKey(context, "D", x + 108, y + 40, 42, 34, inputState.right);
  renderKey(context, "Space", x, y + 86, 150, 34, inputState.fire);
}

function renderStick(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  inputState: ControlInputState
): void {
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
}

function renderButton(
  context: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  isPressed: boolean
): void {
  const radius = label.length > 1 ? 12 : 16;

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
}

function renderGamepadOverlay(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  inputState: ControlInputState
): void {
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

  renderStick(context, x + 88, y + 72, inputState);
  renderButton(context, "A", x + 188, y + 76, inputState.fire);
  renderButton(context, "Menu", x + 130, y + 56, inputState.menu);
  renderButton(context, "P", x + 154, y + 56, inputState.pause);
  renderButton(context, "R", x + 212, y + 48, inputState.restart);
}

function InputOverlayDemo() {
  const [inputState, setInputState] = useState(createInputState);
  const controls = useMemo(
    () => [
      ["up", "W / Up"],
      ["left", "A / Left"],
      ["down", "S / Down"],
      ["right", "D / Right"],
      ["fire", "Space / A"],
      ["menu", "Esc / Menu"],
      ["pause", "P"],
      ["restart", "R"],
    ] satisfies Array<[ControlInputName, string]>,
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

  const draw = useCallback(
    (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      context.fillStyle = "#06101d";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.save();
      renderKeyboardOverlay(context, 70, 58, inputState);
      renderGamepadOverlay(context, 252, 42, inputState);
      context.restore();
    },
    [inputState]
  );

  const toggleInput = (inputName: ControlInputName): void => {
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
        <CanvasDemo draw={draw} height={220} width={560} />
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
}

const meta = {
  title: "Game/Input Overlays",
  component: InputOverlayDemo,
  parameters: {
    docs: {
      description: {
        component:
          "Interactive WASD and Xbox-style controller overlays. Keyboard events and story controls both update the lit state.",
      },
    },
  },
} satisfies Meta<typeof InputOverlayDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {};
