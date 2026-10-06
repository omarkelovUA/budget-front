import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login-page/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register-page/register-page').then((m) => m.RegisterPage),
  },
  {
    path: '',
    canActivateChild: [authGuard],
    children: [
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
      {
        path: 'family',
        loadComponent: () =>
          import('./features/family/family-page/family-page').then((m) => m.FamilyPage),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
