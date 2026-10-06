import { Observable } from 'rxjs';
import { ICategory } from '../../../model/types';

export abstract class CategoryRepository {
  abstract getCategories(): Observable<ICategory[]>;

  abstract createCategory(category: Omit<ICategory, 'id'>): Observable<ICategory>;

  abstract updateCategory(category: ICategory): Observable<ICategory>;

  abstract deleteCategory(id: string): Observable<boolean>;
}
