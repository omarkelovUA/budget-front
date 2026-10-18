import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AUTH_BASE } from '../../config/api';
import { AuthRepository, AuthSession } from './auth-repository';

@Injectable()
export class HttpAuthRepository extends AuthRepository {
  private readonly http = inject(HttpClient);

  refresh(): Observable<AuthSession> {
    return this.http.post<AuthSession>(`${AUTH_BASE}/refresh`, null);
  }

  logout(): Observable<void> {
    return this.http.post<null>(`${AUTH_BASE}/logout`, null).pipe(map(() => undefined));
  }
}
