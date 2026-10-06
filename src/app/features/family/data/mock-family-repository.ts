import { Injectable } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';
import { IFamily, IUser } from '../../../model/types';
import { FamilyRepository } from './family-repository';

@Injectable()
export class MockFamilyRepository extends FamilyRepository {
  //TODO - this is temp solution. The member "user" objects here intentionally
  // duplicate the seed accounts in MockAuthRepository (same ids) - see that
  // file's TODO for why.
  private families: IFamily[] = [
    {
      id: 1,
      name: 'The Demo Family',
      members: [
        {
          user: { id: 1, email: 'demo@family.app', displayName: 'Demo User', familyId: 1 },
          role: 'admin',
          joinedAt: new Date('2026-01-01'),
        },
        {
          user: { id: 3, email: 'olena@family.app', displayName: 'Olena', familyId: 1 },
          role: 'member',
          joinedAt: new Date('2026-02-15'),
        },
      ],
    },
  ];

  getFamily(id: number): Observable<IFamily> {
    const family = this.families.find((f) => f.id === id);
    if (!family) {
      return throwError(() => new Error('Сім\'ю не знайдено')).pipe(delay(1000));
    }
    return of(family).pipe(delay(1000));
  }

  createFamily(name: string, creator: IUser): Observable<IFamily> {
    const familyId = Date.now();
    const newFamily: IFamily = {
      id: familyId,
      name,
      members: [{ user: { ...creator, familyId }, role: 'admin', joinedAt: new Date() }],
    };
    this.families.push(newFamily);
    return of(newFamily).pipe(delay(1000));
  }

  inviteMember(familyId: number, email: string): Observable<IFamily> {
    const family = this.families.find((f) => f.id === familyId);
    if (!family) {
      return throwError(() => new Error('Сім\'ю не знайдено')).pipe(delay(1000));
    }
    const displayName = email.split('@')[0];
    family.members.push({
      user: { id: Date.now(), email, displayName, familyId },
      role: 'member',
      joinedAt: new Date(),
    });
    return of(family).pipe(delay(1000));
  }
}
