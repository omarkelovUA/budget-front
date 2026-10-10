import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { ICategory } from '../../../model/types';
import { CategoryRepository } from '../data/category-repository';
import { FamilyRepository } from '../../family/data/family-repository';
import { AuthState } from '../../../core/auth/auth-state';
import { Observable } from 'rxjs';
import { CategoryForm } from '../category-form/category-form';
import { VisibilityBadge } from '../../../shared/ui/visibility-badge/visibility-badge';
import { TranslocoDirective } from '@jsverse/transloco';
import { Icon } from '../../../shared/ui/icon/icon';
import { Modal } from '../../../shared/ui/modal/modal';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { CategoriesArt } from '../../../shared/ui/illustrations/categories-art';
import { EmptyArt } from '../../../shared/ui/illustrations/empty-art';

@Component({
  selector: 'app-category-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, CategoryForm, Modal, NgTemplateOutlet, VisibilityBadge, TranslocoDirective, PageHeader, CategoriesArt, EmptyArt],
  templateUrl: './category-list.html',
  styleUrl: './category-list.css',
})
// Family categories are the family's: every member uses them, only the admin changes,
// hides or deletes them. Anyone can share their own category with the family.
export class CategoryList {
  private readonly categoryRepository = inject(CategoryRepository);
  private readonly familyRepository = inject(FamilyRepository);
  private readonly currentUser = inject(AuthState).currentUser;
  protected readonly selectedCategory = signal<ICategory | null>(null);
  protected readonly isFormOpen = signal(false);
  protected readonly actionError = signal<string | null>(null);

  protected readonly categoriesResource = rxResource<ICategory[], undefined>({
    stream: () => this.categoryRepository.getCategories(),
  });

  private readonly familyResource = rxResource({
    params: () => this.currentUser()?.familyId ?? undefined,
    stream: () => this.familyRepository.getCurrentFamily(),
  });

  protected readonly isAdmin = computed(() => {
    const userId = this.currentUser()?.id;
    return this.familyResource.value()?.members.some((m) => m.user.id === userId && m.role === 'admin') ?? false;
  });

  canManage(category: ICategory): boolean {
    return category.visibility === 'private' || this.isAdmin();
  }

  selectCategory(category: ICategory) {
    this.selectedCategory.set(category);
    this.isFormOpen.set(true);
  }

  openCreateForm() {
    this.selectedCategory.set(null);
    this.isFormOpen.set(true);
  }

  deleteCategory(category: ICategory) {
    this.run(this.categoryRepository.deleteCategory(category.id));
  }

  shareCategory(category: ICategory) {
    this.run(this.categoryRepository.shareCategory(category.id));
  }

  hideCategory(category: ICategory) {
    this.run(this.categoryRepository.hideCategory(category.id));
  }

  closeForm() {
    this.isFormOpen.set(false);
    this.selectedCategory.set(null);
  }

  onEdited() {
    this.closeForm();
    this.categoriesResource.reload();
  }

  private run(request$: Observable<unknown>) {
    this.actionError.set(null);
    request$.subscribe({
      next: () => this.categoriesResource.reload(),
      error: (err: Error) => this.actionError.set(err.message),
    });
  }
}
