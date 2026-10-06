import { Observable } from 'rxjs';
import { IFamily, IUser } from '../../../model/types';

export abstract class FamilyRepository {
  abstract getFamily(id: number): Observable<IFamily>;

  abstract createFamily(name: string, creator: IUser): Observable<IFamily>;

  abstract inviteMember(familyId: number, email: string): Observable<IFamily>;
}
