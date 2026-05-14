import { beforeEach, describe, expect, it, vi } from "vitest";
import Gamepad from "../gamepad";
import Keyboard1 from "../keyboard1";
import Keyboard2 from "../keyboard2";
import Mouse from "../mouse";
import TouchController from "../touch";
import type { ControlInputState, ControllerInterfaceInstance } from "../../types";
import userOptions from "../../user-options";

const createControls = (): ControllerInterfaceInstance => {
  return {
    adjustUiZoom: vi.fn(),
    resetUiZoom: vi.fn(),
    rotateToHeading: vi.fn(),
    rotateClockwise: vi.fn(),
    rotateAntiClockwise: vi.fn(),
    stop: vi.fn(),
    toggleMenu: vi.fn(),
    openMainMenu: vi.fn(),
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
    goBack: vi.fn(),
    isMenuActive: vi.fn(() => false),
  };
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
    up: false,
    activeController: "keyboard",
  };
};

const dispatchTouch = (canvas: HTMLCanvasElement, type: string, touch: { clientX: number; clientY: number; identifier?: number }): void => {
  const event = new Event(type, { bubbles: true, cancelable: true });

  Object.defineProperty(event, "changedTouches", {
    value: [
      {
        identifier: touch.identifier ?? 1,
        clientX: touch.clientX,
        clientY: touch.clientY,
      },
    ],
  });

  canvas.dispatchEvent(event);
};

describe("controller modules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userOptions.setOption("controllerType", "keyboard1");
    userOptions.setOption("gameZoom", 100);
    userOptions.setOption("uiZoom", 100);
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
    expect(controls.goBack).toHaveBeenCalled();
    expect(controls.openMenu).toHaveBeenCalled();
    expect(controls.togglePause).not.toHaveBeenCalled();
    expect(inputState.left).toBe(true);
    expect(inputState.fire).toBe(false);
    expect(inputState.menu).toBe(true);
    expect(inputState.activeController).toBe("keyboard");

    keyboard.disconnect?.();
  });

  it("uses M to open the main menu", () => {
    const controls = createControls();
    const inputState = createInputState();
    const keyboard = new Keyboard1(controls, inputState);

    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 77 }));

    expect(controls.openMainMenu).toHaveBeenCalled();
    expect(controls.openMenu).not.toHaveBeenCalled();
    expect(inputState.menu).toBe(true);

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

  it("maps gamepad menu and back buttons to menu actions", async () => {
    const controls = createControls();
    const inputState = createInputState();
    vi.mocked(controls.isMenuActive).mockReturnValue(true);
    const gamepad = {
      axes: [0, 0],
      buttons: Array.from({ length: 16 }, () => ({ pressed: false })),
    };
    gamepad.buttons[8].pressed = true;
    gamepad.buttons[9].pressed = true;
    vi.spyOn(navigator, "getGamepads").mockReturnValue([
      gamepad as unknown as globalThis.Gamepad,
    ]);

    const controller = new Gamepad(controls, inputState);
    await new Promise((resolve) => window.setTimeout(resolve, 5));
    controller.disconnect?.();

    expect(controls.goBack).toHaveBeenCalled();
    expect(controls.openMainMenu).toHaveBeenCalled();
    expect(controls.restart).not.toHaveBeenCalled();
    expect(inputState.menu).toBe(true);
  });

  it("maps plus, minus, and zero keys to UI zoom controls", () => {
    const controls = createControls();
    const inputState = createInputState();
    const keyboard = new Keyboard1(controls, inputState);

    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 187 }));
    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 189 }));
    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 48 }));
    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 107 }));
    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 109 }));
    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 96 }));

    expect(controls.adjustUiZoom).toHaveBeenCalledWith(1);
    expect(controls.adjustUiZoom).toHaveBeenCalledWith(-1);
    expect(controls.resetUiZoom).toHaveBeenCalledTimes(2);
    expect(controls.rotateToHeading).not.toHaveBeenCalled();

    keyboard.disconnect?.();
  });

  it("keeps rotating toward held keyboard directions when another direction is released", () => {
    const controls = createControls();
    const inputState = createInputState();
    const keyboard = new Keyboard1(controls, inputState);

    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 38 }));
    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 39 }));
    document.documentElement.dispatchEvent(new KeyboardEvent("keyup", { keyCode: 38 }));

    expect(controls.rotateToHeading).toHaveBeenLastCalledWith(90);
    expect(controls.stop).not.toHaveBeenCalled();
    expect(inputState.up).toBe(false);
    expect(inputState.right).toBe(true);

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

  it("keeps directional menu navigation working in rotate control mode", () => {
    const controls = createControls();
    const inputState = createInputState();
    userOptions.setOption("controllerType", "keyboard2");
    vi.mocked(controls.isMenuActive).mockReturnValue(true);
    const keyboard = new Keyboard2(controls, inputState);

    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 38 }));
    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 40 }));
    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 37 }));
    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 39 }));

    expect(controls.rotateToHeading).toHaveBeenCalledWith(0);
    expect(controls.rotateToHeading).toHaveBeenCalledWith(180);
    expect(controls.rotateToHeading).toHaveBeenCalledWith(270);
    expect(controls.rotateToHeading).toHaveBeenCalledWith(90);
    expect(controls.rotateAntiClockwise).not.toHaveBeenCalled();
    expect(controls.rotateClockwise).not.toHaveBeenCalled();

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

  it("treats gamepad D-pad as directional and shoulder buttons as rotation", async () => {
    const controls = createControls();
    const inputState = createInputState();
    userOptions.setOption("controllerType", "keyboard2");
    const gamepad = {
      axes: [0, 0],
      buttons: Array.from({ length: 16 }, () => ({ pressed: false })),
    };
    gamepad.buttons[4].pressed = true;
    gamepad.buttons[5].pressed = true;
    gamepad.buttons[12].pressed = true;
    vi.spyOn(navigator, "getGamepads").mockReturnValue([
      gamepad as unknown as globalThis.Gamepad,
    ]);

    const controller = new Gamepad(controls, inputState);
    await new Promise((resolve) => window.setTimeout(resolve, 5));
    controller.disconnect?.();

    expect(controls.rotateAntiClockwise).toHaveBeenCalled();
    expect(controls.rotateClockwise).toHaveBeenCalled();
    expect(controls.rotateToHeading).toHaveBeenCalledWith(0);
    expect(inputState.up).toBe(true);
    expect(inputState.activeController).toBe("gamepad");
  });

  it("maps mouse movement and button presses to menu pointer actions", () => {
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
      new MouseEvent("mousedown", { clientX: 200, clientY: 150 })
    );
    canvas.dispatchEvent(
      new MouseEvent("mouseup", { clientX: 200, clientY: 150 })
    );

    expect(controls.handlePointer).toHaveBeenCalledWith({
      posX: 0,
      posY: 0,
      type: "move",
    });
    expect(controls.handlePointer).toHaveBeenCalledWith({
      posX: 0,
      posY: 0,
      type: "press",
    });
    expect(controls.handlePointer).toHaveBeenCalledWith({
      posX: 0,
      posY: 0,
      type: "release",
    });

    mouse.disconnect?.();
  });

  it("maps mouse drags to menu pointer drag actions", () => {
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
      new MouseEvent("mousedown", { clientX: 100, clientY: 150 })
    );
    canvas.dispatchEvent(
      new MouseEvent("mousemove", { clientX: 250, clientY: 150 })
    );
    canvas.dispatchEvent(
      new MouseEvent("mouseup", { clientX: 250, clientY: 150 })
    );

    expect(controls.handlePointer).toHaveBeenCalledWith({
      posX: -200,
      posY: 0,
      type: "press",
    });
    expect(controls.handlePointer).toHaveBeenCalledWith({
      posX: 100,
      posY: 0,
      type: "drag",
    });
    expect(controls.handlePointer).not.toHaveBeenCalledWith({
      posX: 100,
      posY: 0,
      type: "click",
    });
    expect(controls.handlePointer).toHaveBeenCalledWith({
      posX: 100,
      posY: 0,
      type: "release",
    });

    mouse.disconnect?.();
  });

  it("clears mouse drag state when releasing outside the canvas", () => {
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
      new MouseEvent("mousedown", { clientX: 100, clientY: 150 })
    );
    window.dispatchEvent(
      new MouseEvent("mouseup", { clientX: 450, clientY: 350 })
    );
    canvas.dispatchEvent(
      new MouseEvent("mousemove", { clientX: 200, clientY: 150 })
    );

    expect(controls.handlePointer).toHaveBeenCalledWith({
      posX: 500,
      posY: 400,
      type: "release",
    });
    expect(controls.handlePointer).toHaveBeenLastCalledWith({
      posX: 0,
      posY: 0,
      type: "move",
    });

    mouse.disconnect?.();
  });

  it("maps mouse wheel input to menu scroll actions", () => {
    const controls = createControls();
    vi.mocked(controls.isMenuActive).mockReturnValue(true);
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
    const wheelEvent = new WheelEvent("wheel", {
      clientX: 200,
      clientY: 150,
      deltaY: 120,
      cancelable: true,
    });
    canvas.dispatchEvent(wheelEvent);

    expect(wheelEvent.defaultPrevented).toBe(true);
    expect(controls.handlePointer).toHaveBeenCalledWith({
      deltaY: 120,
      posX: 0,
      posY: 0,
      type: "wheel",
    });

    mouse.disconnect?.();
  });

  it("maps touch drag direction to heading with a dead zone", () => {
    const controls = createControls();
    const inputState = createInputState();
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

    const touch = new TouchController(canvas, controls, inputState);
    dispatchTouch(canvas, "touchstart", { clientX: 300, clientY: 200 });
    expect(controls.rotateToHeading).not.toHaveBeenCalled();
    expect(controls.startShooting).toHaveBeenCalled();
    expect(inputState.fire).toBe(true);

    dispatchTouch(canvas, "touchmove", { clientX: 300, clientY: 120 });
    expect(controls.rotateToHeading).toHaveBeenCalledWith(0);
    expect(inputState.up).toBe(true);
    expect(inputState.activeController).toBe("touch");

    dispatchTouch(canvas, "touchmove", { clientX: 380, clientY: 200 });
    expect(controls.rotateToHeading).toHaveBeenCalledWith(90);
    expect(inputState.right).toBe(true);

    dispatchTouch(canvas, "touchend", { clientX: 380, clientY: 200 });
    expect(controls.stopShooting).toHaveBeenCalled();
    expect(inputState.fire).toBe(false);
    expect(inputState.right).toBe(false);
    expect(controls.stop).not.toHaveBeenCalled();

    touch.disconnect?.();
  });

  it("routes touch taps and movement to active menus", () => {
    const controls = createControls();
    vi.mocked(controls.isMenuActive).mockReturnValue(true);
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

    const touch = new TouchController(canvas, controls);
    dispatchTouch(canvas, "touchstart", { clientX: 200, clientY: 150 });
    dispatchTouch(canvas, "touchmove", { clientX: 220, clientY: 160 });
    dispatchTouch(canvas, "touchend", { clientX: 220, clientY: 160 });

    expect(controls.handlePointer).toHaveBeenCalledWith({
      posX: 0,
      posY: 0,
      type: "press",
    });
    expect(controls.handlePointer).toHaveBeenCalledWith({
      posX: 40,
      posY: 20,
      type: "drag",
    });
    expect(controls.handlePointer).toHaveBeenCalledWith({
      posX: 40,
      posY: 20,
      type: "release",
    });
    expect(controls.rotateToHeading).not.toHaveBeenCalled();

    touch.disconnect?.();
  });
});
