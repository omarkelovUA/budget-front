import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE } from '../../../core/config/api';
import { withUserErrors } from '../../../core/http/problem';
import { IBudget } from '../../../model/types';
import { BudgetRepository } from './budget-repository';

const BUDGETS = `${API_BASE}/budgets`;

// The backend takes the category by id and computes factAmount itself.
function toRequest(budget: Omit<IBudget, 'id' | 'factAmount'>) {
  return {
    categoryId: budget.category.id,
    period: budget.period,
    plannedAmount: budget.plannedAmount,
    visibility: budget.visibility,
  };
}

@Injectable()
export class HttpBudgetRepository extends BudgetRepository {
  private readonly http = inject(HttpClient);

  getBudgets(): Observable<IBudget[]> {
    return this.http.get<IBudget[]>(BUDGETS).pipe(withUserErrors());
  }

  createBudget(budget: Omit<IBudget, 'id' | 'factAmount'>): Observable<IBudget> {
    return this.http.post<IBudget>(BUDGETS, toRequest(budget)).pipe(withUserErrors());
  }

  updateBudget(budget: IBudget): Observable<IBudget> {
    return this.http.put<IBudget>(`${BUDGETS}/${budget.id}`, toRequest(budget)).pipe(withUserErrors());
  }

  deleteBudget(id: string): Observable<boolean> {
    return this.http.delete(`${BUDGETS}/${id}`).pipe(
      map(() => true),
      withUserErrors(),
    );
  }
}
