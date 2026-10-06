import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { getTransactionVisibility, isTransferTransaction, Transaction } from '../../../model/types';
import { TransactionRepository } from '../data/transaction-repository';
import { TransactionForm } from '../transaction-form/transaction-form';
import { VisibilityBadge } from '../../../shared/ui/visibility-badge/visibility-badge';

@Component({
  selector: 'app-transaction-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TransactionForm, VisibilityBadge, DatePipe],
  templateUrl: './transaction-list.html',
  styleUrl: './transaction-list.css',
})
export class TransactionList {
  private readonly transactionRepository = inject(TransactionRepository);
  protected readonly isFormOpen = signal(false);
  protected readonly isTransfer = isTransferTransaction;
  protected readonly visibilityOf = getTransactionVisibility;

  // Pages are appended as the user asks for more; the backend already sorts newest first.
  protected readonly transactions = signal<Transaction[]>([]);
  protected readonly hasMore = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly loadError = signal(false);
  protected readonly actionError = signal<string | null>(null);
  private nextPage = 0;
  private request?: Subscription;

  constructor() {
    this.reload();
  }

  loadMore() {
    this.isLoading.set(true);
    this.loadError.set(false);
    this.request = this.transactionRepository.getTransactions(this.nextPage).subscribe({
      next: (page) => {
        this.transactions.update((loaded) => (this.nextPage === 0 ? page.items : [...loaded, ...page.items]));
        this.hasMore.set(page.hasMore);
        this.nextPage++;
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.loadError.set(true);
      },
    });
  }

  openCreateForm() {
    this.isFormOpen.set(true);
  }

  deleteTransaction(transaction: Transaction) {
    this.actionError.set(null);
    this.transactionRepository.deleteTransaction(transaction.id).subscribe({
      next: () => this.reload(),
      error: (err: Error) => this.actionError.set(err.message),
    });
  }

  onCreated() {
    this.isFormOpen.set(false);
    this.reload();
  }

  // Drops any page still in flight, so a late response can't land after the reset.
  private reload() {
    this.request?.unsubscribe();
    this.nextPage = 0;
    this.loadMore();
  }
}
