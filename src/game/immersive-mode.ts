/**
 * Browser orientation API shape used by mobile PWAs.
 */
type LockableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>;
};

/**
 * Requests fullscreen canvas presentation and landscape orientation.
 *
 * Mobile browsers only allow these calls from trusted user interactions, so
 * callers should invoke this from a start/continue/restart command rather than
 * during automatic app boot.
 */
export const enterGameFullscreen = async (): Promise<void> => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }

    await (screen.orientation as LockableScreenOrientation | undefined)?.lock?.(
      "landscape"
    );
  } catch {
    // Some browsers block fullscreen or orientation locking; the game still runs.
  }
};
