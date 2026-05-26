import type { Preview } from "@storybook/react-vite";
import { assetPath } from "../src/game/asset-path";
import userOptions from "../src/game/user-options";
import "../src/styles/global.scss";

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerText =
    "@font-face {" +
    "font-family: 'theFont';" +
    `src: url('${assetPath("fonts/font.ttf")}');` +
    "font-display: block;" +
    "}";
  document.head.appendChild(style);
}

const storybookZoomPercent = 100;

const resetStorybookZoom = (): void => {
  if (userOptions.uiZoom !== storybookZoomPercent) {
    userOptions.setOption("uiZoom", storybookZoomPercent);
  }

  if (userOptions.gameZoom !== storybookZoomPercent) {
    userOptions.setOption("gameZoom", storybookZoomPercent);
  }
};

const preview: Preview = {
  decorators: [
    (Story) => {
      resetStorybookZoom();

      return Story();
    },
  ],
  parameters: {
    controls: {
      disable: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    actions: {
      disable: true,
    },
    interactions: {
      disable: true,
    },
    a11y: {
      disable: true,
    },
    layout: "fullscreen",
    options: {
      showPanel: false,
    },
  },
};

export default preview;
