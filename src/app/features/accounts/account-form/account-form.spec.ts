import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthState } from '../../../core/auth/auth-state';
import { AuthRepository } from '../../../core/auth/data/auth-repository';
import { AccountInput, IFamily } from '../../../model/types';
import { FamilyRepository } from '../../family/data/family-repository';
import { SettingsRepository } from '../../settings/data/settings-repository';
import { AccountRepository } from '../data/account-repository';
import { AccountForm } from './account-form';

const user = (id: string, displayName: string) => ({ id, email: `${id}@x.com`, displayName, familyId: 'f' });

const FAMILY: IFamily = {
  id: 'f',
  name: 'Smiths',
  categoriesReviewed: true,
  members: [
    { user: user('me', 'Me'), role: 'admin', joinedAt: new Date() },
    { user: user('bob', 'Bob'), role: 'member', joinedAt: new Date() },
    { user: user('carol', 'Carol'), role: 'member', joinedAt: new Date() },
  ],
};

describe('AccountForm', () => {
  let component: AccountForm;
  let fixture: ComponentFixture<AccountForm>;
  let created: AccountInput[];

  beforeEach(async () => {
    created = [];
    await TestBed.configureTestingModule({
      imports: [AccountForm],
      providers: [
        {
          provide: AccountRepository,
          useValue: {
            createAccount: (input: AccountInput) => {
              created.push(input);
              return of({});
            },
          },
        },
        {
          provide: AuthRepository,
          useValue: { refresh: () => of({ accessToken: 't', user: { id: 'me', email: 'me@x.com', displayName: 'Me' } }) },
        },
        { provide: FamilyRepository, useValue: { getCurrentFamily: () => of(FAMILY) } },
        {
          provide: SettingsRepository,
          useValue: {
            getSettings: () =>
              of({ language: 'uk', defaultCurrency: 'PLN', usedCurrencies: ['PLN', 'EUR'], theme: 'system', primaryHue: 150 }),
          },
        },
      ],
    }).compileComponents();

    TestBed.inject(AuthState).restoreSession();
    fixture = TestBed.createComponent(AccountForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('starts a new account in the default currency from settings', () => {
    const form = (component as any).form;

    expect(form().value()).toEqual({ name: '', currency: 'PLN', icon: 'assets/card.svg', color: 'green' });
    expect(form().valid()).toBe(false);
  });

  it('offers the used currencies in the currency field', () => {
    const options = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('#account-currencies option'));

    expect(options.map((o) => (o as HTMLOptionElement).value)).toEqual(['PLN', 'EUR']);
  });

  it('offers ten colours, labelled and painted through the theme tokens', () => {
    const radios = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('.color-picker input'));

    expect(radios).toHaveLength(10);
    expect(radios.slice(0, 3).map((r) => r.getAttribute('aria-label'))).toEqual(['Зелений', 'Бірюзовий', 'Синій']);
    expect((radios[1].nextElementSibling as HTMLElement).style.backgroundColor).toBe(
      'var(--color-tag-teal, var(--color-primary))',
    );
  });

  it('saves the picked colour', () => {
    const radios = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('.color-picker input');
    radios[9].click();
    (component as any).model.update((m: object) => ({ ...m, name: 'Spare' }));

    component.submit();

    expect(created[0].color).toBe('gray');
  });

  it('lists the other family members, hidden by default', () => {
    const rows = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.member-access'));

    expect(rows.map((r) => r.querySelector('.member-name')?.textContent?.trim())).toEqual(['Bob', 'Carol']);
    expect(rows.map((r) => (r.querySelector('input:checked') as HTMLInputElement).value)).toEqual([
      'hidden',
      'hidden',
    ]);
  });

  it('sends only the members given access', () => {
    (component as any).model.set({ name: 'Joint', currency: 'UAH', icon: 'assets/card.svg', color: 'green' });
    component.setAccess('bob', 'shared');
    component.setAccess('carol', 'visible');
    component.setAccess('carol', 'hidden');

    component.submit();

    expect(created).toEqual([
      {
        name: 'Joint',
        currency: 'UAH',
        icon: 'assets/card.svg',
        color: 'green',
        balance: 0,
        grants: [{ userId: 'bob', level: 'shared' }],
      },
    ]);
  });
});
