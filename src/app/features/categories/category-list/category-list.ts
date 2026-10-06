import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ICategory } from '../../../model/types';
import { CategoryRepository } from '../data/category-repository';
import { CategoryForm } from '../category-form/category-form';
import { VisibilityBadge } from '../../../shared/ui/visibility-badge/visibility-badge';

@Component({
  selector: 'app-category-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CategoryForm, VisibilityBadge],
  templateUrl: './category-list.html',
  styleUrl: './category-list.css',
})
export class CategoryList {
  private readonly categoryRepository = inject(CategoryRepository);
  protected readonly selectedCategory = signal<ICategory | null>(null);
  protected readonly isFormOpen = signal(false);
  protected readonly actionError = signal<string | null>(null);

  protected readonly categoriesResource = rxResource<ICategory[], undefined>({
    stream: () => this.categoryRepository.getCategories(),
  });

  selectCategory(category: ICategory) {
    this.selectedCategory.set(category);
    this.isFormOpen.set(true);
  }

  openCreateForm() {
    this.selectedCategory.set(null);
    this.isFormOpen.set(true);
  }

  deleteCategory(category: ICategory) {
    this.actionError.set(null);
    this.categoryRepository.deleteCategory(category.id).subscribe({
      next: () => this.categoriesResource.reload(),
      error: (err: Error) => this.actionError.set(err.message),
    });
  }

  onEdited() {
    this.isFormOpen.set(false);
    this.selectedCategory.set(null);
    this.categoriesResource.reload();
  }
}
