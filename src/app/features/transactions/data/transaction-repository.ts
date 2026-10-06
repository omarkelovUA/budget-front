import { Observable } from 'rxjs';
import { Transaction } from '../../../model/types';

export abstract class TransactionRepository {
  abstract getTransactions(): Observable<Transaction[]>;

  abstract createTransaction(transaction: Omit<Transaction, 'id'>): Observable<Transaction>;

  abstract deleteTransaction(id: string): Observable<boolean>;
}
