import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE } from '../../../core/config/api';
import { withUserErrors } from '../../../core/http/problem';
import { IAccountRef, ICategory, IMonthSummary, isTransferTransaction, Transaction } from '../../../model/types';
import { TransactionPage, TransactionRepository } from './transaction-repository';

// The backend omits the unused pair (account/category vs. fromAccount/toAccount),
// so isTransferTransaction() keeps working on the parsed JSON.
interface TransactionDto {
  id: string;
  kind: 'payment' | 'transfer';
  amount: number;
  date: string;
  note?: string;
  account?: IAccountRef;
  category?: ICategory;
  fromAccount?: IAccountRef;
  toAccount?: IAccountRef;
}

interface Page<T> {
  content: T[];
  page: number;
  totalPages: number;
}

const TRANSACTIONS = `${API_BASE}/transactions`;

const PAGE_SIZE = 50;

function toTransaction({ kind, ...dto }: TransactionDto): Transaction {
  return { ...dto, date: new Date(dto.date) } as Transaction;
}

// <input type="date"> gives local dates; send the calendar day, not a UTC instant.
function toIsoDate(date: Date | string): string {
  if (typeof date === 'string') return date;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

@Injectable()
export class HttpTransactionRepository extends TransactionRepository {
  private readonly http = inject(HttpClient);

  getTransactions(page: number): Observable<TransactionPage> {
    return this.http
      .get<Page<TransactionDto>>(TRANSACTIONS, { params: { page, size: PAGE_SIZE } })
      .pipe(
        map((result) => ({
          items: result.content.map(toTransaction),
          hasMore: result.page + 1 < result.totalPages,
        })),
        withUserErrors(),
      );
  }

  getMonthSummary(period: string): Observable<IMonthSummary[]> {
    return this.http
      .get<IMonthSummary[]>(`${TRANSACTIONS}/summary`, { params: { period } })
      .pipe(withUserErrors());
  }

  createTransaction(transaction: Omit<Transaction, 'id'>): Observable<Transaction> {
    const common = {
      amount: transaction.amount,
      date: toIsoDate(transaction.date),
      note: transaction.note,
    };
    const body = isTransferTransaction(transaction as Transaction)
      ? {
          ...common,
          kind: 'transfer',
          fromAccountId: transaction.fromAccount!.id,
          toAccountId: transaction.toAccount!.id,
        }
      : {
          ...common,
          kind: 'payment',
          accountId: transaction.account!.id,
          categoryId: transaction.category!.id,
        };
    return this.http.post<TransactionDto>(TRANSACTIONS, body).pipe(map(toTransaction), withUserErrors());
  }

  deleteTransaction(id: string): Observable<boolean> {
    return this.http.delete(`${TRANSACTIONS}/${id}`).pipe(
      map(() => true),
      withUserErrors(),
    );
  }
}
