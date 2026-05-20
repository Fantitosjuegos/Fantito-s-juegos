/**
 * i18n/index.ts
 * -------------
 * Public API for the i18n system.
 *
 * All existing imports of `t`, `isRTL`, `TranslationKey` from
 * '@/lib/translations' continue to work via the re-export in
 * translations.ts — nothing else in the codebase needs to change.
 *
 * To add a new language:
 *   1. Create src/lib/i18n/xx.ts  (copy en.ts as a template)
 *   2. Import and add it to the `translations` map below
 *   3. Add 'xx' to the Language type in onboarding-types.ts
 */

import type { Language } from '@/lib/onboarding-types';
import type { TranslationKeys } from './types';

import en from './en';
import es from './es';
import de from './de';
import fr from './fr';
import pt from './pt';
import it from './it';
import ar from './ar';

export type { TranslationKeys };
export type { TranslationKey } from './types';

export const translations: Record<Language, TranslationKeys> = {
  en, es, de, fr, pt, it, ar,
};

/** Translate a key into the requested language, falling back to English. */
export const t = (lang: Language, key: keyof TranslationKeys): string =>
  translations[lang]?.[key] ?? translations.en[key] ?? key;

/** Returns true if the language is right-to-left. */
export const isRTL = (lang: Language): boolean => lang === 'ar';

export default translations;