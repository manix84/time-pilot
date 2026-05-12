import CONSTS from "../constants";
import helpers from "../engine/helpers";
import type {
  Coordinates,
  EnemyData,
  GameDataStore,
  SpawningSystemInstance,
} from "../types";
import { getScaledEntityLimit, getSpawnRadius } from "../viewport";

const bonusSpawnIntervalMinTicks = 600;
const bonusSpawnIntervalRangeTicks = 600;
const bonusSpawnPadding = 48;
const enemyFireIntervalTicks = 20;

class SpawningSystem implements SpawningSystemInstance {
  private _context: GameDataStore;

  constructor(context: GameDataStore) {
    this._context = context;
  }

  addInitialProps(): void {
    const player = this._context._player.getData();
    const halfWidth = this._context._gameArena.width / 2;
    const halfHeight = this._context._gameArena.height / 2;
    const spawnPadding = 96;

    for (let i = 0; i < this.getPropLimit(); i++) {
      this._context._props.create(
        player.posX +
          Math.floor(
            Math.random() * (this._context._gameArena.width + spawnPadding * 2)
          ) -
          halfWidth -
          spawnPadding,
        player.posY +
          Math.floor(
            Math.random() * (this._context._gameArena.height + spawnPadding * 2)
          ) -
          halfHeight -
          spawnPadding
      );
    }
  }

  spawnEntities(): void {
    if (this.isLevelIntroActive()) {
      return;
    }

    this._spawnEnemy();
    this._spawnProp();
    this._spawnEnemyBullet();
    this._spawnBonus();
  }

  private isLevelIntroActive(): boolean {
    return (
      !!this._context._levelIntroUntilTick &&
      this._context._gameTicker.getTicks() < this._context._levelIntroUntilTick
    );
  }

  private _spawnEnemy(): void {
    const randomTickInterval = Math.floor(Math.random() * 200) + 1;

    if (
      this._context._gameTicker.getTicks() % randomTickInterval !== 0 ||
      !this._context._enemies.isUnderLimit()
    ) {
      return;
    }

    const data = helpers.getSpawnCoords(this._context._player.getData(), {
      spawnRadius: getSpawnRadius(this._context._gameArena),
    });
    const heading = helpers.findHeading(data, {
      posX: this._context._player.getData().posX,
      posY: this._context._player.getData().posY,
    });

    this._context._enemies.create(data.posX, data.posY, heading);
  }

  private _spawnProp(): void {
    if (this._context._props.getCount() >= this.getPropLimit()) {
      return;
    }

    const data: Coordinates = helpers.getSpawnCoords(
      this._context._player.getData(),
      {
        spawnRadius: getSpawnRadius(this._context._gameArena),
      }
    );
    this._context._props.create(data.posX, data.posY);
  }

  private _spawnEnemyBullet(): void {
    if (
      this._context._enemyBullets.getCount() >=
        getScaledEntityLimit(
          CONSTS.limits.enemyBullets,
          this._context._gameArena
        ) ||
      this._context._gameTicker.getTicks() % enemyFireIntervalTicks !== 0
    ) {
      return;
    }

    const levelData = CONSTS.levels[this._context._level].enemies.basic;

    if (Math.random() > levelData.firingChance) {
      return;
    }

    const enemies = this._context._enemies
      .getEntities()
      .filter((enemy) => enemy.isAlive)
      .map((enemy) => enemy.getData() as EnemyData);

    if (!enemies.length) {
      return;
    }

    const player = this._context._player.getData();
    const enemy = enemies[Math.floor(Math.random() * enemies.length)];
    const heading = helpers.findHeading(enemy, {
      posX: player.posX,
      posY: player.posY,
    });

    this._context._enemyBullets.create(
      enemy.posX,
      enemy.posY,
      heading,
      levelData.projectile.size,
      levelData.projectile.velocity,
      levelData.projectile.color,
      false,
      "world",
      "circle"
    );
  }

  private _spawnBonus(): void {
    if (this._context._bonuses.getCount() >= CONSTS.limits.bonuses) {
      return;
    }

    const randomTickInterval =
      Math.floor(Math.random() * bonusSpawnIntervalRangeTicks) +
      bonusSpawnIntervalMinTicks;

    if (this._context._gameTicker.getTicks() % randomTickInterval !== 0) {
      return;
    }

    const data = this._getBonusSpawnCoords();
    this._context._bonuses.create(data.posX, data.posY);
  }

  private _getBonusSpawnCoords(): Coordinates {
    const player = this._context._player.getData();
    const halfWidth = this._context._gameArena.width / 2;
    const halfHeight = this._context._gameArena.height / 2;
    const side = Math.floor(Math.random() * 3);

    if (side === 1) {
      return {
        posX: player.posX - halfWidth - bonusSpawnPadding,
        posY: player.posY - halfHeight + Math.random() * halfHeight,
      };
    }

    if (side === 2) {
      return {
        posX: player.posX + halfWidth + bonusSpawnPadding,
        posY: player.posY - halfHeight + Math.random() * halfHeight,
      };
    }

    return {
      posX:
        player.posX - halfWidth + Math.random() * this._context._gameArena.width,
      posY: player.posY - halfHeight - bonusSpawnPadding,
    };
  }

  private getPropLimit(): number {
    return getScaledEntityLimit(CONSTS.limits.props, this._context._gameArena);
  }
}

export default SpawningSystem;
