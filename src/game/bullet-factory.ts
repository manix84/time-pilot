/* Converted from TimePilot.BulletFactory.js (AMD) to ESM TypeScript. */
import Bullet from "./bullet";
import CONSTS from "./constants";
import SoundEngine from "./engine/Sound";
import type {
  BulletData,
  BulletFactoryInstance,
  BulletInstance,
  GameDataStore,
  Heading,
} from "./types";

class BulletFactory implements BulletFactoryInstance {
  private _bulletSound: SoundEngine;
  private _bullets: BulletInstance[] = [];
  private _context: GameDataStore;

  constructor(context: GameDataStore) {
    this._context = context;
    this._bulletSound = new SoundEngine(CONSTS.player.projectile.sound.src);
  }

  create(
    originX: number,
    originY: number,
    heading: Heading,
    size: number,
    velocity: number,
    color: string,
    playSound = true,
    coordinateSpace: BulletData["coordinateSpace"] = "screen",
    shape: BulletData["shape"] = "square",
    sprite?: BulletData["sprite"]
  ): void {
    this._bullets.push(
      new Bullet(
        this._context,
        originX,
        originY,
        heading,
        size,
        velocity,
        color,
        coordinateSpace,
        shape,
        sprite
      )
    );

    if (playSound) {
      this._bulletSound.stop();
      this._bulletSound.play();
    }
  }

  getCount(): number {
    return this._bullets.length;
  }

  getData(): BulletData[] {
    return this._bullets.map((bullet) => bullet.getData() as BulletData);
  }

  getEntities(): BulletInstance[] {
    return [...this._bullets];
  }

  cleanup(): void {
    this._bullets = this._bullets.filter((bullet) => !bullet.removeMe);
  }

  reposition(): void {
    this._bullets.forEach((bullet) => bullet.reposition());
  }

  render(): void {
    this._bullets.forEach((bullet) => bullet.render());
  }

  private _despawn(entityId: number): void {
    this._bullets.splice(entityId, 1);
  }

  clearAll(): void {
    while (this._bullets.length) {
      this._despawn(0);
    }
  }
}

export default BulletFactory;
