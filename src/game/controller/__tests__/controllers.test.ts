import { beforeEach, describe, expect, it, vi } from "vitest";
import Gamepad from "../gamepad";
import Keyboard1 from "../keyboard1";
import Keyboard2 from "../keyboard2";
import type { ControllerInterfaceInstance } from "../../types";

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
  };
}

describe("controller modules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps keyboard set 1 keys to controller actions", () => {
    const controls = createControls();
    const keyboard = new Keyboard1(controls);

    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 37 }));
    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 32 }));
    document.documentElement.dispatchEvent(new KeyboardEvent("keyup", { keyCode: 32 }));

    expect(controls.rotateToHeading).toHaveBeenCalledWith(270);
    expect(controls.startShooting).toHaveBeenCalled();
    expect(controls.stopShooting).toHaveBeenCalled();

    keyboard.disconnect?.();
  });

  it("maps keyboard set 2 keys to rotational controls", () => {
    const controls = createControls();
    const keyboard = new Keyboard2(controls);

    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 37 }));
    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 39 }));
    document.documentElement.dispatchEvent(new KeyboardEvent("keyup", { keyCode: 39 }));

    expect(controls.rotateAntiClockwise).toHaveBeenCalled();
    expect(controls.rotateClockwise).toHaveBeenCalled();
    expect(controls.stop).toHaveBeenCalled();

    keyboard.disconnect?.();
  });

  it("polls gamepad state and disconnects its animation frame", async () => {
    const controls = createControls();
    const gamepad = {
      axes: [1, 0],
      buttons: Array.from({ length: 10 }, () => ({ pressed: false })),
    };
    gamepad.buttons[0].pressed = true;
    vi.spyOn(navigator, "getGamepads").mockReturnValue([
      gamepad as unknown as globalThis.Gamepad,
    ]);

    const controller = new Gamepad(controls);
    await new Promise((resolve) => window.setTimeout(resolve, 5));
    controller.disconnect?.();

    expect(controls.startShooting).toHaveBeenCalled();
    expect(controls.rotateToHeading).toHaveBeenCalled();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });
});
