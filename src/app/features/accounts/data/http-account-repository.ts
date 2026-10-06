import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE } from '../../../core/config/api';
import { withUserErrors } from '../../../core/http/problem';
import { IAccount } from '../../../model/types';
import { AccountRepository } from './account-repository';

const ACCOUNTS = `${API_BASE}/accounts`;

@Injectable()
export class HttpAccountRepository extends AccountRepository {
  private readonly http = inject(HttpClient);

  getAccounts(): Observable<IAccount[]> {
    return this.http.get<IAccount[]>(ACCOUNTS).pipe(withUserErrors());
  }

  createAccount(account: Omit<IAccount, 'id'>): Observable<IAccount> {
    return this.http.post<IAccount>(ACCOUNTS, account).pipe(withUserErrors());
  }

  updateAccount({ id, ...account }: IAccount): Observable<IAccount> {
    return this.http.put<IAccount>(`${ACCOUNTS}/${id}`, account).pipe(withUserErrors());
  }

  deleteAccount(id: string): Observable<boolean> {
    return this.http.delete(`${ACCOUNTS}/${id}`).pipe(
      map(() => true),
      withUserErrors(),
    );
  }
}
