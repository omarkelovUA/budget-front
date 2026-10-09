import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { disabled, form, FormField, required } from '@angular/forms/signals';
import { ICategory } from '../../../model/types';
import { CategoryRepository } from '../data/category-repository';
import { TranslocoDirective } from '@jsverse/transloco';
import { IconPicker } from '../../../shared/ui/icon-picker/icon-picker';
import { CATEGORY_ICONS } from '../../../shared/ui/icon-picker/icons';
import { CategoryFormArt } from '../../../shared/ui/illustrations/category-form-art';

type CategoryFormModel = Omit<ICategory, 'id'>;

const DEFAULT_MODEL: CategoryFormModel = {
  name: '',
  type: 'expense',
  icon: 'assets/wallet.svg',
  color: 'green',
  visibility: 'private',
};

@Component({
  selector: 'app-category-form',
  imports: [FormField, TranslocoDirective, IconPicker, CategoryFormArt],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-form.html',
  styleUrl: './category-form.css',
})
export class CategoryForm {
  private readonly categoryRepository = inject(CategoryRepository);

  protected readonly types: ICategory['type'][] = ['income', 'expense'];
  protected readonly icons = CATEGORY_ICONS;
  protected readonly colors = ['green', 'yellow', 'blue', 'red'];
  protected readonly visibilities: ICategory['visibility'][] = ['private', 'shared'];

  private readonly model = signal<CategoryFormModel>({ ...DEFAULT_MODEL });
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly form = form(this.model, (f) => {
    required(f.name);
    // Fixed after creation: the type decides what past payments did to balances.
    disabled(f.type, () => this.category() !== undefined);
    disabled(f.visibility, () => this.category() !== undefined);
  });

  readonly category = input<ICategory>();
  readonly edited = output();

  constructor() {
    effect(() => {
      const data = this.category();
      this.model.set(
        data
          ? { name: data.name, type: data.type, icon: data.icon, color: data.color, visibility: data.visibility }
          : { ...DEFAULT_MODEL },
      );
    });
  }

  submit() {
    if (!this.form().valid()) return;
    this.errorMessage.set(null);

    const value = this.form().value();
    const categoryId = this.category()?.id;
    const request$ =
      categoryId
        ? this.categoryRepository.updateCategory({ ...value, id: categoryId })
        : this.categoryRepository.createCategory(value);

    request$.subscribe({
      next: () => this.edited.emit(),
      error: (err: Error) => this.errorMessage.set(err.message),
    });
  }
}
