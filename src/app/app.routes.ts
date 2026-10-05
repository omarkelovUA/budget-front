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
  { path: '**', redirectTo: 'dashboard' },
];
