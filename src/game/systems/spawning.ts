import CONSTS from "../constants";
import helpers from "../engine/helpers";
import type { Coordinates, GameDataStore, SpawningSystemInstance } from "../types";

class SpawningSystem implements SpawningSystemInstance {
  private _context: GameDataStore;

  constructor(context: GameDataStore) {
    this._context = context;
  }

  addInitialProps(): void {
    for (let i = 0; i < CONSTS.limits.props; i++) {
      this._context._props.create(
        Math.floor(Math.random() * this._context._gameArena.width),
        Math.floor(Math.random() * this._context._gameArena.height)
      );
    }
  }

  spawnEntities(): void {
    this._spawnEnemy();
    this._spawnProp();
  }

  private _spawnEnemy(): void {
    const randomTickInterval = Math.floor(Math.random() * 200) + 1;

    if (
      this._context._gameTicker.getTicks() % randomTickInterval !== 0 ||
      !this._context._enemies.isUnderLimit()
    ) {
      return;
    }

    const data = helpers.getSpawnCoords(this._context._player.getData());
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
      this._context._player.getData()
    );
    this._context._props.create(data.posX, data.posY);
  }
}

export default SpawningSystem;
