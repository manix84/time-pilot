import { beforeEach, describe, expect, it, vi } from "vitest";
import Gamepad from "../gamepad";
import Keyboard1 from "../keyboard1";
import Keyboard2 from "../keyboard2";
import Mouse from "../mouse";
import type { ControlInputState, ControllerInterfaceInstance } from "../../types";
import userOptions from "../../user-options";

function createControls(): ControllerInterfaceInstance {
  return {
    rotateToHeading: vi.fn(),
    rotateClockwise: vi.fn(),
    rotateAntiClockwise: vi.fn(),
    stop: vi.fn(),
    toggleMenu: vi.fn(),
    openMenu: vi.fn(),
    startShooting: vi.fn(),
    stopShooting: vi.fn(),
    toggleFullScreen: vi.fn(),
    togglePause: vi.fn(),
    restart: vi.fn(),
    rotateCounterClockwise: vi.fn(),
    rotateRight: vi.fn(),
    rotateLeft: vi.fn(),
    handlePointer: vi.fn(),
    isMenuActive: vi.fn(() => false),
  };
}

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

describe("controller modules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userOptions.setOption("controllerType", "keyboard1");
  });

  it("maps keyboard set 1 keys to controller actions", () => {
    const controls = createControls();
    const inputState = createInputState();
    const keyboard = new Keyboard1(controls, inputState);

    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 37 }));
    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 32 }));
    document.documentElement.dispatchEvent(new KeyboardEvent("keyup", { keyCode: 32 }));
    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 27 }));

    expect(controls.rotateToHeading).toHaveBeenCalledWith(270);
    expect(controls.startShooting).toHaveBeenCalled();
    expect(controls.stopShooting).toHaveBeenCalled();
    expect(controls.openMenu).toHaveBeenCalled();
    expect(controls.togglePause).not.toHaveBeenCalled();
    expect(inputState.left).toBe(true);
    expect(inputState.fire).toBe(false);
    expect(inputState.menu).toBe(true);
    expect(inputState.activeController).toBe("keyboard");

    keyboard.disconnect?.();
  });

  it("uses Enter to activate menu items without treating it as gameplay fire", () => {
    const controls = createControls();
    vi.mocked(controls.isMenuActive).mockReturnValue(true);
    const inputState = createInputState();
    const keyboard = new Keyboard1(controls, inputState);

    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 13 }));

    expect(controls.startShooting).toHaveBeenCalled();
    expect(inputState.fire).toBe(false);

    keyboard.disconnect?.();
  });

  it("maps keyboard set 2 keys to rotational controls", () => {
    const controls = createControls();
    const inputState = createInputState();
    userOptions.setOption("controllerType", "keyboard2");
    const keyboard = new Keyboard2(controls, inputState);

    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 37 }));
    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 39 }));
    document.documentElement.dispatchEvent(new KeyboardEvent("keyup", { keyCode: 39 }));
    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 27 }));

    expect(controls.rotateAntiClockwise).toHaveBeenCalled();
    expect(controls.rotateClockwise).toHaveBeenCalled();
    expect(controls.stop).toHaveBeenCalled();
    expect(controls.openMenu).toHaveBeenCalled();
    expect(controls.togglePause).not.toHaveBeenCalled();
    expect(inputState.left).toBe(false);
    expect(inputState.right).toBe(false);
    expect(inputState.menu).toBe(true);

    keyboard.disconnect?.();
  });

  it("polls gamepad state and disconnects its animation frame", async () => {
    const controls = createControls();
    const inputState = createInputState();
    const gamepad = {
      axes: [1, 0],
      buttons: Array.from({ length: 10 }, () => ({ pressed: false })),
    };
    gamepad.buttons[0].pressed = true;
    vi.spyOn(navigator, "getGamepads").mockReturnValue([
      gamepad as unknown as globalThis.Gamepad,
    ]);

    const controller = new Gamepad(controls, inputState);
    await new Promise((resolve) => window.setTimeout(resolve, 5));
    controller.disconnect?.();

    expect(controls.startShooting).toHaveBeenCalled();
    expect(controls.rotateToHeading).toHaveBeenCalled();
    expect(inputState.fire).toBe(true);
    expect(inputState.right).toBe(true);
    expect(inputState.activeController).toBe("gamepad");
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });

  it("maps mouse movement and clicks to menu pointer actions", () => {
    const controls = createControls();
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      bottom: 300,
      height: 300,
      left: 0,
      right: 400,
      top: 0,
      width: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const mouse = new Mouse(canvas, controls);
    canvas.dispatchEvent(
      new MouseEvent("mousemove", { clientX: 200, clientY: 150 })
    );
    canvas.dispatchEvent(
      new MouseEvent("click", { clientX: 200, clientY: 150 })
    );

    expect(controls.handlePointer).toHaveBeenCalledWith({
      posX: 0,
      posY: 0,
      type: "move",
    });
    expect(controls.handlePointer).toHaveBeenCalledWith({
      posX: 0,
      posY: 0,
      type: "click",
    });

    mouse.disconnect?.();
  });
});
