import CONSTS from "../constants";
import helpers from "../engine/helpers";
import type { Coordinates, GameDataStore, SpawningSystemInstance } from "../types";
import { getSpawnRadius } from "../viewport";

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

    for (let i = 0; i < CONSTS.limits.props; i++) {
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
    if (this._context._props.getCount() >= CONSTS.limits.props) {
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
}

export default SpawningSystem;
