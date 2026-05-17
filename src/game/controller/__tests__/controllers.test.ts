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
    requestRestartConfirmation: vi.fn(),
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
    captureKey: vi.fn(() => false),
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

const createTouch = (touch: {
  clientX: number;
  clientY: number;
  identifier?: number;
}): Touch =>
  ({
    identifier: touch.identifier ?? 1,
    clientX: touch.clientX,
    clientY: touch.clientY,
  }) as Touch;

const dispatchTouch = (
  canvas: HTMLCanvasElement,
  type: string,
  touch: { clientX: number; clientY: number; identifier?: number },
  touches = [touch]
): void => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  const activeTouches = touches.map(createTouch);

  Object.defineProperty(event, "changedTouches", {
    value: [createTouch(touch)],
  });
  Object.defineProperty(event, "touches", {
    value: activeTouches,
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

  it("ignores repeated keyboard menu navigation and activation events", () => {
    const controls = createControls();
    vi.mocked(controls.isMenuActive).mockReturnValue(true);
    const inputState = createInputState();
    const keyboard = new Keyboard1(controls, inputState);

    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 40 }));
    document.documentElement.dispatchEvent(
      new KeyboardEvent("keydown", { keyCode: 40, repeat: true })
    );
    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 13 }));
    document.documentElement.dispatchEvent(
      new KeyboardEvent("keydown", { keyCode: 13, repeat: true })
    );

    expect(controls.rotateToHeading).toHaveBeenCalledTimes(1);
    expect(controls.rotateToHeading).toHaveBeenCalledWith(180);
    expect(controls.startShooting).toHaveBeenCalledTimes(1);
    expect(inputState.down).toBe(false);

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

  it("maps the gamepad east face button to back while menus are active", async () => {
    const controls = createControls();
    const inputState = createInputState();
    vi.mocked(controls.isMenuActive).mockReturnValue(true);
    const gamepad = {
      axes: [0, 0],
      buttons: Array.from({ length: 16 }, () => ({ pressed: false })),
    };
    gamepad.buttons[1].pressed = true;
    vi.spyOn(navigator, "getGamepads").mockReturnValue([
      gamepad as unknown as globalThis.Gamepad,
    ]);

    const controller = new Gamepad(controls, inputState);
    await new Promise((resolve) => window.setTimeout(resolve, 5));
    controller.disconnect?.();

    expect(controls.goBack).toHaveBeenCalled();
    expect(controls.startShooting).not.toHaveBeenCalled();
    expect(inputState.menu).toBe(true);
    expect(inputState.fire).toBe(false);
  });

  it("snaps gamepad menu direction to one cardinal input and waits for release", async () => {
    const controls = createControls();
    const inputState = createInputState();
    vi.mocked(controls.isMenuActive).mockReturnValue(true);
    const gamepad = {
      axes: [0.35, 1],
      buttons: Array.from({ length: 16 }, () => ({ pressed: false })),
    };
    vi.spyOn(navigator, "getGamepads").mockReturnValue([
      gamepad as unknown as globalThis.Gamepad,
    ]);

    const controller = new Gamepad(controls, inputState);
    await new Promise((resolve) => window.setTimeout(resolve, 5));
    controller.disconnect?.();

    expect(controls.rotateToHeading).toHaveBeenCalledTimes(1);
    expect(controls.rotateToHeading).toHaveBeenCalledWith(180);
    expect(inputState.down).toBe(true);
    expect(inputState.right).toBe(false);
  });

  it("ignores menu gamepad stick drift while another controller is active", async () => {
    const controls = createControls();
    const inputState = createInputState();
    vi.mocked(controls.isMenuActive).mockReturnValue(true);
    const gamepad = {
      axes: [0.35, 0.3],
      buttons: Array.from({ length: 16 }, () => ({ pressed: false })),
    };
    vi.spyOn(navigator, "getGamepads").mockReturnValue([
      gamepad as unknown as globalThis.Gamepad,
    ]);

    const controller = new Gamepad(controls, inputState);
    await new Promise((resolve) => window.setTimeout(resolve, 5));
    controller.disconnect?.();

    expect(controls.rotateToHeading).not.toHaveBeenCalled();
    expect(inputState.down).toBe(false);
    expect(inputState.right).toBe(false);
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

  it("uses F to toggle fullscreen before gameplay or menu actions", () => {
    const controls = createControls();
    const inputState = createInputState();
    const keyboard = new Keyboard1(controls, inputState);

    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 70 }));

    expect(controls.toggleFullScreen).toHaveBeenCalledTimes(1);
    expect(controls.startShooting).not.toHaveBeenCalled();
    expect(controls.openMenu).not.toHaveBeenCalled();

    keyboard.disconnect?.();
  });

  it("keeps F fullscreen behavior in the alternate keyboard controller", () => {
    const controls = createControls();
    const inputState = createInputState();
    const keyboard = new Keyboard2(controls, inputState);

    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 70 }));

    expect(controls.toggleFullScreen).toHaveBeenCalledTimes(1);
    expect(controls.startShooting).not.toHaveBeenCalled();

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
      source: "mouse",
      type: "move",
    });
    expect(controls.handlePointer).toHaveBeenCalledWith({
      posX: 0,
      posY: 0,
      source: "mouse",
      type: "press",
    });
    expect(controls.handlePointer).toHaveBeenCalledWith({
      posX: 0,
      posY: 0,
      source: "mouse",
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
      source: "mouse",
      type: "press",
    });
    expect(controls.handlePointer).toHaveBeenCalledWith({
      posX: 100,
      posY: 0,
      source: "mouse",
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
      source: "mouse",
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
      source: "mouse",
      type: "release",
    });
    expect(controls.handlePointer).toHaveBeenLastCalledWith({
      posX: 0,
      posY: 0,
      source: "mouse",
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
      source: "mouse",
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
    expect(inputState.touchOrigin).toEqual({ posX: 200, posY: 100 });
    expect(inputState.touchCurrent).toEqual({ posX: 200, posY: 100 });

    dispatchTouch(canvas, "touchmove", { clientX: 300, clientY: 120 });
    expect(controls.rotateToHeading).toHaveBeenCalledWith(0);
    expect(inputState.up).toBe(true);
    expect(inputState.activeController).toBe("touch");
    expect(inputState.touchCurrent).toEqual({ posX: 200, posY: -60 });

    dispatchTouch(canvas, "touchmove", { clientX: 380, clientY: 200 });
    expect(controls.rotateToHeading).toHaveBeenCalledWith(90);
    expect(inputState.right).toBe(true);

    dispatchTouch(canvas, "touchend", { clientX: 380, clientY: 200 });
    expect(controls.stopShooting).toHaveBeenCalled();
    expect(inputState.fire).toBe(false);
    expect(inputState.right).toBe(false);
    expect(inputState.touchOrigin).toBeNull();
    expect(inputState.touchCurrent).toBeNull();
    expect(controls.stop).not.toHaveBeenCalled();

    touch.disconnect?.();
  });

  it("fails loudly if touch movement is resolved without an origin", () => {
    const controls = createControls();
    const canvas = document.createElement("canvas");
    const touch = new TouchController(canvas, controls);
    const touchWithPrivateAccess = touch as unknown as {
      getRelativePoint: (point: { posX: number; posY: number }) => {
        posX: number;
        posY: number;
      };
    };

    expect(() =>
      touchWithPrivateAccess.getRelativePoint({ posX: 10, posY: 10 })
    ).toThrow("Touch movement cannot be resolved without a touch origin.");

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
      source: "touch",
      type: "press",
    });
    expect(controls.handlePointer).toHaveBeenCalledWith({
      posX: 40,
      posY: 20,
      source: "touch",
      type: "drag",
    });
    expect(controls.handlePointer).toHaveBeenCalledWith({
      posX: 40,
      posY: 20,
      source: "touch",
      type: "release",
    });
    expect(controls.rotateToHeading).not.toHaveBeenCalled();

    touch.disconnect?.();
  });

  it("maps two-finger touch taps to the main menu", () => {
    const controls = createControls();
    const inputState = createInputState();
    const canvas = document.createElement("canvas");
    const touch = new TouchController(canvas, controls, inputState);
    const touches = [
      { clientX: 100, clientY: 100, identifier: 1 },
      { clientX: 160, clientY: 100, identifier: 2 },
    ];

    dispatchTouch(canvas, "touchstart", touches[1], touches);
    dispatchTouch(canvas, "touchend", touches[1], []);

    expect(controls.openMainMenu).toHaveBeenCalledTimes(1);
    expect(inputState.activeController).toBe("touch");
    expect(inputState.menu).toBe(true);

    touch.disconnect?.();
  });

  it("maps three-finger touch taps to restart confirmation", () => {
    const controls = createControls();
    const inputState = createInputState();
    const canvas = document.createElement("canvas");
    const touch = new TouchController(canvas, controls, inputState);
    const touches = [
      { clientX: 100, clientY: 100, identifier: 1 },
      { clientX: 160, clientY: 100, identifier: 2 },
      { clientX: 130, clientY: 150, identifier: 3 },
    ];

    dispatchTouch(canvas, "touchstart", touches[2], touches);
    dispatchTouch(canvas, "touchend", touches[2], []);

    expect(controls.requestRestartConfirmation).toHaveBeenCalledTimes(1);
    expect(controls.restart).not.toHaveBeenCalled();
    expect(inputState.activeController).toBe("touch");
    expect(inputState.restart).toBe(true);

    touch.disconnect?.();
  });

  it("pinch zooms the UI and game together in small steps", () => {
    const controls = createControls();
    const inputState = createInputState();
    const canvas = document.createElement("canvas");
    const touch = new TouchController(canvas, controls, inputState);
    const startTouches = [
      { clientX: 100, clientY: 100, identifier: 1 },
      { clientX: 200, clientY: 100, identifier: 2 },
    ];
    const movedTouches = [
      { clientX: 80, clientY: 100, identifier: 1 },
      { clientX: 220, clientY: 100, identifier: 2 },
    ];

    dispatchTouch(canvas, "touchstart", startTouches[1], startTouches);
    dispatchTouch(canvas, "touchmove", movedTouches[1], movedTouches);
    dispatchTouch(canvas, "touchend", movedTouches[1], []);

    expect(userOptions.uiZoom).toBe(110);
    expect(userOptions.gameZoom).toBe(110);
    expect(controls.openMainMenu).not.toHaveBeenCalled();
    expect(inputState.activeController).toBe("touch");

    touch.disconnect?.();
  });
});
