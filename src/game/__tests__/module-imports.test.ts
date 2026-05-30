import { describe, expect, it } from "vitest";

import Bonus from "../bonus";
import BonusFactory from "../bonus-factory";
import Bullet from "../bullet";
import BulletFactory from "../bullet-factory";
import constants from "../constants";
import ControllerInterface from "../controller-interface";
import Gamepad from "../controller/gamepad";
import Keyboard1 from "../controller/keyboard1";
import Keyboard2 from "../controller/keyboard2";
import Mouse from "../controller/mouse";
import Enemy from "../enemy";
import EnemyFactory from "../enemy-factory";
import Hud from "../hud";
import { availableLanguages, getLanguageName } from "../i18n";
import TimePilot from "../index";
import Menus from "../menus";
import Player from "../player";
import Prop from "../prop";
import PropFactory from "../prop-factory";
import userOptions from "../user-options";

const engineSourceFiles = import.meta.glob<string>(
  "../../../packages/arcade-engine/src/**/*.ts",
  {
    eager: true,
    import: "default",
    query: "?raw",
  }
);

const getStaticImportSpecifiers = (source: string): string[] =>
  Array.from(source.matchAll(/\bfrom\s+["']([^"']+)["']/g), (match) => match[1]);

describe("game module imports", () => {
  it("loads every game module", () => {
    expect(Bonus).toBeTypeOf("function");
    expect(BonusFactory).toBeTypeOf("function");
    expect(Bullet).toBeTypeOf("function");
    expect(BulletFactory).toBeTypeOf("function");
    expect(constants.player.width).toBeGreaterThan(0);
    expect(constants.scoring.regularEnemy).toBe(100);
    expect(constants.scoring.missile).toBe(100);
    expect(constants.scoring.boss).toBe(3000);
    expect(constants.scoring.bomber1940).toBe(1500);
    expect(constants.scoring.formationBonus).toBe(2000);
    expect(constants.scoring.parachute).toEqual({
      min: 1000,
      max: 5000,
      step: 1000,
    });
    expect(constants.levels[1].enabled).toBe(true);
    expect(constants.levels[1].enemies.formations.map(({ name }) => name)).toEqual([
      "v",
      "horizontal-sweep",
      "curved-arc",
    ]);
    expect(constants.levels[2].enabled).toBe(true);
    expect(constants.levels[2].enemies.formations.map(({ name }) => name)).toEqual([
      "arrowhead",
      "crossing-squadron-left",
      "crossing-squadron-right",
      "dive-bomb-split",
    ]);
    expect(constants.levels[3].enabled).toBe(true);
    expect(constants.levels[3].enemies.formations.map(({ name }) => name)).toEqual([
      "diamond",
      "serpentine-chain",
      "circular-orbit",
    ]);
    expect(constants.levels[4].enabled).toBe(true);
    expect(constants.levels[4].enemies.formations.map(({ name }) => name)).toEqual([
      "staggered-box",
      "spiral-entry",
      "fake-formation",
    ]);
    expect(constants.levels[5].enabled).toBe(true);
    expect(constants.levels[5].enemies.formations.map(({ name }) => name)).toEqual([
      "rotating-ring",
      "swarm-burst",
      "chasing-wave",
    ]);
    expect(constants.levels[5].props.map((prop) => prop.sprite.src)).toEqual([
      expect.stringContaining("asteroid1.png"),
      expect.stringContaining("asteroid2.png"),
      expect.stringContaining("asteroid3.png"),
    ]);
    expect(ControllerInterface).toBeTypeOf("function");
    expect(Gamepad).toBeTypeOf("function");
    expect(Keyboard1).toBeTypeOf("function");
    expect(Keyboard2).toBeTypeOf("function");
    expect(Mouse).toBeTypeOf("function");
    expect(Enemy).toBeTypeOf("function");
    expect(EnemyFactory).toBeTypeOf("function");
    expect(Hud).toBeTypeOf("function");
    expect(TimePilot).toBeTypeOf("function");
    expect(Menus).toBeTypeOf("function");
    expect(Player).toBeTypeOf("function");
    expect(Prop).toBeTypeOf("function");
    expect(PropFactory).toBeTypeOf("function");
    expect(userOptions.controllerType).toBe("keyboard1");
    expect(userOptions.gamepadEnabled).toBe(true);
  });

  it("lists Spanish between French and German", () => {
    expect(availableLanguages).toEqual(["en", "fr", "es", "de", "it", "nl", "ro"]);
    expect(getLanguageName("es")).toBe("Espanol");
  });

  it("keeps production engine modules independent from game modules", () => {
    const invalidImports = Object.entries(engineSourceFiles)
      .filter(([file]) => !file.includes("/__tests__/"))
      .flatMap(([file, source]) =>
        getStaticImportSpecifiers(source)
          .filter((specifier) => specifier.startsWith("../"))
          .map((specifier) => `${file} -> ${specifier}`)
      );

    expect(invalidImports).toEqual([]);
  });
});
