/* Converted from TimePilot.EnemyFactory.js (AMD) to ESM TypeScript. */
import { levels } from "./constants";
import Enemy from "./enemy";
import { getScaledEntityLimit } from "./viewport";
import type {
  EnemyConfig,
  EnemyData,
  EnemyFactoryInstance,
  EnemyInstance,
  EnemySpawnOptions,
  GameDataStore,
  Heading,
} from "./types";

/**
 * Owns active enemy instances and exposes level-specific enemy data.
 */
class EnemyFactory implements EnemyFactoryInstance {
  private _context: GameDataStore;
  private _enemies: EnemyInstance[] = [];

  constructor(context: GameDataStore) {
    this._context = context;
  }

  create = (posX: number, posY: number, heading: Heading, options: EnemySpawnOptions = {}): void => {
    this._enemies.push(new Enemy(this._context, posX, posY, heading, options));
  };

  getLevelData(): EnemyConfig;
  getLevelData<K extends keyof EnemyConfig>(key: K): EnemyConfig[K] | undefined;
  getLevelData<K extends keyof EnemyConfig>(key?: K) {
    const data = levels[this._context._level].enemies.basic;

    if (key) {
      return data[key];
    }

    return data;
  }

  getCount = (): number => {
    return this._enemies.length;
  };

  isUnderLimit = (): boolean => {
    return (
      this._enemies.length <
      getScaledEntityLimit(
        this.getLevelData("spawnLimit")!,
        this._context._gameArena
      )
    );
  };

  getData = (): EnemyData[] => {
    return this._enemies.map((enemy) => enemy.getData() as EnemyData);
  };

  getEntities = (): EnemyInstance[] => {
    return [...this._enemies];
  };

  cleanup = (): void => {
    this._enemies.forEach((enemy) => {
      const formationId = enemy.getData("formationId");

      if (
        enemy.removeMe &&
        enemy.isAlive &&
        typeof formationId === "string" &&
        this._context._formations[formationId]
      ) {
        this._context._formations[formationId].escaped = true;
      }

      if (enemy.removeMe) {
        enemy.destroy();
      }
    });

    this._enemies = this._enemies.filter((enemy) => !enemy.removeMe);
  };

  reposition = (): void => {
    this._enemies.forEach((enemy) => enemy.reposition());
  };

  render = (): void => {
    this._enemies.forEach((enemy) => enemy.render());
  };

  private _despawn = (entityId: number): void => {
    this._enemies[entityId]?.destroy();
    this._enemies.splice(entityId, 1);
  };

  clearAll = (): void => {
    while (this._enemies.length) {
      this._despawn(0);
    }
  };
}

export default EnemyFactory;
