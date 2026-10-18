import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { App } from './app';
import { routes } from './app.routes';
import { AuthRepository, AuthSession } from './core/auth/data/auth-repository';
import { AuthState } from './core/auth/auth-state';
import { IAddedCategory, IFamily, IUserSettings } from './model/types';
import { CategoryRepository } from './features/categories/data/category-repository';
import { FamilyRepository } from './features/family/data/family-repository';
import { SettingsRepository } from './features/settings/data/settings-repository';
import { LanguageService } from './core/i18n/language';
import { TEST_SETTINGS } from '../test-providers';

const SESSION: AuthSession = {
  accessToken: 'token',
  user: { id: 'user-1', email: 'demo@family.app', displayName: 'Demo User' },
};

const ADDED: IAddedCategory = {
  category: { id: 'c', type: 'expense', name: 'Garden', icon: '', color: 'green', visibility: 'shared' },
  addedBy: 'Bob',
};

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let settings: IUserSettings;
  let family: IFamily;
  let seen: number;

  beforeEach(async () => {
    settings = TEST_SETTINGS;
    family = { id: 'f', name: 'Family', members: [], categoriesReviewed: true };
    seen = 0;
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        { provide: AuthRepository, useValue: { refresh: () => of(SESSION) } },
        { provide: FamilyRepository, useValue: { getCurrentFamily: () => of(family) } },
        {
          provide: CategoryRepository,
          useValue: {
            getAddedByMembers: () => of([ADDED]),
            markAddedSeen: () => {
              seen++;
              return of(undefined);
            },
          },
        },
        { provide: SettingsRepository, useValue: { getSettings: () => of(settings) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(App);
  });

  async function logIn() {
    await TestBed.inject(AuthState).restoreSession();
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

  it('tells the admin about family categories other members added, until dismissed', async () => {
    const admin = { user: { ...SESSION.user, familyId: 'f' }, role: 'admin' as const, joinedAt: new Date() };
    family = { ...family, members: [admin] };
    await logIn();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.app-notice')?.textContent).toContain('Garden (Bob)');

    (el.querySelector('.app-notice button') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(seen).toBe(1);
    expect(el.querySelector('.app-notice')).toBeNull();
  });

  it('tells other members nothing', async () => {
    await logIn();

    expect((fixture.nativeElement as HTMLElement).querySelector('.app-notice')).toBeNull();
  });
});
