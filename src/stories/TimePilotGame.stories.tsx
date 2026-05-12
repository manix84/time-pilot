import type { Meta, StoryObj } from "@storybook/react-vite";
import TimePilotGame from "../components/TimePilotGame";
import "./storybook.css";

const GameSandbox = () => {
  return (
    <main className={"storybook-surface"}>
      <section className={"storybook-section"}>
        <p className={"storybook-eyebrow"}>Game Sandbox</p>
        <h1 className={"storybook-title"}>Playable Time Pilot</h1>
        <div className={"storybook-game-frame"}>
          <section className={"game-panel"}>
            <TimePilotGame debug />
          </section>
        </div>
      </section>
    </main>
  );
};

const meta = {
  title: "Game/Playable Demo",
  component: GameSandbox,
  parameters: {
    docs: {
      description: {
        component:
          "A Storybook sandbox for testing the React-hosted canvas game with debug options enabled.",
      },
    },
  },
} satisfies Meta<typeof GameSandbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DebugEnabled: Story = {};
