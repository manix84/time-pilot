import { levels, limits, sounds } from "../constants";
import SoundEngine from "../engine/Sound";
import helpers from "../engine/helpers";
import type {
  Coordinates,
  EnemyData,
  EnemyFormationConfig,
  GameDataStore,
  Heading,
  SpawningSystemInstance,
} from "../types";
import { getScaledEntityLimit, getSpawnRadius } from "../viewport";

const bonusSpawnIntervalMinTicks = 600;
const bonusSpawnIntervalRangeTicks = 600;
const bonusSpawnPadding = 48;
const specialBomberBombIntervalTicks = 90;
const specialBomberBombChance = 1;
const specialBomberSpawnIntervalMinTicks = 900;
const specialBomberSpawnIntervalRangeTicks = 900;
const enemyFireIntervalTicks = 20;
let nextFormationId = 1;

/**
 * Spawns enemies, formations, projectiles, bonuses, and initial scenery.
 */
class SpawningSystem implements SpawningSystemInstance {
  private _context: GameDataStore;
  private _waveStartSound = new SoundEngine(sounds.waveStart.src);

  constructor(context: GameDataStore) {
    this._context = context;
  }

  addInitialProps = (): void => {
    const player = this._context._player.getData();
    const halfWidth = this._context._gameArena.width / 2;
    const halfHeight = this._context._gameArena.height / 2;
    const spawnPadding = 96;

    for (let i = 0; i < this.getPropLimit(); i++) {
      this._context._props.create(
        player.posX +
          Math.floor(
            Math.random() * (this._context._gameArena.width + spawnPadding * 2)
          ) -
          halfWidth -
          spawnPadding,
        player.posY +
          Math.floor(
            Math.random() * (this._context._gameArena.height + spawnPadding * 2)
          ) -
          halfHeight -
          spawnPadding
      );
    }
  };

  spawnEntities = (): void => {
    if (this.isLevelIntroActive()) {
      return;
    }

    this._spawnEnemy();
    this._spawnProp();
    this._spawnEnemyBullet();
    this._spawnSpecialBomberBomb();
    this._spawnBonus();
  };

  private isLevelIntroActive = (): boolean => {
    return (
      !!this._context._levelIntroUntilTick &&
      this._context._gameTicker.getTicks() < this._context._levelIntroUntilTick
    );
  };

  private _spawnEnemy = (): void => {
    if (this._spawnBoss()) {
      return;
    }

    if (this._context._levelProgress.bossSpawned) {
      return;
    }

    if (this._spawnSpecialBomber()) {
      return;
    }

    const randomTickInterval = Math.floor(Math.random() * 200) + 1;

    if (
      this._context._gameTicker.getTicks() % randomTickInterval !== 0 ||
      !this._context._enemies.isUnderLimit()
    ) {
      return;
    }

    if (this._spawnFormation()) {
      return;
    }

    const data = helpers.getSpawnCoords(this._context._player.getData(), {
      spawnRadius: getSpawnRadius(this._context._gameArena),
    });
    const heading = helpers.findHeading(data, {
      posX: this._context._player.getData().posX,
      posY: this._context._player.getData().posY,
    });

    this._context._enemies.create(data.posX, data.posY, heading);
  };

  private _spawnBoss = (): boolean => {
    const progress = this._context._levelProgress;

    if (
      progress.bossSpawned ||
      progress.standardEnemyKills < progress.bossKillThreshold ||
      !this._context._enemies.isUnderLimit()
    ) {
      return false;
    }

    const data = helpers.getSpawnCoords(this._context._player.getData(), {
      spawnRadius: getSpawnRadius(this._context._gameArena),
    });
    const heading = helpers.findHeading(data, {
      posX: this._context._player.getData().posX,
      posY: this._context._player.getData().posY,
    });

    this._context._enemies.create(data.posX, data.posY, heading, {
      type: "boss",
    });
    progress.bossSpawned = true;

    return true;
  };

  private _spawnSpecialBomber = (): boolean => {
    const levelData = levels[this._context._level].enemies.specialBomber;

    if (!levelData || this._context._level !== 2) {
      return false;
    }

    const hasBomber = this._context._enemies
      .getData()
      .some((enemy) => enemy.type === "specialBomber");
    const randomTickInterval =
      Math.floor(Math.random() * specialBomberSpawnIntervalRangeTicks) +
      specialBomberSpawnIntervalMinTicks;

    if (
      hasBomber ||
      this._context._gameTicker.getTicks() % randomTickInterval !== 0 ||
      !this._context._enemies.isUnderLimit()
    ) {
      return false;
    }

    const player = this._context._player.getData();
    const halfWidth = this._context._gameArena.width / 2;
    const halfHeight = this._context._gameArena.height / 2;
    const travelsRight = Math.random() < 0.5;
    const spawnPadding = levelData.renderWidth ?? levelData.width;
    const posX = travelsRight
      ? player.posX - halfWidth - spawnPadding
      : player.posX + halfWidth + spawnPadding;
    const posY = player.posY - halfHeight + Math.random() * this._context._gameArena.height;

    this._context._enemies.create(posX, posY, travelsRight ? 90 : 270, {
      type: "specialBomber",
    });

    return true;
  };

  private _spawnFormation = (): boolean => {
    const formation = this._pickFormation();

    if (
      !formation ||
      this._context._enemies.getCount() + formation.slots.length >
        getScaledEntityLimit(
          levels[this._context._level].enemies.basic.spawnLimit,
          this._context._gameArena
        )
    ) {
      return false;
    }

    const center = helpers.getSpawnCoords(this._context._player.getData(), {
      spawnRadius: getSpawnRadius(this._context._gameArena),
    });
    const heading = helpers.findHeading(center, {
      posX: this._context._player.getData().posX,
      posY: this._context._player.getData().posY,
    });
    const formationId = `${this._context._level}-${nextFormationId++}`;
    const formationUntilTick =
      this._context._gameTicker.getTicks() + formation.holdTicks;

    this._context._formations[formationId] = {
      awarded: false,
      escaped: false,
      remaining: formation.slots.length,
      total: formation.slots.length,
    };
    this._context._achievements?.onWaveStarted(formationId);

    this._waveStartSound.stop();
    this._waveStartSound.play();

    formation.slots.forEach((slot, index) => {
      const position = this._rotateFormationSlot(center, slot, heading);

      this._context._enemies.create(position.posX, position.posY, heading, {
        formationId,
        formationUntilTick,
        formationWaveAmplitude: formation.waveAmplitude,
        formationWaveFrequency: formation.waveFrequency,
        formationWavePhase: index * 0.45,
      });
    });

    return true;
  };

  private _pickFormation = (): EnemyFormationConfig | false => {
    const formations = levels[this._context._level].enemies.formations;

    if (!formations.length) {
      return false;
    }

    const formation = formations[Math.floor(Math.random() * formations.length)];

    return Math.random() <= formation.spawnChance ? formation : false;
  };

  private _rotateFormationSlot = (center: Coordinates, slot: Coordinates, heading: Heading): Coordinates => {
    const radians = heading * (Math.PI / 180);

    return {
      posX:
        center.posX +
        helpers.float(slot.posX * Math.cos(radians) - slot.posY * Math.sin(radians)),
      posY:
        center.posY +
        helpers.float(slot.posX * Math.sin(radians) + slot.posY * Math.cos(radians)),
    };
  };

  private _spawnProp = (): void => {
    if (this._context._props.getCount() >= this.getPropLimit()) {
      return;
    }

    const data: Coordinates = helpers.getSpawnCoords(
      this._context._player.getData(),
      {
        spawnRadius: getSpawnRadius(this._context._gameArena),
      }
    );
    this._context._props.create(data.posX, data.posY);
  };

  private _spawnEnemyBullet = (): void => {
    if (
      this._context._enemyBullets.getCount() >=
        getScaledEntityLimit(
          limits.enemyBullets,
          this._context._gameArena
        ) ||
      this._context._gameTicker.getTicks() % enemyFireIntervalTicks !== 0
    ) {
      return;
    }

    const enemies = this._context._enemies
      .getEntities()
      .filter((enemy) => enemy.isAlive)
      .map((enemy) => enemy.getData() as EnemyData)
      .filter((enemy) => enemy.type !== "specialBomber");

    if (!enemies.length) {
      return;
    }

    const player = this._context._player.getData();
    const enemy = enemies[Math.floor(Math.random() * enemies.length)];
    const levelData =
      levels[this._context._level].enemies[enemy.type] ??
      levels[this._context._level].enemies.basic;

    if (Math.random() > levelData.firingChance) {
      return;
    }

    const heading =
      levelData.projectile.initialAim === "facing"
        ? enemy.heading
        : helpers.findHeading(enemy, {
          posX: player.posX,
          posY: player.posY,
        });

    this._context._enemyBullets.create(
      enemy.posX,
      enemy.posY,
      heading,
      levelData.projectile.size,
      levelData.projectile.velocity,
      levelData.projectile.color,
      false,
      "world",
      levelData.projectile.sprite ? "sprite" : "circle",
      levelData.projectile.sprite,
      levelData.projectile.tracksPlayer,
      levelData.projectile.turnRate,
      levelData.projectile.shootable,
      levelData.projectile.explosion,
      levelData.projectile.sound,
      levelData.projectile.flightSound,
      levelData.projectile.explosionSound
    );
    this._context._achievements?.onEnemyProjectileSpawned(
      levelData.projectile
    );
  };

  private _spawnSpecialBomberBomb = (): void => {
    if (
      this._context._enemyBullets.getCount() >=
        getScaledEntityLimit(
          limits.enemyBullets,
          this._context._gameArena
        ) ||
      this._context._gameTicker.getTicks() % specialBomberBombIntervalTicks !==
        0 ||
      Math.random() > specialBomberBombChance
    ) {
      return;
    }

    const bomber = this._context._enemies
      .getEntities()
      .find(
        (enemy) =>
          enemy.isAlive && enemy.getData("type") === "specialBomber"
      );

    if (!bomber) {
      return;
    }

    const bomberData = bomber.getData() as EnemyData;
    const levelData = levels[this._context._level].enemies.specialBomber;

    if (!levelData) {
      return;
    }

    this._context._enemyBullets.create(
      bomberData.posX,
      bomberData.posY + (levelData.renderHeight ?? levelData.height) / 2,
      180,
      levelData.projectile.size,
      levelData.projectile.velocity,
      levelData.projectile.color,
      false,
      "world",
      levelData.projectile.sprite ? "sprite" : "circle",
      levelData.projectile.sprite,
      levelData.projectile.tracksPlayer,
      levelData.projectile.turnRate,
      levelData.projectile.shootable,
      levelData.projectile.explosion,
      levelData.projectile.sound,
      levelData.projectile.flightSound,
      levelData.projectile.explosionSound
    );
    this._context._achievements?.onEnemyProjectileSpawned(
      levelData.projectile
    );
  };

  private _spawnBonus = (): void => {
    if (this._context._bonuses.getCount() >= limits.bonuses) {
      return;
    }

    const randomTickInterval =
      Math.floor(Math.random() * bonusSpawnIntervalRangeTicks) +
      bonusSpawnIntervalMinTicks;

    if (this._context._gameTicker.getTicks() % randomTickInterval !== 0) {
      return;
    }

    const data = this._getBonusSpawnCoords();
    this._context._bonuses.create(data.posX, data.posY);
  };

  private _getBonusSpawnCoords = (): Coordinates => {
    const player = this._context._player.getData();
    const halfWidth = this._context._gameArena.width / 2;
    const halfHeight = this._context._gameArena.height / 2;
    const side = Math.floor(Math.random() * 3);

    if (side === 1) {
      return {
        posX: player.posX - halfWidth - bonusSpawnPadding,
        posY: player.posY - halfHeight + Math.random() * halfHeight,
      };
    }

    if (side === 2) {
      return {
        posX: player.posX + halfWidth + bonusSpawnPadding,
        posY: player.posY - halfHeight + Math.random() * halfHeight,
      };
    }

    return {
      posX:
        player.posX - halfWidth + Math.random() * this._context._gameArena.width,
      posY: player.posY - halfHeight - bonusSpawnPadding,
    };
  };

  private getPropLimit = (): number => {
    return getScaledEntityLimit(limits.props, this._context._gameArena);
  };
}

export default SpawningSystem;
