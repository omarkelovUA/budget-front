import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthState } from '../auth/auth-state';
import { API_BASE, AUTH_BASE } from '../config/api';

const withToken = (req: HttpRequest<unknown>, token: string) =>
  req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

// Attaches the in-memory access token to API calls. On a 401 it refreshes once
// (via the httpOnly cookie) and retries; if that fails the session is over.
// Auth endpoints are left alone - they work off the cookie, not the token.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_BASE) || req.url.startsWith(AUTH_BASE)) {
    return next(req);
  }
  const authState = inject(AuthState);
  const router = inject(Router);
  const token = authState.accessToken();

  return next(token ? withToken(req, token) : req).pipe(
    catchError((err) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401 || !token) {
        return throwError(() => err);
      }
      return authState.refreshAccessToken().pipe(
        switchMap((newToken) => next(withToken(req, newToken))),
        catchError((refreshErr) => {
          authState.clear();
          router.navigate(['/login']);
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
