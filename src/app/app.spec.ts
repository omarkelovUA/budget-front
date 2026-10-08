import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { App } from './app';
import { routes } from './app.routes';
import { AuthRepository, AuthSession } from './core/auth/data/auth-repository';
import { AuthState } from './core/auth/auth-state';
import { IUserSettings } from './model/types';
import { FamilyRepository } from './features/family/data/family-repository';
import { SettingsRepository } from './features/settings/data/settings-repository';
import { LanguageService } from './core/i18n/language';
import { TEST_SETTINGS } from '../test-providers';

const SESSION: AuthSession = {
  accessToken: 'token',
  user: { id: 'user-1', email: 'demo@family.app', displayName: 'Demo User' },
};

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let settings: IUserSettings;

  beforeEach(async () => {
    settings = TEST_SETTINGS;
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        { provide: AuthRepository, useValue: { login: () => of(SESSION) } },
        { provide: FamilyRepository, useValue: { getCurrentFamily: () => of(null) } },
        { provide: SettingsRepository, useValue: { getSettings: () => of(settings) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(App);
  });

  async function logIn() {
    await firstValueFrom(TestBed.inject(AuthState).login(SESSION.user.email, 'password123'));
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    return Array.from(compiled.querySelectorAll('nav a')).map((a) => a.textContent?.trim());
  }

  it('should create the app', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should hide navigation when logged out', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('nav')).toBeNull();
  });

  it('should render navigation links when logged in', async () => {
    expect(await logIn()).toEqual(['Огляд', 'Рахунки', 'Категорії', 'Транзакції', 'Бюджети', "Сім'я"]);
    expect((fixture.nativeElement as HTMLElement).querySelector('.user-name')?.textContent).toContain('Demo User');
  });

  it("switches to the account's language once signed in", async () => {
    settings = { ...TEST_SETTINGS, language: 'en' };

    expect(await logIn()).toEqual(['Dashboard', 'Accounts', 'Categories', 'Transactions', 'Budgets', 'Family']);
    expect(TestBed.inject(LanguageService).current()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });
});
