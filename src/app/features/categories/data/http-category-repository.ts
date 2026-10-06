import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE } from '../../../core/config/api';
import { withUserErrors } from '../../../core/http/problem';
import { ICategory } from '../../../model/types';
import { CategoryRepository } from './category-repository';

const CATEGORIES = `${API_BASE}/categories`;

@Injectable()
export class HttpCategoryRepository extends CategoryRepository {
  private readonly http = inject(HttpClient);

  getCategories(): Observable<ICategory[]> {
    return this.http.get<ICategory[]>(CATEGORIES).pipe(withUserErrors());
  }

  createCategory(category: Omit<ICategory, 'id'>): Observable<ICategory> {
    return this.http.post<ICategory>(CATEGORIES, category).pipe(withUserErrors());
  }

  updateCategory({ id, ...category }: ICategory): Observable<ICategory> {
    return this.http.put<ICategory>(`${CATEGORIES}/${id}`, category).pipe(withUserErrors());
  }

  deleteCategory(id: string): Observable<boolean> {
    return this.http.delete(`${CATEGORIES}/${id}`).pipe(
      map(() => true),
      withUserErrors(),
    );
  }
}
