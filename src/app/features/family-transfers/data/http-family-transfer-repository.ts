import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE } from '../../../core/config/api';
import { withUserErrors } from '../../../core/http/problem';
import { IFamilyTransfers } from '../../../model/types';
import { FamilyTransferRepository } from './family-transfer-repository';

const FAMILY_TRANSFERS = `${API_BASE}/family-transfers`;

@Injectable()
export class HttpFamilyTransferRepository extends FamilyTransferRepository {
  private readonly http = inject(HttpClient);

  getInTransit(): Observable<IFamilyTransfers> {
    return this.http.get<IFamilyTransfers>(FAMILY_TRANSFERS).pipe(withUserErrors());
  }

  send(fromAccountId: string, recipientId: string, amount: number): Observable<void> {
    return this.http.post(FAMILY_TRANSFERS, { fromAccountId, recipientId, amount }).pipe(
      map(() => undefined),
      withUserErrors(),
    );
  }

  collect(transferId: string, toAccountId: string, amount: number | null): Observable<void> {
    return this.withdraw(`${FAMILY_TRANSFERS}/${transferId}/collect`, toAccountId, amount);
  }

  takeBack(transferId: string, toAccountId: string, amount: number | null): Observable<void> {
    return this.withdraw(`${FAMILY_TRANSFERS}/${transferId}/take-back`, toAccountId, amount);
  }

  private withdraw(url: string, toAccountId: string, amount: number | null): Observable<void> {
    return this.http.post(url, { toAccountId, amount }).pipe(
      map(() => undefined),
      withUserErrors(),
    );
  }
}
