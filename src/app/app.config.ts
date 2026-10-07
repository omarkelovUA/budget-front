import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

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
import { SettingsRepository } from './features/settings/data/settings-repository';
import { FamilyTransferRepository } from './features/family-transfers/data/family-transfer-repository';
import { HttpFamilyTransferRepository } from './features/family-transfers/data/http-family-transfer-repository';
import { HttpSettingsRepository } from './features/settings/data/http-settings-repository';
import { AuthState } from './core/auth/auth-state';
import { authInterceptor } from './core/http/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAngularSvgIcon(),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Restore the session from the refresh cookie before the first route guard runs.
    provideAppInitializer(() => inject(AuthState).restoreSession()),
    { provide: AccountRepository, useClass: HttpAccountRepository },
    { provide: CategoryRepository, useClass: HttpCategoryRepository },
    { provide: TransactionRepository, useClass: HttpTransactionRepository },
    { provide: BudgetRepository, useClass: HttpBudgetRepository },
    { provide: AuthRepository, useClass: HttpAuthRepository },
    { provide: FamilyRepository, useClass: HttpFamilyRepository },
    { provide: SettingsRepository, useClass: HttpSettingsRepository },
    { provide: FamilyTransferRepository, useClass: HttpFamilyTransferRepository },
  ],
};
