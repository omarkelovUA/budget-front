import { Observable } from 'rxjs';
import { IAccount } from '../../../model/types';

export abstract class AccountRepository {
  abstract getAccounts(): Observable<IAccount[]>;

  abstract createAccount(account: Omit<IAccount, 'id'>): Observable<IAccount>;

  abstract updateAccount(account: IAccount): Observable<IAccount>;

  abstract deleteAccount(id: number): Observable<boolean>;
}
