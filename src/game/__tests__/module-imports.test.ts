import { describe, expect, it } from "vitest";

import Bonus from "../bonus";
import Bullet from "../bullet";
import BulletFactory from "../bullet-factory";
import constants from "../constants";
import ControllerInterface from "../controller-interface";
import Gamepad from "../controller/gamepad";
import Keyboard1 from "../controller/keyboard1";
import Keyboard2 from "../controller/keyboard2";
import Enemy from "../enemy";
import EnemyFactory from "../enemy-factory";
import Hud from "../hud";
import TimePilot from "../index";
import Menus from "../menus";
import debugMenu from "../menus/debug";
import mainMenu from "../menus/main";
import pauseMenu from "../menus/pause";
import Player from "../player";
import Prop from "../prop";
import PropFactory from "../prop-factory";
import userOptions from "../user-options";

describe("game module imports", () => {
  it("loads every game module", () => {
    expect(Bonus).toBeTypeOf("function");
    expect(Bullet).toBeTypeOf("function");
    expect(BulletFactory).toBeTypeOf("function");
    expect(constants.player.width).toBeGreaterThan(0);
    expect(ControllerInterface).toBeTypeOf("function");
    expect(Gamepad).toBeTypeOf("function");
    expect(Keyboard1).toBeTypeOf("function");
    expect(Keyboard2).toBeTypeOf("function");
    expect(Enemy).toBeTypeOf("function");
    expect(EnemyFactory).toBeTypeOf("function");
    expect(Hud).toBeTypeOf("function");
    expect(TimePilot).toBeTypeOf("function");
    expect(Menus).toBeTypeOf("function");
    expect(debugMenu.buttons.invincible.type).toBe("toggle");
    expect(mainMenu.buttons.start.type).toBe("button");
    expect(pauseMenu.buttons.musicVolume.type).toBe("slider");
    expect(Player).toBeTypeOf("function");
    expect(Prop).toBeTypeOf("function");
    expect(PropFactory).toBeTypeOf("function");
    expect(userOptions.controllerType).toBe("Keyboard1");
  });
});

