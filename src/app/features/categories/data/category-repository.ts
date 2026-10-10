import { Observable } from 'rxjs';
import { IAddedCategory, ICategory } from '../../../model/types';

export abstract class CategoryRepository {
  abstract getCategories(): Observable<ICategory[]>;

  abstract createCategory(category: Omit<ICategory, 'id'>): Observable<ICategory>;

  // Family categories: admin only.
  abstract updateCategory(category: ICategory): Observable<ICategory>;

  abstract deleteCategory(id: string): Observable<boolean>;

  // Makes the user's own category a family one; other members' namesakes merge into it.
  abstract shareCategory(id: string): Observable<ICategory>;

  // Admin only: a family category becomes the admin's own. Refused while others use it.
  abstract hideCategory(id: string): Observable<ICategory>;

  // Admin only: family categories other members added since the admin last looked.
  abstract getAddedByMembers(): Observable<IAddedCategory[]>;

  abstract markAddedSeen(): Observable<void>;
}
