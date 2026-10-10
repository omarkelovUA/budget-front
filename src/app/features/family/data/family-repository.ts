import { Observable } from 'rxjs';
import { IFamily, IIncomingJoinRequest, IInvitation, IJoinRequest, IReceivedInvitation } from '../../../model/types';

// Always the caller's own family: every user belongs to exactly one (v1), their own from
// sign-up on.
export abstract class FamilyRepository {
  abstract getCurrentFamily(): Observable<IFamily>;

  // Admin only.
  abstract renameFamily(name: string): Observable<IFamily>;

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

  // Only with others in the family. Returns the user's new family of their own.
  abstract leaveFamily(): Observable<IFamily>;

  // Admin only. The member gets a new family of their own.
  abstract removeMember(userId: string): Observable<void>;

  // Only while alone in the family, with a verified email: asks to join the family of the
  // person with this email. Its admins answer.
  abstract requestToJoin(email: string): Observable<IJoinRequest>;

  // The user's open request, or null.
  abstract getOwnJoinRequest(): Observable<IJoinRequest | null>;

  abstract cancelJoinRequest(): Observable<void>;

  // Admin only: open requests to join the user's family.
  abstract getIncomingJoinRequests(): Observable<IIncomingJoinRequest[]>;

  // Admin only. Moves the requester in; returns the family with them.
  abstract approveJoinRequest(id: string): Observable<IFamily>;

  abstract declineJoinRequest(id: string): Observable<void>;
}
