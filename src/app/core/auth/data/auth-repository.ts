import { Observable } from 'rxjs';
import { IUser } from '../../../model/types';

// A started session: the short-lived access token (kept in memory only) and the
// user it belongs to. The refresh token never reaches JS - it's an httpOnly
// cookie (docs/ARCHITECTURE.md §6.2).
export interface AuthSession {
  accessToken: string;
  user: Omit<IUser, 'familyId'>;
}

export abstract class AuthRepository {
  abstract login(email: string, password: string): Observable<AuthSession>;

  abstract register(email: string, password: string, displayName: string): Observable<AuthSession>;

  // Exchanges the refresh cookie for a new access token (rotating the cookie).
  // Also how a Google login lands: the backend sets the cookie, then redirects here.
  abstract refresh(): Observable<AuthSession>;

  abstract logout(): Observable<void>;
}
