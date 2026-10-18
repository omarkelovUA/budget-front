import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AUTH_STATE_DEPENDENCIES } from '../../../core/auth/auth-state.testing';
import { AccountAccess, ICategory, Transaction } from '../../../model/types';
import { TransactionPage, TransactionRepository } from '../data/transaction-repository';
import { AccountRepository } from '../../accounts/data/account-repository';
import { CategoryRepository } from '../../categories/data/category-repository';
import { pressEscape, stubDialogs } from '../../../shared/ui/modal/modal.testing';
import { TransactionList } from './transaction-list';

const tx = (id: string, editable = true, access: AccountAccess = 'owner'): Transaction => ({
  id,
  amount: 1,
  date: new Date('2026-10-01'),
  editable,
  account: { id: 'a', name: 'Card', currency: 'UAH', icon: '', color: 'green', access, closed: false },
  category: { id: 'c', name: 'Food', type: 'expense', icon: '', color: 'red', visibility: 'private' },
});

describe('TransactionList', () => {
  const pages: Record<number, TransactionPage> = {
    0: { items: [tx('1'), tx('2', false, 'visible')], hasMore: true },
    1: { items: [tx('3')], hasMore: false },
  };
  let deleted: string[];

  beforeEach(() => {
    stubDialogs();
    deleted = [];
    TestBed.configureTestingModule({
      imports: [TransactionList],
      providers: [
        ...AUTH_STATE_DEPENDENCIES,
        {
          provide: TransactionRepository,
          useValue: {
            getTransactions: (page: number) => of(pages[page]),
            deleteTransaction: (id: string) => {
              deleted.push(id);
              return of(true);
            },
          },
        },
        { provide: AccountRepository, useValue: { getAccounts: () => of([]) } },
        { provide: CategoryRepository, useValue: { getCategories: () => of([]) } },
      ],
    });
  });

  const ids = (list: TransactionList) => (list as any).transactions().map((t: Transaction) => t.id);

  it('appends pages until there are no more', () => {
    const list = TestBed.createComponent(TransactionList).componentInstance;
    expect(ids(list)).toEqual(['1', '2']);
    expect((list as any).hasMore()).toBe(true);

    list.loadMore();

    expect(ids(list)).toEqual(['1', '2', '3']);
    expect((list as any).hasMore()).toBe(false);
  });

  it('offers delete only for editable transactions and badges accounts that are not the user\'s', async () => {
    const fixture = TestBed.createComponent(TransactionList);
    await fixture.whenStable();
    const rows = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.transaction-row'));

    expect(rows.map((r) => r.querySelector('.delete-button') !== null)).toEqual([true, false]);
    expect(rows.map((r) => r.querySelector('app-access-badge')?.textContent?.trim() ?? null)).toEqual([
      null,
      'Перегляд',
    ]);
  });

  it('offers to split editable payments and reloads after the split', async () => {
    const transfer = {
      id: 't',
      amount: 5,
      date: new Date('2026-10-01'),
      editable: true,
      fromAccount: tx('x').account,
      toAccount: tx('x').account,
    } as Transaction;
    const firstPage = pages[0];
    pages[0] = { items: [tx('1'), tx('2', false), transfer], hasMore: false };
    const fixture = TestBed.createComponent(TransactionList);
    await fixture.whenStable();
    pages[0] = firstPage;
    const el = fixture.nativeElement as HTMLElement;
    const rows = Array.from(el.querySelectorAll('.transaction-row'));

    expect(rows.map((r) => r.querySelector('.split-button') !== null)).toEqual([true, false, false]);

    (rows[0].querySelector('.split-button') as HTMLElement).click();
    await fixture.whenStable();
    expect(el.querySelector('#transaction-split-title')?.textContent).toBe('Розділити за категоріями');

    fixture.debugElement.query((d) => d.name === 'app-transaction-split').componentInstance.saved.emit();
    await fixture.whenStable();
    expect(el.querySelector('dialog')).toBeNull();
    expect(ids(fixture.componentInstance)).toEqual(['1', '2']);
  });

  it('starts again from the first page after a delete', () => {
    const list = TestBed.createComponent(TransactionList).componentInstance;
    list.loadMore();

    list.deleteTransaction(tx('3'));

    expect(deleted).toEqual(['3']);
    expect(ids(list)).toEqual(['1', '2']);
  });

  it('creates a transaction in a dialog that Cancel or Esc closes', async () => {
    const fixture = TestBed.createComponent(TransactionList);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const add = async () => {
      (el.querySelector('app-page-header .btn-tonal') as HTMLElement).click();
      await fixture.whenStable();
    };

    await add();
    expect((el.querySelector('dialog') as HTMLDialogElement).open).toBe(true);
    expect(el.querySelector('#transaction-form-title')?.textContent).toBe('Нова транзакція');
    (el.querySelector('app-transaction-form .btn-text') as HTMLElement).click();
    await fixture.whenStable();
    expect(el.querySelector('dialog')).toBeNull();

    await add();
    await pressEscape(el.querySelector('dialog') as HTMLDialogElement);
    await fixture.whenStable();
    expect(el.querySelector('dialog')).toBeNull();
  });

  it("shows someone else's personal category as unknown", async () => {
    const unknown: ICategory = { id: 'x', type: 'expense', name: '', icon: '', color: '', visibility: 'private', unknown: true };
    const firstPage = pages[0];
    pages[0] = { items: [{ ...tx('9'), category: unknown } as Transaction], hasMore: false };
    const fixture = TestBed.createComponent(TransactionList);
    await fixture.whenStable();
    pages[0] = firstPage;

    expect((fixture.nativeElement as HTMLElement).querySelector('.tx-description')?.textContent).toContain(
      'Невідома категорія',
    );
  });
});
