import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE } from '../../../core/config/api';
import { withUserErrors } from '../../../core/http/problem';
import { AccountInput, IAccount } from '../../../model/types';
import { AccountRepository } from './account-repository';

const ACCOUNTS = `${API_BASE}/accounts`;

@Injectable()
export class HttpAccountRepository extends AccountRepository {
  private readonly http = inject(HttpClient);

  getAccounts(): Observable<IAccount[]> {
    return this.http.get<IAccount[]>(ACCOUNTS).pipe(withUserErrors());
  }

  createAccount(account: AccountInput): Observable<IAccount> {
    return this.http.post<IAccount>(ACCOUNTS, account).pipe(withUserErrors());
  }

  updateAccount(id: string, account: AccountInput): Observable<IAccount> {
    return this.http.put<IAccount>(`${ACCOUNTS}/${id}`, account).pipe(withUserErrors());
  }

  deleteAccount(id: string): Observable<boolean> {
    return this.http.delete(`${ACCOUNTS}/${id}`).pipe(
      map(() => true),
      withUserErrors(),
    );
  }

  reorderAccounts(ids: string[]): Observable<void> {
    return this.http.put<null>(`${ACCOUNTS}/order`, { ids }).pipe(
      map(() => undefined),
      withUserErrors(),
    );
  }

  closeAccount(id: string, targetAccountId: string | null): Observable<IAccount> {
    return this.http.post<IAccount>(`${ACCOUNTS}/${id}/close`, { targetAccountId }).pipe(withUserErrors());
  }
}
