/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MODE?: "auto" | "offline";
}

declare const __TIME_PILOT_VERSION__: string;
