import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, min, required } from '@angular/forms/signals';
import { IBudget } from '../../../model/types';
import { BudgetRepository } from '../data/budget-repository';
import { CategoryRepository } from '../../categories/data/category-repository';

interface BudgetFormModel {
  categoryId: string;
  period: string;
  plannedAmount: number;
  visibility: IBudget['visibility'];
}

const DEFAULT_MODEL: BudgetFormModel = {
  categoryId: '',
  period: new Date().toISOString().slice(0, 7),
  plannedAmount: 0,
  visibility: 'private',
};

@Component({
  selector: 'app-budget-form',
  imports: [FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './budget-form.html',
  styleUrl: './budget-form.css',
})
export class BudgetForm {
  private readonly budgetRepository = inject(BudgetRepository);
  private readonly categoryRepository = inject(CategoryRepository);

  protected readonly visibilities: IBudget['visibility'][] = ['private', 'shared'];

  protected readonly expenseCategoriesResource = rxResource({
    stream: () => this.categoryRepository.getCategories(),
  });

  private readonly model = signal<BudgetFormModel>({ ...DEFAULT_MODEL });
  protected readonly form = form(this.model, (f) => {
    required(f.categoryId);
    min(f.plannedAmount, 0.01);
  });

  readonly created = output();

  submit() {
    if (!this.form().valid()) return;

    const value = this.form().value();
    const categories = this.expenseCategoriesResource.value() ?? [];
    const category = categories.find((c) => c.id === value.categoryId);
    if (!category) return;

    this.budgetRepository
      .createBudget({
        category,
        period: value.period,
        plannedAmount: value.plannedAmount,
        visibility: value.visibility,
      })
      .subscribe({
        next: () => this.created.emit(),
        error: (err) => console.error('Save failed:', err),
      });
  }
}
