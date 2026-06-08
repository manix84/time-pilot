import { createRuntimeLogger } from "arcade-engine";
import userOptions from "./user-options";

/**
 * Runtime logger controlled by the debug menu's Log Level setting.
 */
export const logger = createRuntimeLogger({
  getLevel: () => userOptions.logLevel,
  prefix: "[Time Pilot]",
});
