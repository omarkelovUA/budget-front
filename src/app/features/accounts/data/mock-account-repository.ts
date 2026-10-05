import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { IAccount } from '../../../model/types';
import { AccountRepository } from './account-repository';

@Injectable()
export class MockAccountRepository extends AccountRepository {
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
