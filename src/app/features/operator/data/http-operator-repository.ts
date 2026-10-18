import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE } from '../../../core/config/api';
import { withUserErrors } from '../../../core/http/problem';
import { IGrant, IOperatorStats } from '../../../model/types';
import { OperatorRepository } from './operator-repository';

const OPERATOR = `${API_BASE}/operator`;

type GrantDto = Omit<IGrant, 'expiresAt' | 'createdAt'> & {
  expiresAt: string | null;
  createdAt: string;
};

function toGrant(dto: GrantDto): IGrant {
  return {
    ...dto,
    expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    createdAt: new Date(dto.createdAt),
  };
}

@Injectable()
export class HttpOperatorRepository extends OperatorRepository {
  private readonly http = inject(HttpClient);

  isOperator(): Observable<boolean> {
    return this.http
      .get<{ operator: boolean }>(`${API_BASE}/users/me`)
      .pipe(map((me) => me.operator));
  }

  getStats(): Observable<IOperatorStats> {
    return this.http.get<IOperatorStats>(`${OPERATOR}/stats`).pipe(withUserErrors());
  }

  getGrants(): Observable<IGrant[]> {
    return this.http.get<GrantDto[]>(`${OPERATOR}/grants`).pipe(
      map((grants) => grants.map(toGrant)),
      withUserErrors(),
    );
  }

  grant(email: string, expiresAt: Date | null): Observable<IGrant> {
    return this.http
      .post<GrantDto>(`${OPERATOR}/grants`, { email, expiresAt: expiresAt?.toISOString() ?? null })
      .pipe(map(toGrant), withUserErrors());
  }

  revoke(userId: string): Observable<void> {
    return this.http.delete<null>(`${OPERATOR}/grants/${userId}`).pipe(
      map(() => undefined),
      withUserErrors(),
    );
  }
}
