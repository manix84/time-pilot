/* Converted from TimePilot.PropFactory.js (AMD) to ESM TypeScript. */
import Prop from "./prop";
import type {
  PropData,
  PropFactoryInstance,
  PropInstance,
} from "./types";

var PropFactory = function () {
  this._props = [] as PropInstance[];
} as unknown as {
  new (): PropFactoryInstance;
  prototype: Record<string, unknown>;
};

PropFactory.prototype = {
  /**
   * Create a prop instance and keep a record of it in the factory.
   * @method
   * @param   {Number} posX    - X coordinate to start from.
   * @param   {Number} posY    - Y coordinate to start from.
   */
  create: function (posX: number, posY: number): void {
    this._props.push(new Prop(posX, posY));
  },

  /**
   * Get the current number of spawned entities.
   * @method
   * @returns {Number}
   */
  getCount: function (): number {
    return this._props.length;
  },

  /**
   * Return the data for all prop entities in an array.
   * @method
   * @returns {Array}
   */
  getData: function (): PropData[] {
    var data: PropData[] = [],
      i = "";
    for (i in this._props) {
      if (this._props.hasOwnProperty(i)) {
        data.push(this._props[i].getData());
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

    for (i in this._props) {
      if (this._props.hasOwnProperty(i) && this._props[i].removeMe) {
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

    for (i in this._props) {
      if (this._props.hasOwnProperty(i)) {
        this._props[i].reposition();
      }
    }
  },

  /**
   * Render all entities on the gameArena.
   * @method
   */
  render: function (layer?: number | false): void {
    layer = layer || false;
    var i = "";

    for (i in this._props) {
      if (this._props.hasOwnProperty(i)) {
        if (!layer || this._props[i].getData().layer === layer) {
          this._props[i].render();
        }
      }
    }
  },

  /**
   * Despawn specified entity.
   * @method
   * @param   {Number} entityId - Index ID of entity you wish to remove.
   */
  _despawn: function (entityId: number): void {
    this._props.splice(entityId, 1);
  },

  /**
   * Clear all props from memory.
   */
  clearAll: function (): void {
    for (var i in this._props) {
      if (this._props.hasOwnProperty(i)) {
        this._despawn(Number(i));
      }
    }
  },
};

export default PropFactory;
