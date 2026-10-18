import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, firstValueFrom, forkJoin, map, Observable, of, shareReplay, switchMap, tap } from 'rxjs';
import { IFamily, IUser } from '../../model/types';
import { GOOGLE_LOGIN_URL } from '../config/api';
import { FamilyRepository } from '../../features/family/data/family-repository';
import { OperatorRepository } from '../../features/operator/data/operator-repository';
import { SettingsState } from '../../features/settings/settings-state';
import { AuthRepository, AuthSession } from './data/auth-repository';

@Injectable({ providedIn: 'root' })
export class AuthState {
  private readonly authRepository = inject(AuthRepository);
  private readonly familyRepository = inject(FamilyRepository);
  private readonly operatorRepository = inject(OperatorRepository);
  private readonly settingsState = inject(SettingsState);

  private readonly user = signal<IUser | null>(null);
  readonly currentUser = this.user.asReadonly();
  readonly isAuthenticated = computed(() => this.user() !== null);

  // In memory only, never localStorage (docs/ARCHITECTURE.md §4.4). A reload
  // loses it; restoreSession() gets a new one from the refresh cookie.
  private readonly token = signal<string | null>(null);
  readonly accessToken = this.token.asReadonly();

  // Whether the user's family is frozen (members, no subscription): shared data is
  // read-only, so screens offer only what the backend still allows. Kept current
  // whenever the family is loaded.
  private readonly frozen = signal(false);
  readonly familyFrozen = this.frozen.asReadonly();

  // Whether the user runs the service and may open the operator page.
  private readonly operator = signal(false);
  readonly isOperator = this.operator.asReadonly();

  private refreshInFlight: Observable<string> | null = null;

  // The only way in: a full-page redirect into the backend's OAuth2 flow, which also
  // signs up a new user. It comes back to /auth/callback with the refresh cookie set
  // (see oauthCallbackGuard).
  loginWithGoogle(): void {
    window.location.assign(GOOGLE_LOGIN_URL);
  }

  // Runs once at startup: if a refresh cookie exists, the user stays logged in
  // across reloads. Never fails - no cookie just means anonymous.
  restoreSession(): Promise<void> {
    return firstValueFrom(
      this.authRepository.refresh().pipe(
        switchMap((s) => this.start(s)),
        map(() => undefined),
        catchError(() => of(undefined)),
      ),
    );
  }

  // Used by the interceptor when an access token expires. Concurrent 401s share
  // one refresh, since every refresh rotates (and so invalidates) the cookie.
  refreshAccessToken(): Observable<string> {
    this.refreshInFlight ??= this.authRepository.refresh().pipe(
      tap((s) => this.token.set(s.accessToken)),
      map((s) => s.accessToken),
      finalize(() => (this.refreshInFlight = null)),
      shareReplay(1),
    );
    return this.refreshInFlight;
  }

  logout(): void {
    this.authRepository.logout().subscribe({ error: () => undefined });
    this.clear();
  }

  clear(): void {
    this.token.set(null);
    this.user.set(null);
    this.frozen.set(false);
    this.operator.set(false);
    this.settingsState.clear();
  }

  // A no-op when nothing changed: pages reload the family often, and a new user object
  // would set off everything that reads it.
  setFamily(family: Pick<IFamily, 'id' | 'frozen'>): void {
    if (this.user()?.familyId !== family.id) {
      this.user.update((u) => (u ? { ...u, familyId: family.id } : u));
    }
    this.frozen.set(family.frozen);
  }

  // The backend's user has no familyId (the membership is the source of truth; every
  // user has a family), so it's looked up right after the session starts, along with the settings that
  // switch the UI to the account's language, and whether they're an operator. Without settings the
  // session still starts, in the device's language.
  private start(session: AuthSession): Observable<IUser> {
    this.token.set(session.accessToken);
    this.user.set({ ...session.user, familyId: null });
    return forkJoin([
      this.familyRepository.getCurrentFamily(),
      this.settingsState.load().pipe(catchError(() => of(null))),
      this.operatorRepository.isOperator().pipe(catchError(() => of(false))),
    ]).pipe(
      tap(([family, , operator]) => {
        this.setFamily(family);
        this.operator.set(operator);
      }),
      map(() => this.user()!),
    );
  }
}
