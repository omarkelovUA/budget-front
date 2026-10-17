import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { applyEach, form, FormField, min, required } from '@angular/forms/signals';
import { TranslocoDirective } from '@jsverse/transloco';
import { TranslocoCurrencyPipe } from '@jsverse/transloco-locale';
import { PaymentTransaction } from '../../../model/types';
import { SplitPart, TransactionRepository } from '../data/transaction-repository';
import { CategoryRepository } from '../../categories/data/category-repository';
import { TransactionFormArt } from '../../../shared/ui/illustrations/transaction-form-art';

const MAX_PARTS = 50;

// Amounts are compared in hundredths, so 0.1 + 0.2 adds up to 0.3.
const cents = (amount: number) => Math.round(amount * 100);

@Component({
  selector: 'app-transaction-split',
  imports: [FormField, TranslocoDirective, TranslocoCurrencyPipe, TransactionFormArt],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './transaction-split.html',
  styleUrl: './transaction-split.css',
})
export class TransactionSplit {
  private readonly transactionRepository = inject(TransactionRepository);
  private readonly categoryRepository = inject(CategoryRepository);

  readonly transaction = input.required<PaymentTransaction>();
  readonly saved = output();
  readonly cancelled = output();

  protected readonly maxParts = MAX_PARTS;
  protected readonly categoriesResource = rxResource({
    stream: () => this.categoryRepository.getCategories(),
  });
  // A part keeps the payment's direction, so only categories of its type are offered.
  protected readonly categories = computed(() =>
    (this.categoriesResource.value() ?? []).filter((c) => c.type === this.transaction().category.type),
  );

  // Starts with the whole amount in the payment's category and an empty second part.
  private readonly model = linkedSignal<{ parts: SplitPart[] }>(() => {
    const { category, amount } = this.transaction();
    return {
      parts: [
        { categoryId: category.unknown ? '' : category.id, amount },
        { categoryId: '', amount: 0 },
      ],
    };
  });
  protected readonly form = form(this.model, (f) => {
    applyEach(f.parts, (part) => {
      required(part.categoryId);
      min(part.amount, 0.01);
    });
  });
  protected readonly partCount = computed(() => this.model().parts.length);
  protected readonly remaining = computed(
    () =>
      (cents(this.transaction().amount) -
        this.model().parts.reduce((sum, part) => sum + cents(part.amount), 0)) /
      100,
  );
  protected readonly canSave = computed(() => this.form().valid() && this.remaining() === 0);
  protected readonly errorMessage = signal<string | null>(null);

  addPart() {
    this.model.update(({ parts }) => ({
      parts: [...parts, { categoryId: '', amount: Math.max(this.remaining(), 0) }],
    }));
  }

  removePart(index: number) {
    this.model.update(({ parts }) => ({ parts: parts.filter((_, i) => i !== index) }));
  }

  submit() {
    if (!this.canSave()) return;
    this.errorMessage.set(null);
    this.transactionRepository.splitTransaction(this.transaction().id, this.model().parts).subscribe({
      next: () => this.saved.emit(),
      error: (err: Error) => this.errorMessage.set(err.message),
    });
  }
}
