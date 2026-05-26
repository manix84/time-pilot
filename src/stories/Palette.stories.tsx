import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import helpers from "../game/engine/helpers";
import palette from "../game/palette";
import "./storybook.scss";

type PaletteGroup = Record<string, string>;

const toTitleCase = (value: string): string => {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
};

const PaletteStory = () => {
  const [shieldColor, setShieldColor] = useState<string>(
    palette.aircraft.playerShield
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setShieldColor(helpers.getRandomColor());
    }, 300);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <main className={"storybook-surface"}>
      <section className={"storybook-section"}>
        <p className={"storybook-eyebrow"}>Design System</p>
        <h1 className={"storybook-title"}>Time Pilot Palette</h1>
        {Object.entries(palette).map(([groupName, group]) => (
          <section className={"palette-group"} key={groupName}>
            <h2>{toTitleCase(groupName)}</h2>
            <div className={"palette-grid"}>
              {Object.entries(group as PaletteGroup).map(([name, value]) => (
                <article className={"palette-swatch"} key={name}>
                  <div
                    className={"palette-color"}
                    style={{ background: value }}
                  />
                  <div className={"palette-meta"}>
                    <span className={"palette-name"}>{toTitleCase(name)}</span>
                    <span className={"palette-value"}>{value}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
        <section className={"palette-group"}>
          <h2>Generated Effects</h2>
          <div className={"palette-grid"}>
            <article className={"palette-swatch"}>
              <div
                className={"palette-color palette-shield"}
                style={{ background: shieldColor }}
              />
              <div className={"palette-meta"}>
                <span className={"palette-name"}>Invincibility Shield</span>
                <span className={"palette-value"}>{shieldColor}</span>
              </div>
            </article>
          </div>
        </section>
      </section>
    </main>
  );
};

const meta = {
  title: "Design System/Palette",
  component: PaletteStory,
  parameters: {
    docs: {
      description: {
        component:
          "Named game palette values used by canvas rendering, menus, HUD overlays, and level constants.",
      },
    },
  },
} satisfies Meta<typeof PaletteStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Colors: Story = {};
