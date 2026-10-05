import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAngularSvgIcon } from 'angular-svg-icon';
import { AccountRepository } from './features/accounts/data/account-repository';
import { MockAccountRepository } from './features/accounts/data/mock-account-repository';
import { CategoryRepository } from './features/categories/data/category-repository';
import { MockCategoryRepository } from './features/categories/data/mock-category-repository';
import { TransactionRepository } from './features/transactions/data/transaction-repository';
import { MockTransactionRepository } from './features/transactions/data/mock-transaction-repository';
import { BudgetRepository } from './features/budgets/data/budget-repository';
import { MockBudgetRepository } from './features/budgets/data/mock-budget-repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAngularSvgIcon(),
    { provide: AccountRepository, useClass: MockAccountRepository },
    { provide: CategoryRepository, useClass: MockCategoryRepository },
    { provide: TransactionRepository, useClass: MockTransactionRepository },
    { provide: BudgetRepository, useClass: MockBudgetRepository },
  ],
};
