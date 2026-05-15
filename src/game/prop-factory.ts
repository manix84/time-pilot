/* Converted from TimePilot.PropFactory.js (AMD) to ESM TypeScript. */
import Prop from "./prop";
import type {
  GameDataStore,
  PropData,
  PropFactoryInstance,
  PropInstance,
} from "./types";

class PropFactory implements PropFactoryInstance {
  private _context: GameDataStore;
  private _props: PropInstance[] = [];

  constructor(context: GameDataStore) {
    this._context = context;
  }

  create = (posX: number, posY: number): void => {
    this._props.push(new Prop(this._context, posX, posY));
  };

  getCount = (): number => {
    return this._props.length;
  };

  getData = (): PropData[] => {
    return this._props.map((prop) => prop.getData());
  };

  cleanup = (): void => {
    this._props = this._props.filter((prop) => !prop.removeMe);
  };

  reposition = (): void => {
    this._props.forEach((prop) => prop.reposition());
  };

  render = (
    layer: number | false = false,
    options: {
      excludeFlyThrough?: boolean;
      flyThroughOnly?: boolean;
      opacity?: number;
    } = {}
  ): void => {
    this._props.forEach((prop) => {
      const isFlyThrough = prop.isFlyThrough();

      if (
        (!layer || prop.getData().layer === layer) &&
        (!options.flyThroughOnly || isFlyThrough) &&
        (!options.excludeFlyThrough || !isFlyThrough)
      ) {
        prop.render({ opacity: options.opacity });
      }
    });
  };

  private _despawn = (entityId: number): void => {
    this._props.splice(entityId, 1);
  };

  clearAll = (): void => {
    while (this._props.length) {
      this._despawn(0);
    }
  };
}

export default PropFactory;
