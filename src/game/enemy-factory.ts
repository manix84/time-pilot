/* Converted from TimePilot.EnemyFactory.js (AMD) to ESM TypeScript. */
import CONSTS from "./constants";
import Enemy from "./enemy";
import SoundEngine from "./engine/Sound";
import type {
  BulletFactoryInstance,
  EnemyConfig,
  EnemyData,
  EnemyFactoryInstance,
  EnemyInstance,
  GameDataStore,
  Heading,
  PlayerInstance,
} from "./types";

class EnemyFactory implements EnemyFactoryInstance {
  private _bullets: BulletFactoryInstance;
  private _context: GameDataStore;
  private _enemies: EnemyInstance[] = [];
  private _explosionSound: SoundEngine;
  private _level: number;
  private _player: PlayerInstance;

  constructor(context: GameDataStore) {
    this._context = context;
    this._level = context._level;
    this._player = context._player;
    this._bullets = context._bullets;
    this._explosionSound = new SoundEngine(
      this.getLevelData().explosion.sound.src
    );
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

  detectCollision(): void {
    const bullets = this._bullets.getData();
    const playerData = this._player.getData();

    this._enemies.forEach((enemy) => {
      if (!enemy.isAlive || !playerData.isAlive) {
        return;
      }

      if (
        enemy.detectCollision(
          playerData.posX,
          playerData.posY,
          CONSTS.player.hitRadius
        )
      ) {
        enemy.kill();
        this._explosionSound.stop();
        this._explosionSound.play();
        this._player.kill();
      }

      bullets.forEach((bullet) => {
        if (
          enemy.detectCollision(
            bullet.posX + this._player.getData().posX,
            bullet.posY + this._player.getData().posY,
            CONSTS.player.projectile.size
          )
        ) {
          enemy.kill();
          this._explosionSound.stop();
          this._explosionSound.play();
        }
      });
    });
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
