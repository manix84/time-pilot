import { assetPath } from "./asset-path";
import AchievementSystem from "./achievements";
import BonusFactory from "./bonus-factory";
import BulletFactory from "./bullet-factory";
import { levels, limits, player, scoring, sounds } from "./constants";
import ControllerInterface from "./controller-interface";
import Gamepad from "./controller/gamepad";
import Keyboard1 from "./controller/keyboard1";
import Keyboard2 from "./controller/keyboard2";
import Mouse from "./controller/mouse";
import Touch from "./controller/touch";
import EnemyFactory from "./enemy-factory";
import GameArena from "./engine/arena";
import SoundEngine from "./engine/Sound";
import Ticker from "./engine/Ticker";
import { gameFps } from "./game-timing";
import Hud from "./hud";
import i18n from "./i18n";
import { logger } from "./logger";
import Menus from "./menus";
import Player from "./player";
import Preroll from "./preroll";
import PropFactory from "./prop-factory";
import {
  resetAllStoredTimePilotData,
  resetStoredScores,
  type StoredDataResetScope,
} from "./storage-reset";
import CollisionSystem from "./systems/collision";
import RenderingSystem from "./systems/rendering";
import SpawningSystem from "./systems/spawning";
import { timeWarpAnimationTicks, timeWarpDelayMs } from "./time-warp";
import type {
  AssetProgress,
  BulletData,
  BulletInstance,
  CollisionSystemInstance,
  Controller,
  ControllerType,
  ControlInputSource,
  ControlInputState,
  EnemyData,
  EnemyInstance,
  GameDataStore,
  RenderingSystemInstance,
  SpawningSystemInstance,
} from "./types";
import userOptions, { resetUserOptions } from "./user-options";

export const DEMO_LEVEL_DURATION_MS = 30000;
export const DEMO_LEVEL_FADE_MS = 1000;
export const LEVEL_INTRO_DURATION_MS = 5000;
export const TIME_WARP_DELAY_MS = timeWarpDelayMs;
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
const timeWarpDelayFrames = Math.max(
  1,
  Math.round((TIME_WARP_DELAY_MS / 1000) * gameFps)
);
const continueLives = 3;
const demoContinues = Infinity;
const demoAttackRadius = 520;
const demoAttackStrength = 1.7;
const demoBonusTargetPriority = 1.8;
const demoEnemyAvoidanceRadius = 118;
const demoLives = 3;
const demoProjectileAvoidanceLookAhead = 170;
const demoProjectileAvoidanceRadius = 82;
const demoProjectileAvoidanceStrength = 3.2;
const playerRotationStep = 360 / player.rotationFrameCount;

type DemoProgressSnapshot = {
  nextExtraLifeScore: number;
  score: number;
};

export const getDefaultActiveController = (): ControlInputSource => {
  const hasTouchPoints =
    typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
  const hasCoarsePointer =
    typeof window !== "undefined" &&
    window.matchMedia?.("(pointer: coarse)").matches === true;

  return hasTouchPoints || hasCoarsePointer ? "touch" : "keyboard";
};

const createControlInputState = (
  activeController: ControlInputSource = getDefaultActiveController()
): ControlInputState => ({
  down: false,
  fire: false,
  left: false,
  menu: false,
  pause: false,
  restart: false,
  right: false,
  up: false,
  activeController,
});

export interface TimePilotOptions {
  applyUpdate?: () => void;
  canApplyUpdate?: () => boolean;
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
  private hasShownGameOver = false;
  private hasStartedGame = false;
  private isDestroyed = false;
  private isDemoMode = false;
  private isDebugLevelPreviewLocked = false;
  private selectedStartLevel = 1;
  private readonly coinDropSound = new SoundEngine(sounds.coinDrop.src);
  private readonly gameStartSound = new SoundEngine(sounds.gameStart.src);
  private readonly nextLevelSound = new SoundEngine(sounds.nextLevel.src);
  private preroll?: Preroll;
  private renderingSystem!: RenderingSystemInstance;
  private spawningSystem!: SpawningSystemInstance;
  private readonly timeWarpSound = new SoundEngine(sounds.timeWarp.src);

  constructor(element: HTMLElement, options: TimePilotOptions = {}) {
    this.container = element;
    this.options = {
      applyUpdate: options.applyUpdate ?? (() => {}),
      canApplyUpdate: options.canApplyUpdate ?? (() => false),
      controllerType: options.controllerType ?? userOptions.controllerType,
      debug: options.debug ?? userOptions.enableDebug,
      gamepadEnabled: options.gamepadEnabled ?? userOptions.gamepadEnabled,
    };

    this.context._level = 1;
    this.init();
  }

  restartGame = (): void => {
    logger.info("Restarting game");
    SoundEngine.destroyAll();
    const reset = () => {
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
      this.hasShownGameOver = false;
      this.hasStartedGame = false;
      this.selectedStartLevel = 1;

      this.configureGameLoop();
      this.startDemoMode();
    };

    if (this.context._gameTicker.isRunning) {
      this.context._gameTicker.stop(reset);
    } else {
      reset();
    }
  };

  destroyGame = (): void => {
    this.isDestroyed = true;
    this.isDemoMode = false;
    this.context._isDemoMode = false;
    this.clearControlInputState();
    this.clearDemoControlInputState();
    SoundEngine.stopAll();

    this.context._gameTicker.stop();
    this.context._gameTicker.clearSchedule();
    this.context._gameTicker.clearTicks();

    this.context._renderTicker.stop();
    this.context._renderTicker.clearSchedule();
    this.context._renderTicker.clearTicks();
    this.renderingSystem.destroy?.();

    this.context._currentController.forEach((controller: Controller) => {
      if (typeof controller.disconnect === "function") {
        controller.disconnect();
      }
    });
    this.context._currentController = [];
    this.context._gameArena.destroy?.();
  };

  pauseGame = (forcePause?: boolean): void => {
    if (this.context._gameTicker.isRunning || !!forcePause) {
      logger.debug("Pausing game");
      this.context._gameTicker.stop();
      SoundEngine.pauseAll();
    } else {
      logger.debug("Resuming game");
      this.context._gameTicker.start();
      SoundEngine.resumePaused();
    }
  };

  resumeGame = (): void => {
    if (!this.context._gameTicker.isRunning) {
      logger.debug("Resuming game");
      this.context._gameTicker.start();
      SoundEngine.resumePaused();
    }
  };

  private init = (): void => {
    userOptions.setOption("enableDebug", this.options.debug);
    userOptions.setOption("controllerType", this.options.controllerType);
    userOptions.setOption("gamepadEnabled", this.options.gamepadEnabled);

    this.context._controlInputState = createControlInputState();
    this.context._demoControlInputState = createControlInputState(
      this.context._controlInputState.activeController
    );
    this.context._formations = {};
    this.context._levelProgress = this.createLevelProgress(1);
    this.context._demoFadeStartedAtTick = 0;
    this.context._demoFadeUntilTick = 0;
    this.context._isDemoMode = false;
    this.context._levelIntroUntilTick = 0;
    this.context._timeWarpTransition = undefined;
    this.context._nextParachuteScore = scoring.parachute.min;
    this.context._gameArena = new GameArena(this.container);
    this.context._renderTicker = new Ticker();
    this.context._gameTicker = new Ticker({ fps: gameFps });
    this.context._bullets = new BulletFactory(this.context);
    this.context._enemyBullets = new BulletFactory(this.context);
    this.context._player = new Player(this.context);
    this.context._enemies = new EnemyFactory(this.context);
    this.context._props = new PropFactory(this.context);
    this.context._player.setRespawnCallback?.(this.seedRespawnProps);
    this.context._bonuses = new BonusFactory(this.context);
    this.context._achievements = new AchievementSystem(this.context);
    this.context._hud = new Hud(this.context);
    this.context._menus = new Menus(this.context._gameArena, {
      applyUpdate: () => {
        this.options.applyUpdate();
      },
      canApplyUpdate: () => this.options.canApplyUpdate(),
      canWatchDemo: () => this.isDemoMode,
      clearLevelPreview: () => {
        this.clearDebugLevelPreview();
      },
      continueGame: () => {
        this.continueGame();
      },
      exitToRoot: () => {
        this.exitToRootMenu();
      },
      getContinues: () => this.context._player.getData("continues") ?? 0,
      getAchievements: () => this.context._achievements?.getStatuses() ?? [],
      getLevel: () => this.selectedStartLevel,
      previewLevel: (level) => {
        this.previewDebugLevel(level);
      },
      playPreroll: () => {
        this.playPreroll();
      },
      resetStoredData: (scope) => {
        this.resetStoredData(scope);
      },
      restart: () => {
        this.restartGame();
      },
      selectLevel: (level) => {
        this.selectDebugLevel(level);
        this.beginGame();
      },
      setDebugContinues: (continues) => {
        this.context._player.setData("continues", continues, true);
      },
      setDebugLives: (lives) => {
        this.context._player.setData("lives", lives, true);
      },
      start: () => {
        this.beginGame();
      },
      watchDemo: () => {
        this.watchDemo();
      },
    });
    this.collisionSystem = new CollisionSystem(this.context);
    this.renderingSystem = new RenderingSystem(this.context);
    this.spawningSystem = new SpawningSystem(this.context);

    const controllerInterface = new ControllerInterface(this.context, {
      isPrerollActive: () => this.isPrerollActive(),
      restart: () => {
        this.restartGame();
      },
      openMenu: () => {
        this.openPauseMenu();
      },
      pause: () => {
        this.pauseGame();
      },
      skipPreroll: () => {
        this.skipPreroll();
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
      assetPath("logos/author.png"),
      assetPath("sprites/player/player.png"),
      assetPath("sprites/player/timewarp.png"),
      assetPath("sounds/player/bullet.mp3"),
      assetPath("sprites/player/explosion.png"),
      assetPath("sprites/enemies/basic/level1.png"),
      assetPath("sprites/enemies/boss/level1.png"),
      assetPath("sprites/enemies/basic/level2.png"),
      assetPath("sprites/enemies/boss/level2.png"),
      assetPath("sprites/enemies/special/level2.png"),
      assetPath("sprites/enemies/basic/level3.png"),
      assetPath("sprites/enemies/boss/level3.png"),
      assetPath("sprites/enemies/basic/level4.png"),
      assetPath("sprites/enemies/boss/level4.png"),
      assetPath("sprites/enemies/basic/level5.png"),
      assetPath("sprites/enemies/boss/level5.png"),
      assetPath("sprites/enemies/basic/explosion.png"),
      assetPath("sprites/enemies/boss/explosion.png"),
      assetPath("sprites/enemies/special/explosion.png"),
      assetPath("sprites/enemies/projectiles/bomb.png"),
      assetPath("sprites/enemies/projectiles/bomb_explosion.png"),
      assetPath("sprites/enemies/projectiles/plasma.png"),
      assetPath("sprites/enemies/projectiles/plasma_explosion.png"),
      assetPath("sprites/enemies/projectiles/rocket.png"),
      assetPath("sprites/enemies/projectiles/rocket_explosion.png"),
      assetPath("sprites/bonuses/parachute.png"),
      assetPath("sprites/props/asteroid1.png"),
      assetPath("sprites/props/asteroid2.png"),
      assetPath("sprites/props/asteroid3.png"),
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
        this.startPreroll();
        this.context._renderTicker.start();
      }
    });
  };

  private configureGameLoop = (): void => {
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

      if (this.isTimeWarpTransitionActive()) {
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

      if (this.isTimeWarpTransitionActive()) {
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

      if (this.isTimeWarpTransitionActive()) {
        return;
      }

      this.context._player.shoot();
    }, 5);

    this.context._renderTicker.addSchedule(() => {
      if (this.isDestroyed) {
        return;
      }

      if (this.preroll) {
        if (this.preroll.isSettling()) {
          this.startPrerollBackground();
          this.renderingSystem.renderFrame({
            menuRenderOptions: { renderLogo: false },
          });
        } else {
          this.context._gameArena.clear();
        }
        this.preroll.render();
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

      if (this.isTimeWarpTransitionActive()) {
        return;
      }

      this.collisionSystem.detectCollisions();
    }, 1);

    this.context._gameTicker.addSchedule(() => {
      if (this.isDestroyed) {
        return;
      }

      if (this.context._timeWarpTransition) {
        this.updateTimeWarpTransition();

        if (this.context._timeWarpTransition) {
          return;
        }
      }

      this.context._enemies.cleanup();
      this.context._bullets.cleanup();
      this.context._enemyBullets.cleanup();
      this.context._props.cleanup();
      this.context._bonuses.cleanup();

      if (!this.isDemoMode) {
        this.context._achievements?.update();
      }

      if (this.context._levelProgress.bossDefeated) {
        this.beginTimeWarpTransition();
      }

      this.continueDemoIfNeeded();
      this.showGameOverIfNeeded();
    }, 1);
  };

  private startPreroll = (): void => {
    if (this.isDestroyed) {
      return;
    }

    logger.info("Starting preroll");
    this.context._gameTicker.stop();
    this.context._menus.hide();
    this.isDemoMode = false;
    this.context._isDemoMode = false;
    SoundEngine.stopAll();
    SoundEngine.setMuted(false);

    this.preroll = new Preroll(this.context._gameArena, {
      onComplete: () => this.finishPreroll(),
      onSettleStart: () => this.startPrerollBackground(),
      playBulletSound: () => {
        const sound = new SoundEngine(player.projectile.sound.src, {
          instantDestroy: true,
        });
        sound.play();
      },
    });
  };

  private playPreroll = (): void => {
    logger.debug("Replaying preroll from debug menu");
    this.clearDebugLevelPreview();
    this.startPreroll();
  };

  private resetStoredData = (scope: StoredDataResetScope): void => {
    logger.warning("Resetting stored data", { scope });

    if (scope === "all") {
      resetAllStoredTimePilotData();
      resetUserOptions();
      this.context._achievements?.reset();
      return;
    }

    if (scope === "preferences") {
      resetUserOptions();
      return;
    }

    if (scope === "achievements") {
      this.context._achievements?.reset();
      return;
    }

    resetStoredScores();
  };

  private finishPreroll = (): void => {
    logger.info("Preroll complete");
    this.preroll = undefined;
    this.startPrerollBackground();
  };

  private skipPreroll = (): void => {
    if (this.preroll) {
      logger.info("Preroll skipped");
    }

    this.preroll?.skip();
  };

  private isPrerollActive = (): boolean => {
    return !!this.preroll;
  };

  private startPrerollBackground = (): void => {
    if (this.isDemoMode && this.context._menus.isActive()) {
      return;
    }

    this.startDemoMode();
  };

  private beginGame = (): void => {
    if (this.isDestroyed) {
      return;
    }

    const shouldStartFreshGame = this.isDemoMode || !this.hasStartedGame;

    logger.info("Beginning game", {
      fresh: shouldStartFreshGame,
      level: this.selectedStartLevel,
    });
    this.stopMenuMusic();
    SoundEngine.resumePaused();
    SoundEngine.setMuted(false);
    this.isDemoMode = false;
    this.context._isDemoMode = false;

    if (shouldStartFreshGame) {
      this.coinDropSound.stop();
      this.coinDropSound.play();
      this.gameStartSound.stop();
      this.gameStartSound.play();
      this.resetWorld(this.selectedStartLevel, { skipIntro: false });
      this.hasStartedGame = true;
      this.hasShownGameOver = false;
      this.context._achievements?.onRunStarted(this.context._player.getData());
      this.context._achievements?.onLevelStarted(this.context._level);
    }

    this.context._menus.hide();

    if (!this.hasSeededInitialProps) {
      this.spawningSystem.addInitialProps();
      this.hasSeededInitialProps = true;
    }

    this.context._gameTicker.start();
  };

  private continueGame = (): void => {
    const continues = this.context._player.getData("continues") ?? 0;

    if (continues <= 0) {
      return;
    }

    const level = this.context._level;
    const score = this.context._player.getData("score") ?? 0;
    const nextExtraLifeScore =
      this.context._player.getData("nextExtraLifeScore") ??
      scoring.extraLife.first;

    logger.info("Continuing game", {
      level,
      remainingContinues: continues - 1,
      score,
    });
    this.stopMenuMusic();
    SoundEngine.resumePaused();
    SoundEngine.setMuted(false);
    this.isDemoMode = false;
    this.context._isDemoMode = false;
    this.hasStartedGame = true;
    this.hasShownGameOver = false;

    this.resetWorld(level, { skipIntro: false });
    this.context._player.setData("nextExtraLifeScore", nextExtraLifeScore, true);
    this.context._player.setData("score", score, true);
    this.context._player.setData("lives", continueLives, true);
    this.context._player.setData("continues", continues - 1, true);
    this.context._achievements?.onContinueUsed(continues - 1);
    this.context._achievements?.onLevelStarted(this.context._level);
    this.context._menus.hide();
    this.spawningSystem.addInitialProps();
    this.hasSeededInitialProps = true;
    this.context._gameTicker.start();
  };

  private seedRespawnProps = (): void => {
    this.context._props.clearAll();
    this.spawningSystem.addInitialProps();
    this.hasSeededInitialProps = true;

    if (!this.isDemoMode) {
      this.context._achievements?.onRespawn();
    }
  };

  private exitToRootMenu = (): void => {
    logger.info("Exiting to root menu");
    SoundEngine.stopAll();
    this.context._gameTicker.stop();
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
    this.hasShownGameOver = false;
    this.hasStartedGame = false;
    this.selectedStartLevel = 1;

    this.configureGameLoop();
    this.startDemoMode();
  };

  private startDemoMode = (): void => {
    if (this.isDestroyed) {
      return;
    }

    logger.debug("Starting demo mode");
    this.stopMenuMusic();
    SoundEngine.stopAll();
    this.isDemoMode = true;
    this.context._isDemoMode = true;
    this.isDebugLevelPreviewLocked = false;
    SoundEngine.setMuted(true);
    this.resetWorld(this.getRandomDemoLevel(), { skipIntro: true });
    this.configureDemoPlayerData();
    this.spawningSystem.addInitialProps();
    this.hasSeededInitialProps = true;
    this.context._menus.showStart({ startLabel: i18n.menu.start });
    this.context._gameTicker.start();
  };

  private watchDemo = (): void => {
    if (!this.isDemoMode) {
      this.startDemoMode();
    }

    this.context._demoFadeStartedAtTick = 0;
    this.context._demoFadeUntilTick = 0;
    this.context._player.stopShooting();
  };

  private openPauseMenu = (): void => {
    if (!this.hasStartedGame || this.isDemoMode) {
      return;
    }

    if (this.context._gameTicker.isRunning) {
      this.pauseGame(true);
    }

    this.playMenuMusic();
    this.context._menus.showStart({ startLabel: i18n.menu.continue });
  };

  private updateDemoAutopilot = (): void => {
    if (!this.isDemoMode) {
      return;
    }

    const playerData = this.context._player.getData();

    if (!playerData.isAlive) {
      this.clearDemoControlInputState();
      return;
    }

    const frame = this.context._gameTicker.getTicks();
    const desiredHeading = this.getDemoAutopilotHeading(frame);

    this.context._player.setData(
      "newHeading",
      Math.round(desiredHeading / playerRotationStep) * playerRotationStep
    );
    this.updateDemoControlOverlay(desiredHeading);
    this.context._player.startShooting();
  };

  private getDemoAutopilotHeading = (frame: number): number => {
    const wanderHeading =
      (90 + Math.sin(frame / 45) * 90 + Math.sin(frame / 120) * 45 + 360) % 360;
    const wanderVector = this.vectorFromHeading(wanderHeading);
    const projectileAvoidance = this.getDemoProjectileAvoidanceVector();
    const enemyAvoidance = this.getDemoEnemyAvoidanceVector();
    const attackVector = this.getDemoAttackVector();
    const danger = Math.min(
      1,
      Math.hypot(projectileAvoidance.x, projectileAvoidance.y) +
        Math.hypot(enemyAvoidance.x, enemyAvoidance.y)
    );
    const attackStrength = demoAttackStrength * (1 - danger * 0.75);
    const desiredVector = this.normalizeVector({
      x:
        wanderVector.x +
        attackVector.x * attackStrength +
        projectileAvoidance.x * demoProjectileAvoidanceStrength +
        enemyAvoidance.x * 1.45,
      y:
        wanderVector.y +
        attackVector.y * attackStrength +
        projectileAvoidance.y * demoProjectileAvoidanceStrength +
        enemyAvoidance.y * 1.45,
    });

    if (Math.hypot(desiredVector.x, desiredVector.y) <= 0.001) {
      return wanderHeading;
    }

    return this.headingFromVector(desiredVector.x, desiredVector.y);
  };

  private getDemoProjectileAvoidanceVector = (): { x: number; y: number } => {
    let avoidX = 0;
    let avoidY = 0;

    this.context._enemyBullets.getEntities().forEach((bullet) => {
      const avoidance = this.getDemoProjectileAvoidanceForBullet(bullet);

      avoidX += avoidance.x;
      avoidY += avoidance.y;
    });

    return { x: avoidX, y: avoidY };
  };

  private getDemoProjectileAvoidanceForBullet = (
    bullet: BulletInstance
  ): { x: number; y: number } => {
    if (bullet.removeMe) {
      return { x: 0, y: 0 };
    }

    const bulletData = bullet.getData() as BulletData;

    if (bulletData.explosionTick !== false) {
      return { x: 0, y: 0 };
    }

    const playerData = this.context._player.getData();
    const bulletPosition =
      bulletData.coordinateSpace === "world"
        ? { posX: bulletData.posX, posY: bulletData.posY }
        : {
          posX: playerData.posX + bulletData.posX,
          posY: playerData.posY + bulletData.posY,
        };
    const bulletDirection = this.vectorFromHeading(bulletData.heading);
    const toPlayer = {
      x: playerData.posX - bulletPosition.posX,
      y: playerData.posY - bulletPosition.posY,
    };
    const alongPath = this.dotProduct(toPlayer, bulletDirection);

    if (alongPath < -24 || alongPath > demoProjectileAvoidanceLookAhead) {
      return { x: 0, y: 0 };
    }

    const closestPoint = {
      x: bulletPosition.posX + bulletDirection.x * alongPath,
      y: bulletPosition.posY + bulletDirection.y * alongPath,
    };
    const fromPath = {
      x: playerData.posX - closestPoint.x,
      y: playerData.posY - closestPoint.y,
    };
    const pathDistance = Math.hypot(fromPath.x, fromPath.y);

    if (pathDistance > demoProjectileAvoidanceRadius) {
      return { x: 0, y: 0 };
    }

    const perpendicular =
      pathDistance <= 0.001
        ? { x: -bulletDirection.y, y: bulletDirection.x }
        : this.normalizeVector(fromPath);
    const urgency =
      (1 - pathDistance / demoProjectileAvoidanceRadius) *
      (1 - Math.max(0, alongPath) / demoProjectileAvoidanceLookAhead);

    return {
      x: perpendicular.x * urgency,
      y: perpendicular.y * urgency,
    };
  };

  private getDemoEnemyAvoidanceVector = (): { x: number; y: number } => {
    const playerData = this.context._player.getData();
    let avoidX = 0;
    let avoidY = 0;

    this.context._enemies.getEntities().forEach((enemy: EnemyInstance) => {
      if (!enemy.isAlive) {
        return;
      }

      const enemyData = enemy.getData() as EnemyData;
      const away = {
        x: playerData.posX - enemyData.posX,
        y: playerData.posY - enemyData.posY,
      };
      const distance = Math.hypot(away.x, away.y);

      if (distance <= 0.001 || distance > demoEnemyAvoidanceRadius) {
        return;
      }

      const normalized = this.normalizeVector(away);
      const strength = 1 - distance / demoEnemyAvoidanceRadius;

      avoidX += normalized.x * strength;
      avoidY += normalized.y * strength;
    });

    return { x: avoidX, y: avoidY };
  };

  private getDemoAttackVector = (): { x: number; y: number } => {
    const playerData = this.context._player.getData();
    let bestTarget:
      | {
          distance: number;
          position: { posX: number; posY: number };
          priority: number;
        }
      | undefined;

    this.context._enemies.getEntities().forEach((enemy) => {
      if (!enemy.isAlive) {
        return;
      }

      const enemyData = enemy.getData() as EnemyData;

      bestTarget = this.getHigherPriorityDemoTarget(bestTarget, {
        distance: Math.hypot(
          enemyData.posX - playerData.posX,
          enemyData.posY - playerData.posY
        ),
        position: { posX: enemyData.posX, posY: enemyData.posY },
        priority: this.getDemoEnemyTargetPriority(enemyData),
      });
    });

    this.context._enemyBullets.getEntities().forEach((bullet) => {
      if (bullet.removeMe) {
        return;
      }

      const bulletData = bullet.getData() as BulletData;

      if (bulletData.explosionTick !== false || !bulletData.shootable) {
        return;
      }

      const position = this.getDemoProjectileWorldPosition(bulletData);

      bestTarget = this.getHigherPriorityDemoTarget(bestTarget, {
        distance: Math.hypot(
          position.posX - playerData.posX,
          position.posY - playerData.posY
        ),
        position,
        priority: bulletData.tracksPlayer ? 5 : 3.2,
      });
    });

    this.context._bonuses.getEntities().forEach((bonus) => {
      const bonusData = bonus.getData();

      if (bonusData.removeMe) {
        return;
      }

      bestTarget = this.getHigherPriorityDemoTarget(bestTarget, {
        distance: Math.hypot(
          bonusData.posX - playerData.posX,
          bonusData.posY - playerData.posY
        ),
        position: { posX: bonusData.posX, posY: bonusData.posY },
        priority: demoBonusTargetPriority,
      });
    });

    if (!bestTarget) {
      return { x: 0, y: 0 };
    }

    return this.normalizeVector({
      x: bestTarget.position.posX - playerData.posX,
      y: bestTarget.position.posY - playerData.posY,
    });
  };

  private getHigherPriorityDemoTarget = <
    T extends {
      distance: number;
      position: { posX: number; posY: number };
      priority: number;
    },
  >(
    current: T | undefined,
    candidate: T
  ): T | undefined => {
    if (candidate.distance > demoAttackRadius) {
      return current;
    }

    if (!current) {
      return candidate;
    }

    const currentScore = current.priority / Math.max(1, current.distance);
    const candidateScore = candidate.priority / Math.max(1, candidate.distance);

    return candidateScore > currentScore ? candidate : current;
  };

  private getDemoEnemyTargetPriority = (enemyData: EnemyData): number => {
    if (enemyData.type === "boss") {
      return 4;
    }

    if (enemyData.type === "specialBomber") {
      return 3.4;
    }

    return 2.4;
  };

  private getDemoProjectileWorldPosition = (
    bulletData: BulletData
  ): { posX: number; posY: number } => {
    const playerData = this.context._player.getData();

    return bulletData.coordinateSpace === "world"
      ? { posX: bulletData.posX, posY: bulletData.posY }
      : {
        posX: playerData.posX + bulletData.posX,
        posY: playerData.posY + bulletData.posY,
      };
  };

  private vectorFromHeading = (heading: number): { x: number; y: number } => {
    const radians = heading * (Math.PI / 180);

    return {
      x: Math.sin(radians),
      y: -Math.cos(radians),
    };
  };

  private headingFromVector = (x: number, y: number): number => {
    const heading = Math.atan2(x, -y) * (180 / Math.PI);

    return (heading + 360) % 360;
  };

  private normalizeVector = (vector: { x: number; y: number }): { x: number; y: number } => {
    const length = Math.hypot(vector.x, vector.y);

    if (length <= 0.001) {
      return { x: 0, y: 0 };
    }

    return {
      x: vector.x / length,
      y: vector.y / length,
    };
  };

  private dotProduct = (
    a: { x: number; y: number },
    b: { x: number; y: number }
  ): number => a.x * b.x + a.y * b.y;

  private updateDemoControlOverlay = (heading: number): void => {
    const radians = heading * (Math.PI / 180);
    const inputState = this.getDemoControlInputState();
    const axisX = Math.sin(radians);
    const axisY = -Math.cos(radians);
    const threshold = 0.35;

    inputState.activeController = this.context._controlInputState.activeController;
    inputState.left = axisX < -threshold;
    inputState.right = axisX > threshold;
    inputState.up = axisY < -threshold;
    inputState.down = axisY > threshold;
    inputState.fire = true;
    inputState.menu = false;
    inputState.pause = false;
    inputState.restart = false;
    inputState.rotateLeft = false;
    inputState.rotateRight = false;
  };

  private clearInputState = (inputState: ControlInputState): void => {
    inputState.down = false;
    inputState.fire = false;
    inputState.left = false;
    inputState.menu = false;
    inputState.pause = false;
    inputState.restart = false;
    inputState.right = false;
    inputState.up = false;
    inputState.rotateLeft = false;
    inputState.rotateRight = false;
  };

  private clearControlInputState = (): void => {
    this.clearInputState(this.context._controlInputState);
  };

  private clearDemoControlInputState = (): void => {
    this.clearInputState(this.getDemoControlInputState());
  };

  private getDemoControlInputState = (): ControlInputState => {
    this.context._demoControlInputState ??= createControlInputState(
      this.context._controlInputState.activeController
    );

    return this.context._demoControlInputState;
  };

  private advanceDemoLevel = (): void => {
    if (!this.isDemoMode || this.isDebugLevelPreviewLocked) {
      return;
    }

    const progress = this.getDemoProgressSnapshot();

    this.startDemoLevelFade();
    this.resetWorld(this.getRandomDemoLevel(), { skipIntro: true });
    this.configureDemoPlayerData();
    this.restoreDemoProgress(progress);
    this.spawningSystem.addInitialProps();
    this.hasSeededInitialProps = true;
  };

  private resetWorld = (
    level: number,
    options: { skipIntro?: boolean } = {}
  ): void => {
    this.context._level = level;
    this.context._formations = {};
    this.context._levelProgress = this.createLevelProgress(level);
    this.context._enemies.clearAll();
    this.context._bullets.clearAll();
    this.context._enemyBullets.clearAll();
    this.context._props.clearAll();
    this.context._bonuses.clearAll();
    this.context._nextParachuteScore = scoring.parachute.min;
    this.context._player.resetData();
    this.context._player.setData("level", level);
    this.context._player.setData("isAlive", true);
    this.context._player.setData("deathTick", false);
    this.context._player.stopShooting();
    this.context._levelIntroUntilTick = options.skipIntro
      ? 0
      : this.context._gameTicker.getTicks() + levelIntroDurationFrames;
    this.context._timeWarpTransition = undefined;
    this.hasSeededInitialProps = false;
    this.hasShownGameOver = false;
  };

  private configureDemoPlayerData = (): void => {
    this.context._player.setData("lives", demoLives);
    this.context._player.setData("continues", demoContinues);
    this.context._player.setData("isAlive", true);
    this.context._player.setData("deathTick", false);
    this.context._player.stopShooting();
    this.clearDemoControlInputState();
  };

  private getDemoProgressSnapshot = (): DemoProgressSnapshot => ({
    nextExtraLifeScore:
      this.context._player.getData("nextExtraLifeScore") ??
      scoring.extraLife.first,
    score: this.context._player.getData("score") ?? 0,
  });

  private restoreDemoProgress = (progress: DemoProgressSnapshot): void => {
    this.context._player.setData(
      "nextExtraLifeScore",
      progress.nextExtraLifeScore
    );
    this.context._player.setData("score", progress.score);
  };

  private continueDemoIfNeeded = (): void => {
    const playerData = this.context._player.getData();

    if (
      !this.isDemoMode ||
      playerData.isAlive ||
      playerData.lives > 0 ||
      !playerData.removeMe
    ) {
      return;
    }

    const level = this.context._level;
    const progress = this.getDemoProgressSnapshot();

    this.resetWorld(level, { skipIntro: true });
    this.configureDemoPlayerData();
    this.restoreDemoProgress(progress);
    this.spawningSystem.addInitialProps();
    this.hasSeededInitialProps = true;
  };

  private showGameOverIfNeeded = (): void => {
    const playerData = this.context._player.getData();

    if (
      this.hasShownGameOver ||
      this.isDemoMode ||
      this.isTimeWarpTransitionActive() ||
      !this.hasStartedGame ||
      playerData.isAlive ||
      playerData.lives > 0 ||
      !playerData.removeMe
    ) {
      return;
    }

    this.hasShownGameOver = true;
    logger.info("Showing game over", {
      level: this.context._level,
      score: playerData.score,
    });
    this.context._achievements?.onGameOver();
    this.context._player.stopShooting();
    this.context._gameTicker.stop();
    this.playMenuMusic();
    this.context._menus.showGameOver();
  };

  private beginTimeWarpTransition = (): void => {
    if (this.context._timeWarpTransition) {
      return;
    }

    const score = this.context._player.getData("score") ?? 0;
    const lives = this.context._player.getData("lives") ?? 3;
    const nextLevel = this.getNextEnabledLevel();
    const startedAtTick = this.context._gameTicker.getTicks();
    const effectStartedAtTick = startedAtTick + timeWarpDelayFrames;

    logger.info("Beginning time warp transition", {
      fromLevel: this.context._level,
      toLevel: nextLevel,
    });
    this.timeWarpSound.stop();
    this.timeWarpSound.play();
    if (!this.isDemoMode) {
      this.context._achievements?.onLevelCompleted(
        this.context._level,
        nextLevel,
        this.context._player.getData()
      );
    }

    this.context._timeWarpTransition = {
      effectStartedAtTick,
      endsAtTick: effectStartedAtTick + timeWarpAnimationTicks,
      lives,
      nextLevel,
      score,
      screenCleared: false,
      startedAtTick,
    };
    this.context._levelProgress.bossDefeated = false;
  };

  private updateTimeWarpTransition = (): void => {
    const transition = this.context._timeWarpTransition;

    if (!transition) {
      return;
    }

    const ticks = this.context._gameTicker.getTicks();

    if (ticks >= transition.effectStartedAtTick && !transition.screenCleared) {
      this.prepareTimeWarpEffect();
    }

    this.completeTimeWarpTransition();
  };

  private prepareTimeWarpEffect = (): void => {
    const transition = this.context._timeWarpTransition;

    if (!transition) {
      return;
    }

    this.context._enemies.clearAll();
    this.context._bullets.clearAll();
    this.context._enemyBullets.clearAll();
    this.context._props.clearAll();
    this.context._bonuses.clearAll();
    this.context._player.setData("posX", 0);
    this.context._player.setData("posY", 0);
    this.context._player.setData("isAlive", true);
    this.context._player.setData("deathTick", false);
    this.context._player.stopShooting();
    this.context._gameArena.updatePosition(0, 0);
    transition.screenCleared = true;
  };

  private completeTimeWarpTransition = (): void => {
    const transition = this.context._timeWarpTransition;

    if (!transition || this.context._gameTicker.getTicks() < transition.endsAtTick) {
      return;
    }

    if (transition.nextLevel > 1) {
      this.nextLevelSound.stop();
      this.nextLevelSound.play();
    }

    logger.info("Completing time warp transition", {
      nextLevel: transition.nextLevel,
    });
    this.resetWorld(transition.nextLevel, { skipIntro: false });
    this.context._player.setData("score", transition.score);
    this.context._player.setData("score", transition.score, true);
    this.context._player.setData("lives", transition.lives);
    this.context._player.setData("lives", transition.lives, true);
    if (!this.isDemoMode) {
      this.context._achievements?.onLevelStarted(transition.nextLevel);
    }
    this.spawningSystem.addInitialProps();
    this.hasSeededInitialProps = true;
  };

  private selectDebugLevel = (level: number): void => {
    if (!levels[level]?.enabled) {
      return;
    }

    this.selectedStartLevel = level;

    const score = this.context._player.getData("score") ?? 0;
    const lives = this.context._player.getData("lives") ?? 3;

    this.resetWorld(level, { skipIntro: this.isDemoMode });
    this.context._player.setData("score", score);
    this.context._player.setData("score", score, true);
    this.context._player.setData("lives", lives);
    this.context._player.setData("lives", lives, true);
    this.spawningSystem.addInitialProps();
    this.hasSeededInitialProps = true;
  };

  private previewDebugLevel = (level: number): void => {
    if (!this.isDemoMode || !levels[level]?.enabled || this.context._level === level) {
      if (this.isDemoMode && levels[level]?.enabled) {
        this.isDebugLevelPreviewLocked = true;
      }
      return;
    }

    this.isDebugLevelPreviewLocked = true;
    this.resetWorld(level, { skipIntro: true });
    this.spawningSystem.addInitialProps();
    this.hasSeededInitialProps = true;
  };

  private clearDebugLevelPreview = (): void => {
    this.isDebugLevelPreviewLocked = false;
  };

  private createLevelProgress = (level: number) => {
    return {
      bossDefeated: false,
      bossKillThreshold:
        limits.bossKillThresholdBase +
        (level - 1) * limits.bossKillThresholdIncrementPerLevel,
      bossSpawned: false,
      standardEnemyKills: 0,
    };
  };

  private getNextEnabledLevel = (): number => {
    const levelNumbers = Object.keys(levels)
      .map(Number)
      .sort((a, b) => a - b)
      .filter((level) => levels[level].enabled);
    const currentIndex = levelNumbers.indexOf(this.context._level);

    if (currentIndex === -1 || levelNumbers.length === 0) {
      return 1;
    }

    return levelNumbers[(currentIndex + 1) % levelNumbers.length] ?? 1;
  };

  private getRandomDemoLevel = (): number => {
    const levelNumbers = Object.keys(levels)
      .map(Number)
      .filter((level) => levels[level].enabled);

    if (levelNumbers.length <= 1) {
      return levelNumbers[0] ?? 1;
    }

    const availableLevels = levelNumbers.filter(
      (level) => level !== this.context._level
    );

    return (
      availableLevels[Math.floor(Math.random() * availableLevels.length)] ?? 1
    );
  };

  private startDemoLevelFade = (): void => {
    const ticks = this.context._gameTicker.getTicks();

    this.context._demoFadeStartedAtTick = ticks;
    this.context._demoFadeUntilTick = ticks + demoLevelFadeFrames;
  };

  private isLevelIntroActive = (): boolean => {
    return (
      !!this.context._levelIntroUntilTick &&
      this.context._gameTicker.getTicks() < this.context._levelIntroUntilTick
    );
  };

  private isTimeWarpEffectActive = (): boolean => {
    const transition = this.context._timeWarpTransition;

    return (
      !!transition &&
      this.context._gameTicker.getTicks() >= transition.effectStartedAtTick
    );
  };

  private isTimeWarpTransitionActive = (): boolean => {
    return !!this.context._timeWarpTransition;
  };

  private clearIntroControls = (): void => {
    this.context._player.setData("newHeading", false);
    this.context._player.stopShooting();
  };

  private playMenuMusic = (): void => {
    // Menu music will be wired here when the asset is available.
  };

  private stopMenuMusic = (): void => {
    // Menu music will be stopped here when the asset is available.
  };

  private createKeyboardController = (
    controllerInterface: ControllerInterface
  ): Controller => {
    if (this.options.controllerType === "keyboard2") {
      return new Keyboard2(
        controllerInterface,
        this.context._controlInputState
      );
    }

    return new Keyboard1(controllerInterface, this.context._controlInputState);
  };
}

export default TimePilot;
