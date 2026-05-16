import de from "./de";
import en from "./en";
import es from "./es";
import fr from "./fr";
import it from "./it";
import nl from "./nl";
import ro from "./ro";
import type { GameLanguage } from "../types";
import userOptions from "../user-options";

/**
 * Shape of every localized game message bundle.
 */
export type GameMessages = typeof en;

/**
 * Localized message bundles keyed by language code.
 */
export const messages: Record<GameLanguage, GameMessages> = {
  de,
  en,
  es,
  fr,
  it,
  nl,
  ro,
};

/**
 * Languages exposed in the language menu.
 */
export const availableLanguages: GameLanguage[] = [
  "en",
  "fr",
  "es",
  "de",
  "it",
  "nl",
  "ro",
];

/**
 * Fallback language used when an invalid option is encountered.
 */
export const currentLanguage: GameLanguage = "en";

/**
 * Resolves the current language from user options.
 */
export const getCurrentLanguage = (): GameLanguage => {
  return availableLanguages.includes(userOptions.language)
    ? userOptions.language
    : currentLanguage;
};

/**
 * Gets the active localized message bundle.
 */
export const getCurrentMessages = (): GameMessages => {
  return messages[getCurrentLanguage()];
};

/**
 * Proxy that always reads strings from the active language bundle.
 */
export const i18n = new Proxy(en, {
  get: (_target, property: keyof GameMessages) => {
    return getCurrentMessages()[property];
  },
}) as GameMessages;

/**
 * Gets the display name for a language code.
 *
 * @param language - Language code to display.
 * @returns Localized language name.
 */
export const getLanguageName = (language: GameLanguage): string => {
  return messages[language].language.name;
};

/**
 * Gets intro text for a level in the active language.
 *
 * @param level - Numeric level/era.
 * @returns Localized level intro text, falling back to level 1.
 */
export const getLevelIntroText = (level: number): string => {
  const levelMessages = getCurrentMessages().levels as Record<
    number,
    { introText: string }
  >;

  return levelMessages[level]?.introText ?? levelMessages[1].introText;
};

export default i18n;
