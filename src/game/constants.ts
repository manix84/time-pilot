/* Converted from TimePilot.CONSTANTS.js (AMD) to ESM TypeScript. */
import { assetPath } from "./asset-path";
import palette from "./palette";
import type { TimePilotConstants } from "./types";

const scoring = {
  regularEnemy: 100,
  missile: 100,
  boss: 3000,
  bomber1940: 1500,
  formationBonus: 2000,
  parachute: {
    min: 1000,
    max: 5000,
    step: 1000,
  },
};

var CONSTS: TimePilotConstants = {
  player: {
    sprite: {
      src: assetPath("sprites/player/player.png"),
    },
    width: 32,
    height: 32,
    hitRadius: 8,
    rotationFrameCount: 16,
    explosion: {
      sprite: {
        src: assetPath("sprites/player/explosion.png"),
      },
      sound: {
        src: assetPath("sounds/player/explosion.mp3"),
      },
      width: 64,
      height: 32,
      frames: 4,
      frameLimiter: 8,
    },
    projectile: {
      velocity: 7,
      size: 4,
      color: palette.aircraft.bullet,
      sound: {
        src: assetPath("sounds/player/bullet.mp3"),
      },
    },
  },
  scoring,
  limits: {
    bonuses: 1,
    enemyBullets: 4,
    props: 20,
    spawningRadius: 450,
    despawnRadius: 500,
  },
  levels: {
    1: {
      arena: {
        introText: "A.D 1910",
        backgroundColor: palette.level.sky1910,
        spawningArc: 90,
        spawningRadius: 450,
        despawnRadius: 500,
      },
      player: {
        velocity: 5,
        turnInterval: 5,
      },
      enemies: {
        basic: {
          deathValue: scoring.regularEnemy,
          sprite: {
            src: assetPath("sprites/enemies/basic/level1.png"),
          },
          velocity: 3,
          turnLimiter: 25,
          width: 32,
          height: 32,
          firingChance: 0.5,
          hitRadius: 8,
          canRotate: true,
          spawnLimit: 10,
          projectile: {
            velocity: 5,
            size: 6,
            color: palette.aircraft.enemyBullet,
          },
          explosion: {
            sprite: {
              src: assetPath("sprites/enemies/basic/explosion.png"),
            },
            sound: {
              src: assetPath("sounds/enemies/basic/explosion.mp3"),
            },
            width: 32,
            height: 32,
            frames: 4,
            frameLimiter: 5,
          },
        },
        formations: [
          {
            name: "v",
            spawnChance: 0.28,
            holdTicks: 150,
            waveAmplitude: 1.25,
            waveFrequency: 0.08,
            slots: [
              { posX: 0, posY: -64 },
              { posX: -42, posY: -22 },
              { posX: 42, posY: -22 },
              { posX: -84, posY: 28 },
              { posX: 84, posY: 28 },
            ],
          },
          {
            name: "horizontal-sweep",
            spawnChance: 0.22,
            holdTicks: 120,
            waveAmplitude: 1.5,
            waveFrequency: 0.07,
            slots: [
              { posX: -96, posY: 0 },
              { posX: -48, posY: 0 },
              { posX: 0, posY: 0 },
              { posX: 48, posY: 0 },
              { posX: 96, posY: 0 },
            ],
          },
          {
            name: "curved-arc",
            spawnChance: 0.18,
            holdTicks: 135,
            waveAmplitude: 1,
            waveFrequency: 0.09,
            slots: [
              { posX: -72, posY: -72 },
              { posX: -36, posY: -36 },
              { posX: 0, posY: 0 },
              { posX: 36, posY: 36 },
            ],
          },
        ],
      },
      bonus: {
        sprite: {
          src: assetPath("sprites/bonuses/parachute.png"),
        },
        velocity: 2,
        animationCycle: [1, 2, 3, 4, 4, 3, 2, 1],
        hitRadius: 10,
        width: 32,
        height: 32,
      },
      props: [
        {
          sprite: {
            src: assetPath("sprites/props/cloud1.png"),
          },
          width: 32,
          height: 18,
          relativeVelocity: 0.5,
          layer: 1,
          reversed: false,
        },
        {
          sprite: {
            src: assetPath("sprites/props/cloud2.png"),
          },
          width: 60,
          height: 28,
          relativeVelocity: 0.25,
          layer: 1,
          reversed: false,
        },
        {
          sprite: {
            src: assetPath("sprites/props/cloud3.png"),
          },
          width: 92,
          height: 32,
          relativeVelocity: 0,
          layer: 2,
          reversed: false,
        },
      ],
    },
  },
};

export default CONSTS;
