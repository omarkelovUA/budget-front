import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Transaction } from '../../../model/types';
import { TransactionRepository } from '../data/transaction-repository';
import { AccountRepository } from '../../accounts/data/account-repository';
import { CategoryRepository } from '../../categories/data/category-repository';

type Kind = 'payment' | 'transfer';

@Component({
  selector: 'app-transaction-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './transaction-form.html',
  styleUrl: './transaction-form.css',
})
export class TransactionForm {
  private readonly fb = inject(FormBuilder);
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

  protected readonly form = this.fb.group({
    kind: ['payment' as Kind, Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    date: [new Date().toISOString().slice(0, 10), Validators.required],
    accountId: [null as number | null],
    categoryId: [null as number | null],
    fromAccountId: [null as number | null],
    toAccountId: [null as number | null],
  });

  readonly created = output();

  submit() {
    const value = this.form.value;
    if (this.form.invalid) return;

    const accounts = this.accountsResource.value() ?? [];
    const categories = this.categoriesResource.value() ?? [];

    let transaction: Omit<Transaction, 'id'>;
    if (value.kind === 'transfer') {
      const fromAccount = accounts.find((a) => a.id === value.fromAccountId);
      const toAccount = accounts.find((a) => a.id === value.toAccountId);
      if (!fromAccount || !toAccount) return;
      transaction = {
        amount: value.amount!,
        date: new Date(value.date!),
        fromAccount,
        toAccount,
      };
    } else {
      const account = accounts.find((a) => a.id === value.accountId);
      const category = categories.find((c) => c.id === value.categoryId);
      if (!account || !category) return;
      transaction = {
        amount: value.amount!,
        date: new Date(value.date!),
        account,
        category,
      };
    }

    this.transactionRepository.createTransaction(transaction).subscribe({
      next: () => this.created.emit(),
      error: (err) => console.error('Save failed:', err),
    });
  }
}
