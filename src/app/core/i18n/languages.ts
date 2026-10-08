// The UI languages (ISO 639-1, as the backend stores them). Adding one means a
// translation file in src/i18n, an entry here and in the loader, and the backend's
// SupportedLanguage (docs/ARCHITECTURE.md §4.6).
export const LANGUAGES = [
  // Shown in the picker in its own language; locale drives number/date formatting.
  { code: 'en', name: 'English', locale: 'en-GB' },
  { code: 'uk', name: 'Українська', locale: 'uk-UA' },
] as const;

export type Language = (typeof LANGUAGES)[number]['code'];

export const LANGUAGE_CODES: Language[] = LANGUAGES.map((l) => l.code);

export const FALLBACK_LANGUAGE: Language = 'en';

export const LANGUAGE_LOCALES = Object.fromEntries(LANGUAGES.map((l) => [l.code, l.locale])) as Record<
  Language,
  string
>;

// A country whose language is supported stands for it even when the browser asks
// for another language (e.g. ru-UA), the same rule the backend applies at sign-up.
const COUNTRY_LANGUAGE: Record<string, Language> = { UA: 'uk' };

export function isLanguage(value: unknown): value is Language {
  return LANGUAGE_CODES.includes(value as Language);
}

// The first supported language among BCP 47 tags in preference order (navigator.languages).
export function matchLanguage(tags: readonly string[]): Language | null {
  for (const tag of tags) {
    const [language, region] = tag.split('-');
    if (isLanguage(language.toLowerCase())) return language.toLowerCase() as Language;
    const byCountry = region ? COUNTRY_LANGUAGE[region.toUpperCase()] : undefined;
    if (byCountry) return byCountry;
  }
  return null;
}
