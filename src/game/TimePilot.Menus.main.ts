/* Converted from TimePilot.Menu.main.js (AMD) to ESM TypeScript. */
import type { MenuDefinition } from "./TimePilot.types";

var main: MenuDefinition = {
  name: "Welcome",
  buttons: {
    start: {
      name: "Start 1 Player",
      type: "button",
      callback: () => {},
    },
    controllerType: {
      name: "Contoller",
      type: "enum",
      options: {
        keyboard1: "Keyboard Set 1",
        keyboard2: "Keyboard Set 2",
        joystick: "Joystick/Gamepad",
        touch: "Touch Screen",
      },
      getValue: () => {},
      setValue: () => {},
    },
  },
};

export default main;
