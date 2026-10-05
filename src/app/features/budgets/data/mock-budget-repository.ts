import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { ICategory, IBudget } from '../../../model/types';
import { BudgetRepository } from './budget-repository';

// TODO - this is temp solution. factAmount is a static seed value here, not
// computed from transactions - the real backend recomputes it from the
// category's transactions for the period (see docs/ARCHITECTURE.md §3.1).
const groceries: ICategory = {
  id: 3,
  type: 'expense',
  name: 'Groceries',
  icon: 'assets/food.svg',
  color: 'red',
  visibility: 'shared',
};

const entertainment: ICategory = {
  id: 4,
  type: 'expense',
  name: 'Entertainment',
  icon: 'assets/card.svg',
  color: 'yellow',
  visibility: 'private',
};

@Injectable()
export class MockBudgetRepository extends BudgetRepository {
  private budgets: IBudget[] = [
    {
      id: 1,
      category: groceries,
      period: '2026-10',
      plannedAmount: 300,
      factAmount: 180,
      visibility: 'shared',
    },
    {
      id: 2,
      category: entertainment,
      period: '2026-10',
      plannedAmount: 50,
      factAmount: 70,
      visibility: 'private',
    },
  ];

  getBudgets(): Observable<IBudget[]> {
    return of(this.budgets).pipe(delay(1000));
  }

  createBudget(budget: Omit<IBudget, 'id' | 'factAmount'>): Observable<IBudget> {
    const newBudget: IBudget = { ...budget, id: Date.now(), factAmount: 0 };
    this.budgets.push(newBudget);
    return of(newBudget).pipe(delay(1000));
  }

  updateBudget(updatedBudget: IBudget): Observable<IBudget> {
    const index = this.budgets.findIndex((b) => b.id === updatedBudget.id);
    if (index !== -1) {
      this.budgets[index] = updatedBudget;
    }
    return of(updatedBudget).pipe(delay(1000));
  }

  deleteBudget(id: number): Observable<boolean> {
    this.budgets = this.budgets.filter((b) => b.id !== id);
    return of(true).pipe(delay(1000));
  }
}
