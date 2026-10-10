import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ICategory } from '../../../model/types';
import { CategoryRepository } from '../data/category-repository';
import { CategoryForm } from './category-form';

describe('CategoryForm', () => {
  let fixture: ComponentFixture<CategoryForm>;
  let created: Omit<ICategory, 'id'>[];

  beforeEach(() => {
    created = [];
    TestBed.configureTestingModule({
      imports: [CategoryForm],
      providers: [
        {
          provide: CategoryRepository,
          useValue: {
            createCategory: (category: Omit<ICategory, 'id'>) => {
              created.push(category);
              return of({ ...category, id: 'c' });
            },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(CategoryForm);
  });

  const el = () => fixture.nativeElement as HTMLElement;
  const offered = () =>
    Array.from(el().querySelectorAll<HTMLInputElement>('app-icon-picker input')).map((i) => i.value);
  const picked = () => el().querySelector<HTMLInputElement>('app-icon-picker input:checked')?.value;

  async function pickType(type: ICategory['type']) {
    const radios = Array.from(el().querySelectorAll<HTMLInputElement>('.type-picker input'));
    radios.find((r) => r.value === type)!.click();
    await fixture.whenStable();
  }

  async function pickIcon(path: string) {
    el().querySelector<HTMLInputElement>(`app-icon-picker input[value="${path}"]`)!.click();
    await fixture.whenStable();
  }

  it('offers expense icons for a new expense category', async () => {
    await fixture.whenStable();

    expect(offered()).toContain('assets/food.svg');
    expect(offered()).not.toContain('assets/salary.svg');
    expect(picked()).toBe('assets/food.svg');
  });

  it('switches to income icons, and their first one, for an income category', async () => {
    await fixture.whenStable();
    await pickType('income');

    expect(offered()).toContain('assets/pension.svg');
    expect(offered()).not.toContain('assets/food.svg');
    expect(picked()).toBe('assets/salary.svg');

    (el().querySelector('#category-name') as HTMLInputElement).value = 'Pension';
    el().querySelector('#category-name')!.dispatchEvent(new Event('input'));
    await pickIcon('assets/pension.svg');
    (el().querySelector('form') as HTMLFormElement).requestSubmit();
    expect(created).toEqual([expect.objectContaining({ type: 'income', icon: 'assets/pension.svg' })]);
  });

  it('keeps an icon that fits both types', async () => {
    await fixture.whenStable();
    await pickIcon('assets/gift.svg');

    await pickType('income');

    expect(picked()).toBe('assets/gift.svg');
  });

  it('still shows a stored icon from the other list when editing', async () => {
    fixture.componentRef.setInput('category', {
      id: 'c',
      name: 'Old',
      type: 'expense',
      icon: 'assets/salary.svg',
      color: 'green',
      visibility: 'private',
    });
    await fixture.whenStable();

    expect(offered().at(-1)).toBe('assets/salary.svg');
    expect(picked()).toBe('assets/salary.svg');
  });
});
