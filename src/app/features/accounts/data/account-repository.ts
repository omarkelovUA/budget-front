import { Observable } from 'rxjs';
import { AccountInput, IAccount } from '../../../model/types';

// Everything except reading is for the account's owner only.
export abstract class AccountRepository {
  // Open accounts the user owns or was given access to.
  abstract getAccounts(): Observable<IAccount[]>;

  abstract createAccount(account: AccountInput): Observable<IAccount>;

  abstract updateAccount(id: string, account: AccountInput): Observable<IAccount>;

  // Only accounts without transactions; others have to be closed.
  abstract deleteAccount(id: string): Observable<boolean>;

  // The user's own order of the open accounts they see (whole list, by id).
  abstract reorderAccounts(ids: string[]): Observable<void>;

  // Moves a non-zero balance to targetAccountId (same currency) and archives the account.
  abstract closeAccount(id: string, targetAccountId: string | null): Observable<IAccount>;
}
