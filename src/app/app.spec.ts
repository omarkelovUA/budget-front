import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { App } from './app';
import { routes } from './app.routes';
import { AuthRepository, AuthSession } from './core/auth/data/auth-repository';
import { AuthState } from './core/auth/auth-state';
import { FamilyRepository } from './features/family/data/family-repository';

const SESSION: AuthSession = {
  accessToken: 'token',
  user: { id: 'user-1', email: 'demo@family.app', displayName: 'Demo User' },
};

describe('App', () => {
  let fixture: ComponentFixture<App>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        { provide: AuthRepository, useValue: { login: () => of(SESSION) } },
        { provide: FamilyRepository, useValue: { getCurrentFamily: () => of(null) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(App);
  });

  it('should create the app', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should hide navigation when logged out', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('nav')).toBeNull();
  });

  it('should render navigation links when logged in', () => {
    TestBed.inject(AuthState).login(SESSION.user.email, 'password123').subscribe();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll('nav a')).map((a) => a.textContent?.trim());
    expect(links).toEqual([
      'Dashboard',
      'Accounts',
      'Categories',
      'Transactions',
      'Budgets',
      'Family',
    ]);
    expect(compiled.querySelector('.user-name')?.textContent).toContain('Demo User');
  });
});
