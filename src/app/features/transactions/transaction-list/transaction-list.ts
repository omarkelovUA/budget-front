import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
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

  protected readonly transactionsResource = rxResource<Transaction[], undefined>({
    stream: () => this.transactionRepository.getTransactions(),
  });

  protected readonly sortedTransactions = () =>
    [...(this.transactionsResource.value() ?? [])].sort((a, b) => b.date.getTime() - a.date.getTime());

  openCreateForm() {
    this.isFormOpen.set(true);
  }

  deleteTransaction(transaction: Transaction) {
    this.transactionRepository
      .deleteTransaction(transaction.id)
      .subscribe(() => this.transactionsResource.reload());
  }

  onCreated() {
    this.isFormOpen.set(false);
    this.transactionsResource.reload();
  }
}
