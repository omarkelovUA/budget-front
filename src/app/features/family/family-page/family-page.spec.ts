import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { AuthState } from '../../../core/auth/auth-state';
import { AuthRepository } from '../../../core/auth/data/auth-repository';
import { FamilyRole, IFamily, IIncomingJoinRequest, IJoinRequest, IReceivedInvitation } from '../../../model/types';
import { pressEscape, stubDialogs } from '../../../shared/ui/modal/modal.testing';
import { FamilyRepository } from '../data/family-repository';
import { CategoryRepository } from '../../categories/data/category-repository';
import { FamilyPage } from './family-page';

const user = (id: string, displayName: string) => ({ id, email: `${id}@x.com`, displayName, familyId: 'f' });
const member = (id: string, role: FamilyRole) => ({ user: user(id, id), role, joinedAt: new Date() });

// The signed-in user is 'me'.
const ALONE: IFamily = { id: 'own', name: 'Family', members: [member('me', 'admin')], categoriesReviewed: false };
const AS_ADMIN: IFamily = { id: 'f', name: 'Smiths', members: [member('me', 'admin'), member('carol', 'member')], categoriesReviewed: true };
const AS_MEMBER: IFamily = { id: 'f', name: 'Smiths', members: [member('alice', 'admin'), member('me', 'member')], categoriesReviewed: true };
const NEW_OWN: IFamily = { id: 'new-own', name: 'Family', members: [member('me', 'admin')], categoriesReviewed: false };

const INVITATION: IReceivedInvitation = {
  id: 'inv-1',
  familyId: 'joneses',
  familyName: 'Joneses',
  invitedBy: 'Alice',
  memberCount: 3,
  expiresAt: new Date('2026-10-14'),
};
const OWN_REQUEST: IJoinRequest = {
  id: 'req-1',
  email: 'alice@x.com',
  familyName: 'Smiths',
  createdAt: new Date(),
  expiresAt: new Date(),
};
const INCOMING: IIncomingJoinRequest = {
  id: 'req-2',
  requesterId: 'dave',
  displayName: 'Dave',
  email: 'dave@x.com',
  createdAt: new Date(),
  expiresAt: new Date(),
};

describe('FamilyPage', () => {
  let calls: unknown[][];
  let family: IFamily;
  let received: IReceivedInvitation[] | null;
  let ownRequest: IJoinRequest | null;
  let fixture: ComponentFixture<FamilyPage>;

  const call =
    <T,>(name: string, result: () => Observable<T>) =>
    (...args: unknown[]) => {
      calls.push([name, ...args]);
      return result();
    };

  async function render(options: { family: IFamily; received?: IReceivedInvitation[] | null; request?: IJoinRequest }) {
    stubDialogs();
    calls = [];
    family = options.family;
    received = options.received === undefined ? [] : options.received;
    ownRequest = options.request ?? null;
    TestBed.configureTestingModule({
      imports: [FamilyPage],
      providers: [
        {
          provide: AuthRepository,
          useValue: { refresh: () => of({ accessToken: 't', user: { id: 'me', email: 'me@x.com', displayName: 'Me' } }) },
        },
        {
          provide: FamilyRepository,
          useValue: {
            getCurrentFamily: () => of(family),
            getInvitations: () => of([]),
            getReceivedInvitations: () => of(received),
            getOwnJoinRequest: () => of(ownRequest),
            getIncomingJoinRequests: () => of([INCOMING]),
            renameFamily: call('rename', () => of({ ...family, name: 'Renamed' })),
            invite: call('invite', () => (family === AS_ADMIN ? throwError(() => new Error('Already invited')) : of({}))),
            markCategoriesReviewed: call('reviewed', () => of(undefined)),
            requestToJoin: call('requestToJoin', () => {
              ownRequest = OWN_REQUEST;
              return of(OWN_REQUEST);
            }),
            cancelJoinRequest: call('cancelJoinRequest', () => {
              ownRequest = null;
              return of(undefined);
            }),
            approveJoinRequest: call('approve', () => of(family)),
            declineJoinRequest: call('decline', () => of(undefined)),
            acceptInvitation: call('accept', () => of({ ...AS_MEMBER, id: 'joneses' })),
            removeMember: call('remove', () => of(undefined)),
            leaveFamily: call('leave', () => (family === AS_ADMIN ? throwError(() => new Error('Busy')) : of(NEW_OWN))),
          },
        },
        {
          provide: CategoryRepository,
          useValue: {
            getCategories: () =>
              of([
                { id: 'food', type: 'expense', name: 'Groceries', icon: '', color: 'green', visibility: 'shared' },
                { id: 'hobby', type: 'expense', name: 'Hobby', icon: '', color: 'red', visibility: 'private' },
                { id: 'salary', type: 'income', name: 'Salary', icon: '', color: 'green', visibility: 'shared' },
              ]),
            hideCategory: call('hide', () => of({})),
          },
        },
      ],
    });
    TestBed.inject(AuthState).restoreSession();
    fixture = TestBed.createComponent(FamilyPage);
    await fixture.whenStable();
  }

  const el = () => fixture.nativeElement as HTMLElement;
  const headerButtons = () =>
    Array.from(el().querySelectorAll('app-page-header button')).map((b) => b.textContent?.trim());

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

  describe('alone in their own family', () => {
    it('offers to invite or to ask to join, but not to leave', async () => {
      await render({ family: ALONE });

      expect(headerButtons()).toEqual(['+ Запросити', "Приєднатися до сім'ї"]);
      expect(el().querySelector('.family-details h2')?.textContent).toBe('Family');
      expect(el().querySelector('.leave-row')).toBeNull();
      expect(el().textContent).not.toContain("У вас ще немає сім'ї");
    });

    it('asks to join a family in a dialog, then waits for an answer it can cancel', async () => {
      await render({ family: ALONE });

      await click('app-page-header button:nth-of-type(2)');
      expect(el().querySelector('#family-join-title')?.textContent).toBe("Попросити приєднатися до сім'ї");
      await type('#family-join-email', 'alice@x.com');
      await click('app-modal .btn-filled');

      expect(calls).toEqual([['requestToJoin', 'alice@x.com']]);
      expect(el().querySelector('app-modal')).toBeNull();
      expect(el().querySelector('.own-request')?.textContent).toContain('«Smiths» (alice@x.com)');
      expect(headerButtons()).toEqual(['+ Запросити']);

      await click('.own-request button');
      expect(calls.at(-1)).toEqual(['cancelJoinRequest']);
      expect(el().querySelector('.own-request')).toBeNull();
    });

    it('needs a verified email to ask to join', async () => {
      await render({ family: ALONE, received: null });

      expect(headerButtons()).toEqual(['+ Запросити']);
      expect(el().querySelector('.received-invitations')?.textContent).toContain('Увійти через Google');
    });

    it('accepts an invitation right away', async () => {
      await render({ family: ALONE, received: [INVITATION] });

      await click('.invitation-row .btn-filled');

      expect(calls).toEqual([['accept', 'inv-1']]);
      expect(TestBed.inject(AuthState).currentUser()?.familyId).toBe('joneses');
    });

    it('renames the family in a dialog', async () => {
      await render({ family: ALONE });

      await click('.family-title button');
      expect((el().querySelector('#family-name') as HTMLInputElement).value).toBe('Family');
      await type('#family-name', 'Shevchenkos');
      await click('app-modal .btn-filled');

      expect(calls).toEqual([['rename', 'Shevchenkos']]);
      expect(el().querySelector('app-modal')).toBeNull();
    });
  });

  describe('on the first new member', () => {
    it('asks once which family categories to keep personal', async () => {
      await render({ family: ALONE });

      await click('app-page-header .btn-tonal');
      await type('#family-invite-email', 'carol@x.com');
      await click('app-modal .btn-filled');

      expect(el().querySelector('#family-review-title')?.textContent).toBe("Які категорії бачитиме сім'я?");
      const boxes = Array.from(el().querySelectorAll<HTMLInputElement>('.review-item input'));
      expect(boxes.map((b) => b.parentElement?.textContent?.trim().split(' ')[0])).toEqual(['Groceries', 'Salary']);
      expect(boxes.every((b) => b.checked)).toBe(true);

      boxes[1].click();
      await fixture.whenStable();
      await click('app-modal .btn-filled');

      expect(calls).toEqual([['invite', 'carol@x.com'], ['hide', 'salary'], ['reviewed']]);
      expect(el().querySelector('app-modal')).toBeNull();
    });

    it('keeps every category in the family when closed without choosing', async () => {
      await render({ family: ALONE });
      await click('app-page-header .btn-tonal');
      await type('#family-invite-email', 'carol@x.com');
      await click('app-modal .btn-filled');

      await pressEscape(el().querySelector('dialog') as HTMLDialogElement);
      await fixture.whenStable();

      expect(calls).toEqual([['invite', 'carol@x.com'], ['reviewed']]);
    });

    it('is not asked again once reviewed', async () => {
      await render({ family: AS_ADMIN });

      await click('.invitation-row .btn-filled');

      expect(el().querySelector('#family-review-title')).toBeNull();
    });
  });

  describe('as an admin with others', () => {
    it('invites, removes others and answers join requests, but no longer asks to join', async () => {
      await render({ family: AS_ADMIN });

      expect(headerButtons()).toEqual(['+ Запросити']);
      const removeButtons = Array.from(el().querySelectorAll('.member-row .btn-text'));
      expect(removeButtons.map((b) => b.getAttribute('aria-label'))).toEqual(["Вилучити carol із сім'ї"]);
      expect(el().querySelector('.leave-row')).not.toBeNull();

      await click('.invitation-row .btn-filled');
      expect(calls).toEqual([['approve', 'req-2']]);
    });

    it('confirms removing a member', async () => {
      await render({ family: AS_ADMIN });

      await click('.member-row .btn-text');
      expect(el().querySelector('#family-remove-title')?.textContent).toBe('Вилучити carol?');
      await click('app-modal .btn-danger');

      expect(calls).toEqual([['remove', 'carol']]);
      expect(el().querySelector('app-modal')).toBeNull();
    });

    it('keeps errors inside the dialog until it is closed', async () => {
      await render({ family: AS_ADMIN });

      await click('app-page-header .btn-tonal');
      await type('#family-invite-email', 'dave@x.com');
      await click('app-modal .btn-filled');
      expect(el().querySelector('app-modal .form-error')?.textContent).toContain('Already invited');

      await pressEscape(el().querySelector('dialog') as HTMLDialogElement);
      await fixture.whenStable();
      expect(el().querySelector('app-modal')).toBeNull();
      expect(el().querySelector('.form-error')).toBeNull();
    });

    it('keeps the leave dialog open with the error when leaving fails', async () => {
      await render({ family: AS_ADMIN });

      await click('.leave-row button');
      await click('app-modal .btn-danger');

      expect(el().querySelector('app-modal .form-error')?.textContent).toContain('Busy');
      expect(TestBed.inject(AuthState).currentUser()?.familyId).toBe('f');
    });
  });

  describe('as a member', () => {
    it('can only leave, into a family of their own', async () => {
      await render({ family: AS_MEMBER });

      expect(headerButtons()).toEqual([]);
      expect(el().querySelector('.member-row .btn-text')).toBeNull();
      expect(el().querySelector('.family-title button')).toBeNull();

      await click('.leave-row button');
      expect(el().querySelector('#family-leave-title')?.textContent).toBe("Покинути сім'ю?");
      family = NEW_OWN;
      await click('app-modal .btn-danger');

      expect(calls).toEqual([['leave']]);
      expect(el().querySelector('app-modal')).toBeNull();
      expect(TestBed.inject(AuthState).currentUser()?.familyId).toBe('new-own');
    });

    it('confirms switching to another family', async () => {
      await render({ family: AS_MEMBER, received: [INVITATION] });

      await click('.invitation-row .btn-filled');
      expect(calls).toEqual([]);
      expect(el().querySelector('#family-switch-title')?.textContent).toBe('Приєднатися до «Joneses»?');

      await click('app-modal .btn-danger');
      expect(calls).toEqual([['accept', 'inv-1']]);
      expect(el().querySelector('app-modal')).toBeNull();
    });
  });
});
