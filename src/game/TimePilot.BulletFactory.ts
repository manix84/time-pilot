/* Converted from TimePilot.BulletFactory.js (AMD) to ESM TypeScript. */
import Bullet from "./TimePilot.Bullet";
import CONSTS from "./TimePilot.CONSTANTS";
import SoundEngine from "./engine/Sound";
import type {
  BulletData,
  BulletFactoryInstance,
  BulletInstance,
  Heading,
} from "./TimePilot.types";

/**
 * Construct an bullet factory for managing creation, movement, rendering and removal of bullets.
 * @constructor
 * @returns {Bullet Factory Instance}
 */
var BulletFactory = function () {
  this._bullets = [] as BulletInstance[];
  this._bulletSound = new SoundEngine(CONSTS.player.projectile.sound.src);
} as unknown as {
  new (): BulletFactoryInstance;
  prototype: Record<string, unknown>;
};

BulletFactory.prototype = {
  /**
   * Create an bullet instance and keep a record of it in the factory.
   * @method
   * @param {Number} originX    - X coordinate to start from.
   * @param {Number} originY    - Y coordinate to start from.
   * @param {Number} heading    - Heading to start from.
   * @param {Number} size       - Pixel dimentions for projectile.
   * @param {Number} velocity   - Number of pixels to move per frame.
   * @param {String} color      - Color of the projectile.
   */
  create: function (
    originX: number,
    originY: number,
    heading: Heading,
    size: number,
    velocity: number,
    color: string
  ): void {
    this._bullets.push(
      new Bullet(originX, originY, heading, size, velocity, color)
    );
    this._bulletSound.stop();
    this._bulletSound.play();
  },

  /**
   * Get the current number of spawned entities.
   * @method
   * @returns {Number}
   */
  getCount: function (): number {
    return this._bullets.length;
  },

  /**
   * Return the data for all entities in an array.
   * @method
   * @returns {Array}
   */
  getData: function (): BulletData[] {
    var data: BulletData[] = [],
      i = "";
    for (i in this._bullets) {
      if (this._bullets.hasOwnProperty(i)) {
        data.push(this._bullets[i].getData() as BulletData);
      }
    }
    return data;
  },

  /**
   * If an entity declares it is to be removed, remove it.
   * @method
   */
  cleanup: function (): void {
    var i;

    for (i in this._bullets) {
      if (this._bullets.hasOwnProperty(i) && this._bullets[i].removeMe) {
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

    for (i in this._bullets) {
      if (this._bullets.hasOwnProperty(i)) {
        this._bullets[i].reposition();
      }
    }
  },

  /**
   * Render all bullets on the gameArena.
   * @method
   */
  render: function (): void {
    var i = "";

    for (i in this._bullets) {
      if (this._bullets.hasOwnProperty(i)) {
        this._bullets[i].render();
      }
    }
  },

  /**
   * Despawn specified entity.
   * @method
   * @param {Number} entityId - Index ID of entity you wish to remove.
   */
  _despawn: function (entityId: number): void {
    this._bullets.splice(entityId, 1);
  },

  /**
   * Clear all bullets from memory.
   */
  clearAll: function (): void {
    for (var i in this._bullets) {
      if (this._bullets.hasOwnProperty(i)) {
        this._despawn(Number(i));
      }
    }
  },
};

export default BulletFactory;
