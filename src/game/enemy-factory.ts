/* Converted from TimePilot.EnemyFactory.js (AMD) to ESM TypeScript. */
import CONSTS from "./constants";
import Enemy from "./enemy";
import SoundEngine from "./engine/Sound";
import type {
  EnemyConfig,
  EnemyData,
  EnemyFactoryInstance,
  EnemyInstance,
  GameDataStore,
  Heading,
} from "./types";

/**
 * Construct an enemy factory for managing creation, movement, rendering and removal of enemies.
 * @constructor
 * @returns {Enemy Factory Instance}
 */
var EnemyFactory = function (context: GameDataStore) {
  this._context = context;
  this._level = context._level;
  this._player = context._player;
  this._bullets = context._bullets;

  this._explosionSound = new SoundEngine(
    this.getLevelData().explosion.sound.src
  );

  this._enemies = [] as EnemyInstance[];
} as unknown as {
  new (context: GameDataStore): EnemyFactoryInstance;
  prototype: Record<string, unknown>;
};

EnemyFactory.prototype = {
  /**
   * Create an enemy instance and keep a record of it in the factory.
   * @method
   * @param   {Number} posX    - X coordinate to start from.
   * @param   {Number} posY    - Y coordinate to start from.
   * @param   {Number} heading - Heading to start from.
   */
  create: function (posX: number, posY: number, heading: Heading): void {
    this._enemies.push(new Enemy(this._context, posX, posY, heading));
  },

  /**
   * Get current data for this level
   * @method
   * @param {String} [key] [description]
   * @returns {object}
   */
  getLevelData: function (key?: keyof EnemyConfig) {
    var data = CONSTS.levels[this._level].enemies.basic;
    if (key) {
      if (data[key]) {
        return data[key];
      } else {
        return;
      }
    } else {
      return data;
    }
  },

  /**
   * Get the current number of spawned entities.
   * @method
   * @returns {Number}
   */
  getCount: function (): number {
    return this._enemies.length;
  },

  /**
   * Boolean flag reporting if there are spawns available for enemies.
   * @method
   * @returns {Boolean}
   */
  isUnderLimit: function (): boolean {
    return this._enemies.length < this.getLevelData("spawnLimit");
  },

  /**
   * Return the data for all entities in an array.
   * @method
   * @returns {Array}
   */
  getData: function (): EnemyData[] {
    var data: EnemyData[] = [],
      i = "";
    for (i in this._enemies) {
      if (this._enemies.hasOwnProperty(i)) {
        data.push(this._enemies[i].getData() as EnemyData);
      }
    }
    return data;
  },

  /**
   * Run player collision calculations on all entities.
   * @method
   */
  detectCollision: function (): void {
    var bullets = this._bullets.getData(),
      playerData = this._player.getData();

    for (var i in this._enemies) {
      if (
        this._enemies.hasOwnProperty(i) &&
        this._enemies[i].isAlive &&
        playerData.isAlive
      ) {
        if (
          this._enemies[i].detectCollision(
            playerData.posX,
            playerData.posY,
            CONSTS.player.hitRadius
          )
        ) {
          this._enemies[i].kill();
          this._explosionSound.stop();
          this._explosionSound.play();

          this._player.kill();
        }
        for (var j in bullets) {
          if (
            bullets.hasOwnProperty(j) &&
            this._enemies[i].detectCollision(
              bullets[j].posX + this._player.getData().posX,
              bullets[j].posY + this._player.getData().posY,
              CONSTS.player.projectile.size
            )
          ) {
            this._enemies[i].kill();
            this._explosionSound.stop();
            this._explosionSound.play();
          }
        }
      }
    }
  },

  /**
   * If an entity declares it is to be removed, remove it.
   * @method
   */
  cleanup: function (): void {
    var i;

    for (i in this._enemies) {
      if (this._enemies.hasOwnProperty(i) && this._enemies[i].removeMe) {
        this._despawn(Number(i));
      }
    }
  },

  /**
   * Run all reposition logic.
   * @method
   */
  reposition: function (): void {
    var i;

    for (i in this._enemies) {
      if (this._enemies.hasOwnProperty(i)) {
        this._enemies[i].reposition();
      }
    }
  },

  /**
   * Render all enemies on the gameArena.
   * @method
   */
  render: function (): void {
    var i = "";

    for (i in this._enemies) {
      if (this._enemies.hasOwnProperty(i)) {
        this._enemies[i].render();
      }
    }
  },

  /**
   * De-spawn specified entity.
   * @method
   * @param   {Number} entityId - Index ID of entity you wish to remove.
   */
  _despawn: function (entityId: number): void {
    this._enemies.splice(entityId, 1);
  },

  /**
   * Clear all enemies from memory.
   */
  clearAll: function (): void {
    for (var i in this._enemies) {
      if (this._enemies.hasOwnProperty(i)) {
        this._despawn(Number(i));
      }
    }
  },
};

export default EnemyFactory;
