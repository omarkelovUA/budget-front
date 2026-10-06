import { Observable } from 'rxjs';
import { IBudget } from '../../../model/types';

export abstract class BudgetRepository {
  abstract getBudgets(): Observable<IBudget[]>;

  abstract createBudget(budget: Omit<IBudget, 'id' | 'factAmount'>): Observable<IBudget>;

  abstract updateBudget(budget: IBudget): Observable<IBudget>;

  abstract deleteBudget(id: string): Observable<boolean>;
}
