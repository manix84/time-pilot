import type { Preview } from "@storybook/react-vite";
import { assetPath } from "../src/game/asset-path";
import "../src/styles.css";

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

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "fullscreen",
  },
};

export default preview;
