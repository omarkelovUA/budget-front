import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthState } from '../../../core/auth/auth-state';
import { AuthRepository } from '../../../core/auth/data/auth-repository';
import { IFamily, IReceivedInvitation } from '../../../model/types';
import { FamilyRepository } from '../data/family-repository';
import { pressEscape, stubDialogs } from '../../../shared/ui/modal/modal.testing';
import { FamilyPage } from './family-page';

const OLD_FAMILY: IFamily = { id: 'old', name: 'Old', members: [] };
const NEW_FAMILY: IFamily = { id: 'new', name: 'Smiths', members: [] };
const ADMIN_FAMILY: IFamily = {
  id: 'f',
  name: 'Smiths',
  members: [{ user: { id: 'u', email: 'bob@x.com', displayName: 'Bob', familyId: 'f' }, role: 'admin', joinedAt: new Date() }],
};
const INVITATION: IReceivedInvitation = {
  id: 'inv-1',
  familyId: 'new',
  familyName: 'Smiths',
  invitedBy: 'Alice',
  memberCount: 3,
  expiresAt: new Date('2026-10-14'),
};

describe('FamilyPage', () => {
  let accepted: string[];
  let invited: string[];

  beforeEach(() => stubDialogs());

  async function render(currentFamily: IFamily | null, received: IReceivedInvitation[] | null) {
    accepted = [];
    invited = [];
    TestBed.configureTestingModule({
      imports: [FamilyPage],
      providers: [
        {
          provide: AuthRepository,
          useValue: { login: () => of({ accessToken: 't', user: { id: 'u', email: 'bob@x.com', displayName: 'Bob' } }) },
        },
        {
          provide: FamilyRepository,
          useValue: {
            getCurrentFamily: () => of(currentFamily),
            getInvitations: () => of([]),
            getReceivedInvitations: () => of(received),
            acceptInvitation: (id: string) => {
              accepted.push(id);
              return of(NEW_FAMILY);
            },
            createFamily: (name: string) => of({ ...NEW_FAMILY, name }),
            invite: (email: string) => {
              invited.push(email);
              return email.endsWith('@taken.com') ? throwError(() => new Error('Already invited')) : of({});
            },
          },
        },
      ],
    });
    TestBed.inject(AuthState).login('bob@x.com', 'x').subscribe();
    const fixture = TestBed.createComponent(FamilyPage);
    await fixture.whenStable();
    return fixture;
  }

  const buttons = (el: HTMLElement) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('.invitation-row button'));

  it('asks for confirmation before moving a family member into another family', async () => {
    const fixture = await render(OLD_FAMILY, [INVITATION]);
    const el = fixture.nativeElement as HTMLElement;

    buttons(el)[0].click();
    await fixture.whenStable();
    expect(accepted).toEqual([]);
    expect(el.querySelector('.warning')?.textContent).toContain('покинете поточну сім');

    buttons(el)[0].click();
    await fixture.whenStable();
    expect(accepted).toEqual(['inv-1']);
    expect(TestBed.inject(AuthState).currentUser()?.familyId).toBe('new');
  });

  it('accepts right away for a user without a family', async () => {
    const fixture = await render(null, [INVITATION]);

    buttons(fixture.nativeElement)[0].click();
    await fixture.whenStable();

    expect(accepted).toEqual(['inv-1']);
  });

  it('asks an unverified user to sign in with Google', async () => {
    const fixture = await render(null, null);
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.received-invitations')?.textContent).toContain('Увійти через Google');
    expect(el.querySelector('.invitation-row')).toBeNull();
  });

  async function type(fixture: ComponentFixture<FamilyPage>, selector: string, value: string) {
    const input = (fixture.nativeElement as HTMLElement).querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function click(fixture: ComponentFixture<FamilyPage>, selector: string) {
    ((fixture.nativeElement as HTMLElement).querySelector(selector) as HTMLElement).click();
    await fixture.whenStable();
  }

  it('creates a family in a dialog', async () => {
    const fixture = await render(null, []);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#family-name')).toBeNull();

    await click(fixture, 'app-page-header .btn-tonal');
    expect((el.querySelector('dialog') as HTMLDialogElement).open).toBe(true);
    expect(el.querySelector('#family-create-title')?.textContent).toBe("Нова сім'я");

    await type(fixture, '#family-name', 'Smiths');
    await click(fixture, 'dialog .btn-filled');

    expect(el.querySelector('dialog')).toBeNull();
    expect(TestBed.inject(AuthState).currentUser()?.familyId).toBe('new');
  });

  it('invites a member in a dialog that keeps errors inside and Esc closes', async () => {
    const fixture = await render(ADMIN_FAMILY, []);
    TestBed.inject(AuthState).setFamilyId('f');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    await click(fixture, 'app-page-header .btn-tonal');
    expect(el.querySelector('#family-invite-title')?.textContent).toBe("Запросити до сім'ї");

    await type(fixture, '#family-invite-email', 'carol@taken.com');
    await click(fixture, 'dialog .btn-filled');
    expect(invited).toEqual(['carol@taken.com']);
    expect(el.querySelector('dialog .form-error')?.textContent).toContain('Already invited');

    await pressEscape(el.querySelector('dialog') as HTMLDialogElement);
    await fixture.whenStable();
    expect(el.querySelector('dialog')).toBeNull();
    expect(el.querySelector('.form-error')).toBeNull();
  });

  it('closes the invite dialog once sent', async () => {
    const fixture = await render(ADMIN_FAMILY, []);
    TestBed.inject(AuthState).setFamilyId('f');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    await click(fixture, 'app-page-header .btn-tonal');
    await type(fixture, '#family-invite-email', 'carol@x.com');
    await click(fixture, 'dialog .btn-filled');

    expect(invited).toEqual(['carol@x.com']);
    expect(el.querySelector('dialog')).toBeNull();
  });
});
