import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthRepository } from '../../../core/auth/data/auth-repository';
import { IAccount } from '../../../model/types';
import { FamilyRepository } from '../../family/data/family-repository';
import { AccountRepository } from '../data/account-repository';
import { AccountList } from './account-list';

const account = (id: string, access: IAccount['access']): IAccount => ({
  id,
  name: id,
  balance: 10,
  currency: 'UAH',
  icon: '',
  color: 'green',
  owner: { id: access === 'owner' ? 'me' : 'alice', displayName: access === 'owner' ? 'Me' : 'Alice' },
  access,
  grants: access === 'owner' ? [{ userId: 'bob', displayName: 'Bob', level: 'shared' }] : undefined,
  closed: false,
});

describe('AccountList', () => {
  it('groups accounts by access and offers management only for own accounts', async () => {
    TestBed.configureTestingModule({
      imports: [AccountList],
      providers: [
        {
          provide: AccountRepository,
          useValue: {
            getAccounts: () => of([account('mine', 'owner'), account('joint', 'shared'), account('view', 'visible')]),
          },
        },
        { provide: AuthRepository, useValue: {} },
        { provide: FamilyRepository, useValue: {} },
      ],
    });
    const fixture = TestBed.createComponent(AccountList);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const groups = Array.from(el.querySelectorAll('.account-group'));
    expect(groups.map((g) => g.querySelector('h3')?.textContent?.trim())).toEqual([
      'Мої рахунки',
      'Спільні зі мною',
      'Доступні для перегляду',
    ]);
    expect(groups.map((g) => g.querySelectorAll('.text-button').length)).toEqual([1, 0, 0]);
    expect(groups[0].textContent).toContain('Доступ: Bob');
    expect(groups[1].textContent).toContain('Власник: Alice');
  });
});
