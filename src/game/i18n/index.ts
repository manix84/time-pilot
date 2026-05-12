import de from "./de";
import en from "./en";
import fr from "./fr";
import it from "./it";
import nl from "./nl";
import ro from "./ro";
import type { GameLanguage } from "../types";
import userOptions from "../user-options";

export type GameMessages = typeof en;

export const messages: Record<GameLanguage, GameMessages> = {
  de,
  en,
  fr,
  it,
  nl,
  ro,
};

export const availableLanguages: GameLanguage[] = [
  "en",
  "fr",
  "de",
  "it",
  "nl",
  "ro",
];
export const currentLanguage: GameLanguage = "en";

export const getCurrentLanguage = (): GameLanguage => {
  return availableLanguages.includes(userOptions.language)
    ? userOptions.language
    : currentLanguage;
};

export const getCurrentMessages = (): GameMessages => {
  return messages[getCurrentLanguage()];
};

export const i18n = new Proxy(en, {
  get: (_target, property: keyof GameMessages) => {
    return getCurrentMessages()[property];
  },
}) as GameMessages;

export const getLanguageName = (language: GameLanguage): string => {
  return messages[language].language.name;
};

export const getLevelIntroText = (level: number): string => {
  const levelMessages = getCurrentMessages().levels as Record<
    number,
    { introText: string }
  >;

  return levelMessages[level]?.introText ?? levelMessages[1].introText;
};

export default i18n;
