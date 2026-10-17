import { Observable } from 'rxjs';
import { IMonthSummary, NewTransaction, Transaction } from '../../../model/types';

// One part of a split: the payment's share in one category.
export interface SplitPart {
  categoryId: string;
  amount: number;
}

// One page of the newest-first transaction list.
export interface TransactionPage {
  items: Transaction[];
  hasMore: boolean;
}

export abstract class TransactionRepository {
  abstract getTransactions(page: number): Observable<TransactionPage>;

  // period is 'YYYY-MM'.
  abstract getMonthSummary(period: string): Observable<IMonthSummary[]>;

  abstract createTransaction(transaction: NewTransaction): Observable<Transaction>;

  abstract deleteTransaction(id: string): Observable<boolean>;

  // Replaces a payment with one payment per part; the parts add up to its amount.
  abstract splitTransaction(id: string, parts: SplitPart[]): Observable<Transaction[]>;
}
