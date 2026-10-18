import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FamilyRole, ICategory, IFamily } from '../../../model/types';
import { AuthState } from '../../../core/auth/auth-state';
import { AuthRepository } from '../../../core/auth/data/auth-repository';
import { FamilyRepository } from '../../family/data/family-repository';
import { pressEscape, stubDialogs } from '../../../shared/ui/modal/modal.testing';
import { CategoryRepository } from '../data/category-repository';
import { CategoryList } from './category-list';

const FOOD: ICategory = { id: 'c1', name: 'Food', type: 'expense', icon: '', color: 'green', visibility: 'private' };
const RENT: ICategory = { id: 'c2', name: 'Rent', type: 'expense', icon: '', color: 'blue', visibility: 'shared' };

const familyWithMe = (role: FamilyRole): IFamily => ({
  id: 'f',
  name: 'Family',
  categoriesReviewed: true,
  entitled: true,
  frozen: false,
  members: [{ user: { id: 'me', email: 'me@x.com', displayName: 'Me', familyId: 'f' }, role, joinedAt: new Date() }],
});

describe('CategoryList', () => {
  let updated: ICategory[];
  let calls: string[];
  let role: FamilyRole;
  let failOrder: boolean;
  let frozen: boolean;

  beforeEach(() => {
    stubDialogs();
    updated = [];
    calls = [];
    role = 'admin';
    failOrder = false;
    frozen = false;
    TestBed.configureTestingModule({
      imports: [CategoryList],
      providers: [
        {
          provide: CategoryRepository,
          useValue: {
            getCategories: () => of([FOOD, RENT]),
            reorderCategories: (ids: string[]) =>
              (calls.push(`order ${ids.join(' ')}`), failOrder ? throwError(() => new Error('Nope')) : of(undefined)),
            shareCategory: (id: string) => (calls.push(`share ${id}`), of(FOOD)),
            hideCategory: (id: string) => (calls.push(`hide ${id}`), of(RENT)),
            updateCategory: (category: ICategory) => {
              updated.push(category);
              return of(category);
            },
          },
        },
        {
          provide: AuthRepository,
          useValue: { refresh: () => of({ accessToken: 't', user: { id: 'me', email: 'me@x.com', displayName: 'Me' } }) },
        },
        { provide: FamilyRepository, useValue: { getCurrentFamily: () => of({ ...familyWithMe(role), frozen }) } },
      ],
    });
  });

  async function render() {
    TestBed.inject(AuthState).restoreSession();
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

  const cards = (el: HTMLElement) => Array.from(el.querySelectorAll('.category-card'));

  it('lets a member use family categories but only manage their own', async () => {
    role = 'member';
    const { el, click } = await render();
    const [food, rent] = cards(el);

    expect(food.querySelector('button.card-select')).not.toBeNull();
    expect(rent.querySelector('button')).toBeNull();
    expect(rent.classList).toContain('readonly');

    await click('.category-card .text-button');
    expect(calls).toEqual(['share c1']);
  });

  it('lets the admin hide a family category', async () => {
    const { el } = await render();
    const rent = cards(el)[1];

    expect(rent.querySelector('.text-button')?.textContent?.trim()).toBe("Приховати від сім'ї");
    (rent.querySelector('.text-button') as HTMLButtonElement).click();

    expect(calls).toEqual(['hide c2']);
  });

  it("leaves a frozen family's categories alone, even for the admin", async () => {
    frozen = true;
    const { el } = await render();
    const [food, rent] = cards(el);

    expect(rent.querySelector('button')).toBeNull();
    expect(rent.classList).toContain('readonly');
    expect((food.querySelector('.text-button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('saves a dropped category in its new place', async () => {
    const { fixture, el } = await render();

    fixture.componentInstance.dropCategory({ previousIndex: 1, currentIndex: 0 });
    await fixture.whenStable();

    expect(calls).toEqual(['order c2 c1']);
    expect(Array.from(el.querySelectorAll('.category-name')).map((n) => n.textContent)).toEqual(['Rent', 'Food']);
  });

  it('puts the order back and says why when saving fails', async () => {
    failOrder = true;
    const { fixture, el } = await render();

    fixture.componentInstance.moveCategory(0, 1);
    await fixture.whenStable();

    expect(el.querySelector('.form-error')?.textContent).toContain('Nope');
    expect(Array.from(el.querySelectorAll('.category-name')).map((n) => n.textContent)).toEqual(['Food', 'Rent']);
  });
});
