import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { ICategory } from '../../../model/types';
import { CategoryRepository } from './category-repository';

@Injectable()
export class MockCategoryRepository extends CategoryRepository {
  //TODO - this is temp solution
  private categories: ICategory[] = [
    {
      id: 1,
      type: 'income',
      name: 'Salary',
      icon: 'assets/wallet.svg',
      color: 'green',
      visibility: 'shared',
    },
    {
      id: 2,
      type: 'income',
      name: 'Freelance',
      icon: 'assets/wallet.svg',
      color: 'blue',
      visibility: 'private',
    },
    {
      id: 3,
      type: 'expense',
      name: 'Groceries',
      icon: 'assets/food.svg',
      color: 'red',
      visibility: 'shared',
    },
    {
      id: 4,
      type: 'expense',
      name: 'Entertainment',
      icon: 'assets/card.svg',
      color: 'yellow',
      visibility: 'private',
    },
  ];

  getCategories(): Observable<ICategory[]> {
    return of(this.categories).pipe(delay(1000));
  }

  createCategory(category: Omit<ICategory, 'id'>): Observable<ICategory> {
    const newCategory = { ...category, id: Date.now() };
    this.categories.push(newCategory);
    return of(newCategory).pipe(delay(1000));
  }

  updateCategory(updatedCategory: ICategory): Observable<ICategory> {
    const index = this.categories.findIndex((c) => c.id === updatedCategory.id);
    if (index !== -1) {
      this.categories[index] = updatedCategory;
    }
    return of(updatedCategory).pipe(delay(1000));
  }

  deleteCategory(id: number): Observable<boolean> {
    this.categories = this.categories.filter((c) => c.id !== id);
    return of(true).pipe(delay(1000));
  }
}
