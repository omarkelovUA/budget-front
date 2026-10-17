import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ICategory, PaymentTransaction } from '../../../model/types';
import { CategoryRepository } from '../../categories/data/category-repository';
import { SplitPart, TransactionRepository } from '../data/transaction-repository';
import { TransactionSplit } from './transaction-split';

const category = (id: string, type: ICategory['type']): ICategory => ({
  id,
  name: id,
  type,
  icon: '',
  color: 'red',
  visibility: 'private',
});

const payment: PaymentTransaction = {
  id: 'tx',
  amount: 420,
  date: new Date('2026-10-02'),
  editable: true,
  account: { id: 'a', name: 'Card', currency: 'UAH', icon: '', color: 'green', access: 'owner', closed: false },
  category: category('food', 'expense'),
};

describe('TransactionSplit', () => {
  let sent: { id: string; parts: SplitPart[] }[];

  async function render() {
    sent = [];
    TestBed.configureTestingModule({
      imports: [TransactionSplit],
      providers: [
        {
          provide: CategoryRepository,
          useValue: {
            getCategories: () => of([category('food', 'expense'), category('home', 'expense'), category('salary', 'income')]),
          },
        },
        {
          provide: TransactionRepository,
          useValue: {
            splitTransaction: (id: string, parts: SplitPart[]) => {
              sent.push({ id, parts });
              return of([]);
            },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(TransactionSplit);
    fixture.componentRef.setInput('transaction', payment);
    await fixture.whenStable();
    return fixture;
  }

  const setParts = async (fixture: Awaited<ReturnType<typeof render>>, parts: SplitPart[]) => {
    (fixture.componentInstance as any).model.set({ parts });
    await fixture.whenStable();
  };

  const save = (el: HTMLElement) => el.querySelector('.btn-filled') as HTMLButtonElement;

  it('starts with the whole amount in the payment category and offers only categories of its type', async () => {
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;
    const options = Array.from(el.querySelectorAll('#split-category-1 option'))
      .map((o) => (o as HTMLOptionElement).value)
      .filter(Boolean);

    expect(options).toEqual(['food', 'home']);
    expect((el.querySelector('#split-category-0') as HTMLSelectElement).value).toBe('food');
    expect((el.querySelector('#split-amount-0') as HTMLInputElement).value).toBe('420');
    expect(el.querySelectorAll('.split-part').length).toBe(2);
    // The second part is still empty.
    expect(save(el).disabled).toBe(true);
  });

  it('saves only once the parts add up to the payment', async () => {
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;

    await setParts(fixture, [
      { categoryId: 'food', amount: 300 },
      { categoryId: 'home', amount: 100 },
    ]);
    expect(save(el).disabled).toBe(true);
    expect(el.querySelector('.split-remaining')?.classList).toContain('off');

    await setParts(fixture, [
      { categoryId: 'food', amount: 299.9 },
      { categoryId: 'home', amount: 120.1 },
    ]);
    expect(save(el).disabled).toBe(false);
    expect(el.querySelector('.split-remaining')?.classList).not.toContain('off');

    save(el).click();

    expect(sent).toMatchObject([
      {
        id: 'tx',
        parts: [
          { categoryId: 'food', amount: 299.9 },
          { categoryId: 'home', amount: 120.1 },
        ],
      },
    ]);
  });

  it('adds a part holding what is left and keeps at least two', async () => {
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;
    await setParts(fixture, [
      { categoryId: 'food', amount: 300 },
      { categoryId: 'home', amount: 100 },
    ]);
    const removeButtons = () => Array.from(el.querySelectorAll('.remove-part')) as HTMLButtonElement[];
    expect(removeButtons().map((b) => b.disabled)).toEqual([true, true]);

    (el.querySelector('.add-part') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect((el.querySelector('#split-amount-2') as HTMLInputElement).value).toBe('20');
    expect(removeButtons().map((b) => b.disabled)).toEqual([false, false, false]);

    removeButtons()[1].click();
    await fixture.whenStable();

    expect((fixture.componentInstance as any).model().parts).toMatchObject([
      { categoryId: 'food', amount: 300 },
      { categoryId: '', amount: 20 },
    ]);
  });
});
