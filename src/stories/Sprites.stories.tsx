import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { assetPath } from "../game/asset-path";
import { levels, player } from "../game/constants";
import type { EnemyConfig } from "../game/types";
import "./storybook.css";

type SpriteGalleryMode =
  | "animation"
  | "directions"
  | "damage"
  | "deathFlash"
  | "states"
  | "static";

type SpriteFrame = {
  x: number;
  y: number;
};

type SpriteModeDefinition = {
  frames: SpriteFrame[];
  label: string;
};

type SpriteDefinition = {
  category: string;
  columns: number;
  frameHeight: number;
  frameWidth: number;
  modes: Partial<Record<SpriteGalleryMode, SpriteModeDefinition>>;
  name: string;
  rows: number;
  src: string;
};

const spriteModes: Array<{ label: string; value: SpriteGalleryMode }> = [
  { label: "Animation", value: "animation" },
  { label: "Directions", value: "directions" },
  { label: "Damage", value: "damage" },
  { label: "Death Flash", value: "deathFlash" },
  { label: "States", value: "states" },
  { label: "Static", value: "static" },
];

const frameDurationMs = 180;

const frameRange = (count: number, y = 0): SpriteFrame[] =>
  Array.from({ length: count }, (_, x) => ({ x, y }));

const rowRange = (count: number, x = 0): SpriteFrame[] =>
  Array.from({ length: count }, (_, y) => ({ x, y }));

const enemyDirectionFrames = (enemy: EnemyConfig): number => {
  if (enemy.horizontalDirectionFrames) {
    return enemy.horizontalDirectionFrames;
  }

  return enemy.canRotate ? 16 : Math.max(1, enemy.animationFrames ?? 1);
};

const createEnemySprite = (
  category: string,
  name: string,
  enemy: EnemyConfig
): SpriteDefinition => {
  const hasDamageFrames = Boolean(enemy.damageFrames || enemy.bossDamageFrames);
  const animationFrames = hasDamageFrames
    ? [{ x: 0, y: 0 }]
    : enemy.animationRows
      ? rowRange(enemy.animationRows)
      : frameRange(Math.max(1, enemy.animationFrames ?? enemy.bossDamageFrames ?? 1));
  const directions = frameRange(enemyDirectionFrames(enemy));
  const deathFlash =
    enemy.deathFlashFrameY === undefined
      ? undefined
      : frameRange(enemyDirectionFrames(enemy), enemy.deathFlashFrameY);
  const damageFrameCount = enemy.damageFrames ?? enemy.bossDamageFrames ?? 0;
  const damageFrames =
    damageFrameCount > 0
      ? [
        ...frameRange(damageFrameCount, 0),
        ...frameRange(damageFrameCount, 0).map((frame) => ({
          x: frame.x + (enemy.leftFacingFrameOffset ?? damageFrameCount),
          y: frame.y,
        })),
      ]
      : undefined;

  return {
    category,
    columns: Math.max(
      directions.length,
      animationFrames.length,
      enemy.damageFrames ?? 0,
      enemy.bossDamageFrames ? enemy.bossDamageFrames * 2 : 0,
      1
    ),
    frameHeight: enemy.height,
    frameWidth: enemy.width,
    modes: {
      animation: {
        frames: animationFrames,
        label: hasDamageFrames
          ? "Static sprite; use Damage to inspect damage levels"
          : enemy.animationRows
            ? "Animation rows"
            : `${animationFrames.length} animation frames`,
      },
      directions: {
        frames: directions,
        label: enemy.canRotate || enemy.horizontalDirectionFrames
          ? `${directions.length} direction frames`
          : "Static facing",
      },
      ...(deathFlash
        ? {
          deathFlash: {
            frames: deathFlash,
            label: `Death flash row ${enemy.deathFlashFrameY}`,
          },
        }
        : {}),
      ...(damageFrames
        ? {
          damage: {
            frames: damageFrames,
            label: "Damage levels: right-facing frames, then left-facing frames",
          },
        }
        : {}),
    },
    name,
    rows: Math.max(
      enemy.animationRows ?? 1,
      enemy.deathFlashFrameY === undefined ? 1 : enemy.deathFlashFrameY + 1
    ),
    src: enemy.sprite.src,
  };
};

const spriteDefinitions: SpriteDefinition[] = [
  {
    category: "Game UI/Connection",
    columns: 8,
    frameHeight: 32,
    frameWidth: 32,
    modes: {
      animation: { frames: frameRange(8, 0), label: "Error row" },
    },
    name: "Satellite - Error",
    rows: 4,
    src: assetPath("sprites/ui/satelite.png"),
  },
  {
    category: "Game UI/Connection",
    columns: 8,
    frameHeight: 32,
    frameWidth: 32,
    modes: {
      animation: { frames: frameRange(8, 1), label: "Waiting row" },
    },
    name: "Satellite - Waiting",
    rows: 4,
    src: assetPath("sprites/ui/satelite.png"),
  },
  {
    category: "Game UI/Connection",
    columns: 8,
    frameHeight: 32,
    frameWidth: 32,
    modes: {
      animation: { frames: frameRange(8, 2), label: "Syncing row" },
    },
    name: "Satellite - Syncing",
    rows: 4,
    src: assetPath("sprites/ui/satelite.png"),
  },
  {
    category: "Game UI/Connection",
    columns: 8,
    frameHeight: 32,
    frameWidth: 32,
    modes: {
      animation: { frames: frameRange(8, 3), label: "Success row" },
    },
    name: "Satellite - Success",
    rows: 4,
    src: assetPath("sprites/ui/satelite.png"),
  },
  ...(["gold", "silver", "bronze"] as const).map((place) => ({
    category: "Game UI/Trophies",
    columns: 8,
    frameHeight: 32,
    frameWidth: 32,
    modes: {
      animation: {
        frames: frameRange(8),
        label: `${place} trophy animation`,
      },
    },
    name: `Trophy - ${place[0].toUpperCase()}${place.slice(1)}`,
    rows: 1,
    src: assetPath(`sprites/achievements/trophy_${place}_32.png`),
  })),
  {
    category: "Player",
    columns: player.rotationFrameCount,
    frameHeight: player.frameHeight,
    frameWidth: player.frameWidth,
    modes: {
      directions: {
        frames: frameRange(player.rotationFrameCount, 0),
        label: "Normal gameplay layer: 32 directions, starting at 90 degrees/right-facing",
      },
      animation: {
        frames: frameRange(player.rotationFrameCount, 0),
        label: "Normal gameplay heading sweep, starting at 90 degrees/right-facing",
      },
    },
    name: "Player Ship - Normal",
    rows: 3,
    src: player.sprite.src,
  },
  {
    category: "Player",
    columns: player.rotationFrameCount,
    frameHeight: player.frameHeight,
    frameWidth: player.frameWidth,
    modes: {
      directions: {
        frames: frameRange(player.rotationFrameCount, 1),
        label: "White warp mask layer: 32 directions, starting at 90 degrees/right-facing",
      },
      animation: {
        frames: frameRange(player.rotationFrameCount, 1),
        label: "White warp mask heading sweep, starting at 90 degrees/right-facing",
      },
    },
    name: "Player Ship - Warp White",
    rows: 3,
    src: player.sprite.src,
  },
  {
    category: "Player",
    columns: player.rotationFrameCount,
    frameHeight: player.frameHeight,
    frameWidth: player.frameWidth,
    modes: {
      directions: {
        frames: frameRange(player.rotationFrameCount, 2),
        label: "Black warp mask layer: 32 directions, starting at 90 degrees/right-facing",
      },
      animation: {
        frames: frameRange(player.rotationFrameCount, 2),
        label: "Black warp mask heading sweep, starting at 90 degrees/right-facing",
      },
    },
    name: "Player Ship - Warp Black",
    rows: 3,
    src: player.sprite.src,
  },
  ...Object.entries(levels).flatMap(([level, levelConfig]) => {
    const category = `Era ${level}`;
    const sprites: SpriteDefinition[] = [
      createEnemySprite(category, `Basic Enemy ${level}`, levelConfig.enemies.basic),
      createEnemySprite(category, `Boss ${level}`, levelConfig.enemies.boss),
    ];

    if (levelConfig.enemies.specialBomber) {
      sprites.push(
        createEnemySprite(
          category,
          `Special Bomber ${level}`,
          levelConfig.enemies.specialBomber
        ),
      );
    }

    return sprites;
  }),
  {
    category: "Projectiles",
    columns: 16,
    frameHeight: 9,
    frameWidth: 12,
    modes: {
      directions: { frames: frameRange(16), label: "Rocket heading frames" },
      animation: { frames: frameRange(16), label: "Rocket heading sweep" },
    },
    name: "Rocket",
    rows: 1,
    src: assetPath("sprites/enemies/projectiles/rocket.png"),
  },
  {
    category: "Projectiles",
    columns: 2,
    frameHeight: 16,
    frameWidth: 16,
    modes: {
      animation: { frames: rowRange(2), label: "Bomb falling animation" },
    },
    name: "Bomb",
    rows: 2,
    src: assetPath("sprites/enemies/projectiles/bomb.png"),
  },
  {
    category: "Projectiles",
    columns: 8,
    frameHeight: 7,
    frameWidth: 8,
    modes: {
      animation: { frames: frameRange(8), label: "Plasma animation" },
    },
    name: "Plasma",
    rows: 1,
    src: assetPath("sprites/enemies/projectiles/plasma.png"),
  },
  ...[
    ["Bomb Explosion", "bomb_explosion.png", 11, 11],
    ["Rocket Explosion", "rocket_explosion.png", 11, 11],
    ["Plasma Explosion", "plasma_explosion.png", 16, 13],
  ].map(([name, file, width, height]) => ({
    category: "Projectiles",
    columns: 4,
    frameHeight: Number(height),
    frameWidth: Number(width),
    modes: {
      animation: {
        frames: frameRange(4),
        label: "Explosion animation",
      },
    },
    name: String(name),
    rows: 1,
    src: assetPath(`sprites/enemies/projectiles/${file}`),
  })),
  {
    category: "Explosions",
    columns: player.explosion.frames,
    frameHeight: player.explosion.height,
    frameWidth: player.explosion.width,
    modes: {
      animation: {
        frames: frameRange(player.explosion.frames),
        label: "Player explosion",
      },
    },
    name: "Player Explosion",
    rows: 1,
    src: player.explosion.sprite.src,
  },
  {
    category: "Explosions",
    columns: levels[1].enemies.basic.explosion.frames,
    frameHeight: levels[1].enemies.basic.explosion.height,
    frameWidth: levels[1].enemies.basic.explosion.width,
    modes: {
      animation: {
        frames: frameRange(levels[1].enemies.basic.explosion.frames),
        label: "Basic enemy explosion",
      },
    },
    name: "Basic Enemy Explosion",
    rows: 1,
    src: levels[1].enemies.basic.explosion.sprite.src,
  },
  {
    category: "Explosions",
    columns: levels[1].enemies.boss.explosion.frames,
    frameHeight: levels[1].enemies.boss.explosion.height,
    frameWidth: levels[1].enemies.boss.explosion.width,
    modes: {
      animation: {
        frames: frameRange(levels[1].enemies.boss.explosion.frames),
        label: "Boss explosion",
      },
    },
    name: "Boss Explosion",
    rows: 1,
    src: levels[1].enemies.boss.explosion.sprite.src,
  },
  ...(levels[2].enemies.specialBomber
    ? [
      {
        category: "Explosions",
        columns: levels[2].enemies.specialBomber.explosion.frames,
        frameHeight: levels[2].enemies.specialBomber.explosion.height,
        frameWidth: levels[2].enemies.specialBomber.explosion.width,
        modes: {
          animation: {
            frames: frameRange(levels[2].enemies.specialBomber.explosion.frames),
            label: "Special bomber explosion",
          },
        },
        name: "Special Bomber Explosion",
        rows: 1,
        src: levels[2].enemies.specialBomber.explosion.sprite.src,
      },
    ]
    : []),
  {
    category: "Bonuses",
    columns: 4,
    frameHeight: levels[1].bonus.height,
    frameWidth: levels[1].bonus.width,
    modes: {
      animation: {
        frames: levels[1].bonus.animationCycle.map((frame) => ({
          x: frame - 1,
          y: 0,
        })),
        label: "Parachute loop",
      },
    },
    name: "Parachute Bonus",
    rows: 1,
    src: levels[1].bonus.sprite.src,
  },
  ...levels[1].props.map((prop, index) => ({
    category: "Game UI/Props",
    columns: 1,
    frameHeight: prop.height,
    frameWidth: prop.width,
    modes: {
      static: { frames: [{ x: 0, y: 0 }], label: "Static prop" },
    },
    name: `Cloud ${index + 1}`,
    rows: 1,
    src: prop.sprite.src,
  })),
  ...levels[5].props.map((prop, index) => ({
    category: "Game UI/Props",
    columns: 1,
    frameHeight: prop.height,
    frameWidth: prop.width,
    modes: {
      static: { frames: [{ x: 0, y: 0 }], label: "Static prop" },
    },
    name: `Asteroid ${index + 1}`,
    rows: 1,
    src: prop.sprite.src,
  })),
];

const getScale = (sprite: SpriteDefinition): number => {
  const maxFrameSize = Math.max(sprite.frameWidth, sprite.frameHeight);

  if (maxFrameSize <= 12) {
    return 5;
  }

  if (maxFrameSize <= 16) {
    return 4;
  }

  if (maxFrameSize <= 32) {
    return 3;
  }

  return 2;
};

const getSpriteMode = (
  sprite: SpriteDefinition,
  selectedMode: SpriteGalleryMode
): SpriteModeDefinition => {
  return (
    sprite.modes[selectedMode] ??
    sprite.modes.animation ??
    sprite.modes.directions ??
    sprite.modes.damage ??
    sprite.modes.deathFlash ??
    sprite.modes.states ??
    sprite.modes.static ?? {
      frames: [{ x: 0, y: 0 }],
      label: "Static",
    }
  );
};

const SpriteFrameView = ({
  frame,
  scaleOverride,
  sprite,
}: {
  frame: SpriteFrame;
  scaleOverride?: number;
  sprite: SpriteDefinition;
}) => {
  const scale = scaleOverride ?? getScale(sprite);
  const style = {
    "--sprite-background-x": `${frame.x * sprite.frameWidth * scale * -1}px`,
    "--sprite-background-y": `${frame.y * sprite.frameHeight * scale * -1}px`,
    "--sprite-frame-render-height": `${sprite.frameHeight * scale}px`,
    "--sprite-frame-render-width": `${sprite.frameWidth * scale}px`,
    "--sprite-sheet-render-height": `${sprite.rows * sprite.frameHeight * scale}px`,
    "--sprite-sheet-render-width": `${sprite.columns * sprite.frameWidth * scale}px`,
    backgroundImage: `url("${sprite.src}")`,
  } as CSSProperties;

  return (
    <span
      className={"sprite-frame-view"}
      style={style}
    />
  );
};

const SpriteCard = ({
  animatedFrameIndex,
  selectedMode,
  sprite,
}: {
  animatedFrameIndex: number;
  selectedMode: SpriteGalleryMode;
  sprite: SpriteDefinition;
}) => {
  const mode = getSpriteMode(sprite, selectedMode);
  const activeFrameIndex = animatedFrameIndex % mode.frames.length;
  const animatedFrame = mode.frames[activeFrameIndex] ?? {
    x: 0,
    y: 0,
  };
  const isFallback = !sprite.modes[selectedMode];

  return (
    <article className={"sprite-card"}>
      <div className={"sprite-card-header"}>
        <div>
          <h2>{sprite.name}</h2>
          <p>{sprite.category}</p>
        </div>
        <span>{sprite.frameWidth}x{sprite.frameHeight}</span>
      </div>

      <div className={"sprite-preview-grid"}>
        <div>
          <h3>Animation</h3>
          <SpriteFrameView frame={animatedFrame} sprite={sprite} />
        </div>
        <SpriteFrameStrip
          activeFrameIndex={activeFrameIndex}
          frames={mode.frames}
          sprite={sprite}
        />
      </div>

      <p className={"sprite-mode-note"}>
        {mode.label}
        {isFallback ? ` (fallback for ${selectedMode})` : ""}
      </p>
    </article>
  );
};

const SpriteFrameStrip = ({
  activeFrameIndex,
  frames,
  sprite,
}: {
  activeFrameIndex: number;
  frames: SpriteFrame[];
  sprite: SpriteDefinition;
}) => {
  const stripScale = Math.min(2, getScale(sprite));

  return (
    <div className={"sprite-frame-strip-panel"}>
      <h3>Frames</h3>
      <div className={"sprite-frame-strip"}>
        {frames.map((frame, index) => (
          <span
            className={"sprite-frame-strip-item"}
            data-active={index === activeFrameIndex ? "true" : "false"}
            key={`${frame.x}-${frame.y}-${index}`}
          >
            <SpriteFrameView
              frame={frame}
              scaleOverride={stripScale}
              sprite={sprite}
            />
          </span>
        ))}
      </div>
    </div>
  );
};

const SpriteGallery = () => {
  const [animatedFrameIndex, setAnimatedFrameIndex] = useState(0);
  const [category, setCategory] = useState("All");
  const [selectedMode, setSelectedMode] =
    useState<SpriteGalleryMode>("animation");

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setAnimatedFrameIndex((frame) => frame + 1);
    }, frameDurationMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const categories = useMemo(
    () => ["All", ...new Set(spriteDefinitions.map((sprite) => sprite.category))],
    []
  );
  const visibleSprites = useMemo(
    () =>
      category === "All"
        ? spriteDefinitions
        : spriteDefinitions.filter((sprite) => sprite.category === category),
    [category]
  );

  return (
    <div className={"storybook-surface"}>
      <section className={"storybook-section storybook-sprites-section"}>
        <p className={"storybook-eyebrow"}>Sprite Sheets</p>
        <h1 className={"storybook-title"}>Time Pilot Sprite Gallery</h1>
        <p className={"sprite-gallery-copy"}>
          Select a global view mode to compare animation, direction, damage,
          death-flash, state, and static rows. Each card shows the live frame
          beside the source frame strip with the active frame highlighted.
        </p>

        <div className={"storybook-controls sprite-gallery-controls"}>
          <label>
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>
          <label>
            View
            <select
              value={selectedMode}
              onChange={(event) =>
                setSelectedMode(event.target.value as SpriteGalleryMode)
              }
            >
              {spriteModes.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={"sprite-gallery-grid"}>
          {visibleSprites.map((sprite) => (
            <SpriteCard
              animatedFrameIndex={animatedFrameIndex}
              key={`${sprite.category}-${sprite.name}`}
              selectedMode={selectedMode}
              sprite={sprite}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

const meta = {
  title: "Game UI/Sprites",
  component: SpriteGallery,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SpriteGallery>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Gallery: Story = {};
