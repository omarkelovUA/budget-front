import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthState } from '../../../core/auth/auth-state';
import { AuthRepository } from '../../../core/auth/data/auth-repository';
import { IAccount, IFamily, IFamilyTransfers } from '../../../model/types';
import { FamilyRepository } from '../../family/data/family-repository';
import { FamilyTransferRepository } from '../data/family-transfer-repository';
import { FamilyTransfers } from './family-transfers';

const user = (id: string, displayName: string) => ({ id, email: `${id}@x.com`, displayName, familyId: 'f' });

const FAMILY: IFamily = {
  id: 'f',
  name: 'Smiths',
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
            collect: (...args: unknown[]) => (calls.push(['collect', ...args]), of(undefined)),
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

  it('collects into one of the user\'s own accounts in the transfer\'s currency', async () => {
    const collectButton = el().querySelector('.transit-row button') as HTMLButtonElement;
    expect(el().querySelector('.transit-row')?.textContent).toContain('Bob');
    collectButton.click();
    await fixture.whenStable();

    const targets = Array.from(el().querySelectorAll('.withdraw-panel option')).map((o) => (o as HTMLOptionElement).value);
    expect(targets).toEqual(['uah-card']);

    (el().querySelector('.withdraw-panel button') as HTMLButtonElement).click();
    expect(calls).toEqual([['collect', 'in-1', 'uah-card', null]]);
  });

  it('takes back part of what was sent', async () => {
    const takeBack = el().querySelectorAll('.transit-row button')[1] as HTMLButtonElement;
    expect(takeBack.textContent).toContain('Забрати назад');
    takeBack.click();
    await fixture.whenStable();
    const amount = el().querySelector('.withdraw-panel input') as HTMLInputElement;
    amount.value = '5';
    amount.dispatchEvent(new Event('input'));

    (el().querySelector('.withdraw-panel button') as HTMLButtonElement).click();

    expect(calls).toEqual([['takeBack', 'out-1', 'usd-card', 5]]);
  });

  it('sends only from own accounts to other family members', () => {
    const selects = el().querySelectorAll('.send-form select');
    const values = (select: Element) =>
      Array.from(select.querySelectorAll('option'))
        .map((o) => (o as HTMLOptionElement).value)
        .filter(Boolean);
    expect(values(selects[0])).toEqual(['uah-card', 'usd-card']);
    expect(values(selects[1])).toEqual(['bob']);

    (fixture.componentInstance as any).sendModel.set({ fromAccountId: 'uah-card', recipientId: 'bob', amount: 50 });
    fixture.componentInstance.send();

    expect(calls).toEqual([['send', 'uah-card', 'bob', 50]]);
  });
});
