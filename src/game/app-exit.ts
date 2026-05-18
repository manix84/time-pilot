/**
 * Event dispatched when the browser appears to have refused app closure.
 */
export const appExitBlockedEvent = "timePilot:appExitBlocked";

/**
 * Requests that the installed app window closes.
 *
 * Browser support is intentionally limited. Android installed PWAs and normal
 * browser tabs commonly ignore {@link Window.close}; if the document remains
 * visible shortly after the request, callers are notified so they can show a
 * useful fallback instead of leaving the Exit action feeling broken.
 */
export const exitInstalledApp = (): void => {
  try {
    window.close();
  } finally {
    window.setTimeout(() => {
      if (document.visibilityState === "hidden") {
        return;
      }

      window.dispatchEvent(new CustomEvent(appExitBlockedEvent));
    }, 300);
  }
};
