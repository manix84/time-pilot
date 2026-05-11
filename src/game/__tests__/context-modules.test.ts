import { beforeEach, describe, expect, it, vi } from "vitest";
import BulletFactory from "../bullet-factory";
import ControllerInterface from "../controller-interface";
import EnemyFactory from "../enemy-factory";
import Hud from "../hud";
import Player from "../player";
import PropFactory from "../prop-factory";
import type { GameArenaInstance, GameDataStore, TickerInstance } from "../types";

function createArena(): GameArenaInstance {
  const context = document.createElement("canvas").getContext("2d")!;

  return {
    width: 800,
    height: 600,
    posX: 0,
    posY: 0,
    updatePosition: vi.fn(function (
      this: GameArenaInstance,
      posX: number,
      posY: number
    ) {
      this.posX = posX;
      this.posY = posY;
    }),
    resize: vi.fn(),
    getContext: vi.fn(() => context),
    enterFullScreen: vi.fn(),
    exitFullScreen: vi.fn(),
    toggleFullScreen: vi.fn(),
    setBackgroundColor: vi.fn(),
    clear: vi.fn(),
    registerAssets: vi.fn(),
    preloadAssets: vi.fn(),
    renderText: vi.fn(),
    renderSprite: vi.fn(),
    drawCircle: vi.fn(),
    drawDebugGrid: vi.fn(),
  };
}

function createTicker(): TickerInstance {
  let frame = 0;

  return {
    isRunning: true,
    start: vi.fn(function (this: TickerInstance) {
      this.isRunning = true;
    }),
    stop: vi.fn(function (this: TickerInstance, callback?: () => void) {
      this.isRunning = false;
      callback?.();
    }),
    addSchedule: vi.fn(() => 1),
    removeSchedule: vi.fn(() => true),
    clearSchedule: vi.fn(),
    clearTicks: vi.fn(() => {
      frame = 0;
      return true;
    }),
    getTicks: vi.fn(() => ++frame),
  };
}

function createContext(): GameDataStore {
  const context = {
    _level: 1,
    _gameArena: createArena(),
    _renderTicker: createTicker(),
    _gameTicker: createTicker(),
    _currentController: [],
  } as unknown as GameDataStore;

  context._bullets = new BulletFactory(context);
  context._player = new Player(context);
  context._enemies = new EnemyFactory(context);
  context._props = new PropFactory(context);
  context._hud = new Hud(context);

  return context;
}

describe("context-backed game modules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates, moves, renders, and clears bullets", () => {
    const context = createContext();

    context._bullets.create(0, 0, 90, 4, 7, "#fff");
    expect(context._bullets.getCount()).toBe(1);
    expect(context._bullets.getData()).toHaveLength(1);

    context._bullets.reposition();
    context._bullets.render();
    context._bullets.clearAll();

    expect(context._bullets.getCount()).toBe(0);
  });

  it("moves and renders the player", () => {
    const context = createContext();

    context._player.startShooting();
    context._player.reposition();
    context._player.rotate();
    context._player.shoot();
    context._player.render();

    expect(context._gameArena.updatePosition).toHaveBeenCalled();
    expect(context._bullets.getCount()).toBe(1);
  });

  it("creates, checks, renders, and clears enemies and props", () => {
    const context = createContext();

    context._enemies.create(100, 100, 180);
    context._props.create(50, 50);

    expect(context._enemies.getCount()).toBe(1);
    expect(context._props.getCount()).toBe(1);

    context._enemies.detectCollision();
    context._enemies.reposition();
    context._props.reposition();
    context._enemies.render();
    context._props.render();
    context._enemies.clearAll();
    context._props.clearAll();

    expect(context._enemies.getCount()).toBe(0);
    expect(context._props.getCount()).toBe(0);
  });

  it("renders HUD and delegates controller commands", () => {
    const context = createContext();
    const restart = vi.fn();
    const pause = vi.fn();
    const controls = new ControllerInterface(context, { restart, pause });

    controls.rotateToHeading(270);
    controls.startShooting();
    controls.stopShooting();
    controls.toggleFullScreen();
    controls.togglePause();
    controls.restart();
    context._hud.render();
    context._hud.restart();

    expect(context._player.getData().newHeading).toBe(270);
    expect(context._gameArena.toggleFullScreen).toHaveBeenCalled();
    expect(pause).toHaveBeenCalled();
    expect(restart).toHaveBeenCalled();
    expect(context._gameArena.renderText).toHaveBeenCalled();
  });
});
