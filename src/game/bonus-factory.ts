/* Converted from TimePilot.BonusFactory.js (AMD) to ESM TypeScript. */
import Bonus from "./bonus";
import type {
  BonusData,
  BonusFactoryInstance,
  BonusInstance,
  GameDataStore,
} from "./types";

/**
 * Owns active bonus entities.
 */
class BonusFactory implements BonusFactoryInstance {
  private _bonuses: BonusInstance[] = [];
  private _context: GameDataStore;

  constructor(context: GameDataStore) {
    this._context = context;
  }

  create = (posX: number, posY: number, type: BonusData["type"] = "parachute"): void => {
    this._bonuses.push(new Bonus(this._context, posX, posY, type));
  };

  getCount = (): number => {
    return this._bonuses.length;
  };

  getData = (): BonusData[] => {
    return this._bonuses.map((bonus) => bonus.getData());
  };

  getEntities = (): BonusInstance[] => {
    return [...this._bonuses];
  };

  cleanup = (): void => {
    this._bonuses = this._bonuses.filter((bonus) => !bonus.removeMe);
  };

  reposition = (): void => {
    this._bonuses.forEach((bonus) => bonus.reposition());
  };

  render = (): void => {
    this._bonuses.forEach((bonus) => bonus.render());
  };

  private _despawn = (entityId: number): void => {
    this._bonuses.splice(entityId, 1);
  };

  clearAll = (): void => {
    while (this._bonuses.length) {
      this._despawn(0);
    }
  };
}

export default BonusFactory;
