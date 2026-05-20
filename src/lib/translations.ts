/**
 * translations.ts
 * ---------------
 * Backwards-compatible re-export shim.
 *
 * All files that already import from '@/lib/translations' continue
 * to work without any changes. The real data now lives in src/lib/i18n/.
 *
 * Do NOT add translation data here — edit the per-language files instead.
 */
export { t, isRTL, translations as default } from './i18n/index';
export type { TranslationKey, TranslationKeys } from './i18n/types';