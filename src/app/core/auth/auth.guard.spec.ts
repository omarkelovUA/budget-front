import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { of } from 'rxjs';
import { FamilyRepository } from '../../features/family/data/family-repository';
import { OperatorRepository } from '../../features/operator/data/operator-repository';
import { AuthRepository, AuthSession } from './data/auth-repository';
import { AuthState } from './auth-state';
import { authGuard, guestGuard, oauthCallbackGuard, operatorGuard } from './auth.guard';

const SESSION: AuthSession = {
  accessToken: 'token',
  user: { id: 'user-1', email: 'demo@family.app', displayName: 'Demo User' },
};

describe('auth guards', () => {
  const run = (guard: typeof authGuard) =>
    TestBed.runInInjectionContext(() => guard({} as never, {} as never));

  let operator: boolean;

  beforeEach(() => {
    operator = false;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: OperatorRepository, useValue: { isOperator: () => of(operator) } },
        { provide: AuthRepository, useValue: { refresh: () => of(SESSION) } },
        { provide: FamilyRepository, useValue: { getCurrentFamily: () => of({ id: 'f', name: 'Family', members: [] }) } },
      ],
    });
  });

  const urlOf = (result: unknown) => TestBed.inject(Router).serializeUrl(result as UrlTree);

  it('authGuard redirects anonymous users to /login', () => {
    expect(urlOf(run(authGuard))).toBe('/login');
  });

  it('authGuard lets authenticated users through', () => {
    TestBed.inject(AuthState).restoreSession();
    expect(run(authGuard)).toBe(true);
  });

  it('guestGuard lets anonymous users through', () => {
    expect(run(guestGuard)).toBe(true);
  });

  it('oauthCallbackGuard sends a restored session to /dashboard', () => {
    TestBed.inject(AuthState).restoreSession();
    expect(urlOf(run(oauthCallbackGuard))).toBe('/dashboard');
  });

  it('oauthCallbackGuard sends a failed Google login back to /login with an error', () => {
    expect(urlOf(run(oauthCallbackGuard))).toBe('/login?error=oauth');
  });

  it('guestGuard redirects authenticated users to /dashboard', () => {
    TestBed.inject(AuthState).restoreSession();
    expect(urlOf(run(guestGuard))).toBe('/dashboard');
  });

  it('operatorGuard sends everyone but operators to the dashboard', () => {
    TestBed.inject(AuthState).restoreSession();
    expect(urlOf(run(operatorGuard))).toBe('/dashboard');
  });

  it('operatorGuard lets an operator through', async () => {
    operator = true;
    await TestBed.inject(AuthState).restoreSession();
    expect(run(operatorGuard)).toBe(true);
  });
});
