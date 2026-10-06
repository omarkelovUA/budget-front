import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { of } from 'rxjs';
import { IUser } from '../../model/types';
import { AuthRepository } from './data/auth-repository';
import { AuthState } from './auth-state';
import { authGuard, guestGuard } from './auth.guard';

const USER: IUser = { id: 1, email: 'demo@family.app', displayName: 'Demo User', familyId: 1 };

describe('auth guards', () => {
  const run = (guard: typeof authGuard) =>
    TestBed.runInInjectionContext(() => guard({} as never, {} as never));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthRepository, useValue: { login: () => of(USER) } }],
    });
  });

  const urlOf = (result: unknown) => TestBed.inject(Router).serializeUrl(result as UrlTree);

  it('authGuard redirects anonymous users to /login', () => {
    expect(urlOf(run(authGuard))).toBe('/login');
  });

  it('authGuard lets authenticated users through', () => {
    TestBed.inject(AuthState).login(USER.email, 'x').subscribe();
    expect(run(authGuard)).toBe(true);
  });

  it('guestGuard lets anonymous users through', () => {
    expect(run(guestGuard)).toBe(true);
  });

  it('guestGuard redirects authenticated users to /dashboard', () => {
    TestBed.inject(AuthState).login(USER.email, 'x').subscribe();
    expect(urlOf(run(guestGuard))).toBe('/dashboard');
  });
});
