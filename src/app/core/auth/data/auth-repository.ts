import { Observable } from 'rxjs';
import { IUser } from '../../../model/types';

export abstract class AuthRepository {
  abstract login(email: string, password: string): Observable<IUser>;

  abstract register(email: string, password: string, displayName: string): Observable<IUser>;

  // Mocked here as an immediate success - the real backend treats this as a
  // separate login method that resolves to the same session as password login
  // (see docs/ARCHITECTURE.md §6.1).
  abstract loginWithGoogle(): Observable<IUser>;
}
