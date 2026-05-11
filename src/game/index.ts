import GameArena from "./engine/arena";
import Ticker from "./engine/Ticker";
import BulletFactory from "./bullet-factory";
import Gamepad from "./controller/gamepad";
import Keyboard1 from "./controller/keyboard1";
import ControllerInterface from "./controller-interface";
import EnemyFactory from "./enemy-factory";
import Hud from "./hud";
import Player from "./player";
import PropFactory from "./prop-factory";
import CollisionSystem from "./systems/collision";
import RenderingSystem from "./systems/rendering";
import SpawningSystem from "./systems/spawning";
import userOptions from "./user-options";
import type {
  AssetProgress,
  CollisionSystemInstance,
  Controller,
  GameDataStore,
  RenderingSystemInstance,
  SpawningSystemInstance,
} from "./types";

export interface TimePilotOptions {
  debug?: boolean;
}

export class TimePilot {
  private readonly container: HTMLElement;
  private readonly options: Required<TimePilotOptions>;
  private readonly context = {} as GameDataStore;
  private collisionSystem!: CollisionSystemInstance;
  private renderingSystem!: RenderingSystemInstance;
  private spawningSystem!: SpawningSystemInstance;

  constructor(element: HTMLElement, options: TimePilotOptions = {}) {
    this.container = element;
    this.options = {
      debug: options.debug ?? false,
    };

    this.context._level = 1;
    this.init();
  }

  restartGame(): void {
    window.console.info("Restarting");
    this.context._gameTicker.stop(() => {
      this.context._hud.restart();

      this.context._gameTicker.clearTicks();
      this.context._gameTicker.clearSchedule();
      this.context._enemies.clearAll();
      this.context._bullets.clearAll();
      this.context._props.clearAll();
      this.context._player.resetData();

      this.start();
      this.context._gameTicker.start();
    });
  }

  destroyGame(): void {
    this.context._gameTicker.stop();
    this.context._gameTicker.clearSchedule();
    this.context._gameTicker.clearTicks();

    this.context._renderTicker.stop();
    this.context._renderTicker.clearSchedule();
    this.context._renderTicker.clearTicks();

    this.context._currentController.forEach((controller: Controller) => {
      if (typeof controller.disconnect === "function") {
        controller.disconnect();
      }
    });
    this.context._currentController = [];
  }

  pauseGame(forcePause?: boolean): void {
    if (this.context._gameTicker.isRunning || !!forcePause) {
      window.console.info("Pausing");
      this.context._gameTicker.stop();
    } else {
      window.console.info("Unpausing");
      this.context._gameTicker.start();
    }
  }

  resumeGame(): void {
    if (!this.context._gameTicker.isRunning) {
      window.console.info("Unpausing");
      this.context._gameTicker.start();
    }
  }

  private init(): void {
    userOptions.enableDebug = this.options.debug;

    this.context._gameArena = new GameArena(this.container);
    this.context._renderTicker = new Ticker();
    this.context._gameTicker = new Ticker();
    this.context._bullets = new BulletFactory(this.context);
    this.context._player = new Player(this.context);
    this.context._enemies = new EnemyFactory(this.context);
    this.context._props = new PropFactory(this.context);
    this.context._hud = new Hud(this.context);
    this.collisionSystem = new CollisionSystem(this.context);
    this.renderingSystem = new RenderingSystem(this.context);
    this.spawningSystem = new SpawningSystem(this.context);

    const controllerInterface = new ControllerInterface(this.context, {
      restart: () => {
        this.restartGame();
      },
      pause: () => {
        this.pauseGame();
      },
    });

    this.context._currentController = [
      new Keyboard1(controllerInterface),
      new Gamepad(controllerInterface),
    ];

    this.context._player.setData("level", 1);
    this.context._gameArena.renderText("Loading", 20, 10, { size: 30 });

    this.context._gameArena.registerAssets([
      "/fonts/font.ttf",
      "/sprites/player/player.png",
      "/sounds/player/bullet.mp3",
      "/sprites/player/explosion.png",
      "/sprites/enemies/basic/level1.png",
      // "/sprites/enemies/basic/level2.png",
      // "/sprites/enemies/basic/level3.png",
      // "/sprites/enemies/basic/level4.png",
      // "/sprites/enemies/basic/level5.png",
      "/sprites/enemies/basic/explosion.png",
      "/sprites/props/cloud1.png",
      "/sprites/props/cloud2.png",
      "/sprites/props/cloud3.png",
    ]);

    this.context._gameArena.preloadAssets((progress: AssetProgress) => {
      if (!progress.remaining) {
        this.start();
        this.context._gameTicker.start();
        this.context._renderTicker.start();
      }
    });
  }

  private start(): void {
    this.spawningSystem.addInitialProps();

    this.context._gameTicker.addSchedule(() => {
      this.pauseGame();
      window.console.warn("Stopping: 50,000 ticks");
    }, 50000);

    this.context._gameTicker.addSchedule(() => {
      this.context._player.reposition();
      this.context._enemies.reposition();
      this.context._bullets.reposition();
      this.context._props.reposition();

      this.spawningSystem.spawnEntities();
    }, 1);

    this.context._gameTicker.addSchedule(() => {
      this.context._player.rotate();
    }, 3);

    this.context._gameTicker.addSchedule(() => {
      this.context._player.shoot();
    }, 5);

    this.context._renderTicker.addSchedule(() => {
      this.renderingSystem.renderFrame();
    }, 1);

    this.context._gameTicker.addSchedule(() => {
      this.collisionSystem.detectCollisions();
    }, 1);

    this.context._gameTicker.addSchedule(() => {
      this.context._enemies.cleanup();
      this.context._bullets.cleanup();
      this.context._props.cleanup();
    }, 1);
  }
}

export default TimePilot;
