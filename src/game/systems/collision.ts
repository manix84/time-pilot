import { player } from "../constants";
import helpers from "../engine/helpers";
import type {
  BulletData,
  BulletInstance,
  CollisionSystemInstance,
  GameDataStore,
} from "../types";

class CollisionSystem implements CollisionSystemInstance {
  private _context: GameDataStore;

  constructor(context: GameDataStore) {
    this._context = context;
  }

  detectCollisions = (): void => {
    if (this.isLevelIntroActive()) {
      return;
    }

    const bullets = this._context._bullets.getEntities();
    const playerData = this._context._player.getData();

    this._detectShootableProjectileHits(bullets);

    if (!this._context._isDemoMode && playerData.isAlive) {
      this._context._enemyBullets.getEntities().forEach((bullet) => {
        if (bullet.removeMe) {
          return;
        }

        const bulletData = bullet.getData() as BulletData;

        if (bulletData.explosionTick !== false) {
          return;
        }

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
          bullet.explode();
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
        this._context._player.kill();
      }

      bullets.forEach((bullet) => {
        if (bullet.removeMe) {
          return;
        }

        const bulletData = bullet.getData() as BulletData;

        if (bulletData.explosionTick !== false) {
          return;
        }

        if (
          enemy.detectCollision(
            bulletData.posX + this._context._player.getData().posX,
            bulletData.posY + this._context._player.getData().posY,
            bulletData.size
          )
        ) {
          bullet.removeMe = true;
          enemy.kill();
        }
      });
    });
  };

  private _detectShootableProjectileHits = (
    bullets: BulletInstance[]
  ): void => {
    const playerData = this._context._player.getData();
    const enemyBullets = this._context._enemyBullets.getEntities();

    enemyBullets.forEach((enemyBullet) => {
      if (enemyBullet.removeMe) {
        return;
      }

      const enemyBulletData = enemyBullet.getData() as BulletData;

      if (enemyBulletData.explosionTick !== false) {
        return;
      }

      if (!enemyBulletData.shootable) {
        return;
      }

      const enemyBulletPosition =
        enemyBulletData.coordinateSpace === "world"
          ? { posX: enemyBulletData.posX, posY: enemyBulletData.posY }
          : {
            posX: enemyBulletData.posX + playerData.posX,
            posY: enemyBulletData.posY + playerData.posY,
          };

      bullets.forEach((bullet) => {
        if (bullet.removeMe || enemyBullet.removeMe) {
          return;
        }

        const bulletData = bullet.getData() as BulletData;

        if (bulletData.explosionTick !== false) {
          return;
        }

        if (
          helpers.detectCollision(
            {
              posX: bulletData.posX + playerData.posX,
              posY: bulletData.posY + playerData.posY,
              radius: bulletData.size,
            },
            {
              posX: enemyBulletPosition.posX,
              posY: enemyBulletPosition.posY,
              radius: enemyBulletData.size,
            }
          )
        ) {
          bullet.removeMe = true;
          enemyBullet.explode();
        }
      });
    });
  };

  private isLevelIntroActive = (): boolean => {
    return (
      !!this._context._levelIntroUntilTick &&
      this._context._gameTicker.getTicks() < this._context._levelIntroUntilTick
    );
  };
}

export default CollisionSystem;
