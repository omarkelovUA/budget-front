import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthState } from '../../../core/auth/auth-state';
import { AuthRepository } from '../../../core/auth/data/auth-repository';
import { IFamily, IReceivedInvitation } from '../../../model/types';
import { FamilyRepository } from '../data/family-repository';
import { FamilyPage } from './family-page';

const OLD_FAMILY: IFamily = { id: 'old', name: 'Old', members: [] };
const NEW_FAMILY: IFamily = { id: 'new', name: 'Smiths', members: [] };
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

  async function render(currentFamily: IFamily | null, received: IReceivedInvitation[] | null) {
    accepted = [];
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
});
