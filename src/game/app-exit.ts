/**
 * Requests that the installed app window closes.
 *
 * Browser support is intentionally limited; Android installed PWAs may honour
 * this from a user gesture, while normal browser tabs usually ignore it.
 */
export const exitInstalledApp = (): void => {
  window.close();
};
