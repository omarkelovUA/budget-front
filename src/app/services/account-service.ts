import { Injectable } from '@angular/core';
import { IAccount } from '../model/types';
import { delay, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  //private http = inject(HttpClient);
  //   private baseUrl = '/api/accounts';
  //
  //   // Повертаємо Observable для використання в resource() або pipe
  //   getAccounts() {
  //     return this.http.get<IAccount[]>(this.baseUrl);
  //   }
  //
  //   getAccountById(id: number) {
  //     return this.http.get<IAccount>(`${this.baseUrl}/${id}`);
  //   }
  //
  //   createAccount(account: Omit<IAccount, 'id'>) {
  //     return this.http.post<IAccount>(this.baseUrl, account);
  //   }

  //TODO - this is temp solution
  private accounts: IAccount[] = [
    {
      id: 1,
      name: 'Card',
      balance: 100,
      currency: 'UAH',
      icon: 'assets/icons/card.svg',
      color: 'green',
    },
    {
      id: 2,
      name: 'Cash',
      balance: 500,
      currency: 'UAH',
      icon: 'assets/icons/cash.svg',
      color: 'blue',
    },
  ];

  getAccounts(): Observable<IAccount[]> {
    return of(this.accounts).pipe(delay(1000));
  }

  createAccount(account: Omit<IAccount, 'id'>): Observable<IAccount> {
    const newAccount = { ...account, id: Date.now() }; // Імітація генерації ID
    this.accounts.push(newAccount);
    return of(newAccount).pipe(delay(1000));
  }

  updateAccount(updatedAccount: IAccount): Observable<IAccount> {
    const index = this.accounts.findIndex((a) => a.id === updatedAccount.id);
    if (index !== -1) {
      this.accounts[index] = updatedAccount;
    }
    return of(updatedAccount).pipe(delay(1000));
  }

  deleteAccount(id: number): Observable<boolean> {
    this.accounts = this.accounts.filter((a) => a.id !== id);
    return of(true).pipe(delay(1000));
  }
}
