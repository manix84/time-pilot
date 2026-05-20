import { levels, player } from "../constants";
import helpers from "../engine/helpers";
import type {
  BulletData,
  BulletInstance,
  CollisionSystemInstance,
  EnemyData,
  EnemyInstance,
  GameDataStore,
} from "../types";

const nearMissClearance = 18;

/**
 * Detects collisions between player, enemies, bullets, and bonuses.
 */
class CollisionSystem implements CollisionSystemInstance {
  private _context: GameDataStore;
  private _nearMissedEnemyBullets = new WeakSet<BulletInstance>();
  private _nearMissedEnemies = new WeakSet<EnemyInstance>();

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

    if (playerData.isAlive) {
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

        const bulletHitRadius = bulletData.size + player.hitRadius;
        const bulletDistanceSquared = this.getDistanceSquared(
          bulletPosition.posX - playerData.posX,
          bulletPosition.posY - playerData.posY
        );

        if (bulletDistanceSquared <= bulletHitRadius ** 2) {
          const wasAlive = playerData.isAlive;
          bullet.explode();
          this._context._player.kill();

          if (wasAlive && !this._context._player.getData("isAlive")) {
            if (!this._context._isDemoMode) {
              this._context._runStats.playerProjectileHits += 1;
            }
            this._context._achievements?.onPlayerHit(
              "projectile",
              this._context._player.getData()
            );
          }
        } else {
          this._trackNearMiss(
            bullet,
            this._nearMissedEnemyBullets,
            bulletDistanceSquared,
            bulletHitRadius
          );
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

      if (enemy.detectCollision(playerData.posX, playerData.posY, player.hitRadius)) {
        const enemyData = enemy.getData() as EnemyData;
        const wasPlayerAlive = playerData.isAlive;
        enemy.kill();
        this._context._player.kill();

        if (
          wasPlayerAlive &&
          !this._context._isDemoMode &&
          !this._context._player.getData("isAlive")
        ) {
          this._context._runStats.playerEnemyCollisions += 1;
        }

        if (!enemy.isAlive) {
          this._context._achievements?.onEnemyDestroyed({
            enemyData,
            playerData,
            source: "collision",
          });
        }

        if (wasPlayerAlive && !this._context._player.getData("isAlive")) {
          this._context._achievements?.onPlayerHit(
            "enemy",
            this._context._player.getData()
          );
        }
      } else {
        const enemyData = enemy.getData() as EnemyData;
        const levelData =
          levels[this._context._level].enemies[enemyData.type] ??
          levels[this._context._level].enemies.basic;
        const enemyDistanceSquared = this.getDistanceSquared(
          enemyData.posX - playerData.posX,
          enemyData.posY - playerData.posY
        );

        this._trackNearMiss(
          enemy,
          this._nearMissedEnemies,
          enemyDistanceSquared,
          player.hitRadius + levelData.hitRadius
        );
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
          const enemyData = enemy.getData() as EnemyData;
          bullet.removeMe = true;
          enemy.kill();
          if (!this._context._isDemoMode) {
            this._context._runStats.shotsHit += 1;
          }

          if (!enemy.isAlive) {
            this._context._achievements?.onEnemyDestroyed({
              enemyData,
              playerData: this._context._player.getData(),
              source: "playerBullet",
            });
          }
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
          if (!this._context._isDemoMode) {
            this._context._runStats.shotsHit += 1;
            this._context._runStats.shootableProjectilesDestroyed += 1;
          }
          this._context._achievements?.onShootableProjectileDestroyed();
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

  private _trackNearMiss = <T extends object>(
    entity: T,
    seen: WeakSet<T>,
    distanceSquared: number,
    hitRadius: number
  ): void => {
    const nearMissRadius = hitRadius + nearMissClearance;

    if (
      this._context._isDemoMode ||
      seen.has(entity) ||
      distanceSquared > nearMissRadius ** 2
    ) {
      return;
    }

    seen.add(entity);
    this._context._runStats.nearMisses += 1;
  };

  private getDistanceSquared = (deltaX: number, deltaY: number): number =>
    deltaX * deltaX + deltaY * deltaY;
}

export default CollisionSystem;
