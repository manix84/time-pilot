/* Converted from TimePilot.CONSTANTS.js (AMD) to ESM TypeScript. */
import { assetPath } from "./asset-path";
import i18n from "./i18n";
import palette from "./palette";
import type {
  BonusConfig,
  EnemyConfig,
  EnemyFormationConfig,
  PropConfig,
  TimePilotConstants,
} from "./types";

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

const playerMovementSpeed = 5;
const projectileSpeeds = {
  bullet1910: playerMovementSpeed * 1.1,
  bullet1940: playerMovementSpeed * 1.25,
  bullet1970: playerMovementSpeed * 1.35,
  bullet1982: playerMovementSpeed * 1.6,
  energy2001: playerMovementSpeed * 1.75,
  bomb1940: playerMovementSpeed * 0.9,
  missile1970: playerMovementSpeed * 2,
  missile1982: playerMovementSpeed * 2.2,
};

const rocketProjectileSprite = {
  sprite: {
    src: assetPath("sprites/enemies/projectiles/rocket.png"),
  },
  width: 12,
  height: 9,
  frames: 16,
  renderWidth: 24,
  renderHeight: 18,
};

const basicEnemy = (
  level: number,
  overrides: Partial<EnemyConfig> = {}
): EnemyConfig => ({
  countsTowardBoss: true,
  deathValue: scoring.regularEnemy,
  sprite: {
    src: assetPath(`sprites/enemies/basic/level${level}.png`),
  },
  velocity: 3.25,
  turnLimiter: 32,
  width: 32,
  height: 32,
  firingChance: 0.35,
  hitPoints: 1,
  hitRadius: 8,
  canRotate: true,
  tracksPlayer: true,
  spawnLimit: 8,
  projectile: {
    velocity: projectileSpeeds.bullet1910,
    size: 6,
    color: palette.aircraft.enemyBullet,
  },
  explosion: {
    sprite: {
      src: assetPath("sprites/enemies/basic/explosion.png"),
    },
    sound: {
      src: assetPath("sounds/enemy_explode.wav"),
    },
    width: 32,
    height: 32,
    frames: 4,
    frameLimiter: 5,
  },
  ...overrides,
});

const bossEnemy = (
  level: number,
  overrides: Partial<EnemyConfig> = {}
): EnemyConfig => ({
  animationFrames: 8,
  bossDamageFrames: 4,
  countsTowardBoss: false,
  deathValue: scoring.boss,
  sprite: {
    src: assetPath(`sprites/enemies/boss/level${level}.png`),
  },
  velocity: 3,
  turnLimiter: 48,
  width: 32,
  height: 16,
  firingChance: 0.25,
  hitPoints: 7,
  hitRadius: 18,
  canRotate: false,
  tracksPlayer: true,
  renderHeight: 32,
  renderWidth: 64,
  spawnLimit: 1,
  projectile: {
    velocity: projectileSpeeds.bullet1940,
    size: 6,
    color: palette.aircraft.enemyBullet,
  },
  explosion: {
    sprite: {
      src: assetPath("sprites/enemies/boss/explosion.png"),
    },
    sound: {
      src: assetPath("sounds/enemy_explode.wav"),
    },
    width: 32,
    height: 32,
    frames: 8,
    frameLimiter: 5,
  },
  ...overrides,
});

const specialBomber = (
  level: number,
  overrides: Partial<EnemyConfig> = {}
): EnemyConfig => ({
  animationFrames: 7,
  countsTowardBoss: false,
  deathValue: scoring.bomber1940,
  sprite: {
    src: assetPath(`sprites/enemies/special-bomber/level${level}.png`),
  },
  velocity: 2.75,
  turnLimiter: 9999,
  width: 32,
  height: 9,
  firingChance: 0,
  hitPoints: 3,
  hitRadius: 18,
  canRotate: false,
  tracksPlayer: false,
  renderHeight: 18,
  renderWidth: 64,
  spawnLimit: 1,
  projectile: {
    velocity: projectileSpeeds.bomb1940,
    size: 6,
    color: palette.aircraft.enemyBullet,
    sprite: {
      sprite: {
        src: assetPath("sprites/enemies/projectiles/bomb.png"),
      },
      width: 12,
      height: 3,
      renderWidth: 24,
      renderHeight: 6,
    },
  },
  explosion: {
    sprite: {
      src: assetPath("sprites/enemies/basic/explosion.png"),
    },
    sound: {
      src: assetPath("sounds/enemy_explode.wav"),
    },
    width: 32,
    height: 32,
    frames: 4,
    frameLimiter: 5,
  },
  ...overrides,
});

const parachuteBonus: BonusConfig = {
  sprite: {
    src: assetPath("sprites/bonuses/parachute.png"),
  },
  velocity: 2,
  animationCycle: [1, 2, 3, 4, 4, 3, 2, 1],
  hitRadius: 10,
  width: 32,
  height: 32,
};

const levelOneProps: PropConfig[] = [
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
];

const levelOneFormations: EnemyFormationConfig[] = [
  {
    name: "v",
    movement: "slow diagonal entry with slight wave",
    breakPattern: "peel-apart",
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
    movement: "straight cross-screen sweep with vertical wobble",
    breakPattern: "staggered-firing",
    fireStaggerTicks: 12,
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
    movement: "curved arc entry, then reform",
    breakPattern: "reform-then-attack",
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
    transformSlots: [
      { posX: -48, posY: -32 },
      { posX: 48, posY: -32 },
      { posX: -48, posY: 32 },
      { posX: 48, posY: 32 },
    ],
  },
];

const futureLevelFormations: Record<number, EnemyFormationConfig[]> = {
  2: [
    {
      name: "arrowhead",
      movement: "fast forward entry with slight steering toward player",
      steering: "leader-tracks-player",
      breakPattern: "forward-attack",
      spawnChance: 0.26,
      holdTicks: 120,
      waveAmplitude: 0.4,
      waveFrequency: 0.04,
      slots: [
        { posX: 0, posY: -72 },
        { posX: -42, posY: -30 },
        { posX: 42, posY: -30 },
        { posX: -84, posY: 18 },
        { posX: 0, posY: 18 },
        { posX: 84, posY: 18 },
      ],
    },
    {
      name: "crossing-squadron-left",
      movement: "diagonal crossing path from left side",
      breakPattern: "crossfire",
      fireStaggerTicks: 10,
      spawnChance: 0.18,
      holdTicks: 100,
      waveAmplitude: 0,
      waveFrequency: 0,
      slots: [
        { posX: -48, posY: -24 },
        { posX: 0, posY: 0 },
        { posX: 48, posY: 24 },
      ],
    },
    {
      name: "crossing-squadron-right",
      movement: "diagonal crossing path from right side",
      breakPattern: "crossfire",
      fireStaggerTicks: 10,
      spawnChance: 0.18,
      holdTicks: 100,
      waveAmplitude: 0,
      waveFrequency: 0,
      slots: [
        { posX: 48, posY: -24 },
        { posX: 0, posY: 0 },
        { posX: -48, posY: 24 },
      ],
    },
    {
      name: "dive-bomb-split",
      movement: "line entry, outer enemies dive on break",
      breakPattern: "outer-dive-inner-forward",
      spawnChance: 0.2,
      holdTicks: 110,
      waveAmplitude: 0.3,
      waveFrequency: 0.03,
      slots: [
        { posX: -72, posY: 0 },
        { posX: -24, posY: 0 },
        { posX: 24, posY: 0 },
        { posX: 72, posY: 0 },
      ],
      transformSlots: [
        { posX: -120, posY: 48 },
        { posX: -24, posY: 0 },
        { posX: 24, posY: 0 },
        { posX: 120, posY: 48 },
      ],
    },
  ],
  3: [
    {
      name: "diamond",
      movement: "tight formation with shared rotation",
      breakPattern: "rotating-breakaway",
      rotationSpeed: 0.045,
      spawnChance: 0.25,
      holdTicks: 110,
      waveAmplitude: 0,
      waveFrequency: 0,
      slots: [
        { posX: 0, posY: -58 },
        { posX: -58, posY: 0 },
        { posX: 58, posY: 0 },
        { posX: 0, posY: 58 },
      ],
    },
    {
      name: "serpentine-chain",
      movement: "shared sine-wave with delayed slot motion",
      breakPattern: "snake-dispersal",
      spawnChance: 0.2,
      holdTicks: 150,
      waveAmplitude: 2.5,
      waveFrequency: 0.12,
      slots: [
        { posX: -48, posY: -96 },
        { posX: -18, posY: -48 },
        { posX: 18, posY: 0 },
        { posX: -18, posY: 48 },
        { posX: -48, posY: 96 },
      ],
    },
    {
      name: "circular-orbit",
      movement: "orbit around shared center",
      breakPattern: "radial-attack",
      rotationSpeed: 0.08,
      spawnChance: 0.18,
      holdTicks: 140,
      waveAmplitude: 0,
      waveFrequency: 0,
      slots: [
        { posX: 0, posY: -64 },
        { posX: -64, posY: 0 },
        { posX: 64, posY: 0 },
        { posX: 0, posY: 64 },
      ],
    },
  ],
  4: [
    {
      name: "staggered-box",
      movement: "fast box entry with alternating attacks",
      breakPattern: "alternating-breakaway",
      fireStaggerTicks: 8,
      spawnChance: 0.24,
      holdTicks: 100,
      waveAmplitude: 0.4,
      waveFrequency: 0.04,
      slots: [
        { posX: -36, posY: -36 },
        { posX: 36, posY: -36 },
        { posX: 0, posY: 18 },
        { posX: 72, posY: 18 },
      ],
    },
    {
      name: "spiral-entry",
      movement: "shrinking-radius spiral with increasing rotation speed",
      breakPattern: "burst-outward",
      radiusChange: -0.8,
      rotationSpeed: 0.11,
      spawnChance: 0.18,
      holdTicks: 130,
      waveAmplitude: 0,
      waveFrequency: 0,
      slots: [
        { posX: 0, posY: -96 },
        { posX: 68, posY: -68 },
        { posX: 96, posY: 0 },
        { posX: 68, posY: 68 },
        { posX: 0, posY: 96 },
      ],
    },
    {
      name: "fake-formation",
      movement: "independent enemies with shared timing and direction",
      breakPattern: "independent-attack",
      spawnChance: 0.22,
      holdTicks: 60,
      waveAmplitude: 0.8,
      waveFrequency: 0.06,
      slots: [
        { posX: -96, posY: -48 },
        { posX: -24, posY: 0 },
        { posX: 48, posY: -24 },
        { posX: 112, posY: 36 },
      ],
    },
  ],
  5: [
    {
      name: "rotating-ring",
      movement: "continuous ring rotation with expansion and contraction",
      breakPattern: "individual-detach",
      radiusChange: 0.35,
      rotationSpeed: 0.075,
      spawnChance: 0.24,
      holdTicks: 160,
      waveAmplitude: 0,
      waveFrequency: 0,
      slots: [
        { posX: -36, posY: -76 },
        { posX: 36, posY: -76 },
        { posX: -84, posY: 0 },
        { posX: 84, posY: 0 },
        { posX: -36, posY: 76 },
        { posX: 36, posY: 76 },
      ],
    },
    {
      name: "swarm-burst",
      movement: "cluster spawn with radial outward burst",
      breakPattern: "radial-burst",
      spawnChance: 0.2,
      holdTicks: 70,
      waveAmplitude: 0.5,
      waveFrequency: 0.08,
      slots: [
        { posX: -28, posY: -28 },
        { posX: 0, posY: -34 },
        { posX: 28, posY: -28 },
        { posX: -34, posY: 0 },
        { posX: 34, posY: 0 },
        { posX: -28, posY: 28 },
        { posX: 0, posY: 34 },
        { posX: 28, posY: 28 },
      ],
    },
    {
      name: "chasing-wave",
      movement: "staggered spawn wave attempting interception",
      steering: "intercept-player",
      breakPattern: "emergent-chase",
      fireStaggerTicks: 6,
      spawnChance: 0.22,
      holdTicks: 90,
      waveAmplitude: 2,
      waveFrequency: 0.1,
      slots: [
        { posX: -96, posY: -72 },
        { posX: -48, posY: -36 },
        { posX: 0, posY: 0 },
        { posX: 48, posY: 36 },
        { posX: 96, posY: 72 },
      ],
    },
  ],
};

const timePilotConstants: TimePilotConstants = {
  player: {
    sprite: {
      src: assetPath("sprites/player/player.png"),
    },
    spriteFrameAxis: "x",
    frameWidth: 16,
    frameHeight: 16,
    width: 32,
    height: 32,
    hitRadius: 8,
    rotationFrameCount: 32,
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
  sounds: {
    coinDrop: {
      src: assetPath("sounds/coindrop.wav"),
    },
    enemyShoot: {
      src: assetPath("sounds/enemy_shoot.wav"),
    },
    gameStart: {
      src: assetPath("sounds/game_start.wav"),
    },
    nextLevel: {
      src: assetPath("sounds/next_level.wav"),
    },
    timeWarp: {
      src: assetPath("sounds/timewarp.wav"),
    },
    waveStart: {
      src: assetPath("sounds/wave_start.wav"),
    },
  },
  scoring,
  limits: {
    bossKillThresholdBase: 56,
    bossKillThresholdIncrementPerLevel: 0,
    bonuses: 1,
    enemyBullets: 4,
    props: 20,
    spawningRadius: 450,
    despawnRadius: 500,
  },
  levels: {
    1: {
      enabled: true,
      arena: {
        introText: i18n.levels[1].introText,
        backgroundColor: palette.level.sky1910,
        spawningArc: 90,
        spawningRadius: 450,
        despawnRadius: 500,
      },
      player: {
        velocity: playerMovementSpeed,
        turnInterval: 5,
      },
      enemies: {
        basic: basicEnemy(1, {
          animationRows: 2,
          deathFlashFrameY: 2,
          deathFlashTicks: 6,
        }),
        boss: bossEnemy(1, {
          width: 30,
          height: 16,
          hitRadius: 24,
          renderHeight: 32,
          renderWidth: 60,
        }),
        formations: levelOneFormations,
      },
      bonus: parachuteBonus,
      props: levelOneProps,
    },
    2: {
      enabled: true,
      arena: {
        introText: i18n.levels[2].introText,
        backgroundColor: palette.level.sky1940,
        spawningArc: 90,
        spawningRadius: 450,
        despawnRadius: 500,
      },
      player: {
        velocity: playerMovementSpeed,
        turnInterval: 5,
      },
      enemies: {
        basic: basicEnemy(2, {
          velocity: 4.25,
          turnLimiter: 22,
          firingChance: 0.5,
          spawnLimit: 11,
          projectile: {
            velocity: projectileSpeeds.bullet1940,
            size: 6,
            color: palette.aircraft.enemyBullet,
          },
        }),
        boss: bossEnemy(2, {
          width: 32,
          height: 9,
          hitRadius: 22,
          renderHeight: 18,
          renderWidth: 64,
          velocity: 3.2,
          turnLimiter: 44,
        }),
        formations: futureLevelFormations[2],
        specialBomber: specialBomber(2),
      },
      bonus: parachuteBonus,
      props: levelOneProps,
    },
    3: {
      enabled: true,
      arena: {
        introText: i18n.levels[3].introText,
        backgroundColor: palette.level.sky1970,
        spawningArc: 90,
        spawningRadius: 450,
        despawnRadius: 500,
      },
      player: {
        velocity: playerMovementSpeed,
        turnInterval: 5,
      },
      enemies: {
        basic: basicEnemy(3, {
          animationRows: 2,
          deathFlashFrameY: 2,
          deathFlashTicks: 6,
          horizontalDirectionFrames: 9,
          width: 16,
          height: 16,
          renderWidth: 32,
          renderHeight: 32,
          velocity: 5,
          turnLimiter: 14,
          firingChance: 0.55,
          spawnLimit: 13,
          projectile: {
            velocity: projectileSpeeds.missile1970,
            size: 8,
            color: palette.aircraft.enemyBullet,
            sprite: rocketProjectileSprite,
            shootable: true,
          },
        }),
        boss: bossEnemy(3, {
          width: 32,
          height: 13,
          hitRadius: 23,
          renderHeight: 26,
          renderWidth: 64,
          velocity: 3.5,
          turnLimiter: 38,
          firingChance: 0.3,
          projectile: {
            velocity: projectileSpeeds.missile1970,
            size: 8,
            color: palette.aircraft.enemyBullet,
            sprite: rocketProjectileSprite,
            shootable: true,
          },
        }),
        formations: futureLevelFormations[3],
      },
      bonus: parachuteBonus,
      props: levelOneProps,
    },
    4: {
      enabled: true,
      arena: {
        introText: i18n.levels[4].introText,
        backgroundColor: palette.level.sky1982,
        spawningArc: 90,
        spawningRadius: 450,
        despawnRadius: 500,
      },
      player: {
        velocity: playerMovementSpeed,
        turnInterval: 5,
      },
      enemies: {
        basic: basicEnemy(4, {
          velocity: 6.25,
          turnLimiter: 10,
          firingChance: 0.65,
          spawnLimit: 15,
          projectile: {
            velocity: projectileSpeeds.missile1982,
            size: 8,
            color: palette.aircraft.enemyBullet,
            sprite: rocketProjectileSprite,
            tracksPlayer: true,
            turnRate: 4,
            shootable: true,
          },
        }),
        boss: bossEnemy(4, {
          width: 32,
          height: 13,
          hitRadius: 23,
          renderHeight: 26,
          renderWidth: 64,
          velocity: 3.75,
          turnLimiter: 34,
          firingChance: 0.35,
          projectile: {
            velocity: projectileSpeeds.missile1982,
            size: 8,
            color: palette.aircraft.enemyBullet,
            sprite: rocketProjectileSprite,
            tracksPlayer: true,
            turnRate: 4,
            shootable: true,
          },
        }),
        formations: futureLevelFormations[4],
      },
      bonus: parachuteBonus,
      props: levelOneProps,
    },
    5: {
      enabled: true,
      arena: {
        introText: i18n.levels[5].introText,
        backgroundColor: palette.level.sky2001,
        spawningArc: 100,
        spawningRadius: 470,
        despawnRadius: 520,
      },
      player: {
        velocity: playerMovementSpeed,
        turnInterval: 5,
      },
      enemies: {
        basic: basicEnemy(5, {
          animationFrames: 4,
          canRotate: false,
          velocity: 7.5,
          turnLimiter: 8,
          firingChance: 0.68,
          spawnLimit: 16,
          projectile: {
            velocity: projectileSpeeds.energy2001,
            size: 6,
            color: palette.aircraft.enemyBullet,
          },
        }),
        boss: bossEnemy(5, {
          animationFrames: 2,
          bossDamageFrames: 0,
          width: 32,
          height: 16,
          hitRadius: 24,
          renderHeight: 32,
          renderWidth: 64,
          velocity: 4,
          turnLimiter: 30,
          firingChance: 0.4,
          projectile: {
            velocity: projectileSpeeds.energy2001,
            size: 6,
            color: palette.aircraft.enemyBullet,
          },
        }),
        formations: futureLevelFormations[5],
      },
      bonus: parachuteBonus,
      props: levelOneProps,
    },
  },
};

export const { player, sounds, limits, levels } = timePilotConstants;
export { scoring };
export default timePilotConstants;
