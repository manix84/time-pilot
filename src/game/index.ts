import GameArena from "./engine/arena";
import Ticker from "./engine/Ticker";
import BonusFactory from "./bonus-factory";
import BulletFactory from "./bullet-factory";
import Gamepad from "./controller/gamepad";
import Keyboard1 from "./controller/keyboard1";
import Keyboard2 from "./controller/keyboard2";
import Mouse from "./controller/mouse";
import Touch from "./controller/touch";
import ControllerInterface from "./controller-interface";
import EnemyFactory from "./enemy-factory";
import Hud from "./hud";
import Menus from "./menus";
import Player from "./player";
import PropFactory from "./prop-factory";
import CollisionSystem from "./systems/collision";
import RenderingSystem from "./systems/rendering";
import SpawningSystem from "./systems/spawning";
import { assetPath } from "./asset-path";
import CONSTS from "./constants";
import SoundEngine from "./engine/Sound";
import userOptions from "./user-options";
import type {
  AssetProgress,
  CollisionSystemInstance,
  Controller,
  ControllerType,
  GameDataStore,
  RenderingSystemInstance,
  SpawningSystemInstance,
} from "./types";

export const DEMO_LEVEL_DURATION_MS = 30000;
export const DEMO_LEVEL_FADE_MS = 1000;
export const LEVEL_INTRO_DURATION_MS = 5000;
const gameFps = 30;
const demoLevelDurationFrames = Math.max(
  1,
  Math.round((DEMO_LEVEL_DURATION_MS / 1000) * gameFps)
);
const demoLevelFadeFrames = Math.max(
  1,
  Math.round((DEMO_LEVEL_FADE_MS / 1000) * gameFps)
);
const levelIntroDurationFrames = Math.max(
  1,
  Math.round((LEVEL_INTRO_DURATION_MS / 1000) * gameFps)
);
const playerRotationStep = 360 / CONSTS.player.rotationFrameCount;

export interface TimePilotOptions {
  controllerType?: ControllerType;
  debug?: boolean;
  gamepadEnabled?: boolean;
}

export class TimePilot {
  private readonly container: HTMLElement;
  private readonly options: Required<TimePilotOptions>;
  private readonly context = {} as GameDataStore;
  private collisionSystem!: CollisionSystemInstance;
  private hasSeededInitialProps = false;
  private hasStartedGame = false;
  private isDestroyed = false;
  private isDemoMode = false;
  private renderingSystem!: RenderingSystemInstance;
  private spawningSystem!: SpawningSystemInstance;

  constructor(element: HTMLElement, options: TimePilotOptions = {}) {
    this.container = element;
    this.options = {
      controllerType: options.controllerType ?? userOptions.controllerType,
      debug: options.debug ?? userOptions.enableDebug,
      gamepadEnabled: options.gamepadEnabled ?? userOptions.gamepadEnabled,
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
      this.context._renderTicker.clearSchedule();
      this.context._enemies.clearAll();
      this.context._bullets.clearAll();
      this.context._enemyBullets.clearAll();
      this.context._props.clearAll();
      this.context._bonuses.clearAll();
      this.context._player.resetData();
      this.hasSeededInitialProps = false;
      this.hasStartedGame = false;

      this.configureGameLoop();
      this.startDemoMode();
    });
  }

  destroyGame(): void {
    this.isDestroyed = true;
    this.isDemoMode = false;
    this.context._isDemoMode = false;

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
    userOptions.setOption("enableDebug", this.options.debug);
    userOptions.setOption("controllerType", this.options.controllerType);
    userOptions.setOption("gamepadEnabled", this.options.gamepadEnabled);

    this.context._controlInputState = {
      down: false,
      fire: false,
      left: false,
      menu: false,
      pause: false,
      restart: false,
      right: false,
      up: false,
      activeController: "keyboard",
    };
    this.context._formations = {};
    this.context._levelProgress = this.createLevelProgress(1);
    this.context._demoFadeStartedAtTick = 0;
    this.context._demoFadeUntilTick = 0;
    this.context._isDemoMode = false;
    this.context._levelIntroUntilTick = 0;
    this.context._nextParachuteScore = CONSTS.scoring.parachute.min;
    this.context._gameArena = new GameArena(this.container);
    this.context._renderTicker = new Ticker();
    this.context._gameTicker = new Ticker({ fps: 30 });
    this.context._bullets = new BulletFactory(this.context);
    this.context._enemyBullets = new BulletFactory(this.context);
    this.context._player = new Player(this.context);
    this.context._enemies = new EnemyFactory(this.context);
    this.context._props = new PropFactory(this.context);
    this.context._bonuses = new BonusFactory(this.context);
    this.context._hud = new Hud(this.context);
    this.context._menus = new Menus(this.context._gameArena, {
      start: () => {
        this.beginGame();
      },
    });
    this.collisionSystem = new CollisionSystem(this.context);
    this.renderingSystem = new RenderingSystem(this.context);
    this.spawningSystem = new SpawningSystem(this.context);

    const controllerInterface = new ControllerInterface(this.context, {
      restart: () => {
        this.restartGame();
      },
      openMenu: () => {
        this.openPauseMenu();
      },
      pause: () => {
        this.pauseGame();
      },
    });

    this.context._currentController = [
      this.createKeyboardController(controllerInterface),
      new Mouse(this.context._gameArena.getElement(), controllerInterface),
      new Touch(
        this.context._gameArena.getElement(),
        controllerInterface,
        this.context._controlInputState
      ),
    ];

    if (this.options.gamepadEnabled) {
      this.context._currentController.push(
        new Gamepad(controllerInterface, this.context._controlInputState)
      );
    }

    this.context._player.setData("level", 1);
    this.context._gameArena.renderText("Loading", 20, 10, { size: 30 });

    this.context._gameArena.registerAssets([
      assetPath("fonts/font.ttf"),
      assetPath("sprites/player/player.png"),
      assetPath("sounds/player/bullet.mp3"),
      assetPath("sprites/player/explosion.png"),
      assetPath("sprites/enemies/basic/level1.png"),
      assetPath("sprites/enemies/boss/level1.png"),
      // assetPath("sprites/enemies/basic/level2.png"),
      // assetPath("sprites/enemies/basic/level3.png"),
      // assetPath("sprites/enemies/basic/level4.png"),
      // assetPath("sprites/enemies/basic/level5.png"),
      assetPath("sprites/enemies/basic/explosion.png"),
      assetPath("sprites/enemies/boss/explosion.png"),
      assetPath("sprites/bonuses/parachute.png"),
      assetPath("sprites/props/cloud1.png"),
      assetPath("sprites/props/cloud2.png"),
      assetPath("sprites/props/cloud3.png"),
    ]);

    this.context._gameArena.preloadAssets((progress: AssetProgress) => {
      if (this.isDestroyed) {
        return;
      }

      if (!progress.remaining) {
        this.configureGameLoop();
        this.startDemoMode();
        this.context._renderTicker.start();
      }
    });
  }

  private configureGameLoop(): void {
    this.context._gameTicker.addSchedule(() => {
      if (this.isDestroyed) {
        return;
      }

      if (this.isDemoMode) {
        return;
      }

      this.pauseGame();
      window.console.warn("Stopping: 50,000 ticks");
    }, 50000);

    this.context._gameTicker.addSchedule(() => {
      if (this.isDestroyed) {
        return;
      }

      this.updateDemoAutopilot();
    }, 1);

    this.context._gameTicker.addSchedule(() => {
      if (this.isDestroyed) {
        return;
      }

      this.advanceDemoLevel();
    }, demoLevelDurationFrames);

    this.context._gameTicker.addSchedule(() => {
      if (this.isDestroyed) {
        return;
      }

      if (this.isLevelIntroActive()) {
        this.clearIntroControls();
        return;
      }

      this.context._player.reposition();
      this.context._enemies.reposition();
      this.context._bullets.reposition();
      this.context._enemyBullets.reposition();
      this.context._props.reposition();
      this.context._bonuses.reposition();

      this.spawningSystem.spawnEntities();
    }, 1);

    this.context._gameTicker.addSchedule(() => {
      if (this.isDestroyed) {
        return;
      }

      if (this.isLevelIntroActive()) {
        return;
      }

      this.context._player.rotate();
    }, 3);

    this.context._gameTicker.addSchedule(() => {
      if (this.isDestroyed) {
        return;
      }

      if (this.isLevelIntroActive()) {
        return;
      }

      this.context._player.shoot();
    }, 5);

    this.context._renderTicker.addSchedule(() => {
      if (this.isDestroyed) {
        return;
      }

      this.renderingSystem.renderFrame();
    }, 1);

    this.context._gameTicker.addSchedule(() => {
      if (this.isDestroyed) {
        return;
      }

      if (this.isLevelIntroActive()) {
        return;
      }

      this.collisionSystem.detectCollisions();
    }, 1);

    this.context._gameTicker.addSchedule(() => {
      if (this.isDestroyed) {
        return;
      }

      this.context._enemies.cleanup();
      this.context._bullets.cleanup();
      this.context._enemyBullets.cleanup();
      this.context._props.cleanup();
      this.context._bonuses.cleanup();

      if (this.context._levelProgress.bossDefeated) {
        this.advanceAfterBossDefeat();
      }
    }, 1);
  }

  private beginGame(): void {
    if (this.isDestroyed) {
      return;
    }

    const shouldStartFreshGame = this.isDemoMode || !this.hasStartedGame;

    this.stopMenuMusic();
    SoundEngine.setMuted(false);
    this.isDemoMode = false;
    this.context._isDemoMode = false;

    if (shouldStartFreshGame) {
      this.resetWorld(1, { skipIntro: false });
      this.hasStartedGame = true;
    }

    this.context._menus.hide();

    if (!this.hasSeededInitialProps) {
      this.spawningSystem.addInitialProps();
      this.hasSeededInitialProps = true;
    }

    this.context._gameTicker.start();
  }

  private startDemoMode(): void {
    if (this.isDestroyed) {
      return;
    }

    this.stopMenuMusic();
    this.isDemoMode = true;
    this.context._isDemoMode = true;
    SoundEngine.setMuted(true);
    this.resetWorld(this.getRandomDemoLevel(), { skipIntro: true });
    this.spawningSystem.addInitialProps();
    this.hasSeededInitialProps = true;
    this.context._menus.showStart({ startLabel: "Start" });
    this.context._gameTicker.start();
  }

  private openPauseMenu(): void {
    if (!this.hasStartedGame || this.isDemoMode) {
      return;
    }

    if (this.context._gameTicker.isRunning) {
      this.pauseGame(true);
    }

    this.playMenuMusic();
    this.context._menus.showStart({ startLabel: "Continue" });
  }

  private updateDemoAutopilot(): void {
    if (!this.isDemoMode) {
      return;
    }

    const frame = this.context._gameTicker.getTicks();
    const desiredHeading =
      (90 + Math.sin(frame / 45) * 90 + Math.sin(frame / 120) * 45 + 360) %
      360;

    this.context._player.setData(
      "newHeading",
      Math.round(desiredHeading / playerRotationStep) * playerRotationStep
    );
    this.context._player.setData("isAlive", true);
    this.context._player.startShooting();
  }

  private advanceDemoLevel(): void {
    if (!this.isDemoMode) {
      return;
    }

    this.startDemoLevelFade();
    this.resetWorld(this.getRandomDemoLevel(), { skipIntro: true });
    this.spawningSystem.addInitialProps();
    this.hasSeededInitialProps = true;
  }

  private resetWorld(level: number, options: { skipIntro?: boolean } = {}): void {
    this.context._level = level;
    this.context._formations = {};
    this.context._levelProgress = this.createLevelProgress(level);
    this.context._enemies.clearAll();
    this.context._bullets.clearAll();
    this.context._enemyBullets.clearAll();
    this.context._props.clearAll();
    this.context._bonuses.clearAll();
    this.context._nextParachuteScore = CONSTS.scoring.parachute.min;
    this.context._player.resetData();
    this.context._player.setData("level", level);
    this.context._player.setData("isAlive", true);
    this.context._player.setData("deathTick", false);
    this.context._player.stopShooting();
    this.context._levelIntroUntilTick = options.skipIntro
      ? 0
      : this.context._gameTicker.getTicks() + levelIntroDurationFrames;
    this.hasSeededInitialProps = false;
  }

  private advanceAfterBossDefeat(): void {
    const score = this.context._player.getData("score") ?? 0;
    const lives = this.context._player.getData("lives") ?? 3;
    const nextLevel = this.getNextEnabledLevel();

    this.resetWorld(nextLevel, { skipIntro: false });
    this.context._player.setData("score", score);
    this.context._player.setData("score", score, true);
    this.context._player.setData("lives", lives);
    this.context._player.setData("lives", lives, true);
    this.spawningSystem.addInitialProps();
    this.hasSeededInitialProps = true;
  }

  private createLevelProgress(level: number) {
    return {
      bossDefeated: false,
      bossKillThreshold:
        CONSTS.limits.bossKillThresholdBase +
        (level - 1) * CONSTS.limits.bossKillThresholdIncrementPerLevel,
      bossSpawned: false,
      standardEnemyKills: 0,
    };
  }

  private getNextEnabledLevel(): number {
    const levelNumbers = Object.keys(CONSTS.levels)
      .map(Number)
      .sort((a, b) => a - b)
      .filter((level) => CONSTS.levels[level].enabled);
    const currentIndex = levelNumbers.indexOf(this.context._level);

    if (currentIndex === -1 || levelNumbers.length === 0) {
      return 1;
    }

    return levelNumbers[(currentIndex + 1) % levelNumbers.length] ?? 1;
  }

  private getRandomDemoLevel(): number {
    const levelNumbers = Object.keys(CONSTS.levels)
      .map(Number)
      .filter((level) => CONSTS.levels[level].enabled);

    if (levelNumbers.length <= 1) {
      return levelNumbers[0] ?? 1;
    }

    const availableLevels = levelNumbers.filter(
      (level) => level !== this.context._level
    );

    return availableLevels[
      Math.floor(Math.random() * availableLevels.length)
    ] ?? 1;
  }

  private startDemoLevelFade(): void {
    const ticks = this.context._gameTicker.getTicks();

    this.context._demoFadeStartedAtTick = ticks;
    this.context._demoFadeUntilTick = ticks + demoLevelFadeFrames;
  }

  private isLevelIntroActive(): boolean {
    return (
      !!this.context._levelIntroUntilTick &&
      this.context._gameTicker.getTicks() < this.context._levelIntroUntilTick
    );
  }

  private clearIntroControls(): void {
    this.context._player.setData("newHeading", false);
    this.context._player.stopShooting();
  }

  private playMenuMusic(): void {
    // Menu music will be wired here when the asset is available.
  }

  private stopMenuMusic(): void {
    // Menu music will be stopped here when the asset is available.
  }

  private createKeyboardController(
    controllerInterface: ControllerInterface
  ): Controller {
    if (this.options.controllerType === "keyboard2") {
      return new Keyboard2(controllerInterface, this.context._controlInputState);
    }

    return new Keyboard1(controllerInterface, this.context._controlInputState);
  }
}

export default TimePilot;
