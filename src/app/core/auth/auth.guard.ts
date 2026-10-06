import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthState } from './auth-state';

export const authGuard: CanActivateFn = () => {
  const authState = inject(AuthState);
  const router = inject(Router);
  return authState.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

// Keeps an already-logged-in user from landing on /login or /register.
export const guestGuard: CanActivateFn = () => {
  const authState = inject(AuthState);
  const router = inject(Router);
  return authState.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
};

// Where the backend sends the browser after a Google login. The page load
// already restored the session from the new refresh cookie (restoreSession at
// startup), so all that's left is to route on.
export const oauthCallbackGuard: CanActivateFn = () => {
  const authState = inject(AuthState);
  const router = inject(Router);
  return authState.isAuthenticated()
    ? router.createUrlTree(['/dashboard'])
    : router.createUrlTree(['/login'], { queryParams: { error: 'oauth' } });
};
