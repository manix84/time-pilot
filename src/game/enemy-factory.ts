/* Converted from TimePilot.EnemyFactory.js (AMD) to ESM TypeScript. */
import CONSTS from "./constants";
import Enemy from "./enemy";
import type {
  EnemyConfig,
  EnemyData,
  EnemyFactoryInstance,
  EnemyInstance,
  GameDataStore,
  Heading,
} from "./types";

class EnemyFactory implements EnemyFactoryInstance {
  private _context: GameDataStore;
  private _enemies: EnemyInstance[] = [];
  private _level: number;

  constructor(context: GameDataStore) {
    this._context = context;
    this._level = context._level;
  }

  create(posX: number, posY: number, heading: Heading): void {
    this._enemies.push(new Enemy(this._context, posX, posY, heading));
  }

  getLevelData(): EnemyConfig;
  getLevelData<K extends keyof EnemyConfig>(key: K): EnemyConfig[K] | undefined;
  getLevelData<K extends keyof EnemyConfig>(key?: K) {
    const data = CONSTS.levels[this._level].enemies.basic;

    if (key) {
      return data[key];
    }

    return data;
  }

  getCount(): number {
    return this._enemies.length;
  }

  isUnderLimit(): boolean {
    return this._enemies.length < this.getLevelData("spawnLimit")!;
  }

  getData(): EnemyData[] {
    return this._enemies.map((enemy) => enemy.getData() as EnemyData);
  }

  getEntities(): EnemyInstance[] {
    return [...this._enemies];
  }

  cleanup(): void {
    this._enemies = this._enemies.filter((enemy) => !enemy.removeMe);
  }

  reposition(): void {
    this._enemies.forEach((enemy) => enemy.reposition());
  }

  render(): void {
    this._enemies.forEach((enemy) => enemy.render());
  }

  private _despawn(entityId: number): void {
    this._enemies.splice(entityId, 1);
  }

  clearAll(): void {
    while (this._enemies.length) {
      this._despawn(0);
    }
  }
}

export default EnemyFactory;
