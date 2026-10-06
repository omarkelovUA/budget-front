import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { IBudget } from '../../../model/types';
import { BudgetRepository } from '../data/budget-repository';
import { BudgetForm } from '../budget-form/budget-form';
import { VisibilityBadge } from '../../../shared/ui/visibility-badge/visibility-badge';

@Component({
  selector: 'app-budget-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BudgetForm, VisibilityBadge],
  templateUrl: './budget-list.html',
  styleUrl: './budget-list.css',
})
export class BudgetList {
  private readonly budgetRepository = inject(BudgetRepository);
  protected readonly isFormOpen = signal(false);
  protected readonly actionError = signal<string | null>(null);

  protected readonly budgetsResource = rxResource<IBudget[], undefined>({
    stream: () => this.budgetRepository.getBudgets(),
  });

  progressPercent(budget: IBudget): number {
    if (budget.plannedAmount <= 0) return budget.factAmount > 0 ? 100 : 0;
    return Math.min(100, Math.round((budget.factAmount / budget.plannedAmount) * 100));
  }

  isOverBudget(budget: IBudget): boolean {
    return budget.factAmount > budget.plannedAmount;
  }

  openCreateForm() {
    this.isFormOpen.set(true);
  }

  deleteBudget(budget: IBudget) {
    this.actionError.set(null);
    this.budgetRepository.deleteBudget(budget.id).subscribe({
      next: () => this.budgetsResource.reload(),
      error: (err: Error) => this.actionError.set(err.message),
    });
  }

  onCreated() {
    this.isFormOpen.set(false);
    this.budgetsResource.reload();
  }
}
