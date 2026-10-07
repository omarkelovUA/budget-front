import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { API_BASE } from '../../../core/config/api';
import { problemType, withUserErrors } from '../../../core/http/problem';
import { FamilyRole, IFamily, IInvitation, IReceivedInvitation } from '../../../model/types';
import { FamilyRepository } from './family-repository';

interface FamilyDto {
  id: string;
  name: string;
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

const FAMILIES = `${API_BASE}/families`;
const FAMILY_INVITATIONS = `${FAMILIES}/current/invitations`;
const INVITATIONS = `${API_BASE}/invitations`;

function toFamily(dto: FamilyDto): IFamily {
  return {
    id: dto.id,
    name: dto.name,
    members: dto.members.map((m) => ({
      user: { id: m.userId, email: m.email, displayName: m.displayName, familyId: dto.id },
      role: m.role,
      joinedAt: new Date(m.joinedAt),
    })),
  };
}

function toInvitation(dto: InvitationDto): IInvitation {
  return { ...dto, createdAt: new Date(dto.createdAt), expiresAt: new Date(dto.expiresAt) };
}

function toReceivedInvitation(dto: ReceivedInvitationDto): IReceivedInvitation {
  return { ...dto, expiresAt: new Date(dto.expiresAt) };
}

@Injectable()
export class HttpFamilyRepository extends FamilyRepository {
  private readonly http = inject(HttpClient);

  getCurrentFamily(): Observable<IFamily | null> {
    return this.http.get<FamilyDto>(`${FAMILIES}/current`).pipe(
      map(toFamily),
      catchError((err) =>
        err instanceof HttpErrorResponse && err.status === 404 ? of(null) : throwError(() => err),
      ),
      withUserErrors(),
    );
  }

  createFamily(name: string): Observable<IFamily> {
    return this.http.post<FamilyDto>(FAMILIES, { name }).pipe(map(toFamily), withUserErrors());
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

  leaveFamily(): Observable<void> {
    return this.http.post<null>(`${FAMILIES}/current/leave`, null).pipe(
      map(() => undefined),
      withUserErrors(),
    );
  }
}
