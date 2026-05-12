import en from "./en";

export type GameMessages = typeof en;
export type GameLanguage = "en";

export const messages: Record<GameLanguage, GameMessages> = {
  en,
};

export const currentLanguage: GameLanguage = "en";
export const i18n = messages[currentLanguage];

export default i18n;
