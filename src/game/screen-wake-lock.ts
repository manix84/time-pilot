type WakeLockSentinel = EventTarget & {
  release: () => Promise<void>;
  released?: boolean;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinel>;
  };
};

/**
 * Returns whether this browser exposes the Screen Wake Lock API.
 */
export const canUseScreenWakeLock = (): boolean => {
  return typeof (navigator as WakeLockNavigator).wakeLock?.request === "function";
};

/**
 * Manages a best-effort screen wake lock for installed PWA gameplay.
 */
export class ScreenWakeLockController {
  private isRequested = false;
  private sentinel: WakeLockSentinel | null = null;

  constructor() {
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
  }

  /**
   * Acquires or releases the lock based on gameplay state and user preference.
   *
   * @param active - Whether the game should currently keep the screen awake.
   */
  setActive = (active: boolean): void => {
    this.isRequested = active;

    if (active) {
      void this.acquire();
      return;
    }

    void this.release();
  };

  /**
   * Releases the wake lock and unregisters browser lifecycle listeners.
   */
  destroy = (): void => {
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.isRequested = false;
    void this.release();
  };

  /**
   * Reacquires the wake lock after returning from a hidden tab/app state.
   */
  private handleVisibilityChange = (): void => {
    if (document.visibilityState !== "visible") {
      void this.release();
      return;
    }

    if (this.isRequested) {
      void this.acquire();
    }
  };

  /**
   * Requests the browser's screen wake lock if one is not already held.
   */
  private acquire = async (): Promise<void> => {
    if (
      this.sentinel ||
      document.visibilityState !== "visible" ||
      !canUseScreenWakeLock()
    ) {
      return;
    }

    try {
      const sentinel = await (navigator as WakeLockNavigator).wakeLock!.request(
        "screen"
      );

      this.sentinel = sentinel;
      sentinel.addEventListener("release", this.handleSentinelRelease, {
        once: true,
      });
    } catch {
      // Wake lock is optional; unsupported or denied requests should not stop play.
    }
  };

  /**
   * Releases the active screen wake lock, if the browser still holds one.
   */
  private release = async (): Promise<void> => {
    const sentinel = this.sentinel;

    this.sentinel = null;

    if (!sentinel || sentinel.released) {
      return;
    }

    try {
      await sentinel.release();
    } catch {
      // Releasing is best-effort; the browser may have already released it.
    }
  };

  /**
   * Clears local state when the browser releases the lock externally.
   */
  private handleSentinelRelease = (): void => {
    this.sentinel = null;

    if (this.isRequested && document.visibilityState === "visible") {
      void this.acquire();
    }
  };
}
