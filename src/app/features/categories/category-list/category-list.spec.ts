import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ICategory } from '../../../model/types';
import { pressEscape, stubDialogs } from '../../../shared/ui/modal/modal.testing';
import { CategoryRepository } from '../data/category-repository';
import { CategoryList } from './category-list';

const FOOD: ICategory = { id: 'c1', name: 'Food', type: 'expense', icon: '', color: 'green', visibility: 'private' };

describe('CategoryList', () => {
  let updated: ICategory[];

  beforeEach(() => {
    stubDialogs();
    updated = [];
    TestBed.configureTestingModule({
      imports: [CategoryList],
      providers: [
        {
          provide: CategoryRepository,
          useValue: {
            getCategories: () => of([FOOD]),
            updateCategory: (category: ICategory) => {
              updated.push(category);
              return of(category);
            },
          },
        },
      ],
    });
  });

  async function render() {
    const fixture = TestBed.createComponent(CategoryList);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const click = async (selector: string) => {
      (el.querySelector(selector) as HTMLElement).click();
      await fixture.whenStable();
    };
    return { fixture, el, click };
  }

  it('creates a category in a dialog that Cancel closes', async () => {
    const { el, click } = await render();

    await click('app-page-header .btn-tonal');
    expect((el.querySelector('dialog') as HTMLDialogElement).open).toBe(true);
    expect(el.querySelector('#category-form-title')?.textContent).toBe('Нова категорія');

    await click('app-category-form .btn-text');
    expect(el.querySelector('dialog')).toBeNull();
  });

  it('edits a category in a dialog that closes once saved', async () => {
    const { el, click } = await render();

    await click('.card-select');
    expect(el.querySelector('#category-form-title')?.textContent).toBe('Food');

    await click('app-category-form .btn-filled');
    expect(updated.map((c) => c.id)).toEqual(['c1']);
    expect(el.querySelector('dialog')).toBeNull();
  });

  it('closes the dialog on Esc', async () => {
    const { fixture, el, click } = await render();

    await click('app-page-header .btn-tonal');
    await pressEscape(el.querySelector('dialog') as HTMLDialogElement);
    await fixture.whenStable();

    expect(el.querySelector('dialog')).toBeNull();
  });
});
