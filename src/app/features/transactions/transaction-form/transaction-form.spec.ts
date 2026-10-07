import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { IAccount } from '../../../model/types';
import { AccountRepository } from '../../accounts/data/account-repository';
import { CategoryRepository } from '../../categories/data/category-repository';
import { TransactionRepository } from '../data/transaction-repository';
import { TransactionForm } from './transaction-form';

const account = (id: string, access: IAccount['access']): IAccount => ({
  id,
  name: id,
  balance: 0,
  currency: 'UAH',
  icon: '',
  color: 'green',
  owner: { id: 'o', displayName: 'O' },
  access,
  closed: false,
});

describe('TransactionForm', () => {
  it('only offers accounts the user may record on, for payments and both sides of transfers', async () => {
    TestBed.configureTestingModule({
      imports: [TransactionForm],
      providers: [
        {
          provide: AccountRepository,
          useValue: {
            getAccounts: () => of([account('mine', 'owner'), account('joint', 'shared'), account('view', 'visible')]),
          },
        },
        { provide: CategoryRepository, useValue: { getCategories: () => of([]) } },
        { provide: TransactionRepository, useValue: {} },
      ],
    });
    const fixture = TestBed.createComponent(TransactionForm);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const options = (selector: string) =>
      Array.from(el.querySelectorAll(`${selector} option`))
        .map((o) => (o as HTMLOptionElement).value)
        .filter(Boolean);

    expect(options('#transaction-accountId')).toEqual(['mine', 'joint']);

    (fixture.componentInstance as any).model.update((m: object) => ({ ...m, kind: 'transfer' }));
    await fixture.whenStable();

    expect(options('#transaction-fromAccountId')).toEqual(['mine', 'joint']);
    expect(options('#transaction-toAccountId')).toEqual(['mine', 'joint']);
  });
});
