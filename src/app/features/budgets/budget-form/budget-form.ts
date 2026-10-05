import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IBudget } from '../../../model/types';
import { BudgetRepository } from '../data/budget-repository';
import { CategoryRepository } from '../../categories/data/category-repository';

@Component({
  selector: 'app-budget-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './budget-form.html',
  styleUrl: './budget-form.css',
})
export class BudgetForm {
  private readonly fb = inject(FormBuilder);
  private readonly budgetRepository = inject(BudgetRepository);
  private readonly categoryRepository = inject(CategoryRepository);

  protected readonly visibilities: IBudget['visibility'][] = ['private', 'shared'];

  protected readonly expenseCategoriesResource = rxResource({
    stream: () => this.categoryRepository.getCategories(),
  });

  protected readonly form = this.fb.group({
    categoryId: [null as number | null, Validators.required],
    period: [new Date().toISOString().slice(0, 7), Validators.required],
    plannedAmount: [0, [Validators.required, Validators.min(0.01)]],
    visibility: ['private' as IBudget['visibility'], Validators.required],
  });

  readonly created = output();

  submit() {
    if (this.form.invalid) return;

    const categories = this.expenseCategoriesResource.value() ?? [];
    const category = categories.find((c) => c.id === this.form.value.categoryId);
    if (!category) return;

    this.budgetRepository
      .createBudget({
        category,
        period: this.form.value.period!,
        plannedAmount: this.form.value.plannedAmount!,
        visibility: this.form.value.visibility!,
      })
      .subscribe({
        next: () => this.created.emit(),
        error: (err) => console.error('Save failed:', err),
      });
  }
}
