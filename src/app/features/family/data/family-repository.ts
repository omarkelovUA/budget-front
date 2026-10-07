import { Observable } from 'rxjs';
import { IFamily, IInvitation, IReceivedInvitation } from '../../../model/types';

// Always the caller's own family: a user belongs to at most one (v1).
export abstract class FamilyRepository {
  // null when the user doesn't belong to a family yet.
  abstract getCurrentFamily(): Observable<IFamily | null>;

  abstract createFamily(name: string): Observable<IFamily>;

  // Admin only. Invites an email; at most 10 people per family, pending invitations included.
  abstract invite(email: string): Observable<IInvitation>;

  // The family's pending invitations; any member can see them.
  abstract getInvitations(): Observable<IInvitation[]>;

  // Admin only.
  abstract revokeInvitation(id: string): Observable<void>;

  // Invitations addressed to the current user's email. null when that email isn't
  // verified yet (the user never signed in with Google), so invitations can't be used.
  abstract getReceivedInvitations(): Observable<IReceivedInvitation[] | null>;

  // Moves the user into the inviting family, leaving their current one first.
  abstract acceptInvitation(id: string): Observable<IFamily>;

  abstract declineInvitation(id: string): Observable<void>;

  // The last admin must promote someone first; the last member leaving deletes the family.
  abstract leaveFamily(): Observable<void>;
}
