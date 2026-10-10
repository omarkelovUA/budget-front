import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { pressEscape, stubDialogs } from '../../../shared/ui/modal/modal.testing';
import { CategoryRepository } from '../../categories/data/category-repository';
import { BudgetRepository } from '../data/budget-repository';
import { BudgetList } from './budget-list';

describe('BudgetList', () => {
  beforeEach(() => {
    stubDialogs();
    TestBed.configureTestingModule({
      imports: [BudgetList],
      providers: [
        { provide: BudgetRepository, useValue: { getBudgets: () => of([]) } },
        { provide: CategoryRepository, useValue: { getCategories: () => of([]) } },
      ],
    });
  });

  it('creates a budget in a dialog that Cancel or Esc closes', async () => {
    const fixture = TestBed.createComponent(BudgetList);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const add = async () => {
      (el.querySelector('app-page-header .btn-tonal') as HTMLElement).click();
      await fixture.whenStable();
    };

    await add();
    expect((el.querySelector('dialog') as HTMLDialogElement).open).toBe(true);
    expect(el.querySelector('#budget-form-title')?.textContent).toBe('Новий бюджет');
    (el.querySelector('app-budget-form .btn-text') as HTMLElement).click();
    await fixture.whenStable();
    expect(el.querySelector('dialog')).toBeNull();

    await add();
    await pressEscape(el.querySelector('dialog') as HTMLDialogElement);
    await fixture.whenStable();
    expect(el.querySelector('dialog')).toBeNull();
  });
});
