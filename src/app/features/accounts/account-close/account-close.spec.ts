import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AUTH_STATE_DEPENDENCIES } from '../../../core/auth/auth-state.testing';
import { IAccount } from '../../../model/types';
import { AccountRepository } from '../data/account-repository';
import { AccountClose } from './account-close';

const account = (id: string, balance: number, overrides: Partial<IAccount> = {}): IAccount => ({
  id,
  name: id,
  balance,
  currency: 'UAH',
  icon: '',
  color: 'green',
  owner: { id: 'me', displayName: 'Me' },
  access: 'owner',
  closed: false,
  ...overrides,
});

describe('AccountClose', () => {
  let fixture: ComponentFixture<AccountClose>;
  let closeCalls: [string, string | null][];

  async function render(closing: IAccount, accounts: IAccount[]) {
    closeCalls = [];
    TestBed.configureTestingModule({
      imports: [AccountClose],
      providers: [
        ...AUTH_STATE_DEPENDENCIES,
        {
          provide: AccountRepository,
          useValue: {
            closeAccount: (id: string, target: string | null) => {
              closeCalls.push([id, target]);
              return of(closing);
            },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(AccountClose);
    fixture.componentRef.setInput('account', closing);
    fixture.componentRef.setInput('accounts', accounts);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('offers only open accounts in the same currency the user may record on', async () => {
    const card = account('card', 100);
    const el = await render(card, [
      card,
      account('savings', 0),
      account('dollars', 0, { currency: 'USD' }),
      account('bobs-shared', 0, { access: 'shared' }),
      account('bobs-visible', 0, { access: 'visible' }),
    ]);

    const options = Array.from(el.querySelectorAll('#close-target option')).map((o) => (o as HTMLOptionElement).value);
    expect(options).toEqual(['', 'savings', 'bobs-shared']);
    expect(el.textContent).toMatch(/Залишок 100,00\s₴ буде переказано/);
  });

  it('needs a target before confirming a non-zero balance', async () => {
    const card = account('card', -40);
    const el = await render(card, [card, account('savings', 0)]);
    const confirm = el.querySelector('.btn-danger') as HTMLButtonElement;

    expect(el.textContent).toMatch(/Борг 40,00\s₴ буде погашено/);
    expect(confirm.disabled).toBe(true);

    const select = el.querySelector('#close-target') as HTMLSelectElement;
    select.value = 'savings';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    confirm.click();

    expect(closeCalls).toEqual([['card', 'savings']]);
  });

  it('closes a zero balance without a target', async () => {
    const empty = account('empty', 0);
    const el = await render(empty, [empty]);

    (el.querySelector('.btn-danger') as HTMLButtonElement).click();

    expect(closeCalls).toEqual([['empty', null]]);
  });

  it('explains when no account can take the balance', async () => {
    const card = account('card', 10);
    const el = await render(card, [card, account('dollars', 0, { currency: 'USD' })]);

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Немає іншого рахунку у UAH');
    expect((el.querySelector('.btn-danger') as HTMLButtonElement).disabled).toBe(true);
  });
});
