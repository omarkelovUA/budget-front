import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { API_BASE } from '../../../core/config/api';
import { withUserErrors } from '../../../core/http/problem';
import { FamilyRole, IFamily, IInvite } from '../../../model/types';
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

const FAMILIES = `${API_BASE}/families`;

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

  createInvite(): Observable<IInvite> {
    return this.http.post<{ code: string; expiresAt: string }>(`${FAMILIES}/current/invites`, null).pipe(
      map((dto) => ({ code: dto.code, expiresAt: new Date(dto.expiresAt) })),
      withUserErrors(),
    );
  }

  leaveFamily(): Observable<void> {
    return this.http.post<null>(`${FAMILIES}/current/leave`, null).pipe(
      map(() => undefined),
      withUserErrors(),
    );
  }

  joinFamily(code: string): Observable<IFamily> {
    return this.http.post<FamilyDto>(`${FAMILIES}/join`, { code }).pipe(map(toFamily), withUserErrors());
  }
}
