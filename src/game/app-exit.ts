import {
  appExitBlockedEventName,
  exitInstalledApp as exitEngineInstalledApp,
} from "arcade-engine";

/**
 * Event dispatched when the browser appears to have refused app closure.
 */
export const appExitBlockedEvent = appExitBlockedEventName;

/**
 * Requests that the installed app window closes.
 */
export const exitInstalledApp = (): void => {
  exitEngineInstalledApp();
};
