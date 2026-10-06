import { Observable } from 'rxjs';
import { IFamily, IInvite } from '../../../model/types';

// Always the caller's own family: a user belongs to at most one (v1).
export abstract class FamilyRepository {
  // null when the user doesn't belong to a family yet.
  abstract getCurrentFamily(): Observable<IFamily | null>;

  abstract createFamily(name: string): Observable<IFamily>;

  // Admin only. The code is shared out of band - there's no email delivery.
  abstract createInvite(): Observable<IInvite>;

  abstract joinFamily(code: string): Observable<IFamily>;

  // The last admin must promote someone first; the last member leaving deletes the family.
  abstract leaveFamily(): Observable<void>;
}
