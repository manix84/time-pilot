import CONSTS from "../constants";
import SoundEngine from "../engine/Sound";
import type { CollisionSystemInstance, GameDataStore } from "../types";

class CollisionSystem implements CollisionSystemInstance {
  private _context: GameDataStore;
  private _explosionSound: SoundEngine;

  constructor(context: GameDataStore) {
    this._context = context;
    this._explosionSound = new SoundEngine(
      CONSTS.levels[context._level].enemies.basic.explosion.sound.src
    );
  }

  detectCollisions(): void {
    if (this.isLevelIntroActive()) {
      return;
    }

    const bullets = this._context._bullets.getData();
    const playerData = this._context._player.getData();

    this._context._enemies.getEntities().forEach((enemy) => {
      if (!enemy.isAlive || !playerData.isAlive) {
        return;
      }

      if (
        !this._context._isDemoMode &&
        enemy.detectCollision(
          playerData.posX,
          playerData.posY,
          CONSTS.player.hitRadius
        )
      ) {
        enemy.kill();
        this._playExplosion();
        this._context._player.kill();
      }

      bullets.forEach((bullet) => {
        if (
          enemy.detectCollision(
            bullet.posX + this._context._player.getData().posX,
            bullet.posY + this._context._player.getData().posY,
            CONSTS.player.projectile.size
          )
        ) {
          enemy.kill();
          this._playExplosion();
        }
      });
    });
  }

  private _playExplosion(): void {
    this._explosionSound.stop();
    this._explosionSound.play();
  }

  private isLevelIntroActive(): boolean {
    return (
      !!this._context._levelIntroUntilTick &&
      this._context._gameTicker.getTicks() < this._context._levelIntroUntilTick
    );
  }
}

export default CollisionSystem;
