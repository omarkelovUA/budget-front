import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'accounts',
    loadComponent: () =>
      import('./features/accounts/account-list/account-list').then((m) => m.AccountList),
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./features/categories/category-list/category-list').then((m) => m.CategoryList),
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./features/transactions/transaction-list/transaction-list').then(
        (m) => m.TransactionList,
      ),
  },
  {
    path: 'budgets',
    loadComponent: () =>
      import('./features/budgets/budget-list/budget-list').then((m) => m.BudgetList),
  },
  { path: '**', redirectTo: 'dashboard' },
];
