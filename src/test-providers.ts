import { importProvidersFrom } from '@angular/core';
import { of } from 'rxjs';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { provideTranslocoLocale } from '@jsverse/transloco-locale';
import { LANGUAGE_CODES, LANGUAGE_LOCALES } from './app/core/i18n/languages';
import { SettingsRepository } from './app/features/settings/data/settings-repository';
import { IUserSettings } from './app/model/types';
import en from './i18n/en.json';
import uk from './i18n/uk.json';

export const TEST_SETTINGS: IUserSettings = { language: 'uk', defaultCurrency: 'UAH', usedCurrencies: ['UAH'] };

// Every spec gets real translations, synchronously. Ukrainian by default, so specs
// read like the UI most users see; switch with TranslocoService.setActiveLang.
// AuthState loads settings whenever a session starts, so there's a stub for them
// too; specs that care about settings provide their own.
export default [
  importProvidersFrom(
    TranslocoTestingModule.forRoot({
      langs: { en, uk },
      translocoConfig: { availableLangs: LANGUAGE_CODES, defaultLang: 'uk', reRenderOnLangChange: true },
      preloadLangs: true,
    }),
  ),
  provideTranslocoLocale({ langToLocaleMapping: LANGUAGE_LOCALES }),
  {
    provide: SettingsRepository,
    useValue: { getSettings: () => of(TEST_SETTINGS), updateSettings: (s: IUserSettings) => of(s) },
  },
];
