import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { API_BASE } from '../../../core/config/api';
import { problemType, withUserErrors } from '../../../core/http/problem';
import {
  FamilyRole,
  IFamily,
  IIncomingJoinRequest,
  IInvitation,
  IJoinRequest,
  IReceivedInvitation,
} from '../../../model/types';
import { FamilyRepository } from './family-repository';

interface FamilyDto {
  id: string;
  name: string;
  categoriesReviewed: boolean;
  members: {
    userId: string;
    email: string;
    displayName: string;
    role: FamilyRole;
    joinedAt: string;
  }[];
}

interface InvitationDto {
  id: string;
  email: string;
  createdAt: string;
  expiresAt: string;
}

interface ReceivedInvitationDto {
  id: string;
  familyId: string;
  familyName: string;
  invitedBy: string;
  memberCount: number;
  expiresAt: string;
}

interface JoinRequestDto {
  id: string;
  email: string;
  familyName: string;
  createdAt: string;
  expiresAt: string;
}

interface IncomingJoinRequestDto {
  id: string;
  requesterId: string;
  displayName: string;
  email: string;
  createdAt: string;
  expiresAt: string;
}

const FAMILY = `${API_BASE}/families/current`;
const FAMILY_INVITATIONS = `${FAMILY}/invitations`;
const FAMILY_JOIN_REQUESTS = `${FAMILY}/join-requests`;
const INVITATIONS = `${API_BASE}/invitations`;
const OWN_JOIN_REQUEST = `${API_BASE}/join-requests/mine`;

function toFamily(dto: FamilyDto): IFamily {
  return {
    id: dto.id,
    name: dto.name,
    categoriesReviewed: dto.categoriesReviewed,
    members: dto.members.map((m) => ({
      user: { id: m.userId, email: m.email, displayName: m.displayName, familyId: dto.id },
      role: m.role,
      joinedAt: new Date(m.joinedAt),
    })),
  };
}

function toInvitation(dto: InvitationDto): IInvitation {
  return withDates(dto);
}

function withDates<T extends { createdAt: string; expiresAt: string }>(
  dto: T,
): Omit<T, 'createdAt' | 'expiresAt'> & { createdAt: Date; expiresAt: Date } {
  return { ...dto, createdAt: new Date(dto.createdAt), expiresAt: new Date(dto.expiresAt) };
}

function toReceivedInvitation(dto: ReceivedInvitationDto): IReceivedInvitation {
  return { ...dto, expiresAt: new Date(dto.expiresAt) };
}

@Injectable()
export class HttpFamilyRepository extends FamilyRepository {
  private readonly http = inject(HttpClient);

  getCurrentFamily(): Observable<IFamily> {
    return this.http.get<FamilyDto>(FAMILY).pipe(map(toFamily), withUserErrors());
  }

  markCategoriesReviewed(): Observable<void> {
    return this.http.post<null>(`${FAMILY}/categories-reviewed`, null).pipe(
      map(() => undefined),
      withUserErrors(),
    );
  }

  renameFamily(name: string): Observable<IFamily> {
    return this.http.patch<FamilyDto>(FAMILY, { name }).pipe(map(toFamily), withUserErrors());
  }

  invite(email: string): Observable<IInvitation> {
    return this.http.post<InvitationDto>(FAMILY_INVITATIONS, { email }).pipe(map(toInvitation), withUserErrors());
  }

  getInvitations(): Observable<IInvitation[]> {
    return this.http
      .get<InvitationDto[]>(FAMILY_INVITATIONS)
      .pipe(map((dtos) => dtos.map(toInvitation)), withUserErrors());
  }

  revokeInvitation(id: string): Observable<void> {
    return this.http.delete<null>(`${FAMILY_INVITATIONS}/${id}`).pipe(
      map(() => undefined),
      withUserErrors(),
    );
  }

  getReceivedInvitations(): Observable<IReceivedInvitation[] | null> {
    return this.http.get<ReceivedInvitationDto[]>(INVITATIONS).pipe(
      map((dtos): IReceivedInvitation[] | null => dtos.map(toReceivedInvitation)),
      catchError((err) => (problemType(err) === 'email-not-verified' ? of(null) : throwError(() => err))),
      withUserErrors(),
    );
  }

  acceptInvitation(id: string): Observable<IFamily> {
    return this.http.post<FamilyDto>(`${INVITATIONS}/${id}/accept`, null).pipe(map(toFamily), withUserErrors());
  }

  declineInvitation(id: string): Observable<void> {
    return this.http.post<null>(`${INVITATIONS}/${id}/decline`, null).pipe(
      map(() => undefined),
      withUserErrors(),
    );
  }

  leaveFamily(): Observable<IFamily> {
    return this.http.post<FamilyDto>(`${FAMILY}/leave`, null).pipe(map(toFamily), withUserErrors());
  }

  removeMember(userId: string): Observable<void> {
    return this.http.delete<null>(`${FAMILY}/members/${userId}`).pipe(
      map(() => undefined),
      withUserErrors(),
    );
  }

  requestToJoin(email: string): Observable<IJoinRequest> {
    return this.http
      .post<JoinRequestDto>(`${API_BASE}/join-requests`, { email })
      .pipe(map(withDates), withUserErrors());
  }

  // 204 (no body) when there is none.
  getOwnJoinRequest(): Observable<IJoinRequest | null> {
    return this.http
      .get<JoinRequestDto | null>(OWN_JOIN_REQUEST)
      .pipe(map((dto) => (dto ? withDates(dto) : null)), withUserErrors());
  }

  cancelJoinRequest(): Observable<void> {
    return this.http.delete<null>(OWN_JOIN_REQUEST).pipe(
      map(() => undefined),
      withUserErrors(),
    );
  }

  getIncomingJoinRequests(): Observable<IIncomingJoinRequest[]> {
    return this.http
      .get<IncomingJoinRequestDto[]>(FAMILY_JOIN_REQUESTS)
      .pipe(map((dtos) => dtos.map(withDates)), withUserErrors());
  }

  approveJoinRequest(id: string): Observable<IFamily> {
    return this.http
      .post<FamilyDto>(`${FAMILY_JOIN_REQUESTS}/${id}/approve`, null)
      .pipe(map(toFamily), withUserErrors());
  }

  declineJoinRequest(id: string): Observable<void> {
    return this.http.post<null>(`${FAMILY_JOIN_REQUESTS}/${id}/decline`, null).pipe(
      map(() => undefined),
      withUserErrors(),
    );
  }
}
