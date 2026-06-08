import { enterImmersiveMode } from "arcade-engine";

/**
 * Requests fullscreen canvas presentation and landscape orientation.
 *
 * Mobile browsers only allow these calls from trusted user interactions, so
 * callers should invoke this from a start/continue/restart command rather than
 * during automatic app boot.
 */
export const enterGameFullscreen = async (): Promise<void> => {
  await enterImmersiveMode({ orientation: "landscape" });
};
