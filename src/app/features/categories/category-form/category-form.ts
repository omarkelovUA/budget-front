import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { disabled, form, FormField, required } from '@angular/forms/signals';
import { ICategory } from '../../../model/types';
import { CategoryRepository } from '../data/category-repository';

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
  imports: [FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-form.html',
  styleUrl: './category-form.css',
})
export class CategoryForm {
  private readonly categoryRepository = inject(CategoryRepository);

  protected readonly types: ICategory['type'][] = ['income', 'expense'];
  protected readonly icons = ['wallet', 'food', 'card'];
  protected readonly colors = ['green', 'yellow', 'blue', 'red'];
  protected readonly visibilities: ICategory['visibility'][] = ['private', 'shared'];

  private readonly model = signal<CategoryFormModel>({ ...DEFAULT_MODEL });
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

    const value = this.form().value();
    const categoryId = this.category()?.id;
    const request$ =
      categoryId
        ? this.categoryRepository.updateCategory({ ...value, id: categoryId })
        : this.categoryRepository.createCategory(value);

    request$.subscribe({
      next: () => this.edited.emit(),
      error: (err) => console.error('Save failed:', err),
    });
  }
}
