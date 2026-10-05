import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { IAccount, ICategory, Transaction } from '../../../model/types';
import { TransactionRepository } from './transaction-repository';

// TODO - this is temp solution. These account/category literals intentionally
// duplicate the seed data in MockAccountRepository/MockCategoryRepository (same
// ids) since this mock has no backend to join through yet. Once the real API
// returns transactions with resolved relations, this duplication goes away.
const card: IAccount = {
  id: 1,
  name: 'Card',
  balance: 100,
  currency: 'UAH',
  icon: 'assets/icons/card.svg',
  color: 'green',
  visibility: 'private',
};

const cash: IAccount = {
  id: 2,
  name: 'Cash',
  balance: 500,
  currency: 'UAH',
  icon: 'assets/icons/cash.svg',
  color: 'blue',
  visibility: 'shared',
};

const salary: ICategory = {
  id: 1,
  type: 'income',
  name: 'Salary',
  icon: 'assets/wallet.svg',
  color: 'green',
  visibility: 'shared',
};

const groceries: ICategory = {
  id: 3,
  type: 'expense',
  name: 'Groceries',
  icon: 'assets/food.svg',
  color: 'red',
  visibility: 'shared',
};

const entertainment: ICategory = {
  id: 4,
  type: 'expense',
  name: 'Entertainment',
  icon: 'assets/card.svg',
  color: 'yellow',
  visibility: 'private',
};

@Injectable()
export class MockTransactionRepository extends TransactionRepository {
  private transactions: Transaction[] = [
    { id: 1, amount: 2000, date: new Date('2026-10-01'), account: cash, category: salary },
    { id: 2, amount: 50, date: new Date('2026-10-02'), account: card, category: groceries },
    { id: 3, amount: 100, date: new Date('2026-10-03'), fromAccount: card, toAccount: cash },
    { id: 4, amount: 70, date: new Date('2026-10-04'), account: card, category: entertainment },
  ];

  getTransactions(): Observable<Transaction[]> {
    return of(this.transactions).pipe(delay(1000));
  }

  createTransaction(transaction: Omit<Transaction, 'id'>): Observable<Transaction> {
    const newTransaction = { ...transaction, id: Date.now() } as Transaction;
    this.transactions.push(newTransaction);
    return of(newTransaction).pipe(delay(1000));
  }

  deleteTransaction(id: number): Observable<boolean> {
    this.transactions = this.transactions.filter((t) => t.id !== id);
    return of(true).pipe(delay(1000));
  }
}
