import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthRepository } from '../../../core/auth/data/auth-repository';
import { IAccount } from '../../../model/types';
import { FamilyRepository } from '../../family/data/family-repository';
import { FamilyTransferRepository } from '../../family-transfers/data/family-transfer-repository';
import { AccountRepository } from '../data/account-repository';
import { pressEscape, stubDialogs } from '../../../shared/ui/modal/modal.testing';
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
  beforeEach(() => stubDialogs());

  async function render() {
    TestBed.configureTestingModule({
      imports: [AccountList],
      providers: [
        { provide: AccountRepository, useValue: { getAccounts: () => of([account('mine', 'owner')]) } },
        { provide: AuthRepository, useValue: {} },
        { provide: FamilyRepository, useValue: {} },
        { provide: FamilyTransferRepository, useValue: {} },
      ],
    });
    const fixture = TestBed.createComponent(AccountList);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const click = async (selector: string) => {
      (el.querySelector(selector) as HTMLElement).click();
      await fixture.whenStable();
    };
    return { fixture, el, click };
  }

  it('creates an account in a dialog that Cancel closes', async () => {
    const { el, click } = await render();

    await click('app-page-header .btn-tonal');
    expect((el.querySelector('dialog') as HTMLDialogElement).open).toBe(true);
    expect(el.querySelector('#account-form-title')?.textContent).toBe('Новий рахунок');

    await click('app-account-form .btn-text');
    expect(el.querySelector('dialog')).toBeNull();
  });

  it('edits an account in a dialog that Esc closes', async () => {
    const { fixture, el, click } = await render();

    await click('.card-select');
    expect(el.querySelector('#account-form-title')?.textContent).toBe('mine');

    await pressEscape(el.querySelector('dialog') as HTMLDialogElement);
    await fixture.whenStable();
    expect(el.querySelector('dialog')).toBeNull();
  });

  it('closes an account in a dialog', async () => {
    const { el, click } = await render();

    await click('.text-button');
    expect(el.querySelector('dialog')?.getAttribute('aria-labelledby')).toBe('close-title');

    await click('app-account-close .btn-text');
    expect(el.querySelector('dialog')).toBeNull();
  });

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
        { provide: FamilyTransferRepository, useValue: {} },
      ],
    });
    const fixture = TestBed.createComponent(AccountList);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const groups = Array.from(el.querySelectorAll('.account-group'));
    expect(groups.map((g) => g.querySelector('h2')?.textContent?.trim())).toEqual([
      'Мої рахунки',
      'Спільні зі мною',
      'Доступні для перегляду',
    ]);
    expect(groups.map((g) => g.querySelectorAll('.text-button').length)).toEqual([1, 0, 0]);
    expect(groups[0].textContent).toContain('Доступ: Bob');
    expect(groups[1].textContent).toContain('Власник: Alice');
  });

  it('moves an account within its group with the arrow keys and saves the order', async () => {
    const saved: string[][] = [];
    TestBed.configureTestingModule({
      imports: [AccountList],
      providers: [
        {
          provide: AccountRepository,
          useValue: {
            getAccounts: () => of([account('a', 'owner'), account('b', 'owner'), account('joint', 'shared')]),
            reorderAccounts: (ids: string[]) => (saved.push(ids), of(undefined)),
          },
        },
        { provide: AuthRepository, useValue: {} },
        { provide: FamilyRepository, useValue: {} },
        { provide: FamilyTransferRepository, useValue: {} },
      ],
    });
    const fixture = TestBed.createComponent(AccountList);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const names = () => Array.from(el.querySelectorAll('.account-name')).map((n) => n.textContent);
    const handle = (i: number) => el.querySelectorAll<HTMLElement>('app-drag-handle')[i];

    expect(handle(0).getAttribute('aria-label')).toBe(
      'Перемістити «a»: перетягніть або скористайтеся клавішами зі стрілками',
    );
    handle(0).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    await fixture.whenStable();
    expect(names()).toEqual(['b', 'a', 'joint']);
    expect(saved).toEqual([['b', 'a', 'joint']]);

    // Not across groups: the last one of "mine" stays put.
    handle(1).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    await fixture.whenStable();
    expect(saved.length).toBe(1);
  });
});
