import { levels, player } from "../constants";
import SoundEngine from "../engine/Sound";
import helpers from "../engine/helpers";
import type { BulletData, CollisionSystemInstance, GameDataStore } from "../types";

class CollisionSystem implements CollisionSystemInstance {
  private _context: GameDataStore;
  private _explosionSound: SoundEngine;

  constructor(context: GameDataStore) {
    this._context = context;
    this._explosionSound = new SoundEngine(
      levels[context._level].enemies.basic.explosion.sound.src
    );
  }

  detectCollisions = (): void => {
    if (this.isLevelIntroActive()) {
      return;
    }

    const bullets = this._context._bullets.getEntities();
    const playerData = this._context._player.getData();

    if (!this._context._isDemoMode && playerData.isAlive) {
      this._context._enemyBullets.getEntities().forEach((bullet) => {
        const bulletData = bullet.getData() as BulletData;
        const bulletPosition =
          bulletData.coordinateSpace === "world"
            ? { posX: bulletData.posX, posY: bulletData.posY }
            : {
              posX: bulletData.posX + playerData.posX,
              posY: bulletData.posY + playerData.posY,
            };

        if (
          helpers.detectCollision(
            {
              posX: bulletPosition.posX,
              posY: bulletPosition.posY,
              radius: bulletData.size,
            },
            {
              posX: playerData.posX,
              posY: playerData.posY,
              radius: player.hitRadius,
            }
          )
        ) {
          bullet.removeMe = true;
          this._context._player.kill();
        }
      });

      if (!this._context._player.getData("isAlive")) {
        return;
      }
    }

    this._context._bonuses.getEntities().forEach((bonus) => {
      if (!playerData.isAlive || bonus.removeMe) {
        return;
      }

      if (
        bonus.detectCollision(
          playerData.posX,
          playerData.posY,
          player.hitRadius
        )
      ) {
        bonus.collect();
      }
    });

    this._context._enemies.getEntities().forEach((enemy) => {
      if (!enemy.isAlive || !playerData.isAlive) {
        return;
      }

      if (
        !this._context._isDemoMode &&
        enemy.detectCollision(
          playerData.posX,
          playerData.posY,
          player.hitRadius
        )
      ) {
        enemy.kill();
        if (!enemy.isAlive) {
          this._playExplosion();
        }
        this._context._player.kill();
      }

      bullets.forEach((bullet) => {
        if (bullet.removeMe) {
          return;
        }

        const bulletData = bullet.getData() as BulletData;

        if (
          enemy.detectCollision(
            bulletData.posX + this._context._player.getData().posX,
            bulletData.posY + this._context._player.getData().posY,
            bulletData.size
          )
        ) {
          bullet.removeMe = true;
          enemy.kill();
          if (!enemy.isAlive) {
            this._playExplosion();
          }
        }
      });
    });
  };

  private _playExplosion = (): void => {
    this._explosionSound.stop();
    this._explosionSound.play();
  };

  private isLevelIntroActive = (): boolean => {
    return (
      !!this._context._levelIntroUntilTick &&
      this._context._gameTicker.getTicks() < this._context._levelIntroUntilTick
    );
  };
}

export default CollisionSystem;
