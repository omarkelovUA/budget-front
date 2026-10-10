import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { IAccount, IBudget, ICategory, IFamily, IFamilyMember } from '../../model/types';
import { AuthState } from '../../core/auth/auth-state';
import { AccountRepository } from '../accounts/data/account-repository';
import { BudgetRepository } from '../budgets/data/budget-repository';
import { TransactionRepository } from '../transactions/data/transaction-repository';
import { AuthRepository } from '../../core/auth/data/auth-repository';
import { FamilyRepository } from '../family/data/family-repository';
import { FamilyTransferRepository } from '../family-transfers/data/family-transfer-repository';
import { balancesByCurrency, Dashboard } from './dashboard';

const account = (currency: string, balance: number, access: IAccount['access']): IAccount => ({
  id: `${currency}-${balance}`,
  name: 'A',
  balance,
  currency,
  icon: '',
  color: 'green',
  owner: { id: 'o', displayName: 'Owner' },
  access,
  closed: false,
});

const member = (id: string): IFamilyMember => ({
  user: { id, email: `${id}@x.com`, displayName: id, familyId: 'f' },
  role: 'member',
  joinedAt: new Date(),
});

const food: ICategory = { id: 'c', type: 'expense', name: 'Food', icon: '', color: 'red', visibility: 'shared' };
const budget = (id: string, planned: number, fact: number): IBudget => ({
  id,
  category: { ...food, name: id },
  period: '2026-10',
  plannedAmount: planned,
  factAmount: fact,
  visibility: 'shared',
});

describe('balancesByCurrency', () => {
  it('totals per currency and splits by access, never mixing currencies', () => {
    expect(
      balancesByCurrency([
        account('UAH', 100, 'owner'),
        account('USD', 5, 'shared'),
        account('UAH', 50, 'shared'),
        account('UAH', 7, 'visible'),
      ]),
    ).toEqual([
      { currency: 'UAH', total: 157, owner: 100, shared: 50, visible: 7, inTransit: 0 },
      { currency: 'USD', total: 5, owner: 0, shared: 5, visible: 0, inTransit: 0 },
    ]);
  });

  it('keeps money sent to family members in the sender\'s totals until it is collected', () => {
    const sent = [{ id: 't', counterpart: { id: 'b', displayName: 'Bob' }, currency: 'PLN', amount: 30 }];

    expect(balancesByCurrency([account('UAH', 100, 'owner')], sent)).toEqual([
      { currency: 'PLN', total: 30, owner: 0, shared: 0, visible: 0, inTransit: 30 },
      { currency: 'UAH', total: 100, owner: 100, shared: 0, visible: 0, inTransit: 0 },
    ]);
  });
});

describe('Dashboard', () => {
  let requestedPeriods: (string | undefined)[];
  let family: IFamily;

  beforeEach(() => {
    requestedPeriods = [];
    family = { id: 'f', name: 'Family', members: [member('me')], categoriesReviewed: true };
    TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: AccountRepository, useValue: { getAccounts: () => of([account('UAH', 100, 'owner')]) } },
        {
          provide: BudgetRepository,
          useValue: {
            getBudgets: (period?: string) => {
              requestedPeriods.push(period);
              return of([budget('Calm', 100, 10), budget('Over', 100, 150)]);
            },
          },
        },
        {
          provide: TransactionRepository,
          useValue: {
            getTransactions: () => of({ items: [], hasMore: false }),
            getMonthSummary: () => of([{ currency: 'UAH', income: 500, expense: 120 }]),
          },
        },
        {
          provide: AuthRepository,
          useValue: { login: () => of({ accessToken: 't', user: { id: 'me', email: 'me@x.com', displayName: 'Me' } }) },
        },
        { provide: FamilyRepository, useValue: { getCurrentFamily: () => of(family) } },
        { provide: FamilyTransferRepository, useValue: { getInTransit: () => of({ incoming: [], outgoing: [] }) } },
      ],
    });
  });

  it('lists over-budget categories first and flags them', async () => {
    const fixture = TestBed.createComponent(Dashboard);
    await fixture.whenStable();
    const rows = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.budget-row'));

    expect(rows.map((r) => r.querySelector('span')?.textContent?.trim())).toEqual(['Over', 'Calm']);
    expect(rows[0].classList).toContain('over');
  });

  it('loads budgets for the selected month and can step back a month', async () => {
    const fixture = TestBed.createComponent(Dashboard);
    await fixture.whenStable();
    const thisMonth = requestedPeriods[0]!;

    (fixture.componentInstance as Dashboard).previousMonth();
    await fixture.whenStable();

    const [year, month] = thisMonth.split('-').map(Number);
    const expected = new Date(year, month - 2, 1);
    expect(requestedPeriods.at(-1)).toBe(
      `${expected.getFullYear()}-${String(expected.getMonth() + 1).padStart(2, '0')}`,
    );
  });

  async function signedIn() {
    TestBed.inject(AuthState).login('me@x.com', 'x').subscribe();
    const fixture = TestBed.createComponent(Dashboard);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('points users alone in their family to the family page', async () => {
    const el = await signedIn();

    expect(el.querySelector('.hint a')?.getAttribute('href')).toBe('/family');
  });

  it('drops the hint once others are in the family', async () => {
    family.members.push(member('bob'));
    const el = await signedIn();

    expect(el.querySelector('.hint a')).toBeNull();
  });
});
