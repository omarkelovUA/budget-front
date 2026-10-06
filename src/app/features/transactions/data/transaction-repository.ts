import { Observable } from 'rxjs';
import { Transaction } from '../../../model/types';

// One page of the newest-first transaction list.
export interface TransactionPage {
  items: Transaction[];
  hasMore: boolean;
}

export abstract class TransactionRepository {
  abstract getTransactions(page: number): Observable<TransactionPage>;

  abstract createTransaction(transaction: Omit<Transaction, 'id'>): Observable<Transaction>;

  abstract deleteTransaction(id: string): Observable<boolean>;
}
