import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { provideTranslocoLocale } from '@jsverse/transloco-locale';

import { routes } from './app.routes';
import { provideAngularSvgIcon } from 'angular-svg-icon';
import { AccountRepository } from './features/accounts/data/account-repository';
import { HttpAccountRepository } from './features/accounts/data/http-account-repository';
import { CategoryRepository } from './features/categories/data/category-repository';
import { HttpCategoryRepository } from './features/categories/data/http-category-repository';
import { TransactionRepository } from './features/transactions/data/transaction-repository';
import { HttpTransactionRepository } from './features/transactions/data/http-transaction-repository';
import { BudgetRepository } from './features/budgets/data/budget-repository';
import { HttpBudgetRepository } from './features/budgets/data/http-budget-repository';
import { AuthRepository } from './core/auth/data/auth-repository';
import { HttpAuthRepository } from './core/auth/data/http-auth-repository';
import { FamilyRepository } from './features/family/data/family-repository';
import { HttpFamilyRepository } from './features/family/data/http-family-repository';
import { SubscriptionRepository } from './features/family/data/subscription-repository';
import { OperatorRepository } from './features/operator/data/operator-repository';
import { HttpOperatorRepository } from './features/operator/data/http-operator-repository';
import { HttpSubscriptionRepository } from './features/family/data/http-subscription-repository';
import { SettingsRepository } from './features/settings/data/settings-repository';
import { FamilyTransferRepository } from './features/family-transfers/data/family-transfer-repository';
import { HttpFamilyTransferRepository } from './features/family-transfers/data/http-family-transfer-repository';
import { HttpSettingsRepository } from './features/settings/data/http-settings-repository';
import { AuthState } from './core/auth/auth-state';
import { authInterceptor } from './core/http/auth.interceptor';
import { LanguageService } from './core/i18n/language';
import { FALLBACK_LANGUAGE, LANGUAGE_CODES, LANGUAGE_LOCALES } from './core/i18n/languages';
import { TranslationLoader } from './core/i18n/translation-loader';
import { ThemeService } from './core/theme/theme';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAngularSvgIcon(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTransloco({
      config: {
        availableLangs: LANGUAGE_CODES,
        defaultLang: FALLBACK_LANGUAGE,
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslationLoader,
    }),
    provideTranslocoLocale({ langToLocaleMapping: LANGUAGE_LOCALES }),
    // Apply the device's theme and language, then restore the session from the refresh
    // cookie (which switches to the account's) before the first route guard runs.
    provideAppInitializer(() => {
      const languageService = inject(LanguageService);
      const authState = inject(AuthState);
      inject(ThemeService).init();
      return languageService.init().then(() => authState.restoreSession());
    }),
    { provide: AccountRepository, useClass: HttpAccountRepository },
    { provide: CategoryRepository, useClass: HttpCategoryRepository },
    { provide: TransactionRepository, useClass: HttpTransactionRepository },
    { provide: BudgetRepository, useClass: HttpBudgetRepository },
    { provide: AuthRepository, useClass: HttpAuthRepository },
    { provide: FamilyRepository, useClass: HttpFamilyRepository },
    { provide: SubscriptionRepository, useClass: HttpSubscriptionRepository },
    { provide: OperatorRepository, useClass: HttpOperatorRepository },
    { provide: SettingsRepository, useClass: HttpSettingsRepository },
    { provide: FamilyTransferRepository, useClass: HttpFamilyTransferRepository },
  ],
};
