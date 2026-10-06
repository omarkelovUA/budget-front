import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AUTH_BASE } from '../../config/api';
import { withUserErrors } from '../../http/problem';
import { AuthRepository, AuthSession } from './auth-repository';

@Injectable()
export class HttpAuthRepository extends AuthRepository {
  private readonly http = inject(HttpClient);

  login(email: string, password: string): Observable<AuthSession> {
    return this.http
      .post<AuthSession>(`${AUTH_BASE}/login`, { email, password })
      .pipe(withUserErrors());
  }

  register(email: string, password: string, displayName: string): Observable<AuthSession> {
    return this.http
      .post<AuthSession>(`${AUTH_BASE}/register`, { email, password, displayName })
      .pipe(withUserErrors());
  }

  refresh(): Observable<AuthSession> {
    return this.http.post<AuthSession>(`${AUTH_BASE}/refresh`, null);
  }

  logout(): Observable<void> {
    return this.http.post<null>(`${AUTH_BASE}/logout`, null).pipe(map(() => undefined));
  }
}
