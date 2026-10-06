import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, min } from '@angular/forms/signals';
import { Transaction } from '../../../model/types';
import { TransactionRepository } from '../data/transaction-repository';
import { AccountRepository } from '../../accounts/data/account-repository';
import { CategoryRepository } from '../../categories/data/category-repository';

type Kind = 'payment' | 'transfer';

interface TransactionFormModel {
  kind: Kind;
  amount: number;
  date: Date;
  accountId: string;
  categoryId: string;
  fromAccountId: string;
  toAccountId: string;
}

const DEFAULT_MODEL: TransactionFormModel = {
  kind: 'payment',
  amount: 0,
  date: new Date(),
  accountId: '',
  categoryId: '',
  fromAccountId: '',
  toAccountId: '',
};

@Component({
  selector: 'app-transaction-form',
  imports: [FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './transaction-form.html',
  styleUrl: './transaction-form.css',
})
export class TransactionForm {
  private readonly transactionRepository = inject(TransactionRepository);
  private readonly accountRepository = inject(AccountRepository);
  private readonly categoryRepository = inject(CategoryRepository);

  protected readonly kinds: Kind[] = ['payment', 'transfer'];

  protected readonly accountsResource = rxResource({
    stream: () => this.accountRepository.getAccounts(),
  });
  protected readonly categoriesResource = rxResource({
    stream: () => this.categoryRepository.getCategories(),
  });

  private readonly model = signal<TransactionFormModel>({ ...DEFAULT_MODEL });
  protected readonly form = form(this.model, (f) => {
    min(f.amount, 0.01);
  });

  readonly created = output();

  submit() {
    if (!this.form().valid()) return;

    const value = this.form().value();
    const accounts = this.accountsResource.value() ?? [];
    const categories = this.categoriesResource.value() ?? [];

    let transaction: Omit<Transaction, 'id'>;
    if (value.kind === 'transfer') {
      const fromAccount = accounts.find((a) => a.id === value.fromAccountId);
      const toAccount = accounts.find((a) => a.id === value.toAccountId);
      if (!fromAccount || !toAccount) return;
      transaction = { amount: value.amount, date: value.date, fromAccount, toAccount };
    } else {
      const account = accounts.find((a) => a.id === value.accountId);
      const category = categories.find((c) => c.id === value.categoryId);
      if (!account || !category) return;
      transaction = { amount: value.amount, date: value.date, account, category };
    }

    this.transactionRepository.createTransaction(transaction).subscribe({
      next: () => this.created.emit(),
      error: (err) => console.error('Save failed:', err),
    });
  }
}
