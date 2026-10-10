import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthState } from '../../../core/auth/auth-state';
import { AuthRepository } from '../../../core/auth/data/auth-repository';
import { IAccount, IFamily, IFamilyTransfers } from '../../../model/types';
import { FamilyRepository } from '../../family/data/family-repository';
import { FamilyTransferRepository } from '../data/family-transfer-repository';
import { pressEscape, stubDialogs } from '../../../shared/ui/modal/modal.testing';
import { FamilyTransfers } from './family-transfers';

const user = (id: string, displayName: string) => ({ id, email: `${id}@x.com`, displayName, familyId: 'f' });

const FAMILY: IFamily = {
  id: 'f',
  name: 'Smiths',
  categoriesReviewed: true,
  members: [
    { user: user('me', 'Me'), role: 'admin', joinedAt: new Date() },
    { user: user('bob', 'Bob'), role: 'member', joinedAt: new Date() },
  ],
};

const TRANSFERS: IFamilyTransfers = {
  incoming: [{ id: 'in-1', counterpart: { id: 'bob', displayName: 'Bob' }, currency: 'UAH', amount: 300 }],
  outgoing: [{ id: 'out-1', counterpart: { id: 'bob', displayName: 'Bob' }, currency: 'USD', amount: 20 }],
};

const account = (id: string, currency: string, access: IAccount['access'] = 'owner'): IAccount => ({
  id,
  name: id,
  balance: 100,
  currency,
  icon: '',
  color: 'green',
  owner: { id: 'me', displayName: 'Me' },
  access,
  closed: false,
});

describe('FamilyTransfers', () => {
  let fixture: ComponentFixture<FamilyTransfers>;
  let calls: unknown[][];

  beforeEach(async () => {
    calls = [];
    stubDialogs();
    TestBed.configureTestingModule({
      imports: [FamilyTransfers],
      providers: [
        {
          provide: AuthRepository,
          useValue: { login: () => of({ accessToken: 't', user: { id: 'me', email: 'me@x.com', displayName: 'Me' } }) },
        },
        { provide: FamilyRepository, useValue: { getCurrentFamily: () => of(FAMILY) } },
        {
          provide: FamilyTransferRepository,
          useValue: {
            getInTransit: () => of(TRANSFERS),
            send: (...args: unknown[]) => (calls.push(['send', ...args]), of(undefined)),
            collect: (...args: unknown[]) => (
              calls.push(['collect', ...args]), args[2] === 99 ? throwError(() => new Error('Too much')) : of(undefined)
            ),
            takeBack: (...args: unknown[]) => (calls.push(['takeBack', ...args]), of(undefined)),
          },
        },
      ],
    });
    TestBed.inject(AuthState).login('me@x.com', 'x').subscribe();
    fixture = TestBed.createComponent(FamilyTransfers);
    fixture.componentRef.setInput('accounts', [
      account('uah-card', 'UAH'),
      account('usd-card', 'USD'),
      account('bobs-joint', 'UAH', 'shared'),
    ]);
    await fixture.whenStable();
  });

  const el = () => fixture.nativeElement as HTMLElement;

  async function click(selector: string) {
    (el().querySelector(selector) as HTMLElement).click();
    await fixture.whenStable();
  }

  async function type(selector: string, value: string) {
    const input = el().querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  it('collects into one of the user\'s own accounts in the transfer\'s currency', async () => {
    const collectButton = el().querySelector('.transit-row button') as HTMLButtonElement;
    expect(el().querySelector('.transit-row')?.textContent).toContain('Bob');
    collectButton.click();
    await fixture.whenStable();

    expect(el().querySelector('#withdraw-title')?.textContent).toBe('Отримати');
    const targets = Array.from(el().querySelectorAll('#withdraw-target option')).map((o) => (o as HTMLOptionElement).value);
    expect(targets).toEqual(['uah-card']);

    await click('app-modal .btn-filled');
    expect(calls).toEqual([['collect', 'in-1', 'uah-card', null]]);
    expect(el().querySelector('app-modal')).toBeNull();
  });

  it('keeps a failed collect in its dialog until Esc', async () => {
    await click('.transit-row button');
    await type('#withdraw-amount', '99');
    await click('app-modal .btn-filled');

    expect(el().querySelector('app-modal .form-error')?.textContent).toContain('Too much');

    await pressEscape(el().querySelector('dialog') as HTMLDialogElement);
    await fixture.whenStable();
    expect(el().querySelector('app-modal')).toBeNull();
    expect(el().querySelector('.form-error')).toBeNull();
  });

  it('takes back part of what was sent', async () => {
    const takeBack = el().querySelectorAll('.transit-row button')[1] as HTMLButtonElement;
    expect(takeBack.textContent).toContain('Забрати назад');
    takeBack.click();
    await fixture.whenStable();
    await type('#withdraw-amount', '5');
    await click('app-modal .btn-filled');

    expect(calls).toEqual([['takeBack', 'out-1', 'usd-card', 5]]);
  });

  it('sends only from own accounts to other family members, in a dialog', async () => {
    expect(el().querySelector('#send-from')).toBeNull();
    await click('.send-button');
    expect(el().querySelector('#send-title')?.textContent).toBe("Надіслати члену сім'ї");
    const selects = el().querySelectorAll('app-modal select');
    const values = (select: Element) =>
      Array.from(select.querySelectorAll('option'))
        .map((o) => (o as HTMLOptionElement).value)
        .filter(Boolean);
    expect(values(selects[0])).toEqual(['uah-card', 'usd-card']);
    expect(values(selects[1])).toEqual(['bob']);

    (fixture.componentInstance as any).sendModel.set({ fromAccountId: 'uah-card', recipientId: 'bob', amount: 50 });
    await fixture.whenStable();
    await click('app-modal .btn-filled');

    expect(calls).toEqual([['send', 'uah-card', 'bob', 50]]);
    expect(el().querySelector('app-modal')).toBeNull();
  });

  it('shows nothing while the user is alone in their family', async () => {
    (fixture.componentInstance as any).familyResource.set({ ...FAMILY, members: [FAMILY.members[0]] });
    await fixture.whenStable();

    expect(el().querySelector('section')).toBeNull();
  });
});
