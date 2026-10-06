import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { IAccount, IBudget, ICategory } from '../../model/types';
import { AccountRepository } from '../accounts/data/account-repository';
import { BudgetRepository } from '../budgets/data/budget-repository';
import { TransactionRepository } from '../transactions/data/transaction-repository';
import { AuthRepository } from '../../core/auth/data/auth-repository';
import { FamilyRepository } from '../family/data/family-repository';
import { balancesByCurrency, Dashboard } from './dashboard';

const account = (currency: string, balance: number, visibility: IAccount['visibility']): IAccount => ({
  id: `${currency}-${balance}`,
  name: 'A',
  balance,
  currency,
  icon: '',
  color: 'green',
  visibility,
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
  it('totals per currency and splits private from shared, never mixing currencies', () => {
    expect(
      balancesByCurrency([account('UAH', 100, 'private'), account('USD', 5, 'shared'), account('UAH', 50, 'shared')]),
    ).toEqual([
      { currency: 'UAH', total: 150, private: 100, shared: 50 },
      { currency: 'USD', total: 5, private: 0, shared: 5 },
    ]);
  });
});

describe('Dashboard', () => {
  let requestedPeriods: (string | undefined)[];

  beforeEach(() => {
    requestedPeriods = [];
    TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: AccountRepository, useValue: { getAccounts: () => of([account('UAH', 100, 'private')]) } },
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
        { provide: AuthRepository, useValue: {} },
        { provide: FamilyRepository, useValue: {} },
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

  it('points users without a family to the family page', async () => {
    const fixture = TestBed.createComponent(Dashboard);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('.hint a')?.getAttribute('href')).toBe('/family');
  });
});
